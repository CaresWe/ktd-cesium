import * as Cesium from 'cesium'
import { DrawPolygonEx } from './DrawPolygonEx'
import { EditRegular } from '../edit/EditRegular'
import { computeRegularPositions } from '@ktd-cesium/shared'
import type { EditClassConstructor } from '../types'

/**
 * 正多边形绘制类
 * 通过圆心和一个顶点确定一个正多边形
 * 边数由 attribute.config.border 决定，默认为6
 */
export class DrawRegular extends DrawPolygonEx {
  type = 'regular'
  override editClass = EditRegular as EditClassConstructor
  override _minPointNum = 2
  override _maxPointNum = 2

  /**
   * 根据标绘绘制的点，生成显示的边界点
   * @param positions 原始绘制点(圆心和一个顶点)
   * @param attribute 属性，包含 config.border 边数
   * @returns 正多边形的顶点
   */
  protected override getShowPositions(
    positions: Cesium.Cartesian3[],
    attribute?: Record<string, unknown>
  ): Cesium.Cartesian3[] {
    const config = attribute?.config as { border?: number } | undefined
    const sides = config?.border || 6
    return computeRegularPositions(positions, sides)
  }
}
