import * as Cesium from 'cesium'
import { EditPoint } from './EditPoint'
import type { LabelEditEntity } from '../types'

/**
 * 文本标签编辑类
 * 继承自 EditPoint
 * 支持：
 * - 位置拖拽
 * - 文本内容更新
 */
export class EditLabel extends EditPoint {
  declare entity: Cesium.Entity & LabelEditEntity

  /**
   * 获取图形对象
   * 返回 LabelGraphics 对象
   */
  getGraphic(): Cesium.LabelGraphics {
    try {
      if (!this.entity) {
        throw new Error('实体对象不存在')
      }

      if (!this.entity.label) {
        throw new Error('实体的 label 属性不存在')
      }

      return this.entity.label
    } catch (error) {
      console.error('EditLabel.getGraphic: 获取图形对象失败', error)
      throw error
    }
  }
}
