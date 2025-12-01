import * as Cesium from 'cesium'
import { DrawPolygonEx } from './DrawPolygonEx'
import { EditCloseCurve } from '../edit/EditCloseCurve'
import { computeCloseCurvePositions } from '@auto-cesium/shared'
import type { EditClassConstructor } from '../types'

/**
 * 闭合曲面绘制类
 * 通过多个点生成闭合的平滑曲面
 * 使用三次贝塞尔曲线平滑连接控制点
 */
export class DrawCloseCurve extends DrawPolygonEx {
  type = 'closeCurve'
  override editClass = EditCloseCurve as EditClassConstructor
  override _minPointNum = 3
  override _maxPointNum = 999

  /**
   * 根据标绘绘制的点，生成显示的边界点
   * @param positions 原始绘制点(至少3个)
   * @param _attribute 属性
   * @returns 闭合曲面的显示点位
   */
  protected override getShowPositions(
    positions: Cesium.Cartesian3[],
    _attribute?: Record<string, unknown>
  ): Cesium.Cartesian3[] {
    return computeCloseCurvePositions(positions)
  }
}
