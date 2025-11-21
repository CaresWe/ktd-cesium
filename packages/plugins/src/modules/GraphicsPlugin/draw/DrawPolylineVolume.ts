import * as Cesium from 'cesium'
import { DrawPolyline } from './DrawPolyline'
import type { AttrClass, PolylineVolumeDrawAttribute, PolylineVolumeExtendedEntity } from '../types'
import * as attr from '../attr/AttrPolylineVolume'
import { EditPolylineVolume } from '../edit/EditPolylineVolume'
import type { EditClassConstructor } from '../types'

/**
 * 管道体绘制类
 */
export class DrawPolylineVolume extends DrawPolyline {
  type = 'polylineVolume'
  override _minPointNum = 2
  override _maxPointNum = 9999
  override editClass = EditPolylineVolume as EditClassConstructor
  override attrClass = attr as AttrClass

  _minPointNum_def?: number
  _maxPointNum_def?: number

  /**
   * 根据 attribute 参数创建 Entity
   */
  createFeature(attribute: Record<string, unknown>): Cesium.Entity {
    this._positions_draw = []

    const polylineVolumeAttr = attribute as PolylineVolumeDrawAttribute

    if (!this._minPointNum_def) this._minPointNum_def = this._minPointNum
    if (!this._maxPointNum_def) this._maxPointNum_def = this._maxPointNum

    if (polylineVolumeAttr.config) {
      // 允许外部传入
      this._minPointNum = polylineVolumeAttr.config.minPointNum || this._minPointNum_def
      this._maxPointNum = polylineVolumeAttr.config.maxPointNum || this._maxPointNum_def
    } else {
      this._minPointNum = this._minPointNum_def
      this._maxPointNum = this._maxPointNum_def
    }

    const addattr: Cesium.Entity.ConstructorOptions & { attribute: Record<string, unknown> } = {
      polylineVolume: attr.style2Entity(polylineVolumeAttr.style),
      attribute: attribute
    }

    addattr.polylineVolume!.positions = new Cesium.CallbackProperty(() => {
      return this.getDrawPosition()
    }, false) as unknown as Cesium.PositionProperty

    this.entity = this.dataSource!.entities.add(addattr)
    const extEntity = this.entity as PolylineVolumeExtendedEntity
    extEntity._positions_draw = this._positions_draw as Cesium.Cartesian3[]

    return this.entity
  }

  /**
   * 样式转 entity
   */
  protected style2Entity(style: Record<string, unknown>, entity: Cesium.Entity): attr.PolylineVolumeEntityAttr {
    return attr.style2Entity(
      style as attr.PolylineVolumeStyleConfig,
      entity.polylineVolume as unknown as attr.PolylineVolumeEntityAttr
    )
  }

  /**
   * 更新绘制属性
   */
  updateAttrForDrawing(): void {
    // 子类可以重写此方法
  }

  /**
   * 图形绘制结束后调用
   */
  finish(): void {
    const entity = this.entity!
    const extEntity = entity as PolylineVolumeExtendedEntity

    extEntity.editing = this.getEditClass(entity)

    extEntity._positions_draw = this.getDrawPosition() as Cesium.Cartesian3[]
    extEntity.polylineVolume!.positions = new Cesium.CallbackProperty(() => {
      return extEntity._positions_draw
    }, false) as unknown as Cesium.PositionProperty
  }
}
