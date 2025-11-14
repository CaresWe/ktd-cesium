import * as Cesium from 'cesium'
import { DrawPolyline } from './DrawPolyline'
import * as attr from '../attr/AttrWall'
import { EditWall } from '../edit/EditWall'

/**
 * 获取坐标数组中的最大高度
 */
function getMaxHeight(positions: Cesium.Cartesian3[]): number {
  if (!positions || positions.length === 0) return 0

  let maxHeight = 0
  for (const position of positions) {
    const cartographic = Cesium.Cartographic.fromCartesian(position)
    if (cartographic.height > maxHeight) {
      maxHeight = cartographic.height
    }
  }
  return maxHeight
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

  editClass = EditWall
  attrClass = attr

  private maximumHeights: number[] = []
  private minimumHeights: number[] = []

  /**
   * 根据 attribute 创建 Entity
   */
  createFeature(attribute: any): Cesium.Entity {
    this._positions_draw = []

    if (!(this as any)._minPointNum_def) {
      ;(this as any)._minPointNum_def = this._minPointNum
    }
    if (!(this as any)._maxPointNum_def) {
      ;(this as any)._maxPointNum_def = this._maxPointNum
    }

    if (attribute.config) {
      // 允许外部传入
      this._minPointNum = attribute.config.minPointNum || (this as any)._minPointNum_def
      this._maxPointNum = attribute.config.maxPointNum || (this as any)._maxPointNum_def
    } else {
      this._minPointNum = (this as any)._minPointNum_def
      this._maxPointNum = (this as any)._maxPointNum_def
    }

    this.maximumHeights = []
    this.minimumHeights = []

    const that = this
    const addattr: any = {
      wall: attr.style2Entity(attribute.style),
      attribute: attribute
    }

    addattr.wall.positions = new Cesium.CallbackProperty(() => {
      return that.getDrawPosition()
    }, false)

    addattr.wall.minimumHeights = new Cesium.CallbackProperty(() => {
      return that.getMinimumHeights()
    }, false)

    addattr.wall.maximumHeights = new Cesium.CallbackProperty(() => {
      return that.getMaximumHeights()
    }, false)

    this.entity = this.dataSource!.entities.add(addattr) // 创建要素对象
    return this.entity
  }

  /**
   * 样式 Entity
   */
  style2Entity(style: any, entity: Cesium.Entity): any {
    return attr.style2Entity(style, (entity as any).wall)
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
    if (!this._positions_draw) return

    const style = this.entity!.attribute.style
    const position = this.getDrawPosition()
    const len = position.length

    this.maximumHeights = new Array(len)
    this.minimumHeights = new Array(len)

    for (let i = 0; i < len; i++) {
      const height = Cesium.Cartographic.fromCartesian(position[i]).height
      this.minimumHeights[i] = height
      this.maximumHeights[i] = height + Number(style.extrudedHeight || 100)
    }
  }

  /**
   * 完成绘制后调用
   */
  finish(): void {
    const entity = this.entity!

    entity.editing = this.getEditClass(entity) // 绑定编辑对象

    ;(entity as any)._positions_draw = this.getDrawPosition()
    ;(entity as any).wall.positions = new Cesium.CallbackProperty(() => {
      return (entity as any)._positions_draw
    }, false)

    ;(entity as any)._minimumHeights = this.getMinimumHeights()
    ;(entity as any).wall.minimumHeights = new Cesium.CallbackProperty(() => {
      return (entity as any)._minimumHeights
    }, false)

    ;(entity as any)._maximumHeights = this.getMaximumHeights()
    ;(entity as any).wall.maximumHeights = new Cesium.CallbackProperty(() => {
      return (entity as any)._maximumHeights
    }, false)
  }
}
