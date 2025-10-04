import "./dom"

import { State } from "@denshya/reactive"
import { beforeAll, describe, expect, it } from "bun:test"

import { injectDOMPolyfill } from "./dom"

import { WebInflator, WebJSXSerializer } from "../build"


describe("WebJSXSerializer", () => {
  let serializer: WebJSXSerializer

  beforeAll(() => {
    serializer = new WebJSXSerializer
    injectDOMPolyfill(globalThis)
  })

  it("toString null or undefined yields empty string", () => {
    expect(serializer.toString(null)).toBe("")
    expect(serializer.toString(undefined)).toBe("")
  })

  it("toString arrays concatenates elements", () => {
    expect(serializer.toString(["a", "b", 3])).toBe("ab3")
  })

  it("toString Element returns outerHTML", () => {
    const el = document.createElement("div")
    el.innerHTML = "<span>hi</span>"
    expect(serializer.toString(el)).toBe(el.outerHTML)
  })

  it("toString DocumentFragment concatenates children", () => {
    const frag = document.createDocumentFragment()
    const t1 = document.createTextNode("X")
    const t2 = document.createTextNode("Y")
    frag.append(t1, t2)
    expect(serializer.toString(frag)).toBe("XY")
  })

  it("toString Node (Text) returns textContent", () => {
    const text = document.createTextNode("hello")
    expect(serializer.toString(text)).toBe("hello")
  })

  it("toString State observable uses get()", () => {
    const s = new State("foo")
    expect(serializer.toString(s)).toBe("foo")
    s.set("bar")
    expect(serializer.toString(s)).toBe("bar")
  })

  it("toString iterable concatenates", () => {
    const set = new Set(["1", "2", "3"])
    expect(serializer.toString(set)).toBe("123")
  })

  it("toString JSX intrinsic element", () => {
    const jsx = { type: "span", props: { children: "hey", className: "c" } }
    expect(serializer.toString(jsx as any)).toBe("<span class=\"c\">hey</span>")
  })

  it("toString self-closing tag without props", () => {
    const jsx = { type: "br", props: null }
    expect(serializer.toString(jsx as any)).toBe("<br/>")
  })

  it("toString object fallback throws", () => {
    expect(() => serializer.toString({ foo: "bar" })).toThrow()
  })

  it("styleToString and jsxAttributesToString produce correct attributes", () => {
    // private methods via jsxAttributesToString
    const props = { className: "cls", style: { backgroundColor: "red", opacity: new State(0.5) } }
    const attrs = serializer.jsxAttributesToString(props)
    expect(attrs).toContain(" class=\"cls\"")
    expect(attrs).toContain(" style=\"background-color:red;opacity:0.5;\"")
  })

  it("apply custom JSX attributes before serialization", () => {
    const inflator = new WebInflator
    inflator.jsxAttributes.set("foo" as never, (context: any) => {
      context.bind("customFoo", `${context.value}-test`)
    })

    serializer.inherit(inflator)
  const jsx = { type: "div", props: { foo: "bar", children: "ok" } }
  expect(serializer.toString(jsx)).toContain(" customFoo=\"bar-test\"")
  })

  it("componentToString renders sync component", () => {
    function Comp(props: { msg: string }) {
      return { type: "p", props: { children: props.msg } }
    }
    const out = serializer.componentToString(Comp, { msg: "hello" })
    expect(out).toBe("<p>hello</p>")
  })

  it("componentToString skips async components", () => {
    async function AsyncComp() {
      return { type: "p", props: { children: "nope" } }
    }
    const out = serializer.componentToString(AsyncComp, {})
    expect(out).toBe("")
  })

  it("skips elements with [data-nosnippet]", () => {
    const element = { type: "div", props: { "data-nosnippet": true } }

    const out = serializer.toString(element)
    expect(out).toBe("")
  })
})
