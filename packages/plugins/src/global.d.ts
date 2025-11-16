/**
 * Global type declarations for plugins package
 */

/**
 * GLSL shader modules
 */
declare module '*.glsl' {
  const content: string
  export default content
}

declare module '*.glsl?raw' {
  const content: string
  export default content
}

/**
 * Vertex shader modules
 */
declare module '*.vert' {
  const content: string
  export default content
}

declare module '*.vert?raw' {
  const content: string
  export default content
}

/**
 * Fragment shader modules
 */
declare module '*.frag' {
  const content: string
  export default content
}

declare module '*.frag?raw' {
  const content: string
  export default content
}

/**
 * Cesium type extensions for internal APIs
 */

/**
 * Material cache interface for managing custom materials
 */
interface CesiumMaterialCache {
  addMaterial(type: string, materialTemplate: {
    fabric: {
      type: string
      uniforms: Record<string, unknown>
      source: string
    }
    translucent?: () => boolean
  }): void
}

/**
 * Extended Material type with static properties
 */
interface CesiumMaterialStatic {
  _materialCache: CesiumMaterialCache
  ColorType: string
  PolylineArrowLinkType: string
  CircleWaveMaterialType: string
  [key: string]: unknown
}
