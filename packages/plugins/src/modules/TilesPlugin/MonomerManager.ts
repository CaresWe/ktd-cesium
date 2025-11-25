import { Color, Cesium3DTileset, Cesium3DTileFeature, Cesium3DTileStyle } from 'cesium'
import type { MonomerConfig, MonomerInstance } from './types'

/**
 * 单体化管理器
 * 负责管理单个 Tileset 的单体化功能
 */
export class MonomerManager {
  private tileset: Cesium3DTileset
  private config: MonomerConfig
  private id: string

  private selectedFeature: Cesium3DTileFeature | null = null
  private highlightedFeature: Cesium3DTileFeature | null = null

  private originalColors: Map<Cesium3DTileFeature, Color> = new Map()
  private customColors: Map<string | number, Color> = new Map()

  constructor(id: string, tileset: Cesium3DTileset, config: MonomerConfig) {
    this.id = id
    this.tileset = tileset
    this.config = config

    // 初始化颜色映射
    if (config.colorMap) {
      this.customColors = new Map(config.colorMap)
    }

    // 应用初始样式
    this.applyInitialStyle()
  }

  /**
   * 应用初始样式
   */
  private applyInitialStyle(): void {
    try {
      if (this.config.defaultColor || this.customColors.size > 0) {
        this.updateStyle()
      }
    } catch (error) {
      console.error('Failed to apply initial style:', error)
    }
  }

  /**
   * 更新样式
   */
  private updateStyle(): void {
    try {
      const propertyName = this.config.propertyName
      const conditions: Array<[string, string]> = []

      // 添加自定义颜色条件
      this.customColors.forEach((color, value) => {
        conditions.push([
          `\${${propertyName}} === ${typeof value === 'string' ? `'${value}'` : value}`,
          `color('${color.toCssColorString()}')`
        ])
      })

      // 添加默认颜色
      if (this.config.defaultColor) {
        conditions.push(['true', `color('${this.config.defaultColor.toCssColorString()}')`])
      }

      if (conditions.length > 0) {
        this.tileset.style = new Cesium3DTileStyle({
          color: {
            conditions
          }
        })
      }
    } catch (error) {
      console.error('Failed to update style:', error)
    }
  }

  /**
   * 根据属性值查找要素
   */
  private findFeatureByProperty(propertyValue: string | number): Cesium3DTileFeature | null {
    try {
      const features = this.getAllFeatures()
      for (const feature of features) {
        const value = feature.getProperty(this.config.propertyName)
        if (value === propertyValue) {
          return feature
        }
      }
      return null
    } catch (error) {
      console.error('Failed to find feature by property:', error)
      return null
    }
  }

  /**
   * 获取所有要素
   */
  private getAllFeatures(): Cesium3DTileFeature[] {
    try {
      const features: Cesium3DTileFeature[] = []
      const length = this.tileset.root?.content?.featuresLength ?? 0

      for (let i = 0; i < length; i++) {
        const feature = this.tileset.root.content.getFeature(i)
        if (feature) {
          features.push(feature)
        }
      }

      return features
    } catch (error) {
      console.error('Failed to get all features:', error)
      return []
    }
  }

  /**
   * 保存原始颜色
   */
  private saveOriginalColor(feature: Cesium3DTileFeature): void {
    try {
      if (!this.originalColors.has(feature)) {
        this.originalColors.set(feature, feature.color.clone())
      }
    } catch (error) {
      console.error('Failed to save original color:', error)
    }
  }

  /**
   * 恢复原始颜色
   */
  private restoreOriginalColor(feature: Cesium3DTileFeature): void {
    try {
      const originalColor = this.originalColors.get(feature)
      if (originalColor) {
        feature.color = originalColor.clone()
      }
    } catch (error) {
      console.error('Failed to restore original color:', error)
    }
  }

  /**
   * 选中要素
   */
  select(propertyValue: string | number): void {
    try {
      // 清除之前的选中
      this.clearSelection()

      const feature = this.findFeatureByProperty(propertyValue)
      if (!feature) {
        console.warn(`Feature with ${this.config.propertyName}=${propertyValue} not found`)
        return
      }

      this.saveOriginalColor(feature)
      if (this.config.selectedColor) {
        feature.color = this.config.selectedColor
      }

      this.selectedFeature = feature

      // 触发回调
      if (this.config.onClick) {
        this.config.onClick(feature, propertyValue)
      }
    } catch (error) {
      console.error('Failed to select feature:', error)
    }
  }

