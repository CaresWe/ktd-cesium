import * as Cesium from 'cesium'
import { EditPolygon } from './EditPolygon'
import * as draggerCtl from './Dragger'
import { message } from '../core/Tooltip'

/**
 * 设置坐标的高度
 */
function setPositionsHeight(position: Cesium.Cartesian3, newHeight: number): Cesium.Cartesian3 {
  const cartographic = Cesium.Cartographic.fromCartesian(position)
  return Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, newHeight)
}

/**
 * 计算中心点（质心）
 */
function centerOfMass(positions: Cesium.Cartesian3[]): Cesium.Cartesian3 {
  if (!positions || positions.length === 0) {
    return new Cesium.Cartesian3()
  }

  let x = 0
  let y = 0
  let z = 0

  for (const position of positions) {
    x += position.x
    y += position.y
    z += position.z
  }

  x /= positions.length
  y /= positions.length
  z /= positions.length

  return new Cesium.Cartesian3(x, y, z)
}

/**
 * 矩形编辑类
 * 继承自 EditPolygon
 */
export const EditRectangle = EditPolygon.extend({
  /**
   * 获取图形对象
   */
  getGraphic(this: any) {
    return this.entity.rectangle
  },

  /**
   * 坐标改为回调属性
   */
  changePositionsToCallback(this: any) {
    this._positions_draw = this.entity._positions_draw
  },

  /**
   * 编辑结束
   */
  finish(this: any) {
    this.entity._positions_draw = this._positions_draw
  },

  /**
   * 是否贴地
   */
  isClampToGround(this: any): boolean {
    return this.entity.attribute.style.clampToGround
  },

  /**
   * 绑定拖拽点
   */
  bindDraggers(this: any) {
    const that = this
    const clampToGround = this.isClampToGround()
    const positions = this.getPosition()

    for (let i = 0, len = positions.length; i < len; i++) {
      let position = positions[i]

      if (this.getGraphic().height !== undefined) {
        const newHeight = this.getGraphic().height.getValue(this.viewer.clock.currentTime)
        position = setPositionsHeight(position, newHeight)
      }

      // 各顶点拖拽点
      const dragger = draggerCtl.createDragger(this.dataSource, {
        position: position,
        onDrag: function (dragger: any, position: Cesium.Cartesian3) {
          const time = that.viewer.clock.currentTime
          if (that.getGraphic().height !== undefined) {
            const newHeight = that.getGraphic().height.getValue(time)
            position = setPositionsHeight(position, newHeight)
            dragger.position = position
          }

          positions[dragger.index] = position

          // ============高度调整拖拽点处理=============
          if (that.heightDraggers && that.heightDraggers.length > 0) {
            const extrudedHeight = that.getGraphic().extrudedHeight.getValue(time)
            that.heightDraggers[dragger.index].position = setPositionsHeight(position, extrudedHeight)
          }

          // ============整体平移移动点处理=============
          let positionMove = centerOfMass(positions)
          if (that.getGraphic().height !== undefined) {
            const newHeight = that.getGraphic().height.getValue(time)
            positionMove = setPositionsHeight(positionMove, newHeight)
          }
          draggerMove.position = positionMove
        }
      })
      dragger.index = i
      this.draggers.push(dragger)
    }

    // 整体平移移动点
    let positionMove = centerOfMass(positions)
    if (this.getGraphic().height !== undefined) {
      const newHeight = this.getGraphic().height.getValue(this.viewer.clock.currentTime)
      positionMove = setPositionsHeight(positionMove, newHeight)
    }

    const draggerMove = draggerCtl.createDragger(this.dataSource, {
      position: positionMove,
      type: draggerCtl.PointType.MoveAll,
      tooltip: message.dragger.moveAll,
      onDrag: function (dragger: any, position: Cesium.Cartesian3) {
        // 记录差值
        const diff = Cesium.Cartesian3.subtract(position, positionMove, new Cesium.Cartesian3())
        positionMove = position

        positions.forEach(function (pos: Cesium.Cartesian3, index: number) {
          const newPos = Cesium.Cartesian3.add(pos, diff, new Cesium.Cartesian3())
          positions[index] = newPos
        })

        // =====全部更新==========
        that.updateDraggers()
      }
    })
    this.draggers.push(draggerMove)

    // 创建高程拖拽点
    if (this.getGraphic().extrudedHeight) {
      this.bindHeightDraggers()
    }
  }
})
