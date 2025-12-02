import type { DataItem } from '../types'
import type { GradientConfig } from './types'
import { Color } from 'cesium'

/**
 * 应用渐变色到数据项
 * @param items 数据项数组
 * @param config 渐变配置
 * @returns 应用渐变色后的数据项数组
 */
export function applyGradient(items: DataItem[], config: GradientConfig): DataItem[] {
  // 提取数据值
  const values = items.map((item) => {
    const value = getFieldValue(item.data, config.field)
    return typeof value === 'number' ? value : parseFloat(String(value)) || 0
  })

  // 计算范围
  let minValue: number
  let maxValue: number

  if (config.range) {
    ;[minValue, maxValue] = config.range
  } else if (config.autoRange !== false) {
    minValue = Math.min(...values)
    maxValue = Math.max(...values)
  } else {
    minValue = 0
    maxValue = 1
  }

  // 应用渐变色
  return items.map((item, index) => {
    const value = values[index]
    const color = interpolateColor(value, minValue, maxValue, config.colors)

    return {
      ...item,
      style: {
        ...item.style,
        polygon: {
          ...item.style?.polygon,
          material: color
        }
      }
    }
  })
}

/**
 * 颜色插值
 */
function interpolateColor(value: number, min: number, max: number, colors: Color[]): Color {
  // 归一化值到 [0, 1]
  const normalized = (value - min) / (max - min)
  const clamped = Math.max(0, Math.min(1, normalized))

  // 计算在哪两个颜色之间
  const segmentCount = colors.length - 1
  const segment = clamped * segmentCount
  const segmentIndex = Math.floor(segment)
  const segmentProgress = segment - segmentIndex

  // 边界情况
  if (segmentIndex >= segmentCount) {
    return colors[colors.length - 1]
  }

  // 插值两个颜色
  const color1 = colors[segmentIndex]
  const color2 = colors[segmentIndex + 1]

  return Color.lerp(color1, color2, segmentProgress, new Color())
}

/**
 * 获取嵌套字段值
 */
function getFieldValue(obj: unknown, path: string): unknown {
  if (!obj || !path) return undefined

  const keys = path.split('.')
  let value: unknown = obj

  for (const key of keys) {
    if (value === null || value === undefined) {
      return undefined
    }
    value = (value as Record<string, unknown>)[key]
  }

  return value
}

/**
 * 创建预设渐变色方案
 */
export const GRADIENT_PRESETS = {
  /** 红黄绿（热力图） */
  heatmap: [Color.GREEN, Color.YELLOW, Color.ORANGE, Color.RED],
  /** 蓝白红（温度） */
  temperature: [Color.BLUE, Color.CYAN, Color.WHITE, Color.YELLOW, Color.RED],
  /** 蓝绿（海洋） */
  ocean: [Color.DARKBLUE, Color.BLUE, Color.CYAN, Color.LIGHTGREEN],
  /** 绿黄棕（地形） */
  terrain: [Color.GREEN, Color.LIGHTGREEN, Color.YELLOW, Color.BROWN],
  /** 紫蓝绿黄橙红（彩虹） */
  rainbow: [
    Color.fromCssColorString('#9400D3'),
    Color.fromCssColorString('#4B0082'),
    Color.fromCssColorString('#0000FF'),
    Color.fromCssColorString('#00FF00'),
    Color.fromCssColorString('#FFFF00'),
    Color.fromCssColorString('#FF7F00'),
    Color.fromCssColorString('#FF0000')
  ],
  /** 单色渐变 - 蓝色 */
  blues: [Color.fromCssColorString('#f7fbff'), Color.fromCssColorString('#08519c')],
  /** 单色渐变 - 绿色 */
  greens: [Color.fromCssColorString('#f7fcf5'), Color.fromCssColorString('#00441b')],
  /** 单色渐变 - 红色 */
  reds: [Color.fromCssColorString('#fff5f0'), Color.fromCssColorString('#67000d')]
}
