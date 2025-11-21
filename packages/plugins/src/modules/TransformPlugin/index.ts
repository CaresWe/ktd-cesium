import * as Cesium from 'cesium'
import { BasePlugin } from '../../BasePlugin'
import type { KtdViewer } from '@ktd-cesium/core'
import {
  TransformMode,
  TransformSpace,
  Axis,
  type TransformData,
  type TransformPluginOptions,
  type TransformEventData,
  type ITransformController
} from './types'

// 重新导出枚举和类型
export { TransformMode, TransformSpace, Axis } from './types'
export type { TransformData, TransformPluginOptions, TransformEventData, ITransformController } from './types'

/** Primitive 类型（用于类型检查） */
type PrimitiveWithTransform = {
  modelMatrix?: Cesium.Matrix4
  _positions_draw?: Cesium.Cartesian3[]
  position?: Cesium.Cartesian3
  geometryInstances?: {
    modelMatrix?: Cesium.Matrix4
  }
}

/**
 * 变换插件 - 支持实体和 Primitive 的拖拽、旋转、缩放操作
 */
export class TransformPlugin extends BasePlugin implements ITransformController {
  static readonly pluginName = 'transform'
  override name = 'transform'

  /** 当前附加的实体 */
  entity: Cesium.Entity | null = null

  /** 当前附加的 Primitive */
  private primitive: PrimitiveWithTransform | null = null

  /** 是否为 Primitive 模式 */
  private isPrimitiveMode = false

  /** Primitive 的初始 modelMatrix（保留用于重置功能） */
  private _primitiveInitialMatrix: Cesium.Matrix4 | null = null

  /** 变换模式 */
  mode: TransformMode = TransformMode.TRANSLATE

  /** 坐标空间 */
  space: TransformSpace = TransformSpace.WORLD

  /** 是否激活 */
  active = false

  /** 配置选项 */
  private options: TransformPluginOptions

  /** 辅助轴实体集合 */
  private gizmoEntities: Cesium.Entity[] = []

  /** 当前拖拽的轴向 */
  private dragAxis: Axis | null = null

  /** 拖拽起始位置 */
  private dragStartPosition: Cesium.Cartesian3 | null = null

  /** 拖拽起始数据 */
  private dragStartTransform: TransformData | null = null

  /** 屏幕空间事件处理器 */
  private handler: Cesium.ScreenSpaceEventHandler | null = null

  /** 辅助轴 DataSource */
  private gizmoDataSource: Cesium.CustomDataSource | null = null

  constructor(options: TransformPluginOptions = {}) {
    super()

    this.options = {
      mode: options.mode || TransformMode.TRANSLATE,
      space: options.space || TransformSpace.WORLD,
      showGizmo: options.showGizmo !== false,
      gizmoSize: options.gizmoSize || 1.0,
      snap: options.snap || false,
      translateSnap: options.translateSnap || 0.1,
      rotateSnap: options.rotateSnap || 5,
      scaleSnap: options.scaleSnap || 0.1
    }

    this.mode = this.options.mode!
    this.space = this.options.space!
  }

  /**
   * 插件安装时的回调
   */
  protected onInstall(_viewer: KtdViewer): void {
    // 创建辅助轴 DataSource
    this.gizmoDataSource = new Cesium.CustomDataSource('transform-gizmo')
    this.cesiumViewer.dataSources.add(this.gizmoDataSource)

    // 创建事件处理器
    this.handler = new Cesium.ScreenSpaceEventHandler(this.cesiumViewer.scene.canvas)
  }

