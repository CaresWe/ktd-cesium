/**
 * 细直箭头计算工具
 * 通过两个点生成一个直箭头形状
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

// ==================== 细直箭头算法 ====================

/**
 * 细直箭头配置选项
 */
export interface FineArrowOptions {
  /** 箭头角度 */
  headAngle?: number
  /** 箭颈角度 */
  neckAngle?: number
  /** 尾部宽度因子 */
  tailWidthFactor?: number
  /** 箭颈宽度因子 */
  neckWidthFactor?: number
  /** 箭头宽度因子 */
  headWidthFactor?: number
}

/**
 * 计算细直箭头的显示点
 * @param positions 原始绘制点(2个)
 * @param options 细直箭头配置选项
 * @returns 细直箭头的边界点
 */
export function computeFineArrowPositions(
  positions: Cesium.Cartesian3[],
  options?: FineArrowOptions
): Cesium.Cartesian3[] {
  if (!positions || positions.length < 2) {
    return positions || []
  }

  // 默认配置
  const opts = {
    headAngle: options?.headAngle ?? Math.PI / 8.5,
    neckAngle: options?.neckAngle ?? Math.PI / 13,
    tailWidthFactor: options?.tailWidthFactor ?? 0.1,
    neckWidthFactor: options?.neckWidthFactor ?? 0.2,
    headWidthFactor: options?.headWidthFactor ?? 0.25
  }

  // 转换为墨卡托投影坐标
  const pnts = cartesians2mercators(positions)
  if (pnts.length < 2) {
    return positions
  }

  const pnt1 = pnts[0]
  const pnt2 = pnts[1]

  // 计算基准长度
  const len = getBaseLength(pnts)
  const tailWidth = len * opts.tailWidthFactor
  const neckWidth = len * opts.neckWidthFactor
  const headWidth = len * opts.headWidthFactor

  // 计算尾部左右点
  const tailLeft = getThirdPoint(pnt2, pnt1, HALF_PI, tailWidth, true)
  const tailRight = getThirdPoint(pnt2, pnt1, HALF_PI, tailWidth, false)

  // 计算箭头左右点
  const headLeft = getThirdPoint(pnt1, pnt2, opts.headAngle, headWidth, false)
  const headRight = getThirdPoint(pnt1, pnt2, opts.headAngle, headWidth, true)

  // 计算箭颈左右点
  const neckLeft = getThirdPoint(pnt1, pnt2, opts.neckAngle, neckWidth, false)
  const neckRight = getThirdPoint(pnt1, pnt2, opts.neckAngle, neckWidth, true)

  // 组合所有点：尾部左 -> 箭颈左 -> 箭头左 -> 顶点 -> 箭头右 -> 箭颈右 -> 尾部右
  const pList = [tailLeft, neckLeft, headLeft, pnt2, headRight, neckRight, tailRight]

  // 转换回 Cartesian3
  return mercators2cartesians(pList)
}

// ==================== 细直箭头（燕尾）算法 ====================

function getAngleOfThreePoints(pntA: number[], pntB: number[], pntC: number[]): number {
  const angle = getAzimuth(pntB, pntA) - getAzimuth(pntB, pntC)
  return angle < 0 ? angle + Math.PI * 2 : angle
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

/**
 * 细直箭头（燕尾）配置选项
 */
export interface FineArrowYWOptions {
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
  /** 燕尾因子 */
  swallowTailFactor?: number
}

/**
 * 获取箭头头部点（燕尾版本）
 */
function getArrowHeadPoints(
  points: number[][],
  tailLeft: number[],
  tailRight: number[],
  options: Required<FineArrowYWOptions>
): number[][] {
  const len = getBaseLength(points)
  let headHeight = len * options.headHeightFactor
  const headPnt = points[points.length - 1]
  const len2 = mathDistance(headPnt, points[points.length - 2])
  const tailWidth = mathDistance(tailLeft, tailRight)

  const headTailFactor = 0.8 // 固定值
  if (headHeight > tailWidth * headTailFactor) {
    headHeight = tailWidth * headTailFactor
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
 * 获取箭头身体点（燕尾版本）
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
 * 获取尾部点（燕尾版本）
 */
function getTailPoints(points: number[][], options: Required<FineArrowYWOptions>): number[][] {
  const allLen = getBaseLength(points)
  const tailWidth = allLen * options.tailWidthFactor
  const tailLeft = getThirdPoint(points[1], points[0], HALF_PI, tailWidth, false)
  const tailRight = getThirdPoint(points[1], points[0], HALF_PI, tailWidth, true)
  const len = tailWidth * options.swallowTailFactor
  const swallowTailPnt = getThirdPoint(points[1], points[0], 0, len, true)
  return [tailLeft, swallowTailPnt, tailRight]
}

/**
 * 计算细直箭头（燕尾）的显示点
 * @param positions 原始绘制点(2个)
 * @param options 细直箭头（燕尾）配置选项
 * @returns 细直箭头（燕尾）的边界点
 */
export function computeFineArrowYWPositions(
  positions: Cesium.Cartesian3[],
  options?: FineArrowYWOptions
): Cesium.Cartesian3[] {
  if (!positions || positions.length < 2) {
    return positions || []
  }

  // 默认配置
  const opts: Required<FineArrowYWOptions> = {
    headHeightFactor: options?.headHeightFactor ?? 0.18,
    headWidthFactor: options?.headWidthFactor ?? 0.3,
    neckHeightFactor: options?.neckHeightFactor ?? 0.85,
    neckWidthFactor: options?.neckWidthFactor ?? 0.15,
    tailWidthFactor: options?.tailWidthFactor ?? 0.1,
    swallowTailFactor: options?.swallowTailFactor ?? 1
  }

  // 转换为墨卡托投影坐标
  const pnts = cartesians2mercators(positions)
  if (pnts.length < 2) {
    return positions
  }

  // 获取尾部点（包含燕尾点）
  const tailPnts = getTailPoints(pnts, opts)

  // 获取箭头头部点
  const headPnts = getArrowHeadPoints(pnts, tailPnts[0], tailPnts[2], opts)
  const neckLeft = headPnts[0]
  const neckRight = headPnts[4]

  // 获取箭头身体点
  const bodyPnts = getArrowBodyPoints(pnts, neckLeft, neckRight, opts.tailWidthFactor)
  const count = bodyPnts.length

  // 组装左右边界点
  let leftPnts = [tailPnts[0]].concat(bodyPnts.slice(0, count / 2))
  leftPnts.push(neckLeft)
  let rightPnts = [tailPnts[2]].concat(bodyPnts.slice(count / 2, count))
  rightPnts.push(neckRight)

  // 平滑处理
  leftPnts = getQBSplinePoints(leftPnts)
  rightPnts = getQBSplinePoints(rightPnts)

  // 合并所有点，包含燕尾点
  const pList = leftPnts.concat(headPnts, rightPnts.reverse(), [tailPnts[1], leftPnts[0]])

  // 转换回 Cartesian3
  return mercators2cartesians(pList)
}
