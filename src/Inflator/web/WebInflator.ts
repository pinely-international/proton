import { State } from "@denshya/reactive"
import { Group } from "node-group"
import { Primitive } from "type-fest"

import { AccessorGet } from "@/Accessor"
import { AsyncFunction, AsyncGeneratorFunction } from "@/BuiltinObjects"
import { InsertionGroup } from "@/InsertionGroup"
import { CustomAttributesMap, JSXAttributeSetup } from "@/jsx/JSXCustomizationAPI"
import { MountGuard } from "@/MountGuard"
import Observable from "@/Observable"
import { ProtonComponent } from "@/Proton/ProtonComponent"
import { isIterable, isJSX, isObservableGetter, isPrimitive, isRecord } from "@/utils/testers"
import WebNodeBinding from "@/utils/WebNodeBinding"

import { NAMESPACE_MATH, NAMESPACE_SVG } from "./consts"
import { iterableOf, onDemandRef } from "./helpers"

import Inflator from "../Inflator"

type Subscriptable<T> = { subscribe(callback: (value: T) => void): unknown }

type ConnectionSet = Set<(connected: boolean) => void> & { connected?: boolean }

namespace ElementLifecycle {
  export function connection(element: Element) {
    return new ElementConnection(element)
  }
}

class ElementConnection {
  private static subscriptions = new WeakMap<Element, ConnectionSet>()
  private static watch(entries: ResizeObserverEntry[] | IntersectionObserverEntry[]) {
    window.requestAnimationFrame(() => {
      for (const entry of entries) {
        const subs = ElementConnection.subscriptions.get(entry.target)
        if (!subs) continue;

        const connected = entry.target.isConnected

        if (subs.connected === connected) continue
        subs.connected = connected

        for (const callback of subs) callback(connected)
      }
    })
  }

  private static resizeObserver = new ResizeObserver(ElementConnection.watch)
  private static intersectionObserver = new IntersectionObserver(ElementConnection.watch)

  readonly state = new State(false)

  constructor(private readonly element: Element) {
    let subs = ElementConnection.subscriptions.get(this.element)
    if (subs == null) {
      subs = new Set
      ElementConnection.subscriptions.set(this.element, subs)

      ElementConnection.resizeObserver.observe(this.element)
      ElementConnection.intersectionObserver.observe(this.element)
    }

    subs.add(x => this.state.set(x))
  }
}

type WebInflateResult<T> =
  T extends Node ? T :
  T extends JSX.Element ? Element :
  T extends Observable<unknown> ? Text :
  T extends (undefined | null) ? T :
  T extends Primitive ? Text :
  T extends any[] ? DocumentFragment :
  Node


interface WebInflatorFlags {
  debug: boolean
  skipAsync: boolean
  disableJSXCache: boolean
}

class WebInflator extends Inflator {
  private static jsxCache = new WeakMap<object, Node>

  flags: WebInflatorFlags = {
    debug: false,
    skipAsync: false,
    disableJSXCache: false,
  }
  /**
   * Custom JSX attributes.
   * Adds or Overrides JSX attribute to provide new behavior.
   * These attributes are virtual and won't be presented in the element.
   * */
  jsxAttributes: CustomAttributesMap = new Map<string, JSXAttributeSetup<any>>()

  protected clone() {
    const clone = new WebInflator
    clone.flags = { ...this.flags }
    clone.jsxAttributes = new Map(this.jsxAttributes)
    return clone
  }

  public inflate<T>(subject: T): WebInflateResult<T> {
    if (subject instanceof Node) return subject as never
    if (isJSX(subject)) return this.inflateJSXDeeply(subject) as never

    return super.inflate(subject) as never
  }
  protected inflatePrimitive(primitive: unknown): Text {
    return document.createTextNode(primitive as string)
  }

  protected inflateFragment() {
    return new Group
  }

  public inflateJSX(jsx: JSX.Element): Node {
    // Alternatives checks.
    switch (typeof jsx.type) {
      case "string": return this.inflateIntrinsic(jsx.type, jsx.props)
      case "function": return this.inflateComponent(jsx.type, jsx.props)
      case "symbol": return this.inflateFragment()
      default: break
    }

    throw new TypeError("Unsupported type of `jsx`", { cause: { jsx } })
  }

  protected inflateObservable<T>(observable: Observable<T> & Partial<AccessorGet<T>>) {
    const value = observable.get?.()

    switch (typeof value) {
      case "object": {
        if (value instanceof Node) return value

        if (isIterable(value)) return this.inflateIterable(observable as never)
        if (isJSX(value)) return this.inflateObservableJSX(observable as never)

        throw new TypeError("Can't choose right way to inflate observable of this type: " + value)
      }
      default:
        return this.inflateObservableText(observable)
    }
  }

  protected inflateObservableText<T>(observable: Observable<T> & Partial<AccessorGet<T>>) {
    const value = observable.get?.()
    const textNode = document.createTextNode(value as string)

    observable.subscribe(value => textNode.nodeValue = (observable.get?.() ?? value) as string)

    return textNode
  }

