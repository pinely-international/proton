import { IsEqual, LiteralUnion, StringSlice } from "type-fest"

import { Accessible, AccessorGet } from "../Accessor"
import Guarded from "../Guarded"
import Observable from "../Observable"



type OtherString = string & {}
type BooleanLike =
  | (true | false)
  | ("true" | "false")


type AriaBooleanKeys =
  | "ariaChecked"
  | "ariaDisabled"
  | "ariaExpanded"
  | "ariaHidden"
  | "ariaInvalid"
  | "ariaPressed"
  | "ariaReadOnly"
  | "ariaRequired"
  | "ariaSelected"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type AriaUnprefixed<K extends keyof ARIAMixin> = K extends "role" ? "role" : StringSlice<Lowercase<K>, 4>

type AugmentedAria<T> = Omit<T, keyof ARIAMixin> & {
  aria?: { [K in keyof ARIAMixin]: JSX.Attribute<K extends AriaBooleanKeys ? (BooleanLike | OtherString | null) : ARIAMixin[K]> }
}


/** https://github.com/type-challenges/type-challenges/issues/139 */
type GetReadonlyKeys<
  T,
  U extends Readonly<T> = Readonly<T>,
  K extends keyof T = keyof T
> = K extends keyof T ? IsEqual<Pick<T, K>, Pick<U, K>> extends true ? K : never : never;


type AnyFunction = ((...args: any[]) => unknown)


type NonFunctionKeysOnly<K, V, R> = (
  K extends R ? never :
  AnyFunction extends V ? never :
  V extends AnyFunction ? never :
  K
)
interface _AttributesOf<T> {
  ReadonlyKeys: GetReadonlyKeys<T>
  Attributes: {
    [K in (keyof T) as NonFunctionKeysOnly<K, T[K], this["ReadonlyKeys"]>]: JSX.Attribute<T[K]>
  }
}

declare global {
  namespace JSX {
    interface Element {
      type: any
      props?: any
      children?: any
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface ElementTypeConstructor { }
    interface ElementTypeConstructor {
      (this: never, props: never): unknown
    }
    type ElementType = string | Element | ElementTypeConstructor

    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface ElementChildrenAttribute { children: {} }
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface ElementAttributesProperty { props: {} }


    type Attribute<T> =
      | T
      | Partial<Observable<T>>
      | Partial<Accessible<T>>
      | Partial<Guarded<T>>

    type Children<T extends JSX.Element> = T | Iterable<T>

    type HTMLElementEvents = {
      [K in keyof HTMLElementEventMap]?: (event: HTMLElementEventMap[K]) => void
    }

    interface IntrinsicAttributes {
      mounted?: AccessorGet<any> | Observable<any>
    }

    interface CustomAttributes {
      ns?: LiteralUnion<string, "http://www.w3.org/1999/xhtml" | "http://www.w3.org/2000/svg" | "http://www.w3.org/1998/Math/MathML">
      on?: HTMLElementEvents | readonly HTMLElementEvents[]
      style?: Attribute<Record<string, Attribute<string | CSSStyleValue>> | { [K in keyof CSSStyleDeclaration]?: Attribute<CSSStyleDeclaration[K] | CSSStyleValue | null | undefined> } | string>
    }

    type AttributesOf<T> = _AttributesOf<T>["Attributes"]

    type ElementAttributes<T> =
      & Partial<AttributesOf<AugmentedAria<T>>>
      & CustomAttributes
      & IntrinsicAttributes
      & { children?: unknown }
    // & {
    //   /**
    //    * The tag name of a custom element previously defined via `customElements.define()`.
    //    *
    //    * [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement#is)
    //    */
    //   is?: string
    // }
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    type SVGElementAttributes<T> = ElementAttributes<T> & (T extends SVGURIReference ? SVGURIReferenceAttribute : {}) & { class?: Attribute<string> }

    type SVGURIReferenceAttribute = SVGURIReference | { href?: Attribute<string> }


    type HTMLElements = { [Tag in keyof HTMLElementTagNameMap]: ElementAttributes<HTMLElementTagNameMap[Tag]> }
    type SVGElements = { [Tag in keyof SVGElementTagNameMap]: SVGElementAttributes<SVGElementTagNameMap[Tag]> }
    type MathMLElements = { [Tag in keyof MathMLElementTagNameMap]: ElementAttributes<MathMLElementTagNameMap[Tag]> }

    interface IntrinsicElements extends HTMLElements, SVGElements, MathMLElements { }
  }
}
