import * as Cesium from 'cesium'
import { EditPolyline } from './EditPolyline'
import type { ExtendedEntity } from './EditBase'
import type { PolygonEditEntity } from '../types'

/**
 * 多边形编辑类
 * 继承自 EditPolyline，主要区别是 hasClosure=true（闭合）
 */
export class EditPolygon extends EditPolyline {
  declare entity: ExtendedEntity & PolygonEditEntity
  protected hasClosure = true // 是否闭合

  /**
   * 获取图形对象
   * 子类可以重写此方法返回更具体的类型
   */
  getGraphic(): Cesium.PolygonGraphics | Cesium.EllipseGraphics | Cesium.CylinderGraphics | Cesium.RectangleGraphics {
    try {
      if (!this.entity) {
        throw new Error('实体对象不存在')
      }

      if (!this.entity.polygon) {
        throw new Error('实体的 polygon 属性不存在')
      }

      return this.entity.polygon
    } catch (error) {
      console.error('EditPolygon.getGraphic: 获取图形对象失败', error)
      throw error
    }
  }

  /**
   * 是否贴地
   * Polygon 特殊处理：如果未设置 clampToGround，则根据 perPositionHeight 判断
   */
  isClampToGround(): boolean {
    try {
      const style = this.entity.attribute?.style
      if (!style || typeof style !== 'object') {
        return false
      }

      // 如果显式设置了 clampToGround，使用该值
      if ('clampToGround' in style && style.clampToGround !== undefined) {
        return style.clampToGround as boolean
      }

      // 否则，根据 perPositionHeight 判断
      // perPositionHeight = false 表示贴地，perPositionHeight = true 表示每个顶点独立高度
      if ('perPositionHeight' in style && style.perPositionHeight !== undefined) {
        return !(style.perPositionHeight as boolean)
      }

      return false
    } catch (error) {
      console.error('EditPolygon.isClampToGround: 获取贴地状态失败', error)
      return false
    }
  }

  /**
   * 更新编辑属性
   */
  updateAttrForEditing(): void {
    try {
      if (!this.entity) {
        console.warn('EditPolygon.updateAttrForEditing: 实体对象不存在')
        return
      }

      // 注意: 对于 polygon，直接设置 hierarchy
      if (
        this.entity.attribute?.type === 'polygon' &&
        this.entity.polygon &&
        Cesium.defined(this.entity.polygon.hierarchy)
      ) {
        // 对于 polygon，需要设置 hierarchy
        const positions = this.getPosition()
        this.entity.polygon.hierarchy = new Cesium.ConstantProperty(
          new Cesium.PolygonHierarchy(positions)
        )
      }
    } catch (error) {
      console.error('EditPolygon.updateAttrForEditing: 更新属性失败', error)
      // 更新属性失败不向上抛出，避免中断交互
    }
  }

  /**
   * 图形编辑结束后调用
   */
  protected finish(): void {
    try {
      if (!this.entity) {
        console.warn('EditPolygon.finish: 实体对象不存在')
        return
      }

      this.entity._positions_draw = this.getPosition()

      if (this.entity.attribute?.type === 'polygon' && this.entity.polygon) {
        // 对于 polygon，使用 CallbackProperty 以便动态更新
        this.entity.polygon.hierarchy = new Cesium.CallbackProperty(() => {
          return new Cesium.PolygonHierarchy(this.entity._positions_draw || [])
        }, false)
      }
    } catch (error) {
      console.error('EditPolygon.finish: 完成编辑失败', error)
      // finish 方法的错误不向上抛出，避免影响编辑结束流程
    }
  }

  /**
   * 将位置转换为回调函数
   */
  protected changePositionsToCallback(): void {
    try {
      if (!this.entity) {
        throw new Error('实体对象不存在')
      }

      this._positions_draw = this.entity._positions_draw || null

      if (!this._positions_draw) {
        const graphic = this.getGraphic()

        // 类型检查：确保是 PolygonGraphics（有 hierarchy 属性）
        if (!('hierarchy' in graphic)) {
          throw new Error('图形对象不是 PolygonGraphics 类型')
        }

        const hierarchy = graphic.hierarchy

        if (!hierarchy) {
          throw new Error('无法获取 polygon 的 hierarchy 属性')
        }

        // 获取 hierarchy 的值
        let hierarchyValue: Cesium.PolygonHierarchy | Cesium.Cartesian3[] | undefined

        if (hierarchy && typeof hierarchy === 'object' && 'getValue' in hierarchy) {
          // hierarchy 是 Property 类型
          hierarchyValue = (hierarchy as Cesium.Property).getValue(
            this.viewer.clock.currentTime
          ) as Cesium.PolygonHierarchy
        } else {
          // hierarchy 是直接的 PolygonHierarchy 对象
          hierarchyValue = hierarchy as unknown as Cesium.PolygonHierarchy
        }

        if (!hierarchyValue) {
          throw new Error('无法获取 hierarchy 的值')
        }

        // 提取位置数组
        if (hierarchyValue && typeof hierarchyValue === 'object' && 'positions' in hierarchyValue) {
          // hierarchyValue 是 PolygonHierarchy 对象
          this._positions_draw = (hierarchyValue as Cesium.PolygonHierarchy).positions
        } else if (Array.isArray(hierarchyValue)) {
          // hierarchyValue 是位置数组
          this._positions_draw = hierarchyValue as Cesium.Cartesian3[]
        } else {
          throw new Error('hierarchy 值的格式无效')
        }

        if (!this._positions_draw || this._positions_draw.length === 0) {
          throw new Error('位置数组为空')
        }

        // 验证位置数组
        for (let i = 0; i < this._positions_draw.length; i++) {
          if (!(this._positions_draw[i] instanceof Cesium.Cartesian3)) {
            throw new Error(`位置[${i}]不是 Cesium.Cartesian3 类型`)
          }
        }
      }
    } catch (error) {
      console.error('EditPolygon.changePositionsToCallback: 转换位置失败', error)
      throw error
    }
  }
}
