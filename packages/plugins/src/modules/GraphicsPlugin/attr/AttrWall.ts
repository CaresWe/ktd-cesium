import * as Cesium from 'cesium'
import { cartesian2lonlat } from '@auto-cesium/shared'
import * as globe from './globe'

/**
 * 墙体样式配置接口
 */
export interface WallStyleConfig {
  opacity?: number
  outlineOpacity?: number
  outlineColor?: string
  color?: string
  materialType?: string
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
  [key: string]: unknown
}

/**
 * 墙体 Entity 属性接口
 */
export interface WallEntityAttr {
  fill?: boolean
  outlineColor?: Cesium.Color
  material?: Cesium.Color | Cesium.MaterialProperty
  [key: string]: unknown
}

/**
 * 样式赋值到 entity
 */
export function style2Entity(style?: WallStyleConfig, entityattr?: WallEntityAttr): WallEntityAttr {
  const finalStyle = style || {}

  if (!entityattr) {
    entityattr = {
      fill: true
    }
  }

  // Style 赋值到 Entity
  for (const key in finalStyle) {
    const value = finalStyle[key]

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
        entityattr.outlineColor = Cesium.Color.fromCssColorString((value as string) || '#FFFF00').withAlpha(
          finalStyle.outlineOpacity || finalStyle.opacity || 1.0
        )
        break
    }
  }

  // 设置填充材质
  globe.setFillMaterial(entityattr, finalStyle)

  return entityattr
}

/**
 * Entity 扩展接口，包含 attribute 和 wall 属性
 */
interface EntityWithExtras extends Omit<Cesium.Entity, 'wall'> {
  attribute?: Record<string, unknown>
  wall?: {
    positions?: Cesium.Property
    [key: string]: unknown
  }
}

/**
 * 获取 entity 的坐标
 */
export function getPositions(entity: Cesium.Entity): Cesium.Cartesian3[] | null {
  const extEntity = entity as EntityWithExtras
  if (!extEntity.wall?.positions) return null

  const time = Cesium.JulianDate.now()
  return extEntity.wall.positions.getValue(time) || null
}

/**
 * 获取 entity 的坐标（geojson 规范的格式）
 */
export function getCoordinates(entity: Cesium.Entity): number[][] | null {
  const positions = getPositions(entity)
  if (!positions) return null

  const coordinates = positions.map((pos) => cartesian2lonlat(pos))
  return coordinates
}

/**
 * GeoJSON Feature 接口
 */
export interface GeoJSONFeature {
  type: 'Feature'
  properties: Record<string, unknown>
  geometry: {
    type: 'LineString'
    coordinates: number[][]
  }
}

/**
 * entity 转 geojson
 */
export function toGeoJSON(entity: Cesium.Entity): GeoJSONFeature {
  const coordinates = getCoordinates(entity)
  const extEntity = entity as EntityWithExtras
  return {
    type: 'Feature',
    properties: extEntity.attribute || {},
    geometry: {
      type: 'LineString',
      coordinates: coordinates || []
    }
  }
}
