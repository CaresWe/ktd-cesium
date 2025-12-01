import * as Cesium from 'cesium'
import { cartesians2lonlats, cartesian2lonlat, lonlats2cartesians } from '@ktd-cesium/shared'
import { bezierSpline } from '@turf/turf'

// Type definitions
/**
 * 折线样式配置接口
 */
export interface PolylineStyleConfig {
  clampToGround?: boolean
  lineType?: 'solid' | 'dash' | 'glow' | 'arrow' | 'animation'
  color?: string
  opacity?: number
  outline?: boolean
  outlineWidth?: number
  outlineColor?: string
  outlineOpacity?: number
  flowDuration?: number
  flowImage?: string
  dashLength?: number
  glowPower?: number
  material?: Cesium.MaterialProperty
  depthFail?: boolean
  depthFailColor?: string
  depthFailOpacity?: number
  animationDuration?: number
  animationImage?: string
  animationRepeatX?: number
  animationRepeatY?: number
  width?: number
  [key: string]: unknown
}

/**
 * 折线 Entity 属性接口
 */
export interface PolylineEntityAttr {
  arcType?: Cesium.ArcType
  material?: Cesium.MaterialProperty
  depthFailMaterial?: Cesium.ColorMaterialProperty
  width?: number
  [key: string]: unknown
}

/**
 * Entity 扩展接口，包含 polyline 和自定义属性
 */
export interface PolylineEntity {
  polyline: {
    positions: Cesium.PositionProperty
  }
  _positions_draw?: Cesium.Cartesian3[]
  attribute?: Record<string, unknown>
}

/**
 * GeoJSON Feature 基础接口（支持多态 geometry）
 */
export interface GeoJSONFeatureBase {
  type: 'Feature'
  properties: Record<string, unknown>
  geometry: {
    type: string
    coordinates: number[][] | number[][][] | number[]
  }
  [key: string]: unknown
}

/**
 * GeoJSON LineString Feature 接口
 */
export interface GeoJSONFeature extends GeoJSONFeatureBase {
  geometry: {
    type: 'LineString'
    coordinates: number[][]
  }
}

/**
 * Ensure material is a valid MaterialProperty
 */
function ensureMaterialProperty(material: unknown): Cesium.MaterialProperty | undefined {
  if (!material) {
    console.warn('[ensureMaterialProperty] Material is null or undefined')
    return undefined
  }

  // If already a MaterialProperty (has getType method), return directly
  if (typeof (material as Cesium.MaterialProperty).getType === 'function') {
    return material as Cesium.MaterialProperty
  }

  // If it's a Color object, wrap it in ColorMaterialProperty
  if (
    material instanceof Cesium.Color ||
    (typeof material === 'object' &&
      material !== null &&
      'red' in material &&
      'green' in material &&
      'blue' in material &&
      'alpha' in material)
  ) {
    return new Cesium.ColorMaterialProperty(material as Cesium.Color)
  }

  // Other cases, return undefined to avoid errors
  console.error(
    '[ensureMaterialProperty] Invalid material type, expected MaterialProperty or Color. Material:',
    material
  )
  console.error('[ensureMaterialProperty] Material type:', typeof material)
  if (material && typeof material === 'object') {
    console.error(
      '[ensureMaterialProperty] Material constructor:',
      (material as { constructor?: { name: string } }).constructor
        ? (material as { constructor: { name: string } }).constructor.name
        : 'no constructor'
    )
    console.error('[ensureMaterialProperty] Material keys:', Object.keys(material))
  }
  return undefined
}

/**
 * Convert style configuration to entity attributes
 * @param style - Style configuration object
 * @param entityattr - Entity attributes object (optional)
 * @returns Entity attributes with applied style
 */
