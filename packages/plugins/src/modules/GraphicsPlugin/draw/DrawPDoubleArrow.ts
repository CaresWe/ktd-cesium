import * as Cesium from 'cesium'
import { DrawPPolygonEx } from './DrawPPolygonEx'
import { computeDoubleArrowPositions } from '@auto-cesium/shared'

/**
 * Primitive 方式的双箭头（钳击）绘制类
 * 通过3-5个点生成双箭头钳击形状
 *
 * 性能对比：
 * - Entity 方式：适合 < 50 个双箭头
 * - Primitive 方式：适合 > 50 个双箭头，性能提升显著
 */
export class DrawPDoubleArrow extends DrawPPolygonEx {
  override type = 'doubleArrow-p'
  protected override _minPointNum = 3
  protected override _maxPointNum = 5

  /**
   * 根据标绘绘制的点，生成显示的边界点
   * @param positions 原始绘制点(3-5个)
   * @param _attribute 属性
   * @returns 双箭头的显示点位
   */
  protected override getShowPositions(
    positions: Cesium.Cartesian3[],
    _attribute?: Record<string, unknown>
  ): Cesium.Cartesian3[] {
    return computeDoubleArrowPositions(positions)
  }
}
