import * as Cesium from 'cesium'
import { cartesian2lonlat } from '@ktd-cesium/shared'

/**
 * 管道体样式配置接口
 */
export interface PolylineVolumeStyleConfig {
  opacity?: number
  outlineOpacity?: number
  outlineColor?: string
  color?: string
  radius?: number
  shape?: 'pipeline' | 'circle' | 'star'
  material?: Cesium.MaterialProperty
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
 * 管道体 Entity 属性接口
 */
export interface PolylineVolumeEntityAttr {
  outlineColor?: Cesium.Color
  material?: Cesium.Color | Cesium.MaterialProperty
  shape?: Cesium.Cartesian2[]
  [key: string]: unknown
}

/**
 * 样式赋值到 entity
 */
export function style2Entity(
  style?: PolylineVolumeStyleConfig,
  entityattr?: PolylineVolumeEntityAttr
): PolylineVolumeEntityAttr {
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
      case 'radius':
      case 'shape':
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
    }
  }

  // 材质优先
  if (finalStyle.material) {
    entityattr.material = finalStyle.material
  }

  // 管道样式
  const radius = finalStyle.radius || 10
  switch (finalStyle.shape) {
    default:
    case 'pipeline':
      entityattr.shape = getCorridorShape1(radius) // 厚度固定为半径的1/3
      break
    case 'circle':
      entityattr.shape = getCorridorShape2(radius)
      break
    case 'star':
      entityattr.shape = getCorridorShape3(radius)
      break
  }

  return entityattr
}

/**
 * 管道形状1【内空管道】radius整个管道的外半径
 */
function getCorridorShape1(radius: number): Cesium.Cartesian2[] {
  const hd = radius / 3
  const startAngle = 0
  const endAngle = 360

  const pss: Cesium.Cartesian2[] = []
  for (let i = startAngle; i <= endAngle; i++) {
    const radians = Cesium.Math.toRadians(i)
    pss.push(new Cesium.Cartesian2(radius * Math.cos(radians), radius * Math.sin(radians)))
  }
  for (let i = endAngle; i >= startAngle; i--) {
    const radians = Cesium.Math.toRadians(i)
    pss.push(new Cesium.Cartesian2((radius - hd) * Math.cos(radians), (radius - hd) * Math.sin(radians)))
  }
  return pss
}

/**
 * 管道形状2【圆柱体】radius整个管道的外半径
 */
function getCorridorShape2(radius: number): Cesium.Cartesian2[] {
  const startAngle = 0
  const endAngle = 360

  const pss: Cesium.Cartesian2[] = []
  for (let i = startAngle; i <= endAngle; i++) {
    const radians = Cesium.Math.toRadians(i)
    pss.push(new Cesium.Cartesian2(radius * Math.cos(radians), radius * Math.sin(radians)))
  }
  return pss
}

/**
 * 管道形状3【星状】radius整个管道的外半径，arms星角的个数（默认6个角）
 */
function getCorridorShape3(radius: number, arms: number = 6): Cesium.Cartesian2[] {
  const angle = Math.PI / arms
  const length = 2 * arms
  const pss: Cesium.Cartesian2[] = new Array(length)
  for (let i = 0; i < length; i++) {
    const r = i % 2 === 0 ? radius : radius / 3
    pss[i] = new Cesium.Cartesian2(Math.cos(i * angle) * r, Math.sin(i * angle) * r)
  }
  return pss
}

/**
 * Entity 扩展接口，包含 attribute 和 _positions_draw 属性
 */
interface EntityWithExtras extends Cesium.Entity {
  attribute?: Record<string, unknown>
  _positions_draw?: Cesium.Cartesian3[]
}

/**
 * 获取 entity 的坐标
 */
export function getPositions(entity: Cesium.Entity): Cesium.Cartesian3[] {
  const extEntity = entity as EntityWithExtras
  if (extEntity._positions_draw && extEntity._positions_draw.length > 0) {
    return extEntity._positions_draw
  }

  const time = Cesium.JulianDate.now()
  return extEntity.polylineVolume?.positions?.getValue(time) || []
}

/**
 * 获取 entity 的坐标（geojson规范的格式）
 */
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
    type: 'LineString'
    coordinates: number[][]
  }
}

/**
 * Entity 转 geojson
 */
export function toGeoJSON(entity: Cesium.Entity): GeoJSONFeature {
  const coordinates = getCoordinates(entity)
  const extEntity = entity as EntityWithExtras
  return {
    type: 'Feature',
    properties: extEntity.attribute || {},
    geometry: {
      type: 'LineString',
      coordinates: coordinates
    }
  }
}
