import { Subscriptable, Unsubscribe } from "@/Observable";

export class Life {
  public alive = false;
  private controller!: AbortController;

  private onEnterSubscribers = new Set<() => void>();
  private onExitSubscribers = new Set<() => void>();

  /** @internal */
  public enter(): void {
    if (this.alive) return;
    this.alive = true;
    this.controller = new AbortController();

    for (const callback of this.onEnterSubscribers) {
      callback();
    }
  }

  /** @internal */
  public exit(): void {
    if (!this.alive) return;
    this.alive = false;
    this.controller.abort();

    for (const callback of this.onExitSubscribers) {
      callback();
    }
  }

  public scoped(setup: (signal: AbortSignal) => void): void {
    if (!this.alive) return;
    try {
      setup(this.controller.signal);
    } catch (error) {
      console.error("Error executing a scoped lifecycle function:", error);
    }
  }

  /**
   * Subscribes to lifecycle events.
   * @param event The event to listen for ("enter" or "exit")
   */
  public when(event: "enter" | "exit"): Subscriptable<void> {
    const subscribers = event === "enter"
      ? this.onEnterSubscribers
      : this.onExitSubscribers;

    return {
      subscribe: (callback: () => void): Unsubscribe => {
        subscribers.add(callback);
        return {
          unsubscribe: () => {
            subscribers.delete(callback);
          },
        };
      },
    };
  }

  /**
   * Adopts a piece of logic and automatically manages its lifecycle.
   * This can be an object with onEnter/onExit methods, or a startup function.
   * @param logic The logic to adopt.
   */
  public adopt(logic: {
    onEnter?: () => void;
    onExit?: () => void;
    startup?: (signal: AbortSignal) => void;
  }): void {
    if (logic.onEnter) {
      this.when("enter").subscribe(logic.onEnter);
    }
    if (logic.onExit) {
      this.when("exit").subscribe(logic.onExit);
    }
    if (logic.startup) {
      this.when("enter").subscribe(() => {
        this.scoped(logic.startup!); 
      });
    }
  }
}
