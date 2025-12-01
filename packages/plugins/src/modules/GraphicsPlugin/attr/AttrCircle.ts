import * as Cesium from 'cesium'
import { cartesian2lonlat, isNumber } from '@auto-cesium/shared'
import * as globe from './globe'
import type { GeoJSONFeature } from '../types'

/**
 * 圆形类
 */

/**
 * 样式赋值到 entity
 */
export function style2Entity(
  style: Record<string, unknown>,
  entityattr?: Cesium.EllipseGraphics.ConstructorOptions
): Cesium.EllipseGraphics.ConstructorOptions {
  style = style || {}

  if (entityattr == null) {
    // 默认值
    entityattr = {
      fill: true
    }
  }

  // 贴地时，剔除高度相关属性
  if (style.clampToGround) {
    if (Object.prototype.hasOwnProperty.call(style, 'height')) delete style.height
    if (Object.prototype.hasOwnProperty.call(style, 'extrudedHeight')) delete style.extrudedHeight
  }

  // Style 赋值到 Entity
  for (const key in style) {
    const value = style[key]

    switch (key) {
      default:
        // 直接赋值
        ;(entityattr as Record<string, unknown>)[key] = value
        break
      case 'opacity': // 透明度相关属性
      case 'outlineOpacity':
      case 'color':
      case 'animation':
        break
      case 'outlineColor': // 边框颜色
        entityattr.outlineColor = new Cesium.ConstantProperty(
          Cesium.Color.fromCssColorString(String(value || '#FFFF00')).withAlpha(
            Number(style.outlineOpacity ?? style.opacity ?? 1.0)
          )
        )
        break
      case 'rotation': // 旋转角度
        entityattr.rotation = Cesium.Math.toRadians(Number(value))
        if (!style.stRotation) entityattr.stRotation = Cesium.Math.toRadians(Number(value))
        break
      case 'stRotation':
        entityattr.stRotation = Cesium.Math.toRadians(Number(value))
        break
      case 'height':
        entityattr.height = Number(value)
        if (style.extrudedHeight && style.extrudedHeight) {
          entityattr.extrudedHeight = Number(style.extrudedHeight) + Number(value)
        }
        break
      case 'extrudedHeight':
        if (isNumber(value)) {
          entityattr.extrudedHeight =
            Number((entityattr as Record<string, unknown>).height || style.height || 0) + Number(value)
        } else {
          entityattr.extrudedHeight = Number(value)
        }
        break
      case 'radius': // 半径
        entityattr.semiMinorAxis = Number(value)
        entityattr.semiMajorAxis = Number(value)
        break
    }
  }

  // 填充材质
  globe.setFillMaterial(entityattr as unknown as Record<string, unknown>, style)

  return entityattr
}
/**
 * 获取 entity 的坐标
 */
export function getPositions(entity: Cesium.Entity, time?: Cesium.JulianDate): Cesium.Cartesian3[] {
  const position = entity.position?.getValue(time || Cesium.JulianDate.now())
  return position ? [position] : []
}

/**
 * 获取 entity 的坐标（geojson 规范的格式）
 */
export function getCoordinates(entity: Cesium.Entity): number[][] {
  const positions = getPositions(entity)
  const coordinates = positions.map((pos) => {
    const lonlat = cartesian2lonlat(pos)
    return lonlat
  })
  return coordinates
}

/**
 * entity 转 geojson
 */
export function toGeoJSON(entity: Cesium.Entity): GeoJSONFeature {
  const coordinates = getCoordinates(entity)
  const entityExt = entity as Cesium.Entity & { attribute?: Record<string, unknown> }
  return {
    type: 'Feature',
    properties: entityExt.attribute || {},
    geometry: { type: 'Point', coordinates: coordinates.length > 0 ? coordinates[0] : [] }
  }
}

/**
 * 计算椭圆（圆）的外边界坐标数组
 */
export function getEllipseOuterPositions(options: {
  position: Cesium.Cartesian3
  semiMajorAxis: number
  semiMinorAxis: number
  rotation?: number
  count?: number
}): Cesium.Cartesian3[] {
  const { position, semiMajorAxis, semiMinorAxis, rotation = 0, count = 90 } = options

  // 使用 Cesium 内部 API 计算椭圆边界点
  const cesiumInternal = Cesium as unknown as {
    EllipseGeometryLibrary: {
      computeEllipsePositions: (
        options: {
          center: Cesium.Cartesian3
          semiMajorAxis: number
          semiMinorAxis: number
          rotation: number
          granularity: number
        },
        flag1: boolean,
        flag2: boolean
      ) => { outerPositions: number[] } | undefined
    }
  }

  const cep = cesiumInternal.EllipseGeometryLibrary.computeEllipsePositions(
    {
      center: position,
      semiMajorAxis: semiMajorAxis,
      semiMinorAxis: semiMinorAxis,
      rotation: rotation,
      granularity: 0.02
    },
    false,
    true
  )

  if (!cep || !cep.outerPositions) return []

  const positions: Cesium.Cartesian3[] = []
  const step = Math.ceil(cep.outerPositions.length / 3 / count)

  for (let i = 0; i < cep.outerPositions.length; i += step * 3) {
    const cartesian = new Cesium.Cartesian3(cep.outerPositions[i], cep.outerPositions[i + 1], cep.outerPositions[i + 2])
    positions.push(cartesian)
  }

  return positions
}

/**
 * 获取 entity 的外边界坐标
 */
export function getOutlinePositions(entity: Cesium.Entity, noAdd?: boolean, count?: number): Cesium.Cartesian3[] {
  const time = Cesium.JulianDate.now()

  const position = entity.position?.getValue(time)
  const entityExt = entity as Cesium.Entity & {
    ellipse?: {
      semiMajorAxis?: Cesium.Property
      semiMinorAxis?: Cesium.Property
      rotation?: Cesium.Property
    }
  }
  const semiMajorAxis = entityExt.ellipse?.semiMajorAxis?.getValue(time)
  const semiMinorAxis = entityExt.ellipse?.semiMinorAxis?.getValue(time)
  const rotation = entityExt.ellipse?.rotation?.getValue(time) || 0

  if (!position || !semiMajorAxis || !semiMinorAxis) return []

  // 计算椭圆（圆）的外边界坐标数组
  const outerPositions = getEllipseOuterPositions({
    position,
    semiMajorAxis,
    semiMinorAxis,
    rotation,
    count: count ?? 90
  })

  if (!noAdd && outerPositions.length > 0) {
    outerPositions.push(outerPositions[0])
  }

  return outerPositions
}

/**
 * 获取 entity 的外边界坐标（geojson 规范的格式）
 */
export function getOutlineCoordinates(entity: Cesium.Entity, noAdd?: boolean, count?: number): number[][] {
  const positions = getOutlinePositions(entity, noAdd, count)
  const coordinates = positions.map((pos) => {
    const lonlat = cartesian2lonlat(pos)
    return lonlat
  })
  return coordinates
}
