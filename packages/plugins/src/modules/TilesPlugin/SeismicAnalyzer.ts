import {
  Cesium3DTileset,
  Cesium3DTileStyle,
  Cartographic,
  Ellipsoid,
  Color as CesiumColor
} from 'cesium'
import type { SeismicAnalysisConfig } from './types'

/**
 * 地震分析器
 * 模拟地震波传播效果，显示受影响区域
 */
export class SeismicAnalyzer {
  private tileset: Cesium3DTileset
  private config: SeismicAnalysisConfig | null = null
  private animationFrame: number | null = null
  private isAnimating = false
  private startTime = 0
  private originalStyle: Cesium3DTileStyle | undefined

  constructor(tileset: Cesium3DTileset) {
    this.tileset = tileset
    this.originalStyle = tileset.style
  }

  /**
   * 启用地震分析
   */
  enable(config: SeismicAnalysisConfig): void {
    try {
      this.config = {
        waveSpeed: 3000, // 默认 3000 米/秒
        enableAnimation: true,
        animationDuration: 10000, // 默认 10 秒
        amplitudeFactor: 1.0,
        frequencyFactor: 1.0,
        effectRadius: 50000, // 默认 50 公里
        ...config
      }

      // 应用初始样式
      this.applySeismicStyle(0)

      console.log('Seismic analysis enabled')
    } catch (error) {
      console.error('Failed to enable seismic analysis:', error)
      throw error
    }
  }

  /**
   * 开始地震动画
   */
  startAnimation(): void {
    try {
      if (!this.config) {
        throw new Error('Seismic analysis not initialized')
      }

      if (this.isAnimating) {
        console.warn('Animation already running')
        return
      }

      if (!this.config.enableAnimation) {
        console.warn('Animation is disabled in config')
        return
      }

      this.isAnimating = true
      this.startTime = Date.now()

      // 触发开始回调
      if (this.config.onAnimationStart) {
        this.config.onAnimationStart()
      }

      const animate = () => {
        if (!this.isAnimating || !this.config) return

        const elapsed = Date.now() - this.startTime
        const duration = this.config.animationDuration ?? 10000
        const progress = Math.min(elapsed / duration, 1.0)

        // 更新样式
        this.applySeismicStyle(progress)

        // 触发更新回调
        if (this.config.onAnimationUpdate) {
          this.config.onAnimationUpdate(progress)
        }

        if (progress >= 1.0) {
          // 动画结束
          this.stopAnimation()
          if (this.config.onAnimationEnd) {
            this.config.onAnimationEnd()
          }
        } else {
          this.animationFrame = requestAnimationFrame(animate)
        }
      }

      animate()
      console.log('Seismic animation started')
    } catch (error) {
      console.error('Failed to start seismic animation:', error)
      throw error
    }
  }

  /**
   * 停止地震动画
   */
  stopAnimation(): void {
    try {
      if (this.animationFrame !== null) {
        cancelAnimationFrame(this.animationFrame)
        this.animationFrame = null
      }

      this.isAnimating = false
      console.log('Seismic animation stopped')
    } catch (error) {
      console.error('Failed to stop seismic animation:', error)
    }
  }

  /**
   * 应用地震样式
   */
  private applySeismicStyle(progress: number): void {
    try {
      if (!this.config) return

      // 计算当前地震波传播距离
      const effectRadius = this.config.effectRadius ?? 50000
      const currentRadius = progress * effectRadius

      // 获取震中坐标（保留给未来使用）
      const _epicenter = Cartographic.fromDegrees(
        this.config.epicenter[0],
        this.config.epicenter[1],
        0
      )
      const _epicenterCartesian = Ellipsoid.WGS84.cartographicToCartesian(_epicenter)

      // 获取或创建默认颜色梯度
      const gradient = this.config.gradient ?? this.getDefaultGradient()

      // 创建基于距离的样式
      // 注意：这需要 3D Tiles 特性中包含位置信息
      // 实际实现可能需要自定义着色器

      const conditions: Array<[string, string]> = []

      // 根据震级计算影响强度
      const magnitude = this.config.magnitude
      const maxIntensity = magnitude / 10.0 // 简化的强度计算

      // 为不同距离范围设置不同颜色
      const steps = 5
      for (let i = 0; i < steps; i++) {
        const innerRadius = (currentRadius * i) / steps
        const outerRadius = (currentRadius * (i + 1)) / steps
        const intensity = maxIntensity * (1 - i / steps)

        // 根据强度从梯度中选择颜色
        const colorIndex = Math.floor((intensity / maxIntensity) * (gradient.length - 1))
        const color = gradient[Math.min(colorIndex, gradient.length - 1)].color

        // 创建距离条件
        // 注意：这里使用简化的条件，实际应该计算要素到震中的距离
        conditions.push([
          `\${Distance} >= ${innerRadius} && \${Distance} < ${outerRadius}`,
          `color('${color.toCssColorString()}')`
        ])
      }

      // 超出影响范围使用原色
      conditions.push(['true', `color('#ffffff')`])

      const style = new Cesium3DTileStyle({
        color: { conditions }
      })

      this.tileset.style = style

      console.log(`Seismic wave at ${currentRadius.toFixed(0)}m`)
    } catch (error) {
      console.error('Failed to apply seismic style:', error)
    }
  }

  /**
   * 获取默认颜色梯度（红 -> 橙 -> 黄 -> 白）
   */
  private getDefaultGradient(): Array<{ stop: number; color: CesiumColor }> {
    return [
      { stop: 0.0, color: CesiumColor.fromCssColorString('#ffffff') }, // 白（无影响）
      { stop: 0.33, color: CesiumColor.fromCssColorString('#ffff00') }, // 黄
      { stop: 0.66, color: CesiumColor.fromCssColorString('#ff8800') }, // 橙
      { stop: 1.0, color: CesiumColor.fromCssColorString('#ff0000') } // 红（最强）
    ]
  }

  /**
   * 禁用地震分析
   */
  disable(): void {
    try {
      this.stopAnimation()

      // 恢复原始样式
      this.tileset.style = this.originalStyle

      this.config = null
      console.log('Seismic analysis disabled')
    } catch (error) {
      console.error('Failed to disable seismic analysis:', error)
      throw error
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): SeismicAnalysisConfig | null {
    return this.config ? { ...this.config } : null
  }

  /**
   * 是否正在动画
   */
  isRunning(): boolean {
    return this.isAnimating
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.disable()
  }
}
