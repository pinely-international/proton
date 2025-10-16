import { EventSignal } from "@denshya/reactive"

import { AsyncGeneratorPrototype } from "./BuiltinObjects"
import { Life } from "./Life"
import TransitionAPI, { type ViewTransitionEntry } from "./TransitionAPI"

interface TemplateInfo {
  template: Node
  dynamicZones: Map<string, Node[]>
  eventBindings: Map<Node, Map<string, EventListenerOrEventListenerObject[]>>
  isStale: boolean
}
import type { ProtonComponent } from "./Proton/ProtonComponent"

class ViewAPI extends EventSignal<unknown> {
  readonly life = new Life

  declare default: unknown
  private templateCache: TemplateInfo | null = null
  private templateEnabled = true

  private component?: ProtonComponent
  private readonly transitionsApi = new TransitionAPI
  private transitionQueue: Promise<void> = Promise.resolve()
  private hasCommitted = false

  constructor() {
    super(null)
  }

  get transitions(): TransitionAPI {
    return this.transitionsApi
  }
  set transitions(entries: TransitionAPI | Iterable<ViewTransitionEntry> | null | undefined) {
    if (entries instanceof TransitionAPI) {
      this.transitionsApi.replaceWith(entries)
      return
    }

    this.transitionsApi.replaceWith(entries)
  }

  attach(component: ProtonComponent) {
    this.component = component
  }

  async setIterable(iterable: Iterator<unknown> | AsyncIterator<unknown>) {
    let yieldResult: IteratorResult<unknown> = { done: false, value: undefined }
    while (yieldResult.done === false) {
      yieldResult = await iterable.next()
      await this.scheduleTransition(yieldResult.value)
    }
  }

  set(value: unknown) {
    void this.scheduleTransition(value)
  }

  /** @internal */
  async initWith(returnResult: unknown) {
    if (returnResult == null) return
    if (returnResult.constructor === AsyncGeneratorPrototype) {
      await this.setIterable(returnResult as any)

      if (this.current != null) {
        // Only assign default if generator was explicitly returned.
        this.default ??= this.current
      }

      return
    }

    if (returnResult instanceof Promise) returnResult = await returnResult

    this.default = returnResult
    await this.scheduleTransition(this.default)
  }

  private commit(value: unknown) {
    super.set(value)
    this.hasCommitted = true
  }

  private scheduleTransition(next: unknown): Promise<void> {
    if (this.hasCommitted === false) {
      this.commit(next)
      return Promise.resolve()
    }

    const previous = this.current
    if (Object.is(previous, next)) return Promise.resolve()

    this.transitionsApi.markPending(previous, next)

    const job = async () => {
      try {
        await this.applyTransitions(previous, next)
      } catch (error) {
        console.error("View transition failed", error)
        this.commit(next)
      }
    }

    const scheduled = this.transitionQueue.then(job, job)
    this.transitionQueue = scheduled.catch(() => undefined)
    return scheduled.then(() => undefined)
  }

  private async applyTransitions(previous: unknown, next: unknown) {
    if (this.transitionsApi.size === 0) {
      this.commit(next)
      return
    }

    this.transitionsApi.markRunning(previous, next)

    const transitions = Array.from(this.transitionsApi)
    let pipeline = async () => { this.commit(next) }

    for (let i = transitions.length - 1; i >= 0; i -= 1) {
      const nextStage = pipeline
      const transition = transitions[i]

      pipeline = async () => {
        await this.executeTransition(transition, previous, next, nextStage)
      }
    }

    try {
      await pipeline()
    } finally {
      this.transitionsApi.markFinished()
    }
  }

  private async executeTransition(
    transition: ViewTransitionEntry,
    previous: unknown,
    next: unknown,
    nextStage: () => Promise<void>
  ) {
    let advanced = false
    const transit = async () => {
      if (advanced) return
      advanced = true
      await nextStage()
    }

    try {
      const context = this.resolveTransitionContext(transition)
      const callable = transition as unknown as (this: unknown, transit: () => Promise<void>, previous: unknown, next: unknown) => unknown
      const result = callable.call(context, transit, previous, next)
      await this.awaitTransitionResult(result)
    } catch (error) {
      console.error("View transition handler failed", error)
    } finally {
      await transit()
    }
  }

  private async awaitTransitionResult(result: unknown) {
    if (result == null) return

    if (result instanceof Promise) {
      await result
      return
    }

    if (typeof result === "object") {
      const awaiting = ["finished", "ready", "updateCallbackDone", "committed", "done"]
        .map(property => (result as Record<string, unknown>)[property])
        .filter((value): value is Promise<unknown> => value instanceof Promise)

      if (awaiting.length > 0) await Promise.allSettled(awaiting)
    }
  }

  private resolveTransitionContext(transition: ViewTransitionEntry) {
    if (typeof document !== "undefined" && document?.startViewTransition != null && transition === document.startViewTransition) {
      return document
    }

    return this.component ?? this
  }


  /**
   * Check if template is available and not stale
   */
  hasValidTemplate(): boolean {
    return this.templateCache !== null && !this.templateCache.isStale
  }

  /**
   * Get the cached template if available
   */
  getTemplate(): TemplateInfo | null {
    return this.templateCache
  }

  /**
   * Set a new template with dynamic zones and event bindings
   */
  setTemplate(template: Node, dynamicZones: Map<string, Node[]> = new Map(), eventBindings: Map<Node, Map<string, EventListenerOrEventListenerObject[]>> = new Map()) {
    this.templateCache = {
      template: template.cloneNode(true) as Node, // Deep clone for safety
      dynamicZones: new Map(dynamicZones),
      eventBindings: new Map(eventBindings),
      isStale: false
    }
  }


  /**
   * Clear the template cache
   */
  clearTemplate() {
    this.templateCache = null
  }

  /**
   * Clone the template for hydration
   */
  cloneTemplate(): { node: Node, dynamicZones: Map<string, Node[]>, eventBindings: Map<Node, Map<string, EventListenerOrEventListenerObject[]>> } | null {
    if (!this.templateCache) return null

    const clonedNode = this.templateCache.template.cloneNode(true) as Node
    
    // For now, return empty maps - the TemplateHydrator will find dynamic zones fresh
    // This simplifies the complex node matching logic
    return {
      node: clonedNode,
      dynamicZones: new Map(),
      eventBindings: new Map()
    }
  }

}

export default ViewAPI
