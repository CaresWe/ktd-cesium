import * as Cesium from 'cesium'
import { DrawPPolyline } from './DrawPPolyline'
import { line2curve } from '@auto-cesium/shared'
import type { CurvePrimitiveAttribute } from '../types'

/**
 * Primitive 方式的曲线绘制类
 * 基于 PolylineCollection，通过贝塞尔曲线平滑算法将折线转换为平滑曲线
 *
 * 性能对比：
 * - Entity 方式：适合 < 100 条曲线
 * - Primitive 方式：适合 > 100 条曲线，性能提升显著
 */
export class DrawPCurve extends DrawPPolyline {
  override type = 'curve-p'

  /** 平滑后的曲线位置 */
  private _positions_show: Cesium.Cartesian3[] | null = null

  /**
   * 获取绘制位置（返回平滑后的曲线位置）
   */
  override getDrawPosition(): Cesium.Cartesian3[] | Cesium.Cartesian3 | null {
    return this._positions_show || this._positions_draw
  }

  /**
   * 更新折线位置（覆盖父类方法）
   */
  protected override updatePolylinePositions(): void {
    const positions = this._positions_draw as Cesium.Cartesian3[]

    if (positions.length < 3) {
      this._positions_show = positions
    } else {
      // 将折线转换为曲线
      const polylineAttr = (this.currentPolyline as unknown as Record<string, unknown>)?.attribute as
        | CurvePrimitiveAttribute
        | undefined
      const closure = polylineAttr?.style?.closure || false
      this._positions_show = line2curve(positions, closure)
    }

    if (this.currentPolyline) {
      this.currentPolyline.positions = (this._positions_show || positions) as Cesium.Cartesian3[]
    }
  }

  /**
   * Primitive 绘制结束（覆盖父类方法）
   */
  protected override finishPrimitive(): void {
    if (!this.currentPolyline) return

    // 保存原始绘制点和显示点
    const polylineObj = this.currentPolyline as unknown as Record<string, unknown>
    polylineObj._positions_draw = this._positions_draw as Cesium.Cartesian3[]
    polylineObj._positions_show = this._positions_show
    this.currentPolyline.positions = (this._positions_show || this._positions_draw) as Cesium.Cartesian3[]

    // 绑定编辑对象
    // polylineObj.editing = this.getEditClass(this.currentPolyline as unknown as Cesium.Entity)

    // 清理临时变量
    this._positions_show = null
  }

  /**
   * 清理资源（覆盖父类方法）
   */
  override disable(hasWB?: boolean): this {
    super.disable(hasWB)
    this._positions_show = null
    return this
  }
}
