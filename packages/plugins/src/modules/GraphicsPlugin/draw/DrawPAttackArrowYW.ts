import * as Cesium from 'cesium'
import { DrawPPolygonEx } from './DrawPPolygonEx'
import { computeAttackArrowYWPositions } from '@ktd-cesium/shared'

/**
 * Primitive 方式的攻击箭头(燕尾)绘制类
 * 通过多个点确定一个攻击箭头(燕尾)形状
 *
 * 性能对比：
 * - Entity 方式：适合 < 50 个攻击箭头(燕尾)
 * - Primitive 方式：适合 > 50 个攻击箭头(燕尾)，性能提升显著
 */
export class DrawPAttackArrowYW extends DrawPPolygonEx {
  override type = 'attackArrowYW-p'
  protected override _minPointNum = 3
  protected override _maxPointNum = 999

  /**
   * 根据标绘绘制的点，生成显示的边界点
   * @param positions 原始绘制点(至少3个)
   * @param _attribute 属性
   * @returns 攻击箭头(燕尾)的显示点位
   */
  protected override getShowPositions(
    positions: Cesium.Cartesian3[],
    _attribute?: Record<string, unknown>
  ): Cesium.Cartesian3[] {
    return computeAttackArrowYWPositions(positions)
  }
}