  protected inflateObservableJSX<T extends JSX.Element>(observable: Observable<T> & Partial<AccessorGet<T>>) {
    const placeholder = onDemandRef(() => new Comment("ObservableJSX/" + observable.constructor.name))

    const value = observable.get!()
    let element = this.inflateJSXDeeply(value) as Partial<ChildNode>

    observable.subscribe?.(value => {
      const next = this.inflate(value) ?? placeholder.current

      element.replaceWith?.(next)
      element = next
    })
    return element
  }

  protected inflateIterable<T, P extends ParentNode = InsertionGroup>(iterable: (IteratorObject<T> & Partial<Observable<IteratorObject<T>>>), parent: P = new InsertionGroup as never): P {
    const replace = (otherIterable: IteratorObject<T> & Partial<Observable<IteratorObject<T>>>) => {
      parent.replaceChildren(...this.__inflateIterable__(otherIterable)) // Previous nodes will be lost at this point.
    }

    replace(iterableOf(iterable))
    iterable.subscribe?.(replace)

    return parent
  }
  protected inflateAsyncIterable<T>(asyncIterable: AsyncIteratorObject<T>): unknown {
    throw new TypeError("Async Iterator is not supported", { cause: { asyncIterable } })
  }

  private inflateJSXDeeply(jsx: JSX.Element): Element | DocumentFragment | Node {
    let inflated

    if (this.flags.disableJSXCache) {
      inflated = this.inflateJSX(jsx)
    } else {
      const inflatedCached = WebInflator.jsxCache.get(jsx)
      if (inflatedCached != null) return inflatedCached

      inflated = this.inflateJSX(jsx)
      WebInflator.jsxCache.set(jsx, inflated)
    }
    // Inflation of Component children is handled by the component itself.
    if (typeof jsx.type === "function") return inflated

    this.inflateJSXChildren(jsx, inflated)

    return inflated
  }

  private inflateJSXChildren(jsx: JSX.Element, parent: Node): void {
    if (jsx.props?.children == null) return

    // @ts-expect-error 123
    const actualParent = parent.nodeType === Node.COMMENT_NODE ? parent.inflated : parent

    try {
      if (isIterable(jsx.props.children)) {
        this.inflateIterable(jsx.props.children, actualParent)
      } else if (isObservableGetter(jsx.props.children) || isPrimitive(jsx.props.children)) {
        WebInflator.subscribeProperty("textContent", jsx.props.children, actualParent)
      } else {
        actualParent.appendChild(this.inflate(jsx.props.children))
      }
    } catch (error) {
      console.trace(error, "inflateJSXChildren")
      throw error
    }
  }

  private inflateElement(type: string, options?: { namespace?: string, is?: string }) {
    if (options?.namespace != null) return document.createElementNS(options.namespace, type, options)

    if (NAMESPACE_SVG.has(type)) return document.createElementNS("http://www.w3.org/2000/svg", type, options)
    if (NAMESPACE_MATH.has(type)) return document.createElementNS("http://www.w3.org/1998/Math/MathML", type, options)

    return document.createElement(type, options)
  }

  /**
   * Creates element and binds properties.
   */
  public inflateIntrinsic(type: string, props?: Record<string, any>): Element | Comment {
    const inflated = this.inflateElement(type, props?.ns)
    if (props == null) return inflated

    const overridden = this.bindCustomProperties(props, inflated)
    const properties = this.bindProperties(props, inflated, overridden)

    const mountGuard = new MountGuard(inflated)
    for (const { key, value } of properties) {
      mountGuard.for(key, value)
    }
    if (mountGuard.immediate) {
      // @ts-expect-error 123
      mountGuard.placeholder.current.inflated = inflated
      return mountGuard.placeholder.current
    }

    return inflated
  }

  public inflateComponent(factory: Function, props?: any) {
    if (this.flags.skipAsync) {
      if (factory instanceof AsyncFunction.constructor) return null
      if (factory instanceof AsyncGeneratorFunction.constructor) return null
    }
    // If arrow function, simplify inflation.
    if (factory.prototype == null && factory instanceof AsyncFunction.constructor === false) {
      return this.inflate(factory(props))
    }

    const component = new ProtonComponent(this, this.component)
    const componentGroup = new InsertionGroup

    try {
      component.view.initWith(factory.call(component, props))
    } catch (thrown) {
      component.tree.caught(thrown)
      console.error(thrown)
      return componentGroup
    }


    const currentView = component.inflator.inflate(component.view.current) as ChildNode | null
    replace(currentView)

    function replace(view: unknown | null) {
      if (view == null) componentGroup.replaceChildren()
      if (view instanceof Node) componentGroup.replaceChildren(view)
    }


    let lastAnimationFrame = -1
    component.view.subscribe(view => {
      view = component.inflator.inflate(view)

      if (component.view.transitions.state === "running") {
        replace(view)
        return
      }

      cancelAnimationFrame(lastAnimationFrame)
      lastAnimationFrame = requestAnimationFrame(() => replace(view))
    })

    return componentGroup
  }

