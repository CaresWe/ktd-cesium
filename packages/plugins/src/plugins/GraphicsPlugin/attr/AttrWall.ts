import * as Cesium from 'cesium'
import { cartesian2lonlat } from '@ktd-cesium/shared'
import * as globe from './globe'

/**
 * 样式赋值到 entity
 */
export function style2Entity(style: any, entityattr?: any): any {
  style = style || {}

  if (!entityattr) {
    entityattr = {
      fill: true
    }
  }

  // Style 赋值到 Entity
  for (const key in style) {
    const value = style[key]

    switch (key) {
      default:
        // 直接赋值
        entityattr[key] = value
        break
      case 'opacity': // 跳过扩展其他属性的参数
      case 'outlineOpacity':
      case 'color':
      case 'materialType':
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
      case 'outlineColor': // 边框颜色
        entityattr.outlineColor = new Cesium.ConstantProperty(
          Cesium.Color.fromCssColorString(value || '#FFFF00').withAlpha(
            style.outlineOpacity || style.opacity || 1.0
          )
        )
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
  return (entity as any).wall.positions.getValue(time)
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
export function toGeoJSON(entity: Cesium.Entity): any {
  const coordinates = getCoordinates(entity)
  return {
    type: 'Feature',
    properties: (entity as any).attribute || {},
    geometry: {
      type: 'LineString',
      coordinates: coordinates
    }
  }
}
