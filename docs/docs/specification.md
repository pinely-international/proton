# Proton Specification

## Overview

Proton is a DOM-first, Signal-based UI framework designed for building modern web applications with minimal overhead. At approximately 5kb gzipped, it provides a rootless architecture that allows components to be inflated and attached anywhere in the DOM.

## Core Principles

### 1. No Framework Principle
Proton follows the [No Framework Principle](https://dev.to/framemuse/no-framework-principle-arised-2n39), emphasizing:
- Minimal abstraction over native DOM APIs
- Direct DOM manipulation when beneficial
- Avoiding unnecessary complexity and overhead

### 2. Rootless Architecture
Unlike traditional frameworks that require a root element:
- Components can be mounted anywhere in the DOM
- No single application root required
- Enables micro-frontend architectures naturally

### 3. Signal-First Reactivity
- Native support for [WICG Observables](https://github.com/WICG/observable)
- Compatible with any Signal-like interface
- No enforced state management solution

## Component Architecture

### Class-Based Components
```typescript
class MyComponent extends ProtonComponent {
  render() {
    return <div>Hello World</div>
  }
}
```

Benefits:
- **Tree-shaking**: Unused methods are eliminated
- **Extensibility**: Easy to extend and customize
- **Open internals**: Full access to component lifecycle

### Lifecycle Methods
- `render()`: Returns JSX or DOM elements
- `onMount()`: Called when component is attached to DOM
- `onUnmount()`: Called when component is removed
- `onError()`: Handles errors within component tree

## JSX Integration

### JSX Runtime
Proton provides its own JSX runtime that:
- Supports standard React JSX syntax
- Adds Proton-specific features
- Enables custom attributes and transformations

### Configuration
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@denshya/proton/jsx/virtual"
  }
}
```

## Reactivity System

### Observable Integration
Proton automatically subscribes to observables and updates the DOM:

```typescript
const count = new Observable(0)

function Counter() {
  return <div>Count: {count}</div>
}
```

### State Management Compatibility
Works with any state management library that provides observable-like interfaces:
- Redux (with observability wrapper)
- MobX
- Zustand
- Custom signal implementations

## Error Handling

### Isolated Error Boundaries
- Errors in child components don't crash parent components
- Each component acts as its own error boundary
- Graceful degradation and recovery

### Error Catching API
```typescript
class MyComponent extends ProtonComponent {
  onError(error: Error, errorInfo: ErrorInfo) {
    // Handle error gracefully
    console.error('Component error:', error)
    return <ErrorFallback />
  }
}
```

## Advanced Features

### Async Components
Components can be asynchronous and return Promises:

```typescript
async function AsyncComponent() {
  const data = await fetchData()
  return <div>{data}</div>
}
```

### Custom Attributes
Extend HTML with custom attributes:

```typescript
<div customAttribute="value" />
```

### Element Transformation
Transform elements during rendering:

```typescript
const transformedElement = transformElement(element, options)
```

### Children Adapters
Customize how children are processed and rendered.

## Server-Side Rendering (SSR)

### JSXSerializer
Proton provides extensible SSR support:

```typescript
import { JSXSerializer } from '@denshya/proton'

const html = JSXSerializer.serialize(<App />)
```

### DOM-less Environments
Full DOM support in server environments without browser APIs.

## Performance Characteristics

### Bundle Size
- Core: ~5kb gzipped
- Tree-shakeable architecture
- No unnecessary runtime overhead

### Runtime Performance
- Direct DOM manipulation
- Minimal virtual DOM overhead
- Efficient observable subscriptions

### Memory Management
- Automatic cleanup of subscriptions
- Garbage collection friendly
- Minimal memory footprint

## Comparison with Other Frameworks

| Feature | Proton | React | Solid |
|---------|--------|-------|--------|
| Bundle Size | ~5kb | ~42kb | ~7kb |
| Rootless | ✅ | ❌ | ❌ |
| Async Components | ✅ | ⚠️ | ❌ |
| Error Isolation | ✅ | ⚠️ | ❌ |
| Signal-Native | ✅ | ❌ | ✅ |
| Class-Based | ✅ | ⚠️ | ❌ |

## Migration Guide

### From React
1. Update JSX configuration
2. Convert functional components to classes (optional)
3. Replace useState with observables
4. Remove root rendering calls

### From Other Frameworks
Similar principles apply - focus on observable state and component classes.

## Browser Support

- Modern browsers with ES2020+ support
- No IE support
- Progressive enhancement friendly

## TypeScript Support

Full TypeScript support with:
- Type-safe JSX
- Generic component props
- Strict null checks compatibility
- Advanced type inference