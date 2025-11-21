import * as Cesium from 'cesium'
import { DrawPPolygonEx } from './DrawPPolygonEx'
import { computeIsoscelesTrianglePositions } from '@ktd-cesium/shared'

/**
 * Primitive 方式的等腰三角形绘制类
 * 通过3个点确定一个等腰三角形
 *
 * 性能对比：
 * - Entity 方式：适合 < 50 个等腰三角形
 * - Primitive 方式：适合 > 50 个等腰三角形，性能提升显著
 */
export class DrawPIsoscelesTriangle extends DrawPPolygonEx {
  override type = 'isoscelesTriangle-p'
  protected override _minPointNum = 3
  protected override _maxPointNum = 3

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
