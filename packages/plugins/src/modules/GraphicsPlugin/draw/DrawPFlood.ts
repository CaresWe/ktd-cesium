import * as Cesium from 'cesium'
import { DrawPWater } from './DrawPWater'
import type { FloodPrimitiveAttribute, FloodAnimationState } from '../types'

/**
 * 扩展的 Primitive 接口，包含洪水属性
 */
interface FloodPrimitive extends Cesium.Primitive {
  _floodAttribute?: FloodPrimitiveAttribute
  _positions_draw?: Cesium.Cartesian3[]
}

/**
 * 洪水推进 Primitive 绘制类
 * 支持水位动态上升/下降，模拟洪水推进效果
 */
export class DrawPFlood extends DrawPWater {
  override type = 'flood-p'

  /** 动画状态 */
  private floodState: FloodAnimationState = {
    isAnimating: false,
    startTime: 0,
    currentHeight: 0,
    startHeight: 0,
    targetHeight: 100
  }

  /** 动画更新函数 */
  private animationCallback: (() => void) | null = null

  /** 移除动画监听器 */
  private removeListener: (() => void) | null = null

  /**
   * 创建洪水 Primitive
   */
  protected override createPrimitive(
    attribute: Record<string, unknown>
  ): Cesium.Primitive | Cesium.GroundPrimitive | null {
    const floodAttr = attribute as FloodPrimitiveAttribute
    const style = floodAttr.style

    // 初始化洪水状态
    this.floodState = {
      isAnimating: false,
      startTime: 0,
      currentHeight: style.startHeight ?? style.height ?? 0,
      startHeight: style.startHeight ?? style.height ?? 0,
      targetHeight: style.targetHeight ?? 100
    }

    // 调用父类创建水面
    const primitive = super.createPrimitive(attribute)

    // 保存属性
    if (primitive) {
      ;(primitive as FloodPrimitive)._floodAttribute = floodAttr
    }

    // 自动开始动画
    if (style.autoStart) {
      this.startFloodAnimation()
    }

    return primitive
  }

  /**
   * 更新洪水几何体高度
   */
  private updateFloodHeight(height: number): void {
    if (!this.waterPrimitive) return

    const positions = this._positions_draw as Cesium.Cartesian3[]
    if (positions.length < 3) return

    const floodAttr = (this.waterPrimitive as FloodPrimitive)?._floodAttribute
    const style = floodAttr?.style || {}

    // 移除旧的 Primitive
    if (this.primitives!.contains(this.waterPrimitive)) {
      this.primitives!.remove(this.waterPrimitive)
    }

    // 创建新的几何体（更新高度）
    const geometryInstance = new Cesium.GeometryInstance({
      geometry: new Cesium.PolygonGeometry({
        polygonHierarchy: new Cesium.PolygonHierarchy(positions),
        height: height,
        extrudedHeight: style.extrudedHeight,
        vertexFormat: Cesium.MaterialAppearance.MaterialSupport.ALL.vertexFormat
      })
    })

    this.waterPrimitive = new Cesium.Primitive({
      geometryInstances: geometryInstance,
      appearance: new Cesium.MaterialAppearance({
        material: this.waterMaterial!,
        translucent: true
      }),
      show: style.show !== false
    })
    ;(this.waterPrimitive as FloodPrimitive)._floodAttribute = floodAttr
    ;(this.waterPrimitive as FloodPrimitive)._positions_draw = positions

    this.primitives!.add(this.waterPrimitive)
    this.primitive = this.waterPrimitive

    this.floodState.currentHeight = height
  }

  /**
   * 开始洪水动画
   */
  startFloodAnimation(): void {
    if (this.floodState.isAnimating) return

    this.floodState.isAnimating = true
    this.floodState.startTime = Date.now()

    const floodAttr = (this.waterPrimitive as FloodPrimitive)?._floodAttribute
    const style = floodAttr?.style || {}
    const duration = (style.duration ?? 10) * 1000 // 转换为毫秒
    const riseSpeed = style.riseSpeed ?? 1

    this.animationCallback = () => {
      if (!this.floodState.isAnimating) return

      const elapsed = Date.now() - this.floodState.startTime
      const progress = Math.min(elapsed / duration, 1)

      // 计算当前高度（支持速度调节）
      const heightDiff = this.floodState.targetHeight - this.floodState.startHeight
      const currentHeight = this.floodState.startHeight + heightDiff * progress * riseSpeed

      this.updateFloodHeight(Math.min(currentHeight, this.floodState.targetHeight))

      // 检查是否完成
      if (progress >= 1) {
        if (style.loop) {
          // 循环动画：重置
          this.floodState.startTime = Date.now()
          const temp = this.floodState.startHeight
          this.floodState.startHeight = this.floodState.targetHeight
          this.floodState.targetHeight = temp
        } else {
          this.stopFloodAnimation()
        }
      }
    }

    // 使用 Cesium 的渲染循环
    this.removeListener = this.viewer!.scene.preRender.addEventListener(this.animationCallback)
  }

  /**
   * 停止洪水动画
   */
  stopFloodAnimation(): void {
    this.floodState.isAnimating = false

    if (this.removeListener) {
      this.removeListener()
      this.removeListener = null
    }
    this.animationCallback = null
  }

  /**
   * 暂停洪水动画
   */
  pauseFloodAnimation(): void {
    this.floodState.isAnimating = false
    if (this.removeListener) {
      this.removeListener()
      this.removeListener = null
    }
  }

  /**
   * 恢复洪水动画
   */
  resumeFloodAnimation(): void {
    if (this.floodState.isAnimating) return

    this.floodState.isAnimating = true
    this.floodState.startTime = Date.now()
    this.floodState.startHeight = this.floodState.currentHeight

    if (this.animationCallback) {
      this.removeListener = this.viewer!.scene.preRender.addEventListener(this.animationCallback)
    }
  }

  /**
   * 设置水位高度
   */
  setWaterLevel(height: number): void {
    this.stopFloodAnimation()
    this.updateFloodHeight(height)
  }

  /**
   * 设置目标高度并开始动画
   */
  animateToHeight(targetHeight: number, duration?: number): void {
    const floodAttr = (this.waterPrimitive as FloodPrimitive)?._floodAttribute
    if (floodAttr?.style && duration !== undefined) {
      floodAttr.style.duration = duration
    }

    this.floodState.startHeight = this.floodState.currentHeight
    this.floodState.targetHeight = targetHeight

    this.startFloodAnimation()
  }

  /**
   * 获取当前水位
   */
  getCurrentWaterLevel(): number {
    return this.floodState.currentHeight
  }

  /**
   * 获取动画状态
   */
  isAnimating(): boolean {
    return this.floodState.isAnimating
  }

  /**
   * 清理资源
   */
  override disable(hasWB?: boolean): this {
    this.stopFloodAnimation()
    return super.disable(hasWB)
  }

  override toEntityType(): string {
    return 'flood'
  }

  override removePrimitive(): void {
    this.stopFloodAnimation()
    super.removePrimitive()
  }
}
