/**
 * 正多边形(Regular Polygon)计算工具
 * 提供通过圆心和一个顶点计算正多边形的算法
 */

import * as Cesium from 'cesium'
import { getRotateCenterPoint } from './geometry'

/**
 * 计算正多边形的显示点
 * 通过圆心和一个顶点确定一个正多边形
 * @param positions 原始2个绘制点(圆心和一个顶点)
 * @param sides 边数(默认6,即正六边形)
 * @returns 正多边形的顶点数组
 */
export function computeRegularPositions(
  positions: Cesium.Cartesian3[],
  sides: number = 6
): Cesium.Cartesian3[] {
  if (!positions || positions.length < 2) {
    return positions || []
  }

  const center = positions[0]
  const point = positions[1]
  const num = Math.max(3, sides) // 至少3边

  const addAngle = 360 / num
  const pointArr: Cesium.Cartesian3[] = []

  for (let i = 0; i < num; i++) {
    const thisAngle = addAngle * i
    const newPoint = getRotateCenterPoint(center, point, thisAngle)
    pointArr.push(newPoint)
  }

  return pointArr
}

/**
 * 计算正多边形的参数
 * @param positions 原始2个绘制点(圆心和一个顶点)
 * @returns 正多边形参数对象，包含圆心、半径
 */
export function getRegularParams(positions: Cesium.Cartesian3[]): {
  center: Cesium.Cartesian3
  radius: number
} | null {
  if (!positions || positions.length < 2) {
    return null
  }

  const center = positions[0]
  const point = positions[1]
  const radius = Cesium.Cartesian3.distance(center, point)

  return {
    center,
    radius
  }
}
