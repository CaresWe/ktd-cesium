import * as Cesium from 'cesium'
import { EditBase } from './EditBase'
import * as draggerCtl from './Dragger'
import { message } from '../core/Tooltip'
import * as circleAttr from '../attr/AttrCircle'
import { addPositionsHeight } from '../core/point'

/**
 * Primitive模型编辑类
 * 用于编辑Primitive类型的3D模型
 */
export const EditPModel = EditBase.extend({
  /**
   * 外部更新位置
   */
  setPositions(this: any, position: Cesium.Cartesian3 | Cesium.Cartesian3[]) {
    if (Array.isArray(position) && position.length === 1) {
      position = position[0]
    }
    this.entity.position = position
    this.entity.modelMatrix = this.getModelMatrix()
  },

  /**
   * 获取模型变换矩阵
   */
  getModelMatrix(this: any, position?: Cesium.Cartesian3): Cesium.Matrix4 {
    const cfg = this.entity.attribute.style

    const hpRoll = new Cesium.HeadingPitchRoll(
      Cesium.Math.toRadians(cfg.heading || 0),
      Cesium.Math.toRadians(cfg.pitch || 0),
      Cesium.Math.toRadians(cfg.roll || 0)
    )
    const fixedFrameTransform = Cesium.Transforms.eastNorthUpToFixedFrame

    const modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(
      position || this.entity.position,
      hpRoll,
      this.viewer.scene.globe.ellipsoid,
      fixedFrameTransform
    )

    return modelMatrix
  },

  /**
   * 绑定拖拽点
   */
  bindDraggers(this: any) {
    if (!this.entity.ready) {
      const that = this
      this.entity.readyPromise.then(function (model: any) {
        that.bindDraggers()
      })
      return
    }

    const that = this

    this.entity.draw_tooltip = message.dragger.def

    const dragger = draggerCtl.createDragger(this.dataSource, {
      dragger: this.entity,
      onDrag: function (dragger: any, newPosition: Cesium.Cartesian3) {
        that.entity.position = newPosition
        that.entity.modelMatrix = that.getModelMatrix(newPosition)
        that.updateDraggers()
      }
    })

    const style = this.entity.attribute.style
    const position = this.entity.position
    const height = Cesium.Cartographic.fromCartesian(position).height
    const radius = this.entity.boundingSphere.radius

    // 辅助显示：创建角度调整底部圆
    this.entityAngle = this.dataSource.entities.add({
      name: '角度调整底部圆',
      position: new Cesium.CallbackProperty((time: any) => {
        return that.entity.position
      }, false),
      ellipse: circleAttr.style2Entity({
        fill: false,
        outline: true,
        outlineColor: '#ffff00',
        outlineOpacity: 0.8,
        radius: radius,
        height: height
      })
    })

    // 创建角度调整拖拽点
    const majorPos = this.getHeadingPosition()
    const majorDragger = draggerCtl.createDragger(this.dataSource, {
      position: majorPos,
      type: draggerCtl.PointType.EditAttr,
      tooltip: message.dragger.editHeading,
      onDrag: function (dragger: any, position: Cesium.Cartesian3) {
        const heading = that.getHeading(that.entity.position, position)
        style.heading = that.formatNum(heading, 1)

        that.entity.modelMatrix = that.getModelMatrix()
        dragger.position = that.getHeadingPosition()
      }
    })
    this.draggers.push(majorDragger)

    // 缩放控制点
    const position_scale = addPositionsHeight(position, radius) as Cesium.Cartesian3
    const scaleDragger = draggerCtl.createDragger(this.dataSource, {
      position: position_scale,
      type: draggerCtl.PointType.MoveHeight,
      tooltip: message.dragger.editScale,
      onDrag: function (dragger: any, positionNew: Cesium.Cartesian3) {
        const radiusNew = Cesium.Cartesian3.distance(positionNew, position)

        const radiusOld = dragger.radius / style.scale
        const scaleNew = radiusNew / radiusOld

        dragger.radius = radiusNew
        style.scale = that.formatNum(scaleNew, 2)

        that.entity.scale = style.scale
        that.updateDraggers()
      }
    })
    ;(scaleDragger as any).radius = radius
    this.draggers.push(scaleDragger)
  },

  /**
   * 销毁拖拽点
   */
  destroyDraggers(this: any) {
    EditBase.prototype.destroyDraggers.call(this)

    if (this.entityAngle) {
      this.dataSource.entities.remove(this.entityAngle)
      delete this.entityAngle
    }
    if (this.entityBox) {
      this.dataSource.entities.remove(this.entityBox)
      delete this.entityBox
    }
  },

  /**
   * 图形编辑结束后调用
   */
  finish(this: any) {
    this.entity.draw_tooltip = null
  },

  /**
   * 获取朝向位置
   */
  getHeadingPosition(this: any): Cesium.Cartesian3 {
    const position = this.entity.position
    const radius = this.entity.boundingSphere.radius
    const angle = -Number(this.entity.attribute.style.heading || 0)

    let rotpos = new Cesium.Cartesian3(radius, 0.0, 0.0)

    let mat = Cesium.Transforms.eastNorthUpToFixedFrame(position)
    const rotationX = Cesium.Matrix4.fromRotationTranslation(
      Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(angle))
    )
    Cesium.Matrix4.multiply(mat, rotationX, mat)

    const mat3 = Cesium.Matrix4.getMatrix3(mat, new Cesium.Matrix3())
    rotpos = Cesium.Matrix3.multiplyByVector(mat3, rotpos, rotpos)
    rotpos = Cesium.Cartesian3.add(position, rotpos, rotpos)
    return rotpos
  },

  /**
   * 获取点相对于中心点的地面角度
   */
  getHeading(this: any, positionCenter: Cesium.Cartesian3, positionNew: Cesium.Cartesian3): number {
    // 获取该位置的默认矩阵
    let mat = Cesium.Transforms.eastNorthUpToFixedFrame(positionCenter)
    const mat3 = Cesium.Matrix4.getMatrix3(mat, new Cesium.Matrix3())

    const xaxis = Cesium.Matrix3.getColumn(mat3, 0, new Cesium.Cartesian3())
    const yaxis = Cesium.Matrix3.getColumn(mat3, 1, new Cesium.Cartesian3())
    const zaxis = Cesium.Matrix3.getColumn(mat3, 2, new Cesium.Cartesian3())

    // 计算该位置和positionCenter的角度值
    let dir = Cesium.Cartesian3.subtract(positionNew, positionCenter, new Cesium.Cartesian3())
    // z cross (dirx cross z) 得到在xy平面的向量
    dir = Cesium.Cartesian3.cross(dir, zaxis, dir)
    dir = Cesium.Cartesian3.cross(zaxis, dir, dir)
    dir = Cesium.Cartesian3.normalize(dir, dir)

    let heading = Cesium.Cartesian3.angleBetween(xaxis, dir)

    const ay = Cesium.Cartesian3.angleBetween(yaxis, dir)
    if (ay > Math.PI * 0.5) {
      heading = 2 * Math.PI - heading
    }

    return -Cesium.Math.toDegrees(heading)
  }
})
