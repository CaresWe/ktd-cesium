import * as Cesium from 'cesium'
import { isNumber } from '@ktd-cesium/shared'
import { DrawPolyline } from './DrawPolyline'
import type { AttrClass, EditClassConstructor, CorridorDrawAttribute, CorridorExtendedEntity } from '../types'
import * as attr from '../attr/AttrCorridor'
import { EditCorridor } from '../edit/EditCorridor'
import { getMaxHeight } from '@ktd-cesium/shared'
import type { EditBase } from '../edit/EditBase'

/**
 * 走廊绘制类
 *
 * 绘制流程:
 * - 点击添加点位
 * - 移动鼠标预览走廊
 * - 双击或右键完成绘制
 */
export class DrawCorridor extends DrawPolyline {
  type = 'corridor'
  // 坐标点数
  override _minPointNum = 2 // 至少需要点的个数
  override _maxPointNum = 9999 // 最多允许点的个数

  override editClass = EditCorridor as EditClassConstructor
  override attrClass = attr as AttrClass

  /**
   * 根据 attribute 创建 Entity
   */
  override createFeature(attribute: Record<string, unknown>): Cesium.Entity {
    this._positions_draw = []

    const corridorAttr = attribute as CorridorDrawAttribute

    if (!this._minPointNum_def) {
      this._minPointNum_def = this._minPointNum
    }
    if (!this._maxPointNum_def) {
      this._maxPointNum_def = this._maxPointNum
    }

    if (corridorAttr.config) {
      // 允许外部传入
      this._minPointNum = corridorAttr.config.minPointNum || this._minPointNum_def
      this._maxPointNum = corridorAttr.config.maxPointNum || this._maxPointNum_def
    } else {
      this._minPointNum = this._minPointNum_def
      this._maxPointNum = this._maxPointNum_def
    }

    const addattr: Cesium.Entity.ConstructorOptions & { attribute: CorridorDrawAttribute } = {
      corridor: attr.style2Entity(corridorAttr.style),
      attribute: corridorAttr
    }

    if (addattr.corridor) {
      addattr.corridor.positions = new Cesium.CallbackProperty(() => {
        return this.getDrawPosition()
      }, false) as unknown as Cesium.PositionProperty
    }

    this.entity = this.dataSource!.entities.add(addattr) // 创建要素对象
    const extEntity = this.entity as CorridorExtendedEntity
    extEntity._positions_draw = this._positions_draw as Cesium.Cartesian3[]

    return this.entity
  }

  /**
   * 样式转 Entity
   */
  protected override style2Entity(
    style: Record<string, unknown>,
    entity: Cesium.Entity
  ): Cesium.CorridorGraphics.ConstructorOptions {
    const extEntity = entity as CorridorExtendedEntity
    return attr.style2Entity(style, extEntity.corridor)
  }

  /**
   * 更新绘制属性
   */
  override updateAttrForDrawing(): void {
    if (!this._positions_draw) return

    const extEntity = this.entity as CorridorExtendedEntity | null
    if (!extEntity || !extEntity.attribute) return

    const style = extEntity.attribute.style

    if (!style.clampToGround && extEntity.corridor) {
      const positions = this.getDrawPosition()
      const positionsArray = Array.isArray(positions) ? positions : positions ? [positions] : []
      const maxHeight = getMaxHeight(positionsArray)

      if (maxHeight !== 0) {
        extEntity.corridor.height = new Cesium.ConstantProperty(maxHeight)
        style.height = maxHeight

        if (style.extrudedHeight && isNumber(style.extrudedHeight)) {
          const extrudedHeight = maxHeight + Number(style.extrudedHeight)
          extEntity.corridor.extrudedHeight = new Cesium.ConstantProperty(extrudedHeight)
        }
      }
    }
  }

  /**
   * 完成绘制后调用
   */
  override finish(): void {
    const entity = this.entity as CorridorExtendedEntity | null
    if (!entity) return

    entity.editing = this.getEditClass(entity as Cesium.Entity) as EditBase // 绑定编辑对象

    entity._positions_draw = this.getDrawPosition() as Cesium.Cartesian3[]

    if (entity.corridor) {
      entity.corridor.positions = new Cesium.CallbackProperty(() => {
        return entity._positions_draw
      }, false) as unknown as Cesium.PositionProperty
    }
  }
}
