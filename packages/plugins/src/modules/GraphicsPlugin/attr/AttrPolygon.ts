import * as Cesium from 'cesium'
import { cartesians2lonlats, cartesian2lonlat, lonlats2cartesians } from '@auto-cesium/shared'
import { bezierSpline } from '@turf/turf'
import type { PolylineEntity, GeoJSONFeatureBase } from './AttrPolyline'
import { LineFlowMaterial, CircleWaveMaterial } from '../../MaterialPlugin'

// Type definitions
export interface StyleConfig {
  [key: string]: unknown
  color?: string
  opacity?: number
  outlineOpacity?: number
  outlineColor?: string
  extrudedHeight?: number | Cesium.Property
  clampToGround?: boolean
  stRotation?: number
  fillType?: 'color' | 'image' | 'grid' | 'checkerboard' | 'stripe' | 'animationLine' | 'animationCircle'
  material?: Cesium.MaterialProperty | Cesium.Color
  grid_lineCount?: number
  grid_lineThickness?: number
  grid_cellAlpha?: number
  checkerboard_repeat?: number
  checkerboard_oddcolor?: string
  stripe_oddcolor?: string
  stripe_repeat?: number
  animationDuration?: number
  animationImage?: string
  animationRepeatX?: number
  animationRepeatY?: number
  animationAxisY?: boolean
  animationGradient?: number
  animationCount?: number
  randomColor?: boolean
  image?: string
  bgUrl?: string
  bgColor?: string
  minimumRed?: number
  maximumRed?: number
  minimumGreen?: number
  maximumGreen?: number
  minimumBlue?: number
  maximumBlue?: number
}

export interface EntityAttr {
  [key: string]: unknown
  outlineColor?: Cesium.ConstantProperty
  extrudedHeight?: number | Cesium.Property
  perPositionHeight?: boolean
  stRotation?: number | Cesium.Property
  material?: Cesium.MaterialProperty
  hierarchy?: Cesium.PolygonHierarchy | Cesium.Property
  outline?: boolean
  fill?: boolean
  heightReference?: Cesium.HeightReference
  closeTop?: boolean
  closeBottom?: boolean
}

/**
 * Polygon entity interface extending polyline entity
 */
export interface PolygonEntity extends PolylineEntity {
  polygon: {
    hierarchy: Cesium.Property
  }
}

/**
 * Get max height from positions array
 */
function getMaxHeight(positions: Cesium.Cartesian3[]): number {
  let maxHeight = 0
  if (!positions || positions.length === 0) return maxHeight

  for (let i = 0; i < positions.length; i++) {
    const tempCarto = Cesium.Cartographic.fromCartesian(positions[i])
    if (tempCarto.height > maxHeight) {
      maxHeight = tempCarto.height
    }
  }
  return Number(maxHeight.toFixed(2))
}

/**
 * Check if value is a number
 */
function isNumber(obj: unknown): boolean {
  return typeof obj === 'number' && obj.constructor === Number
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
  console.error(
    '[ensureMaterialProperty] Material constructor:',
    material && typeof material === 'object' && material.constructor ? material.constructor.name : 'no constructor'
  )
  console.error(
    '[ensureMaterialProperty] Material keys:',
    material && typeof material === 'object' ? Object.keys(material) : 'not an object'
  )
  return undefined
}

/**
 * Exported validation function for external use
 */
export function validateMaterial(material: unknown): Cesium.MaterialProperty | undefined {
  return ensureMaterialProperty(material)
}

/**
 * Set fill material for polygon
 */
