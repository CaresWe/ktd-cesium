/**
 * 曲线工具函数
 * 提供折线到平滑曲线的转换功能
 */

import * as Cesium from 'cesium'
import { cartesians2lonlats, lonlats2cartesians } from './coordinateTransform'

/**
 * 将折线转换为平滑曲线（贝塞尔曲线插值）
 * @param positions 原始折线点位
 * @param closure 是否闭合曲线
 * @returns 平滑后的曲线点位
 */
export function line2curve(positions: Cesium.Cartesian3[], closure: boolean = false): Cesium.Cartesian3[] {
  if (!positions || positions.length < 3) {
    return positions
  }

  // 转换为经纬度坐标进行计算
  const coordinates = cartesians2lonlats(positions)

  if (closure) {
    // 闭合曲线，添加起点到末尾
    coordinates.push(coordinates[0])
  }

  // 获取参考高度（使用最后一个点的高度）
  const defHeight = coordinates[coordinates.length - 1][2]

  // 执行贝塞尔插值
  const smoothCoordinates = bezierInterpolation(coordinates)

  // 转换回笛卡尔坐标
  return lonlats2cartesians(smoothCoordinates, defHeight)
}

/**
 * 贝塞尔曲线插值算法
 * @param points 控制点数组 [[lon, lat, height], ...]
 * @param resolution 每段插值点数（默认 20）
 * @returns 平滑后的点数组
 */
export function bezierInterpolation(points: number[][], resolution: number = 20): number[][] {
  if (points.length < 3) {
    return points
  }

  const result: number[][] = []
  const segments = points.length - 1

  for (let i = 0; i < segments; i++) {
    const p0 = i === 0 ? points[i] : points[i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = i === segments - 1 ? points[i + 1] : points[i + 2]

    // 使用Catmull-Rom样条插值
    for (let t = 0; t < resolution; t++) {
      const u = t / resolution
      const point = catmullRomSpline(p0, p1, p2, p3, u)
      result.push(point)
    }
  }

  // 添加最后一个点
  result.push(points[points.length - 1])

  return result
}

/**
 * Catmull-Rom样条插值
 * @param p0 前一个控制点
 * @param p1 起始控制点
 * @param p2 结束控制点
 * @param p3 后一个控制点
 * @param t 插值参数 [0, 1]
 * @returns 插值点
 */
export function catmullRomSpline(p0: number[], p1: number[], p2: number[], p3: number[], t: number): number[] {
  const t2 = t * t
  const t3 = t2 * t

  const result: number[] = []

  // 对x, y, z分别插值
  for (let i = 0; i < Math.min(p1.length, 3); i++) {
    const v0 = p0[i] || 0
    const v1 = p1[i] || 0
    const v2 = p2[i] || 0
    const v3 = p3[i] || 0

    const value =
      0.5 * (2 * v1 + (-v0 + v2) * t + (2 * v0 - 5 * v1 + 4 * v2 - v3) * t2 + (-v0 + 3 * v1 - 3 * v2 + v3) * t3)

    result.push(value)
  }

  return result
}

/**
 * 简化版贝塞尔曲线（二次贝塞尔）
 * @param points 控制点数组
 * @param resolution 每段插值点数（默认 20）
 * @returns 平滑后的点数组
 */
export function simpleBezierCurve(points: number[][], resolution: number = 20): number[][] {
  if (points.length < 3) {
    return points
  }

  const result: number[][] = []

  for (let i = 0; i < points.length - 2; i += 2) {
    const p0 = points[i]
    const p1 = points[i + 1]
    const p2 = points[i + 2]

    for (let t = 0; t <= resolution; t++) {
      const u = t / resolution
      const point = quadraticBezier(p0, p1, p2, u)
      result.push(point)
    }
  }

  return result
}

/**
 * 二次贝塞尔曲线计算
 * @param p0 起点
 * @param p1 控制点
 * @param p2 终点
 * @param t 参数 [0, 1]
 * @returns 曲线上的点
 */
export function quadraticBezier(p0: number[], p1: number[], p2: number[], t: number): number[] {
  const u = 1 - t
  const result: number[] = []

  for (let i = 0; i < Math.min(p0.length, 3); i++) {
    const value = u * u * (p0[i] || 0) + 2 * u * t * (p1[i] || 0) + t * t * (p2[i] || 0)
    result.push(value)
  }

  return result
}

/**
 * 三次贝塞尔曲线计算
 * @param p0 起点
 * @param p1 控制点1
 * @param p2 控制点2
 * @param p3 终点
 * @param t 参数 [0, 1]
 * @returns 曲线上的点
 */
export function cubicBezier(p0: number[], p1: number[], p2: number[], p3: number[], t: number): number[] {
  const u = 1 - t
  const result: number[] = []

  for (let i = 0; i < Math.min(p0.length, 3); i++) {
    const value =
      u * u * u * (p0[i] || 0) + 3 * u * u * t * (p1[i] || 0) + 3 * u * t * t * (p2[i] || 0) + t * t * t * (p3[i] || 0)
    result.push(value)
  }

  return result
}
