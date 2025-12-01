/**
 * 双箭头（钳击）计算工具
 * 通过多个控制点计算双箭头的钳击形状
 */

import * as Cesium from 'cesium'

// Web Mercator 投影实例
const webMercatorProjection = new Cesium.WebMercatorProjection()

// ==================== 坐标转换函数 ====================

function cartesian2mercator(position: Cesium.Cartesian3): number[] | null {
  if (!position) return null
  const point = webMercatorProjection.project(Cesium.Cartographic.fromCartesian(position))
  return [point.x, point.y, point.z]
}

function cartesians2mercators(arr: Cesium.Cartesian3[]): number[][] {
  const arrNew: number[][] = []
  for (let i = 0, len = arr.length; i < len; i++) {
    const point = cartesian2mercator(arr[i])
    if (point) arrNew.push(point)
  }
  return arrNew
}

function mercator2cartesian(point: number[]): Cesium.Cartesian3 | null {
  if (isNaN(point[0]) || isNaN(point[1])) return null
  const carto = webMercatorProjection.unproject(new Cesium.Cartesian3(point[0], point[1], point[2] || 0))
  return Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, carto.height)
}

function mercators2cartesians(arr: number[][]): Cesium.Cartesian3[] {
  const arrNew: Cesium.Cartesian3[] = []
  for (let i = 0, len = arr.length; i < len; i++) {
    const point = mercator2cartesian(arr[i])
    if (point) arrNew.push(point)
  }
  return arrNew
}

// ==================== 绘图工具函数 ====================

const HALF_PI = Math.PI / 2

function mathDistance(pnt1: number[], pnt2: number[]): number {
  return Math.sqrt(Math.pow(pnt1[0] - pnt2[0], 2) + Math.pow(pnt1[1] - pnt2[1], 2))
}

function mid(point1: number[], point2: number[]): number[] {
  return [(point1[0] + point2[0]) / 2, (point1[1] + point2[1]) / 2]
}

function isClockWise(pnt1: number[], pnt2: number[], pnt3: number[]): boolean {
  return (pnt3[1] - pnt1[1]) * (pnt2[0] - pnt1[0]) > (pnt2[1] - pnt1[1]) * (pnt3[0] - pnt1[0])
}

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

function getThirdPoint(
  startPnt: number[],
  endPnt: number[],
  angle: number,
  distance: number,
  clockWise: boolean
): number[] {
  const azimuth = getAzimuth(startPnt, endPnt)
  const alpha = clockWise ? azimuth + angle : azimuth - angle
  const dx = distance * Math.cos(alpha)
  const dy = distance * Math.sin(alpha)
  return [endPnt[0] + dx, endPnt[1] + dy]
}

function getAngleOfThreePoints(pntA: number[], pntB: number[], pntC: number[]): number {
  const angle = getAzimuth(pntB, pntA) - getAzimuth(pntB, pntC)
  return angle < 0 ? angle + Math.PI * 2 : angle
}

function wholeDistance(points: number[][]): number {
  let distance = 0
  if (points && Array.isArray(points) && points.length > 0) {
    for (let i = 0; i < points.length - 1; i++) {
      distance += mathDistance(points[i], points[i + 1])
    }
  }
  return distance
}

function getBaseLength(points: number[][]): number {
  return Math.pow(wholeDistance(points), 0.99)
}

/**
 * 获取阶乘
 */
function getFactorial(n: number): number {
  if (n <= 1) return 1
  if (n === 2) return 2
  if (n === 3) return 6
  if (n === 4) return 24
  if (n === 5) return 120

  let result = 1
  for (let i = 1; i <= n; i++) {
    result *= i
  }
  return result
}

/**
 * 获取二项式系数
 */
function getBinomialFactor(n: number, index: number): number {
  return getFactorial(n) / (getFactorial(index) * getFactorial(n - index))
}

/**
 * 获取贝塞尔曲线点
 */
function getBezierPoints(points: number[][]): number[][] {
  if (points.length <= 2) {
    return points
  }

  const bezierPoints: number[][] = []
  const n = points.length - 1

  for (let t = 0; t <= 1; t += 0.01) {
    let x = 0
    let y = 0

    for (let index = 0; index <= n; index++) {
      const factor = getBinomialFactor(n, index)
      const a = Math.pow(t, index)
      const b = Math.pow(1 - t, n - index)
      x += factor * a * b * points[index][0]
      y += factor * a * b * points[index][1]
    }
    bezierPoints.push([x, y])
  }

  return bezierPoints
}

// ==================== 双箭头算法 ====================

/**
 * 双箭头配置选项
 */
