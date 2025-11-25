import * as Cesium from 'cesium'
import { EditPolyline } from './EditPolyline'
import type { ExtendedEntity } from './EditBase'
import type { PolylineVolumeEditEntity } from '../types'

/**
 * 管道体编辑类
 * 继承自 EditPolyline
 */
export class EditPolylineVolume extends EditPolyline {
  declare entity: ExtendedEntity & PolylineVolumeEditEntity

  /**
   * 获取图形对象
   * 返回 PolylineVolumeGraphics 对象
   */
  getGraphic(): Cesium.PolylineVolumeGraphics {
    try {
      if (!this.entity) {
        throw new Error('实体对象不存在')
      }

      if (!this.entity.polylineVolume) {
        throw new Error('实体的 polylineVolume 属性不存在')
      }

      return this.entity.polylineVolume
    } catch (error) {
      console.error('EditPolylineVolume.getGraphic: 获取图形对象失败', error)
      throw error
    }
  }

  /**
   * 将位置转换为回调函数
   * 修改坐标会回调，提高显示的效率
   */
  protected changePositionsToCallback(): void {
    try {
      if (!this.entity) {
        throw new Error('实体对象不存在')
      }

      this._positions_draw = this.entity._positions_draw || null
    } catch (error) {
      console.error('EditPolylineVolume.changePositionsToCallback: 转换位置失败', error)
      throw error
    }
  }
}
