import * as Cesium from 'cesium'
import { DrawBase } from './DrawBase'
import { getCurrentMousePosition } from '../core/Util'
import * as attr from '../attr/AttrModel'
import { message } from '../core/Tooltip'
import { EditPModel } from '../edit/EditPModel'

/**
 * Primitive类型的3D模型绘制类
 * 使用Primitive而非Entity方式渲染模型，性能更高
 */
export class DrawPModel extends DrawBase {
  type = 'model-p'
  editClass = EditPModel
  attrClass = attr

  /**
   * 根据attribute参数创建Primitive
   */
  createFeature(attribute: any): any {
    this._positions_draw = Cesium.Cartesian3.ZERO

    const style = attribute.style

    const modelPrimitive = this.primitives!.add(
      Cesium.Model.fromGltf({
        url: style.modelUrl,
        modelMatrix: this.getModelMatrix(style),
        minimumPixelSize: Cesium.defaultValue(style.minimumPixelSize, 0.0),
        scale: Cesium.defaultValue(style.scale, 1.0)
      })
    )

    modelPrimitive.readyPromise.then((model: any) => {
      this.style2Entity(style, this.entity)
    })

    ;(modelPrimitive as any).attribute = attribute
    this.entity = modelPrimitive

    return this.entity
  }

  /**
   * 获取模型的变换矩阵
   */
  getModelMatrix(cfg: any, position?: Cesium.Cartesian3): Cesium.Matrix4 {
    const hpRoll = new Cesium.HeadingPitchRoll(
      Cesium.Math.toRadians(cfg.heading || 0),
      Cesium.Math.toRadians(cfg.pitch || 0),
      Cesium.Math.toRadians(cfg.roll || 0)
    )
    const fixedFrameTransform = Cesium.Transforms.eastNorthUpToFixedFrame

    const modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(
      position || this._positions_draw,
      hpRoll,
      this.viewer.scene.globe.ellipsoid,
      fixedFrameTransform
    )
    return modelMatrix
  }

  /**
   * 样式转Entity属性
   */
  style2Entity(style: any, entity: any): any {
    entity.modelMatrix = this.getModelMatrix(style, entity.position)
    return attr.style2Entity(style, entity)
  }

  /**
   * 绑定鼠标事件
   */
  bindEvent(): void {
    this.getHandler().setInputAction((event: any) => {
      const point = getCurrentMousePosition(this.viewer.scene, event.endPosition, this.entity)
      if (point) {
        this._positions_draw = point
        this.entity.modelMatrix = this.getModelMatrix(this.entity.attribute.style)
      }
      this.tooltip!.showAt(event.endPosition, message.draw.point.start)
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    this.getHandler().setInputAction((event: any) => {
      const point = getCurrentMousePosition(this.viewer.scene, event.position, this.entity)
      if (point) {
        this._positions_draw = point
        this.disable()
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
  }

  /**
   * 图形绘制结束,更新属性
   */
  finish(): void {
    this.entity.modelMatrix = this.getModelMatrix(this.entity.attribute.style)
    this.entity.editing = this.getEditClass(this.entity)
    this.entity.position = this.getDrawPosition()
  }
}
