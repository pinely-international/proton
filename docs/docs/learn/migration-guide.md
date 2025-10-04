---
sidebar_position: 2
---

# Migration Guide

Transitioning to Proton from other frameworks? This guide will help you understand the key differences and provide step-by-step migration instructions.

## From React

### Key Differences

| Concept | React | Proton |
|---------|-------|--------|
| Components | Functions/Classes | Classes only |
| State | useState, useReducer | Observables/Signals |
| Effects | useEffect | onMount/onUnmount |
| Root Rendering | ReactDOM.render() | inflator.inflate() |
| Error Boundaries | Error boundaries | Built-in isolation |

### Step-by-Step Migration

#### 1. Update Dependencies
```bash
# Remove React
bun remove react react-dom

# Add Proton and reactive state
bun add @denshya/proton @denshya/reactive
```

#### 2. Update JSX Configuration
```json title="tsconfig.json"
{
  "compilerOptions": {
    // Change from React JSX
    "jsx": "react-jsx",
    "jsxImportSource": "@denshya/proton/jsx/virtual"
  }
}
```

#### 3. Convert Components

**React Functional Component:**
```tsx
import React, { useState, useEffect } from 'react'

function Counter({ initialValue = 0 }) {
  const [count, setCount] = useState(initialValue)
  
  useEffect(() => {
    console.log('Component mounted')
    return () => console.log('Component unmounted')
  }, [])
  
  return (
    <div>
      <span>Count: {count}</span>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>-</button>
    </div>
  )
}
```

**Proton Class Component:**
```tsx
import { ProtonComponent } from '@denshya/proton'
import { State } from '@denshya/reactive'

class Counter extends ProtonComponent {
  private count = new State(this.props.initialValue || 0)
  
  onMount() {
    console.log('Component mounted')
  }
  
  onUnmount() {
    console.log('Component unmounted')
  }
  
  render() {
    return (
      <div>
        <span>Count: {this.count}</span>
        <button onClick={() => this.count.set(this.count.get() + 1)}>+</button>
        <button onClick={() => this.count.set(this.count.get() - 1)}>-</button>
      </div>
    )
  }
}
```

#### 4. Replace Root Rendering

**React:**
```tsx
import ReactDOM from 'react-dom/client'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(<App />)
```

**Proton:**
```tsx
import { WebInflator } from '@denshya/proton'

const inflator = new WebInflator()
const app = inflator.inflate(<App />)
document.getElementById('root').replaceChildren(app)
```

#### 5. Convert State Management

**React Context:**
```tsx
const ThemeContext = React.createContext()

function App() {
  const [theme, setTheme] = useState('light')
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Components />
    </ThemeContext.Provider>
  )
}
```

**Proton Tree Context:**
```tsx
import { TreeContextAPI } from '@denshya/proton'

const themeContext = new TreeContextAPI()

class App extends ProtonComponent {
  private theme = new State('light')
  
  render() {
    return themeContext.provide({ theme: this.theme }, (
      <Components />
    ))
  }
}
```

### Common Patterns

#### Conditional Rendering
```tsx
// React
{isVisible && <Component />}

// Proton
<div mounted={isVisible}>
  <Component />
</div>
```

#### Event Handling
```tsx
// React
<button onClick={handleClick}>Click</button>

// Proton - Multiple options
<button onClick={handleClick}>Click</button>
<button on={{ click: handleClick }}>Click</button>
```

#### Lists
```tsx
// React
{items.map(item => <Item key={item.id} data={item} />)}

// Proton - No keys required
{items.map(item => <Item data={item} />)}
```

## From Vue

### Key Differences

| Concept | Vue | Proton |
|---------|-----|--------|
| Components | Options/Composition API | Classes |
| Reactivity | ref, reactive | Observables |
| Templates | Template syntax | JSX |
| Lifecycle | mounted, unmounted | onMount, onUnmount |

### Migration Steps

#### 1. Convert Options API

**Vue Component:**
```vue
<template>
  <div>
    <p>{{ message }}</p>
    <button @click="updateMessage">Update</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: 'Hello Vue'
    }
  },
  mounted() {
    console.log('Mounted')
  },
  methods: {
    updateMessage() {
      this.message = 'Updated!'
    }
  }
}
</script>
```

**Proton Equivalent:**
```tsx
import { ProtonComponent } from '@denshya/proton'
import { State } from '@denshya/reactive'

class MyComponent extends ProtonComponent {
  private message = new State('Hello Proton')
  
  onMount() {
    console.log('Mounted')
  }
  
  private updateMessage = () => {
    this.message.set('Updated!')
  }
  
  render() {
    return (
      <div>
        <p>{this.message}</p>
        <button onClick={this.updateMessage}>Update</button>
      </div>
    )
  }
}
```

#### 2. Convert Composition API

**Vue Composition:**
```vue
<script setup>
import { ref, onMounted } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)

onMounted(() => {
  console.log('Mounted')
})

function increment() {
  count.value++
}
</script>
```

