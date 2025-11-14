import * as Cesium from 'cesium'
import { DrawPolyline } from './DrawPolyline'
import * as attr from '../attr/AttrPolylineVolume'
import { EditPolylineVolume } from '../edit/EditPolylineVolume'

/**
 * 管道体绘制类
 */
export class DrawPolylineVolume extends DrawPolyline {
  type = 'polylineVolume'
  _minPointNum = 2
  _maxPointNum = 9999
  editClass = EditPolylineVolume
  attrClass = attr

  private _minPointNum_def?: number
  private _maxPointNum_def?: number

  createFeature(attribute: any): Cesium.Entity {
    this._positions_draw = []

    if (!this._minPointNum_def) this._minPointNum_def = this._minPointNum
    if (!this._maxPointNum_def) this._maxPointNum_def = this._maxPointNum

    if (attribute.config) {
      this._minPointNum = attribute.config.minPointNum || this._minPointNum_def
      this._maxPointNum = attribute.config.maxPointNum || this._maxPointNum_def
    } else {
      this._minPointNum = this._minPointNum_def
      this._maxPointNum = this._maxPointNum_def
    }

    const that = this
    const addattr: any = {
      polylineVolume: attr.style2Entity(attribute.style),
      attribute: attribute
    }

    addattr.polylineVolume.positions = new Cesium.CallbackProperty(() => {
      return that.getDrawPosition()
    }, false)

    this.entity = this.dataSource!.entities.add(addattr)
    ;(this.entity as any)._positions_draw = this._positions_draw

    return this.entity
  }

  style2Entity(style: any, entity: Cesium.Entity): any {
    return attr.style2Entity(style, (entity as any).polylineVolume)
  }

  finish(): void {
    const entity = this.entity!
    entity.editing = this.getEditClass(entity)

    ;(entity as any)._positions_draw = this.getDrawPosition()
    ;(entity as any).polylineVolume.positions = new Cesium.CallbackProperty(() => {
      return (entity as any)._positions_draw
    }, false)
  }
}
