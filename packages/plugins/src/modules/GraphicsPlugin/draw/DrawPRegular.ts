import * as Cesium from 'cesium'
import { DrawPPolygonEx } from './DrawPPolygonEx'
import { computeRegularPositions } from '@auto-cesium/shared'

/**
 * Primitive 方式的正多边形绘制类
 * 通过圆心和一个顶点确定一个正多边形
 *
 * 性能对比：
 * - Entity 方式：适合 < 50 个正多边形
 * - Primitive 方式：适合 > 50 个正多边形，性能提升显著
 */
export class DrawPRegular extends DrawPPolygonEx {
  override type = 'regular-p'
  protected override _minPointNum = 2
  protected override _maxPointNum = 2

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
