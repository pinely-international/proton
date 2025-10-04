---
sidebar_position: 10
---

# API Reference

Complete API documentation for Proton framework components, utilities, and core concepts.

## Core Classes

### WebInflator

The main class responsible for converting JSX into DOM nodes.

```typescript
class WebInflator {
  constructor(options?: InflatorOptions)
  inflate<T>(jsx: JSX.Element | T): Node
  setAdapter<K extends keyof ElementAdapters>(
    tag: K, 
    adapter: ElementAdapters[K]
  ): void
}
```

#### Methods

**`inflate<T>(jsx: JSX.Element | T): Node`**
Converts JSX or any value into a DOM Node.

- **Parameters**: 
  - `jsx` - JSX element, component, or primitive value
- **Returns**: DOM Node (Element, Text, Comment, etc.)
- **Example**:
  ```tsx
  const inflator = new WebInflator()
  const element = inflator.inflate(<div>Hello</div>)
  document.body.appendChild(element)
  ```

**`setAdapter(tag, adapter)`**
Registers custom element adapters for specific tags.

- **Parameters**:
  - `tag` - HTML tag name or component type
  - `adapter` - Function to customize element creation
- **Example**:
  ```tsx
  inflator.setAdapter('custom-element', (props, children) => {
    const el = document.createElement('div')
    el.className = 'custom'
    return el
  })
  ```

### ProtonComponent

Base class for creating Proton components.

```typescript
abstract class ProtonComponent<P = {}> {
  props: P
  abstract render(): JSX.Element | Node | Promise<JSX.Element | Node>
  onMount?(): void
  onUnmount?(): void
  onError?(error: Error, errorInfo: ErrorInfo): JSX.Element | Node
}
```

#### Lifecycle Methods

**`render(): JSX.Element | Node | Promise<JSX.Element | Node>`**
Required method that returns the component's UI.

- **Returns**: JSX, DOM Node, or Promise resolving to either
- **Example**:
  ```tsx
  class MyComponent extends ProtonComponent {
    render() {
      return <div>Hello {this.props.name}</div>
    }
  }
  ```

**`onMount?(): void`**
Called when component is attached to DOM.

**`onUnmount?(): void`**
Called when component is removed from DOM.

**`onError?(error, errorInfo): JSX.Element | Node`**
Error boundary handler for child component errors.

- **Parameters**:
  - `error` - The caught error
  - `errorInfo` - Additional error context
- **Returns**: Fallback UI to render

## JSX Utilities

### JSXSerializer

Server-side rendering utilities.

```typescript
class JSXSerializer {
  static serialize(jsx: JSX.Element, options?: SerializeOptions): string
  static serializeAsync(jsx: JSX.Element): Promise<string>
}
```

#### Methods

**`serialize(jsx, options?): string`**
Converts JSX to HTML string synchronously.

**`serializeAsync(jsx): Promise<string>`**
Converts JSX to HTML string, handling async components.

### Custom JSX Attributes

#### Standard Attributes
All standard HTML attributes are supported:

```tsx
<div 
  id="myDiv"
  className="container"
  style={{ color: 'red' }}
  onClick={handleClick}
/>
```

#### Proton-Specific Attributes

**`mounted: Observable<boolean>`**
Conditional mounting based on observable state.

```tsx
const visible = new State(true)
<div mounted={visible}>Conditionally rendered</div>
```

**`ref: (element: Element) => void`**
Reference to DOM element when created.

```tsx
<input ref={el => el.focus()} />
```

**`on: Record<string, EventListener>`**
Event handlers object notation.

```tsx
<button on={{
  click: () => console.log('clicked'),
  mouseover: () => console.log('hovered')
}}>
  Button
</button>
```

## State Management

### Observable Interface

Proton works with any observable that implements:

```typescript
interface Observable<T> {
  get(): T
  subscribe(callback: (value: T) => void): () => void
}
```

### Recommended: @denshya/reactive

```typescript
import { State, Computed } from '@denshya/reactive'

// Reactive state
const count = new State(0)
const doubled = new Computed(() => count.get() * 2)

// Usage in JSX
<div>Count: {count}, Doubled: {doubled}</div>
```

## Error Handling

### Error Types

**`ProtonError`**
Base error class for Proton-specific errors.

**`InflationError`**
Thrown during JSX inflation process.

**`ComponentError`**
Thrown during component lifecycle.

### Error Boundaries

