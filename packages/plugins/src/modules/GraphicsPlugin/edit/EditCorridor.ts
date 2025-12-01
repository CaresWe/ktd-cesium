import * as Cesium from 'cesium'
import { EditPolyline } from './EditPolyline'
import { setPositionsHeight } from '@ktd-cesium/shared'
import type { ExtendedEntity } from './EditBase'
import type { CorridorEditEntity } from '../types'

/**
 * 走廊编辑类
 * 继承自 EditPolyline
 */
export class EditCorridor extends EditPolyline {
  declare entity: ExtendedEntity & CorridorEditEntity

  /**
   * 获取图形对象
   */
  getGraphic(): Cesium.CorridorGraphics {
    try {
      if (!this.entity) {
        throw new Error('实体对象不存在')
      }

      if (!this.entity.corridor) {
        throw new Error('实体的 corridor 属性不存在')
      }

      return this.entity.corridor
    } catch (error) {
      console.error('EditCorridor.getGraphic: 获取图形对象失败', error)
      throw error
    }
  }

  /**
   * 继承父类，根据属性更新坐标
   * 如果设置了 height 属性，将位置调整到指定高度
   */
  updatePositionsHeightByAttr(position: Cesium.Cartesian3): Cesium.Cartesian3 {
    try {
      const graphic = this.getGraphic()

      if (graphic.height !== undefined && graphic.height) {
        const newHeight = (graphic.height as Cesium.Property).getValue(this.viewer.clock.currentTime) as number

        if (Number.isFinite(newHeight)) {
          // 使用 shared 中的 setPositionsHeight 函数
          const result = setPositionsHeight(position, newHeight)
          return result as Cesium.Cartesian3
        }
      }

      return position
    } catch (error) {
      console.error('EditCorridor.updatePositionsHeightByAttr: 更新位置高度失败', error)
      return position
    }
  }
}
