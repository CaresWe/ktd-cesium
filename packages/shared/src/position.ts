/**
 * 位置处理工具函数
 * 提供 Cesium 位置相关的工具方法
 */

import * as Cesium from 'cesium'
import { formatNum } from './format'

/**
 * 获取位置数组中的最大高度
 * @param positions 位置数组
 * @param defaultVal 默认值
 * @returns 最大高度值
 */
export function getMaxHeight(positions: Cesium.Cartesian3[], defaultVal: number = 0): number {
  let maxHeight = defaultVal
  if (!positions || positions.length === 0) return maxHeight

  for (let i = 0; i < positions.length; i++) {
    const tempCarto = Cesium.Cartographic.fromCartesian(positions[i])
    if (tempCarto.height > maxHeight) {
      maxHeight = tempCarto.height
    }
  }
  return formatNum(maxHeight, 2)
}

/**
 * 获取位置数组中的最小高度
 * @param positions 位置数组
 * @param defaultVal 默认值
 * @returns 最小高度值
 */
export function getMinHeight(positions: Cesium.Cartesian3[], defaultVal: number = 0): number {
  let minHeight = defaultVal
  if (!positions || positions.length === 0) return minHeight

  for (let i = 0; i < positions.length; i++) {
    const tempCarto = Cesium.Cartographic.fromCartesian(positions[i])
    if (i === 0 || tempCarto.height < minHeight) {
      minHeight = tempCarto.height
    }
  }
  return formatNum(minHeight, 2)
}

/**
 * 获取位置数组的平均高度
 * @param positions 位置数组
 * @returns 平均高度值
 */
export function getAverageHeight(positions: Cesium.Cartesian3[]): number {
  if (!positions || positions.length === 0) return 0

  let totalHeight = 0
  for (let i = 0; i < positions.length; i++) {
    const tempCarto = Cesium.Cartographic.fromCartesian(positions[i])
    totalHeight += tempCarto.height
  }
  return formatNum(totalHeight / positions.length, 2)
}

/**
 * 为位置添加高度值
 * @param positions 单个位置或位置数组
 * @param addHeight 要添加的高度值
 * @returns 处理后的位置
 */
export function addPositionsHeight(
  positions: Cesium.Cartesian3 | Cesium.Cartesian3[],
  addHeight: number
): Cesium.Cartesian3 | Cesium.Cartesian3[] {
  addHeight = Number(addHeight) || 0

  if (isNaN(addHeight) || addHeight === 0) return positions

  if (positions instanceof Array) {
    const arr: Cesium.Cartesian3[] = []
    for (let i = 0, len = positions.length; i < len; i++) {
      const car = Cesium.Cartographic.fromCartesian(positions[i])
      const point = Cesium.Cartesian3.fromRadians(car.longitude, car.latitude, car.height + addHeight)
      arr.push(point)
    }
    return arr
  } else {
    const car = Cesium.Cartographic.fromCartesian(positions)
    return Cesium.Cartesian3.fromRadians(car.longitude, car.latitude, car.height + addHeight)
  }
}

/**
 * 设置位置为指定高度
 * @param positions 单个位置或位置数组
 * @param height 要设置的高度值
 * @returns 处理后的位置
 */
export function setPositionsHeight(
  positions: Cesium.Cartesian3 | Cesium.Cartesian3[],
  height: number
): Cesium.Cartesian3 | Cesium.Cartesian3[] {
  height = Number(height) || 0

  if (positions instanceof Array) {
    const arr: Cesium.Cartesian3[] = []
    for (let i = 0, len = positions.length; i < len; i++) {
      const car = Cesium.Cartographic.fromCartesian(positions[i])
      const point = Cesium.Cartesian3.fromRadians(car.longitude, car.latitude, height)
      arr.push(point)
    }
    return arr
  } else {
    const car = Cesium.Cartographic.fromCartesian(positions)
    return Cesium.Cartesian3.fromRadians(car.longitude, car.latitude, height)
  }
}

/**
 * 计算两个位置之间的距离
 * @param pos1 位置1
 * @param pos2 位置2
 * @returns 距离（米）
 */
export function getDistance(pos1: Cesium.Cartesian3, pos2: Cesium.Cartesian3): number {
  return Cesium.Cartesian3.distance(pos1, pos2)
}

/**
 * 计算位置数组的总距离
 * @param positions 位置数组
 * @returns 总距离（米）
 */
export function getTotalDistance(positions: Cesium.Cartesian3[]): number {
  if (!positions || positions.length < 2) return 0

  let totalDistance = 0
  for (let i = 0; i < positions.length - 1; i++) {
    totalDistance += getDistance(positions[i], positions[i + 1])
  }
  return formatNum(totalDistance, 2)
}

/**
 * 计算位置数组的中心点
 * @param positions 位置数组
 * @returns 中心点位置
 */
export function getCenterPosition(positions: Cesium.Cartesian3[]): Cesium.Cartesian3 | null {
  if (!positions || positions.length === 0) return null

  if (positions.length === 1) return positions[0]

  let x = 0, y = 0, z = 0
  for (let i = 0; i < positions.length; i++) {
    x += positions[i].x
    y += positions[i].y
    z += positions[i].z
  }

  return new Cesium.Cartesian3(
    x / positions.length,
    y / positions.length,
    z / positions.length
  )
}

/**
 * 插值两个位置之间的点
 * @param pos1 起点
 * @param pos2 终点
 * @param t 插值参数 [0, 1]
 * @returns 插值点
 */
export function lerpPosition(pos1: Cesium.Cartesian3, pos2: Cesium.Cartesian3, t: number): Cesium.Cartesian3 {
  return Cesium.Cartesian3.lerp(pos1, pos2, t, new Cesium.Cartesian3())
}

/**
 * 在两个位置之间生成多个插值点
 * @param pos1 起点
 * @param pos2 终点
 * @param count 生成的点数（不包括起点和终点）
 * @returns 插值点数组
 */
export function interpolatePositions(pos1: Cesium.Cartesian3, pos2: Cesium.Cartesian3, count: number): Cesium.Cartesian3[] {
  const result: Cesium.Cartesian3[] = [pos1]

  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1)
    result.push(lerpPosition(pos1, pos2, t))
  }

  result.push(pos2)
  return result
}
