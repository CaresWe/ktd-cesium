import * as Cesium from 'cesium'
import { DrawPPolygonEx } from './DrawPPolygonEx'
import { computeGatheringPlacePositions } from '@auto-cesium/shared'

/**
 * Primitive 方式的集结地绘制类
 * 通过3个点生成集结地的平滑曲线
 *
 * 性能对比：
 * - Entity 方式：适合 < 50 个集结地
 * - Primitive 方式：适合 > 50 个集结地，性能提升显著
 */
export class DrawPGatheringPlace extends DrawPPolygonEx {
  override type = 'gatheringPlace-p'
  protected override _minPointNum = 3
  protected override _maxPointNum = 3

  /**
   * 根据标绘绘制的点，生成显示的边界点
   * @param positions 原始绘制点(3个)
   * @param _attribute 属性
   * @returns 集结地的显示点位
   */
  protected override getShowPositions(
    positions: Cesium.Cartesian3[],
    _attribute?: Record<string, unknown>
  ): Cesium.Cartesian3[] {
    return computeGatheringPlacePositions(positions)
  }
}