  /**
   * 附加到实体或 Primitive
   */
  attach(target: Cesium.Entity | PrimitiveWithTransform): void {
    // 检查是否是 Entity
    if (target instanceof Cesium.Entity) {
      if (this.entity === target && this.active) return

      // 分离之前的目标
      this.detach()

      this.entity = target
      this.primitive = null
      this.isPrimitiveMode = false
      this._primitiveInitialMatrix = null
    } else {
      // 作为 Primitive 处理
      if (this.primitive === target && this.active) return

      // 分离之前的目标
      this.detach()

      this.primitive = target
      this.entity = null
      this.isPrimitiveMode = true

      // 保存初始 modelMatrix
      if (target.modelMatrix) {
        this._primitiveInitialMatrix = Cesium.Matrix4.clone(target.modelMatrix)
      } else {
        this._primitiveInitialMatrix = Cesium.Matrix4.IDENTITY.clone()
      }
    }

    this.active = true

    // 创建辅助轴
    if (this.options.showGizmo) {
      this.createGizmo()
    }

    // 绑定事件
    this.bindEvents()

    // 触发事件
    this.fireTransformEvent('transform-start')
  }

  /**
   * 附加到 Primitive（便捷方法）
   */
  attachPrimitive(primitive: PrimitiveWithTransform): void {
    this.attach(primitive)
  }

  /**
   * 分离
   */
  detach(): void {
    if (!this.active) return

    this.active = false
    this.entity = null
    this.primitive = null
    this.isPrimitiveMode = false
    this._primitiveInitialMatrix = null
    this.dragAxis = null
    this.dragStartPosition = null
    this.dragStartTransform = null

    // 清除辅助轴
    this.clearGizmo()

    // 解绑事件
    this.unbindEvents()

    // 触发事件
    this.fireTransformEvent('transform-end')
  }

  /**
   * 设置变换模式
   */
  setMode(mode: TransformMode): void {
    if (this.mode === mode) return

    this.mode = mode
    this.options.mode = mode

    // 更新辅助轴
    if (this.active && this.options.showGizmo) {
      this.clearGizmo()
      this.createGizmo()
    }
  }

  /**
   * 设置坐标空间
   */
  setSpace(space: TransformSpace): void {
    if (this.space === space) return

    this.space = space
    this.options.space = space

    // 更新辅助轴
    if (this.active && this.options.showGizmo) {
      this.clearGizmo()
      this.createGizmo()
    }
  }

  /**
   * 获取变换数据
   */
  getTransform(): TransformData | null {
    if (this.isPrimitiveMode && this.primitive) {
      return this.getPrimitiveTransform()
    }

    if (!this.entity) return null

    const position = this.entity.position?.getValue(Cesium.JulianDate.now())
    const orientation = this.entity.orientation?.getValue(Cesium.JulianDate.now())

    if (!position) return null

    // 获取缩放（从模型或自定义属性）
    let scale = new Cesium.Cartesian3(1, 1, 1)
    if (this.entity.model) {
      const modelScale = this.entity.model.scale?.getValue(Cesium.JulianDate.now())
      if (typeof modelScale === 'number') {
        scale = new Cesium.Cartesian3(modelScale, modelScale, modelScale)
      }
    }

    return {
      position,
      rotation: orientation || Cesium.Quaternion.IDENTITY,
      scale
    }
  }

