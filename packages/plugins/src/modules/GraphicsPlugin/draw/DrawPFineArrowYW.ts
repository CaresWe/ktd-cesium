import * as Cesium from 'cesium'
import { DrawPPolygonEx } from './DrawPPolygonEx'
import { computeFineArrowYWPositions } from '@auto-cesium/shared'

/**
 * Primitive 方式的细直箭头（燕尾）绘制类
 * 通过2个点生成一个带燕尾的直箭头形状
 *
 * 性能对比：
 * - Entity 方式：适合 < 50 个细直箭头（燕尾）
 * - Primitive 方式：适合 > 50 个细直箭头（燕尾），性能提升显著
 */
export class DrawPFineArrowYW extends DrawPPolygonEx {
  override type = 'fineArrowYW-p'
  protected override _minPointNum = 2
  protected override _maxPointNum = 2

  /**
   * 根据标绘绘制的点，生成显示的边界点
   * @param positions 原始绘制点(2个)
   * @param _attribute 属性
   * @returns 细直箭头（燕尾）的显示点位
   */
  protected override getShowPositions(
    positions: Cesium.Cartesian3[],
    _attribute?: Record<string, unknown>
  ): Cesium.Cartesian3[] {
    return computeFineArrowYWPositions(positions)
  }
}
