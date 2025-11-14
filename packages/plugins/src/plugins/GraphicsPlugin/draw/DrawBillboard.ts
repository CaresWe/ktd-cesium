import * as Cesium from 'cesium'
import { DrawPoint } from './DrawPoint'
import * as attr from '../attr/AttrBillboard'
import { style2Entity as labelStyle2Entity } from '../attr/AttrLabel'

/**
 * Billboard 图标标绘类
 *
 * 绘制流程:
 * - 单击确定图标位置
 */
export class DrawBillboard extends DrawPoint {
  type = 'billboard'
  attrClass = attr

  private updateTimer?: NodeJS.Timeout

  /**
   * 根据 attribute 创建 Entity
   */
  createFeature(attribute: any): Cesium.Entity {
    this._positions_draw = null

    const that = this
    const addattr: any = {
      show: false,
      position: new Cesium.CallbackProperty(() => {
        return that.getDrawPosition()
      }, false),
      billboard: attr.style2Entity(attribute.style),
      attribute: attribute
    }

    // 同时加文字
    if (attribute.style && attribute.style.label) {
      addattr.label = labelStyle2Entity(attribute.style.label)
    }

    this.entity = this.dataSource!.entities.add(addattr) // 创建要素对象
    this.updateAttrForDrawing()
    return this.entity
  }

  /**
   * 样式 Entity
   */
  style2Entity(style: any, entity: Cesium.Entity): any {
    // setTimeout 是为了优化效率
    if (this.updateTimer) {
      clearTimeout(this.updateTimer)
    }
    this.updateTimer = setTimeout(() => {
      delete this.updateTimer
      this.updateImg(style, entity)
    }, 300)

    // 同时加文字
    if (style && style.label) {
      labelStyle2Entity(style.label, (entity as any).label)
    }
    return attr.style2Entity(style, (entity as any).billboard)
  }

  /**
   * 更新绘制属性
   */
  updateAttrForDrawing(): void {
    // setTimeout 是为了优化效率
    if (this.updateTimer) {
      clearTimeout(this.updateTimer)
    }
    const entity = this.entity
    this.updateTimer = setTimeout(() => {
      delete this.updateTimer
      if (!entity) return
      this.updateImg(entity.attribute.style, entity)
    }, 300)
  }

  /**
   * 更新图标，子类可重写
   */
  updateImg(style: any, entity: Cesium.Entity): void {
    // 子类可以重写此方法来更新图标
  }

  /**
   * 图形绘制结束，更新属性
   */
  finish(): void {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer)
      delete this.updateTimer

      this.updateImg(this.entity!.attribute.style, this.entity!)
    }
    this.entity!.show = true

    this.entity!.editing = this.getEditClass(this.entity!) // 绑定编辑对象
    ;(this.entity as any).position = this.getDrawPosition()
  }
}
