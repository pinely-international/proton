import "./dom"

import { describe, it, expect, beforeAll, beforeEach, mock } from "bun:test"
import { WebInflator } from "../build"
import { injectDOMPolyfill } from "./dom"

import { State } from "@denshya/reactive"


describe('WebInflator.subscribe', () => {
  let callback = mock()
  beforeEach(() => {
    callback = mock()
  })

  it('immediately invokes callback with primitive value', () => {
    WebInflator.subscribe(42, callback);
    expect(callback).toHaveBeenCalledWith(42);
  });

  it('does nothing for null or undefined', () => {
    WebInflator.subscribe(null, callback);
    WebInflator.subscribe(undefined, callback);
    expect(callback).not.toHaveBeenCalled();
  });

  it('does something to any object', () => {
    WebInflator.subscribe({ not: 'observable' }, callback);
    expect(callback).toHaveBeenCalled();
  });

  it('calls callback with initial value from observable with get', () => {
    const source = new State('hello');
    WebInflator.subscribe(source, callback);
    expect(callback).toHaveBeenCalledWith('hello');
  });

  it('subscribes and calls callback on updates', () => {
    const source = new State('a');
    WebInflator.subscribe(source, callback);
    source.set('b');
    source.set('c');
    expect(callback.mock.calls).toEqual([['a'], ['b'], ['c']]);
  });

  // it('prefers get() over direct subscription value', () => {
  //   const custom = {
  //     get: () => 'fromGet',
  //     subscribe: (cb: (v: any) => void) => cb('fromSub')
  //   };
  //   WebInflator.subscribe(custom, callback);
  //   expect(callback.mock.calls).toEqual([['fromGet'], ['fromGet']]);
  // });

  it('supports objects with subscribe only', () => {
    const obj = {
      subscribe: (cb: (v: any) => void) => {
        cb('X');
        cb('Y');
      }
    };
    WebInflator.subscribe(obj, callback);
    expect(callback.mock.calls).toEqual([['X'], ['Y']]);
  });

  it('allows unknown object types with no get/subscribe', () => {
    const obj = Object.create(null);
    WebInflator.subscribe(obj, callback);
    expect(callback).toHaveBeenCalled();
  });
});

describe("Subscribing Property+Attribute", () => {
  beforeAll(() => {
    injectDOMPolyfill(globalThis)
  })

  it("binds textContent to State", () => {
    const state = new State("initial")
    const element = document.createElement("div")

    WebInflator.subscribeProperty("textContent", state, element)
    expect(element.textContent).toBe("initial")

    state.set("updated")
    expect(element.textContent).toBe("updated")
  })

  it("binds boolean property and updates accordingly", () => {
    const state = new State(true)
    const element = document.createElement("input")

    WebInflator.subscribeProperty("disabled", state, element)
    expect(element.disabled).toBe(true)

    state.set(false)
    expect(element.disabled).toBe(false)
  })

  it("binds className from State", () => {
    const state = new State("foo")
    const element = document.createElement("div")

    WebInflator.subscribeProperty("className", state, element)
    expect(element.className).toBe("foo")

    state.set("bar")
    expect(element.className).toBe("bar")
  })

  it("removes attribute when value is null or undefined", () => {
    const state = new State<string | null | undefined>("foo")
    const element = document.createElement("div")

    WebInflator.subscribeAttribute(element, "title", state)
    expect(element.getAttribute("title")).toBe("foo")

    state.set(null)
    expect(element.getAttribute("title")).toBe(null)
    expect(element.hasAttribute("title")).toBe(false)

    state.set("bar")
    expect(element.getAttribute("title")).toBe("bar")

    state.set(undefined)
    expect(element.hasAttribute("title")).toBe(false)
  })
})