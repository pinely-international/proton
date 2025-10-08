import { isObservableGetter } from "./testers"

const nativeDescriptors: PropertyDescriptorMap = {}

function getNativeDescriptor(instance: Node, property: keyof never): PropertyDescriptor {
  if (instance instanceof Node === false) {
    throw new TypeError("This type of instance is not supported: " + instance, { cause: { instance } })
  }

  if (instance.constructor.name in nativeDescriptors === false) {
    const descriptor = Object.getOwnPropertyDescriptor(instance.constructor.prototype, property)
    if (descriptor == null) {
      throw new TypeError("This instance constructor does provide a property descriptor for: " + String(property), { cause: { property } })
    }

    nativeDescriptors[instance.constructor.name] = descriptor
  }

  return nativeDescriptors[instance.constructor.name]
}


/** @internal */
namespace WebNodeBinding {
  export function dualSignalBind<T extends Node>(node: T, key: keyof T, value: unknown, changeEventKey: string) {
    const accessor = value
    if (!isObservableGetter(accessor)) return

    const descriptor = getNativeDescriptor(node, key)

    if (accessor.get) descriptor.set!.call(node, accessor.get())
    if (accessor.set) {
      Object.defineProperty(node, key, {
        configurable: true,
        get: () => descriptor.get!.call(node),
        set: value => {
          descriptor.set!.call(node, value)
          accessor.set!(value)
        }
      })

      node.addEventListener(changeEventKey, event => accessor.set!((event.currentTarget as T)[key]))
    }
    accessor.subscribe?.(value => descriptor.set!.call(node, accessor.get?.() ?? value))
  }
}

export default WebNodeBinding

