import * as Cesium from 'cesium'
import { DrawPolygonEx } from './DrawPolygonEx'
import { EditGatheringPlace } from '../edit/EditGatheringPlace'
import { computeGatheringPlacePositions } from '@ktd-cesium/shared'
import type { EditClassConstructor } from '../types'

/**
 * 集结地绘制类
 * 通过3个点生成集结地的平滑曲线
 * 特点：
 * - 固定需要3个点
 * - 自动计算中点形成特定形状
 * - 使用三次贝塞尔曲线平滑连接
 */
export class DrawGatheringPlace extends DrawPolygonEx {
  type = 'gatheringPlace'
  override editClass = EditGatheringPlace as EditClassConstructor
  override _minPointNum = 3
  override _maxPointNum = 3

  /**
   * 根据标绘绘制的点，生成显示的边界点
   * @param positions 原始绘制点(3个)
   * @param _attribute 属性
   * @returns 集结地的显示点位
   */
  protected override getShowPositions(
    positions: Cesium.Cartesian3[],
    _attribute?: Record<string, unknown>
  ): Cesium.Cartesian3[] {
    return computeGatheringPlacePositions(positions)
  }
}
