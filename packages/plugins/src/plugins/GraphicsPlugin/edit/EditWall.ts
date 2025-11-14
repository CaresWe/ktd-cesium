import * as Cesium from 'cesium'
import { EditPolyline } from './EditPolyline'

/**
 * 墙体编辑类
 * 继承自 EditPolyline
 */
export const EditWall = EditPolyline.extend({
  /**
   * 获取图形对象
   */
  getGraphic(this: any) {
    return this.entity.wall
  }
})
