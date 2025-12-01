import * as Cesium from 'cesium'
import { DrawPPolygonEx } from './DrawPPolygonEx'
import { computeCloseCurvePositions } from '@auto-cesium/shared'

/**
 * Primitive 方式的闭合曲面绘制类
 * 通过多个点生成闭合的平滑曲面
 *
 * 性能对比：
 * - Entity 方式：适合 < 50 个闭合曲面
 * - Primitive 方式：适合 > 50 个闭合曲面，性能提升显著
 */
export class DrawPCloseCurve extends DrawPPolygonEx {
  override type = 'closeCurve-p'
  protected override _minPointNum = 3
  protected override _maxPointNum = 999

  /**
   * 根据标绘绘制的点，生成显示的边界点
   * @param positions 原始绘制点(至少3个)
   * @param _attribute 属性
   * @returns 闭合曲面的显示点位
   */
  protected override getShowPositions(
    positions: Cesium.Cartesian3[],
    _attribute?: Record<string, unknown>
  ): Cesium.Cartesian3[] {
    return computeCloseCurvePositions(positions)
  }
}
