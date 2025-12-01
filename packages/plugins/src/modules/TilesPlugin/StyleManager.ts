import { Cesium3DTileStyle, Cesium3DTileset, Color } from 'cesium'
import type { TilesStyleOptions, MaterialStyleConfig } from './types'

/**
 * 样式管理器
 * 负责管理 3D Tiles 的样式和材质
 */
export class StyleManager {
  private tileset: Cesium3DTileset
  private originalStyle: Cesium3DTileStyle | undefined

  constructor(tileset: Cesium3DTileset) {
    this.tileset = tileset
    this.originalStyle = tileset.style
  }

  /**
   * 应用样式选项
   */
  applyStyle(options: TilesStyleOptions): void {
    try {
      const styleJson: Record<string, unknown> = {}

      // 处理颜色
      if (options.color) {
        if (typeof options.color === 'string') {
          styleJson.color = options.color
        } else if (options.color instanceof Color) {
          styleJson.color = `color('${options.color.toCssColorString()}')`
        }
      }

      // 处理显示条件
      if (options.show !== undefined) {
        if (typeof options.show === 'string') {
          styleJson.show = options.show
        } else {
          styleJson.show = options.show
        }
      }

      // 处理点大小
      if (options.pointSize !== undefined) {
        styleJson.pointSize = options.pointSize
      }

      // 处理条件表达式
      if (options.conditions && options.conditions.length > 0) {
        const conditions: Array<[string, string]> = options.conditions.map(([condition, value]) => {
          let valueStr: string

          if (typeof value === 'string') {
            valueStr = value
          } else if (typeof value === 'number') {
            valueStr = String(value)
          } else if (typeof value === 'boolean') {
            valueStr = String(value)
          } else if (value instanceof Color) {
            valueStr = `color('${value.toCssColorString()}')`
          } else {
            valueStr = String(value)
          }

          return [condition, valueStr]
        })

        styleJson.color = { conditions }
      }

      // 应用样式
      this.tileset.style = new Cesium3DTileStyle(styleJson)
    } catch (error) {
      console.error('Failed to apply style:', error)
      throw error
    }
  }

  /**
   * 设置 Cesium3DTileStyle
   */
  setStyle(style: Cesium3DTileStyle): void {
    try {
      this.tileset.style = style
    } catch (error) {
      console.error('Failed to set style:', error)
      throw error
    }
  }

  /**
   * 应用材质样式
   */
  applyMaterialStyle(config: MaterialStyleConfig): void {
    try {
      const conditions: Array<[string, string]> = []

      // 基础颜色
      if (config.color) {
        let colorStr = `color('${config.color.toCssColorString()}')`

        // 应用透明度
        if (config.alpha !== undefined) {
          const color = config.color.withAlpha(config.alpha)
          colorStr = `color('${color.toCssColorString()}')`
        }

        conditions.push(['true', colorStr])
      }

      const styleJson: Record<string, unknown> = {
        color: conditions.length > 0 ? { conditions } : undefined
      }

      // 金属度和粗糙度通过自定义着色器实现
      if (config.metallic !== undefined || config.roughness !== undefined || config.customShader) {
        console.warn('Metallic, roughness, and custom shaders require Cesium3DTileset customShader API')
      }

      this.tileset.style = new Cesium3DTileStyle(styleJson)
    } catch (error) {
      console.error('Failed to apply material style:', error)
      throw error
    }
  }

  /**
   * 根据属性创建条件样式
   */
  createConditionalStyle(propertyName: string, colorMap: Map<string | number, Color>, defaultColor?: Color): void {
    try {
      const conditions: Array<[string, string]> = []

      // 添加映射条件
      colorMap.forEach((color, value) => {
        const condition =
          typeof value === 'string' ? `\${${propertyName}} === '${value}'` : `\${${propertyName}} === ${value}`

        conditions.push([condition, `color('${color.toCssColorString()}')`])
      })

      // 添加默认条件
      if (defaultColor) {
        conditions.push(['true', `color('${defaultColor.toCssColorString()}')`])
      }

      this.tileset.style = new Cesium3DTileStyle({
        color: { conditions }
      })
    } catch (error) {
      console.error('Failed to create conditional style:', error)
      throw error
    }
  }

  /**
   * 创建分层显示样式（用于楼层分层）
   */
  createFloorStyle(propertyName: string, visibleFloors: number[], floorColorMap?: Map<number, Color>): void {
    try {
      const conditions: Array<[string, string]> = []
      const showConditions: Array<[string, boolean]> = []

      // 设置可见性
      visibleFloors.forEach((floor) => {
        showConditions.push([`\${${propertyName}} === ${floor}`, true])

        // 设置颜色
        if (floorColorMap?.has(floor)) {
          const color = floorColorMap.get(floor)!
          conditions.push([`\${${propertyName}} === ${floor}`, `color('${color.toCssColorString()}')`])
        }
      })

      // 默认隐藏
      showConditions.push(['true', false])

      this.tileset.style = new Cesium3DTileStyle({
        show: { conditions: showConditions },
        color: conditions.length > 0 ? { conditions } : undefined
      })
    } catch (error) {
      console.error('Failed to create floor style:', error)
      throw error
    }
  }

  /**
   * 创建渐变样式（根据高度等属性）
   */
  createGradientStyle(
    propertyName: string,
    minValue: number,
    maxValue: number,
    startColor: Color,
    endColor: Color
  ): void {
    try {
      // 创建颜色插值表达式
      const colorExpression = `
        color() *
        ((clamp(\${${propertyName}}, ${minValue}, ${maxValue}) - ${minValue}) / ${maxValue - minValue})
      `

      this.tileset.style = new Cesium3DTileStyle({
        color: {
          expression: `mix(color('${startColor.toCssColorString()}'), color('${endColor.toCssColorString()}'), ${colorExpression})`
        }
      })
    } catch (error) {
      console.error('Failed to create gradient style:', error)
      throw error
    }
  }

  /**
   * 按属性范围过滤显示
   */
  filterByRange(propertyName: string, min: number, max: number): void {
    try {
      this.tileset.style = new Cesium3DTileStyle({
        show: `\${${propertyName}} >= ${min} && \${${propertyName}} <= ${max}`
      })
    } catch (error) {
      console.error('Failed to filter by range:', error)
      throw error
    }
  }

  /**
   * 按属性值过滤显示
   */
  filterByValues(propertyName: string, values: Array<string | number>): void {
    try {
      const conditions = values.map((value) => {
        const condition =
          typeof value === 'string' ? `\${${propertyName}} === '${value}'` : `\${${propertyName}} === ${value}`
        return condition
      })

      const showExpression = conditions.join(' || ')

      this.tileset.style = new Cesium3DTileStyle({
        show: showExpression
      })
    } catch (error) {
      console.error('Failed to filter by values:', error)
      throw error
    }
  }

  /**
   * 重置为原始样式
   */
  reset(): void {
    try {
      this.tileset.style = this.originalStyle
    } catch (error) {
      console.error('Failed to reset style:', error)
      throw error
    }
  }

  /**
   * 清除样式
   */
  clear(): void {
    try {
      this.tileset.style = undefined
    } catch (error) {
      console.error('Failed to clear style:', error)
      throw error
    }
  }

  /**
   * 获取当前样式
   */
  getCurrentStyle(): Cesium3DTileStyle | undefined {
    return this.tileset.style
  }
}
