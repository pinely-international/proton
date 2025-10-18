import { State } from "@denshya/reactive"
import { Subscriptable } from "@/Observable" 
type ConnectionSet = Set<(connected: boolean) => void> & { connected?: boolean }

export namespace ElementLifecycle {
  export function connection(element: Element) {
    return new ElementConnection(element)
  }
}

class ElementConnection {
  private static subscriptions = new WeakMap<Element, ConnectionSet>()
  private static watch(entries: ResizeObserverEntry[] | IntersectionObserverEntry[]) {
    window.requestAnimationFrame(() => {
      for (const entry of entries) {
        const subs = ElementConnection.subscriptions.get(entry.target)!

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

  when(event: "connected" | "disconnected"): Subscriptable<void> {
    return { subscribe: next => this.state.subscribe(connected => connected === (event === "connected") && next()) }
  }

  scope(connectedCallback: (disconnectedSignal: AbortSignal) => void) {
    let abortController = new AbortController
    return this.state.subscribe(connected => {
      if (connected) {
        abortController = new AbortController
        connectedCallback(abortController.signal)
      } else {
        abortController.abort()
      }
    })
  }
}
