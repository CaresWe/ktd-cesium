import * as Cesium from 'cesium'
import { DrawPolygon } from './DrawPolygon'
import { PolylineEntity } from '../attr/AttrPolyline'
import type { GeoJSONFeature } from '@auto-cesium/shared'
import type { PolygonExExtendedEntity } from '../types'

/**
 * 扩展面绘制类
 * 用于外部扩展使用，绘制的点与显示的点不一致的标绘
 * 子类需要重写 getShowPositions 方法
 */
export class DrawPolygonEx extends DrawPolygon {
  protected _positions_show: Cesium.Cartesian3[] | null = null

  getDrawPosition(): Cesium.Cartesian3[] {
    return this._positions_show || []
  }

  updateAttrForDrawing(): void {
    if (
      this._positions_draw == null ||
      !Array.isArray(this._positions_draw) ||
      this._positions_draw.length < this._minPointNum
    ) {
      this._positions_show = Array.isArray(this._positions_draw) ? this._positions_draw : null
      return
    }

    const extEntity = this.entity as PolygonExExtendedEntity | undefined
    this._positions_show = this.getShowPositions(this._positions_draw, extEntity?.attribute)
  }

  /**
   * 子类中重写，根据标绘绘制的点，生成显示的边界点
   * @param positions 原始绘制点
   * @param attribute 属性
   * @returns 显示点位
   */
  protected getShowPositions(
    positions: Cesium.Cartesian3[],
    _attribute?: Record<string, unknown>
  ): Cesium.Cartesian3[] {
    return positions
  }

  finish(): void {
    const entity = this.entity!
    const extEntity = entity as Cesium.Entity & PolygonExExtendedEntity

    extEntity.editing = this.getEditClass(entity)

    // 抛弃多余的无效绘制点
    if (Array.isArray(this._positions_draw) && this._positions_draw.length > this._maxPointNum) {
      this._positions_draw.splice(this._maxPointNum, this._positions_draw.length - this._maxPointNum)
    }

    extEntity._positions_draw = Array.isArray(this._positions_draw) ? this._positions_draw : []
    extEntity._positions_show = this._positions_show

    if (extEntity.polygon) {
      extEntity.polygon.hierarchy = new Cesium.CallbackProperty((_time?: Cesium.JulianDate) => {
        const positions = extEntity._positions_show
        if (!positions || positions.length === 0) {
          return new Cesium.PolygonHierarchy([])
        }
        return new Cesium.PolygonHierarchy(positions)
      }, false)
    }

    this._positions_draw = []
    this._positions_show = null
  }

  /**
   * 转换为 GeoJSON 格式
   * @param entity - Cesium 实体对象
   * @returns GeoJSON 特征对象
   */
  override toGeoJSON(entity: Cesium.Entity): GeoJSONFeature | Record<string, unknown> {
    // 不用闭合最后一个点
    // 直接调用 AttrPolygon 的 toGeoJSON，传递 noAdd 参数为 true
    const attrPolygon = this.attrClass as unknown as typeof import('../attr/AttrPolygon')
    if (!attrPolygon || typeof attrPolygon.toGeoJSON !== 'function') return {}
    return attrPolygon.toGeoJSON(entity as unknown as PolylineEntity, true)
  }
}
