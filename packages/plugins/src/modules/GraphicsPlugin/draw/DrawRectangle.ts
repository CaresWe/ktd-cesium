import * as Cesium from 'cesium'
import {isNumber,getMaxHeight} from '@ktd-cesium/shared'
import { DrawPolyline } from './DrawPolyline'
import * as attr from '../attr/AttrRectangle'
import { EditRectangle } from '../edit/EditRectangle'
import type { EditClassConstructor, AttrClass, RectangleDrawAttribute, RectangleExtendedEntity } from '../types'
import type { EditBase } from '../edit/EditBase'
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

    const rectangleAttr = attribute as RectangleDrawAttribute

    const addattr: Cesium.Entity.ConstructorOptions & { attribute: Record<string, unknown> } = {
      rectangle: attr.style2Entity(rectangleAttr.style),
      attribute: attribute
    }

    // 设置矩形坐标
    if (addattr.rectangle) {
      (addattr.rectangle as any).coordinates = new Cesium.CallbackProperty(() => {
        return this.getRectangle()
      }, false) as unknown as Cesium.Property
    }

    // 线：边线宽度大于1时
    addattr.polyline = {
      clampToGround: rectangleAttr.style?.clampToGround,
      arcType: Cesium.ArcType.RHUMB,
      show: false
    }

    this.entity = this.dataSource!.entities.add(addattr) // 创建要素对象
    const extEntity = this.entity as RectangleExtendedEntity
    extEntity._draw_positions = this._positions_draw
    this.bindOutline(this.entity) // 边线

    return this.entity
  }

  /**
   * 样式转 Entity
   */
  protected style2Entity(style: Record<string, unknown>, entity: Cesium.Entity): attr.RectangleEntityAttr {
    const extEntity = entity as RectangleExtendedEntity
    return attr.style2Entity(style as attr.RectangleStyleConfig, (extEntity.rectangle as any) as attr.RectangleEntityAttr)
  }

  /**
   * 绑定轮廓线
   */
  bindOutline(entity: Cesium.Entity): void {
    const extEntity = entity as RectangleExtendedEntity

    if (!extEntity.polyline || !extEntity.rectangle) return

    // 是否显示：边线宽度大于1时
    if (extEntity.polyline) {
      extEntity.polyline.show = new Cesium.CallbackProperty((time?: Cesium.JulianDate) => {
        if (!extEntity.rectangle) return false

        const outline = (extEntity.rectangle as any).outline
        const outlineWidth = (extEntity.rectangle as any).outlineWidth

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
        return (extEntity.rectangle as any)?.outlineWidth
      }, false) as unknown as Cesium.Property

      // Cesium 1.134+ 要求 material 必须是 MaterialProperty
      extEntity.polyline.material = new Cesium.ColorMaterialProperty(
        new Cesium.CallbackProperty((time?: Cesium.JulianDate) => {
          // 确保返回有效的 Color 对象
          if ((extEntity.rectangle as any)?.outlineColor) {
            const outlineColor = (extEntity.rectangle as any).outlineColor
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
  }

  /**
   * 更新绘制属性
   */
  updateAttrForDrawing(): void {
    if (!this._positions_draw || !this.entity) return

    const extEntity = this.entity as RectangleExtendedEntity
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
      (extEntity.rectangle as any).height = maxHeight
      style.height = maxHeight

      if (style.extrudedHeight && isNumber(style.extrudedHeight)) {
        (extEntity.rectangle as any).extrudedHeight = maxHeight + Number(style.extrudedHeight)
      }
    }
  }

  /**
   * 完成绘制后调用
   */
  finish(): void {
    const entity = this.entity!
    const extEntity = entity as RectangleExtendedEntity

    extEntity.editing = this.getEditClass(entity) as EditBase // 绑定编辑对象

    // 确保 _draw_positions 是数组类型
    if (this._positions_draw) {
      extEntity._draw_positions = Array.isArray(this._positions_draw)
        ? this._positions_draw
        : [this._positions_draw]
    }

    if (extEntity.rectangle) {
      (extEntity.rectangle as any).coordinates = new Cesium.CallbackProperty(() => {
        if (!extEntity._draw_positions || extEntity._draw_positions.length < 2) return null
        return Cesium.Rectangle.fromCartesianArray(extEntity._draw_positions)
      }, false) as unknown as Cesium.Property
    }
  }
}
