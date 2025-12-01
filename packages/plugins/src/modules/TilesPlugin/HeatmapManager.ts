import { Cesium3DTileset, Cesium3DTileStyle, Color as CesiumColor } from 'cesium'
import type { HeatmapConfig } from './types'

/**
 * 热力图管理器
 * 负责根据数据点或属性值生成热力图效果
 */
export class HeatmapManager {
  private tileset: Cesium3DTileset
  private config: HeatmapConfig | null = null
  private originalStyle: Cesium3DTileStyle | undefined

  constructor(tileset: Cesium3DTileset) {
    this.tileset = tileset
    this.originalStyle = tileset.style
  }

  /**
   * 启用热力图
   */
  enable(config: HeatmapConfig): void {
    try {
      this.config = config

      // 应用热力图样式
      this.updateStyle()
    } catch (error) {
      console.error('Failed to enable heatmap:', error)
      throw error
    }
  }

  /**
   * 更新热力图数据
   */
  updateData(dataPoints: HeatmapConfig['dataPoints']): void {
    try {
      if (!this.config) {
        throw new Error('Heatmap not initialized')
      }

      this.config.dataPoints = dataPoints
      this.updateStyle()
    } catch (error) {
      console.error('Failed to update heatmap data:', error)
      throw error
    }
  }

  /**
   * 更新样式
   */
  private updateStyle(): void {
    try {
      if (!this.config) return

      // 获取或创建默认颜色梯度
      const gradient = this.config.gradient ?? this.getDefaultGradient()

      // 如果指定了属性名称，使用属性值作为热力图数据
      if (this.config.propertyName) {
        this.applyPropertyHeatmap(this.config.propertyName, gradient)
      } else {
        // 否则使用数据点（需要更复杂的空间插值）
        console.warn('Point-based heatmap requires spatial interpolation - using property-based heatmap')
        if (this.config.propertyName) {
          this.applyPropertyHeatmap(this.config.propertyName, gradient)
        }
      }
    } catch (error) {
      console.error('Failed to update heatmap style:', error)
      throw error
    }
  }

  /**
   * 应用基于属性的热力图
   */
  private applyPropertyHeatmap(propertyName: string, gradient: Array<{ stop: number; color: CesiumColor }>): void {
    try {
      if (!this.config) return

      const { minValue, maxValue } = this.config

      // 构建颜色条件
      const conditions: Array<[string, string]> = []

      // 为每个梯度段创建条件
      for (let i = 0; i < gradient.length - 1; i++) {
        const current = gradient[i]
        const next = gradient[i + 1]

        const startValue = minValue + (maxValue - minValue) * current.stop
        const endValue = minValue + (maxValue - minValue) * next.stop

        // 在两个颜色之间插值
        conditions.push([
          `\${${propertyName}} >= ${startValue} && \${${propertyName}} < ${endValue}`,
          `mix(color('${current.color.toCssColorString()}'), color('${next.color.toCssColorString()}'), (\${${propertyName}} - ${startValue}) / ${endValue - startValue})`
        ])
      }

      // 添加边界条件
      conditions.push([`\${${propertyName}} < ${minValue}`, `color('${gradient[0].color.toCssColorString()}')`])
      conditions.push([
        `\${${propertyName}} >= ${maxValue}`,
        `color('${gradient[gradient.length - 1].color.toCssColorString()}')`
      ])

      const style = new Cesium3DTileStyle({
        color: { conditions }
      })

      this.tileset.style = style
    } catch (error) {
      console.error('Failed to apply property heatmap:', error)
      throw error
    }
  }

  /**
   * 获取默认颜色梯度（蓝 -> 绿 -> 黄 -> 红）
   */
  private getDefaultGradient(): Array<{ stop: number; color: CesiumColor }> {
    return [
      { stop: 0.0, color: CesiumColor.fromCssColorString('#0000ff') }, // 蓝
      { stop: 0.33, color: CesiumColor.fromCssColorString('#00ff00') }, // 绿
      { stop: 0.66, color: CesiumColor.fromCssColorString('#ffff00') }, // 黄
      { stop: 1.0, color: CesiumColor.fromCssColorString('#ff0000') } // 红
    ]
  }

  /**
   * 禁用热力图
   */
  disable(): void {
    try {
      // 恢复原始样式
      this.tileset.style = this.originalStyle

      this.config = null
    } catch (error) {
      console.error('Failed to disable heatmap:', error)
      throw error
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): HeatmapConfig | null {
    return this.config ? { ...this.config } : null
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.disable()
  }
}
