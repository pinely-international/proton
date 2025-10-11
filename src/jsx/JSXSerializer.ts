import { AsyncFunction, AsyncGeneratorFunction } from "@/BuiltinObjects"
import WebInflator from "@/Inflator/web/WebInflator"
import { kebabCase } from "@/utils/string"
import { isIterable, isJSX, isObservableGetter, isRecord } from "@/utils/testers"

// Reverse mapping for compressed attribute names
const reverseMap: Record<string, string> = {
  cn: "class",
  ti: "tabIndex",
  f: "for",
  className: "class"
}
// Reverse mapping for compressed element names
const elementReverseMap: Record<string, string> = {
  d: "div"
  // Add more compressed element mappings here if needed
}
// Helper to get original element type
const getOriginalType = (t: any) => elementReverseMap[String(t)] || String(t)


class WebJSXSerializer {
  private inflator?: WebInflator
  /** Inherits customization and options applied to `inflator`. */
  inherit(inflator: WebInflator) {
    inflator.flags.skipAsync = true
    this.inflator = inflator
  }

  toString(value: unknown): string {
    if (value == null) return ""
    if (value instanceof Array) return this.arrayLikeToString(value)

    if (value instanceof Element) return value.outerHTML
    if (value instanceof DocumentFragment) return this.arrayLikeToString(value.childNodes)
    if (value instanceof Node) return value.textContent ?? ""

    if (isObservableGetter(value)) return String(value.get())
    if (isIterable(value)) return this.iterableToString(value)

    if (isJSX(value)) {
      if (value.type instanceof Function) {
        return this.componentToString(value.type, value.props)
      }
      return this.jsxToString(value)
    }

    if (value instanceof Object) {
      throw new TypeError("JSX Child can't be object: " + value.constructor)
    }
    return String(value)
  }

  private arrayLikeToString(arrayLike: ArrayLike<unknown>) {
    let children = "", i = 0
    const l = arrayLike.length
    for (; i < l; i++) {
      children += this.toString(arrayLike[i])
    }
    return children
  }

  private iterableToString(iterable: Iterable<unknown>) {
    let children = "", child
    for (child of iterable) {
      children += this.toString(child)
    }
    return children
  }

  private styleToString(style: unknown): string {
    if (isRecord(style)) {
      let styleString = ""
      for (const propertyName in style) {
        const key = kebabCase(propertyName)
        const value = this.gettable(style[propertyName])

        styleString += key + ":" + value + ";"
      }

      return styleString
    }

    return String(style)
  }

  private gettable(value: unknown): unknown {
    if (isObservableGetter(value)) return value.get()
    return value
  }

  private applyCustomJSXAttributes(props: any) {
    if (this.inflator == null) return
    if (this.inflator.jsxAttributes.size === 0) return

    const bind = (key: string, value: unknown) => {
      props[key] = this.gettable(value)
    }

    for (const key of this.inflator.jsxAttributes.keys()) {
      if (key in props === false) continue

      const attributeSetup = this.inflator.jsxAttributes.get(key)!
      attributeSetup({ props, key, value: props[key], bind })
    }
  }

  jsxAttributesToString(props: any): string {
    if (props == null) return ""

    this.applyCustomJSXAttributes(props)

    let attributes = "", key, value
    // Use module-level reverseMap for compressed attribute names
    for (key in props) {
      if (key === "on") continue
      if (key === "ns") continue
      if (key === "children") continue

      if (this.inflator?.jsxAttributes.has(key)) continue

      value = props[key]
      if (value == null) continue

      // Map short names back to HTML attribute names
      const htmlKey = reverseMap[key] || key
      if (htmlKey === "style") value = this.styleToString(value)

      value = this.gettable(value)
      if (value == null) continue

      attributes += " " + htmlKey + "=\"" + value + "\""
    }
    return attributes
  }

  jsxToString(jsx: JSX.Element): string {
    if (jsx.props == null) {
      const type = getOriginalType(jsx.type)
      if (selfClosingTags.has(type)) {
        return "<" + type + "/>"
      }
      return "<" + type + "></" + type + ">"
    }

    // Skip for SEO + better visual.
    if (jsx.props["data-nosnippet"] === true) return ""
    if (jsx.props["data-nosnippet"] === "true") return ""

    const children = this.toString(jsx.props.children)
    if (jsx.type.constructor === Symbol) return children

    const type = getOriginalType(jsx.type)
    const attributes = this.jsxAttributesToString(jsx.props)

    if (selfClosingTags.has(type)) {
      return "<" + type + attributes + "/>"
    }
    if (children.length === 0) {
      return "<" + type + attributes + "></" + type + ">"
    }
    return "<" + type + attributes + ">" + children + "</" + type + ">"
  }

  componentToString(factory: Function, props?: any) {
    if (factory instanceof AsyncFunction.constructor) return ""
    if (factory instanceof AsyncGeneratorFunction.constructor) return ""

    return this.toString(factory.call(undefined, props))
  }
}

export default WebJSXSerializer


const selfClosingTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"])
