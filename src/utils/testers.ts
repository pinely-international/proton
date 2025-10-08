import Accessor from "@/Accessor"
import { Subscriptable } from "@/Observable"

/**
 * https://stackoverflow.com/questions/38304401/javascript-check-if-dictionary/71975382#71975382
 */
export function isRecord(object: unknown): object is Record<keyof never, unknown> {
  return object instanceof Object && object.constructor === Object
}

export function isObservableGetter<T>(value: unknown): value is Partial<Accessor<T> & Subscriptable<T>> {
  // @ts-expect-error ok to check this way.
  if (value instanceof Object && value.subscribe instanceof Function) {
    return true
  }

  return false
}

export function isIterable<T>(value: unknown): value is Iterable<T> {
  // @ts-expect-error ok to check this way.
  return value instanceof Object && value[Symbol.iterator]
}

export function isAsyncIterable<T>(value: unknown): value is AsyncIterable<T> {
  // @ts-expect-error ok to check this way.
  return value instanceof Object && value[Symbol.asyncIterator]
}

export function isJSX(value: unknown): value is JSX.Element {
  if (isRecord(value) && value.type != null) return true

  return false
}

export function isPrimitive(value: unknown) {
  switch (typeof value) {
    case "function": return false
    case "object": return value == null

    default: return true
  }
}
