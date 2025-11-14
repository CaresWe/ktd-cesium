import * as Cesium from 'cesium'
import { cartesian2lonlat } from '@ktd-cesium/shared'

/**
 * 样式赋值到 entity
 */
export function style2Entity(style: Record<string, unknown>, entityattr?: Cesium.BillboardGraphics.ConstructorOptions): Cesium.BillboardGraphics.ConstructorOptions {
  style = style || {}

  if (entityattr == null) {
    // 默认值
    entityattr = {
      scale: 1,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM
    }
  }

  // Style 赋值到 Entity
  for (const key in style) {
    const value = style[key]

    switch (key) {
      default:
        // 直接赋值
        ;(entityattr as Record<string, unknown>)[key] = value
        break
      case 'scaleByDistance_near': // 跳过扩展其他属性的参数
      case 'scaleByDistance_nearValue':
      case 'scaleByDistance_far':
      case 'scaleByDistance_farValue':
      case 'distanceDisplayCondition_far':
      case 'distanceDisplayCondition_near':
        break
      case 'opacity': // 透明度
        entityattr.color = new Cesium.ConstantProperty(
          Cesium.Color.fromCssColorString('#FFFFFF').withAlpha(Number(value) || 1.0)
        )
        break
      case 'rotation': // 旋转角度
        entityattr.rotation = Cesium.Math.toRadians(Number(value))
        break
      case 'scaleByDistance': // 是否按视距缩放
        if (value) {
          entityattr.scaleByDistance = new Cesium.NearFarScalar(
            Number(style.scaleByDistance_near || 1000),
            Number(style.scaleByDistance_nearValue || 1.0),
            Number(style.scaleByDistance_far || 1000000),
            Number(style.scaleByDistance_farValue || 0.1)
          )
        } else {
          entityattr.scaleByDistance = undefined
        }
        break
      case 'distanceDisplayCondition': // 是否按视距显示
        if (value) {
          entityattr.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(
            Number(style.distanceDisplayCondition_near || 0),
            Number(style.distanceDisplayCondition_far || 100000)
          )
        } else {
          entityattr.distanceDisplayCondition = undefined
        }
        break
      case 'clampToGround': // 贴地
        if (value) {
          entityattr.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND
        } else {
          entityattr.heightReference = Cesium.HeightReference.NONE
        }
        break
      case 'heightReference':
        switch (value) {
          case 'NONE':
            entityattr.heightReference = Cesium.HeightReference.NONE
            break
          case 'CLAMP_TO_GROUND':
            entityattr.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND
            break
          case 'RELATIVE_TO_GROUND':
            entityattr.heightReference = Cesium.HeightReference.RELATIVE_TO_GROUND
            break
          default:
            entityattr.heightReference = value as Cesium.HeightReference
            break
        }
        break
      case 'horizontalOrigin':
        switch (value) {
          case 'CENTER':
            entityattr.horizontalOrigin = Cesium.HorizontalOrigin.CENTER
            break
          case 'LEFT':
            entityattr.horizontalOrigin = Cesium.HorizontalOrigin.LEFT
            break
          case 'RIGHT':
            entityattr.horizontalOrigin = Cesium.HorizontalOrigin.RIGHT
            break
          default:
            entityattr.horizontalOrigin = value as Cesium.HorizontalOrigin
            break
        }
        break
      case 'verticalOrigin':
        switch (value) {
          case 'CENTER':
            entityattr.verticalOrigin = Cesium.VerticalOrigin.CENTER
            break
          case 'TOP':
            entityattr.verticalOrigin = Cesium.VerticalOrigin.TOP
            break
          case 'BOTTOM':
            entityattr.verticalOrigin = Cesium.VerticalOrigin.BOTTOM
            break
          default:
            entityattr.verticalOrigin = value as Cesium.VerticalOrigin
            break
        }
        break
      case 'visibleDepth':
        if (value) {
          entityattr.disableDepthTestDistance = 0
        } else {
          entityattr.disableDepthTestDistance = Number.POSITIVE_INFINITY // 一直显示，不被地形等遮挡
        }
        break
    }
  }

  return entityattr
}

/**
 * 获取 entity 的坐标
 */
export function getPositions(entity: Cesium.Entity): Cesium.Cartesian3[] | null {
  const time = Cesium.JulianDate.now()
  const position = entity.position?.getValue(time)
  return position ? [position] : null
}

/**
 * 获取 entity 的坐标（geojson 规范的格式）
 */
export function getCoordinates(entity: Cesium.Entity): number[][] | null {
  const positions = getPositions(entity)
  if (!positions) return null

  const coordinates = positions.map((pos) => {
    const lonlat = cartesian2lonlat(pos)
    return lonlat
  })
  return coordinates
}

/**
 * entity 转 geojson
 */
export function toGeoJSON(entity: Cesium.Entity): Record<string, unknown> {
  const coordinates = getCoordinates(entity)
  const entityExt = entity as Cesium.Entity & { attribute?: Record<string, unknown> }
  return {
    type: 'Feature',
    properties: entityExt.attribute || {},
    geometry: { type: 'Point', coordinates: coordinates ? coordinates[0] : [] }
  }
}
