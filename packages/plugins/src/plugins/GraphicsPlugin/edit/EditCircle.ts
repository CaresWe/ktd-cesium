import * as Cesium from 'cesium'
import { EditPolygon } from './EditPolygon'
import * as draggerCtl from './Dragger'
import { message } from '../core/Tooltip'
import { getEllipseOuterPositions } from '../attr/AttrCircle'

/**
 * ¾nMnØ¦
 */
function setPositionsHeight(position: Cesium.Cartesian3, newHeight: number): Cesium.Cartesian3 {
  const cartographic = Cesium.Cartographic.fromCartesian(position)
  return Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, newHeight)
}

/**
 * b/-‘{
 * çê EditPolygon
 */
export const EditCircle = EditPolygon.extend({
  /**
   * ·Öþbùa
   */
  getGraphic(this: any) {
    return this.entity.ellipse
  },

  /**
   * Mnlb:Þýp
   */
  changePositionsToCallback(this: any) {
    this._positions_draw = this.entity._positions_draw
    this.finish()
  },

  /**
   * ‘Ó_(
   */
  finish(this: any) {
    this.entity._positions_draw = this._positions_draw
  },

  /**
   * /&40
   */
  isClampToGround(this: any): boolean {
    return this.entity.attribute.style.clampToGround
  },

  /**
   * ·ÖMn
   */
  getPosition(this: any): Cesium.Cartesian3[] {
    //  
Ø¦
    if (this.getGraphic().height !== undefined) {
      const newHeight = this.getGraphic().height.getValue(this.viewer.clock.currentTime)
      for (let i = 0, len = this._positions_draw.length; i < len; i++) {
        this._positions_draw[i] = setPositionsHeight(this._positions_draw[i], newHeight)
      }
    }
    return this._positions_draw
  },

  /**
   * ÑšÖý¹
   */
  bindDraggers(this: any) {
    const that = this
    const clampToGround = this.isClampToGround()
    const positions = this.getPosition()
    const style = this.entity.attribute.style

    // -Ã¹
    let position = positions[0]

    const dragger = draggerCtl.createDragger(this.dataSource, {
      position: position,
      onDrag: function (dragger: any, position: Cesium.Cartesian3) {
        // °Uî<
        const diff = Cesium.Cartesian3.subtract(
          position,
          positions[dragger.index],
          new Cesium.Cartesian3()
        )

        positions[dragger.index] = position

        // Ø¦
        if (!style.clampToGround) {
          const height = that.formatNum(Cesium.Cartographic.fromCartesian(position).height, 2)
          that.getGraphic().height = height
          style.height = height
        }

        const time = that.viewer.clock.currentTime

        // J„e
        let newPos = Cesium.Cartesian3.add(
          dragger.majorDragger.position.getValue(time),
          diff,
          new Cesium.Cartesian3()
        )
        dragger.majorDragger.position = newPos

        if (dragger.minorDragger) {
          newPos = Cesium.Cartesian3.add(
            dragger.minorDragger.position.getValue(time),
            diff,
            new Cesium.Cartesian3()
          )
          dragger.minorDragger.position = newPos
        }

        // Ø¦tÖý¹
        if (that.entity.attribute.style.extrudedHeight !== undefined) {
          that.updateDraggers()
        }
      }
    })
    dragger.index = 0
    this.draggers.push(dragger)

    const time = this.viewer.clock.currentTime

    // ·Ö-	¹¿
„P¹pÄ
    const outerPositions = getEllipseOuterPositions({
      position: position,
      semiMajorAxis: this.getGraphic().semiMajorAxis.getValue(time),
      semiMinorAxis: this.getGraphic().semiMinorAxis.getValue(time),
      rotation: Cesium.Math.toRadians(Number(style.rotation || 0))
    })

    // Jt
„P¹
    let majorPos = outerPositions[1]
    positions[1] = majorPos

    const majorDragger = draggerCtl.createDragger(this.dataSource, {
      position: majorPos,
      type: draggerCtl.PointType.EditAttr,
      tooltip: message.dragger.editRadius,
      onDrag: function (dragger: any, position: Cesium.Cartesian3) {
        if (that.getGraphic().height !== undefined) {
          const newHeight = that.getGraphic().height.getValue(time)
          position = setPositionsHeight(position, newHeight)
          dragger.position = position
        }
        positions[dragger.index] = position

        const radius = that.formatNum(Cesium.Cartesian3.distance(positions[0], position), 2)
        that.getGraphic().semiMajorAxis = radius

        if (that._maxPointNum === 3 || !Cesium.defined(style.radius)) {
          // -
          style.semiMajorAxis = radius
        } else {
          // 
          that.getGraphic().semiMinorAxis = radius
          style.radius = radius
        }

        that.updateDraggers()
      }
    })
    majorDragger.index = 1
    dragger.majorDragger = majorDragger
    this.draggers.push(majorDragger)

    // íJt
„P¹(-)
    if (this._maxPointNum === 3) {
      let minorPos = outerPositions[0]
      positions[2] = minorPos

      const minorDragger = draggerCtl.createDragger(this.dataSource, {
        position: minorPos,
        type: draggerCtl.PointType.EditAttr,
        tooltip: message.dragger.editRadius,
        onDrag: function (dragger: any, position: Cesium.Cartesian3) {
          if (that.getGraphic().height !== undefined) {
            const newHeight = that.getGraphic().height.getValue(time)
            position = setPositionsHeight(position, newHeight)
            dragger.position = position
          }
          positions[dragger.index] = position

          const radius = that.formatNum(Cesium.Cartesian3.distance(positions[0], position), 2)
          that.getGraphic().semiMinorAxis = radius

          if (that._maxPointNum === 3 || !Cesium.defined(style.radius)) {
            // -
            style.semiMinorAxis = radius
          } else {
            // 
            that.getGraphic().semiMajorAxis = radius
            style.radius = radius
          }

          that.updateDraggers()
        }
      })
      minorDragger.index = 2
      dragger.minorDragger = minorDragger
      this.draggers.push(minorDragger)
    }

    // úØ¦Öý¹ (‚œ	É8Ø¦)
    if (this.getGraphic().extrudedHeight) {
      const _pos = this._maxPointNum === 3 ? [positions[1], positions[2]] : [positions[1]]
      this.bindHeightDraggers(_pos)
    }
  }
})
