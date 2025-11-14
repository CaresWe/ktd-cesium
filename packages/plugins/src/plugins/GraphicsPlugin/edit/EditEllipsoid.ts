import * as Cesium from 'cesium'
import { EditBase } from './EditBase'
import * as draggerCtl from './Dragger'
import { message } from '../core/Tooltip'
import { setPositionsHeight, addPositionsHeight } from '../core/point'
import { getEllipseOuterPositions } from '../attr/AttrCircle'

/**
 * 椭球体编辑类
 * 继承自 EditBase
 */
export const EditEllipsoid = EditBase.extend({
  /**
   * 图形编辑结束后调用
   */
  finish(this: any) {
    // Empty finish method
  },

  /**
   * 更新Ellipsoid的半径
   */
  updateRadii(this: any, style: any) {
    const radii = new Cesium.Cartesian3(
      Number(style.extentRadii),
      Number(style.widthRadii),
      Number(style.heightRadii)
    )
    this.entity.ellipsoid.radii.setValue(radii)
  },

  /**
   * 绑定拖拽点
   */
  bindDraggers(this: any) {
    const that = this
    const style = this.entity.attribute.style

    // 位置中心点
    const position = this.entity._positions_draw[0]
    const centerDragger = draggerCtl.createDragger(this.dataSource, {
      position: position,
      onDrag: function (dragger: any, position: Cesium.Cartesian3) {
        that.entity._positions_draw[0] = position
        that.updateDraggers()
      }
    })
    this.draggers.push(centerDragger)

    // 顶部的高半径编辑点
    const positionCenter = this.entity.position.getValue(this.viewer.clock.currentTime)
    const topDragger = draggerCtl.createDragger(this.dataSource, {
      position: addPositionsHeight(positionCenter, style.heightRadii) as Cesium.Cartesian3,
      type: draggerCtl.PointType.MoveHeight,
      tooltip: message.dragger.editRadius,
      onDrag: function (dragger: any, position: Cesium.Cartesian3) {
        const positionZXD = that.entity._positions_draw[0]
        const length = that.formatNum(Cesium.Cartesian3.distance(positionZXD, position), 2)
        style.heightRadii = length

        that.updateRadii(style)
        that.updateDraggers()
      }
    })
    this.draggers.push(topDragger)

    // 获取圆（或椭圆）边线上的坐标点数组
    const outerPositions = getEllipseOuterPositions({
      position: positionCenter,
      semiMajorAxis: Number(style.extentRadii),
      semiMinorAxis: Number(style.widthRadii),
      rotation: Cesium.Math.toRadians(Number(style.rotation || 0))
    })

    // 长半轴上的坐标点
    const majorPos = outerPositions[0]
    const majorDragger = draggerCtl.createDragger(this.dataSource, {
      position: majorPos,
      type: draggerCtl.PointType.EditAttr,
      tooltip: message.dragger.editRadius,
      onDrag: function (dragger: any, position: Cesium.Cartesian3) {
        const positionZXD = that.entity._positions_draw[0]
        const newHeight = Cesium.Cartographic.fromCartesian(positionZXD).height
        position = setPositionsHeight(position, newHeight) as Cesium.Cartesian3
        dragger.position = position

        const radius = that.formatNum(Cesium.Cartesian3.distance(positionZXD, position), 2)
        style.widthRadii = radius

        that.updateRadii(style)
        that.updateDraggers()
      }
    })
    centerDragger.majorDragger = majorDragger
    this.draggers.push(majorDragger)

    // 短半轴上的坐标点
    const minorPos = outerPositions[1]
    const minorDragger = draggerCtl.createDragger(this.dataSource, {
      position: minorPos,
      type: draggerCtl.PointType.EditAttr,
      tooltip: message.dragger.editRadius,
      onDrag: function (dragger: any, position: Cesium.Cartesian3) {
        const positionZXD = that.entity._positions_draw[0]
        const newHeight = Cesium.Cartographic.fromCartesian(positionZXD).height
        position = setPositionsHeight(position, newHeight) as Cesium.Cartesian3
        dragger.position = position

        const radius = that.formatNum(Cesium.Cartesian3.distance(positionZXD, position), 2)
        style.extentRadii = radius

        that.updateRadii(style)
        that.updateDraggers()
      }
    })
    centerDragger.minorDragger = minorDragger
    this.draggers.push(minorDragger)
  }
})
