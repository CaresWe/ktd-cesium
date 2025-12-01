import * as Cesium from 'cesium'
import { DrawPolygonEx } from './DrawPolygonEx'
import { EditDoubleArrow } from '../edit/EditDoubleArrow'
import { computeDoubleArrowPositions } from '@auto-cesium/shared'
import type { EditClassConstructor } from '../types'

/**
 * 双箭头（钳击）绘制类
 * 通过3-5个点生成双箭头钳击形状
 * - 3个点：自动计算对称的第4个点
 * - 4个点：前两个点作为基线，第3、4个点作为两个箭头的顶点
 * - 5个点：前两个点作为基线，第3、4个点作为箭头顶点，第5个点作为连接点
 */
export class DrawDoubleArrow extends DrawPolygonEx {
  type = 'doubleArrow'
  override editClass = EditDoubleArrow as EditClassConstructor
  override _minPointNum = 3
  override _maxPointNum = 5

  /**
   * 根据标绘绘制的点，生成显示的边界点
   * @param positions 原始绘制点(3-5个)
   * @param _attribute 属性
   * @returns 双箭头的显示点位
   */
  protected override getShowPositions(
    positions: Cesium.Cartesian3[],
    _attribute?: Record<string, unknown>
  ): Cesium.Cartesian3[] {
    return computeDoubleArrowPositions(positions)
  }
}
