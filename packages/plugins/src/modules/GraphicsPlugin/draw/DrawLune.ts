import * as Cesium from 'cesium'
import { DrawPolygonEx } from './DrawPolygonEx'
import { EditLune } from '../edit/EditLune'
import { computeLunePositions } from '@auto-cesium/shared'
import type { EditClassConstructor } from '../types'

/**
 * 弓形面绘制类
 * 通过3个点确定一个弓形面(圆弧与弦围成的面)
 */
export class DrawLune extends DrawPolygonEx {
  type = 'lune'
  override editClass = EditLune as EditClassConstructor
  override _minPointNum = 3
  override _maxPointNum = 3

  /**
   * 根据标绘绘制的点，生成显示的边界点
   * @param positions 原始绘制点(3个)
   * @param _attribute 属性
   * @returns 弓形面的显示点位
   */
  protected override getShowPositions(
    positions: Cesium.Cartesian3[],
    _attribute?: Record<string, unknown>
  ): Cesium.Cartesian3[] {
    return computeLunePositions(positions)
  }
}
