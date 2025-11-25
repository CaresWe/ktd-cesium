import * as Cesium from 'cesium'
import { EditPolyline } from './EditPolyline'
import { line2curve } from '@ktd-cesium/shared'
import type { ExtendedEntity } from './EditBase'
import type { CurveEditEntity } from '../types'

/**
 * 曲线编辑类
 * 编辑时显示控制点，动态更新曲线平滑效果
 * 继承自 EditPolyline
 */
export class EditCurve extends EditPolyline {
  declare entity: ExtendedEntity & CurveEditEntity
  protected _positions_show: Cesium.Cartesian3[] | null = null

  /**
   * 修改坐标会回调，提高显示的效率
   */
  protected changePositionsToCallback(): void {
    try {
      if (!this.entity) {
        throw new Error('实体对象不存在')
      }

      this._positions_draw = this.entity._positions_draw || null

      // 获取显示位置
      if (this.entity._positions_show) {
        this._positions_show = this.entity._positions_show
      } else {
        // 从 polyline 的 positions 属性获取
        const graphic = this.getGraphic()
        if (graphic && 'positions' in graphic && graphic.positions) {
          const positions = graphic.positions
          if (positions && typeof positions === 'object' && 'getValue' in positions) {
            this._positions_show = (positions as Cesium.Property).getValue(
              this.viewer.clock.currentTime
            ) as Cesium.Cartesian3[]
          }
        }
      }

      if (!this._positions_draw) {
        throw new Error('无法获取位置数据')
      }
    } catch (error) {
      console.error('EditCurve.changePositionsToCallback: 转换位置失败', error)
      throw error
    }
  }

  /**
   * 坐标位置相关
   * 根据控制点重新生成平滑曲线
   */
  updateAttrForEditing(): void {
    try {
      if (!this._positions_draw || this._positions_draw.length < 3) {
        this._positions_show = this._positions_draw
        return
      }

      // 验证实体和属性
      if (!this.entity) {
        console.warn('EditCurve.updateAttrForEditing: 实体对象不存在')
        return
      }

      if (!this.entity.attribute?.style) {
        console.warn('EditCurve.updateAttrForEditing: 实体样式不存在')
        return
      }

      // 根据控制点重新生成平滑曲线
      const closure = this.entity.attribute.style.closure || false
      this._positions_show = line2curve(this._positions_draw, closure)
      this.entity._positions_show = this._positions_show
    } catch (error) {
      console.error('EditCurve.updateAttrForEditing: 更新属性失败', error)
      // 更新属性失败不向上抛出，避免中断交互
    }
  }

  /**
   * 图形编辑结束后调用
   */
  protected finish(): void {
    try {
      if (!this.entity) {
        console.warn('EditCurve.finish: 实体对象不存在')
        return
      }

      this.entity._positions_show = this._positions_show || undefined
      this.entity._positions_draw = this._positions_draw || undefined
    } catch (error) {
      console.error('EditCurve.finish: 完成编辑失败', error)
      // finish 方法的错误不向上抛出，避免影响编辑结束流程
    }
  }

  /**
   * 获取位置数组（返回显示位置，即平滑后的曲线位置）
   */
  getPosition(): Cesium.Cartesian3[] {
    try {
      // 对于曲线，返回平滑后的显示位置
      if (this._positions_show && this._positions_show.length > 0) {
        return this._positions_show
      }

      // 如果没有显示位置，返回控制点位置
      if (this._positions_draw) {
        return this._positions_draw
      }

      throw new Error('位置数组不存在')
    } catch (error) {
      console.error('EditCurve.getPosition: 获取位置失败', error)
      throw error
    }
  }
}
