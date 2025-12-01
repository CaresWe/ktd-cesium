/**
 * 弓形面(Lune)计算工具
 * 提供通过三点计算弓形面的算法
 */

import * as Cesium from 'cesium'

// Web Mercator 投影实例
const webMercatorProjection = new Cesium.WebMercatorProjection()

/**
 * 坐标转换: Cartesian3 转 Web Mercator 投影坐标
 * @param position Cesium Cartesian3 坐标
 * @returns Web Mercator 投影坐标数组 [x, y, z]
 */
function cartesian2mercator(position: Cesium.Cartesian3): number[] | null {
  if (!position) return null
  const point = webMercatorProjection.project(Cesium.Cartographic.fromCartesian(position))
  return [point.x, point.y, point.z]
}

/**
 * 坐标转换: Cartesian3 数组转 Web Mercator 投影坐标数组
 * @param arr Cesium Cartesian3 数组
 * @returns Web Mercator 投影坐标二维数组
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
 * @param point Web Mercator 投影坐标数组 [x, y, z]
 * @returns Cesium Cartesian3 坐标
 */
function mercator2cartesian(point: number[]): Cesium.Cartesian3 | null {
  if (isNaN(point[0]) || isNaN(point[1])) return null
  const carto = webMercatorProjection.unproject(new Cesium.Cartesian3(point[0], point[1], point[2] || 0))
  return Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, carto.height)
}

/**
 * 坐标转换: Web Mercator 投影坐标数组转 Cartesian3 数组
 * @param arr Web Mercator 投影坐标二维数组
 * @returns Cesium Cartesian3 数组
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
 * @param pnt1 点1 [x, y]
 * @param pnt2 点2 [x, y]
 * @returns 距离
 */
function mathDistance(pnt1: number[], pnt2: number[]): number {
  return Math.sqrt(Math.pow(pnt1[0] - pnt2[0], 2) + Math.pow(pnt1[1] - pnt2[1], 2))
}

/**
 * 计算方位角
 * @param startPoint 起点 [x, y]
 * @param endPoint 终点 [x, y]
 * @returns 方位角(弧度)
 */
