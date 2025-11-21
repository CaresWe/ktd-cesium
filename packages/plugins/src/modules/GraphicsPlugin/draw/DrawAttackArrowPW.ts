import * as Cesium from 'cesium'
import { DrawPolygonEx } from './DrawPolygonEx'
import { EditAttackArrowPW } from '../edit/EditAttackArrowPW'
import { computeAttackArrowPWPositions } from '@ktd-cesium/shared'
import type { EditClassConstructor } from '../types'

/**
 * 攻击箭头(平尾)绘制类
 * 通过多个点确定一个攻击箭头(平尾)形状
 * 与普通攻击箭头的区别:
 * - 尾部宽度自动计算,不需要用户指定前两个点
 * - 所有点都用于确定箭头走向
 */
export class DrawAttackArrowPW extends DrawPolygonEx {
  type = 'attackArrowPW'
  override editClass = EditAttackArrowPW as EditClassConstructor
  override _minPointNum = 3
  override _maxPointNum = 999

  /**
   * 根据标绘绘制的点，生成显示的边界点
   * @param positions 原始绘制点(至少3个)
   * @param _attribute 属性
   * @returns 攻击箭头(平尾)的显示点位
   */
  protected override getShowPositions(
    positions: Cesium.Cartesian3[],
    _attribute?: Record<string, unknown>
  ): Cesium.Cartesian3[] {
    return computeAttackArrowPWPositions(positions)
  }
}
