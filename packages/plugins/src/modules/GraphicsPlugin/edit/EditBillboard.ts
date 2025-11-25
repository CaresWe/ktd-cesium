import * as Cesium from 'cesium'
import { EditPoint } from './EditPoint'
import type { BillboardEditEntity } from '../types'

/**
 * 广告牌编辑类
 * 继承自 EditPoint
 * 支持：
 * - 位置拖拽
 * - 图标更新
 */
export class EditBillboard extends EditPoint {
  declare entity: Cesium.Entity & BillboardEditEntity

  /**
   * 获取图形对象
   * 返回 BillboardGraphics 对象
   */
  getGraphic(): Cesium.BillboardGraphics {
    try {
      if (!this.entity) {
        throw new Error('实体对象不存在')
      }

      if (!this.entity.billboard) {
        throw new Error('实体的 billboard 属性不存在')
      }

      return this.entity.billboard
    } catch (error) {
      console.error('EditBillboard.getGraphic: 获取图形对象失败', error)
      throw error
    }
  }
}