function setFillMaterial(entityattr: EntityAttr, style: StyleConfig): EntityAttr {
  if (style.material) {
    // material property takes priority
    const processedMaterial = ensureMaterialProperty(style.material)
    if (processedMaterial) {
      entityattr.material = processedMaterial
      return entityattr
    }
  }

  if (style.color || style.fillType) {
    const colorString = typeof style.color === 'string' ? style.color : '#FFFF00'
    const color = Cesium.Color.fromCssColorString(colorString).withAlpha(Number(style.opacity ?? 1.0))

    switch (style.fillType) {
      default:
      case 'color': // Solid color fill
        entityattr.material = new Cesium.ColorMaterialProperty(color)
        break
      case 'image': // Image fill
        entityattr.material = new Cesium.ImageMaterialProperty({
          image: typeof style.image === 'string' ? style.image : '',
          color: Cesium.Color.fromCssColorString('#FFFFFF').withAlpha(Number(style.opacity ?? 1.0))
        })
        break
      case 'grid': // Grid
        {
          const lineCount = style.grid_lineCount ?? 8
          const lineThickness = style.grid_lineThickness ?? 2.0
          entityattr.material = new Cesium.GridMaterialProperty({
            color: color,
            cellAlpha: style.grid_cellAlpha ?? 0.1,
            lineCount: new Cesium.Cartesian2(lineCount, lineCount),
            lineThickness: new Cesium.Cartesian2(lineThickness, lineThickness)
          })
        }
        break
      case 'checkerboard': // Checkerboard
        {
          const repeat = style.checkerboard_repeat ?? 4
          const oddColorString =
            typeof style.checkerboard_oddcolor === 'string' ? style.checkerboard_oddcolor : '#ffffff'
          entityattr.material = new Cesium.CheckerboardMaterialProperty({
            evenColor: color,
            oddColor: Cesium.Color.fromCssColorString(oddColorString).withAlpha(Number(style.opacity ?? 1.0)),
            repeat: new Cesium.Cartesian2(repeat, repeat)
          })
        }
        break
      case 'stripe': // Stripe
        {
          const stripeOddColorString = typeof style.stripe_oddcolor === 'string' ? style.stripe_oddcolor : '#ffffff'
          entityattr.material = new Cesium.StripeMaterialProperty({
            evenColor: color,
            oddColor: Cesium.Color.fromCssColorString(stripeOddColorString).withAlpha(Number(style.opacity ?? 1.0)),
            repeat: style.stripe_repeat ?? 6
          })
        }
        break
      case 'animationLine': // Flow line
        if (style.animationImage && typeof style.animationImage === 'string') {
          const bgColorValue =
            style.bgColor && typeof style.bgColor === 'string'
              ? Cesium.Color.fromCssColorString(style.bgColor)
              : undefined
          entityattr.material = new LineFlowMaterial({
            color: color,
            duration: style.animationDuration ?? 2000,
            url: style.animationImage,
            repeat: new Cesium.Cartesian2(style.animationRepeatX ?? 1, style.animationRepeatY ?? 1),
            axisY: style.animationAxisY,
            bgUrl: typeof style.bgUrl === 'string' ? style.bgUrl : undefined,
            bgColor: bgColorValue
          })
        } else {
          // If no image, use default color material
          entityattr.material = new Cesium.ColorMaterialProperty(color)
        }
        break
      case 'animationCircle': // Dynamic circle
        {
          const circleColorString = typeof style.color === 'string' ? style.color : '#FFFF00'
          entityattr.material = new CircleWaveMaterial({
            duration: style.animationDuration ?? 2000,
            color: Cesium.Color.fromCssColorString(circleColorString).withAlpha(Number(style.opacity ?? 1.0)),
            gradient: style.animationGradient ?? 0,
            count: style.animationCount ?? 1
          })
        }
        break
    }
  }

  // If no material is set, default to random color
  if (entityattr.material == null || style.randomColor) {
    entityattr.material = new Cesium.ColorMaterialProperty(
      Cesium.Color.fromRandom({
        minimumRed: style.minimumRed ?? 0.0,
        maximumRed: style.maximumRed ?? 0.75,
        minimumGreen: style.minimumGreen ?? 0.0,
        maximumGreen: style.maximumGreen ?? 0.75,
        minimumBlue: style.minimumBlue ?? 0.0,
        maximumBlue: style.maximumBlue ?? 0.75,
        alpha: style.opacity ?? 1.0
      })
    )
  }

  return entityattr
}

/**
 * Convert style configuration to entity attributes
 * @param style - Style configuration object
 * @param entityattr - Entity attributes object (optional)
 * @returns Entity attributes with applied style
 */
