import * as Cesium from 'cesium'
import { DrawPolygonEx } from './DrawPolygonEx'
import { EditSector } from '../edit/EditSector'
import { computeSectorPositions } from '@ktd-cesium/shared'
import type { EditClassConstructor } from '../types'

/**
 * 扇形绘制类
 * 通过圆心和两个边界点确定一个扇形
 */
export class DrawSector extends DrawPolygonEx {
  type = 'sector'
  override editClass = EditSector as EditClassConstructor
  override _minPointNum = 3
  override _maxPointNum = 3

  /**
   * 根据标绘绘制的点，生成显示的边界点
   * @param positions 原始绘制点(圆心、起点、终点)
   * @param _attribute 属性
   * @returns 扇形的显示点位
   */
  protected override getShowPositions(
    positions: Cesium.Cartesian3[],
    _attribute?: Record<string, unknown>
  ): Cesium.Cartesian3[] {
    return computeSectorPositions(positions)
  }
}
