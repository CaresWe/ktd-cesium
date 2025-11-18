import * as Cesium from 'cesium'
import { DrawPolyline } from './DrawPolyline'
import * as attr from '../attr/AttrRectangle'
import { EditRectangle } from '../edit/EditRectangle'
import type { EditBase } from '../edit/EditBase'
import type { AttrClass } from './DrawBase'

/**
 * 判断是否是数字
 */
function isNumber(obj: unknown): boolean {
  return typeof obj === 'number' && obj.constructor === Number
}

/**
 * 获取坐标数组中的最大高度
 */
function getMaxHeight(positions: Cesium.Cartesian3[]): number {
  if (!positions || positions.length === 0) return 0

  let maxHeight = 0
  for (const position of positions) {
    const cartographic = Cesium.Cartographic.fromCartesian(position)
    if (cartographic.height > maxHeight) {
      maxHeight = cartographic.height
    }
  }
  return maxHeight
}

/**
 * 矩形样式接口
 */
interface RectangleStyle extends Record<string, unknown> {
  clampToGround?: boolean
  height?: number
  extrudedHeight?: number | string
  [key: string]: unknown
}

/**
 * 矩形属性接口
 */
interface RectangleAttribute extends Record<string, unknown> {
  style?: RectangleStyle
}

/**
 * 扩展的 Rectangle 类型（使用类型断言访问，不扩展接口）
 */
interface ExtendedRectangleGraphics {
  coordinates?: Cesium.Property
  outline?: Cesium.Property | boolean
  outlineWidth?: Cesium.Property | number
  outlineColor?: Cesium.Property | Cesium.Color
  height?: Cesium.Property | number
  extrudedHeight?: Cesium.Property | number
  [key: string]: unknown
}

/**
 * 扩展的 Polyline 类型（使用类型断言访问，不扩展接口）
 */
interface ExtendedPolylineGraphics {
  show?: Cesium.Property | boolean
  positions?: Cesium.Property | Cesium.Cartesian3[]
  width?: Cesium.Property | number
  material?: Cesium.MaterialProperty
  [key: string]: unknown
}

/**
 * 扩展的 Entity 类型（支持矩形属性）
 */
interface ExtendedEntity extends Cesium.Entity {
  attribute?: RectangleAttribute
  editing?: EditBase
  _draw_positions?: Cesium.Cartesian3[]
}

/**
 * 完整的扩展 Entity 类型
 * 使用交叉类型避免属性冲突
 */
interface FullExtendedEntity extends Omit<Cesium.Entity, 'rectangle' | 'polyline'> {
  attribute?: RectangleAttribute
  editing?: EditBase
  _draw_positions?: Cesium.Cartesian3[]
  rectangle?: ExtendedRectangleGraphics
  polyline?: ExtendedPolylineGraphics
}

/**
 * 编辑类构造函数类型
 */
type EditClassConstructor = new (
  entity: Cesium.Entity,
  viewer: Cesium.Viewer,
  dataSource: Cesium.CustomDataSource
) => EditBase

/**
 * 矩形绘制类
 *
 * 绘制流程:
 * - 第一个点: 点击确定矩形的一个角点
 * - 第二个点: 移动鼠标确定矩形的对角点，点击完成绘制
 */
export class DrawRectangle extends DrawPolyline {
  type = 'rectangle'
  // 坐标点数
  _minPointNum = 2 // 至少需要点的个数
  _maxPointNum = 2 // 最多允许点的个数

  editClass = EditRectangle as EditClassConstructor
  override attrClass = attr as AttrClass

  /**
   * 获取矩形范围
   */
  getRectangle(): Cesium.Rectangle | null {
    const positions = this.getDrawPosition()
    if (!positions) return null

    // 确保 positions 是数组类型
    const posArray = Array.isArray(positions) ? positions : [positions]
    if (posArray.length < 2) return null

    return Cesium.Rectangle.fromCartesianArray(posArray)
  }

  /**
   * 根据 attribute 创建 Entity
   */
  createFeature(attribute: Record<string, unknown>): Cesium.Entity {
    this._positions_draw = []

    const rectangleAttr = attribute as RectangleAttribute

    const addattr: Cesium.Entity.ConstructorOptions & { attribute: Record<string, unknown> } = {
      rectangle: attr.style2Entity(rectangleAttr.style),
      attribute: attribute
    }

    // 设置矩形坐标
    const rectangleGraphics = addattr.rectangle as ExtendedRectangleGraphics
    rectangleGraphics.coordinates = new Cesium.CallbackProperty(() => {
      return this.getRectangle()
    }, false) as unknown as Cesium.Property

    // 线：边线宽度大于1时
    addattr.polyline = {
      clampToGround: rectangleAttr.style?.clampToGround,
      arcType: Cesium.ArcType.RHUMB,
      show: false
    }

    this.entity = this.dataSource!.entities.add(addattr) // 创建要素对象
    const extEntity = this.entity as ExtendedEntity
    extEntity._draw_positions = this._positions_draw
    this.bindOutline(this.entity) // 边线

    return this.entity
  }

