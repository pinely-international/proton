import "./dom"

import { describe, expect, it } from "bun:test"

import { WebInflator, } from "../build"


/**
 * A simple concrete subclass of the abstract InflatorAdapter.
 */
class TestAdapter {
  public lastValue: unknown = undefined

  /**
   * Simply records and returns the value passed in.
   */
  inflate(value: unknown): unknown {
    this.lastValue = value
    return `adapted:${String(value)}`
  }
}

describe("InflatorAdapter", () => {
  const inflator = new WebInflator
  inflator.adapters.add(TestAdapter)

  it("inflate() returns the adapted result", () => {
    expect(inflator.inflate(123) as unknown as string).toBe("adapted:123")
  })

  it("inflate() from standalone adapter", () => {
    const adapter = new TestAdapter

    expect(adapter.inflate("foo")).toBe("adapted:foo")
    expect(adapter.inflate("bar")).toBe("adapted:bar")
  })
})