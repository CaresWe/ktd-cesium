import * as Cesium from 'cesium'
import { DrawPPolygonEx } from './DrawPPolygonEx'
import { computeLunePositions } from '@ktd-cesium/shared'

/**
 * Primitive 方式的弓形面绘制类
 * 通过3个点确定一个弓形面(圆弧与弦围成的面)
 *
 * 性能对比：
 * - Entity 方式：适合 < 50 个弓形面
 * - Primitive 方式：适合 > 50 个弓形面，性能提升显著
 */
export class DrawPLune extends DrawPPolygonEx {
  override type = 'lune-p'
  protected override _minPointNum = 3
  protected override _maxPointNum = 3

  /**
   * 根据标绘绘制的点，生成显示的边界点
   * @param positions 原始绘制点(3个)
   * @param _attribute 属性
   * @returns 弓形面的显示点位
   */
  protected override getShowPositions(
    positions: Cesium.Cartesian3[],
    _attribute?: Record<string, unknown>
  ): Cesium.Cartesian3[] {
    return computeLunePositions(positions)
  }
}
