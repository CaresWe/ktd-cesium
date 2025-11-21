/**
 * 攻击箭头(Attack Arrow)计算工具
 * 提供通过多个控制点计算攻击箭头的算法
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
  const carto = webMercatorProjection.unproject(
    new Cesium.Cartesian3(point[0], point[1], point[2] || 0)
  )
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
const ZERO_TOLERANCE = 0.0001

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

function getQBSplinePoints(points: number[][]): number[][] {
  if (points.length <= 2) {
    return points
  }

  const n = 2
  const bSplinePoints: number[][] = []
  const m = points.length - n - 1

  bSplinePoints.push(points[0])
  for (let i = 0; i <= m; i++) {
    for (let t = 0; t <= 1; t += 0.05) {
      let x = 0
      let y = 0
      for (let k = 0; k <= n; k++) {
        const factor = getQuadricBSplineFactor(k, t)
        x += factor * points[i + k][0]
        y += factor * points[i + k][1]
      }
      bSplinePoints.push([x, y])
    }
  }
  bSplinePoints.push(points[points.length - 1])
  return bSplinePoints
}

function getQuadricBSplineFactor(k: number, t: number): number {
  let res = 0
  if (k === 0) {
    res = Math.pow(t - 1, 2) / 2
  } else if (k === 1) {
    res = (-2 * Math.pow(t, 2) + 2 * t + 1) / 2
  } else if (k === 2) {
    res = Math.pow(t, 2) / 2
  }
  return res
}

// ==================== 攻击箭头算法 ====================

/**
 * 攻击箭头配置选项
 */
export interface AttackArrowOptions {
  /** 箭头高度因子 */
  headHeightFactor?: number
  /** 箭头宽度因子 */
  headWidthFactor?: number
  /** 箭颈高度因子 */
  neckHeightFactor?: number
  /** 箭颈宽度因子 */
  neckWidthFactor?: number
  /** 箭头尾部因子 */
  headTailFactor?: number
}

/**
 * 获取箭头头部点
 */
