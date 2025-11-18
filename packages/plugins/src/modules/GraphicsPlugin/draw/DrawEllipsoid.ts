import * as Cesium from 'cesium'
import { DrawPolyline } from './DrawPolyline'
import type { AttrClass } from './DrawBase'
import * as attr from '../attr/AttrEllipsoid'
import { EditEllipsoid } from '../edit/EditEllipsoid'
import { getEllipseOuterPositions } from '../attr/AttrCircle'
import type { EditBase } from '../edit/EditBase'

/**
 * 椭球体样式接口
 */
interface EllipsoidStyle extends Record<string, unknown> {
  extentRadii?: number
  widthRadii?: number
  heightRadii?: number
  rotation?: number
}

/**
 * 椭球体属性接口
 */
interface EllipsoidAttribute extends Record<string, unknown> {
  style?: EllipsoidStyle
}

/**
 * 扩展的 Entity 类型（支持椭球体属性）
 */
interface ExtendedEntity extends Cesium.Entity {
  attribute?: EllipsoidAttribute
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
 * 椭球体绘制类
 */
export class DrawEllipsoid extends DrawPolyline {
  type = 'ellipsoid'
  // 坐标位置相关
  override _minPointNum = 2 // 至少需要点的个数
  override _maxPointNum = 3 // 最多允许点的个数

  override editClass = EditEllipsoid as EditClassConstructor
  override attrClass = attr as AttrClass

  /**
   * 获取显示位置（椭球体中心）
   */
  getShowPosition(_time?: Cesium.JulianDate): Cesium.Cartesian3 | null {
    const positions = this._positions_draw as Cesium.Cartesian3[]
    if (positions && positions.length > 0) {
      return positions[0]
    }
    return null
  }

  /**
   * 根据 attribute 参数创建 Entity
   */
  createFeature(attribute: Record<string, unknown>): Cesium.Entity {
    this._positions_draw = []

    const ellipsoidAttr = attribute as EllipsoidAttribute

    const addattr: Cesium.Entity.ConstructorOptions & { attribute: Record<string, unknown> } = {
      position: new Cesium.CallbackProperty(() => {
        return this.getShowPosition()
      }, false) as unknown as Cesium.PositionProperty,
      ellipsoid: attr.style2Entity(ellipsoidAttr.style),
      attribute: attribute
    }

    this.entity = this.dataSource!.entities.add(addattr) // 创建要素对象
    return this.entity
  }

  /**
   * 样式转 entity
   */
  protected style2Entity(style: Record<string, unknown>, entity: Cesium.Entity): attr.EllipsoidEntityAttr {
    return attr.style2Entity(style as attr.EllipsoidStyle, entity.ellipsoid as unknown as attr.EllipsoidEntityAttr)
  }

  /**
   * 更新绘制属性
   */
  updateAttrForDrawing(isLoad?: boolean): void {
    const positions = this._positions_draw as Cesium.Cartesian3[]
    if (!positions) return

    if (isLoad) {
      if (positions instanceof Cesium.Cartesian3) {
        this._positions_draw = [positions]
      }
      this.addPositionsForRadius((this._positions_draw as Cesium.Cartesian3[])[0])
      return
    }

    if (positions.length < 2) return

    const extEntity = this.entity as ExtendedEntity
    const style = extEntity.attribute?.style

    if (!style) return

    // 半径处理
    const radius = this.formatNum(Cesium.Cartesian3.distance(positions[0], positions[1]), 2)
    style.extentRadii = radius // 短半轴
    style.heightRadii = radius

    // 长半轴
    let semiMajorAxis: number
    if (positions.length === 3) {
      semiMajorAxis = this.formatNum(Cesium.Cartesian3.distance(positions[0], positions[2]), 2)
    } else {
      semiMajorAxis = radius
    }
    style.widthRadii = semiMajorAxis

    this.updateRadii(style)
  }

  /**
   * 更新椭球体半径
   */
  updateRadii(style: EllipsoidStyle): void {
    if (!this.entity?.ellipsoid) return

    const extentRadii = style.extentRadii || 100
    const widthRadii = style.widthRadii || 100
    const heightRadii = style.heightRadii || 100

    const radiiValue = new Cesium.Cartesian3(extentRadii, widthRadii, heightRadii)
    this.entity.ellipsoid.radii = new Cesium.ConstantProperty(radiiValue)
  }

  /**
   * 根据半径添加位置点
   */
  addPositionsForRadius(position: Cesium.Cartesian3): void {
    const extEntity = this.entity as ExtendedEntity
    const style = extEntity.attribute?.style

    if (!style) return

    // 获取圆（或椭圆）边线上的坐标点数组
    const outerPositions = getEllipseOuterPositions({
      position: position,
      semiMajorAxis: Number(style.extentRadii || 100), // 长半轴
      semiMinorAxis: Number(style.widthRadii || 100), // 短半轴
      rotation: Cesium.Math.toRadians(Number(style.rotation || 0))
    })

    const positions = this._positions_draw as Cesium.Cartesian3[]

    // 长半轴上的坐标点
    positions.push(outerPositions[0])

    // 短半轴上的坐标点
    positions.push(outerPositions[1])
  }

  /**
   * 图形绘制结束后调用
   */
  finish(): void {
    const entity = this.entity!
    const extEntity = entity as ExtendedEntity

    extEntity.editing = this.getEditClass(entity) // 绑定编辑对象

    extEntity._positions_draw = this._positions_draw
    extEntity.position = new Cesium.CallbackProperty(() => {
      const positions = extEntity._positions_draw
      if (positions && Array.isArray(positions) && positions.length > 0) {
        return positions[0]
      }
      return null
    }, false) as unknown as Cesium.PositionProperty
  }
}
