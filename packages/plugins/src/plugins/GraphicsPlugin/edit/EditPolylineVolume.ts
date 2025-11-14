import * as Cesium from 'cesium'
import { EditPolyline } from './EditPolyline'

/**
 * 管道体编辑类
 * 继承自 EditPolyline
 */
export const EditPolylineVolume = EditPolyline.extend({
  /**
   * 取entity对象的对应矢量数据
   */
  getGraphic(this: any) {
    return this.entity.polylineVolume
  },

  /**
   * 修改坐标会回调，提高显示的效率
   */
  changePositionsToCallback(this: any) {
    this._positions_draw = this.entity._positions_draw
  }
})