```typescript
class ErrorBoundary extends ProtonComponent {
  onError(error: Error, errorInfo: ErrorInfo) {
    // Log error
    console.error('Component error:', error)
    
    // Return fallback UI
    return (
      <div className="error-fallback">
        <h2>Something went wrong</h2>
        <details>
          <summary>Error details</summary>
          <pre>{error.stack}</pre>
        </details>
      </div>
    )
  }

  render() {
    return this.props.children
  }
}
```

## Advanced Features

### Async Components

Components can be async functions or generators:

```typescript
// Async function component
async function AsyncComponent() {
  const data = await fetchData()
  return <div>{data}</div>
}

// Async generator for progressive loading
async function* ProgressiveComponent() {
  yield <div>Loading...</div>
  
  const firstBatch = await fetchFirstBatch()
  yield <div>First batch: {firstBatch}</div>
  
  const secondBatch = await fetchSecondBatch()
  return <div>Complete: {firstBatch + secondBatch}</div>
}
```

### Portal Creation

Create portals to render components elsewhere:

```typescript
class Modal extends ProtonComponent {
  render() {
    const inflator = new WebInflator()
    const modalContent = inflator.inflate(
      <div className="modal">{this.props.children}</div>
    )
    
    document.body.appendChild(modalContent)
    return new Comment('Modal portal')
  }
}
```

### Custom Element Adapters

Transform elements during inflation:

```typescript
const inflator = new WebInflator()

// Add automatic ARIA attributes
inflator.setAdapter('button', (props, children) => {
  const button = document.createElement('button')
  button.setAttribute('role', 'button')
  if (!props['aria-label']) {
    button.setAttribute('aria-label', children.textContent || 'Button')
  }
  return button
})
```

## Configuration

### Inflator Options

```typescript
interface InflatorOptions {
  errorBoundary?: (error: Error) => JSX.Element | Node
  customElements?: Record<string, ElementAdapter>
  transformers?: ElementTransformer[]
}
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@denshya/proton/jsx/virtual",
    "target": "ES2020",
    "module": "ESNext",
    "strict": true
  }
}
```

## Performance APIs

### Component Profiling

```typescript
class ProfiledComponent extends ProtonComponent {
  render() {
    performance.mark('component-start')
    const result = <div>Heavy computation</div>
    performance.mark('component-end')
    performance.measure('component-render', 'component-start', 'component-end')
    return result
  }
}
```

### Memory Management

```typescript
class ManagedComponent extends ProtonComponent {
  private subscription?: () => void

  onMount() {
    this.subscription = someObservable.subscribe(value => {
      // Handle updates
    })
  }

  onUnmount() {
    this.subscription?.()
  }
}
```

## Migration Helpers

### From React

```typescript
// React component
function ReactComponent({ name }) {
  const [count, setCount] = useState(0)
  return <div onClick={() => setCount(c => c + 1)}>{name}: {count}</div>
}

// Proton equivalent
class ProtonComponent extends ProtonComponent {
  private count = new State(0)
  
  render() {
    return (
      <div onClick={() => this.count.set(this.count.get() + 1)}>
        {this.props.name}: {this.count}
      </div>
    )
  }
}
```

### From Vue

```typescript
// Vue component
export default {
  data() {
    return { count: 0 }
  },
  template: '<div @click="count++">{{ count }}</div>'
}

// Proton equivalent
class VueToProton extends ProtonComponent {
  private count = new State(0)
  
  render() {
    return (
      <div onClick={() => this.count.set(this.count.get() + 1)}>
        {this.count}
      </div>
    )
  }
}
```

## Development Tools

### Debug Mode

```typescript
// Enable debug logging
const inflator = new WebInflator({ debug: true })

// Component with debug info
class DebugComponent extends ProtonComponent {
  render() {
    if (process.env.NODE_ENV === 'development') {
      console.log('Rendering component with props:', this.props)
    }
    return <div>Debug component</div>
  }
}
```

### Testing Utilities

```typescript
import { WebInflator } from '@denshya/proton'

// Test helper
function renderComponent(component: JSX.Element): HTMLElement {
  const inflator = new WebInflator()
  const element = inflator.inflate(component)
  document.body.appendChild(element)
  return element as HTMLElement
}

// Usage in tests
const element = renderComponent(<MyComponent prop="value" />)
expect(element.textContent).toBe('Expected text')
```

---

For more examples and advanced usage patterns, see our [Learning Guides](./learn/learn.md).