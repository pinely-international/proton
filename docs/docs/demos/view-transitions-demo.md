---
title: View Transition Playground
sidebar_position: 5
---

Use the [Proton Elements StackBlitz template](https://stackblitz.com/edit/proton-elements-range?file=src%2FApp.tsx&view=editor) to try the transition queue without cloning the repository.

1. Open the linked template and replace the contents of `src/App.tsx` with the snippet below.
2. Save the file. StackBlitz will hot-reload and run the transition handlers in the browser.
3. Tweak the animation timings or add more handlers to see how Proton keeps the previous view alive until all of them resolve.

```tsx title="src/App.tsx"
import { Proton } from "@denshya/proton"
import "./style.css"

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function App(this: Proton.Component) {
  this.view.transitions = [
    async (transit, previous, next) => {
      const previousEl = this.inflator.inflate(previous) as HTMLElement
      previousEl.dataset.state = "leaving"

      await delay(140)

      const nextEl = this.inflator.inflate(next) as HTMLElement
      nextEl.dataset.state = "entering"

      await transit()

      requestAnimationFrame(() => {
        nextEl.dataset.state = "active"
      })
    },
    document.startViewTransition?.bind(document) as any,
  ]

  const screens = ["Dashboard", "Billing", "Settings"]
  let index = 0

  if (this.view.current == null) {
    this.view.set(<section className="screen">{screens[index]}</section>)
  }

  return (
    <main className="app">
      <header>
        <h1>Proton View Transitions</h1>
        <button
          type="button"
          onClick={() => {
            index = (index + 1) % screens.length
            this.view.setAsync(<section className="screen">{screens[index]}</section>)
          }}
        >
          Next screen
        </button>
      </header>
      <div className="stage">{this.view.current}</div>
    </main>
  )
}

export default App
```

```css title="src/style.css"
:root {
  color-scheme: dark;
  font-family: system-ui, sans-serif;
  background: radial-gradient(circle at top, #243b55 0%, #141e30 100%);
}

.app {
  min-height: 100vh;
  padding: 4rem;
  display: grid;
  gap: 3rem;
}

.stage {
  position: relative;
  height: 320px;
  border-radius: 30px;
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.3);
}

.screen {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: transform 160ms ease, opacity 160ms ease;
}

.screen[data-state="active"] {
  opacity: 1;
  transform: translateX(0);
}

.screen[data-state="leaving"] {
  opacity: 0;
  transform: translateX(-12%);
}

.screen[data-state="entering"] {
  opacity: 0;
  transform: translateX(12%);
}
```

> Tip: You can mix and match multiple handlers. Proton keeps running them in sequence and only resolves `setAsync` when every handler finishes.
