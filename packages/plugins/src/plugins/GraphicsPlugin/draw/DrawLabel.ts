import * as Cesium from 'cesium'
import { DrawPoint } from './DrawPoint'
import * as attr from '../attr/AttrLabel'

/**
 * Label 文字标注类
 *
 * 绘制流程:
 * - 单击确定文字位置
 */
export class DrawLabel extends DrawPoint {
  type = 'label'
  attrClass = attr

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
      label: attr.style2Entity(attribute.style),
      attribute: attribute
    }

    this.entity = this.dataSource!.entities.add(addattr) // 创建要素对象
    return this.entity
  }

  /**
   * 样式 Entity
   */
  style2Entity(style: any, entity: Cesium.Entity): any {
    return attr.style2Entity(style, (entity as any).label)
  }
}