export interface DoubleArrowOptions {
  /** 箭头高度因子 */
  headHeightFactor?: number
  /** 箭头宽度因子 */
  headWidthFactor?: number
  /** 箭颈高度因子 */
  neckHeightFactor?: number
  /** 箭颈宽度因子 */
  neckWidthFactor?: number
}

/**
 * 获取临时第4个点（当只有3个点时）
 */
function getTempPoint4(linePnt1: number[], linePnt2: number[], point: number[]): number[] {
  const midPnt = mid(linePnt1, linePnt2)
  const len = mathDistance(midPnt, point)
  const angle = getAngleOfThreePoints(linePnt1, midPnt, point)
  let symPnt: number[]
  let distance1: number
  let distance2: number
  let midPoint: number[]

  if (angle < Math.PI / 2) {
    distance1 = len * Math.sin(angle)
    distance2 = len * Math.cos(angle)
    midPoint = getThirdPoint(linePnt1, midPnt, HALF_PI, distance1, false)
    symPnt = getThirdPoint(midPnt, midPoint, HALF_PI, distance2, true)
  } else if (angle >= Math.PI / 2 && angle < Math.PI) {
    distance1 = len * Math.sin(Math.PI - angle)
    distance2 = len * Math.cos(Math.PI - angle)
    midPoint = getThirdPoint(linePnt1, midPnt, HALF_PI, distance1, false)
    symPnt = getThirdPoint(midPnt, midPoint, HALF_PI, distance2, false)
  } else if (angle >= Math.PI && angle < Math.PI * 1.5) {
    distance1 = len * Math.sin(angle - Math.PI)
    distance2 = len * Math.cos(angle - Math.PI)
    midPoint = getThirdPoint(linePnt1, midPnt, HALF_PI, distance1, true)
    symPnt = getThirdPoint(midPnt, midPoint, HALF_PI, distance2, true)
  } else {
    distance1 = len * Math.sin(Math.PI * 2 - angle)
    distance2 = len * Math.cos(Math.PI * 2 - angle)
    midPoint = getThirdPoint(linePnt1, midPnt, HALF_PI, distance1, true)
    symPnt = getThirdPoint(midPnt, midPoint, HALF_PI, distance2, false)
  }

  return symPnt
}

/**
 * 获取箭头头部点
 */
function getArrowHeadPoints(points: number[][], options: Required<DoubleArrowOptions>): number[][] {
  const len = getBaseLength(points)
  const headHeight = len * options.headHeightFactor
  const headPnt = points[points.length - 1]
  const headWidth = headHeight * options.headWidthFactor
  const neckWidth = headHeight * options.neckWidthFactor
  const neckHeight = headHeight * options.neckHeightFactor

  const headEndPnt = getThirdPoint(points[points.length - 2], headPnt, 0, headHeight, true)
  const neckEndPnt = getThirdPoint(points[points.length - 2], headPnt, 0, neckHeight, true)
  const headLeft = getThirdPoint(headPnt, headEndPnt, HALF_PI, headWidth, false)
  const headRight = getThirdPoint(headPnt, headEndPnt, HALF_PI, headWidth, true)
  const neckLeft = getThirdPoint(headPnt, neckEndPnt, HALF_PI, neckWidth, false)
  const neckRight = getThirdPoint(headPnt, neckEndPnt, HALF_PI, neckWidth, true)

  return [neckLeft, headLeft, headPnt, headRight, neckRight]
}

/**
 * 获取箭头身体点
 */
function getArrowBodyPoints(
  points: number[][],
  neckLeft: number[],
  neckRight: number[],
  tailWidthFactor: number
): number[][] {
  const allLen = wholeDistance(points)
  const len = getBaseLength(points)
  const tailWidth = len * tailWidthFactor
  const neckWidth = mathDistance(neckLeft, neckRight)
  const widthDif = (tailWidth - neckWidth) / 2

  let tempLen = 0
  const leftBodyPnts: number[][] = []
  const rightBodyPnts: number[][] = []

  for (let i = 1; i < points.length - 1; i++) {
    const angle = getAngleOfThreePoints(points[i - 1], points[i], points[i + 1]) / 2
    tempLen += mathDistance(points[i - 1], points[i])
    const w = (tailWidth / 2 - (tempLen / allLen) * widthDif) / Math.sin(angle)
    const left = getThirdPoint(points[i - 1], points[i], Math.PI - angle, w, true)
    const right = getThirdPoint(points[i - 1], points[i], angle, w, false)
    leftBodyPnts.push(left)
    rightBodyPnts.push(right)
  }

  return leftBodyPnts.concat(rightBodyPnts)
}

/**
 * 获取单个箭头的点
 */
