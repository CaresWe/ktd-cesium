import * as Cesium from 'cesium'
import { DrawBase } from './DrawBase'
import { getCurrentMousePosition } from '@ktd-cesium/shared'
import * as attr from '../attr/AttrPoint'
import { defaultMessages } from '../../TooltipPlugin/messages'
import { GraphicsEventType } from '../../EventPlugin'
import { style2Entity as labelStyle2Entity } from '../attr/AttrLabel'
import { EditPoint } from '../edit/EditPoint'

/**
 * 标签样式接口
 */
interface LabelStyle {
  [key: string]: unknown
}

/**
 * 点样式接口
 */
interface PointStyle {
  label?: LabelStyle
  [key: string]: unknown
}

/**
 * 点属性接口
 */
interface PointAttribute {
  style?: PointStyle
  [key: string]: unknown
}

/**
 * 扩展的 Entity 类型（支持编辑功能）
 */
interface EditableEntity extends Cesium.Entity {
  editing?: unknown
}

/**
 * 点绘制类
 */
export class DrawPoint extends DrawBase {
  type = 'point'
  editClass = EditPoint
  attrClass = attr

  /**
   * 根据 attribute 参数创建 Entity
   */
  createFeature(attribute: Record<string, unknown>): Cesium.Entity {
    this._positions_draw = null

    const pointAttr = attribute as PointAttribute

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
    const pointStyle = style as PointStyle
    if (pointStyle.label && entity.label) {
      // 同时加文字
      labelStyle2Entity(pointStyle.label, entity.label as any)
    }
    if (entity.point) {
      attr.style2Entity(pointStyle, entity.point as any)
    }
  }

  /**
   * 绑定鼠标事件
   */
  bindEvent(): void {
    const handler = this.getHandler()

    // 鼠标移动事件
    handler.setInputAction((movement: { endPosition: Cesium.Cartesian2 }) => {
      const point = getCurrentMousePosition(this.viewer.scene, movement.endPosition, this.entity)
      if (point) {
        this._positions_draw = point
      }

      // 显示 Tooltip 提示
      if (this.tooltip) {
        this.tooltip.showAt(movement.endPosition, defaultMessages.draw.point.start)
      }

      // 触发鼠标移动事件
      this.fire(GraphicsEventType.DRAW_MOUSE_MOVE, {
        drawtype: this.type,
        entity: this.entity,
        position: point
      })
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    // 左键点击事件
    handler.setInputAction((movement: { position: Cesium.Cartesian2 }) => {
      const point = getCurrentMousePosition(this.viewer.scene, movement.position, this.entity)
      if (point) {
        this._positions_draw = point
        this.disable()
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
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
    const editableEntity = this.entity as EditableEntity
    editableEntity.editing = this.getEditClass(this.entity)

    // 设置最终位置
    const position = this.getDrawPosition()
    if (position) {
      this.entity.position = position as unknown as Cesium.PositionProperty
    }
  }
}