  protected bindStyle(style: unknown, element: ElementCSSInlineStyle) {
    if (isRecord(style)) {
      for (const property in style) {
        if (property.startsWith("--")) {
          WebInflator.subscribe(style[property], value => element.style.setProperty(property, value as string))
          continue
        }

        WebInflator.subscribeProperty(property, style[property], element.style)
      }

      return
    }

    WebInflator.subscribe(style, value => element.style.cssText = value as string)
  }

  protected bindEventListeners(listeners: unknown, element: Element) {
    for (const [event, handler] of WebInflator.iterateEventBindings(listeners)) {
      element.addEventListener(event, handler)
    }
  }

  private static *iterateEventBindings(source: unknown): Iterable<[string, EventListenerOrEventListenerObject]> {
    if (source == null) return

    if (Array.isArray(source)) {
      for (const entry of source) {
        yield* WebInflator.iterateEventBindings(entry)
      }
      return
    }

    if (isRecord(source) === false) return

    for (const key in source) {
      yield* WebInflator.iterateEventBindingValue(key, (source as Record<string, unknown>)[key])
    }
  }

  private static *iterateEventBindingValue(event: string, value: unknown): Iterable<[string, EventListenerOrEventListenerObject]> {
    if (value == null) return

    if (Array.isArray(value)) {
      for (const entry of value) {
        yield* WebInflator.iterateEventBindingValue(event, entry)
      }
      return
    }

    if (WebInflator.isEventListener(value)) {
      yield [event, value]
    }
  }

  private static isEventListener(value: unknown): value is EventListenerOrEventListenerObject {
    if (typeof value === "function") return true

    if (value instanceof Object && "handleEvent" in value && typeof (value as EventListenerObject).handleEvent === "function") {
      return true
    }

    return false
  }

  protected *bindProperties(props: object, inflated: Element, overridden: Set<string>) {
    try {
      let value
      for (const key in props) {
        value = props[key as never]

        yield { key, value }

        if (key === "children") continue
        if (overridden.has(key)) continue

        if (inflated instanceof SVGElement || key.includes("-")) {
          WebInflator.subscribeAttribute(inflated, key, value)
        } else {
          WebInflator.subscribeProperty(key, value, inflated)
        }
      }
    } catch (error) {
      console.error("Element props binding failed -> ", error)
    }
  }

  /** @returns property names that were overridden. */
  protected bindCustomProperties(props: any, element: Element): Set<string> {
    const overrides = new Set<string>()

    if (isRecord(props.on) || Array.isArray(props.on)) {
      this.bindEventListeners(props.on, element)
      overrides.add("on")
    }

    if (element instanceof HTMLElement && "style" in props) {
      this.bindStyle(props.style, element)
      overrides.add("style")
    }

    if ("aria" in props) {
      for (const key in props.aria) {
        WebInflator.subscribeProperty(key, props.aria[key], element)
      }
      overrides.add("aria")
    }

    if (element instanceof HTMLInputElement) {
      // Ensures correct type beforehand.
      WebInflator.subscribeProperty("type", props.type, element)

      WebNodeBinding.dualSignalBind(element, "valueAsDate", props.valueAsDate, "input")
      WebNodeBinding.dualSignalBind(element, "valueAsNumber", props.valueAsNumber, "input")

      overrides.add("type").add("valueAsDate").add("valueAsNumber")
    }
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      WebNodeBinding.dualSignalBind(element, "value", props.value, "input")
      overrides.add("value")
    }
    if (element instanceof HTMLSelectElement) {
      WebNodeBinding.dualSignalBind(element, "value", props.value, "change")
      overrides.add("value")
    }


    if (this.jsxAttributes.size > 0) {
      function bind(key: string, value: unknown) {
        WebInflator.subscribeProperty(key, value, element)
        overrides.add(key)
      }

      for (const [key, attributeSetup] of this.jsxAttributes) {
        if (key in props === false) continue

        attributeSetup({ props, key, value: props[key], bind })
        overrides.add(key)
      }
    }

    return overrides
  }

  /**
   * Binds a property.
   */
  static subscribeProperty(key: keyof never, source: unknown, target: unknown): void {
    WebInflator.subscribe(source, value => (target as any)[key] = value)
  }

  /**
   * Binds an attribute.
   */
  static subscribeAttribute(target: Element, key: string, value: unknown): void {
    WebInflator.subscribe(value, value => {
      if (value != null) {
        target.setAttribute(key, value as string)
      } else {
        target.removeAttribute(key)
      }
    })
  }

  /** @internal */
  protected static subscribe(source: unknown, targetBindCallback: (value: unknown) => void): void {
    if (source == null) return
    return void State.subscribeImmediate(source, targetBindCallback)
  }

  private *__inflateIterable__(iterable: Iterable<unknown>) {
    for (const next of iterable) {
      if (next == null) continue
      yield this.inflate(next)
    }
  }
}

export default WebInflator