  /**
   * 获取 Primitive 的变换数据
   */
  private getPrimitiveTransform(): TransformData | null {
    if (!this.primitive) return null

    let modelMatrix: Cesium.Matrix4

    // 尝试获取 modelMatrix
    if (this.primitive.modelMatrix) {
      modelMatrix = this.primitive.modelMatrix
    } else if (this.primitive.geometryInstances?.modelMatrix) {
      modelMatrix = this.primitive.geometryInstances.modelMatrix
    } else {
      // 没有 modelMatrix，使用默认值
      modelMatrix = Cesium.Matrix4.IDENTITY
    }

    // 从 modelMatrix 提取位置、旋转、缩放
    const position = Cesium.Matrix4.getTranslation(modelMatrix, new Cesium.Cartesian3())
    const rotationMatrix = Cesium.Matrix4.getMatrix3(modelMatrix, new Cesium.Matrix3())

    // 提取缩放
    const scaleX = Cesium.Cartesian3.magnitude(Cesium.Matrix3.getColumn(rotationMatrix, 0, new Cesium.Cartesian3()))
    const scaleY = Cesium.Cartesian3.magnitude(Cesium.Matrix3.getColumn(rotationMatrix, 1, new Cesium.Cartesian3()))
    const scaleZ = Cesium.Cartesian3.magnitude(Cesium.Matrix3.getColumn(rotationMatrix, 2, new Cesium.Cartesian3()))
    const scale = new Cesium.Cartesian3(scaleX, scaleY, scaleZ)

    // 移除缩放以获取纯旋转矩阵
    const normalizedRotationMatrix = new Cesium.Matrix3()
    Cesium.Matrix3.setColumn(
      normalizedRotationMatrix,
      0,
      Cesium.Cartesian3.normalize(Cesium.Matrix3.getColumn(rotationMatrix, 0, new Cesium.Cartesian3()), new Cesium.Cartesian3()),
      normalizedRotationMatrix
    )
    Cesium.Matrix3.setColumn(
      normalizedRotationMatrix,
      1,
      Cesium.Cartesian3.normalize(Cesium.Matrix3.getColumn(rotationMatrix, 1, new Cesium.Cartesian3()), new Cesium.Cartesian3()),
      normalizedRotationMatrix
    )
    Cesium.Matrix3.setColumn(
      normalizedRotationMatrix,
      2,
      Cesium.Cartesian3.normalize(Cesium.Matrix3.getColumn(rotationMatrix, 2, new Cesium.Cartesian3()), new Cesium.Cartesian3()),
      normalizedRotationMatrix
    )

    const rotation = Cesium.Quaternion.fromRotationMatrix(normalizedRotationMatrix)

    return {
      position,
      rotation,
      scale
    }
  }

  /**
   * 设置变换数据
   */
  setTransform(transform: Partial<TransformData>): void {
    if (this.isPrimitiveMode && this.primitive) {
      this.setPrimitiveTransform(transform)
      return
    }

    if (!this.entity) return

    if (transform.position) {
      this.entity.position = new Cesium.ConstantPositionProperty(transform.position)
    }

    if (transform.rotation) {
      this.entity.orientation = new Cesium.ConstantProperty(transform.rotation)
    }

    if (transform.scale && this.entity.model) {
      // 假设统一缩放
      const uniformScale = transform.scale.x
      this.entity.model.scale = new Cesium.ConstantProperty(uniformScale)
    }

    // 更新辅助轴位置
    if (this.active && this.options.showGizmo) {
      this.updateGizmoPosition()
    }

    // 触发事件
    this.fireTransformEvent('transform-change')
  }

  /**
   * 设置 Primitive 的变换数据
   */
  private setPrimitiveTransform(transform: Partial<TransformData>): void {
    if (!this.primitive) return

    // 获取当前变换
    const currentTransform = this.getPrimitiveTransform()
    if (!currentTransform) return

    const position = transform.position || currentTransform.position
    const rotation = transform.rotation || currentTransform.rotation
    const scale = transform.scale || currentTransform.scale

    // 构建新的 modelMatrix
    const translationMatrix = Cesium.Matrix4.fromTranslation(position)
    const rotationMatrix = Cesium.Matrix3.fromQuaternion(rotation)

    // 应用缩放到旋转矩阵
    const scaledRotationMatrix = new Cesium.Matrix3()
    Cesium.Matrix3.setColumn(
      scaledRotationMatrix,
      0,
      Cesium.Cartesian3.multiplyByScalar(
        Cesium.Matrix3.getColumn(rotationMatrix, 0, new Cesium.Cartesian3()),
        scale.x,
        new Cesium.Cartesian3()
      ),
      scaledRotationMatrix
    )
    Cesium.Matrix3.setColumn(
      scaledRotationMatrix,
      1,
      Cesium.Cartesian3.multiplyByScalar(
        Cesium.Matrix3.getColumn(rotationMatrix, 1, new Cesium.Cartesian3()),
        scale.y,
        new Cesium.Cartesian3()
      ),
      scaledRotationMatrix
    )
    Cesium.Matrix3.setColumn(
      scaledRotationMatrix,
      2,
      Cesium.Cartesian3.multiplyByScalar(
        Cesium.Matrix3.getColumn(rotationMatrix, 2, new Cesium.Cartesian3()),
        scale.z,
        new Cesium.Cartesian3()
      ),
      scaledRotationMatrix
    )

    const rotationMatrix4 = Cesium.Matrix4.fromRotationTranslation(scaledRotationMatrix, Cesium.Cartesian3.ZERO)

    // 合并变换矩阵
    const newModelMatrix = Cesium.Matrix4.multiply(translationMatrix, rotationMatrix4, new Cesium.Matrix4())

    // 应用到 Primitive
    if (this.primitive.modelMatrix) {
      Cesium.Matrix4.clone(newModelMatrix, this.primitive.modelMatrix)
    } else {
      this.primitive.modelMatrix = newModelMatrix
    }

    // 更新辅助轴位置
    if (this.active && this.options.showGizmo) {
      this.updateGizmoPosition()
    }

    // 触发事件
    this.fireTransformEvent('transform-change')
  }