function getAzimuth(startPoint: number[], endPoint: number[]): number {
  let azimuth: number
  const angle = Math.asin(Math.abs(endPoint[1] - startPoint[1]) / mathDistance(startPoint, endPoint))
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
 * 判断三点是否为顺时针方向
 * @param pnt1 点1 [x, y]
 * @param pnt2 点2 [x, y]
 * @param pnt3 点3 [x, y]
 * @returns 是否顺时针
 */
function isClockWise(pnt1: number[], pnt2: number[], pnt3: number[]): boolean {
  return (pnt3[1] - pnt1[1]) * (pnt2[0] - pnt1[0]) > (pnt2[1] - pnt1[1]) * (pnt3[0] - pnt1[0])
}

/**
 * 获取两条线的交点
 * @param pntA 线1点A
 * @param pntB 线1点B
 * @param pntC 线2点C
 * @param pntD 线2点D
 * @returns 交点坐标 [x, y]
 */
function getIntersectPoint(pntA: number[], pntB: number[], pntC: number[], pntD: number[]): number[] {
  if (pntA[1] === pntB[1]) {
    const f = (pntD[0] - pntC[0]) / (pntD[1] - pntC[1])
    const x = f * (pntA[1] - pntC[1]) + pntC[0]
    const y = pntA[1]
    return [x, y]
  }
  if (pntC[1] === pntD[1]) {
    const e = (pntB[0] - pntA[0]) / (pntB[1] - pntA[1])
    const x = e * (pntC[1] - pntA[1]) + pntA[0]
    const y = pntC[1]
    return [x, y]
  }
  const e = (pntB[0] - pntA[0]) / (pntB[1] - pntA[1])
  const f = (pntD[0] - pntC[0]) / (pntD[1] - pntC[1])
  const y = (e * pntA[1] - pntA[0] - f * pntC[1] + pntC[0]) / (e - f)
  const x = e * y - e * pntA[1] + pntA[0]
  return [x, y]
}

/**
 * 获取三点确定的圆心
 * @param point1 点1 [x, y]
 * @param point2 点2 [x, y]
 * @param point3 点3 [x, y]
 * @returns 圆心坐标 [x, y]
 */
function getCircleCenterOfThreePoints(point1: number[], point2: number[], point3: number[]): number[] {
  const pntA = [(point1[0] + point2[0]) / 2, (point1[1] + point2[1]) / 2]
  const pntB = [pntA[0] - point1[1] + point2[1], pntA[1] + point1[0] - point2[0]]
  const pntC = [(point1[0] + point3[0]) / 2, (point1[1] + point3[1]) / 2]
  const pntD = [pntC[0] - point1[1] + point3[1], pntC[1] + point1[0] - point3[0]]
  return getIntersectPoint(pntA, pntB, pntC, pntD)
}

/**
 * 获取圆弧上的点
 * @param center 圆心 [x, y]
 * @param radius 半径
 * @param startAngle 起始角度(弧度)
 * @param endAngle 结束角度(弧度)
 * @param segments 分段数(默认100)
 * @returns 圆弧点坐标数组
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
 * 计算弓形面的显示点
 * 通过3个点确定一个弓形面(圆弧与弦围成的面)
 * @param positions 原始3个绘制点(Cesium.Cartesian3数组)
 * @param segments 圆弧分段数(默认100)
 * @returns 弓形面的边界点(Cesium.Cartesian3数组)
 */
export function computeLunePositions(positions: Cesium.Cartesian3[], segments: number = 100): Cesium.Cartesian3[] {
  if (!positions || positions.length < 3) {
    return positions || []
  }

  // 转换为墨卡托投影坐标
  const pnts = cartesians2mercators(positions)
  if (pnts.length < 3) {
    return positions
  }

  const pnt1 = pnts[0]
  const pnt2 = pnts[1]
  const pnt3 = pnts[2]

  // 计算三点确定的圆心
  const center = getCircleCenterOfThreePoints(pnt1, pnt2, pnt3)
  const radius = mathDistance(pnt1, center)

  // 计算方位角
  const angle1 = getAzimuth(pnt1, center)
  const angle2 = getAzimuth(pnt2, center)

  let startAngle: number
  let endAngle: number

  // 根据顺逆时针确定起始和结束角度
  if (isClockWise(pnt1, pnt2, pnt3)) {
    startAngle = angle2
    endAngle = angle1
  } else {
    startAngle = angle1
    endAngle = angle2
  }

  // 获取圆弧点
  const arcPnts = getArcPoints(center, radius, startAngle, endAngle, segments)
  // 闭合
  arcPnts.push(arcPnts[0])

  // 转换回 Cartesian3
  return mercators2cartesians(arcPnts)
}

/**
 * 计算弓形面的圆弧参数
 * @param positions 原始3个绘制点(Cesium.Cartesian3数组)
 * @returns 圆弧参数对象，包含圆心、半径、起始角度、结束角度
 */
export function getLuneArcParams(positions: Cesium.Cartesian3[]): {
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

  const pnt1 = pnts[0]
  const pnt2 = pnts[1]
  const pnt3 = pnts[2]

  // 计算三点确定的圆心
  const center = getCircleCenterOfThreePoints(pnt1, pnt2, pnt3)
  const radius = mathDistance(pnt1, center)

  // 计算方位角
  const angle1 = getAzimuth(pnt1, center)
  const angle2 = getAzimuth(pnt2, center)

  let startAngle: number
  let endAngle: number

  // 根据顺逆时针确定起始和结束角度
  if (isClockWise(pnt1, pnt2, pnt3)) {
    startAngle = angle2
    endAngle = angle1
  } else {
    startAngle = angle1
    endAngle = angle2
  }

  return {
    center,
    radius,
    startAngle,
    endAngle
  }
}
