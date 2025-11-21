import * as Cesium from 'cesium'
import { DrawPolygonEx } from './DrawPolygonEx'
import { EditIsoscelesTriangle } from '../edit/EditIsoscelesTriangle'
import { computeIsoscelesTrianglePositions } from '@ktd-cesium/shared'
import type { EditClassConstructor } from '../types'

/**
 * 等腰三角形绘制类
 * 通过3个点确定一个等腰三角形:
 * - p1, p2: 底边的两个端点
 * - p3: 用于控制顶角方向和大小的点
 */
export class DrawIsoscelesTriangle extends DrawPolygonEx {
  type = 'isoscelesTriangle'
  override editClass = EditIsoscelesTriangle as EditClassConstructor
  override _minPointNum = 3
  override _maxPointNum = 3

  /**
   * 根据标绘绘制的点，生成显示的边界点
   * @param positions 原始绘制点(3个)
   * @param _attribute 属性
   * @returns 等腰三角形的3个顶点
   */
  protected override getShowPositions(
    positions: Cesium.Cartesian3[],
    _attribute?: Record<string, unknown>
  ): Cesium.Cartesian3[] {
    return computeIsoscelesTrianglePositions(positions)
  }
}
