import * as Cesium from 'cesium'
import { cartesian2lonlat } from '@ktd-cesium/shared'
import * as globe from './globe'

/**
 * 样式赋值到 Entity
 */
export function style2Entity(style: Record<string, unknown>, entityattr?: Cesium.CorridorGraphics.ConstructorOptions): Cesium.CorridorGraphics.ConstructorOptions {
  style = style || {}

  if (entityattr == null) {
    entityattr = {
      fill: true
    }
  }

  // 贴地时，剔除高度相关属性
  if (style.clampToGround) {
    if (style.hasOwnProperty('height')) delete style.height
    if (style.hasOwnProperty('extrudedHeight')) delete style.extrudedHeight
  }

  // Style 赋值到 Entity
  for (const key in style) {
    const value = style[key]

    switch (key) {
      default:
        // 直接赋值
        ;(entityattr as Record<string, unknown>)[key] = value
        break
      case 'opacity': // 跳过扩展其他属性的参数
      case 'outlineOpacity':
        break
      case 'outlineColor': // 边框颜色
        entityattr.outlineColor = new Cesium.ConstantProperty(
          Cesium.Color.fromCssColorString(String(value || '#FFFF00')).withAlpha(
            Number(style.outlineOpacity || style.opacity || 1.0)
          )
        )
        break
      case 'color': // 填充颜色
        entityattr.material = new Cesium.ColorMaterialProperty(
          Cesium.Color.fromCssColorString(String(value || '#FFFF00')).withAlpha(
            Number(style.opacity || 1.0)
          )
        )
        break
      case 'cornerType':
        switch (value) {
          case 'BEVELED':
            entityattr.cornerType = Cesium.CornerType.BEVELED
            break
          case 'MITERED':
            entityattr.cornerType = Cesium.CornerType.MITERED
            break
          case 'ROUNDED':
            entityattr.cornerType = Cesium.CornerType.ROUNDED
            break
          default:
            entityattr.cornerType = value as Cesium.CornerType
            break
        }
        break
    }
  }

  // 设置填充材质
  globe.setFillMaterial(entityattr, style)

  return entityattr
}

/**
 * 获取 entity 的坐标
 */
export function getPositions(entity: Cesium.Entity): Cesium.Cartesian3[] | null {
  const time = Cesium.JulianDate.now()
  return entity.corridor?.positions?.getValue(time) || null
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
    geometry: {
      type: 'LineString',
      coordinates: coordinates
    }
  }
}