  /**
   * 样式转 Entity
   */
  protected style2Entity(style: Record<string, unknown>, entity: Cesium.Entity): attr.RectangleEntityAttr {
    const extEntity = entity as FullExtendedEntity
    return attr.style2Entity(style as attr.RectangleStyleConfig, extEntity.rectangle as unknown as attr.RectangleEntityAttr)
  }

  /**
   * 绑定轮廓线
   */
  bindOutline(entity: Cesium.Entity): void {
    const extEntity = entity as FullExtendedEntity

    if (!extEntity.polyline || !extEntity.rectangle) return

    // 是否显示：边线宽度大于1时
    extEntity.polyline.show = new Cesium.CallbackProperty((time?: Cesium.JulianDate) => {
      if (!extEntity.rectangle) return false

      const outline = extEntity.rectangle.outline
      const outlineWidth = extEntity.rectangle.outlineWidth

      let outlineValue = false
      if (typeof outline === 'boolean') {
        outlineValue = outline
      } else if (outline && typeof (outline as Cesium.Property).getValue === 'function') {
        outlineValue = (outline as Cesium.Property).getValue(time)
      }

      let widthValue = 0
      if (typeof outlineWidth === 'number') {
        widthValue = outlineWidth
      } else if (outlineWidth && typeof (outlineWidth as Cesium.Property).getValue === 'function') {
        widthValue = (outlineWidth as Cesium.Property).getValue(time)
      }

      return outlineValue && widthValue > 1
    }, false)

    extEntity.polyline.positions = new Cesium.CallbackProperty((time?: Cesium.JulianDate) => {
      if (!extEntity.polyline) return null

      const show = extEntity.polyline.show
      let showValue = false
      if (typeof show === 'boolean') {
        showValue = show
      } else if (show && typeof (show as Cesium.Property).getValue === 'function') {
        showValue = (show as Cesium.Property).getValue(time)
      }

      if (!showValue) return null
      if (!extEntity._draw_positions) return null
      return attr.getOutlinePositions(entity)
    }, false) as unknown as Cesium.Property

    extEntity.polyline.width = new Cesium.CallbackProperty(() => {
      return extEntity.rectangle?.outlineWidth
    }, false) as unknown as Cesium.Property

    // Cesium 1.134+ 要求 material 必须是 MaterialProperty
    extEntity.polyline.material = new Cesium.ColorMaterialProperty(
      new Cesium.CallbackProperty((time?: Cesium.JulianDate) => {
        // 确保返回有效的 Color 对象
        if (extEntity.rectangle?.outlineColor) {
          const outlineColor = extEntity.rectangle.outlineColor
          if (typeof (outlineColor as Cesium.Property).getValue === 'function') {
            return (outlineColor as Cesium.Property).getValue(time) || Cesium.Color.YELLOW
          }
          if (outlineColor instanceof Cesium.Color) {
            return outlineColor
          }
        }
        return Cesium.Color.YELLOW
      }, false)
    )
  }

  /**
   * 更新绘制属性
   */
  updateAttrForDrawing(): void {
    if (!this._positions_draw || !this.entity) return

    const extEntity = this.entity as FullExtendedEntity
    const attribute = extEntity.attribute
    if (!attribute) return

    const style = attribute.style
    if (!style || style.clampToGround) return

    const positions = this.getDrawPosition()
    if (!positions) return

    // 确保 positions 是数组类型
    const posArray = Array.isArray(positions) ? positions : [positions]
    const maxHeight = getMaxHeight(posArray)
    if (maxHeight !== 0 && extEntity.rectangle) {
      extEntity.rectangle.height = maxHeight
      style.height = maxHeight

      if (style.extrudedHeight && isNumber(style.extrudedHeight)) {
        extEntity.rectangle.extrudedHeight = maxHeight + Number(style.extrudedHeight)
      }
    }
  }

  /**
   * 完成绘制后调用
   */
  finish(): void {
    const entity = this.entity!
    const extEntity = entity as FullExtendedEntity

    extEntity.editing = this.getEditClass(entity) as EditBase // 绑定编辑对象

    // 确保 _draw_positions 是数组类型
    if (this._positions_draw) {
      extEntity._draw_positions = Array.isArray(this._positions_draw)
        ? this._positions_draw
        : [this._positions_draw]
    }

    if (extEntity.rectangle) {
      extEntity.rectangle.coordinates = new Cesium.CallbackProperty(() => {
        if (!extEntity._draw_positions || extEntity._draw_positions.length < 2) return null
        return Cesium.Rectangle.fromCartesianArray(extEntity._draw_positions)
      }, false) as unknown as Cesium.Property
    }
  }
}