  /**
   * 创建辅助轴
   */
  private createGizmo(): void {
    if (!this.gizmoDataSource) return

    const transform = this.getTransform()
    if (!transform) return

    const position = transform.position
    const size = this.options.gizmoSize || 1.0

    switch (this.mode) {
      case TransformMode.TRANSLATE:
        this.createTranslateGizmo(position, size)
        break
      case TransformMode.ROTATE:
        this.createRotateGizmo(position, size)
        break
      case TransformMode.SCALE:
        this.createScaleGizmo(position, size)
        break
    }
  }

  /**
   * 获取当前目标的位置
   */
  private getCurrentPosition(): Cesium.Cartesian3 | null {
    const transform = this.getTransform()
    return transform?.position || null
  }

  /**
   * 获取当前目标的旋转
   */
  private getCurrentOrientation(): Cesium.Quaternion {
    const transform = this.getTransform()
    return transform?.rotation || Cesium.Quaternion.IDENTITY
  }

  /**
   * 创建平移辅助轴
   */
  private createTranslateGizmo(_position: Cesium.Cartesian3, size: number): void {
    if (!this.gizmoDataSource) return

    const length = 100 * size

    // X轴（红色）
    const xAxis = this.gizmoDataSource.entities.add({
      polyline: {
        positions: new Cesium.CallbackProperty(() => {
          return this.getAxisPositions(Axis.X, length)
        }, false),
        width: 3,
        material: Cesium.Color.RED,
        arcType: Cesium.ArcType.NONE
      }
    })
    ;(xAxis as unknown as Record<string, unknown>).gizmoAxis = Axis.X
    this.gizmoEntities.push(xAxis)

    // Y轴（绿色）
    const yAxis = this.gizmoDataSource.entities.add({
      polyline: {
        positions: new Cesium.CallbackProperty(() => {
          return this.getAxisPositions(Axis.Y, length)
        }, false),
        width: 3,
        material: Cesium.Color.GREEN,
        arcType: Cesium.ArcType.NONE
      }
    })
    ;(yAxis as unknown as Record<string, unknown>).gizmoAxis = Axis.Y
    this.gizmoEntities.push(yAxis)

    // Z轴（蓝色）
    const zAxis = this.gizmoDataSource.entities.add({
      polyline: {
        positions: new Cesium.CallbackProperty(() => {
          return this.getAxisPositions(Axis.Z, length)
        }, false),
        width: 3,
        material: Cesium.Color.BLUE,
        arcType: Cesium.ArcType.NONE
      }
    })
    ;(zAxis as unknown as Record<string, unknown>).gizmoAxis = Axis.Z
    this.gizmoEntities.push(zAxis)

    // 添加箭头端点
    this.createArrowHeads(Axis.X, Cesium.Color.RED, length)
    this.createArrowHeads(Axis.Y, Cesium.Color.GREEN, length)
    this.createArrowHeads(Axis.Z, Cesium.Color.BLUE, length)
  }

  /**
   * 创建旋转辅助轴
   */
  private createRotateGizmo(_position: Cesium.Cartesian3, size: number): void {
    if (!this.gizmoDataSource) return

    const radius = 50 * size

    // X轴环（红色）
    const xRing = this.createRotationRing(Axis.X, radius, Cesium.Color.RED)
    this.gizmoEntities.push(xRing)

    // Y轴环（绿色）
    const yRing = this.createRotationRing(Axis.Y, radius, Cesium.Color.GREEN)
    this.gizmoEntities.push(yRing)

    // Z轴环（蓝色）
    const zRing = this.createRotationRing(Axis.Z, radius, Cesium.Color.BLUE)
    this.gizmoEntities.push(zRing)
  }

