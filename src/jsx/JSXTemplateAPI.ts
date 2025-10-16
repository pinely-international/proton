/**
 * JSX Template API for marking dynamic zones and optimizing template rendering
 */

declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      /**
       * Mark this element as a dynamic zone for template optimization
       * @param zoneId - Unique identifier for the dynamic zone
       */
      "data-proton-zone"?: string
      
      /**
       * Mark this element's children as dynamic
       */
      "data-proton-dynamic-children"?: boolean
      
      /**
       * Mark this element's attributes as dynamic
       */
      "data-proton-dynamic-attrs"?: boolean
    }
  }
}

/**
 * Mark a dynamic zone for template optimization
 */
export function markDynamicZone(zoneId: string) {
  return {
    "data-proton-zone": zoneId,
    "data-proton-dynamic-children": true,
    "data-proton-dynamic-attrs": true
  }
}

/**
 * Mark only children as dynamic
 */
export function markDynamicChildren(zoneId: string) {
  return {
    "data-proton-zone": zoneId,
    "data-proton-dynamic-children": true
  }
}

/**
 * Mark only attributes as dynamic
 */
export function markDynamicAttrs(zoneId: string) {
  return {
    "data-proton-zone": zoneId,
    "data-proton-dynamic-attrs": true
  }
}