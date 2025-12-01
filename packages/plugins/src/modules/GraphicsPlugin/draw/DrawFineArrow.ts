import * as Cesium from 'cesium'
import { DrawPolygonEx } from './DrawPolygonEx'
import { EditFineArrow } from '../edit/EditFineArrow'
import { computeFineArrowPositions } from '@auto-cesium/shared'
import type { EditClassConstructor } from '../types'

/**
 * 细直箭头绘制类
 * 通过2个点生成一个直箭头形状
 * 特点：
 * - 只需要两个点（起点和终点）
 * - 箭头形状为直线型
 * - 箭身较细，箭头有明显的尖角
 */
export class DrawFineArrow extends DrawPolygonEx {
  type = 'fineArrow'
  override editClass = EditFineArrow as EditClassConstructor
  override _minPointNum = 2
  override _maxPointNum = 2

  /**
   * 根据标绘绘制的点，生成显示的边界点
   * @param positions 原始绘制点(2个)
   * @param _attribute 属性
   * @returns 细直箭头的显示点位
   */
  protected override getShowPositions(
    positions: Cesium.Cartesian3[],
    _attribute?: Record<string, unknown>
  ): Cesium.Cartesian3[] {
    return computeFineArrowPositions(positions)
  }
}