  /**
   * 创建缩放辅助轴
   */
  private createScaleGizmo(position: Cesium.Cartesian3, size: number): void {
    if (!this.gizmoDataSource) return

    const length = 100 * size
    const boxSize = 10 * size

    // 创建轴线（同平移）
    this.createTranslateGizmo(position, size)

    // 在轴线端点添加方块而不是箭头
    this.createScaleBox(Axis.X, Cesium.Color.RED, length, boxSize)
    this.createScaleBox(Axis.Y, Cesium.Color.GREEN, length, boxSize)
    this.createScaleBox(Axis.Z, Cesium.Color.BLUE, length, boxSize)
  }

  /**
   * 获取轴向位置
   */
  private getAxisPositions(axis: Axis, length: number): Cesium.Cartesian3[] {
    const position = this.getCurrentPosition()
    if (!position) return []

    const orientation = this.getCurrentOrientation()

    let direction: Cesium.Cartesian3
    if (this.space === TransformSpace.WORLD) {
      // 世界坐标系
      switch (axis) {
        case Axis.X:
          direction = Cesium.Cartesian3.UNIT_X
          break
        case Axis.Y:
          direction = Cesium.Cartesian3.UNIT_Y
          break
        case Axis.Z:
          direction = Cesium.Cartesian3.UNIT_Z
          break
        default:
          direction = Cesium.Cartesian3.UNIT_X
      }
    } else {
      // 本地坐标系
      const rotationMatrix = Cesium.Matrix3.fromQuaternion(orientation)
      switch (axis) {
        case Axis.X:
          direction = Cesium.Matrix3.getColumn(rotationMatrix, 0, new Cesium.Cartesian3())
          break
        case Axis.Y:
          direction = Cesium.Matrix3.getColumn(rotationMatrix, 1, new Cesium.Cartesian3())
          break
        case Axis.Z:
          direction = Cesium.Matrix3.getColumn(rotationMatrix, 2, new Cesium.Cartesian3())
          break
        default:
          direction = Cesium.Matrix3.getColumn(rotationMatrix, 0, new Cesium.Cartesian3())
      }
    }

    const endPosition = Cesium.Cartesian3.add(
      position,
      Cesium.Cartesian3.multiplyByScalar(direction, length, new Cesium.Cartesian3()),
      new Cesium.Cartesian3()
    )

    return [position, endPosition]
  }

  /**
   * 创建箭头端点
   */
  private createArrowHeads(axis: Axis, color: Cesium.Color, length: number): void {
    if (!this.gizmoDataSource) return

    const arrowHead = this.gizmoDataSource.entities.add({
      position: new Cesium.CallbackProperty(() => {
        const positions = this.getAxisPositions(axis, length)
        return positions[1]
      }, false) as unknown as Cesium.PositionProperty,
      point: {
        pixelSize: 8,
        color: color,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2
      }
    })
    ;(arrowHead as unknown as Record<string, unknown>).gizmoAxis = axis
    this.gizmoEntities.push(arrowHead)
  }

