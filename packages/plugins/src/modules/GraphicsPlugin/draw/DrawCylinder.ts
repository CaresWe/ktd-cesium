import * as Cesium from 'cesium'
import { DrawPolyline } from './DrawPolyline'
import type { AttrClass, CylinderDrawAttribute, CylinderExtendedEntity } from '../types'
import * as attr from '../attr/AttrCylinder'
import { EditCylinder } from '../edit/EditCylinder'
import { addPositionsHeight } from '@ktd-cesium/shared'
import { getEllipseOuterPositions } from '../attr/AttrCircle'
import type { EditClassConstructor } from '../types'
import type { EditBase } from '../edit/EditBase'

/**
 * 圆柱体绘制类
 *
 * 绘制流程:
 * - 第一个点确定中心位置
 * - 第二个点确定半径
 */
export class DrawCylinder extends DrawPolyline {
  type = 'cylinder'
  // 坐标位置相关
  override _minPointNum = 2 // 至少需要点的个数
  override _maxPointNum = 2 // 最多允许点的个数

  override editClass = EditCylinder as EditClassConstructor
  override attrClass = attr as AttrClass

  /**
   * 获取显示位置（圆柱体中心点，需要根据高度偏移）
   */
  getShowPosition(time?: Cesium.JulianDate): Cesium.Cartesian3 | null {
    const positions = this._positions_draw as Cesium.Cartesian3[] | null
    const extEntity = this.entity as CylinderExtendedEntity | null

    if (positions && positions.length > 1 && extEntity?.cylinder) {
      const lengthProp = extEntity.cylinder.length
      const length =
        lengthProp && typeof lengthProp.getValue === 'function'
          ? lengthProp.getValue(time || Cesium.JulianDate.now())
          : lengthProp

      if (length) {
        const offset = Number(length) / 2
        return addPositionsHeight(positions[0], offset) as Cesium.Cartesian3
      }
    }
    return null
  }

  /**
   * 根据 attribute 创建 Entity
   */
  override createFeature(attribute: Record<string, unknown>): Cesium.Entity {
    this._positions_draw = []

    const cylinderAttr = attribute as CylinderDrawAttribute

    const addattr: Cesium.Entity.ConstructorOptions & { attribute: CylinderDrawAttribute } = {
      position: new Cesium.CallbackProperty((time?: Cesium.JulianDate) => {
        return this.getShowPosition(time)
      }, false) as unknown as Cesium.PositionProperty,
      cylinder: attr.style2Entity(cylinderAttr.style),
      attribute: cylinderAttr
    }

    this.entity = this.dataSource!.entities.add(addattr) // 创建要素对象
    return this.entity
  }

  /**
   * 样式转 Entity
   */
  protected override style2Entity(
    style: Record<string, unknown>,
    entity: Cesium.Entity
  ): Cesium.CylinderGraphics.ConstructorOptions {
    const extEntity = entity as CylinderExtendedEntity
    return attr.style2Entity(style, extEntity.cylinder)
  }

  /**
   * 绘制过程中实时更新
   */
  override updateAttrForDrawing(isLoad?: boolean): void {
    const positions = this._positions_draw as Cesium.Cartesian3[] | null
    if (!positions) return

    const extEntity = this.entity as CylinderExtendedEntity | null
    if (!extEntity || !extEntity.attribute) return

    if (isLoad) {
      if (this._positions_draw instanceof Cesium.Cartesian3) {
        this._positions_draw = [this._positions_draw]
      }
      this.addPositionsForRadius((this._positions_draw as Cesium.Cartesian3[])[0])
      return
    }

    if (positions.length < 2) return

    const style = extEntity.attribute.style

    // 半径处理
    const radius = this.formatNum(Cesium.Cartesian3.distance(positions[0], positions[1]), 2)

    if (extEntity.cylinder) {
      extEntity.cylinder.bottomRadius = new Cesium.ConstantProperty(radius)

      // 获取 topRadius
      const topRadiusProp = extEntity.cylinder.topRadius
      const topRadius =
        topRadiusProp && typeof topRadiusProp.getValue === 'function'
          ? topRadiusProp.getValue(this.viewer!.clock.currentTime)
          : topRadiusProp

      style.topRadius = Number(topRadius ?? 0)
      style.bottomRadius = radius
    }
  }

  /**
   * 根据半径添加坐标点
   */
  addPositionsForRadius(position: Cesium.Cartesian3): void {
    const extEntity = this.entity as CylinderExtendedEntity | null
    if (!extEntity || !extEntity.attribute) return

    const style = extEntity.attribute.style

    // 获取圆（或椭圆）边线上的坐标点数组
    const outerPositions = getEllipseOuterPositions({
      position: position,
      semiMajorAxis: Number(style.bottomRadius ?? 100), // 长半轴
      semiMinorAxis: Number(style.bottomRadius ?? 100) // 短半轴
    })

    // 长半轴上的坐标点
    const positions = this._positions_draw as Cesium.Cartesian3[]
    positions.push(outerPositions[0])
  }

  /**
   * 图形绘制结束后调用
   */
  override finish(): void {
    const entity = this.entity as CylinderExtendedEntity | null
    if (!entity) return

    entity.editing = this.getEditClass(entity as Cesium.Entity) as EditBase // 绑定编辑对象

    entity._positions_draw = this._positions_draw as Cesium.Cartesian3[]

    // 使用回调属性更新显示位置
    entity.position = new Cesium.CallbackProperty((time?: Cesium.JulianDate) => {
      if (entity._positions_draw && entity._positions_draw.length > 0 && entity.cylinder) {
        const lengthProp = entity.cylinder.length
        const length =
          lengthProp && typeof lengthProp.getValue === 'function'
            ? lengthProp.getValue(time || Cesium.JulianDate.now())
            : lengthProp

        if (length) {
          const offset = Number(length) / 2
          return addPositionsHeight(entity._positions_draw[0], offset) as Cesium.Cartesian3
        }
      }
      return null
    }, false) as unknown as Cesium.PositionProperty
  }
}
