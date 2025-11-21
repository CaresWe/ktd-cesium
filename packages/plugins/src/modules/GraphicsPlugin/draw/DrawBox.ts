import * as Cesium from 'cesium'
import { DrawPoint } from './DrawPoint'
import type { AttrClass, EditClassConstructor, BoxDrawAttribute, BoxExtendedEntity } from '../types'
import * as attr from '../attr/AttrBox'
import { EditBox } from '../edit/EditBox'
import { getCurrentMousePosition } from '@ktd-cesium/shared'
import { defaultMessages } from '../../TooltipPlugin/messages'
import { GraphicsEventType } from '../../EventPlugin'

/**
 * 立方体绘制类
 */
export class DrawBox extends DrawPoint {
  type = 'box'
  override editClass = EditBox as EditClassConstructor
  override attrClass = attr as AttrClass

  /**
   * 根据 attribute 创建 Entity
   */
  createFeature(attribute: Record<string, unknown>): Cesium.Entity {
    this._positions_draw = null

    const boxAttr = attribute as BoxDrawAttribute
    const that = this

    const addattr: Cesium.Entity.ConstructorOptions & { attribute: BoxDrawAttribute } = {
      position: new Cesium.CallbackProperty((_time?: Cesium.JulianDate) => {
        return that.getDrawPosition()
      }, false) as unknown as Cesium.PositionProperty,
      box: attr.style2Entity(boxAttr.style),
      attribute: boxAttr
    }

    this.entity = this.dataSource!.entities.add(addattr)
    return this.entity
  }

  /**
   * 样式转 Entity
   */
  protected style2Entity(style: Record<string, unknown>, entity: Cesium.Entity): void {
    const boxStyle = style as attr.BoxStyleConfig
    const extEntity = entity as Cesium.Entity & BoxExtendedEntity

    if (extEntity.box) {
      attr.style2Entity(boxStyle, extEntity.box)
    }
  }

  /**
   * 绑定鼠标事件（支持PC端和移动端）
   */
  override bindEvent(): void {
    // 鼠标移动或触摸移动
    this.bindMoveEvent((position: Cesium.Cartesian2) => {
      const point = getCurrentMousePosition(this.viewer.scene, position, this.entity)
      if (point) {
        this._positions_draw = point
      }

      // 显示 Tooltip 提示
      if (this.tooltip) {
        this.tooltip.showAt(position, defaultMessages.draw.point.start)
      }

      // 触发鼠标移动事件
      this.fire(GraphicsEventType.DRAW_MOUSE_MOVE, {
        drawtype: this.type,
        entity: this.entity,
        position: point
      })
    })

    // 左键点击或触摸
    this.bindClickEvent((position: Cesium.Cartesian2) => {
      const point = getCurrentMousePosition(this.viewer.scene, position, this.entity)
      if (point) {
        this._positions_draw = point

        // 触发添加点事件
        this.fire(GraphicsEventType.DRAW_ADD_POINT, {
          drawtype: this.type,
          entity: this.entity,
          position: point
        })
      }
    })

    // 双击结束标绘（PC端专用，移动端通过 endDraw 按钮结束）移动端也支持长按结束
    this.bindDoubleClickEvent(() => {
      this.endDraw()
    })
  }

  /**
   * 外部控制，完成绘制（支持双击、长按或手动调用结束）
   */
  endDraw(): this {
    if (!this._enabled) {
      return this
    }

    if (!this._positions_draw) {
      return this // 还没有点击位置
    }

    this.disable()
    return this
  }

  /**
   * 图形绘制结束后调用
   */
  finish(): void {
    const entity = this.entity as (Cesium.Entity & BoxExtendedEntity) | null
    if (!entity) return

    entity.editing = this.getEditClass(entity) // 绑定编辑对象

    entity._positions_draw = this.getDrawPosition()
    entity.position = new Cesium.CallbackProperty((_time?: Cesium.JulianDate) => {
      return entity._positions_draw
    }, false) as unknown as Cesium.PositionProperty
  }
}
