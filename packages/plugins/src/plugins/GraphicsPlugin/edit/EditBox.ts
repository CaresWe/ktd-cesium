import * as Cesium from 'cesium'
import { EditPoint } from './EditPoint'
import * as draggerCtl from './Dragger'
import { message } from '../core/Tooltip'
import { setPositionsHeight } from '../core/point'
import { getPositionTranslation } from '../core/matrix'

/**
 * 立方体编辑类
 * 继承自 EditPoint
 */
export const EditBox = EditPoint.extend({
  /**
   * 图形编辑结束后调用
   */
  finish(this: any) {
    // Empty finish method
  },

  /**
   * 更新Box的尺寸
   */
  updateBox(this: any, style: any) {
    const dimensionsX = Cesium.defaultValue(style.dimensionsX, 100.0)
    const dimensionsY = Cesium.defaultValue(style.dimensionsY, 100.0)
    const dimensionsZ = Cesium.defaultValue(style.dimensionsZ, 100.0)
    const dimensions = new Cesium.Cartesian3(dimensionsX, dimensionsY, dimensionsZ)

    this.entity.box.dimensions.setValue(dimensions)
  },

  /**
   * 绑定拖拽点
   */
  bindDraggers(this: any) {
    const that = this
    const style = this.entity.attribute.style

    // 位置中心点
    const positionZXD = this.entity._positions_draw
    const centerDragger = draggerCtl.createDragger(this.dataSource, {
      position: positionZXD,
      onDrag: (dragger: any, position: Cesium.Cartesian3) => {
        this.entity._positions_draw = position
        this.updateDraggers()
      }
    })
    this.draggers.push(centerDragger)

    // X长度调整
    const offsetX = { x: style.dimensionsX / 2, y: 0, z: 0 }
    const position1 = getPositionTranslation(positionZXD, offsetX)
    const draggerX = draggerCtl.createDragger(this.dataSource, {
      position: position1,
      type: draggerCtl.PointType.EditAttr,
      tooltip: message.dragger.editRadius.replace('半径', '长度(X方向)'),
      onDrag: (dragger: any, position: Cesium.Cartesian3) => {
        const newHeight = Cesium.Cartographic.fromCartesian(positionZXD).height
        position = setPositionsHeight(position, newHeight) as Cesium.Cartesian3
        dragger.position = position

        const radius = this.formatNum(Cesium.Cartesian3.distance(positionZXD, position), 2)
        style.dimensionsX = radius * 2

        this.updateBox(style)
        this.updateDraggers()
      }
    })
    this.draggers.push(draggerX)

    // Y宽度调整
    const offsetY = { x: 0, y: style.dimensionsY / 2, z: 0 }
    const position2 = getPositionTranslation(positionZXD, offsetY)
    const draggerY = draggerCtl.createDragger(this.dataSource, {
      position: position2,
      type: draggerCtl.PointType.EditAttr,
      tooltip: message.dragger.editRadius.replace('半径', '宽度(Y方向)'),
      onDrag: (dragger: any, position: Cesium.Cartesian3) => {
        const newHeight = Cesium.Cartographic.fromCartesian(positionZXD).height
        position = setPositionsHeight(position, newHeight) as Cesium.Cartesian3
        dragger.position = position

        const radius = this.formatNum(Cesium.Cartesian3.distance(positionZXD, position), 2)
        style.dimensionsY = radius * 2

        this.updateBox(style)
        this.updateDraggers()
      }
    })
    this.draggers.push(draggerY)

    // Z高度调整
    const offsetZ = { x: 0, y: 0, z: style.dimensionsZ / 2 }
    const position3 = getPositionTranslation(positionZXD, offsetZ)
    const draggerZ = draggerCtl.createDragger(this.dataSource, {
      position: position3,
      type: draggerCtl.PointType.MoveHeight,
      tooltip: message.dragger.editRadius.replace('半径', '高度(Z方向)'),
      onDrag: (dragger: any, position: Cesium.Cartesian3) => {
        const radius = this.formatNum(Cesium.Cartesian3.distance(positionZXD, position), 2)
        style.dimensionsZ = radius * 2

        this.updateBox(style)
        this.updateDraggers()
      }
    })
    this.draggers.push(draggerZ)
  }
})
