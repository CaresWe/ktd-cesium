import * as Cesium from 'cesium'
import { DrawPolyline } from './DrawPolyline'
import { EditCurve } from '../edit/EditCurve'
import { line2curve } from '../core/CurveUtil'

/**
 * 曲线绘制类
 * 基于折线，通过贝塞尔曲线平滑算法将折线转换为平滑曲线
 */
export class DrawCurve extends DrawPolyline {
  type = 'curve'
  editClass = EditCurve

  private _positions_show: Cesium.Cartesian3[] | null = null

  getDrawPosition(): Cesium.Cartesian3[] {
    return this._positions_show || this._positions_draw
  }

  updateAttrForDrawing(): void {
    if (this._positions_draw == null || this._positions_draw.length < 3) {
      this._positions_show = this._positions_draw
      return
    }

    // 将折线转换为曲线
    const closure = this.entity?.attribute?.style?.closure || false
    this._positions_show = line2curve(this._positions_draw, closure)
  }

  finish(): void {
    const entity = this.entity!
    entity.editing = this.getEditClass(entity)

    // 保存原始绘制点和显示点
    ;(entity as any)._positions_draw = this._positions_draw
    ;(entity as any)._positions_show = this._positions_show

    // 使用回调属性更新显示位置
    ;(entity as any).polyline.positions = new Cesium.CallbackProperty(() => {
      return (entity as any)._positions_show
    }, false)

    this._positions_show = null
  }
}
