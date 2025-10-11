import { describe, it } from 'bun:test'
import { State } from "@denshya/reactive"

// Helper: compile-time type assertions
function expectType<T>(value: T): void { }

describe('JSX type tests (with actual JSX)', () => {
  it('valid intrinsic props', () => {
    const el = <div className="foo" id="bar" title="baz">text</div>
    expectType<JSX.Element>(el)
  })

  it('invalid intrinsic prop (should error)', () => {
    // @ts-expect-error
    const el = <div unknownProp={123} />
    expectType<JSX.Element>(el)
  })

  it('event handler typing', () => {
    const el = <button on={{ click: (e: MouseEvent) => { } }} />
    expectType<JSX.Element>(el)
  })

  it('State-backed prop typing', () => {
    const value = new State("")
    const el = <input value={value} />
    expectType<JSX.Element>(el)
  })

  it('custom component props', () => {
    type Props = { foo: number, bar?: string, children?: JSX.Children<any> }
    function MyComp(props: Props) {
      return <div>{props.foo}{props.bar}</div>
    }

    const valid = <MyComp foo={1} bar="a" children={null} />
    expectType<JSX.Element>(valid)

    // @ts-expect-error - missing required prop 'foo'
    const missing = <MyComp bar="a" />

    // @ts-expect-error - extra prop 'baz'
    const extra = <MyComp foo={1} baz={true} />
  })

  it('nested children typing', () => {
    const el = <ul><li>One</li><li>Two</li></ul>
    expectType<JSX.Element>(el)
  })

  it('conditional children typing', () => {
    const cond = true
    const el = <>{cond ? <span /> : null}</>
    expectType<JSX.Element>(el)
  })

  it('fragment typing', () => {
    const frag = <><div /><span /></>
    expectType<JSX.Element>(frag)
  })
})