function getArrowHeadPoints(
  points: number[][],
  tailLeft: number[],
  tailRight: number[],
  options: Required<AttackArrowOptions>
): number[][] {
  const len = getBaseLength(points)
  let headHeight = len * options.headHeightFactor
  const headPnt = points[points.length - 1]
  const len2 = mathDistance(headPnt, points[points.length - 2])
  const tailWidth = mathDistance(tailLeft, tailRight)

  if (headHeight > tailWidth * options.headTailFactor) {
    headHeight = tailWidth * options.headTailFactor
  }

  const headWidth = headHeight * options.headWidthFactor
  const neckWidth = headHeight * options.neckWidthFactor
  headHeight = headHeight > len2 ? len2 : headHeight
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
 * 计算攻击箭头的显示点
 * @param positions 原始绘制点(至少3个)
 * @param options 攻击箭头配置选项
 * @returns 攻击箭头的边界点
 */
export function computeAttackArrowPositions(
  positions: Cesium.Cartesian3[],
  options?: AttackArrowOptions
): Cesium.Cartesian3[] {
  if (!positions || positions.length < 3) {
    return positions || []
  }

  // 默认配置
  const opts: Required<AttackArrowOptions> = {
    headHeightFactor: options?.headHeightFactor ?? 0.18,
    headWidthFactor: options?.headWidthFactor ?? 0.3,
    neckHeightFactor: options?.neckHeightFactor ?? 0.85,
    neckWidthFactor: options?.neckWidthFactor ?? 0.15,
    headTailFactor: options?.headTailFactor ?? 0.8
  }

  // 转换为墨卡托投影坐标
  const pnts = cartesians2mercators(positions)
  if (pnts.length < 3) {
    return positions
  }

  // 确定尾部左右点
  let tailLeft = pnts[0]
  let tailRight = pnts[1]

  if (isClockWise(pnts[0], pnts[1], pnts[2])) {
    tailLeft = pnts[1]
    tailRight = pnts[0]
  }

  // 计算中点和骨架点
  const midTail = mid(tailLeft, tailRight)
  const bonePnts = [midTail].concat(pnts.slice(2))

  // 计算箭头头部
  const headPnts = getArrowHeadPoints(bonePnts, tailLeft, tailRight, opts)
  const neckLeft = headPnts[0]
  const neckRight = headPnts[4]

  // 计算尾部宽度因子
  const tailWidthFactor = mathDistance(tailLeft, tailRight) / getBaseLength(bonePnts)

  // 计算箭头身体
  const bodyPnts = getArrowBodyPoints(bonePnts, neckLeft, neckRight, tailWidthFactor)
  const count = bodyPnts.length

  // 组装左右边界点
  let leftPnts = [tailLeft].concat(bodyPnts.slice(0, count / 2))
  leftPnts.push(neckLeft)
  let rightPnts = [tailRight].concat(bodyPnts.slice(count / 2, count))
  rightPnts.push(neckRight)

  // 平滑处理
  leftPnts = getQBSplinePoints(leftPnts)
  rightPnts = getQBSplinePoints(rightPnts)

  // 合并所有点
  const pList = leftPnts.concat(headPnts, rightPnts.reverse())

  // 转换回 Cartesian3
  return mercators2cartesians(pList)
}

// ==================== 攻击箭头(平尾)算法 ====================

/**
 * 攻击箭头(平尾)配置选项
 */
export interface AttackArrowPWOptions {
  /** 箭头高度因子 */
  headHeightFactor?: number
  /** 箭头宽度因子 */
  headWidthFactor?: number
  /** 箭颈高度因子 */
  neckHeightFactor?: number
  /** 箭颈宽度因子 */
  neckWidthFactor?: number
  /** 尾部宽度因子 */
  tailWidthFactor?: number
}

/**
 * 获取尾部点(平尾版本)
 */
function getTailPoints(points: number[][], tailWidthFactor: number): number[][] {
  const allLen = getBaseLength(points)
  const tailWidth = allLen * tailWidthFactor
  const tailLeft = getThirdPoint(points[1], points[0], HALF_PI, tailWidth, false)
  const tailRight = getThirdPoint(points[1], points[0], HALF_PI, tailWidth, true)
  return [tailLeft, tailRight]
}

/**
 * 计算攻击箭头(平尾)的显示点
 * @param positions 原始绘制点(至少3个)
 * @param options 攻击箭头(平尾)配置选项
 * @returns 攻击箭头(平尾)的边界点
 */
export function computeAttackArrowPWPositions(
  positions: Cesium.Cartesian3[],
  options?: AttackArrowPWOptions
): Cesium.Cartesian3[] {
  if (!positions || positions.length < 3) {
    return positions || []
  }

  // 默认配置
  const opts = {
    headHeightFactor: options?.headHeightFactor ?? 0.18,
    headWidthFactor: options?.headWidthFactor ?? 0.3,
    neckHeightFactor: options?.neckHeightFactor ?? 0.85,
    neckWidthFactor: options?.neckWidthFactor ?? 0.15,
    tailWidthFactor: options?.tailWidthFactor ?? 0.1
  }

  // 转换为墨卡托投影坐标
  const pnts = cartesians2mercators(positions)
  if (pnts.length < 3) {
    return positions
  }

  // 计算尾部点
  const tailPnts = getTailPoints(pnts, opts.tailWidthFactor)
  const tailLeft = tailPnts[0]
  const tailRight = tailPnts[1]

  // 计算箭头头部
  const headPnts = getArrowHeadPoints(pnts, tailLeft, tailRight, {
    headHeightFactor: opts.headHeightFactor,
    headWidthFactor: opts.headWidthFactor,
    neckHeightFactor: opts.neckHeightFactor,
    neckWidthFactor: opts.neckWidthFactor,
    headTailFactor: 0.8 // 固定值
  })
  const neckLeft = headPnts[0]
  const neckRight = headPnts[4]

  // 计算箭头身体
  const bodyPnts = getArrowBodyPoints(pnts, neckLeft, neckRight, opts.tailWidthFactor)
  const count = bodyPnts.length

  // 组装左右边界点
  let leftPnts = [tailLeft].concat(bodyPnts.slice(0, count / 2))
  leftPnts.push(neckLeft)
  let rightPnts = [tailRight].concat(bodyPnts.slice(count / 2, count))
  rightPnts.push(neckRight)

  // 平滑处理
  leftPnts = getQBSplinePoints(leftPnts)
  rightPnts = getQBSplinePoints(rightPnts)

  // 合并所有点
  const pList = leftPnts.concat(headPnts, rightPnts.reverse())

  // 转换回 Cartesian3
  return mercators2cartesians(pList)
}

// ==================== 攻击箭头(燕尾)算法 ====================

/**
 * 攻击箭头(燕尾)配置选项
 */
export interface AttackArrowYWOptions {
  /** 箭头高度因子 */
  headHeightFactor?: number
  /** 箭头宽度因子 */
  headWidthFactor?: number
  /** 箭颈高度因子 */
  neckHeightFactor?: number
  /** 箭颈宽度因子 */
  neckWidthFactor?: number
  /** 尾部宽度因子 */
  tailWidthFactor?: number
  /** 箭头尾部因子 */
  headTailFactor?: number
  /** 燕尾因子 */
  swallowTailFactor?: number
}

/**
 * 计算攻击箭头(燕尾)的显示点
 * @param positions 原始绘制点(至少3个)
 * @param options 攻击箭头(燕尾)配置选项
 * @returns 攻击箭头(燕尾)的边界点
 */
export function computeAttackArrowYWPositions(
  positions: Cesium.Cartesian3[],
  options?: AttackArrowYWOptions
): Cesium.Cartesian3[] {
  if (!positions || positions.length < 3) {
    return positions || []
  }

  // 默认配置
  const opts = {
    headHeightFactor: options?.headHeightFactor ?? 0.18,
    headWidthFactor: options?.headWidthFactor ?? 0.3,
    neckHeightFactor: options?.neckHeightFactor ?? 0.85,
    neckWidthFactor: options?.neckWidthFactor ?? 0.15,
    tailWidthFactor: options?.tailWidthFactor ?? 0.1,
    headTailFactor: options?.headTailFactor ?? 0.8,
    swallowTailFactor: options?.swallowTailFactor ?? 1
  }

  // 转换为墨卡托投影坐标
  const pnts = cartesians2mercators(positions)
  if (pnts.length < 3) {
    return positions
  }

  // 确定尾部左右点
  let tailLeft = pnts[0]
  let tailRight = pnts[1]

  if (isClockWise(pnts[0], pnts[1], pnts[2])) {
    tailLeft = pnts[1]
    tailRight = pnts[0]
  }

  // 计算中点和骨架点
  const midTail = mid(tailLeft, tailRight)
  const bonePnts = [midTail].concat(pnts.slice(2))

  // 计算箭头头部
  const headPnts = getArrowHeadPoints(bonePnts, tailLeft, tailRight, {
    headHeightFactor: opts.headHeightFactor,
    headWidthFactor: opts.headWidthFactor,
    neckHeightFactor: opts.neckHeightFactor,
    neckWidthFactor: opts.neckWidthFactor,
    headTailFactor: opts.headTailFactor
  })
  const neckLeft = headPnts[0]
  const neckRight = headPnts[4]

  // 计算燕尾点
  const tailWidth = mathDistance(tailLeft, tailRight)
  const allLen = getBaseLength(bonePnts)
  const len = allLen * opts.tailWidthFactor * opts.swallowTailFactor
  const swallowTailPnt = getThirdPoint(bonePnts[1], bonePnts[0], 0, len, true)

  // 计算尾部宽度因子
  const factor = tailWidth / allLen

  // 计算箭头身体
  const bodyPnts = getArrowBodyPoints(bonePnts, neckLeft, neckRight, factor)
  const count = bodyPnts.length

  // 组装左右边界点
  let leftPnts = [tailLeft].concat(bodyPnts.slice(0, count / 2))
  leftPnts.push(neckLeft)
  let rightPnts = [tailRight].concat(bodyPnts.slice(count / 2, count))
  rightPnts.push(neckRight)

  // 平滑处理
  leftPnts = getQBSplinePoints(leftPnts)
  rightPnts = getQBSplinePoints(rightPnts)

  // 合并所有点，包含燕尾点
  const pList = leftPnts.concat(headPnts, rightPnts.reverse(), [swallowTailPnt, leftPnts[0]])

  // 转换回 Cartesian3
  return mercators2cartesians(pList)
}
