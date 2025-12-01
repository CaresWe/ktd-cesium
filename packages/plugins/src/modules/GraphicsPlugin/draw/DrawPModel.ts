import * as Cesium from 'cesium'
import { DrawBase } from './DrawBase'
import type {
  AttrClass,
  EditClassConstructor,
  ModelPrimitiveConfig,
  ModelPrimitiveStyle,
  ModelPrimitiveAttribute,
  ExtendedModelPrimitive
} from '../types'
import { getCurrentMousePosition } from '@ktd-cesium/shared'
import * as attr from '../attr/AttrModel'
import { defaultMessages } from '../../TooltipPlugin/messages'
import { GraphicsEventType } from '../../EventPlugin'
import { EditPModel } from '../edit/EditPModel'

/**
 * Primitive类型的3D模型绘制类
 * 使用Primitive而非Entity方式渲染模型，性能更高
 */
export class DrawPModel extends DrawBase {
  type = 'model-p'
  editClass = EditPModel as unknown as EditClassConstructor
  attrClass = attr as AttrClass
  // entity 在此类中实际是 Model Primitive，但保持基类类型以兼容

  /**
   * 根据attribute参数创建Primitive
   */
  createFeature(attribute: Record<string, unknown>): Cesium.Entity {
    this._positions_draw = Cesium.Cartesian3.ZERO

    const modelAttr = attribute as ModelPrimitiveAttribute
    const style = modelAttr.style

    // 使用异步方式创建模型
    Cesium.Model.fromGltfAsync({
      url: style.modelUrl || '',
      modelMatrix: this.getModelMatrix(style),
      minimumPixelSize: style.minimumPixelSize !== undefined ? style.minimumPixelSize : 0.0,
      scale: style.scale !== undefined ? style.scale : 1.0
    }).then((model) => {
      const modelPrimitive = this.primitives!.add(model) as unknown as ExtendedModelPrimitive
      modelPrimitive.attribute = modelAttr
      this.entity = modelPrimitive as unknown as Cesium.Entity

      // 模型加载完成后应用样式
      this.style2Entity(style, this.entity)
    })

    // 临时返回一个占位 entity
    return {} as Cesium.Entity
  }

  /**
   * 获取模型的变换矩阵
   */
  getModelMatrix(cfg: ModelPrimitiveConfig, position?: Cesium.Cartesian3): Cesium.Matrix4 {
    const hpRoll = new Cesium.HeadingPitchRoll(
      Cesium.Math.toRadians(cfg.heading || 0),
      Cesium.Math.toRadians(cfg.pitch || 0),
      Cesium.Math.toRadians(cfg.roll || 0)
    )
    const fixedFrameTransform = Cesium.Transforms.eastNorthUpToFixedFrame

    const modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(
      position || (this._positions_draw as Cesium.Cartesian3),
      hpRoll,
      this.viewer!.scene.globe.ellipsoid,
      fixedFrameTransform
    )
    return modelMatrix
  }

  /**
   * 样式转Entity属性
   */
  protected style2Entity(style: Record<string, unknown>, entity: Cesium.Entity): void {
    const modelStyle = style as ModelPrimitiveStyle
    const extModel = entity as unknown as ExtendedModelPrimitive
    extModel.modelMatrix = this.getModelMatrix(modelStyle, extModel.position)
    attr.style2Entity(modelStyle, extModel as unknown as attr.ModelEntityAttr)
  }

  /**
   * 绑定鼠标事件（支持PC端和移动端）
   */
  override bindEvent(): void {
    // 鼠标移动或触摸移动
    this.bindMoveEvent((position: Cesium.Cartesian2) => {
      const point = getCurrentMousePosition(this.viewer.scene, position, this.entity)
      if (point) {
        this._positions_draw = point
        const extModel = this.entity as unknown as ExtendedModelPrimitive
        if (extModel.attribute?.style) {
          extModel.modelMatrix = this.getModelMatrix(extModel.attribute.style)
        }
      }

      // 显示 Tooltip 提示
      if (this.tooltip) {
        this.tooltip.showAt(position, defaultMessages.draw.point.start)
      }

      // 触发鼠标移动事件
      this.fire(GraphicsEventType.DRAW_MOUSE_MOVE, {
        drawtype: this.type,
        entity: this.entity,
        position: point
      })
    })

    // 左键点击或触摸
    this.bindClickEvent((position: Cesium.Cartesian2) => {
      const point = getCurrentMousePosition(this.viewer.scene, position, this.entity)
      if (point) {
        this._positions_draw = point
        this.disable()
      }
    })
  }

  /**
   * 图形绘制结束,更新属性
   */
  finish(): void {
    if (!this.entity) return

    const extModel = this.entity as unknown as ExtendedModelPrimitive
    if (extModel.attribute?.style) {
      extModel.modelMatrix = this.getModelMatrix(extModel.attribute.style)
    }

    extModel.editing = this.getEditClass(this.entity)
    extModel.position = this.getDrawPosition() as Cesium.Cartesian3
  }
}