function getArrowPoints(
  pnt1: number[],
  pnt2: number[],
  pnt3: number[],
  clockWise: boolean,
  options: Required<DoubleArrowOptions>
): number[][] {
  const midPnt = mid(pnt1, pnt2)
  const len = mathDistance(midPnt, pnt3)
  let midPnt1 = getThirdPoint(pnt3, midPnt, 0, len * 0.3, true)
  let midPnt2 = getThirdPoint(pnt3, midPnt, 0, len * 0.5, true)
  midPnt1 = getThirdPoint(midPnt, midPnt1, HALF_PI, len / 5, clockWise)
  midPnt2 = getThirdPoint(midPnt, midPnt2, HALF_PI, len / 4, clockWise)

  const points = [midPnt, midPnt1, midPnt2, pnt3]
  const arrowPnts = getArrowHeadPoints(points, options)
  const neckLeftPoint = arrowPnts[0]
  const neckRightPoint = arrowPnts[4]

  const tailWidthFactor = mathDistance(pnt1, pnt2) / getBaseLength(points) / 2
  const bodyPnts = getArrowBodyPoints(points, neckLeftPoint, neckRightPoint, tailWidthFactor)

  const n = bodyPnts.length
  let lPoints = bodyPnts.slice(0, n / 2)
  let rPoints = bodyPnts.slice(n / 2, n)

  lPoints.push(neckLeftPoint)
  rPoints.push(neckRightPoint)
  lPoints = lPoints.reverse()
  lPoints.push(pnt2)
  rPoints = rPoints.reverse()
  rPoints.push(pnt1)

  return lPoints.reverse().concat(arrowPnts, rPoints)
}

/**
 * 计算双箭头（钳击）的显示点
 * @param positions 原始绘制点(3-5个)
 * @param options 双箭头配置选项
 * @returns 双箭头的边界点
 */
export function computeDoubleArrowPositions(
  positions: Cesium.Cartesian3[],
  options?: DoubleArrowOptions
): Cesium.Cartesian3[] {
  if (!positions || positions.length < 3) {
    return positions || []
  }

  // 默认配置
  const opts: Required<DoubleArrowOptions> = {
    headHeightFactor: options?.headHeightFactor ?? 0.25,
    headWidthFactor: options?.headWidthFactor ?? 0.3,
    neckHeightFactor: options?.neckHeightFactor ?? 0.85,
    neckWidthFactor: options?.neckWidthFactor ?? 0.15
  }

  // 转换为墨卡托投影坐标
  const pnts = cartesians2mercators(positions)
  if (pnts.length < 3) {
    return positions
  }

  const pnt1 = pnts[0]
  const pnt2 = pnts[1]
  const pnt3 = pnts[2]
  const count = positions.length

  let tempPoint4: number[]
  let connPoint: number[]

  if (count === 3) {
    tempPoint4 = getTempPoint4(pnt1, pnt2, pnt3)
    connPoint = mid(pnt1, pnt2)
  } else if (count === 4) {
    tempPoint4 = pnts[3]
    connPoint = mid(pnt1, pnt2)
  } else {
    tempPoint4 = pnts[3]
    connPoint = pnts[4]
  }

  let leftArrowPnts: number[][]
  let rightArrowPnts: number[][]

  if (isClockWise(pnt1, pnt2, pnt3)) {
    leftArrowPnts = getArrowPoints(pnt1, connPoint, tempPoint4, false, opts)
    rightArrowPnts = getArrowPoints(connPoint, pnt2, pnt3, true, opts)
  } else {
    leftArrowPnts = getArrowPoints(pnt2, connPoint, pnt3, false, opts)
    rightArrowPnts = getArrowPoints(connPoint, pnt1, tempPoint4, true, opts)
  }

  const m = leftArrowPnts.length
  const t = (m - 5) / 2

  const llBodyPnts = leftArrowPnts.slice(0, t)
  const lArrowPnts = leftArrowPnts.slice(t, t + 5)
  const lrBodyPnts = leftArrowPnts.slice(t + 5, m)

  const rlBodyPnts = rightArrowPnts.slice(0, t)
  const rArrowPnts = rightArrowPnts.slice(t, t + 5)
  const rrBodyPnts = rightArrowPnts.slice(t + 5, m)

  const rlBodyPntsBezier = getBezierPoints(rlBodyPnts)
  const bodyPnts = getBezierPoints(rrBodyPnts.concat(llBodyPnts.slice(1)))
  const lrBodyPntsBezier = getBezierPoints(lrBodyPnts)

  const newPnts = rlBodyPntsBezier.concat(rArrowPnts, bodyPnts, lArrowPnts, lrBodyPntsBezier)

  // 转换回 Cartesian3
  return mercators2cartesians(newPnts)
}
