/**
 * 等腰三角形(Isosceles Triangle)计算工具
 * 提供通过三个控制点计算等腰三角形的算法
 */

import * as Cesium from 'cesium'
import { getRotateCenterPoint } from './geometry'

// 复用的临时变量
const midPointScratch = new Cesium.Cartesian3()

/**
 * 计算两点之间的方位角(度)
 * @param firstPoint 起点
 * @param endPoint 终点
 * @returns 方位角(度)
 */
function getAngle(firstPoint: Cesium.Cartesian3, endPoint: Cesium.Cartesian3): number {
  const carto1 = Cesium.Cartographic.fromCartesian(firstPoint)
  const carto2 = Cesium.Cartographic.fromCartesian(endPoint)

  const lon1 = carto1.longitude
  const lat1 = carto1.latitude
  const lon2 = carto2.longitude
  const lat2 = carto2.latitude

  // 计算恒向线方位角 (rhumb bearing)
  const dLon = lon2 - lon1
  const dPhi = Math.log(Math.tan(lat2 / 2 + Math.PI / 4) / Math.tan(lat1 / 2 + Math.PI / 4))

  let bearing = Math.atan2(dLon, dPhi)
  bearing = Cesium.Math.toDegrees(bearing)
  bearing = (bearing + 360) % 360

  return Math.round(bearing)
}

/**
 * 计算等腰三角形的显示点
 * 通过3个点确定一个等腰三角形:
 * - p1, p2: 底边的两个端点
 * - p3: 用于控制顶角方向和大小的点
 * @param positions 原始3个绘制点
 * @returns 等腰三角形的3个顶点
 */
export function computeIsoscelesTrianglePositions(positions: Cesium.Cartesian3[]): Cesium.Cartesian3[] {
  if (!positions || positions.length < 3) {
    return positions || []
  }

  const p1 = positions[0]
  const p2 = positions[1]
  const p3 = positions[2]

  // 计算底边中点
  const midpoint = Cesium.Cartesian3.midpoint(p1, p2, midPointScratch)

  // 计算角度
  const angle1 = getAngle(midpoint, p2)
  const angle2 = getAngle(midpoint, p3)
  const angle = angle1 - angle2 - 90

  // 旋转第三个点到正确位置
  const newPoint2 = getRotateCenterPoint(midpoint, p3, angle)

  return [p1, p2, newPoint2]
}

/**
 * 计算等腰三角形的参数
 * @param positions 原始3个绘制点
 * @returns 等腰三角形参数对象
 */
export function getIsoscelesTriangleParams(positions: Cesium.Cartesian3[]): {
  base1: Cesium.Cartesian3
  base2: Cesium.Cartesian3
  apex: Cesium.Cartesian3
  midpoint: Cesium.Cartesian3
  baseLength: number
  height: number
} | null {
  if (!positions || positions.length < 3) {
    return null
  }

  const trianglePositions = computeIsoscelesTrianglePositions(positions)
  if (trianglePositions.length < 3) {
    return null
  }

  const p1 = trianglePositions[0]
  const p2 = trianglePositions[1]
  const apex = trianglePositions[2]

  const midpoint = Cesium.Cartesian3.midpoint(p1, p2, new Cesium.Cartesian3())
  const baseLength = Cesium.Cartesian3.distance(p1, p2)
  const height = Cesium.Cartesian3.distance(midpoint, apex)

  return {
    base1: p1,
    base2: p2,
    apex,
    midpoint,
    baseLength,
    height
  }
}