  /**
   * 清除选中
   */
  clearSelection(): void {
    try {
      if (this.selectedFeature) {
        this.restoreOriginalColor(this.selectedFeature)
        this.selectedFeature = null
      }
    } catch (error) {
      console.error('Failed to clear selection:', error)
    }
  }

  /**
   * 高亮要素
   */
  highlight(propertyValue: string | number): void {
    try {
      // 清除之前的高亮
      this.clearHighlight()

      const feature = this.findFeatureByProperty(propertyValue)
      if (!feature) {
        console.warn(`Feature with ${this.config.propertyName}=${propertyValue} not found`)
        return
      }

      // 不高亮已选中的要素
      if (feature === this.selectedFeature) {
        return
      }

      this.saveOriginalColor(feature)
      if (this.config.highlightColor) {
        feature.color = this.config.highlightColor
      }

      this.highlightedFeature = feature

      // 触发回调
      if (this.config.onHover) {
        this.config.onHover(feature, propertyValue)
      }
    } catch (error) {
      console.error('Failed to highlight feature:', error)
    }
  }

  /**
   * 清除高亮
   */
  clearHighlight(): void {
    try {
      if (this.highlightedFeature && this.highlightedFeature !== this.selectedFeature) {
        this.restoreOriginalColor(this.highlightedFeature)
      }
      this.highlightedFeature = null

      // 触发回调
      if (this.config.onHover) {
        this.config.onHover(null)
      }
    } catch (error) {
      console.error('Failed to clear highlight:', error)
    }
  }

  /**
   * 设置颜色
   */
  setColor(propertyValue: string | number, color: Color): void {
    try {
      this.customColors.set(propertyValue, color)
      this.updateStyle()
    } catch (error) {
      console.error('Failed to set color:', error)
    }
  }

  /**
   * 批量设置颜色
   */
  setColors(colorMap: Map<string | number, Color>): void {
    try {
      colorMap.forEach((color, value) => {
        this.customColors.set(value, color)
      })
      this.updateStyle()
    } catch (error) {
      console.error('Failed to set colors:', error)
    }
  }

  /**
   * 重置颜色
   */
  resetColors(): void {
    try {
      this.customColors.clear()
      this.updateStyle()
    } catch (error) {
      console.error('Failed to reset colors:', error)
    }
  }

  /**
   * 显示指定属性值的要素
   */
  show(propertyValue: string | number): void {
    try {
      const feature = this.findFeatureByProperty(propertyValue)
      if (feature) {
        feature.show = true
      }
    } catch (error) {
      console.error('Failed to show feature:', error)
    }
  }

  /**
   * 隐藏指定属性值的要素
   */
  hide(propertyValue: string | number): void {
    try {
      const feature = this.findFeatureByProperty(propertyValue)
      if (feature) {
        feature.show = false
      }
    } catch (error) {
      console.error('Failed to hide feature:', error)
    }
  }

  /**
   * 显示所有要素
   */
  showAll(): void {
    try {
      const features = this.getAllFeatures()
      features.forEach((feature) => {
        feature.show = true
      })
    } catch (error) {
      console.error('Failed to show all features:', error)
    }
  }

  /**
   * 隐藏所有要素
   */
  hideAll(): void {
    try {
      const features = this.getAllFeatures()
      features.forEach((feature) => {
        feature.show = false
      })
    } catch (error) {
      console.error('Failed to hide all features:', error)
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    try {
      this.clearSelection()
      this.clearHighlight()
      this.originalColors.clear()
      this.customColors.clear()
    } catch (error) {
      console.error('Failed to destroy monomer manager:', error)
    }
  }

  /**
   * 创建单体化实例接口
   */
  createInstance(): MonomerInstance {
    return {
      id: this.id,
      name: this.config.name,
      config: this.config,
      tileset: this.tileset,
      selectedFeature: this.selectedFeature,
      highlightedFeature: this.highlightedFeature,
      select: this.select.bind(this),
      clearSelection: this.clearSelection.bind(this),
      highlight: this.highlight.bind(this),
      clearHighlight: this.clearHighlight.bind(this),
      setColor: this.setColor.bind(this),
      setColors: this.setColors.bind(this),
      resetColors: this.resetColors.bind(this),
      show: this.show.bind(this),
      hide: this.hide.bind(this),
      showAll: this.showAll.bind(this),
      hideAll: this.hideAll.bind(this),
      destroy: this.destroy.bind(this)
    }
  }
}
