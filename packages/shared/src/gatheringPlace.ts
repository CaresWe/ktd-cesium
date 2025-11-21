/**
 * 集结地计算工具
 * 通过3个控制点生成集结地的平滑曲线
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

/**
 * 获取法向量
 */
function getNormal(pnt1: number[], pnt2: number[], pnt3: number[]): number[] {
  let dX1 = pnt1[0] - pnt2[0]
  let dY1 = pnt1[1] - pnt2[1]
  const d1 = Math.sqrt(dX1 * dX1 + dY1 * dY1)
  dX1 /= d1
  dY1 /= d1

  let dX2 = pnt3[0] - pnt2[0]
  let dY2 = pnt3[1] - pnt2[1]
  const d2 = Math.sqrt(dX2 * dX2 + dY2 * dY2)
  dX2 /= d2
  dY2 /= d2

  const uX = dX1 + dX2
  const uY = dY1 + dY2
  return [uX, uY]
}

/**
 * 获取角平分线法向量点
 * @param t 系数
 * @param pnt1 第一个点
 * @param pnt2 中间点
 * @param pnt3 第三个点
 * @returns [右侧法向量点, 左侧法向量点]
 */
function getBisectorNormals(
  t: number,
  pnt1: number[],
  pnt2: number[],
  pnt3: number[]
): number[][] {
  const normal = getNormal(pnt1, pnt2, pnt3)
  let bisectorNormalRight: number[] | null = null
  let bisectorNormalLeft: number[] | null = null

  const dist = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1])
  const uX = normal[0] / dist
  const uY = normal[1] / dist
  const d1 = mathDistance(pnt1, pnt2)
  const d2 = mathDistance(pnt2, pnt3)

  if (dist > ZERO_TOLERANCE) {
    if (isClockWise(pnt1, pnt2, pnt3)) {
      let dt = t * d1
      let x = pnt2[0] - dt * uY
      let y = pnt2[1] + dt * uX
      bisectorNormalRight = [x, y]

      dt = t * d2
      x = pnt2[0] + dt * uY
      y = pnt2[1] - dt * uX
      bisectorNormalLeft = [x, y]
    } else {
      let dt = t * d1
      let x = pnt2[0] + dt * uY
      let y = pnt2[1] - dt * uX
      bisectorNormalRight = [x, y]

      dt = t * d2
      x = pnt2[0] - dt * uY
      y = pnt2[1] + dt * uX
      bisectorNormalLeft = [x, y]
    }
  } else {
    let x = pnt2[0] + t * (pnt1[0] - pnt2[0])
    let y = pnt2[1] + t * (pnt1[1] - pnt2[1])
    bisectorNormalRight = [x, y]

    x = pnt2[0] + t * (pnt3[0] - pnt2[0])
    y = pnt2[1] + t * (pnt3[1] - pnt2[1])
    bisectorNormalLeft = [x, y]
  }

  return [bisectorNormalRight, bisectorNormalLeft]
}

/**
 * 获取三次贝塞尔曲线上的点
 * @param t 参数 [0, 1]
 * @param startPnt 起始点
 * @param cPnt1 第一个控制点
 * @param cPnt2 第二个控制点
 * @param endPnt 结束点
 * @returns 曲线上的点
 */
function getCubicValue(
  t: number,
  startPnt: number[],
  cPnt1: number[],
  cPnt2: number[],
  endPnt: number[]
): number[] {
  t = Math.max(Math.min(t, 1), 0)
  const tp = 1 - t
  const t2 = t * t
  const t3 = t2 * t
  const tp2 = tp * tp
  const tp3 = tp2 * tp

  const x = tp3 * startPnt[0] + 3 * tp2 * t * cPnt1[0] + 3 * tp * t2 * cPnt2[0] + t3 * endPnt[0]
  const y = tp3 * startPnt[1] + 3 * tp2 * t * cPnt1[1] + 3 * tp * t2 * cPnt2[1] + t3 * endPnt[1]
  return [x, y]
}

// ==================== 集结地算法 ====================

/**
 * 集结地配置选项
 */
export interface GatheringPlaceOptions {
  /** 平滑系数，默认 0.4 */
  smoothFactor?: number
  /** 曲线分段数，默认 100 */
  segments?: number
}

/**
 * 计算集结地的显示点
 * @param positions 原始绘制点(固定3个)
 * @param options 集结地配置选项
 * @returns 集结地的边界点
 */
export function computeGatheringPlacePositions(
  positions: Cesium.Cartesian3[],
  options?: GatheringPlaceOptions
): Cesium.Cartesian3[] {
  if (!positions || positions.length < 3) {
    return positions || []
  }

  // 默认配置
  const opts = {
    smoothFactor: options?.smoothFactor ?? 0.4,
    segments: options?.segments ?? 100
  }

  // 转换为墨卡托投影坐标
  const pnts = cartesians2mercators(positions)
  if (pnts.length < 3) {
    return positions
  }

  // 计算中点并添加到点列表
  // 顺序: pnts[0], pnts[1], pnts[2], mid(pnts[0], pnts[2]), pnts[0], pnts[1]
  const midPoint = mid(pnts[0], pnts[2])
  const expandedPnts = [...pnts, midPoint, pnts[0], pnts[1]]

  // 计算所有法向量点
  const normals: number[][] = []
  for (let i = 0; i < expandedPnts.length - 2; i++) {
    const normalPoints = getBisectorNormals(
      opts.smoothFactor,
      expandedPnts[i],
      expandedPnts[i + 1],
      expandedPnts[i + 2]
    )
    normals.push(...normalPoints)
  }

  // 调整法向量顺序，将最后一个移到最前面
  const count = normals.length
  const adjustedNormals = [normals[count - 1]].concat(normals.slice(0, count - 1))

  // 使用三次贝塞尔曲线生成平滑点
  const pList: number[][] = []
  for (let i = 0; i < expandedPnts.length - 2; i++) {
    const pnt1 = expandedPnts[i]
    const pnt2 = expandedPnts[i + 1]
    pList.push(pnt1)

    // 在两个控制点之间插值
    for (let t = 0; t <= opts.segments; t++) {
      const pnt = getCubicValue(
        t / opts.segments,
        pnt1,
        adjustedNormals[i * 2],
        adjustedNormals[i * 2 + 1],
        pnt2
      )
      pList.push(pnt)
    }
    pList.push(pnt2)
  }

  // 转换回 Cartesian3
  return mercators2cartesians(pList)
}
