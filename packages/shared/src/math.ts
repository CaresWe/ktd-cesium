/**
 * 将数值限制在指定范围内
 * @param value 数值
 * @param min 最小值
 * @param max 最大值
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * 线性插值
 * @param start 起始值
 * @param end 结束值
 * @param t 插值因子 (0-1)
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * clamp(t, 0, 1)
}

/**
 * 将数值从一个范围映射到另一个范围
 * @param value 数值
 * @param inMin 输入最小值
 * @param inMax 输入最大值
 * @param outMin 输出最小值
 * @param outMax 输出最大值
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
}

/**
 * 生成随机数
 * @param min 最小值
 * @param max 最大值
 */
export function random(min: number = 0, max: number = 1): number {
  return Math.random() * (max - min) + min
}

/**
 * 生成随机整数
 * @param min 最小值
 * @param max 最大值
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(random(min, max + 1))
}
