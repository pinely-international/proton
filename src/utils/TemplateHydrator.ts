import { isObservableGetter } from "./testers"

interface HydrationContext {
  dynamicZones: Map<string, Node[]>
  eventBindings: Map<Node, Map<string, EventListenerOrEventListenerObject[]>>
  subscriptions: (() => void)[]
}

export class TemplateHydrator {
  private static readonly DYNAMIC_ZONE_ATTR = "data-proton-dynamic"
  private static readonly ZONE_ID_ATTR = "data-proton-zone-id"

  /**
   * Hydrate a template with new data
   */
  static hydrate(
    template: Node, 
    data: unknown, 
    context: HydrationContext
  ): Node {
    const clonedTemplate = template.cloneNode(true) as Node
    const subscriptions: (() => void)[] = []

    this.processDynamicZones(clonedTemplate, data, context, subscriptions)
    this.rebindEvents(clonedTemplate, context, subscriptions)

    context.subscriptions.push(...subscriptions)
    return clonedTemplate
  }

  /**
   * Mark a node as a dynamic zone for template optimization
   */
  static markDynamicZone(node: Node, zoneId: string): void {
    if (node instanceof Element) {
      node.setAttribute(this.DYNAMIC_ZONE_ATTR, "true")
      node.setAttribute(this.ZONE_ID_ATTR, zoneId)
    }
  }

  /**
   * Find all dynamic zones in a template
   */
  static findDynamicZones(template: Node): Map<string, Node[]> {
    const zones = new Map<string, Node[]>()
    
    const walker = document.createTreeWalker(
      template,
      NodeFilter.SHOW_ELEMENT,
      null
    )

    let node = walker.nextNode()
    while (node) {
      if (node instanceof Element && node.hasAttribute(this.DYNAMIC_ZONE_ATTR)) {
        const zoneId = node.getAttribute(this.ZONE_ID_ATTR) || "default"
        if (!zones.has(zoneId)) {
          zones.set(zoneId, [])
        }
        zones.get(zoneId)!.push(node)
      }
      node = walker.nextNode()
    }

    return zones
  }

  /**
   * Extract event bindings from a template
   */
  static extractEventBindings(): Map<Node, Map<string, EventListenerOrEventListenerObject[]>> {
    // Event bindings are supplied from the caller (built on the cloned tree).
    // For now, this function returns an empty map as we do not extract
    // listeners from DOM nodes.
    return new Map<Node, Map<string, EventListenerOrEventListenerObject[]>>()
  }

  /**
   * Process dynamic zones with new data
   */
  private static processDynamicZones(
    template: Node,
    data: unknown,
    context: HydrationContext,
    subscriptions: (() => void)[]
  ): void {
    for (const [, nodes] of context.dynamicZones) {
      for (const node of nodes) {
        this.hydrateNode(node, data, subscriptions)
      }
    }
  }

  /**
   * Hydrate a specific node with data
   */
  private static hydrateNode(
    node: Node,
    data: unknown,
    subscriptions: (() => void)[]
  ): void {
    if (node instanceof Text) {
      this.hydrateTextNode(node, data, subscriptions)
    } else if (node instanceof Element) {
      this.hydrateElement(node, data, subscriptions)
    }
  }

  /**
   * Hydrate text content
   */
  private static hydrateTextNode(
    node: Text,
    data: unknown,
    subscriptions: (() => void)[]
  ): void {
    if (isObservableGetter(data)) {
      node.textContent = String(data.get?.())
      const unsubscribe = data.subscribe?.((value: unknown) => {
        node.textContent = String(value)
      })
      if (unsubscribe) subscriptions.push(() => {
        if (typeof unsubscribe === "function") {
          (unsubscribe as () => void)()
        }
      })
    } else {
      node.textContent = String(data)
    }
  }

  /**
   * Hydrate element attributes and properties
   */
  private static hydrateElement(
    element: Element,
    data: unknown,
    subscriptions: (() => void)[]
  ): void {
    if (typeof data === "object" && data !== null) {
      const dataObj = data as Record<string, unknown>
      
      for (const [key, value] of Object.entries(dataObj)) {
        if (key === "children") continue
        
        if (isObservableGetter(value)) {
          this.bindObservableProperty(element, key, value, subscriptions)
        } else {
          this.setStaticProperty(element, key, value)
        }
      }
    }
  }

  /**
   * Bind an observable property to an element
   */
  private static bindObservableProperty(
    element: Element,
    key: string,
    observable: any,
    subscriptions: (() => void)[]
  ): void {
    const currentValue = observable.get?.()

    const pushUnsubscribe = (unsubscribe: unknown) => {
      if (unsubscribe) subscriptions.push(() => {
        if (typeof unsubscribe === "function") {
          (unsubscribe as () => void)()
        }
      })
    }

    if (key === "textContent") {
      element.textContent = String(currentValue)
      const unsub = observable.subscribe?.((value: unknown) => {
        element.textContent = String(value)
      })
      pushUnsubscribe(unsub)
      return
    }

    if (key === "className" || key === "class") {
      ;(element as HTMLElement).className = String(currentValue)
      const unsub = observable.subscribe?.((value: unknown) => {
        ;(element as HTMLElement).className = String(value)
      })
      pushUnsubscribe(unsub)
      return
    }

    if (key.startsWith("data-") || key.includes("-")) {
      element.setAttribute(key, String(currentValue))
      const unsub = observable.subscribe?.((value: unknown) => {
        element.setAttribute(key, String(value))
      })
      pushUnsubscribe(unsub)
      return
    }

    ;(element as any)[key] = currentValue
    const unsub = observable.subscribe?.((value: unknown) => {
      (element as any)[key] = value
    })
    pushUnsubscribe(unsub)
  }

  /**
   * Set a static property on an element
   */
  private static setStaticProperty(element: Element, key: string, value: unknown): void {
    if (key === "textContent") {
      element.textContent = String(value)
    } else if (key === "className" || key === "class") {
      element.className = String(value)
    } else if (key.startsWith("data-") || key.includes("-")) {
      element.setAttribute(key, String(value))
    } else {
      (element as any)[key] = value
    }
  }

  /**
   * Rebind events on hydrated template
   */
  private static rebindEvents(
    template: Node,
    context: HydrationContext,
    subscriptions: (() => void)[]
  ): void {
    // Event bindings map keys are expected to be nodes from the cloned tree.
    for (const [node, eventMap] of context.eventBindings) {
      if (node instanceof Element) {
        for (const [eventType, listeners] of eventMap) {
          for (const listener of listeners) {
            node.addEventListener(eventType, listener)
            subscriptions.push(() => {
              node.removeEventListener(eventType, listener)
            })
          }
        }
      }
    }
  }

  /**
   * Clean up subscriptions
   */
  static cleanup(subscriptions: (() => void)[]): void {
    for (const unsubscribe of subscriptions) {
      unsubscribe()
    }
    subscriptions.length = 0
  }
}