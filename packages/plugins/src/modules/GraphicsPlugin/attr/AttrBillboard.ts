import * as Cesium from 'cesium'
import { cartesians2lonlats } from '@ktd-cesium/shared'

// Type definitions
/**
 * Billboard 样式配置接口
 */
export interface BillboardStyleConfig {
  opacity?: number
  rotation?: number
  scaleByDistance?: boolean
  scaleByDistance_near?: number
  scaleByDistance_nearValue?: number
  scaleByDistance_far?: number
  scaleByDistance_farValue?: number
  distanceDisplayCondition?: boolean
  distanceDisplayCondition_near?: number
  distanceDisplayCondition_far?: number
  clampToGround?: boolean
  heightReference?: string | Cesium.HeightReference
  horizontalOrigin?: string | Cesium.HorizontalOrigin
  verticalOrigin?: string | Cesium.VerticalOrigin
  visibleDepth?: boolean
  [key: string]: unknown
}

/**
 * Billboard Entity 属性接口
 */
export interface BillboardEntityAttr {
  scale?: number
  horizontalOrigin?: Cesium.HorizontalOrigin
  verticalOrigin?: Cesium.VerticalOrigin
  color?: Cesium.ConstantProperty
  rotation?: number
  scaleByDistance?: Cesium.NearFarScalar
  distanceDisplayCondition?: Cesium.DistanceDisplayCondition
  heightReference?: Cesium.HeightReference
  disableDepthTestDistance?: number
  [key: string]: unknown
}

/**
 * Entity 扩展接口，包含 attribute 属性
 */
export interface EntityWithAttribute {
  position: Cesium.PositionProperty
  attribute?: Record<string, unknown>
}

/**
 * 样式赋值到 entity
 */
export function style2Entity(
  style?: BillboardStyleConfig,
  entityattr?: BillboardEntityAttr | Cesium.BillboardGraphics
): BillboardEntityAttr {
  const finalStyle = style || {}

  if (entityattr == null) {
    // 默认值
    entityattr = {
      scale: 1,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM
    }
  }

  // Convert to a type we can safely manipulate
  const attr = entityattr as Record<string, unknown>

  // Style 赋值到 Entity
  for (const key in finalStyle) {
    const value = finalStyle[key]

    switch (key) {
      default:
        // 直接赋值
        attr[key] = value
        break
      case 'scaleByDistance_near': // 跳过扩展其他属性的参数
      case 'scaleByDistance_nearValue':
      case 'scaleByDistance_far':
      case 'scaleByDistance_farValue':
      case 'distanceDisplayCondition_far':
      case 'distanceDisplayCondition_near':
        break
      case 'opacity': // 透明度
        attr.color = new Cesium.ConstantProperty(
          Cesium.Color.fromCssColorString('#FFFFFF').withAlpha(
            typeof value === 'number' ? value : 1.0
          )
        )
        break
      case 'rotation': // 旋转角度
        attr.rotation = Cesium.Math.toRadians(Number(value))
        break
      case 'scaleByDistance': // 是否按视距缩放
        if (value) {
          attr.scaleByDistance = new Cesium.NearFarScalar(
            Number(finalStyle.scaleByDistance_near ?? 1000),
            Number(finalStyle.scaleByDistance_nearValue ?? 1.0),
            Number(finalStyle.scaleByDistance_far ?? 1000000),
            Number(finalStyle.scaleByDistance_farValue ?? 0.1)
          )
        } else {
          attr.scaleByDistance = undefined
        }
        break
      case 'distanceDisplayCondition': // 是否按视距显示
        if (value) {
          attr.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(
            Number(finalStyle.distanceDisplayCondition_near ?? 0),
            Number(finalStyle.distanceDisplayCondition_far ?? 100000)
          )
        } else {
          attr.distanceDisplayCondition = undefined
        }
        break
      case 'clampToGround': // 贴地
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
      case 'horizontalOrigin':
        switch (value) {
          case 'CENTER':
            attr.horizontalOrigin = Cesium.HorizontalOrigin.CENTER
            break
          case 'LEFT':
            attr.horizontalOrigin = Cesium.HorizontalOrigin.LEFT
            break
          case 'RIGHT':
            attr.horizontalOrigin = Cesium.HorizontalOrigin.RIGHT
            break
          default:
            attr.horizontalOrigin = value as Cesium.HorizontalOrigin
            break
        }
        break
      case 'verticalOrigin':
        switch (value) {
          case 'CENTER':
            attr.verticalOrigin = Cesium.VerticalOrigin.CENTER
            break
          case 'TOP':
            attr.verticalOrigin = Cesium.VerticalOrigin.TOP
            break
          case 'BOTTOM':
            attr.verticalOrigin = Cesium.VerticalOrigin.BOTTOM
            break
          default:
            attr.verticalOrigin = value as Cesium.VerticalOrigin
            break
        }
        break
      case 'visibleDepth':
        if (value) {
          attr.disableDepthTestDistance = 0
        } else {
          attr.disableDepthTestDistance = Number.POSITIVE_INFINITY // 一直显示，不被地形等遮挡
        }
        break
    }
  }

  return attr as BillboardEntityAttr
}

/**
 * 获取 entity 的坐标
 */
export function getPositions(entity: EntityWithAttribute): Cesium.Cartesian3[] {
  const time = Cesium.JulianDate.now()
  const position = entity.position.getValue(time)
  if (!position) {
    throw new Error('Unable to get position from entity')
  }
  return [position]
}

/**
 * 获取 entity 的坐标（geojson 规范的格式）
 */
export function getCoordinates(entity: EntityWithAttribute): number[][] {
  const positions = getPositions(entity)
  const coordinates = cartesians2lonlats(positions)
  return coordinates
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
 * entity 转 geojson
 */
export function toGeoJSON(entity: EntityWithAttribute): GeoJSONFeature {
  const coordinates = getCoordinates(entity)
  return {
    type: 'Feature',
    properties: entity.attribute || {},
    geometry: { type: 'Point', coordinates: coordinates[0] }
  }
}
