import * as Cesium from 'cesium'
import { EditPolyline } from './EditPolyline'
import type { ExtendedEntity } from './EditBase'
import type { WallEditEntity } from '../types'

/**
 * 墙体编辑类
 * 继承自 EditPolyline
 */
export class EditWall extends EditPolyline {
  declare entity: ExtendedEntity & WallEditEntity

  /**
   * 获取图形对象
   * 返回 WallGraphics 对象
   */
  getGraphic(): Cesium.WallGraphics {
    try {
      if (!this.entity) {
        throw new Error('实体对象不存在')
      }

      if (!this.entity.wall) {
        throw new Error('实体的 wall 属性不存在')
      }

      return this.entity.wall
    } catch (error) {
      console.error('EditWall.getGraphic: 获取图形对象失败', error)
      throw error
    }
  }
}