export function style2Entity(style?: StyleConfig, entityattr?: EntityAttr): EntityAttr {
  style = style || {}

  if (entityattr == null) {
    // Default values
    entityattr = {}
  }

  // Apply Style to Entity
  for (const key in style) {
    const value = style[key]
    switch (key) {
      default: // Direct assignment
        entityattr[key] = value
        break
      case 'color': // Skip parameters for extended properties
      case 'opacity':
      case 'outlineOpacity':
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
        break
      case 'outlineColor': // Outline color
        {
          const outlineColorValue =
            typeof value === 'string' ? value : typeof style.color === 'string' ? style.color : '#FFFF00'
          entityattr.outlineColor = new Cesium.ConstantProperty(
            Cesium.Color.fromCssColorString(outlineColorValue).withAlpha(style.outlineOpacity ?? style.opacity ?? 1.0)
          )
        }
        break
      case 'extrudedHeight': // Height
        if (isNumber(value)) {
          let maxHight = 0
          if (entityattr.hierarchy) {
            const positions = getPositions({ polygon: entityattr } as PolygonEntity)
            maxHight = getMaxHeight(positions)
          }
          entityattr.extrudedHeight = Number(value) + maxHight
        } else {
          entityattr.extrudedHeight = value as number | Cesium.Property
        }
        break
      case 'clampToGround': // Clamp to ground
        entityattr.perPositionHeight = !value
        break
      case 'stRotation': // Material rotation angle
        if (typeof value === 'number') {
          entityattr.stRotation = Cesium.Math.toRadians(value)
        }
        break
    }
  }

  // Set fill material
  setFillMaterial(entityattr, style)

  return entityattr
}

/**
 * Get entity coordinates
 * @param entity - Cesium entity object (with polygon property)
 * @param isShowPositions - Whether to get displayed positions (optional)
 * @returns Array of Cartesian3 positions
 */
export function getPositions(entity: PolylineEntity, isShowPositions?: boolean): Cesium.Cartesian3[] {
  if (!isShowPositions && entity._positions_draw && entity._positions_draw.length > 0) return entity._positions_draw // For arrow plotting, get bound data

  const polygonEntity = entity as PolygonEntity
  if (!polygonEntity.polygon || !polygonEntity.polygon.hierarchy) {
    return []
  }

  const time = Cesium.JulianDate.now()
  const arr = polygonEntity.polygon.hierarchy.getValue(time)
  if (arr && arr instanceof Cesium.PolygonHierarchy) return arr.positions
  return arr
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
 * GeoJSON Polygon Feature interface
 */
export interface GeoJSONPolygonFeature extends GeoJSONFeatureBase {
  geometry: {
    type: 'Polygon'
    coordinates: number[][][]
  }
}

/**
 * Convert entity to GeoJSON format
 * @param entity - Cesium entity object
 * @param _coordinates - Optional coordinates (for compatibility with parent class). If boolean, treated as noAdd flag.
 * @returns GeoJSON feature object
 *
 * Note: Returns base GeoJSON type for compatibility with parent class AttrPolyline,
 * but the actual structure is a GeoJSONPolygonFeature
 */
export function toGeoJSON(entity: PolylineEntity, _coordinates?: number[][] | boolean): GeoJSONFeatureBase {
  const coordinates = getCoordinates(entity)

  // Support both signatures: (entity, noAdd?: boolean) and (entity, _coordinates?: number[][])
  // If _coordinates is boolean, treat it as noAdd flag
  const noAdd = typeof _coordinates === 'boolean' ? _coordinates : false

  // Close the polygon by adding the first point at the end (unless noAdd is true)
  if (!noAdd && coordinates.length > 0) {
    coordinates.push(coordinates[0])
  }

  return {
    type: 'Feature',
    properties: entity.attribute || {},
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates]
    }
  } as GeoJSONPolygonFeature
}

/**
 * Convert polygon to curve using bezierSpline algorithm
 * @param _positions_draw - Array of Cartesian3 positions
 * @param closure - Whether to create a closed curve (default: true for polygon)
 * @returns Array of Cartesian3 positions for the curve
 */
export function line2curve(_positions_draw: Cesium.Cartesian3[], closure?: boolean): Cesium.Cartesian3[] {
  const coordinates = _positions_draw.map((position) => cartesian2lonlat(position))

  // For polygon, default to closed curve
  if (closure !== false) {
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
