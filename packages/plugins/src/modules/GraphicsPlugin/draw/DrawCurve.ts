import * as Cesium from 'cesium'
import { DrawPolyline } from './DrawPolyline'
import { EditCurve } from '../edit/EditCurve'
import { line2curve } from '@ktd-cesium/shared'
import type { EditClassConstructor, CurveExtendedEntity } from '../types'
import type { EditBase } from '../edit/EditBase'

/**
 * 曲线绘制类
 * 基于折线，通过贝塞尔曲线平滑算法将折线转换为平滑曲线
 */
export class DrawCurve extends DrawPolyline {
  type = 'curve'
  override editClass = EditCurve as EditClassConstructor

  private _positions_show: Cesium.Cartesian3[] | null = null

  /**
   * 获取绘制位置（返回平滑后的曲线位置）
   */
  override getDrawPosition(): Cesium.Cartesian3[] | Cesium.Cartesian3 | null {
    return this._positions_show || this._positions_draw
  }

  /**
   * 绘制过程中实时更新
   */
  override updateAttrForDrawing(): void {
    const positions = this._positions_draw as Cesium.Cartesian3[] | null

    if (positions == null || positions.length < 3) {
      this._positions_show = positions
      return
    }

    // 将折线转换为曲线
    const extEntity = this.entity as CurveExtendedEntity | null
    const closure = extEntity?.attribute?.style?.closure || false
    this._positions_show = line2curve(positions, closure)
  }

  /**
   * 图形绘制结束后调用
   */
  override finish(): void {
    const entity = this.entity as CurveExtendedEntity | null
    if (!entity) return

    entity.editing = this.getEditClass(entity as Cesium.Entity) as EditBase

    // 保存原始绘制点和显示点
    entity._positions_draw = this._positions_draw as Cesium.Cartesian3[]
    entity._positions_show = this._positions_show

    // 使用回调属性更新显示位置
    if (entity.polyline) {
      entity.polyline.positions = new Cesium.CallbackProperty(() => {
        return entity._positions_show
      }, false) as unknown as Cesium.PositionProperty
    }

    this._positions_show = null
  }
}
