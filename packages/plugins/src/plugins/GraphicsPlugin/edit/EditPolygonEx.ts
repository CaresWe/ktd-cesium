import * as Cesium from 'cesium'
import { EditPolygon } from './EditPolygon'

/**
 * 扩展面编辑类
 * 用于外部扩展使用，绘制的点与显示的点不一致的标绘
 * 子类需要重写 getShowPositions 方法
 */
export const EditPolygonEx = EditPolygon.extend({
  _hasMidPoint: false,

  /**
   * 修改坐标会回调，提高显示的效率
   */
  changePositionsToCallback(this: any) {
    this._positions_draw = this.entity._positions_draw
    this._positions_show = this.entity._positions_show
  },

  /**
   * 坐标位置相关
   */
  updateAttrForEditing(this: any) {
    if (this._positions_draw == null || this._positions_draw.length < this._minPointNum) {
      this._positions_show = this._positions_draw
      return
    }

    this._positions_show = this.getShowPositions(this._positions_draw, this.entity.attribute)
    this.entity._positions_show = this._positions_show
  },

  /**
   * 子类中重写，根据标绘绘制的点，生成显示的边界点
   * @param positions 原始绘制点
   * @param attribute 属性
   * @returns 显示点位
   */
  getShowPositions(this: any, positions: Cesium.Cartesian3[], attribute: any): Cesium.Cartesian3[] {
    return positions
  },

  /**
   * 图形编辑结束后调用
   */
  finish(this: any) {
    this.entity._positions_show = this._positions_show
    this.entity._positions_draw = this._positions_draw
  }
})
