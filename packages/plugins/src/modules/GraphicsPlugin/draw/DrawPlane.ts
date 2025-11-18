import * as Cesium from 'cesium'
import { DrawPoint } from './DrawPoint'
import type { AttrClass } from './DrawBase'
import * as attr from '../attr/AttrPlane'
import { EditPlane } from '../edit/EditPlane'
import type { EditBase } from '../edit/EditBase'

/**
 * 平面样式接口
 */
interface PlaneStyle extends Record<string, unknown> {
  [key: string]: unknown
}

/**
 * 平面属性接口
 */
interface PlaneAttribute extends Record<string, unknown> {
  style?: PlaneStyle
}

/**
 * 扩展的 Entity 类型（支持平面属性）
 */
interface ExtendedEntity extends Cesium.Entity {
  attribute?: PlaneAttribute
  editing?: unknown
  _positions_draw?: Cesium.Cartesian3 | Cesium.Cartesian3[] | null
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
 * 平面绘制类
 */
export class DrawPlane extends DrawPoint {
  type = 'plane'
  override editClass = EditPlane as EditClassConstructor
  override attrClass = attr as AttrClass

  /**
   * 根据 attribute 参数创建 Entity
   */
  createFeature(attribute: Record<string, unknown>): Cesium.Entity {
    this._positions_draw = null

    const planeAttr = attribute as PlaneAttribute

    const addattr: Cesium.Entity.ConstructorOptions & { attribute: Record<string, unknown> } = {
      position: new Cesium.CallbackProperty(() => {
        return this.getDrawPosition()
      }, false) as unknown as Cesium.PositionProperty,
      plane: attr.style2Entity(planeAttr.style),
      attribute: attribute
    }

    this.entity = this.dataSource!.entities.add(addattr)
    return this.entity
  }

  /**
   * 样式转 entity
   */
  protected style2Entity(style: Record<string, unknown>, entity: Cesium.Entity): attr.PlaneEntityAttr {
    return attr.style2Entity(style as attr.PlaneStyleConfig, entity.plane as unknown as attr.PlaneEntityAttr)
  }

  /**
   * 图形绘制结束后调用
   */
  finish(): void {
    const entity = this.entity!
    const extEntity = entity as ExtendedEntity

    extEntity.editing = this.getEditClass(entity)

    extEntity._positions_draw = this.getDrawPosition()
    extEntity.position = new Cesium.CallbackProperty(() => {
      return extEntity._positions_draw
    }, false) as unknown as Cesium.PositionProperty
  }
}
