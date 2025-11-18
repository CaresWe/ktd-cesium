import * as Cesium from 'cesium'
import { DrawPoint } from './DrawPoint'
import type { AttrClass } from './DrawBase'
import * as attr from '../attr/AttrLabel'

// Type definitions
/**
 * Label 属性接口
 */
interface LabelAttribute {
  style: attr.LabelStyleConfig
  [key: string]: unknown
}

/**
 * 扩展的 Entity 接口
 */
interface ExtendedEntity {
  label?: Cesium.LabelGraphics
  attribute?: LabelAttribute
  show?: boolean
}

/**
 * Label 文字标注类
 *
 * 绘制流程:
 * - 单击确定文字位置
 */
export class DrawLabel extends DrawPoint {
  type = 'label'
  override attrClass = attr as AttrClass

  /**
   * 根据 attribute 创建 Entity
   */
  createFeature(attribute: Record<string, unknown>): Cesium.Entity {
    this._positions_draw = null

    const labelAttr = attribute as LabelAttribute
    const that = this

    const addattr: Cesium.Entity.ConstructorOptions & { attribute: LabelAttribute } = {
      show: false,
      position: new Cesium.CallbackProperty((_time?: Cesium.JulianDate) => {
        return that.getDrawPosition()
      }, false) as unknown as Cesium.PositionProperty,
      label: attr.style2Entity(labelAttr.style),
      attribute: labelAttr
    }

    this.entity = this.dataSource!.entities.add(addattr) // 创建要素对象
    return this.entity
  }

  /**
   * 样式转 Entity
   */
  protected style2Entity(style: Record<string, unknown>, entity: Cesium.Entity): void {
    const labelStyle = style as attr.LabelStyleConfig
    const extEntity = entity as Cesium.Entity & ExtendedEntity

    if (extEntity.label) {
      attr.style2Entity(labelStyle, extEntity.label)
    }
  }
}
