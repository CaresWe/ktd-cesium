import * as Cesium from 'cesium'
import { cartesian2lonlat } from '@ktd-cesium/shared'
import * as globe from './globe'

// Type definitions
/**
 * 盒子样式配置接口
 */
export interface BoxStyleConfig {
  opacity?: number
  outlineOpacity?: number
  outlineColor?: string
  color?: string
  dimensionsX?: number
  dimensionsY?: number
  dimensionsZ?: number
  distanceDisplayCondition?: boolean
  distanceDisplayCondition_near?: number
  distanceDisplayCondition_far?: number
  clampToGround?: boolean
  heightReference?: string | Cesium.HeightReference
  [key: string]: unknown
}

/**
 * 盒子 Entity 属性接口
 */
export interface BoxEntityAttr {
  outlineColor?: Cesium.ConstantProperty
  material?: Cesium.ColorMaterialProperty
  dimensions?: Cesium.Cartesian3
  distanceDisplayCondition?: Cesium.DistanceDisplayCondition
  heightReference?: Cesium.HeightReference
  [key: string]: unknown
}

/**
 * Entity 扩展接口，包含 attribute 属性
 */
export interface EntityWithAttribute {
  position?: Cesium.PositionProperty
  attribute?: Record<string, unknown>
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
 * 样式赋值到 entity
 */
export function style2Entity(style?: BoxStyleConfig, entityattr?: BoxEntityAttr | Cesium.BoxGraphics): BoxEntityAttr {
  const finalStyle = style || {}

  if (entityattr == null) {
    entityattr = {}
  }

  // Convert to a type we can safely manipulate
  const attr = entityattr as Record<string, unknown>

  // Style 赋值到 Entity
  for (const key in finalStyle) {
    const value = finalStyle[key]

    switch (key) {
      default:
        attr[key] = value
        break
      case 'opacity':
      case 'outlineOpacity':
      case 'dimensionsY':
      case 'dimensionsZ':
      case 'distanceDisplayCondition_far':
      case 'distanceDisplayCondition_near':
        break
      case 'outlineColor':
        {
          const colorString = typeof value === 'string' ? value : '#FFFF00'
          const outlineAlpha =
            typeof finalStyle.outlineOpacity === 'number'
              ? finalStyle.outlineOpacity
              : typeof finalStyle.opacity === 'number'
                ? finalStyle.opacity
                : 1.0
          attr.outlineColor = new Cesium.ConstantProperty(
            Cesium.Color.fromCssColorString(colorString).withAlpha(outlineAlpha)
          )
        }
        break
      case 'color':
        {
          const colorString = typeof value === 'string' ? value : '#FFFF00'
          const colorAlpha = typeof finalStyle.opacity === 'number' ? finalStyle.opacity : 1.0
          attr.material = new Cesium.ColorMaterialProperty(
            Cesium.Color.fromCssColorString(colorString).withAlpha(colorAlpha)
          )
        }
        break
      case 'dimensionsX':
        {
          const dimensionsX = typeof finalStyle.dimensionsX === 'number' ? finalStyle.dimensionsX : 100.0
          const dimensionsY = typeof finalStyle.dimensionsY === 'number' ? finalStyle.dimensionsY : 100.0
          const dimensionsZ = typeof finalStyle.dimensionsZ === 'number' ? finalStyle.dimensionsZ : 100.0
          attr.dimensions = new Cesium.Cartesian3(dimensionsX, dimensionsY, dimensionsZ)
        }
        break
      case 'distanceDisplayCondition':
        if (value) {
          attr.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(
            Number(finalStyle.distanceDisplayCondition_near ?? 0),
            Number(finalStyle.distanceDisplayCondition_far ?? 100000)
          )
        } else {
          attr.distanceDisplayCondition = undefined
        }
        break
      case 'clampToGround':
        if (value) {
          attr.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND
        } else {
          attr.heightReference = Cesium.HeightReference.NONE
        }
        break
      case 'heightReference':
        switch (value) {
          case 'NONE':
            attr.heightReference = Cesium.HeightReference.NONE
            break
          case 'CLAMP_TO_GROUND':
            attr.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND
            break
          case 'RELATIVE_TO_GROUND':
            attr.heightReference = Cesium.HeightReference.RELATIVE_TO_GROUND
            break
          default:
            attr.heightReference = value as Cesium.HeightReference
            break
        }
        break
    }
  }

  globe.setFillMaterial(attr, finalStyle)
  return attr as BoxEntityAttr
}

/**
 * 获取 entity 的坐标
 */
export function getPositions(entity: EntityWithAttribute): Cesium.Cartesian3[] {
  const time = Cesium.JulianDate.now()
  const position = entity.position?.getValue(time)
  return position ? [position] : []
}

/**
 * 获取 entity 的坐标（geojson 规范的格式）
 */
export function getCoordinates(entity: EntityWithAttribute): number[][] {
  const positions = getPositions(entity)
  return positions.map((pos) => cartesian2lonlat(pos))
}

/**
 * entity 转 geojson
 */
export function toGeoJSON(entity: EntityWithAttribute): GeoJSONFeature {
  const coordinates = getCoordinates(entity)
  return {
    type: 'Feature',
    properties: entity.attribute || {},
    geometry: { type: 'Point', coordinates: coordinates.length > 0 ? coordinates[0] : [] }
  }
}
