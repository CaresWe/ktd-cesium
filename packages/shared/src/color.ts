import { Color } from 'cesium'

/**
 * RGB 颜色值类型
 * 支持数组形式 [r, g, b] 或 [r, g, b, a]，范围 0-255
 * 或十六进制字符串形式 '#RRGGBB' 或 '#RRGGBBAA'
 */
export type RGBColor = [number, number, number] | [number, number, number, number] | string

/**
 * 十六进制颜色转 Cesium Color
 * @param hex 十六进制颜色字符串 (#RRGGBB 或 #RRGGBBAA)
 * @param alpha 透明度 (0-1)，如果hex包含alpha则忽略此参数
 */
export function hexToColor(hex: string, alpha: number = 1): Color {
  return Color.fromCssColorString(hex).withAlpha(alpha)
}

/**
 * RGB 转 Cesium Color
 * @param r 红色 (0-255)
 * @param g 绿色 (0-255)
 * @param b 蓝色 (0-255)
 * @param a 透明度 (0-1)
 */
export function rgbToColor(r: number, g: number, b: number, a: number = 1): Color {
  return Color.fromBytes(r, g, b, a * 255)
}

/**
 * 颜色插值
 * @param startColor 起始颜色
 * @param endColor 结束颜色
 * @param t 插值因子 (0-1)
 */
export function lerpColor(startColor: Color, endColor: Color, t: number): Color {
  const result = new Color()
  return Color.lerp(startColor, endColor, t, result)
}

/**
 * 根据数值生成渐变色
 * @param value 数值
 * @param min 最小值
 * @param max 最大值
 * @param startColor 起始颜色
 * @param endColor 结束颜色
 */
export function valueToGradientColor(
  value: number,
  min: number,
  max: number,
  startColor: Color,
  endColor: Color
): Color {
  const t = (value - min) / (max - min)
  return lerpColor(startColor, endColor, Math.max(0, Math.min(1, t)))
}

/**
 * 将 RGB 颜色转换为 Cesium Color 对象
 * @param color RGB 颜色值，支持数组 [r, g, b] 或十六进制字符串 '#RRGGBB'
 * @param alpha 可选的 alpha 值（0-1），用于数组格式或作为十六进制的默认值
 * @returns Cesium Color 对象
 * @example
 * ```ts
 * // 使用 RGB 数组
 * parseRGBColor([255, 255, 255])           // 白色
 * parseRGBColor([255, 0, 0])               // 红色
 * parseRGBColor([255, 255, 255, 0.5])      // 半透明白色
 * parseRGBColor([255, 255, 255], 0.8)      // 80% 透明度白色
 *
 * // 使用十六进制字符串
 * parseRGBColor('#FFFFFF')                 // 白色
 * parseRGBColor('#FF0000')                 // 红色
 * parseRGBColor('#FFFFFF80')               // 半透明白色
 * parseRGBColor('#FFFFFF', 0.8)            // 80% 透明度白色
 * ```
 */
export function parseRGBColor(color: RGBColor, alpha?: number): Color {
  if (typeof color === 'string') {
    // 十六进制字符串格式
    const hex = color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16) / 255
    const g = parseInt(hex.substring(2, 4), 16) / 255
    const b = parseInt(hex.substring(4, 6), 16) / 255
    const a = hex.length === 8 ? parseInt(hex.substring(6, 8), 16) / 255 : (alpha ?? 1)

    return new Color(r, g, b, a)
  } else if (Array.isArray(color)) {
    // 数组格式
    const [r, g, b, a] = color
    return new Color(r / 255, g / 255, b / 255, a !== undefined ? a : (alpha ?? 1))
  }

  throw new Error('Invalid color format')
}
