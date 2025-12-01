import { Cesium3DTileset, Cesium3DTileStyle, Color as CesiumColor } from 'cesium'
import type { HeightLimitConfig } from './types'

/**
 * 限高分析器
 * 负责分析和显示超过限定高度的部分
 */
export class HeightAnalyzer {
  private tileset: Cesium3DTileset
  private config: HeightLimitConfig | null = null
  private originalStyle: Cesium3DTileStyle | undefined

  constructor(tileset: Cesium3DTileset) {
    this.tileset = tileset
    this.originalStyle = tileset.style
  }

  /**
   * 启用限高分析
   */
  enable(config: HeightLimitConfig): void {
    try {
      this.config = config

      // 应用限高样式
      this.updateStyle()
    } catch (error) {
      console.error('Failed to enable height limit analysis:', error)
      throw error
    }
  }

  /**
   * 更新限制高度
   */
  updateLimit(height: number): void {
    try {
      if (!this.config) {
        throw new Error('Height limit analysis not initialized')
      }

      this.config.limitHeight = height
      this.updateStyle()
    } catch (error) {
      console.error('Failed to update height limit:', error)
      throw error
    }
  }

  /**
   * 更新样式
   */
  private updateStyle(): void {
    try {
      if (!this.config) return

      const exceedColor = this.config.exceedColor ?? CesiumColor.fromCssColorString('rgba(255, 0, 0, 0.8)')
      const normalColor = this.config.normalColor ?? CesiumColor.fromCssColorString('rgba(255, 255, 255, 1.0)')

      const heightProperty = this.config.heightProperty ?? 'Height'

      // 创建条件样式
      const conditions: Array<[string, string]> = []

      if (this.config.showOnlyExceeded) {
        // 仅显示超高部分
        conditions.push([
          `\${${heightProperty}} > ${this.config.limitHeight}`,
          `color('${exceedColor.toCssColorString()}')`
        ])
      } else {
        // 显示所有，超高部分标记为红色
        conditions.push([
          `\${${heightProperty}} > ${this.config.limitHeight}`,
          `color('${exceedColor.toCssColorString()}')`
        ])
        conditions.push(['true', `color('${normalColor.toCssColorString()}')`])
      }

      const style = new Cesium3DTileStyle({
        color: { conditions },
        show: this.config.showOnlyExceeded ? `\${${heightProperty}} > ${this.config.limitHeight}` : true
      })

      this.tileset.style = style
    } catch (error) {
      console.error('Failed to update height limit style:', error)
      throw error
    }
  }

  /**
   * 禁用限高分析
   */
  disable(): void {
    try {
      // 恢复原始样式
      this.tileset.style = this.originalStyle

      this.config = null
    } catch (error) {
      console.error('Failed to disable height limit analysis:', error)
      throw error
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): HeightLimitConfig | null {
    return this.config ? { ...this.config } : null
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.disable()
  }
}
