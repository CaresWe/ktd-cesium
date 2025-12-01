import * as Cesium from 'cesium'
import { cartesian2lonlat } from '@ktd-cesium/shared'
import * as globe from './globe'

/**
 * 平面样式配置接口
 */
export interface PlaneStyleConfig {
  opacity?: number
  outlineOpacity?: number
  outlineColor?: string
  color?: string
  dimensionsX?: number
  dimensionsY?: number
  plane_normal?: 'x' | 'y' | 'z'
  plane_distance?: number
  distanceDisplayCondition?: boolean
  distanceDisplayCondition_far?: number
  distanceDisplayCondition_near?: number
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
 * 平面 Entity 属性接口
 */
export interface PlaneEntityAttr {
  outlineColor?: Cesium.Color
  material?: Cesium.Color | Cesium.MaterialProperty
  dimensions?: Cesium.Cartesian2
  plane?: Cesium.Plane
  distanceDisplayCondition?: Cesium.DistanceDisplayCondition
  [key: string]: unknown
}

/**
 * 样式赋值到 entity
 */
export function style2Entity(style?: PlaneStyleConfig, entityattr?: PlaneEntityAttr): PlaneEntityAttr {
  const finalStyle = style || {}

  if (entityattr == null) {
    entityattr = {}
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
      case 'dimensionsY':
      case 'plane_distance':
      case 'distanceDisplayCondition_far':
      case 'distanceDisplayCondition_near':
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
      case 'dimensionsX': {
        const dimensionsX = finalStyle.dimensionsX || 100.0
        const dimensionsY = finalStyle.dimensionsY || 100.0
        entityattr.dimensions = new Cesium.Cartesian2(dimensionsX, dimensionsY)
        break
      }
      case 'plane_normal': {
        let plane_normal: Cesium.Cartesian3
        switch (value) {
          case 'x':
            plane_normal = Cesium.Cartesian3.UNIT_X
            break
          case 'y':
            plane_normal = Cesium.Cartesian3.UNIT_Y
            break
          default:
            plane_normal = Cesium.Cartesian3.UNIT_Z
            break
        }
        const plane_distance = finalStyle.plane_distance || 0.0
        entityattr.plane = new Cesium.Plane(plane_normal, plane_distance)
        break
      }
      case 'distanceDisplayCondition':
        if (value) {
          entityattr.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(
            Number(finalStyle.distanceDisplayCondition_near || 0),
            Number(finalStyle.distanceDisplayCondition_far || 100000)
          )
        } else {
          entityattr.distanceDisplayCondition = undefined
        }
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
