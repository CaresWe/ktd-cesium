import * as Cesium from 'cesium'
import { DrawPolygonEx } from './DrawPolygonEx'
import { EditAttackArrow } from '../edit/EditAttackArrow'
import { computeAttackArrowPositions } from '@ktd-cesium/shared'
import type { EditClassConstructor } from '../types'

/**
 * 攻击箭头绘制类
 * 通过多个点确定一个攻击箭头形状
 * - 前两个点确定箭尾宽度
 * - 后续点确定箭头走向
 */
export class DrawAttackArrow extends DrawPolygonEx {
  type = 'attackArrow'
  override editClass = EditAttackArrow as EditClassConstructor
  override _minPointNum = 3
  override _maxPointNum = 999

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
