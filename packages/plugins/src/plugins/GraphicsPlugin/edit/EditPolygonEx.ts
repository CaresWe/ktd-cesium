import * as Cesium from 'cesium'
import { EditPolygon } from './EditPolygon'
import type { ExtendedEntity } from './EditBase'

/**
 * 扩展的 Entity 接口，包含扩展面特有属性
 */
interface PolygonExEntity {
  _positions_draw?: Cesium.Cartesian3[]
  _positions_show?: Cesium.Cartesian3[]
  attribute?: Record<string, unknown>
}

/**
 * 扩展面编辑类
 * 用于外部扩展使用，绘制的点与显示的点不一致的标绘
 * 子类需要重写 getShowPositions 方法
 */
export class EditPolygonEx extends EditPolygon {
  declare entity: ExtendedEntity & PolygonExEntity
  protected _hasMidPoint = false // 不显示中间点
  protected _positions_show: Cesium.Cartesian3[] | null = null // 显示的位置点

  /**
   * 修改坐标会回调，提高显示的效率
   */
  protected changePositionsToCallback(): void {
    try {
      if (!this.entity) {
        throw new Error('实体对象不存在')
      }

      this._positions_draw = this.entity._positions_draw || null
      this._positions_show = this.entity._positions_show || null

      if (!this._positions_draw) {
        console.warn('EditPolygonEx.changePositionsToCallback: _positions_draw 不存在')
      }
    } catch (error) {
      console.error('EditPolygonEx.changePositionsToCallback: 转换位置失败', error)
      throw error
    }
  }

  /**
   * 坐标位置相关
   */
  protected updateAttrForEditing(): void {
    try {
      if (!this.entity) {
        console.warn('EditPolygonEx.updateAttrForEditing: 实体对象不存在')
        return
      }

      // 验证绘制点数量
      if (
        this._positions_draw == null ||
        this._positions_draw.length < this._minPointNum
      ) {
        this._positions_show = this._positions_draw
        return
      }

      // 验证绘制点的有效性
      for (let i = 0; i < this._positions_draw.length; i++) {
        if (!(this._positions_draw[i] instanceof Cesium.Cartesian3)) {
          throw new Error(`绘制点[${i}]不是 Cesium.Cartesian3 类型`)
        }
      }

      // 获取显示位置
      const attribute = this.entity.attribute || {}
      this._positions_show = this.getShowPositions(this._positions_draw, attribute)

      // 验证显示点的有效性
      if (!this._positions_show || !Array.isArray(this._positions_show)) {
        throw new Error('getShowPositions 返回的结果无效')
      }

      for (let i = 0; i < this._positions_show.length; i++) {
        if (!(this._positions_show[i] instanceof Cesium.Cartesian3)) {
          throw new Error(`显示点[${i}]不是 Cesium.Cartesian3 类型`)
        }
      }

      this.entity._positions_show = this._positions_show || undefined
    } catch (error) {
      console.error('EditPolygonEx.updateAttrForEditing: 更新属性失败', error)
      // 更新属性失败不向上抛出，避免中断交互
    }
  }

  /**
   * 子类中重写，根据标绘绘制的点，生成显示的边界点
   * @param positions 原始绘制点
   * @param attribute 属性
   * @returns 显示点位
   */
  protected getShowPositions(
    positions: Cesium.Cartesian3[],
    _attribute: Record<string, unknown>
  ): Cesium.Cartesian3[] {
    try {
      // 验证输入参数
      if (!positions || !Array.isArray(positions)) {
        throw new Error('positions 参数必须是数组')
      }

      if (positions.length === 0) {
        console.warn('EditPolygonEx.getShowPositions: positions 数组为空')
        return positions
      }

      // 验证每个位置
      for (let i = 0; i < positions.length; i++) {
        if (!(positions[i] instanceof Cesium.Cartesian3)) {
          throw new Error(`位置[${i}]不是 Cesium.Cartesian3 类型`)
        }
      }

      // 默认实现：直接返回原始点
      // 子类应该重写此方法以实现自定义的显示点生成逻辑
      return positions
    } catch (error) {
      console.error('EditPolygonEx.getShowPositions: 获取显示位置失败', error)
      // 返回原始位置作为备选
      return positions
    }
  }

  /**
   * 获取位置数组
   * 重写以返回显示位置而不是绘制位置
   */
  getPosition(): Cesium.Cartesian3[] {
    try {
      // 如果有显示位置，返回显示位置；否则返回绘制位置
      const positions = this._positions_show || this._positions_draw

      if (!positions) {
        throw new Error('位置数组不存在')
      }

      return positions
    } catch (error) {
      console.error('EditPolygonEx.getPosition: 获取位置失败', error)
      throw error
    }
  }

  /**
   * 图形编辑结束后调用
   */
  protected finish(): void {
    try {
      if (!this.entity) {
        console.warn('EditPolygonEx.finish: 实体对象不存在')
        return
      }

      // 保存显示位置和绘制位置
      this.entity._positions_show = this._positions_show || undefined
      this.entity._positions_draw = this._positions_draw || undefined

      // 验证位置数据
      if (!this._positions_draw) {
        console.warn('EditPolygonEx.finish: _positions_draw 为空')
      }

      if (!this._positions_show) {
        console.warn('EditPolygonEx.finish: _positions_show 为空')
      }
    } catch (error) {
      console.error('EditPolygonEx.finish: 完成编辑失败', error)
      // finish 方法的错误不向上抛出，避免影响编辑结束流程
    }
  }
}
