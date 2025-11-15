/**
 * GraphicsPlugin 工具函数
 */

import * as Cesium from 'cesium'

/**
 * 获取当前鼠标位置的世界坐标
 * @param scene Cesium场景
 * @param position 屏幕坐标
 * @param entity 实体对象（可选）
 * @returns 世界坐标
 */
export function getCurrentMousePosition(
  scene: Cesium.Scene,
  position: Cesium.Cartesian2,
  entity?: Cesium.Entity | null
): Cesium.Cartesian3 | null {
  // 尝试拾取地形
  const ray = scene.camera.getPickRay(position)
  if (!ray) return null

  // 先尝试拾取地球表面
  const cartesian = scene.globe.pick(ray, scene)
  if (cartesian) return cartesian

  // 如果没有拾取到地球，尝试拾取3D Tiles或其他对象
  const pickedObject = scene.pick(position)
  if (Cesium.defined(pickedObject)) {
    return scene.pickPosition(position) || null
  }

  // 如果都没有拾取到，返回射线与椭球体的交点
  return scene.camera.pickEllipsoid(position, scene.globe.ellipsoid) || null
}

/**
 * 格式化数字
 * @param num 数字
 * @param digits 小数位数
 * @returns 格式化后的数字
 */
export function formatNum(num: number, digits = 0): number {
  return Number(num.toFixed(digits))
}