export function style2Entity(style?: PolylineStyleConfig, entityattr?: PolylineEntityAttr): PolylineEntityAttr {
  const finalStyle = style || {}

  if (entityattr == null) {
    // Default values
    entityattr = {}
  }

  if (finalStyle.clampToGround) {
    entityattr.arcType = Cesium.ArcType.GEODESIC
  }

  // Apply Style to Entity
  for (const key in finalStyle) {
    const value = finalStyle[key]
    switch (key) {
      default: // Direct assignment
        entityattr[key] = value
        break
      case 'lineType': // Skip parameters for extended properties
      case 'color':
      case 'opacity':
      case 'outline':
      case 'outlineWidth':
      case 'outlineColor':
      case 'outlineOpacity':
      case 'flowDuration':
      case 'flowImage':
      case 'dashLength':
      case 'glowPower':
      case 'grid_lineCount':
      case 'grid_lineThickness':
      case 'grid_cellAlpha':
      case 'checkerboard_repeat':
      case 'checkerboard_oddcolor':
      case 'stripe_oddcolor':
      case 'stripe_repeat':
      case 'animationDuration':
      case 'animationImage':
      case 'animationRepeatX':
      case 'animationRepeatY':
      case 'animationAxisY':
      case 'animationGradient':
      case 'animationCount':
      case 'randomColor':
      case 'depthFailColor':
      case 'depthFailOpacity':
        break
      case 'depthFail':
        if (value) {
          entityattr.depthFailMaterial = new Cesium.ColorMaterialProperty(
            Cesium.Color.fromCssColorString(finalStyle.depthFailColor || '#FFFF00').withAlpha(
              Number(finalStyle.depthFailOpacity ?? finalStyle.opacity ?? 0.9)
            )
          )
          if (finalStyle.opacity === 1.0) finalStyle.opacity = 0.9 // When opaque, depthFailMaterial doesn't display?!
        } else {
          entityattr.depthFailMaterial = undefined
        }
        break
    }
  }

  if (finalStyle.color || finalStyle.lineType) {
    const color = Cesium.Color.fromCssColorString(finalStyle.color || '#FFFF00').withAlpha(
      Number(finalStyle.opacity ?? 1.0)
    )

    switch (finalStyle.lineType) {
      default:
      case 'solid': // Solid line
        if (finalStyle.outline) {
          // With outline color
          entityattr.material = new Cesium.PolylineOutlineMaterialProperty({
            color: color,
            outlineWidth: Number(finalStyle.outlineWidth || 1.0),
            outlineColor: Cesium.Color.fromCssColorString(finalStyle.outlineColor || '#FFFF00').withAlpha(
              Number(finalStyle.outlineOpacity || finalStyle.opacity || 1.0)
            )
          })
        } else {
          entityattr.material = new Cesium.ColorMaterialProperty(color)
        }
        break
      case 'dash': // Dashed line
        if (finalStyle.outline) {
          // With outline color
          entityattr.material = new Cesium.PolylineDashMaterialProperty({
            dashLength: finalStyle.dashLength || finalStyle.outlineWidth || 16.0,
            color: color,
            gapColor: Cesium.Color.fromCssColorString(finalStyle.outlineColor || '#FFFF00').withAlpha(
              Number(finalStyle.outlineOpacity || finalStyle.opacity || 1.0)
            )
          })
        } else {
          entityattr.material = new Cesium.PolylineDashMaterialProperty({
            dashLength: finalStyle.dashLength || 16.0,
            color: color
          })
        }
        break
      case 'glow': // Glow line
        entityattr.material = new Cesium.PolylineGlowMaterialProperty({
          glowPower: finalStyle.glowPower || 0.1,
          color: color
        })
        break
      case 'arrow': // Arrow line
        entityattr.material = new Cesium.PolylineArrowMaterialProperty(color)
        break
      case 'animation': // Flow line
        if (finalStyle.animationImage) {
          // Note: LineFlowMaterial needs to be implemented or imported
          // For now, using ColorMaterialProperty as fallback
          // const repeatX = finalStyle.animationRepeatX ?? 1;
          // const repeatY = finalStyle.animationRepeatY ?? 1;
          entityattr.material = new Cesium.ColorMaterialProperty(color)
          console.warn('LineFlowMaterial is not implemented, using ColorMaterialProperty as fallback')
        } else {
          // If no image, use default color material
          entityattr.material = new Cesium.ColorMaterialProperty(color)
        }
        break
    }
  }

  // Material takes priority
  if (finalStyle.material) {
    const processedMaterial = ensureMaterialProperty(finalStyle.material)
    if (processedMaterial) {
      entityattr.material = processedMaterial
    }
  }

  return entityattr
}

/**
 * Get entity coordinates
 * @param entity - Cesium entity object
 * @param isShowPositions - Whether to get displayed positions (optional)
 * @returns Array of Cartesian3 positions
 */
export function getPositions(entity: PolylineEntity, isShowPositions?: boolean): Cesium.Cartesian3[] {
  if (!isShowPositions && entity._positions_draw && entity._positions_draw.length > 0) return entity._positions_draw // For curved lines, get bound data

  const time = Cesium.JulianDate.now()
  const positions = entity.polyline.positions.getValue(time)
  if (Array.isArray(positions)) {
    return positions as Cesium.Cartesian3[]
  }
  return []
}

/**
 * Get entity coordinates in GeoJSON format
 * @param entity - Cesium entity object
 * @returns Array of coordinate arrays [longitude, latitude, height]
 */
export function getCoordinates(entity: PolylineEntity): number[][] {
  const positions = getPositions(entity)
  const coordinates = cartesians2lonlats(positions)
  return coordinates
}

/**
 * Convert entity to GeoJSON format
 * @param entity - Cesium entity object
 * @param coordinates - Optional coordinates (unused parameter for compatibility)
 * @returns GeoJSON feature object
 */
export function toGeoJSON(entity: PolylineEntity, _coordinates?: number[][]): GeoJSONFeatureBase {
  const coords = getCoordinates(entity)
  return {
    type: 'Feature',
    properties: entity.attribute || {},
    geometry: {
      type: 'LineString',
      coordinates: coords
    }
  } as GeoJSONFeature
}

/**
 * Convert polyline to curve using bezierSpline algorithm
 * @param _positions_draw - Array of Cartesian3 positions
 * @param closure - Whether to create a closed curve
 * @returns Array of Cartesian3 positions for the curve
 */
export function line2curve(_positions_draw: Cesium.Cartesian3[], closure?: boolean): Cesium.Cartesian3[] {
  const coordinates = _positions_draw.map((position) => cartesian2lonlat(position))
  if (closure) {
    // Closed curve
    coordinates.push(coordinates[0])
  }
  const defHeight = coordinates[coordinates.length - 1][2]

  const curved = bezierSpline({
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: coordinates
    }
  })
  const _positions_show = lonlats2cartesians(curved.geometry.coordinates, defHeight)
  return _positions_show
}
