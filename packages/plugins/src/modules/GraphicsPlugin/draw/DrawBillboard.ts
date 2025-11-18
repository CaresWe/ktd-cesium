import * as Cesium from 'cesium'
import { DrawPoint } from './DrawPoint'
import type { AttrClass } from './DrawBase'
import * as attr from '../attr/AttrBillboard'
import { style2Entity as labelStyle2Entity } from '../attr/AttrLabel'

// Type definitions
/**
 * Billboard 属性接口
 */
interface BillboardAttribute {
  style: attr.BillboardStyleConfig & {
    label?: Record<string, unknown>
  }
  [key: string]: unknown
}

/**
 * 扩展的 Entity 接口
 */
interface ExtendedEntity {
  billboard?: Cesium.BillboardGraphics
  label?: Cesium.LabelGraphics
  attribute?: BillboardAttribute
  editing?: unknown
  show?: boolean
  position?: Cesium.PositionProperty | Cesium.Cartesian3 | null
}

/**
 * Billboard 图标标绘类
 *
 * 绘制流程:
 * - 单击确定图标位置
 */
export class DrawBillboard extends DrawPoint {
  type = 'billboard'
  override attrClass = attr as AttrClass

  private updateTimer?: ReturnType<typeof setTimeout>

  /**
   * 根据 attribute 创建 Entity
   */
  createFeature(attribute: Record<string, unknown>): Cesium.Entity {
    this._positions_draw = null

    const billboardAttr = attribute as BillboardAttribute
    const that = this

    const addattr: Cesium.Entity.ConstructorOptions & { attribute: BillboardAttribute } = {
      show: false,
      position: new Cesium.CallbackProperty((_time?: Cesium.JulianDate) => {
        return that.getDrawPosition()
      }, false) as unknown as Cesium.PositionProperty,
      billboard: attr.style2Entity(billboardAttr.style),
      attribute: billboardAttr
    }

    // 同时加文字
    if (billboardAttr.style && billboardAttr.style.label) {
      addattr.label = labelStyle2Entity(billboardAttr.style.label)
    }

    this.entity = this.dataSource!.entities.add(addattr) // 创建要素对象
    this.updateAttrForDrawing()
    return this.entity
  }

  /**
   * 样式转 Entity
   */
  protected style2Entity(style: Record<string, unknown>, entity: Cesium.Entity): void {
    const billboardStyle = style as BillboardAttribute['style']
    const extEntity = entity as Cesium.Entity & ExtendedEntity

    // setTimeout 是为了优化效率
    if (this.updateTimer) {
      clearTimeout(this.updateTimer)
    }
    this.updateTimer = setTimeout(() => {
      delete this.updateTimer
      this.updateImg(billboardStyle, entity)
    }, 300)

    // 同时加文字
    if (billboardStyle && billboardStyle.label && extEntity.label) {
      labelStyle2Entity(billboardStyle.label, extEntity.label)
    }

    if (extEntity.billboard) {
      attr.style2Entity(billboardStyle, extEntity.billboard)
    }
  }

  /**
   * 更新绘制属性
   */
  updateAttrForDrawing(): void {
    // setTimeout 是为了优化效率
    if (this.updateTimer) {
      clearTimeout(this.updateTimer)
    }
    const entity = this.entity as (Cesium.Entity & ExtendedEntity) | null
    this.updateTimer = setTimeout(() => {
      delete this.updateTimer
      if (!entity || !entity.attribute) return
      this.updateImg(entity.attribute.style, entity)
    }, 300)
  }

  /**
   * 更新图标，子类可重写
   */
  protected updateImg(_style: BillboardAttribute['style'], _entity: Cesium.Entity): void {
    // 子类可以重写此方法来更新图标
  }

  /**
   * 图形绘制结束，更新属性
   */
  finish(): void {
    const entity = this.entity as (Cesium.Entity & ExtendedEntity) | null
    if (!entity) return

    if (this.updateTimer) {
      clearTimeout(this.updateTimer)
      delete this.updateTimer

      if (entity.attribute) {
        this.updateImg(entity.attribute.style, entity)
      }
    }

    entity.show = true
    entity.editing = this.getEditClass(entity) // 绑定编辑对象
    entity.position = this.getDrawPosition() as unknown as Cesium.PositionProperty
  }
}
