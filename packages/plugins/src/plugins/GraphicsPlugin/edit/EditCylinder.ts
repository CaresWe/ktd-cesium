import * as Cesium from 'cesium'
import { EditPolygon } from './EditPolygon'
import * as draggerCtl from './Dragger'
import { message } from '../core/Tooltip'
import { addPositionsHeight } from '../core/point'
import { getEllipseOuterPositions } from '../attr/AttrCircle'

/**
 * 圆柱体编辑类
 * 继承自 EditPolygon
 */
export const EditCylinder = EditPolygon.extend({
  /**
   * 取entity对象的对应矢量数据
   */
  getGraphic(this: any) {
    return this.entity.cylinder
  },

  /**
   * 修改坐标会回调，提高显示的效率
   */
  changePositionsToCallback(this: any) {
    this._positions_draw = this.entity._positions_draw

    const time = this.viewer.clock.currentTime
    const style = this.entity.attribute.style

    style.topRadius = this.getGraphic().topRadius.getValue(time)
    this.getGraphic().topRadius = new Cesium.CallbackProperty(function (time: any) {
      return style.topRadius
    }, false)

    style.bottomRadius = this.getGraphic().bottomRadius.getValue(time)
    this.getGraphic().bottomRadius = new Cesium.CallbackProperty(function (time: any) {
      return style.bottomRadius
    }, false)

    style.length = this.getGraphic().length.getValue(time)
    this.getGraphic().length = new Cesium.CallbackProperty(function (time: any) {
      return style.length
    }, false)
  },

  /**
   * 图形编辑结束后调用
   */
  finish(this: any) {
    this.entity._positions_draw = this._positions_draw

    const style = this.entity.attribute.style
    this.getGraphic().topRadius = style.topRadius
    this.getGraphic().bottomRadius = style.bottomRadius
    this.getGraphic().length = style.length
  },

  /**
   * 绑定拖拽点
   */
  bindDraggers(this: any) {
    const that = this

    const positions = this.getPosition()
    const style = this.entity.attribute.style
    const time = this.viewer.clock.currentTime

    // 中心点
    let index = 0
    const position = positions[index]
    const dragger = draggerCtl.createDragger(this.dataSource, {
      position: position,
      onDrag: function (dragger: any, position: Cesium.Cartesian3) {
        positions[dragger.index] = position
        that.updateDraggers()
      }
    })
    dragger.index = index
    this.draggers.push(dragger)

    // 获取圆（或椭圆）边线上的坐标点数组
    const outerPositions = getEllipseOuterPositions({
      position: position,
      semiMajorAxis: style.bottomRadius,
      semiMinorAxis: style.bottomRadius,
      rotation: Cesium.Math.toRadians(Number(style.rotation || 0))
    })

    // 长半轴上的坐标点
    index = 1
    const majorPos = outerPositions[0]
    positions[index] = majorPos
    const bottomRadiusDragger = draggerCtl.createDragger(this.dataSource, {
      position: majorPos,
      type: draggerCtl.PointType.EditAttr,
      tooltip: message.dragger.editRadius,
      onDrag: function (dragger: any, position: Cesium.Cartesian3) {
        positions[dragger.index] = position

        const radius = that.formatNum(Cesium.Cartesian3.distance(positions[0], position), 2)
        style.bottomRadius = radius

        that.updateDraggers()
      }
    })
    bottomRadiusDragger.index = index
    this.draggers.push(bottomRadiusDragger)

    // 创建高度拖拽点
    index = 2
    const positionHeight = addPositionsHeight(positions[0], style.length) as Cesium.Cartesian3
    positions[index] = positionHeight
    const draggerTop = draggerCtl.createDragger(this.dataSource, {
      position: positionHeight,
      type: draggerCtl.PointType.MoveHeight,
      tooltip: message.dragger.moveHeight,
      onDrag: function (dragger: any, position: Cesium.Cartesian3) {
        positions[dragger.index] = position
        const length = that.formatNum(Cesium.Cartesian3.distance(positions[0], position), 2)
        style.length = length

        that.updateDraggers()
      }
    })
    draggerTop.index = index
    this.draggers.push(draggerTop)
  }
})
