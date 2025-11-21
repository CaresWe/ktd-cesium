import * as Cesium from 'cesium'
import { DrawPolygonEx } from './DrawPolygonEx'
import { EditFineArrowYW } from '../edit/EditFineArrowYW'
import { computeFineArrowYWPositions } from '@ktd-cesium/shared'
import type { EditClassConstructor } from '../types'

/**
 * 细直箭头（燕尾）绘制类
 * 通过2个点生成一个带燕尾的直箭头形状
 * 与普通细直箭头的区别：
 * - 尾部有燕尾形状的凹陷
 * - 通过 swallowTailFactor 参数控制燕尾深度
 */
export class DrawFineArrowYW extends DrawPolygonEx {
  type = 'fineArrowYW'
  override editClass = EditFineArrowYW as EditClassConstructor
  override _minPointNum = 2
  override _maxPointNum = 2

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
