import * as Cesium from 'cesium'
import { DrawPolygon } from './DrawPolygon'

/**
 * 扩展面绘制类
 * 用于外部扩展使用，绘制的点与显示的点不一致的标绘
 * 子类需要重写 getShowPositions 方法
 */
export class DrawPolygonEx extends DrawPolygon {
  protected _positions_show: Cesium.Cartesian3[] | null = null

  getDrawPosition(): Cesium.Cartesian3[] {
    return this._positions_show || this._positions_draw
  }

  updateAttrForDrawing(): void {
    if (this._positions_draw == null || this._positions_draw.length < this._minPointNum) {
      this._positions_show = this._positions_draw
      return
    }

    this._positions_show = this.getShowPositions(this._positions_draw, this.entity?.attribute)
  }

  /**
   * 子类中重写，根据标绘绘制的点，生成显示的边界点
   * @param positions 原始绘制点
   * @param attribute 属性
   * @returns 显示点位
   */
  protected getShowPositions(positions: Cesium.Cartesian3[], attribute?: any): Cesium.Cartesian3[] {
    return positions
  }

  finish(): void {
    const entity = this.entity!
    entity.editing = this.getEditClass(entity)

    // 抛弃多余的无效绘制点
    if (this._positions_draw.length > this._maxPointNum) {
      this._positions_draw.splice(this._maxPointNum, this._positions_draw.length - this._maxPointNum)
    }

    ;(entity as any)._positions_draw = this._positions_draw
    ;(entity as any)._positions_show = this._positions_show

    ;(entity as any).polygon.hierarchy = new Cesium.CallbackProperty(() => {
      const positions = (entity as any)._positions_show
      return new Cesium.PolygonHierarchy(positions)
    }, false)

    this._positions_draw = []
    this._positions_show = null
  }

  toGeoJSON(entity: Cesium.Entity): any {
    // 不用闭合最后一个点
    return this.attrClass.toGeoJSON(entity, true)
  }
}
