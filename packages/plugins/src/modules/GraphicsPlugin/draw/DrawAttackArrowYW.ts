import * as Cesium from 'cesium'
import { DrawPolygonEx } from './DrawPolygonEx'
import { EditAttackArrowYW } from '../edit/EditAttackArrowYW'
import { computeAttackArrowYWPositions } from '@ktd-cesium/shared'
import type { EditClassConstructor } from '../types'

/**
 * 攻击箭头(燕尾)绘制类
 * 通过多个点确定一个攻击箭头(燕尾)形状
 * 与普通攻击箭头的区别:
 * - 尾部有燕尾形状的凹陷
 * - 通过 swallowTailFactor 参数控制燕尾深度
 */
export class DrawAttackArrowYW extends DrawPolygonEx {
  type = 'attackArrowYW'
  override editClass = EditAttackArrowYW as EditClassConstructor
  override _minPointNum = 3
  override _maxPointNum = 999

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
