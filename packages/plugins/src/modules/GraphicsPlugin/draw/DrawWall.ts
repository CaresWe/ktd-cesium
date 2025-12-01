import * as Cesium from 'cesium'
import { DrawPolyline } from './DrawPolyline'
import * as attr from '../attr/AttrWall'
import { EditWall } from '../edit/EditWall'
import type { EditClassConstructor, AttrClass, WallDrawAttribute, WallExtendedEntity } from '../types'
import type { EditBase } from '../edit/EditBase'

/**
 * 扩展的 WallGraphics 接口
 */
interface ExtendedWallGraphics extends Cesium.WallGraphics {
  positions?: Cesium.Property | Cesium.Cartesian3[]
  minimumHeights?: Cesium.Property | number[]
  maximumHeights?: Cesium.Property | number[]
}

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

    const wallAttr = attribute as WallDrawAttribute

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

    if (addattr.wall) {
      const extWall = addattr.wall as ExtendedWallGraphics
      extWall.positions = new Cesium.CallbackProperty(() => {
        return this.getDrawPosition()
      }, false) as unknown as Cesium.Property
      extWall.minimumHeights = new Cesium.CallbackProperty(() => {
        return this.getMinimumHeights()
      }, false) as unknown as Cesium.Property
      extWall.maximumHeights = new Cesium.CallbackProperty(() => {
        return this.getMaximumHeights()
      }, false) as unknown as Cesium.Property
    }

    this.entity = this.dataSource!.entities.add(addattr) // 创建要素对象
    return this.entity
  }

  /**
   * 样式转 Entity
   */
  protected style2Entity(style: Record<string, unknown>, entity: Cesium.Entity): attr.WallEntityAttr {
    const extEntity = entity as WallExtendedEntity
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

    const extEntity = this.entity as WallExtendedEntity
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
    const extEntity = entity as WallExtendedEntity
    const positions = this.getPositions(entity)
    this._positions_draw = positions

    const time = this.viewer!.clock.currentTime

    const extWall = extEntity.wall as ExtendedWallGraphics
    const minHeights = extWall?.minimumHeights
    const maxHeights = extWall?.maximumHeights

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

    if (!minimumHeights || minimumHeights.length === 0 || !maximumHeights || maximumHeights.length === 0) {
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
    const extEntity = entity as WallExtendedEntity

    extEntity.editing = this.getEditClass(entity) as EditBase // 绑定编辑对象

    const positions = this.getDrawPosition()
    if (positions) {
      extEntity._positions_draw = Array.isArray(positions) ? positions : [positions]
    }

    if (extEntity.wall) {
      const extWall = extEntity.wall as ExtendedWallGraphics
      extWall.positions = new Cesium.CallbackProperty(() => {
        return extEntity._positions_draw
      }, false) as unknown as Cesium.Property
    }

    extEntity._minimumHeights = this.getMinimumHeights()
    if (extEntity.wall) {
      const extWall = extEntity.wall as ExtendedWallGraphics
      extWall.minimumHeights = new Cesium.CallbackProperty(() => {
        return extEntity._minimumHeights
      }, false) as unknown as Cesium.Property
    }

    extEntity._maximumHeights = this.getMaximumHeights()
    if (extEntity.wall) {
      const extWall = extEntity.wall as ExtendedWallGraphics
      extWall.maximumHeights = new Cesium.CallbackProperty(() => {
        return extEntity._maximumHeights
      }, false) as unknown as Cesium.Property
    }
  }
}
