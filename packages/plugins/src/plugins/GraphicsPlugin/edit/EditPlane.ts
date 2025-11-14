import * as Cesium from 'cesium'
import { EditBase } from './EditBase'
import * as draggerCtl from './Dragger'
import { message } from '../core/Tooltip'
import { setPositionsHeight } from '../core/point'
import { getPositionTranslation } from '../core/matrix'

/**
 * 平面编辑类
 * 继承自 EditBase
 */
export const EditPlane = EditBase.extend({
  /**
   * 图形编辑结束后调用
   */
  finish(this: any) {
    // Empty finish method
  },

  /**
   * 更新Plane的尺寸
   */
  updatePlane(this: any, style: any) {
    const dimensionsX = Cesium.defaultValue(style.dimensionsX, 100.0)
    const dimensionsY = Cesium.defaultValue(style.dimensionsY, 100.0)
    const dimensions = new Cesium.Cartesian2(dimensionsX, dimensionsY)
    this.entity.plane.dimensions.setValue(dimensions)
  },

  /**
   * 绑定拖拽点
   */
  bindDraggers(this: any) {
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

    // 平面的X长度调整
    let offest = { x: 0, y: 0, z: 0 }
    switch (style.plane_normal) {
      case 'x':
        offest.y = style.dimensionsX / 2
        break
      default:
        offest.x = style.dimensionsX / 2
        break
    }
    const position1 = getPositionTranslation(positionZXD, offest)
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

        this.updatePlane(style)
        this.updateDraggers()
      }
    })
    this.draggers.push(draggerX)

    // 平面的Y宽度调整
    if (style.plane_normal === 'z') {
      offest = { x: 0, y: style.dimensionsY / 2, z: 0 }
      const position2 = getPositionTranslation(positionZXD, offest)

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

          this.updatePlane(style)
          this.updateDraggers()
        }
      })
      this.draggers.push(draggerY)
    } else {
      offest = { x: 0, y: 0, z: 0 }
      switch (style.plane_normal) {
        case 'x':
        case 'y':
          offest.z = style.dimensionsY / 2
          break
        default:
          offest.y = style.dimensionsY / 2
          break
      }
      // 顶部的高半径编辑点
      const position2 = getPositionTranslation(positionZXD, offest)

      const draggerY = draggerCtl.createDragger(this.dataSource, {
        position: position2,
        type: draggerCtl.PointType.MoveHeight,
        tooltip: message.dragger.editRadius.replace('半径', '宽度(Y方向)'),
        onDrag: (dragger: any, position: Cesium.Cartesian3) => {
          const radius = this.formatNum(Cesium.Cartesian3.distance(positionZXD, position), 2)
          style.dimensionsY = radius * 2

          this.updatePlane(style)
          this.updateDraggers()
        }
      })
      this.draggers.push(draggerY)
    }
  }
})
