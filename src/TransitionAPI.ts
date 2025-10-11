import type { ProtonComponent } from "./Proton/ProtonComponent"


export type ViewTransitionHandler = (
  this: ProtonComponent,
  transit: () => Promise<void>,
  previous: unknown,
  next: unknown
) => unknown

export type ViewTransitionEntry = ViewTransitionHandler | ((transit: () => Promise<void>) => unknown)

export type ViewTransitionState = "idle" | "pending" | "running"

export interface ViewTransitionSnapshot {
  previous: unknown
  next: unknown
  startedAt: number
  finishedAt?: number
}

class TransitionAPI extends Set<ViewTransitionEntry> {
  state: ViewTransitionState = "idle"
  snapshot: ViewTransitionSnapshot | null = null

  /**
   * Replaces current handlers with a new iterable of handlers.
   */
  replaceWith(entries: Iterable<ViewTransitionEntry> | null | undefined) {
    this.clear()
    if (entries == null) return this

    for (const entry of entries) {
      if (typeof entry === "function") this.add(entry)
    }

    return this
  }

  /** @internal */
  markPending(previous: unknown, next: unknown) {
    if (this.size === 0) {
      this.reset()
      return
    }

    this.state = "pending"
    this.snapshot = { previous, next, startedAt: Date.now() }
  }

  /** @internal */
  markRunning(previous: unknown, next: unknown) {
    if (this.size === 0) {
      this.reset()
      return
    }

    this.state = "running"
    this.snapshot = { previous, next, startedAt: Date.now() }
  }

  /** @internal */
  markFinished() {
    if (this.snapshot != null) this.snapshot.finishedAt = Date.now()
    this.reset()
  }

  private reset() {
    this.state = "idle"
    this.snapshot = null
  }
}

export default TransitionAPI
