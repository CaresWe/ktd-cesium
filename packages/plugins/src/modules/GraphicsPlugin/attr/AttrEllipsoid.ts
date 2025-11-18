import * as Cesium from 'cesium'
import { cartesian2lonlat } from '@ktd-cesium/shared'
import * as globe from './globe'

/**
 * 椭球体样式接口
 */
export interface EllipsoidStyle {
  opacity?: number
  outlineOpacity?: number
  outlineColor?: string
  color?: string
  extentRadii?: number
  widthRadii?: number
  heightRadii?: number
  material?: Cesium.MaterialProperty
  fillType?: 'color' | 'image' | 'grid' | 'checkerboard' | 'stripe'
  image?: string
  randomColor?: boolean
  grid_lineCount?: number
  grid_lineThickness?: number
  grid_cellAlpha?: number
  checkerboard_repeat?: number
  checkerboard_oddcolor?: string
  stripe_repeat?: number
  stripe_oddcolor?: string
  minimumRed?: number
  maximumRed?: number
  minimumGreen?: number
  maximumGreen?: number
  minimumBlue?: number
  maximumBlue?: number
  [key: string]: unknown
}

/**
 * 椭球体 Entity 属性接口
 */
export interface EllipsoidEntityAttr {
  fill?: boolean
  outlineColor?: Cesium.Color
  material?: Cesium.Color | Cesium.MaterialProperty
  radii?: Cesium.Cartesian3
  [key: string]: unknown
}

/**
 * 样式赋值到 entity
 */
export function style2Entity(style?: EllipsoidStyle, entityattr?: EllipsoidEntityAttr): EllipsoidEntityAttr {
  const finalStyle = style || {}

  if (entityattr == null) {
    entityattr = {
      fill: true
    }
  }

  // Style 赋值到 Entity
  for (const key in finalStyle) {
    const value = finalStyle[key]

    switch (key) {
      default:
        entityattr[key] = value
        break
      case 'opacity':
      case 'outlineOpacity':
      case 'widthRadii':
      case 'heightRadii':
        break
      case 'outlineColor':
        entityattr.outlineColor = Cesium.Color.fromCssColorString((value as string) || '#FFFF00').withAlpha(
          finalStyle.outlineOpacity || finalStyle.opacity || 1.0
        )
        break
      case 'color':
        entityattr.material = Cesium.Color.fromCssColorString((value as string) || '#FFFF00').withAlpha(
          Number(finalStyle.opacity || 1.0)
        )
        break
      case 'extentRadii': // 球体长宽高半径
        const extentRadii = finalStyle.extentRadii || 100
        const widthRadii = finalStyle.widthRadii || 100
        const heightRadii = finalStyle.heightRadii || 100
        entityattr.radii = new Cesium.Cartesian3(extentRadii, widthRadii, heightRadii)
        break
    }
  }

  globe.setFillMaterial(entityattr, finalStyle)
  return entityattr
}

export function getPositions(entity: Cesium.Entity): Cesium.Cartesian3[] {
  const time = Cesium.JulianDate.now()
  const positionProperty = entity.position
  if (!positionProperty) {
    return []
  }
  const position = positionProperty.getValue(time)
  return position ? [position] : []
}

export function getCoordinates(entity: Cesium.Entity): number[][] {
  const positions = getPositions(entity)
  return positions.map((pos) => cartesian2lonlat(pos))
}

/**
 * GeoJSON Feature 接口
 */
export interface GeoJSONFeature {
  type: 'Feature'
  properties: Record<string, unknown>
  geometry: {
    type: 'Point'
    coordinates: number[]
  }
}

/**
 * Entity 扩展接口，包含 attribute 属性
 */
interface EntityWithAttribute extends Cesium.Entity {
  attribute?: Record<string, unknown>
}

export function toGeoJSON(entity: Cesium.Entity): GeoJSONFeature {
  const coordinates = getCoordinates(entity)
  const entityWithAttr = entity as EntityWithAttribute
  return {
    type: 'Feature',
    properties: entityWithAttr.attribute || {},
    geometry: { type: 'Point', coordinates: coordinates.length > 0 ? coordinates[0] : [] }
  }
}
