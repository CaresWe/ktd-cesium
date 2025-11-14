import * as Cesium from 'cesium'
import { EditBase } from './EditBase'
import * as draggerCtl from './Dragger'
import { message } from '../core/Tooltip'

/**
 * 点编辑类
 * 用于编辑点、标注、模型等单点图形
 */
export const EditPoint = EditBase.extend({
  /**
   * 外部更新位置
   */
  setPositions(this: any, position: Cesium.Cartesian3 | Cesium.Cartesian3[]) {
    // 如果传入的是数组且只有一个元素，取出该元素
    if (Array.isArray(position) && position.length === 1) {
      position = position[0]
    }
    this.entity.position.setValue(position)
  },

  /**
   * 绑定拖拽点
   */
  bindDraggers(this: any) {
    const that = this

    this.entity.draw_tooltip = message.dragger.def
    const dragger = draggerCtl.createDragger(this.dataSource, {
      dragger: this.entity,
      onDrag: function (dragger: any, newPosition: Cesium.Cartesian3) {
        that.entity.position.setValue(newPosition)
      }
    })
  },

  /**
   * 图形编辑结束后调用
   */
  finish(this: any) {
    this.entity.draw_tooltip = null
  }
})
