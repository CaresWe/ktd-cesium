import { EditPolyline } from './EditPolyline'
import { line2curve } from '../core/CurveUtil'
import * as Cesium from 'cesium'

/**
 * 曲线编辑类
 * 编辑时显示控制点，动态更新曲线平滑效果
 */
export const EditCurve = EditPolyline.extend({
  _positions_show: null as Cesium.Cartesian3[] | null,

  /**
   * 修改坐标会回调，提高显示的效率
   */
  changePositionsToCallback(this: any): void {
    this._positions_draw = this.entity._positions_draw
    this._positions_show = this.entity._positions_show ||
      this.getGraphic().positions.getValue(this.viewer.clock.currentTime)
  },

  /**
   * 坐标位置相关
   */
  updateAttrForEditing(this: any): void {
    if (this._positions_draw == null || this._positions_draw.length < 3) {
      this._positions_show = this._positions_draw
      return
    }

    // 根据控制点重新生成平滑曲线
    const closure = this.entity.attribute.style.closure || false
    this._positions_show = line2curve(this._positions_draw, closure)
    this.entity._positions_show = this._positions_show
  },

  /**
   * 图形编辑结束后调用
   */
  finish(this: any): void {
    this.entity._positions_show = this._positions_show
    this.entity._positions_draw = this._positions_draw
  }
})
