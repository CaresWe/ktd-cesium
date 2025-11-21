/**
 * 扇形(Sector)计算工具
 * 提供通过圆心和两个边界点计算扇形的算法
 */

import * as Cesium from 'cesium'

// Web Mercator 投影实例
const webMercatorProjection = new Cesium.WebMercatorProjection()

/**
 * 坐标转换: Cartesian3 转 Web Mercator 投影坐标
 */
function cartesian2mercator(position: Cesium.Cartesian3): number[] | null {
  if (!position) return null
  const point = webMercatorProjection.project(Cesium.Cartographic.fromCartesian(position))
  return [point.x, point.y, point.z]
}

/**
 * 坐标转换: Cartesian3 数组转 Web Mercator 投影坐标数组
 */
function cartesians2mercators(arr: Cesium.Cartesian3[]): number[][] {
  const arrNew: number[][] = []
  for (let i = 0, len = arr.length; i < len; i++) {
    const point = cartesian2mercator(arr[i])
    if (point) arrNew.push(point)
  }
  return arrNew
}

/**
 * 坐标转换: Web Mercator 投影坐标转 Cartesian3
 */
function mercator2cartesian(point: number[]): Cesium.Cartesian3 | null {
  if (isNaN(point[0]) || isNaN(point[1])) return null
  const carto = webMercatorProjection.unproject(
    new Cesium.Cartesian3(point[0], point[1], point[2] || 0)
  )
  return Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, carto.height)
}

/**
 * 坐标转换: Web Mercator 投影坐标数组转 Cartesian3 数组
 */
function mercators2cartesians(arr: number[][]): Cesium.Cartesian3[] {
  const arrNew: Cesium.Cartesian3[] = []
  for (let i = 0, len = arr.length; i < len; i++) {
    const point = mercator2cartesian(arr[i])
    if (point) arrNew.push(point)
  }
  return arrNew
}

/**
 * 计算两点之间的距离
 */
function mathDistance(pnt1: number[], pnt2: number[]): number {
  return Math.sqrt(Math.pow(pnt1[0] - pnt2[0], 2) + Math.pow(pnt1[1] - pnt2[1], 2))
}

/**
 * 计算方位角
 */
function getAzimuth(startPoint: number[], endPoint: number[]): number {
  let azimuth: number
  const angle = Math.asin(
    Math.abs(endPoint[1] - startPoint[1]) / mathDistance(startPoint, endPoint)
  )
  if (endPoint[1] >= startPoint[1] && endPoint[0] >= startPoint[0]) {
    azimuth = angle + Math.PI
  } else if (endPoint[1] >= startPoint[1] && endPoint[0] < startPoint[0]) {
    azimuth = Math.PI * 2 - angle
  } else if (endPoint[1] < startPoint[1] && endPoint[0] < startPoint[0]) {
    azimuth = angle
  } else {
    azimuth = Math.PI - angle
  }
  return azimuth
}

/**
 * 获取圆弧上的点
 */
function getArcPoints(
  center: number[],
  radius: number,
  startAngle: number,
  endAngle: number,
  segments: number = 100
): number[][] {
  const pnts: number[][] = []
  let angleDiff = endAngle - startAngle
  angleDiff = angleDiff < 0 ? angleDiff + Math.PI * 2 : angleDiff
  for (let i = 0; i <= segments; i++) {
    const angle = startAngle + (angleDiff * i) / segments
    const x = center[0] + radius * Math.cos(angle)
    const y = center[1] + radius * Math.sin(angle)
    pnts.push([x, y])
  }
  return pnts
}

/**
 * 计算扇形的显示点
 * 通过圆心和两个边界点确定一个扇形
 * @param positions 原始3个绘制点(圆心、起点、终点)
 * @param segments 圆弧分段数(默认100)
 * @returns 扇形的边界点(Cesium.Cartesian3数组)
 */
export function computeSectorPositions(
  positions: Cesium.Cartesian3[],
  segments: number = 100
): Cesium.Cartesian3[] {
  if (!positions || positions.length < 3) {
    return positions || []
  }

  // 转换为墨卡托投影坐标
  const pnts = cartesians2mercators(positions)
  if (pnts.length < 3) {
    return positions
  }

  const center = pnts[0]
  const pnt2 = pnts[1]
  const pnt3 = pnts[2]

  // 计算半径(从圆心到第一个边界点)
  const radius = mathDistance(pnt2, center)

  // 计算起始和结束角度
  const startAngle = getAzimuth(pnt2, center)
  const endAngle = getAzimuth(pnt3, center)

  // 获取圆弧点
  const pList = getArcPoints(center, radius, startAngle, endAngle, segments)

  // 闭合到圆心
  pList.push(center, pList[0])

  // 转换回 Cartesian3
  return mercators2cartesians(pList)
}

/**
 * 计算扇形的参数
 * @param positions 原始3个绘制点(圆心、起点、终点)
 * @returns 扇形参数对象，包含圆心、半径、起始角度、结束角度
 */
export function getSectorParams(positions: Cesium.Cartesian3[]): {
  center: number[]
  radius: number
  startAngle: number
  endAngle: number
} | null {
  if (!positions || positions.length < 3) {
    return null
  }

  // 转换为墨卡托投影坐标
  const pnts = cartesians2mercators(positions)
  if (pnts.length < 3) {
    return null
  }

  const center = pnts[0]
  const pnt2 = pnts[1]
  const pnt3 = pnts[2]

  const radius = mathDistance(pnt2, center)
  const startAngle = getAzimuth(pnt2, center)
  const endAngle = getAzimuth(pnt3, center)

  return {
    center,
    radius,
    startAngle,
    endAngle
  }
}
