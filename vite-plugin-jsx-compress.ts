// vite-plugin-jsx-compress.ts

import * as babel from "@babel/core"
import { generate } from "@babel/generator"
import parser from "@babel/parser"
import * as t from "@babel/types"
import { Plugin } from "vite"

export default function jsxCompressPlugin(): Plugin {
  return {
    name: "vite-plugin-jsx-compress",
    enforce: "pre",
    
    async transform(code: string, id: string) {
      if (!/\.(jsx|tsx)$/.test(id)) {
        return null 
      }
      
      let ast: any
      try {
        ast = parser.parse(code, {
          sourceType: "module",
          plugins: ["jsx", "typescript"]
        })
      } catch (e: any) {
        return { code, map: null } 
      }

      babel.traverse(ast, {
        JSXAttribute(path) {
          // Only rename for DOM elements (not custom components)
          const parent = path.parentPath && path.parentPath.parent
          if (
            parent &&
            t.isJSXOpeningElement(parent) &&
            t.isJSXIdentifier(parent.name) &&
            /^[a-z]/.test(parent.name.name)
          ) {
            if (t.isJSXIdentifier(path.node.name)) {
              if (path.node.name.name === "className") path.node.name.name = "cn"
              if (path.node.name.name === "tabIndex") path.node.name.name = "ti"
              if (path.node.name.name === "htmlFor") path.node.name.name = "f"
            }
          }
        },
        JSXOpeningElement(path) {
          if (t.isJSXIdentifier(path.node.name) && path.node.name.name === "div") {
            path.node.name.name = "d"
          }
        },
        JSXClosingElement(path) {
          if (t.isJSXIdentifier(path.node.name) && path.node.name.name === "div") {
            path.node.name.name = "d"
          }
        }
      })

      const output = generate(ast, { retainLines: true, comments: true }, code)
      
      // Return the transformed JSX code to the next plugin (JSX-to-JS compiler)
      return {
        code: output.code,
        map: output.map
      }
    }
  }
}