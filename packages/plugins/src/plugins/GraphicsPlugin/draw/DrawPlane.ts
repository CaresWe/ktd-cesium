import * as Cesium from 'cesium'
import { DrawPoint } from './DrawPoint'
import * as attr from '../attr/AttrPlane'
import { EditPlane } from '../edit/EditPlane'

/**
 * 平面绘制类
 */
export class DrawPlane extends DrawPoint {
  type = 'plane'
  editClass = EditPlane
  attrClass = attr

  createFeature(attribute: any): Cesium.Entity {
    this._positions_draw = null

    const that = this
    const addattr: any = {
      position: new Cesium.CallbackProperty(() => {
        return that.getDrawPosition()
      }, false),
      plane: attr.style2Entity(attribute.style),
      attribute: attribute
    }

    this.entity = this.dataSource!.entities.add(addattr)
    return this.entity
  }

  style2Entity(style: any, entity: Cesium.Entity): any {
    return attr.style2Entity(style, (entity as any).plane)
  }

  finish(): void {
    const entity = this.entity!
    entity.editing = this.getEditClass(entity)

    ;(entity as any)._positions_draw = this.getDrawPosition()
    ;(entity as any).position = new Cesium.CallbackProperty(() => {
      return (entity as any)._positions_draw
    }, false)
  }
}
