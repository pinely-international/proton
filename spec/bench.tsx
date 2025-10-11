import "./dom"

import { barplot, bench, group, run } from "mitata"
import { State, StateArray } from "@denshya/reactive"
import TreeContextAPI from "@/TreeContextAPI"
import { WebInflator } from "../build"

const inflator = new WebInflator

group("Inflation", () => {
  bench("Inflate 1,000 elements with attribute", () => {
    for (let i = 0; i < 1_000; i++) {
      inflator.inflate(<div className="x" />)
    }
  })

  bench("Inflate nested JSX trees 1,000x", () => {
    for (let i = 0; i < 1_000; i++) {
      inflator.inflate(
        <div>
          <section>
            <article>
              <span>Hello</span>
            </article>
          </section>
        </div>
      )
    }
  })

  bench("Handle 1,000 reactive elements", () => {
    for (let i = 0; i < 1_000; i++) {
      const s = new State("init")
      inflator.inflate(<p style={{ color: s }}>Text</p>)
      s.set("changed")
    }
  })

  const s = new State("init")
  for (let i = 0; i < 1_000; i++) {
    inflator.inflate(<p style={{ color: s }}>Text</p>)
  }
  bench("Handle a reactive update for 1,000 elements", () => s.set("changed"))

  bench("Toggle 500 mounted spans", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const m = new State(true)

    const nodes = []
    for (let i = 0; i < 500; i++) {
      const el = inflator.inflate(<span mounted={m}>X</span>)
      nodes.push(el)
      root.append(el as Node)
    }

    m.set(false)
    m.set(true)
  })


  barplot(() => {
    const state = new State("init")

    bench("Inflate element without attribute", () => inflator.inflate(<div />)).gc("inner")
    bench("Inflate element with attribute", () => inflator.inflate(<div className="x" />)).gc("inner")
    bench("Inflate element with observable attribute", () => inflator.inflate(<div className={state} />)).gc("inner")
  })

  barplot(() => {
    const text = new State("init")
    const iterableWrapped = new State([])
    const iterableInjected = new StateArray([])
    const jsx = new State(<div />)

    bench("Inflate observable text", () => inflator.inflate(text)).gc("inner")
    bench("Inflate observable iterable (Wrapped)", () => inflator.inflate(iterableWrapped)).gc("inner")
    bench("Inflate observable iterable (Injected)", () => inflator.inflate(iterableInjected)).gc("inner")
    bench("Inflate observable jsx", () => inflator.inflate(jsx)).gc("inner")
  })

  barplot(() => {
    function Component() { return <div /> }
    async function AsyncComponent() { return <div /> }

    const SimpleComponent = () => <div />
    const AsyncSimpleComponent = async () => <div />

    function* GeneratorComponent() { yield <div /> }
    async function* AsyncGeneratorComponent() { yield <div /> }

    bench("Inflate element", () => inflator.inflate(<div />))

    bench("Inflate component", () => inflator.inflate(<Component />))
    bench("Inflate component (async)", () => inflator.inflate(<AsyncComponent />))

    bench("Inflate component (arrow function)", () => inflator.inflate(<SimpleComponent />))
    bench("Inflate component (arrow function, async)", () => inflator.inflate(<AsyncSimpleComponent />))

    bench("Inflate component (generator function)", () => inflator.inflate(<GeneratorComponent />))
    bench("Inflate component (generator function, async)", () => inflator.inflate(<AsyncGeneratorComponent />))
  })

  barplot(() => {
    function Component(props: any) { return <div>{props.children}</div> }

    bench("Inflate component 1000x", () => {
      for (let i = 0; i < 1000; i++) inflator.inflate(<Component />)
    })
    bench("Inflate 1000x nested component 1x", () => {
      let nestedComponent = <Component />
      for (let i = 0; i < 1000; i++) nestedComponent.props.children = <Component />
      inflator.inflate(nestedComponent)
    })
  })
})

group("Lists", () => {
  const mountTarget = document.createElement("div")

  const rawList = Array.from({ length: 1_000 }, (_, i) => `item ${i}`)

  const iterable = rawList.values().map(item => <li>{item}</li>)
  const array = rawList.map(item => <li>{item}</li>)
  const arrayIterable = new Set(array.values())

  const arrayState = new StateArray(array)
  inflator.inflate(arrayState)

  barplot(() => {
    bench("Render list of 1,000 elements (iterable)", () => {
      const group = inflator.inflate(rawList.values().map(item => <li>{item}</li>))
      mountTarget.replaceChildren(group)
    })

    bench("Render list of 1,000 elements (array)", () => {
      const group = inflator.inflate(rawList.map(item => <li>{item}</li>))
      mountTarget.replaceChildren(group)
    })

    bench("Render list of 1,000 elements (arrayState)", () => {
      const group = inflator.inflate(new StateArray(rawList.map(item => <li>{item}</li>)))
      mountTarget.replaceChildren(group)
    })

    bench("Update single item in 1,000 list (arrayState)", () => {
      const updated = arrayState.get()
      updated[500] = <li>updated item</li>
      arrayState.set(updated)
    })
  })
})

group("TreeContext", () => {
  class TestContext { }

  const treeContextStart = new TreeContextAPI

  let treeContext = treeContextStart
  for (let i = 0; i < 10_000; i++) {
    treeContext = new TreeContextAPI(treeContext)
  }

  const treeContextEnd = new TreeContextAPI(treeContext)

  bench("Propagation speed through depth of 10,000 contexts", () => {
    if (treeContextStart.provide(new TestContext) !== treeContextEnd.require(TestContext)) {
      throw new Error("Contexts must be equal")
    }
  })
})


export { run }