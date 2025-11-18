import * as Cesium from 'cesium'
import { DrawPolyline } from './DrawPolyline'
import * as attr from '../attr/AttrWall'
import { EditWall } from '../edit/EditWall'
import type { EditBase } from '../edit/EditBase'
import type { AttrClass } from './DrawBase'
/**
 * 墙体配置接口
 */
interface WallConfig {
  minPointNum?: number
  maxPointNum?: number
}

/**
 * 墙体样式接口
 */
interface WallStyle extends Record<string, unknown> {
  extrudedHeight?: number
  [key: string]: unknown
}

/**
 * 墙体属性接口
 */
interface WallAttribute extends Record<string, unknown> {
  style?: WallStyle
  config?: WallConfig
}

/**
 * 扩展的 Wall 类型
 */
interface ExtendedWallGraphics {
  positions?: Cesium.Property
  minimumHeights?: Cesium.Property | number[]
  maximumHeights?: Cesium.Property | number[]
  [key: string]: unknown
}

/**
 * 扩展的 Entity 类型（支持墙体属性）
 */
interface ExtendedEntity extends Omit<Cesium.Entity, 'wall'> {
  attribute?: WallAttribute
  editing?: EditBase
  _positions_draw?: Cesium.Cartesian3[]
  _minimumHeights?: number[]
  _maximumHeights?: number[]
  wall?: ExtendedWallGraphics
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
 * 墙体绘制类
 *
 * 绘制流程:
 * - 点击添加点位
 * - 移动鼠标预览墙体
 * - 双击或右键完成绘制
 */
export class DrawWall extends DrawPolyline {
  type = 'wall'
  // 坐标点数
  _minPointNum = 2 // 至少需要点的个数
  _maxPointNum = 9999 // 最多允许点的个数

  editClass = EditWall as EditClassConstructor
  override attrClass = attr as AttrClass

  private maximumHeights: number[] = []
  private minimumHeights: number[] = []

  _minPointNum_def?: number
  _maxPointNum_def?: number

  /**
   * 根据 attribute 创建 Entity
   */
  createFeature(attribute: Record<string, unknown>): Cesium.Entity {
    this._positions_draw = []

    const wallAttr = attribute as WallAttribute

    if (!this._minPointNum_def) {
      this._minPointNum_def = this._minPointNum
    }
    if (!this._maxPointNum_def) {
      this._maxPointNum_def = this._maxPointNum
    }

    if (wallAttr.config) {
      // 允许外部传入
      this._minPointNum = wallAttr.config.minPointNum || this._minPointNum_def
      this._maxPointNum = wallAttr.config.maxPointNum || this._maxPointNum_def
    } else {
      this._minPointNum = this._minPointNum_def
      this._maxPointNum = this._maxPointNum_def
    }

    this.maximumHeights = []
    this.minimumHeights = []

    const addattr: Cesium.Entity.ConstructorOptions & { attribute: Record<string, unknown> } = {
      wall: attr.style2Entity(wallAttr.style),
      attribute: attribute
    }

    const wallGraphics = addattr.wall as ExtendedWallGraphics
    wallGraphics.positions = new Cesium.CallbackProperty(() => {
      return this.getDrawPosition()
    }, false) as unknown as Cesium.Property

    wallGraphics.minimumHeights = new Cesium.CallbackProperty(() => {
      return this.getMinimumHeights()
    }, false) as unknown as Cesium.Property

    wallGraphics.maximumHeights = new Cesium.CallbackProperty(() => {
      return this.getMaximumHeights()
    }, false) as unknown as Cesium.Property

    this.entity = this.dataSource!.entities.add(addattr) // 创建要素对象
    return this.entity
  }

  /**
   * 样式转 Entity
   */
  protected style2Entity(style: Record<string, unknown>, entity: Cesium.Entity): attr.WallEntityAttr {
    const extEntity = entity as ExtendedEntity
    return attr.style2Entity(style as attr.WallStyleConfig, extEntity.wall as unknown as attr.WallEntityAttr)
  }

  /**
   * 获取最大高度数组
   */
  getMaximumHeights(): number[] {
    return this.maximumHeights
  }

  /**
   * 获取最小高度数组
   */
  getMinimumHeights(): number[] {
    return this.minimumHeights
  }

  /**
   * 更新绘制属性
   */
  updateAttrForDrawing(): void {
    if (!this._positions_draw || !this.entity) return

    const extEntity = this.entity as ExtendedEntity
    const attribute = extEntity.attribute
    if (!attribute) return

    const style = attribute.style
    const positions = this.getDrawPosition()
    if (!positions) return

    // 确保 positions 是数组类型
    const posArray = Array.isArray(positions) ? positions : [positions]
    const len = posArray.length

    this.maximumHeights = new Array(len)
    this.minimumHeights = new Array(len)

    for (let i = 0; i < len; i++) {
      const height = Cesium.Cartographic.fromCartesian(posArray[i]).height
      this.minimumHeights[i] = height
      this.maximumHeights[i] = height + Number(style?.extrudedHeight || 100)
    }
  }

  /**
   * 获取外部 entity 的坐标到 _positions_draw
   */
  setDrawPositionByEntity(entity: Cesium.Entity): void {
    const extEntity = entity as ExtendedEntity
    const positions = this.getPositions(entity)
    this._positions_draw = positions

    const time = this.viewer!.clock.currentTime

    const minHeights = extEntity.wall?.minimumHeights
    const maxHeights = extEntity.wall?.maximumHeights

    let minimumHeights: number[] | undefined
    let maximumHeights: number[] | undefined

    if (minHeights && typeof (minHeights as Cesium.Property).getValue === 'function') {
      minimumHeights = (minHeights as Cesium.Property).getValue(time)
    }

    if (maxHeights && typeof (maxHeights as Cesium.Property).getValue === 'function') {
      maximumHeights = (maxHeights as Cesium.Property).getValue(time)
    }

    extEntity._minimumHeights = minimumHeights
    extEntity._maximumHeights = maximumHeights

    if (
      !minimumHeights ||
      minimumHeights.length === 0 ||
      !maximumHeights ||
      maximumHeights.length === 0
    ) {
      return
    }

    if (!extEntity.attribute) {
      extEntity.attribute = {}
    }
    if (!extEntity.attribute.style) {
      extEntity.attribute.style = {}
    }
    extEntity.attribute.style.extrudedHeight = maximumHeights[0] - minimumHeights[0]
  }

  /**
   * 完成绘制后调用
   */
  finish(): void {
    const entity = this.entity!
    const extEntity = entity as ExtendedEntity

    extEntity.editing = this.getEditClass(entity) as EditBase // 绑定编辑对象

    const positions = this.getDrawPosition()
    if (positions) {
      extEntity._positions_draw = Array.isArray(positions) ? positions : [positions]
    }

    if (extEntity.wall) {
      extEntity.wall.positions = new Cesium.CallbackProperty(() => {
        return extEntity._positions_draw
      }, false) as unknown as Cesium.Property
    }

    extEntity._minimumHeights = this.getMinimumHeights()
    if (extEntity.wall) {
      extEntity.wall.minimumHeights = new Cesium.CallbackProperty(() => {
        return extEntity._minimumHeights
      }, false) as unknown as Cesium.Property
    }

    extEntity._maximumHeights = this.getMaximumHeights()
    if (extEntity.wall) {
      extEntity.wall.maximumHeights = new Cesium.CallbackProperty(() => {
        return extEntity._maximumHeights
      }, false) as unknown as Cesium.Property
    }
  }
}