**Proton:**
```tsx
class Counter extends ProtonComponent {
  private count = new State(0)
  private doubled = new Computed(() => this.count.get() * 2)
  
  onMount() {
    console.log('Mounted')
  }
  
  private increment = () => {
    this.count.set(this.count.get() + 1)
  }
  
  render() {
    return (
      <div>
        <p>Count: {this.count}</p>
        <p>Doubled: {this.doubled}</p>
        <button onClick={this.increment}>+</button>
      </div>
    )
  }
}
```

## From Angular

### Key Differences

| Concept | Angular | Proton |
|---------|---------|--------|
| Components | Classes with decorators | Plain classes |
| Dependency Injection | Built-in DI | Manual/Context |
| Templates | Template syntax | JSX |
| Change Detection | Zone.js | Observables |

### Migration Example

**Angular Component:**
```typescript
@Component({
  selector: 'app-user',
  template: `
    <div>
      <h2>{{ user.name }}</h2>
      <p>{{ user.email }}</p>
      <button (click)="updateUser()">Update</button>
    </div>
  `
})
export class UserComponent implements OnInit {
  user = { name: 'John', email: 'john@example.com' }
  
  constructor(private userService: UserService) {}
  
  ngOnInit() {
    this.loadUser()
  }
  
  updateUser() {
    this.userService.updateUser(this.user)
  }
}
```

**Proton Equivalent:**
```tsx
class UserComponent extends ProtonComponent {
  private user = new State({ name: 'John', email: 'john@example.com' })
  
  constructor(props, private userService: UserService) {
    super(props)
  }
  
  onMount() {
    this.loadUser()
  }
  
  private updateUser = () => {
    this.userService.updateUser(this.user.get())
  }
  
  render() {
    return (
      <div>
        <h2>{this.user.map(u => u.name)}</h2>
        <p>{this.user.map(u => u.email)}</p>
        <button onClick={this.updateUser}>Update</button>
      </div>
    )
  }
}
```

## From Solid

### Key Differences

| Concept | Solid | Proton |
|---------|-------|--------|
| Components | Functions | Classes |
| Signals | createSignal | Observable/State |
| JSX | Solid JSX | React-compatible JSX |

### Migration Example

**Solid Component:**
```tsx
import { createSignal, onMount } from 'solid-js'

function Counter() {
  const [count, setCount] = createSignal(0)
  
  onMount(() => {
    console.log('Mounted')
  })
  
  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(count() + 1)}>+</button>
    </div>
  )
}
```

**Proton:**
```tsx
class Counter extends ProtonComponent {
  private count = new State(0)
  
  onMount() {
    console.log('Mounted')
  }
  
  render() {
    return (
      <div>
        <p>Count: {this.count}</p>
        <button onClick={() => this.count.set(this.count.get() + 1)}>+</button>
      </div>
    )
  }
}
```

## Common Migration Challenges

### 1. State Management Patterns

**Problem**: Moving from framework-specific state solutions.

**Solution**: Proton works with any observable-based state management:

```tsx
// Redux with observable wrapper
const storeState = new State(store.getState())
store.subscribe(() => storeState.set(store.getState()))

// MobX (already observable)
import { observable } from 'mobx'
const state = observable({ count: 0 })

// Zustand with signals
const useStore = create((set, get) => ({
  count: new State(0),
  increment: () => get().count.set(get().count.get() + 1)
}))
```

### 2. Routing Integration

**Problem**: Framework-specific routing solutions.

**Solution**: Use any router or create custom routing:

```tsx
// With any router
class App extends ProtonComponent {
  render() {
    return (
      <Router>
        <Route path="/" component={<Home />} />
        <Route path="/about" component={<About />} />
      </Router>
    )
  }
}

// Custom routing with signals
const currentRoute = new State(window.location.pathname)
window.addEventListener('popstate', () => {
  currentRoute.set(window.location.pathname)
})
```

### 3. Testing Strategies

**Problem**: Framework-specific testing utilities.

**Solution**: Use standard DOM testing approaches:

```tsx
import { WebInflator } from '@denshya/proton'

function renderComponent(component: JSX.Element) {
  const inflator = new WebInflator()
  const element = inflator.inflate(component)
  document.body.appendChild(element)
  return element
}

// Test
const component = renderComponent(<Counter initialValue={5} />)
const button = component.querySelector('button')
button.click()
expect(component.textContent).toContain('6')
```

## Migration Checklist

### Pre-Migration
- [ ] Audit current component structure
- [ ] Identify state management patterns
- [ ] List external dependencies
- [ ] Plan testing strategy

### During Migration
- [ ] Update build configuration
- [ ] Convert components one by one
- [ ] Replace state management
- [ ] Update event handlers
- [ ] Implement error boundaries

### Post-Migration
- [ ] Run performance benchmarks
- [ ] Update documentation
- [ ] Train team on new patterns
- [ ] Monitor for issues

## Getting Help

- 📚 [Learning Guides](./learn.md)
- 🔧 [API Reference](../api-reference.md)
- 💬 [Community Discord](https://discord.gg/proton)
- 🐛 [GitHub Issues](https://github.com/denshya/proton/issues)

---

*Need help with your specific migration? Open a [GitHub Discussion](https://github.com/denshya/proton/discussions) with your use case.*