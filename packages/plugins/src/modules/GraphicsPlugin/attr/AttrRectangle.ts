import * as Cesium from 'cesium'
import { cartesian2lonlat } from '@auto-cesium/shared'
import * as globe from './globe'

/**
 * 判断是否为数字
 */
function isNumber(obj: unknown): boolean {
  return typeof obj === 'number' && obj.constructor === Number
}

/**
 * 矩形样式配置接口
 */
export interface RectangleStyleConfig {
  opacity?: number
  outlineOpacity?: number
  outlineColor?: string
  color?: string
  image?: string
  rotation?: number
  stRotation?: number
  height?: number
  extrudedHeight?: number | string
  clampToGround?: boolean
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
 * 矩形 Entity 属性接口
 */
export interface RectangleEntityAttr {
  outlineColor?: Cesium.Color
  material?: Cesium.Color | Cesium.MaterialProperty
  rotation?: number
  stRotation?: number
  height?: number | Cesium.Property
  extrudedHeight?: number | Cesium.Property
  [key: string]: unknown
}

/**
 * 样式赋值到 entity
 */
export function style2Entity(style?: RectangleStyleConfig, entityattr?: RectangleEntityAttr): RectangleEntityAttr {
  const finalStyle = style || {}

  if (entityattr == null) {
    entityattr = {}
  }

  // 贴地时，剔除高度相关属性
  if (finalStyle.clampToGround) {
    if (Object.prototype.hasOwnProperty.call(finalStyle, 'height')) delete finalStyle.height
    if (Object.prototype.hasOwnProperty.call(finalStyle, 'extrudedHeight')) delete finalStyle.extrudedHeight
  }

  // Style 赋值到 Entity
  for (const key in finalStyle) {
    const value = finalStyle[key]

    switch (key) {
      default:
        // 直接赋值
        entityattr[key] = value
        break
      case 'opacity':
      case 'outlineOpacity':
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
        // 跳过扩展其他属性的参数
        break
      case 'outlineColor':
        // 边框颜色
        entityattr.outlineColor = Cesium.Color.fromCssColorString((value as string) || '#FFFF00').withAlpha(
          finalStyle.outlineOpacity || finalStyle.opacity || 1.0
        )
        break
      case 'height':
        entityattr.height = value as number
        if (finalStyle.extrudedHeight && isNumber(finalStyle.extrudedHeight)) {
          entityattr.extrudedHeight = Number(finalStyle.extrudedHeight) + Number(value)
        }
        break
      case 'extrudedHeight':
        if (isNumber(value)) {
          entityattr.extrudedHeight = Number(entityattr.height || finalStyle.height || 0) + Number(value)
        } else {
          entityattr.extrudedHeight = value as Cesium.Property
        }
        break
      case 'color':
        // 填充颜色
        entityattr.material = Cesium.Color.fromCssColorString((value as string) || '#FFFF00').withAlpha(
          Number(finalStyle.opacity || 1.0)
        )
        break
      case 'image':
        // 填充图片
        entityattr.material = new Cesium.ImageMaterialProperty({
          image: finalStyle.image,
          color: Cesium.Color.fromCssColorString('#FFFFFF').withAlpha(Number(finalStyle.opacity || 1.0))
        })
        break
      case 'rotation':
        // 旋转角度
        entityattr.rotation = Cesium.Math.toRadians(value as number)
        if (!finalStyle.stRotation) entityattr.stRotation = Cesium.Math.toRadians(value as number)
        break
      case 'stRotation':
        entityattr.stRotation = Cesium.Math.toRadians(value as number)
        break
    }
  }

  // 设置填充材质
  globe.setFillMaterial(entityattr, finalStyle)

  return entityattr
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
export function getPositions(entity: Cesium.Entity): Cesium.Cartesian3[] | null {
  const extEntity = entity as EntityWithExtras
  if (!extEntity.rectangle) return null

  if (extEntity._positions_draw && extEntity._positions_draw.length > 0) {
    return extEntity._positions_draw
  }

  const time = Cesium.JulianDate.now()
  const re = extEntity.rectangle.coordinates?.getValue(time) // Rectangle
  if (!re) return null

  const height = extEntity.rectangle.height ? extEntity.rectangle.height.getValue(time) : 0

  const pt1 = Cesium.Cartesian3.fromRadians(re.west, re.south, height)
  const pt2 = Cesium.Cartesian3.fromRadians(re.east, re.north, height)
  return [pt1, pt2]
}

/**
 * 获取 entity 的坐标（geojson规范的格式）
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
    type: 'MultiPoint'
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
      type: 'MultiPoint',
      coordinates: coordinates || []
    }
  }
}

/**
 * 获取 entity 对应的边界坐标
 */
export function getOutlinePositions(entity: Cesium.Entity, noAdd?: boolean): Cesium.Cartesian3[] | null {
  const extEntity = entity as EntityWithExtras
  if (!extEntity.rectangle) return null

  const time = Cesium.JulianDate.now()
  const re = extEntity.rectangle.coordinates?.getValue(time) // Rectangle
  if (!re) return null

  const height = extEntity.rectangle.height ? extEntity.rectangle.height.getValue(time) : 0

  const pt1 = Cesium.Cartesian3.fromRadians(re.west, re.south, height)
  const pt2 = Cesium.Cartesian3.fromRadians(re.east, re.south, height)
  const pt3 = Cesium.Cartesian3.fromRadians(re.east, re.north, height)
  const pt4 = Cesium.Cartesian3.fromRadians(re.west, re.north, height)

  const arr = [pt1, pt2, pt3, pt4]
  if (!noAdd) arr.push(pt1)

  return arr
}

/**
 * 获取 entity 对应的边界坐标（geojson规范的格式）
 */
export function getOutlineCoordinates(entity: Cesium.Entity, noAdd?: boolean): number[][] | null {
  const positions = getOutlinePositions(entity, noAdd)
  if (!positions) return null

  const coordinates = positions.map((pos) => cartesian2lonlat(pos))
  return coordinates
}
