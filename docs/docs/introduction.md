---
sidebar_position: 1
slug: /
---

# Welcome to Proton

**Proton** is a revolutionary DOM-first UI framework that challenges conventional web development approaches. Built on the [No Framework Principle](https://dev.to/framemuse/no-framework-principle-arised-2n39), Proton delivers powerful reactive UIs in just ~5kb gzipped.

## What Makes Proton Different?

### 🎯 Rootless Architecture
Unlike traditional frameworks that require a single root element, Proton components can be **inflated** and attached anywhere in the DOM. This enables natural micro-frontend architectures and unprecedented flexibility.

```tsx
// Mount anywhere, anytime
const component = inflator.inflate(<MyComponent />)
document.querySelector('#sidebar').appendChild(component)
```

### ⚡ Signal-First Reactivity
Proton natively supports [WICG Observables](https://github.com/WICG/observable) and any Signal-like interface. No enforced state management - use what works for your project.

```tsx
const count = new State(0)

function Counter() {
  return (
    <div>
      Count: {count}
      <button onClick={() => count.set(count.get() + 1)}>+</button>
    </div>
  )
}
```

### 🔒 Error Isolation
Child component errors don't crash their parents. Every component acts as its own error boundary, ensuring robust applications.

```tsx
class RobustComponent extends ProtonComponent {
  onError(error) {
    return <ErrorFallback error={error} />
  }
}
```

### 🚀 Async Components
Components can be asynchronous, returning Promises or using async generators for progressive loading.

```tsx
async function* DataComponent() {
  yield <Loading />
  const data = await fetchData()
  return <DisplayData data={data} />
}
```

## Framework Comparison

| Feature | Proton | React | Vue | Solid |
|---------|--------|-------|-----|-------|
| Bundle Size | ~5kb | ~42kb | ~34kb | ~7kb |
| Rootless Components | ✅ | ❌ | ❌ | ❌ |
| Native Signals | ✅ | ❌ | ⚠️ | ✅ |
| Async Components | ✅ | ⚠️ | ❌ | ❌ |
| Error Isolation | ✅ | ⚠️ | ⚠️ | ❌ |
| Class-Based | ✅ | ⚠️ | ⚠️ | ❌ |
| No Build Config | ✅ | ❌ | ❌ | ❌ |

## Core Concepts

### Components as Classes
Proton uses class-based components that are:
- **Tree-shakeable**: Unused methods are eliminated
- **Extensible**: Easy inheritance and customization  
- **Open**: Full access to component internals

### Inflation Process
The core concept of "inflating" JSX into DOM nodes:
- JSX → Inflator → DOM Nodes
- Works with any structure: components, elements, primitives
- No virtual DOM overhead

### Signal Integration
Seamless integration with observable state:
- Automatic subscription and cleanup
- Works with any Signal-like interface
- No re-rendering - direct DOM updates

## Getting Started

Ready to try Proton? Start with our [Getting Started guide](./learn/learn.md) or explore our [interactive demos](./demos/demos.md).

```bash
bun i @denshya/proton
```

## Community & Support

- 📚 [Documentation](./learn/learn.md)
- 🧪 [Demos & Examples](./demos/demos.md)
- 📋 [Specification](./specification.md)
- 🐛 [GitHub Issues](https://github.com/denshya/proton/issues)
- 💬 [Discussions](https://github.com/denshya/proton/discussions)

---

*Proton: Rethinking UI development for the modern web.*