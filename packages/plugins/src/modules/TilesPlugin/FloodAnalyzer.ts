import { Cesium3DTileset, Cesium3DTileStyle, Color as CesiumColor } from 'cesium'
import type { FloodAnalysisConfig } from './types'

/**
 * 淹没分析器
 * 负责模拟水位上涨过程，分析淹没区域
 */
export class FloodAnalyzer {
  private tileset: Cesium3DTileset
  private config: FloodAnalysisConfig | null = null
  private animationFrame: number | null = null
  private isAnimating = false
  private startTime = 0

  constructor(tileset: Cesium3DTileset) {
    this.tileset = tileset
  }

  /**
   * 启用淹没分析
   */
  enable(config: FloodAnalysisConfig): void {
    try {
      this.config = config

      // 应用初始水位样式
      this.updateWaterLevel(config.currentHeight)

      console.log('Flood analysis enabled')
    } catch (error) {
      console.error('Failed to enable flood analysis:', error)
      throw error
    }
  }

  /**
   * 更新水位高度
   */
  updateHeight(height: number): void {
    try {
      if (!this.config) {
        throw new Error('Flood analysis not initialized')
      }

      // 限制在范围内
      const clampedHeight = Math.max(
        this.config.minHeight,
        Math.min(this.config.maxHeight, height)
      )

      this.config.currentHeight = clampedHeight
      this.updateWaterLevel(clampedHeight)

      // 触发回调
      if (this.config.onHeightChange) {
        this.config.onHeightChange(clampedHeight)
      }
    } catch (error) {
      console.error('Failed to update flood height:', error)
      throw error
    }
  }

  /**
   * 更新水位样式
   */
  private updateWaterLevel(height: number): void {
    try {
      if (!this.config) return

      const waterColor = this.config.waterColor ?? CesiumColor.fromCssColorString('rgba(0, 150, 255, 0.6)')
      const waterAlpha = this.config.waterAlpha ?? 0.6

      // 创建样式：低于水位的部分显示水色
      const style = new Cesium3DTileStyle({
        color: {
          conditions: [
            // 如果模型高度低于水位，显示水色
            [`\${Height} <= ${height}`, `color('${waterColor.withAlpha(waterAlpha).toCssColorString()}')`],
            // 否则显示原色
            ['true', 'color("#ffffff")']
          ]
        }
      })

      this.tileset.style = style
    } catch (error) {
      console.error('Failed to update water level style:', error)
      throw error
    }
  }

  /**
   * 开始淹没动画
   */
  startAnimation(): void {
    try {
      if (!this.config) {
        throw new Error('Flood analysis not initialized')
      }

      if (this.isAnimating) {
        console.warn('Animation already running')
        return
      }

      this.isAnimating = true
      this.startTime = Date.now()

      const animate = () => {
        if (!this.isAnimating || !this.config) return

        const elapsed = (Date.now() - this.startTime) / 1000 // 秒
        const speed = this.config.floodSpeed ?? 1 // 米/秒
        const newHeight = this.config.minHeight + elapsed * speed

        if (newHeight >= this.config.maxHeight) {
          // 达到最大水位，停止动画
          this.updateHeight(this.config.maxHeight)
          this.stopAnimation()
        } else {
          this.updateHeight(newHeight)
          this.animationFrame = requestAnimationFrame(animate)
        }
      }

      animate()
      console.log('Flood animation started')
    } catch (error) {
      console.error('Failed to start flood animation:', error)
      throw error
    }
  }

  /**
   * 停止淹没动画
   */
  stopAnimation(): void {
    try {
      if (this.animationFrame !== null) {
        cancelAnimationFrame(this.animationFrame)
        this.animationFrame = null
      }

      this.isAnimating = false
      console.log('Flood animation stopped')
    } catch (error) {
      console.error('Failed to stop flood animation:', error)
    }
  }

  /**
   * 禁用淹没分析
   */
  disable(): void {
    try {
      this.stopAnimation()

      // 重置样式
      this.tileset.style = undefined

      this.config = null
      console.log('Flood analysis disabled')
    } catch (error) {
      console.error('Failed to disable flood analysis:', error)
      throw error
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): FloodAnalysisConfig | null {
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
