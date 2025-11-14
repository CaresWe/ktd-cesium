import * as Cesium from 'cesium'
import { DrawBase } from './DrawBase'
import { getCurrentMousePosition } from '../core/Util'
import * as attr from '../attr/AttrPoint'
import { message } from '../core/Tooltip'
import * as EventType from '../core/EventType'
import { style2Entity as labelStyle2Entity } from '../attr/AttrLabel'
import { EditPoint } from '../edit/EditPoint'

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
  createFeature(attribute: any): Cesium.Entity {
    this._positions_draw = null

    const addattr: any = {
      show: false,
      position: new Cesium.CallbackProperty(() => {
        return this.getDrawPosition()
      }, false),
      point: attr.style2Entity(attribute.style),
      attribute: attribute
    }

    if (attribute.style && attribute.style.label) {
      // 同时加文字
      addattr.label = labelStyle2Entity(attribute.style.label)
    }

    this.entity = this.dataSource!.entities.add(addattr) // 创建要素对象
    return this.entity
  }

  /**
   * 样式转 entity
   */
  style2Entity(style: any, entity: Cesium.Entity): any {
    if (style && style.label) {
      // 同时加文字
      labelStyle2Entity(style.label, entity.label)
    }
    return attr.style2Entity(style, entity.point)
  }

  /**
   * 绑定鼠标事件
   */
  bindEvent(): void {
    this.getHandler().setInputAction((event: any) => {
      const point = getCurrentMousePosition(this.viewer!.scene, event.endPosition, this.entity)
      if (point) {
        this._positions_draw = point
      }
      this.tooltip!.showAt(event.endPosition, message.draw.point.start)

      this.fire(EventType.DrawMouseMove, {
        drawtype: this.type,
        entity: this.entity,
        position: point
      })
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    this.getHandler().setInputAction((event: any) => {
      const point = getCurrentMousePosition(this.viewer!.scene, event.position, this.entity)
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
    this._positions_draw = positions[0]
  }

  /**
   * 图形绘制结束，更新属性
   */
  finish(): void {
    this.entity!.show = true

    this.entity!.editing = this.getEditClass(this.entity!) // 绑定编辑对象
    this.entity!.position = this.getDrawPosition()
  }
}
