import * as Cesium from 'cesium'
import { DrawPoint } from './DrawPoint'
import type { AttrClass } from './DrawBase'
import * as attr from '../attr/AttrBox'
import { EditBox } from '../edit/EditBox'
import type { EditBase } from '../edit/EditBase'

// Type definitions
/**
 * Box 属性接口
 */
interface BoxAttribute {
  style: attr.BoxStyleConfig
  [key: string]: unknown
}

/**
 * 扩展的 Entity 接口
 */
interface ExtendedEntity {
  box?: Cesium.BoxGraphics
  _positions_draw?: Cesium.Cartesian3 | Cesium.Cartesian3[] | null
  attribute?: BoxAttribute
  editing?: unknown
  position?: Cesium.PositionProperty | Cesium.Cartesian3
}

/**
 * 编辑类构造函数类型
 */
type EditClassConstructor = new (
  entity: Cesium.Entity,
  viewer: Cesium.Viewer,
  dataSource: Cesium.CustomDataSource
) => EditBase

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

    const boxAttr = attribute as BoxAttribute
    const that = this

    const addattr: Cesium.Entity.ConstructorOptions & { attribute: BoxAttribute } = {
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
    const extEntity = entity as Cesium.Entity & ExtendedEntity

    if (extEntity.box) {
      attr.style2Entity(boxStyle, extEntity.box)
    }
  }

  /**
   * 图形绘制结束后调用
   */
  finish(): void {
    const entity = this.entity as (Cesium.Entity & ExtendedEntity) | null
    if (!entity) return

    entity.editing = this.getEditClass(entity) // 绑定编辑对象

    entity._positions_draw = this.getDrawPosition()
    entity.position = new Cesium.CallbackProperty((_time?: Cesium.JulianDate) => {
      return entity._positions_draw
    }, false) as unknown as Cesium.PositionProperty
  }
}
