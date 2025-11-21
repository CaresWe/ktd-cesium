import * as Cesium from 'cesium'
import { DrawPoint } from './DrawPoint'
import type { AttrClass, ModelDrawAttribute, ModelExtendedEntity, ModelStyleConfig } from '../types'
import * as attr from '../attr/AttrModel'
import { style2Entity as labelStyle2Entity } from '../attr/AttrLabel'

/**
 * 3D模型绘制类
 */
export class DrawModel extends DrawPoint {
  type = 'model'
  override attrClass = attr as AttrClass

  /**
   * 根据 attribute 参数创建 Entity
   */
  createFeature(attribute: Record<string, unknown>): Cesium.Entity {
    this._positions_draw = null

    const modelAttr = attribute as ModelDrawAttribute

    const addattr: Cesium.Entity.ConstructorOptions & { attribute: Record<string, unknown> } = {
      position: new Cesium.CallbackProperty(() => {
        return this.getDrawPosition()
      }, false) as unknown as Cesium.PositionProperty,
      model: attr.style2Entity(modelAttr.style),
      attribute: attribute
    }

    // 同时加文字
    if (modelAttr.style?.label) {
      addattr.label = labelStyle2Entity(modelAttr.style.label)
    }

    this.entity = this.dataSource!.entities.add(addattr)
    return this.entity
  }

  /**
   * 样式转 entity
   */
  protected style2Entity(style: Record<string, unknown>, entity: Cesium.Entity): attr.ModelEntityAttr {
    const modelStyle = style as ModelStyleConfig
    this.updateOrientation(modelStyle, entity)
    if (modelStyle.label && entity.label) {
      labelStyle2Entity(modelStyle.label, entity.label)
    }
    return attr.style2Entity(modelStyle, entity.model as unknown as attr.ModelEntityAttr)
  }

  /**
   * 更新绘制属性
   */
  updateAttrForDrawing(): void {
    if (this.entity) {
      const extEntity = this.entity as ModelExtendedEntity
      if (extEntity.attribute?.style) {
        this.updateOrientation(extEntity.attribute.style, this.entity)
      }
    }
  }

  /**
   * 角度更新
   */
  updateOrientation(style: ModelStyleConfig, entity: Cesium.Entity): void {
    const positionProperty = entity.position
    if (!positionProperty) return

    const position = positionProperty.getValue(this.viewer!.clock.currentTime)
    if (position == null) return

    const heading = Cesium.Math.toRadians(Number(style.heading || 0.0))
    const pitch = Cesium.Math.toRadians(Number(style.pitch || 0.0))
    const roll = Cesium.Math.toRadians(Number(style.roll || 0.0))

    const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll)
    const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr)
    entity.orientation = new Cesium.ConstantProperty(orientation) as unknown as Cesium.Property
  }
}
