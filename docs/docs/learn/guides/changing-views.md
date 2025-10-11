# Swapping Views

Switching between different markups within a component.

## View API

Controls which element is displayed under a component

> For animated swaps, check the [View Transitions guide](./view-transitions.md) to coordinate custom effects and the browser View Transition API.

```tsx
function MyView(this: Proton.Component) {
  this.view.set(<div>Hello World!</div>)

  setTimeout(() => {
    this.view.set(<div>I'm Replaced!</div>)
  }, 1_000)
}
```

In TypeScript, by typing `this` will cast a Proton Component signature to your function, which will reduce chances of using this functions out of JSX Inflator.

As you already know a component can **return** nothing - it may set a view via `this.view.set`.
`return` in a Proton Component Factory function calls `this.view.set` internally.
`return` also defines a `default` view for a component under `this.view.default` property for re-usage.

### Caching Elements

Optionally, you can optimize your elements by inflating them beforehand.

```tsx
function MyView(this: Proton.Component) {
  const helloWorldView = this.inflator.inflate(<div>Hello World!</div>)
  const replacedView = this.inflator.inflate(<div>I'm Replaced!</div>)

  this.view.set(helloWorldView)
  setTimeout(() => this.view.set(replacedView), 1_000)
  setTimeout(() => this.view.set(helloWorldView), 1_000)
  setTimeout(() => this.view.set(replacedView), 1_000)
}
```

Or using the same JSX since inflated JSX elements are cached automatically

```tsx
function MyView(this: Proton.Component) {
  const helloWorldView = <div>Hello World!</div>
  const replacedView = <div>I'm Replaced!</div>

  this.view.set(helloWorldView)
  setTimeout(() => this.view.set(replacedView), 1_000)
  setTimeout(() => this.view.set(helloWorldView), 1_000)
  setTimeout(() => this.view.set(replacedView), 1_000)
}
```

:::tip
Or use [`Proton.Switch`](../helpers/Switch.md) helper.
:::

## Generators

Using `yield` will be calling `this.view.set` for each one as well allowing you to swap views without explicitly using `this`

```tsx
async function* MyView() {
  yield <Loader />

  await new Promise(resolve => setTimeout(resolve, 1_000))

  return <div>I'm loaded!</div>
}
```

Using **synchronous** generators doesn't really make sense since only last item always will be delivered, so its behavior is not changed.
This code will be rendered as iterable, though `return` will not have any effect.

```tsx
function* MyView() {
  yield <Loader />
  yield <div>I'm loaded!</div>
}
```

Equals to

```tsx
function MyView() {
  return [<Loader />, <div>I'm loaded!</div>]
}
```
