import * as Cesium from 'cesium'
import { EditPolyline } from './EditPolyline'

/**
 * 设置坐标的高度
 */
function setPositionsHeight(position: Cesium.Cartesian3, newHeight: number): Cesium.Cartesian3 {
  const cartographic = Cesium.Cartographic.fromCartesian(position)
  return Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, newHeight)
}

/**
 * 走廊编辑类
 * 继承自 EditPolyline
 */
export const EditCorridor = EditPolyline.extend({
  /**
   * 获取图形对象
   */
  getGraphic(this: any) {
    return this.entity.corridor
  },

  /**
   * 继承父类，根据属性更新坐标
   */
  updatePositionsHeightByAttr(this: any, position: Cesium.Cartesian3): Cesium.Cartesian3 {
    if (this.getGraphic().height !== undefined) {
      const newHeight = this.getGraphic().height.getValue(this.viewer.clock.currentTime)
      position = setPositionsHeight(position, newHeight)
    }
    return position
  }
})
