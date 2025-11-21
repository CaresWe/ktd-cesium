import * as Cesium from 'cesium'
import { DrawPPolygonEx } from './DrawPPolygonEx'
import { computeAttackArrowPositions } from '@ktd-cesium/shared'

/**
 * Primitive 方式的攻击箭头绘制类
 * 通过多个点确定一个攻击箭头形状
 *
 * 性能对比：
 * - Entity 方式：适合 < 50 个攻击箭头
 * - Primitive 方式：适合 > 50 个攻击箭头，性能提升显著
 */
export class DrawPAttackArrow extends DrawPPolygonEx {
  override type = 'attackArrow-p'
  protected override _minPointNum = 3
  protected override _maxPointNum = 999

  /**
   * 根据标绘绘制的点，生成显示的边界点
   * @param positions 原始绘制点(至少3个)
   * @param _attribute 属性
   * @returns 攻击箭头的显示点位
   */
  protected override getShowPositions(
    positions: Cesium.Cartesian3[],
    _attribute?: Record<string, unknown>
  ): Cesium.Cartesian3[] {
    return computeAttackArrowPositions(positions)
  }
}
