import * as Cesium from 'cesium'
import { DrawPPolygonEx } from './DrawPPolygonEx'
import { computeSectorPositions } from '@auto-cesium/shared'

/**
 * Primitive 方式的扇形绘制类
 * 通过圆心和两个边界点确定一个扇形
 *
 * 性能对比：
 * - Entity 方式：适合 < 50 个扇形
 * - Primitive 方式：适合 > 50 个扇形，性能提升显著
 */
export class DrawPSector extends DrawPPolygonEx {
  override type = 'sector-p'
  protected override _minPointNum = 3
  protected override _maxPointNum = 3

  /**
   * 根据标绘绘制的点，生成显示的边界点
   * @param positions 原始绘制点(圆心、起点、终点)
   * @param _attribute 属性
   * @returns 扇形的显示点位
   */
  protected override getShowPositions(
    positions: Cesium.Cartesian3[],
    _attribute?: Record<string, unknown>
  ): Cesium.Cartesian3[] {
    return computeSectorPositions(positions)
  }
}
