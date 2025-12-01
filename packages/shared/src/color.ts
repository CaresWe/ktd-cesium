import { Color } from 'cesium'

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
