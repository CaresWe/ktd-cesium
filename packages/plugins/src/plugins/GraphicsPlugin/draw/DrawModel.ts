import * as Cesium from 'cesium'
import { DrawPoint } from './DrawPoint'
import * as attr from '../attr/AttrModel'
import { style2Entity as labelStyle2Entity } from '../attr/AttrLabel'

/**
 * 3D模型绘制类
 */
export class DrawModel extends DrawPoint {
  type = 'model'
  attrClass = attr

  createFeature(attribute: any): Cesium.Entity {
    this._positions_draw = null

    const that = this
    const addattr: any = {
      position: new Cesium.CallbackProperty(() => {
        return that.getDrawPosition()
      }, false),
      model: attr.style2Entity(attribute.style),
      attribute: attribute
    }

    // 同时加文字
    if (attribute.style && attribute.style.label) {
      addattr.label = labelStyle2Entity(attribute.style.label)
    }

    this.entity = this.dataSource!.entities.add(addattr)
    return this.entity
  }

  style2Entity(style: any, entity: Cesium.Entity): any {
    this.updateOrientation(style, entity)
    if (style && style.label) {
      labelStyle2Entity(style.label, (entity as any).label)
    }
    return attr.style2Entity(style, (entity as any).model)
  }

  updateAttrForDrawing(): void {
    if (this.entity) {
      this.updateOrientation(this.entity.attribute.style, this.entity)
    }
  }

  /**
   * 角度更新
   */
  updateOrientation(style: any, entity: Cesium.Entity): void {
    const position = (entity as any).position.getValue(this.viewer.clock.currentTime)
    if (position == null) return

    const heading = Cesium.Math.toRadians(Number(style.heading || 0.0))
    const pitch = Cesium.Math.toRadians(Number(style.pitch || 0.0))
    const roll = Cesium.Math.toRadians(Number(style.roll || 0.0))

    const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll)
    ;(entity as any).orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr)
  }
}
