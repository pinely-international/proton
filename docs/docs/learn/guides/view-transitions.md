# View Transitions

`this.view.transitions` exposes a `TransitionAPI` instance – a small finite-state machine that orchestrates swaps between the current and the next view. Each entry in the set receives a `transit` callback together with the previous and the next values supplied to `this.view.set`.

At runtime you can inspect:

- `this.view.transitions.state` — `"idle" | "pending" | "running"`.
- `this.view.transitions.snapshot` — shape `{ previous, next, startedAt, finishedAt? }`.
- `this.view.transitions.replaceWith(...)` — swap the handlers in bulk.

```tsx title="Dashboard.tsx"
import { State } from "@denshya/reactive"
import { Proton } from "@denshya/proton"

const screens = [
  () => <section className="screen">Home</section>,
  () => <section className="screen">Profile</section>,
  () => <section className="screen">Settings</section>,
] satisfies Array<() => JSX.Element>

function Dashboard(this: Proton.Component) {
  const index = new State(0)

  this.view.transitions.clear()
  this.view.transitions.add(async (transit, previous, next) => {
    const previousElement = this.inflator.inflate(previous) as HTMLElement
    previousElement.style.filter = "grayscale(100%)"

    await Promise.resolve()

    const nextElement = this.inflator.inflate(next) as HTMLElement
    nextElement.style.opacity = "0"

    await transit()

    nextElement.style.transition = "opacity 160ms ease"
    requestAnimationFrame(() => { nextElement.style.opacity = "1" })
  })

  if ("startViewTransition" in document) {
    this.view.transitions.add(document.startViewTransition)
  }

  this.view.set(screens[index.get()]())

  return (
    <main className="dashboard">
      <nav className="dashboard__actions">
        <button type="button" onClick={() => index.set((index.get() + 1) % screens.length)}>
          Next screen
        </button>
      </nav>
      <div className="dashboard__stage">{this.view.current}</div>
    </main>
  )
}

export default Dashboard
```

## Lifecycle

- When `this.view.set` is called with a different value, the transitions state moves to **pending**. You can read `this.view.transitions.state` or `snapshot` to inspect what is being swapped.
- The queue enters the **running** state before the first transition handler executes.
- The previous view remains active until every handler has either called `await transit()` or finished execution. Proton always calls the callback at the end of the handler to avoid deadlocks, so you can safely perform clean-ups without worrying about breaking the queue.
- After the swap concludes, Proton resets the state back to **idle**.

## Working with the View Transition API

The [document.startViewTransition](https://developer.mozilla.org/docs/Web/API/Document/startViewTransition) API can be registered as yet another handler:

```ts
if ("startViewTransition" in document) {
  this.view.transitions.add(document.startViewTransition)
}
```

> Proton invokes `document.startViewTransition` with `document` as the context, so you can pass the method reference without manually binding it.

The returned `ViewTransition` promises (`ready`, `finished`, `updateCallbackDone`, `committed` and `done`) are awaited before the queue settles. This allows the transition to finish fully before Proton exposes the next view.

## Bulk updates

`this.view.transitions` is a `Set`. If you need to replace the whole collection you can do so via:

```ts
this.view.transitions = new Set([
  customTransition,
  document.startViewTransition,
])
```

Calling `this.view.set(value)` keeps the previous behaviour but now runs transitions in the background, so existing code keeps working without changes. You can also assign a brand new collection directly, as shown above.

## Demo

Start from the [Proton Elements template](https://stackblitz.com/edit/proton-elements-range) and add a `src/app/ViewTransitionsDemo.tsx` file that exports the `Dashboard` example above. Point the router to this component (e.g. render it inside `App.tsx`) to try the transition queue in the browser. The template already ships with the necessary styles and bundler configuration, so you only need to paste the component and hit the **Run** button.
