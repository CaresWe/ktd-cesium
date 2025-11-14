import * as Cesium from 'cesium'
import { DrawPolyline } from './DrawPolyline'
import * as attr from '../attr/AttrCorridor'
import { EditCorridor } from '../edit/EditCorridor'

/**
 * 判断是否是数字
 */
function isNumber(obj: any): boolean {
  return typeof obj === 'number' && obj.constructor === Number
}

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
  _minPointNum = 2 // 至少需要点的个数
  _maxPointNum = 9999 // 最多允许点的个数

  editClass = EditCorridor
  attrClass = attr

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

    const that = this
    const addattr: any = {
      corridor: attr.style2Entity(attribute.style),
      attribute: attribute
    }

    addattr.corridor.positions = new Cesium.CallbackProperty(() => {
      return that.getDrawPosition()
    }, false)

    this.entity = this.dataSource!.entities.add(addattr) // 创建要素对象
    ;(this.entity as any)._positions_draw = this._positions_draw

    return this.entity
  }

  /**
   * 样式 Entity
   */
  style2Entity(style: any, entity: Cesium.Entity): any {
    return attr.style2Entity(style, (entity as any).corridor)
  }

  /**
   * 更新绘制属性
   */
  updateAttrForDrawing(): void {
    if (!this._positions_draw) return

    const style = this.entity!.attribute.style
    if (!style.clampToGround) {
      const maxHeight = getMaxHeight(this.getDrawPosition())
      if (maxHeight !== 0) {
        ;(this.entity as any).corridor.height = maxHeight
        style.height = maxHeight

        if (style.extrudedHeight && isNumber(style.extrudedHeight)) {
          ;(this.entity as any).corridor.extrudedHeight = maxHeight + Number(style.extrudedHeight)
        }
      }
    }
  }

  /**
   * 完成绘制后调用
   */
  finish(): void {
    const entity = this.entity!

    entity.editing = this.getEditClass(entity) // 绑定编辑对象

    ;(entity as any)._positions_draw = this.getDrawPosition()
    ;(entity as any).corridor.positions = new Cesium.CallbackProperty(() => {
      return (entity as any)._positions_draw
    }, false)
  }
}
