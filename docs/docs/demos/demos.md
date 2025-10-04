# Interactive Demos

Explore Proton's capabilities through these hands-on examples. Each demo showcases different aspects of the framework.

## 🚀 Quick Start Demos

### Basic Counter
A simple reactive counter demonstrating Signal integration.

```tsx
import { State } from "@denshya/reactive"
import { WebInflator } from "@denshya/proton"

function Counter() {
  const count = new State(0)
  
  return (
    <div>
      <h2>Count: {count}</h2>
      <button onClick={() => count.set(count.get() + 1)}>
        Increment
      </button>
      <button onClick={() => count.set(count.get() - 1)}>
        Decrement
      </button>
      <button onClick={() => count.set(0)}>
        Reset
      </button>
    </div>
  )
}

// Mount anywhere
const inflator = new WebInflator()
document.body.appendChild(inflator.inflate(<Counter />))
```

[▶️ Try on StackBlitz](https://stackblitz.com/edit/vitejs-vite-uepaaxp1?file=src%2FApp.tsx)

### Color Picker with Mouse Tracking
Real-time background color changes based on mouse position.

```tsx
function ColorApp() {
  const pointerMoveX$ = window.when("pointermove").map(event => event.x)
  const background = pointerMoveX$.map(x => x > 500 ? "red" : "green")

  return (
    <div style={{ 
      background, 
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <h1>Mouse X: {pointerMoveX$}</h1>
    </div>
  )
}
```

[▶️ Try on StackBlitz](https://stackblitz.com/edit/vitejs-vite-mousetrack)

## 🏗️ Architecture Demos

### 📋 Todo Application
Complete todo app with CRUD operations and local storage.

**Features:**
- Add/remove todos
- Mark as complete
- Filter by status
- Persistent storage
- Async operations

[🔗 View Source](https://github.com/denshya/proton/tree/main/demos/Todos) | [▶️ Live Demo](https://denshya.github.io/proton/demos/todos)

### 🎨 Animated Circles
Performance demo with hundreds of animated elements.

**Features:**
- Smooth animations
- Dynamic element creation
- Performance monitoring
- Signal-based positioning

[🔗 View Source](https://github.com/denshya/proton/tree/main/demos/circles) | [▶️ Live Demo](https://denshya.github.io/proton/demos/circles)

### 🏢 Full-Scale Application
Enterprise-level demo showcasing Proton in a complex application.

**Features:**
- Routing system
- State management
- Component composition
- Error boundaries
- SSR support

[🔗 View Source](https://github.com/denshya/proton/tree/main/demos/simple) | [▶️ Live Demo](https://denshya.github.io/proton/demos/simple)

## 🧪 Advanced Examples

### Async Components
```tsx
async function* AsyncComponent() {
  yield <div>Loading...</div>
  
  const data = await fetch('/api/data').then(r => r.json())
  
  return (
    <div>
      <h2>Loaded Data</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
```

### Error Boundaries
```tsx
class ErrorBoundary extends ProtonComponent {
  onError(error, errorInfo) {
    console.error('Caught error:', error)
    return (
      <div style={{ color: 'red', padding: '1rem', border: '1px solid red' }}>
        <h3>Something went wrong!</h3>
        <details>
          <summary>Error Details</summary>
          <pre>{error.message}</pre>
        </details>
      </div>
    )
  }

  render() {
    return this.props.children
  }
}
```

### Micro-Frontend Setup
```tsx
// Component can be mounted anywhere
const sidebarComponent = inflator.inflate(<Sidebar />)
const headerComponent = inflator.inflate(<Header />)
const mainComponent = inflator.inflate(<MainContent />)

document.querySelector('#sidebar').appendChild(sidebarComponent)
document.querySelector('#header').appendChild(headerComponent)
document.querySelector('#main').appendChild(mainComponent)
```

## 🔗 External Examples

### Community Projects
- [Proton Router](https://github.com/community/proton-router) - Declarative routing
- [Proton Forms](https://github.com/community/proton-forms) - Form handling utilities
- [Proton Animation](https://github.com/community/proton-animation) - Animation helpers

### Integration Examples
- [Proton + Redux](./learn/how-to-use/redux.md)
- [Proton + SSR](./learn/how-to-use/ssr.md)
- [Proton + Router](./learn/how-to-use/router.md)

## 🛠️ Development Tools

### Browser DevTools
Proton components are regular DOM elements, so standard browser DevTools work perfectly:
- Inspect component hierarchy
- Debug event handlers
- Monitor state changes
- Profile performance

### VS Code Extensions
- **Proton Snippets** - Code snippets for common patterns
- **JSX IntelliSense** - Enhanced autocomplete for Proton JSX

---

Ready to start building? Check out our [Getting Started guide](../learn/learn.md)!