  /**
   * 创建旋转环
   */
  private createRotationRing(axis: Axis, radius: number, color: Cesium.Color): Cesium.Entity {
    const segments = 64
    const positions = new Array(segments + 1)

    const entity = this.gizmoDataSource!.entities.add({
      polyline: {
        positions: new Cesium.CallbackProperty(() => {
          const position = this.getCurrentPosition()
          if (!position) return []

          const orientation = this.getCurrentOrientation()

          for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2
            let offset: Cesium.Cartesian3

            if (this.space === TransformSpace.WORLD) {
              // 世界坐标系
              switch (axis) {
                case Axis.X:
                  offset = new Cesium.Cartesian3(0, Math.cos(angle) * radius, Math.sin(angle) * radius)
                  break
                case Axis.Y:
                  offset = new Cesium.Cartesian3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
                  break
                case Axis.Z:
                  offset = new Cesium.Cartesian3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0)
                  break
                default:
                  offset = Cesium.Cartesian3.ZERO
              }
            } else {
              // 本地坐标系
              const rotationMatrix = Cesium.Matrix3.fromQuaternion(orientation)
              let localOffset: Cesium.Cartesian3

              switch (axis) {
                case Axis.X:
                  localOffset = new Cesium.Cartesian3(0, Math.cos(angle) * radius, Math.sin(angle) * radius)
                  break
                case Axis.Y:
                  localOffset = new Cesium.Cartesian3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
                  break
                case Axis.Z:
                  localOffset = new Cesium.Cartesian3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0)
                  break
                default:
                  localOffset = Cesium.Cartesian3.ZERO
              }

              offset = Cesium.Matrix3.multiplyByVector(rotationMatrix, localOffset, new Cesium.Cartesian3())
            }

            positions[i] = Cesium.Cartesian3.add(position, offset, new Cesium.Cartesian3())
          }

          return positions
        }, false),
        width: 2,
        material: color,
        arcType: Cesium.ArcType.NONE
      }
    })
    ;(entity as unknown as Record<string, unknown>).gizmoAxis = axis
    return entity
  }

  /**
   * 创建缩放方块
   */
  private createScaleBox(axis: Axis, color: Cesium.Color, length: number, size: number): void {
    if (!this.gizmoDataSource) return

    const box = this.gizmoDataSource.entities.add({
      position: new Cesium.CallbackProperty(() => {
        const positions = this.getAxisPositions(axis, length)
        return positions[1]
      }, false) as unknown as Cesium.PositionProperty,
      box: {
        dimensions: new Cesium.Cartesian3(size, size, size),
        material: color,
        outline: true,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 1
      }
    })
    ;(box as unknown as Record<string, unknown>).gizmoAxis = axis
    this.gizmoEntities.push(box)
  }

  /**
   * 清除辅助轴
   */
  private clearGizmo(): void {
    if (!this.gizmoDataSource) return

    this.gizmoEntities.forEach(entity => {
      this.gizmoDataSource!.entities.remove(entity)
    })
    this.gizmoEntities = []
  }

  /**
   * 更新辅助轴位置
   */
  private updateGizmoPosition(): void {
    // 由于使用 CallbackProperty，辅助轴会自动更新
  }

  /**
   * 绑定事件
   */
  private bindEvents(): void {
    if (!this.handler) return

    // 左键按下
    this.handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      this.onMouseDown(movement.position)
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN)

    // 鼠标移动
    this.handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      this.onMouseMove(movement.endPosition)
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    // 左键抬起
    this.handler.setInputAction(() => {
      this.onMouseUp()
    }, Cesium.ScreenSpaceEventType.LEFT_UP)
  }

  /**
   * 解绑事件
   */
  private unbindEvents(): void {
    if (!this.handler) return

    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN)
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE)
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP)
  }

  /**
   * 鼠标按下
   */
  private onMouseDown(position: Cesium.Cartesian2): void {
    if (!this.entity && !this.primitive) return

    const pickedObject = this.cesiumViewer.scene.pick(position)
    if (!pickedObject || !Cesium.defined(pickedObject.id)) return

    const pickedEntity = pickedObject.id as Cesium.Entity
    const gizmoAxis = (pickedEntity as unknown as Record<string, unknown>).gizmoAxis as Axis | undefined

    if (!gizmoAxis) return

    // 开始拖拽
    this.dragAxis = gizmoAxis
    this.dragStartTransform = this.getTransform()

    const ray = this.cesiumViewer.camera.getPickRay(position)
    if (ray) {
      const cartesian = this.cesiumViewer.scene.globe.pick(ray, this.cesiumViewer.scene)
      this.dragStartPosition = cartesian || null
    }
  }

  /**
   * 鼠标移动
   */
  private onMouseMove(position: Cesium.Cartesian2): void {
    if (!this.dragAxis || (!this.entity && !this.primitive) || !this.dragStartPosition || !this.dragStartTransform) return

    const ray = this.cesiumViewer.camera.getPickRay(position)
    if (!ray) return

    const cartesian = this.cesiumViewer.scene.globe.pick(ray, this.cesiumViewer.scene)
    if (!cartesian) return

    switch (this.mode) {
      case TransformMode.TRANSLATE:
        this.handleTranslate(cartesian)
        break
      case TransformMode.ROTATE:
        this.handleRotate(cartesian)
        break
      case TransformMode.SCALE:
        this.handleScale(cartesian)
        break
    }
  }

  /**
   * 鼠标抬起
   */
  private onMouseUp(): void {
    this.dragAxis = null
    this.dragStartPosition = null
    this.dragStartTransform = null
  }

  /**
   * 处理平移
   */
  private handleTranslate(currentPosition: Cesium.Cartesian3): void {
    if (!this.dragStartPosition || !this.dragStartTransform) return

    const offset = Cesium.Cartesian3.subtract(currentPosition, this.dragStartPosition, new Cesium.Cartesian3())

    // 根据轴向限制移动
    const constrainedOffset = this.constrainToAxis(offset, this.dragAxis!)

    // 应用吸附
    if (this.options.snap && this.options.translateSnap) {
      const snap = this.options.translateSnap
      constrainedOffset.x = Math.round(constrainedOffset.x / snap) * snap
      constrainedOffset.y = Math.round(constrainedOffset.y / snap) * snap
      constrainedOffset.z = Math.round(constrainedOffset.z / snap) * snap
    }

    const newPosition = Cesium.Cartesian3.add(
      this.dragStartTransform.position,
      constrainedOffset,
      new Cesium.Cartesian3()
    )

    this.setTransform({ position: newPosition })
  }

  /**
   * 处理旋转
   */
  private handleRotate(currentPosition: Cesium.Cartesian3): void {
    if (!this.dragStartPosition || !this.dragStartTransform) return

    const entityPosition = this.getCurrentPosition()
    if (!entityPosition) return

    // 计算旋转角度
    const startVector = Cesium.Cartesian3.subtract(this.dragStartPosition, entityPosition, new Cesium.Cartesian3())
    const currentVector = Cesium.Cartesian3.subtract(currentPosition, entityPosition, new Cesium.Cartesian3())

    Cesium.Cartesian3.normalize(startVector, startVector)
    Cesium.Cartesian3.normalize(currentVector, currentVector)

    let angle = Math.acos(Cesium.Cartesian3.dot(startVector, currentVector))

    // 应用吸附
    if (this.options.snap && this.options.rotateSnap) {
      const snapRad = Cesium.Math.toRadians(this.options.rotateSnap)
      angle = Math.round(angle / snapRad) * snapRad
    }

    // 获取旋转轴
    const axis = this.getRotationAxis(this.dragAxis!)

    // 创建旋转四元数
    const rotation = Cesium.Quaternion.fromAxisAngle(axis, angle)
    const newRotation = Cesium.Quaternion.multiply(this.dragStartTransform.rotation, rotation, new Cesium.Quaternion())

    this.setTransform({ rotation: newRotation })
  }

  /**
   * 处理缩放
   */
  private handleScale(currentPosition: Cesium.Cartesian3): void {
    if (!this.dragStartPosition || !this.dragStartTransform) return

    const entityPosition = this.getCurrentPosition()
    if (!entityPosition) return

    // 计算缩放因子
    const startDistance = Cesium.Cartesian3.distance(this.dragStartPosition, entityPosition)
    const currentDistance = Cesium.Cartesian3.distance(currentPosition, entityPosition)

    let scaleFactor = currentDistance / startDistance

    // 应用吸附
    if (this.options.snap && this.options.scaleSnap) {
      const snap = this.options.scaleSnap
      scaleFactor = Math.round(scaleFactor / snap) * snap
    }

    const newScale = Cesium.Cartesian3.multiplyByScalar(
      this.dragStartTransform.scale,
      scaleFactor,
      new Cesium.Cartesian3()
    )

    this.setTransform({ scale: newScale })
  }

  /**
   * 约束到轴向
   */
  private constrainToAxis(offset: Cesium.Cartesian3, axis: Axis): Cesium.Cartesian3 {
    const result = new Cesium.Cartesian3()

    switch (axis) {
      case Axis.X:
        result.x = offset.x
        break
      case Axis.Y:
        result.y = offset.y
        break
      case Axis.Z:
        result.z = offset.z
        break
      case Axis.XY:
        result.x = offset.x
        result.y = offset.y
        break
      case Axis.YZ:
        result.y = offset.y
        result.z = offset.z
        break
      case Axis.XZ:
        result.x = offset.x
        result.z = offset.z
        break
      case Axis.XYZ:
        return offset
    }

    return result
  }

  /**
   * 获取旋转轴
   */
  private getRotationAxis(axis: Axis): Cesium.Cartesian3 {
    if (!this.entity && !this.primitive) return Cesium.Cartesian3.UNIT_Z

    if (this.space === TransformSpace.WORLD) {
      switch (axis) {
        case Axis.X:
          return Cesium.Cartesian3.UNIT_X
        case Axis.Y:
          return Cesium.Cartesian3.UNIT_Y
        case Axis.Z:
          return Cesium.Cartesian3.UNIT_Z
        default:
          return Cesium.Cartesian3.UNIT_Z
      }
    } else {
      const orientation = this.getCurrentOrientation()
      const rotationMatrix = Cesium.Matrix3.fromQuaternion(orientation)

      switch (axis) {
        case Axis.X:
          return Cesium.Matrix3.getColumn(rotationMatrix, 0, new Cesium.Cartesian3())
        case Axis.Y:
          return Cesium.Matrix3.getColumn(rotationMatrix, 1, new Cesium.Cartesian3())
        case Axis.Z:
          return Cesium.Matrix3.getColumn(rotationMatrix, 2, new Cesium.Cartesian3())
        default:
          return Cesium.Matrix3.getColumn(rotationMatrix, 2, new Cesium.Cartesian3())
      }
    }
  }

  /**
   * 触发变换事件
   */
  private fireTransformEvent(type: string): void {
    if ((!this.entity && !this.primitive) || !this.viewer) return

    const transform = this.getTransform()
    if (!transform) return

    // 对于 Primitive 模式，创建一个临时的 entity 对象用于事件数据
    // 或者使用 entity 为 null
    const eventData: TransformEventData = {
      entity: this.entity as Cesium.Entity, // 对于 Primitive 模式，这可能是 null
      mode: this.mode,
      transform
    }

    // 集成到 EventPlugin（如果已安装）
    const eventPlugin = (this.viewer as unknown as Record<string, unknown>).fire
    if (typeof eventPlugin === 'function') {
      eventPlugin(type, eventData)
    }
  }

  /**
   * 获取当前 Primitive（如果是 Primitive 模式）
   */
  getPrimitive(): PrimitiveWithTransform | null {
    return this.primitive
  }

  /**
   * 检查是否为 Primitive 模式
   */
  isPrimitive(): boolean {
    return this.isPrimitiveMode
  }

  /**
   * 重置 Primitive 到初始状态
   */
  resetPrimitive(): void {
    if (!this.isPrimitiveMode || !this.primitive || !this._primitiveInitialMatrix) return

    if (this.primitive.modelMatrix) {
      Cesium.Matrix4.clone(this._primitiveInitialMatrix, this.primitive.modelMatrix)
    } else {
      this.primitive.modelMatrix = Cesium.Matrix4.clone(this._primitiveInitialMatrix)
    }

    // 更新辅助轴位置
    if (this.active && this.options.showGizmo) {
      this.updateGizmoPosition()
    }

    // 触发事件
    this.fireTransformEvent('transform-change')
  }

  /**
   * 插件销毁时的回调
   */
  protected override onDestroy(): void {
    this.detach()

    if (this.handler) {
      this.handler.destroy()
      this.handler = null
    }

    if (this.gizmoDataSource && this.viewer) {
      this.cesiumViewer.dataSources.remove(this.gizmoDataSource)
      this.gizmoDataSource = null
    }
  }
}
