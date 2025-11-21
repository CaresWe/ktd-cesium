import * as Cesium from 'cesium'
import { DrawBase } from './DrawBase'
import type { AttrClass, PointDrawAttribute, PointExtendedEntity, PointStyleConfig } from '../types'
import { getCurrentMousePosition } from '@ktd-cesium/shared'
import * as attr from '../attr/AttrPoint'
import { defaultMessages } from '../../TooltipPlugin/messages'
import { GraphicsEventType } from '../../EventPlugin'
import { style2Entity as labelStyle2Entity } from '../attr/AttrLabel'
import { EditPoint } from '../edit/EditPoint'
import type { EditClassConstructor } from '../types'

/**
 * 点绘制类
 */
export class DrawPoint extends DrawBase {
  type = 'point'
  editClass = EditPoint as EditClassConstructor
  attrClass = attr as AttrClass

  /**
   * 根据 attribute 参数创建 Entity
   */
  createFeature(attribute: Record<string, unknown>): Cesium.Entity {
    this._positions_draw = null

    const pointAttr = attribute as PointDrawAttribute

    const addattr: Cesium.Entity.ConstructorOptions & { attribute: Record<string, unknown> } = {
      show: false,
      position: new Cesium.CallbackProperty(() => {
        return this.getDrawPosition()
      }, false) as unknown as Cesium.PositionProperty,
      point: attr.style2Entity(pointAttr.style),
      attribute: attribute
    }

    if (pointAttr.style?.label) {
      // 同时加文字
      addattr.label = labelStyle2Entity(pointAttr.style.label)
    }

    this.entity = this.dataSource!.entities.add(addattr) // 创建要素对象
    return this.entity
  }

  /**
   * 样式转 entity
   */
  protected style2Entity(style: Record<string, unknown>, entity: Cesium.Entity): void {
    const pointStyle = style as PointStyleConfig
    if (pointStyle.label && entity.label) {
      // 同时加文字
      labelStyle2Entity(pointStyle.label, entity.label as any)
    }
    if (entity.point) {
      attr.style2Entity(pointStyle, entity.point as any)
    }
  }

  /**
   * 绑定鼠标事件（支持PC端和移动端）
   */
  bindEvent(): void {
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
        this.disable()
      }
    })
  }

  /**
   * 获取外部 entity 的坐标到 _positions_draw
   */
  setDrawPositionByEntity(entity: Cesium.Entity): void {
    const positions = this.getPositions(entity)
    if (positions && positions.length > 0) {
      this._positions_draw = positions[0]
    }
  }

  /**
   * 图形绘制结束，更新属性
   */
  finish(): void {
    if (!this.entity) return

    this.entity.show = true

    // 绑定编辑对象
    const editableEntity = this.entity as PointExtendedEntity
    editableEntity.editing = this.getEditClass(this.entity)

    // 设置最终位置
    const position = this.getDrawPosition()
    if (position) {
      this.entity.position = position as unknown as Cesium.PositionProperty
    }
  }
}
