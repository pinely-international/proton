<h1 align="center">🐈‍⬛ Tama - Reactive UI Composition</h1>
<h3 align="center">😱 ~5kb gzip, DOM-first, Rootless, Class-based internals, No build</h3>
<h4 align="center">Full TypeScript Support, Based on the <a href="https://dev.to/framemuse/no-framework-principle-arised-2n39">No Framework Principle</a></h4>

<p align="center">
  <a href="https://www.npmjs.com/package/@denshya/proton">
    <img src="https://img.shields.io/npm/v/@denshya/proton?color=007ec6" />
    <img alt="npm package minimized gzipped size" src="https://img.shields.io/bundlejs/size/@denshya/proton">
  </a>
  <a href="http://commitizen.github.io/cz-cli/"><img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen friendly" /></a>
</p>

## Install

```bash
bun i @denshya/proton
```

[Quick Demos](https://stackblitz.com/@FrameMuse/collections/proton)

## What is "Rootless"?

It means you don't have to hijack an element to render the App, it cancels the Root Component and Host element completely.

That is a novel wording, another good phrase is "Reversed Element Factory Ownership."
These all stand for a component (or element) factory function producing/providing ownership to owned elements rather than being a side-effect function,
which only modifies a given element.

From querying the element and modifying it:
```js
const element = document.getElementById("id")
makeWidget(element)

function makeWidget(element) {
  element.style = "..."
  // ... Some other styling and structure
}
```

To creating the desired element and sharing ownership:
```js
function createWidget() { // returns an element instead.
  const element = document.createElement("div")
  element.style = "..."
  // ... Some other styling and structure

  return element
}
```

This forces you to find the exact place where the new element should go, which may be tricky.
This is what Proton solves with JSX while still letting you choose the place to attach or reattach a Proton Component.

This allows you to do this: (Somewhat of an alternative to Web Components)

```jsx
function Widget() {
  return document.createElement("div")
}
Widget.Standalone = inflator.inflate(<Widget />)

const container = document.querySelector(".container")
container?.append(Widget.Standalone)
```

## DOM First & Easier Intergration

Nodes are allowed in JSX, making it easier to intergate third-party libraries that are for VanilaJS.

```jsx
function Widget() {
  const button = document.getElementById("button")
  button.append("Click me")

  return <div style={...}>{button}</div>
}
```

## Observables Allowed in JSX

The turning point is that JSX element attributes and children can consume [WICG Observables](https://github.com/WICG/observable),
meaning practically any library can be used as a State Manager.

```jsx
const text = new State("")

const button = document.getElementById("button")
button.append(inflate.inflate(<div>{text}</div>))

text.set("Some text")
```

_Continue reading about_ [JSX Reactivity](https://pinely-international.github.io/proton/learn/unwinding/reactivity)

## Customization

Adding your own JSX Attribute for any element is as easy as ever.

For example, **`classMods`** - it will ensure BEM for elements without annoying imports.
```jsx
inflator.jsxAttributes.set("classMods", context => {
  if (context.value == null) return
  context.bind("className", bem(context.props.className, context.value))
})
```

More about [customization](https://pinely-international.github.io/proton/category/custom-behavior)

## Fault Tolerance

Unlike React, Proton will not propagate thrown errors to parents - errors in Children will not break Parents, while you can still catch them.

```jsx
function Child() { throw new Error("Test") }
function Parent(this: Proton.Component) { return <div>123<Child /></div> }

document.body.append(inflate.inflate(<Parent />)) // Will render `123` without errors.
```

Learn how you can [catch errors](https://pinely-international.github.io/proton/learn/guides/error)

## Open Internals

To maintain open internals, this library uses Classes instead of Functions as factories and uses the `private` identifier in TypeScript,
which gives you proper types while not stopping you from experimenting with internal variables and even allowing you to override them in a conventional way.

## Similar Libraries

If you want to manage your components in a somewhat complex way (like in React), you can continue reading this, but otherwise, you may want to consider these alternatives:

- <https://github.com/kitajs/html>
- https://github.com/reactivehtml/rimmel

## Why Proton over React?

It is very similar to React, it tries to simplify development as we know it in React.

|Feature|Description|
|-------|-----------|
|Extended Customization|Custom Attributes, Children Adapters, Element Transformation, Class extension|
|No built-in State Manager|Any State Manager that supports a Signal-like interface **will just** work in Proton, while there is no enforcement of one|
|Signals/Observables Support|Native support for [WICG Observables](https://github.com/WICG/observable) and Signal-like structures|
|No root elements|Any component can be **inflated** and attached anywhere|
|Components can be Async 😱 (Client side)|Await your values and delay/schedule the views with fallbacks and an initial view.|
|Top-level allowed|You can do anything in any scope, Proton doesn't put any constraints on where or from what something is initialized - enjoy!|
|Children don't crash Parents|An error in the subtree will not break the rendering of parents.|
|Return any value|Components can be returned with **any** value, no seriously, even DOM Nodes/Elements will work.|
|Class-based|Enables **tree-shaking**, **extensibility**, and **open internals**|

**React Inherited Features**

|Feature|Description|
|-------|-----------|
|Tree Context|Explicit context sharing between subtree components|
|Conditional Rendering|Proton implements Conditional Mounting|
|Layouts Swapping|Conditionally changing the whole component layout|
|JSX|Proton supports React JSX, but it also has its own flavor|
|`ref` attribute|Access a DOM element when it's ready - supports refs merging as well|
|Event delegation|Proton subscribes to parents rather than directly to elements too (for lists) ([WIP](https://github.com/pinely-international/proton/issues/53))|
|SSR|Provides an extendable `JSXSerializer` and examples with full DOM support in DOM-less environments like servers|
|Portal|Portals are natural and very easy, you just use a component-scoped inflator|
|Error catching|Proton exposes a clear API to catch errors and others|

**Problems to solve:**

Proton isn't perfect, it's being developed.
https://github.com/pinely-international/proton/milestones

## Getting Started

```tsx
function App() {
  return <div>Hello World!</div>
}

const inflator = new WebInflator
const AppView = inflator.inflate(<App />)

document.getElementById("root").replaceChildren(AppView)
```

## JSX

Proton supports JSX. It maps directly to [Document](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model) elements and allows any value to be put into attributes or as children of **any element**. And it has a different flavor compared to React JSX.

```xml
<div className="product-card">
  <h2>Title</h2>
  <p>Description</p>
  <img src="/static/product-card.jpg" />

  // You can put your weird stuff here.
  <aside id={new MyIdObject()} />
</div>
```

Learn more about [Inflator](#inflator) to provide custom handlers.

## TypeScript

Report if there is anything uncovered for TypeScript.

## FAQ

<details>
  <summary>Do React hooks work in Proton?</summary>
  No, but it's very extensible, so some enthusiasts might implement it. BTW, even though libraries from other "frameworks" won't work in Proton, libraries for Proton are supposed to work in other frameworks too.
</details>
<!-- <details>
  <summary>question?</summary>
  answer
</details> -->
