import * as Cesium from 'cesium'
import { DrawBase, type AttrClass } from './DrawBase'
import { getCurrentMousePosition } from '@ktd-cesium/shared'
import * as attr from '../attr/AttrModel'
import { defaultMessages } from '../../TooltipPlugin/messages'
import { EditPModel } from '../edit/EditPModel'

/**
 * 模型配置接口
 */
interface ModelConfig {
  modelUrl?: string
  heading?: number
  pitch?: number
  roll?: number
  scale?: number
  minimumPixelSize?: number
}

/**
 * 模型样式接口
 */
interface ModelStyle extends ModelConfig {
  [key: string]: unknown
}

/**
 * 模型属性接口
 */
interface ModelAttribute {
  style: ModelStyle
  [key: string]: unknown
}

/**
 * 扩展的 Model Primitive 类型
 */
interface ExtendedModelPrimitive extends Cesium.Model {
  attribute?: ModelAttribute
  editing?: unknown
  position?: Cesium.Cartesian3
}

/**
 * 鼠标移动事件参数接口
 */
interface MouseMoveEvent {
  endPosition: Cesium.Cartesian2
}

/**
 * 鼠标点击事件参数接口
 */
interface MouseClickEvent {
  position: Cesium.Cartesian2
}

/**
 * Primitive类型的3D模型绘制类
 * 使用Primitive而非Entity方式渲染模型，性能更高
 */
export class DrawPModel extends DrawBase {
  type = 'model-p'
  editClass = EditPModel as unknown
  attrClass = attr as AttrClass
  // entity 在此类中实际是 Model Primitive，但保持基类类型以兼容

  /**
   * 根据attribute参数创建Primitive
   */
  createFeature(attribute: Record<string, unknown>): Cesium.Entity {
    this._positions_draw = Cesium.Cartesian3.ZERO

    const modelAttr = attribute as ModelAttribute
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
  getModelMatrix(cfg: ModelConfig, position?: Cesium.Cartesian3): Cesium.Matrix4 {
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
    const modelStyle = style as ModelStyle
    const extModel = entity as unknown as ExtendedModelPrimitive
    extModel.modelMatrix = this.getModelMatrix(modelStyle, extModel.position)
    attr.style2Entity(modelStyle, extModel as unknown as attr.ModelEntityAttr)
  }

  /**
   * 绑定鼠标事件
   */
  bindEvent(): void {
    this.getHandler().setInputAction((event: MouseMoveEvent) => {
      const point = getCurrentMousePosition(this.viewer!.scene, event.endPosition, this.entity)
      if (point) {
        this._positions_draw = point
        const extModel = this.entity as unknown as ExtendedModelPrimitive
        if (extModel.attribute?.style) {
          extModel.modelMatrix = this.getModelMatrix(extModel.attribute.style)
        }
      }
      this.tooltip!.showAt(event.endPosition, defaultMessages.draw.point.start)
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    this.getHandler().setInputAction((event: MouseClickEvent) => {
      const point = getCurrentMousePosition(this.viewer!.scene, event.position, this.entity)
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
    if (!this.entity) return

    const extModel = this.entity as unknown as ExtendedModelPrimitive
    if (extModel.attribute?.style) {
      extModel.modelMatrix = this.getModelMatrix(extModel.attribute.style)
    }

    extModel.editing = this.getEditClass(this.entity)
    extModel.position = this.getDrawPosition() as Cesium.Cartesian3
  }
}
