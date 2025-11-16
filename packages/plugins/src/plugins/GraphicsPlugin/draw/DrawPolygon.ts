import * as Cesium from 'cesium'
import { DrawPolyline } from './DrawPolyline'
import { getMaxHeight, isNumber } from '@ktd-cesium/shared'
import * as attr from '../attr/AttrPolygon'
import { EditPolygon } from '../edit/EditPolygon'

/**
 * 多边形样式接口
 */
interface PolygonStyle {
  clampToGround?: boolean
  extrudedHeight?: number
  outline?: boolean
  outlineWidth?: number
  outlineColor?: string
  [key: string]: unknown
}

/**
 * 多边形配置接口
 */
interface PolygonConfig {
  minPointNum?: number
  maxPointNum?: number
}

/**
 * 多边形属性接口
 */
interface PolygonAttribute {
  style: PolygonStyle
  config?: PolygonConfig
  [key: string]: unknown
}

/**
 * 扩展的 Entity 类型（支持编辑和属性）
 */
interface ExtendedEntity extends Cesium.Entity {
  attribute: PolygonAttribute
  editing?: unknown
  _positions_draw?: Cesium.Cartesian3[]
}

/**
 * 多边形绘制类
 */
export class DrawPolygon extends DrawPolyline {
  type = 'polygon'
  // 坐标位置相关
  _minPointNum = 3 // 至少需要点的个数
  _maxPointNum = 9999 // 最多允许点的个数

  editClass = EditPolygon
  attrClass = attr

  /**
   * 根据 attribute 参数创建 Entity
   */
  createFeature(attribute: Record<string, unknown>): Cesium.Entity {
    this._positions_draw = []

    const polygonAttr = attribute as PolygonAttribute
    if (!polygonAttr.style) {
      throw new Error('DrawPolygon.createFeature: attribute.style 不能为空')
    }

    if (!this._minPointNum_def) this._minPointNum_def = this._minPointNum
    if (!this._maxPointNum_def) this._maxPointNum_def = this._maxPointNum

    if (polygonAttr.config) {
      // 允许外部传入
      this._minPointNum = polygonAttr.config.minPointNum || this._minPointNum_def
      this._maxPointNum = polygonAttr.config.maxPointNum || this._maxPointNum_def
    } else {
      this._minPointNum = this._minPointNum_def
      this._maxPointNum = this._maxPointNum_def
    }

    try {
      const addattr: Cesium.Entity.ConstructorOptions & { attribute: Record<string, unknown> } = {
        polygon: attr.style2Entity(polygonAttr.style),
        attribute: attribute
      }

      addattr.polygon!.hierarchy = new Cesium.CallbackProperty(() => {
        const positions = this.getDrawPosition()
        if (!positions) return new Cesium.PolygonHierarchy([])
        return new Cesium.PolygonHierarchy(positions as Cesium.Cartesian3[])
      }, false) as unknown as Cesium.PolygonHierarchy

      // 线：绘制时前2点时 + 边线宽度大于1时
      addattr.polyline = {
        clampToGround: polygonAttr.style.clampToGround,
        show: false
      } as Cesium.PolylineGraphics.ConstructorOptions

      this.entity = this.dataSource!.entities.add(addattr) // 创建要素对象

      this.bindOutline(this.entity) // 边线

      return this.entity
    } catch (error) {
      console.error('DrawPolygon.createFeature: 创建实体失败', error)
      throw error
    }
  }

  /**
   * 样式转 entity
   */
  protected style2Entity(style: Record<string, unknown>, entity: Cesium.Entity): void {
    if (!entity.polygon) {
      console.warn('DrawPolygon.style2Entity: polygon 不存在')
      return
    }
    try {
      attr.style2Entity(style, entity.polygon as unknown as attr.PolygonEntityAttr)
    } catch (error) {
      console.error('DrawPolygon.style2Entity: 转换样式失败', error)
    }
  }

  /**
   * 绑定边线
   */
  bindOutline(entity: Cesium.Entity): void {
    if (!entity.polyline || !entity.polygon) {
      console.warn('DrawPolygon.bindOutline: polyline 或 polygon 不存在')
      return
    }

    const extEntity = entity as ExtendedEntity

    // 是否显示：绘制时前2点时 或 边线宽度大于1时
    entity.polyline.show = new Cesium.CallbackProperty((time: Cesium.JulianDate) => {
      try {
        const arr = attr.getPositions(extEntity, true)
        if (arr && arr.length < 3) return true

        return (
          entity.polygon!.outline &&
          entity.polygon!.outline.getValue(time) &&
          entity.polygon!.outlineWidth &&
          entity.polygon!.outlineWidth.getValue(time) > 1
        )
      } catch (error) {
        console.warn('DrawPolygon.bindOutline: 获取 show 属性失败', error)
        return false
      }
    }, false) as unknown as boolean

    entity.polyline.positions = new Cesium.CallbackProperty((time: Cesium.JulianDate) => {
      try {
        if (!entity.polyline!.show!.getValue(time)) return null

        const arr = attr.getPositions(extEntity, true)
        if (!arr) return null
        if (arr.length < 3) return arr

        return arr.concat([arr[0]])
      } catch (error) {
        console.warn('DrawPolygon.bindOutline: 获取 positions 失败', error)
        return null
      }
    }, false) as unknown as Cesium.PositionProperty

    entity.polyline.width = new Cesium.CallbackProperty((time: Cesium.JulianDate) => {
      try {
        const arr = attr.getPositions(extEntity, true)
        if (arr && arr.length < 3) return 2

        return entity.polygon!.outlineWidth
      } catch (error) {
        console.warn('DrawPolygon.bindOutline: 获取 width 失败', error)
        return 2
      }
    }, false) as unknown as number

    // Cesium 1.134+ 要求 material 必须是 MaterialProperty，不能是返回 Color 的 CallbackProperty
    entity.polyline.material = new Cesium.ColorMaterialProperty(
      new Cesium.CallbackProperty((time: Cesium.JulianDate) => {
        try {
          const arr = attr.getPositions(extEntity, true)
          if (arr && arr.length < 3) {
            // 获取多边形的颜色
            if (entity.polygon!.material) {
              // 如果是 ColorMaterialProperty，获取其 color 值
              const polygonMaterial = entity.polygon!.material as Cesium.ColorMaterialProperty
              if ('color' in polygonMaterial && polygonMaterial.color) {
                const colorProp = polygonMaterial.color
                if (typeof (colorProp as Cesium.Property).getValue === 'function') {
                  const color = (colorProp as Cesium.Property).getValue(time) as Cesium.Color
                  if (color) return color
                }
                return colorProp as Cesium.Color
              }
              // 如果 material 本身是其他类型的 MaterialProperty，尝试获取 color
              if (typeof (polygonMaterial as Cesium.MaterialProperty).getValue === 'function') {
                const matValue = (polygonMaterial as Cesium.MaterialProperty).getValue(time)
                if (matValue && 'color' in matValue && matValue.color) {
                  return matValue.color as Cesium.Color
                }
              }
            }
            return Cesium.Color.YELLOW
          }
          // 获取轮廓颜色，确保返回有效的 Color 对象
          if (entity.polygon!.outlineColor) {
            const outlineColor = entity.polygon!.outlineColor
            if (typeof (outlineColor as Cesium.Property).getValue === 'function') {
              const color = (outlineColor as Cesium.Property).getValue(time) as Cesium.Color
              return color || Cesium.Color.YELLOW
            }
            // 如果 outlineColor 本身就是 Color 对象
            if (outlineColor instanceof Cesium.Color) {
              return outlineColor
            }
          }
          return Cesium.Color.YELLOW
        } catch (error) {
          console.warn('DrawPolygon.bindOutline: 获取 material 颜色失败', error)
          return Cesium.Color.YELLOW
        }
      }, false) as unknown as Cesium.Color
    )
  }

  /**
   * 更新绘制属性
   */
  updateAttrForDrawing(): void {
    if (!this.entity) return

    const extEntity = this.entity as ExtendedEntity
    if (!extEntity.attribute || !extEntity.attribute.style) return

    const style = extEntity.attribute.style
    if (style.extrudedHeight && isNumber(style.extrudedHeight)) {
      try {
        // 存在 extrudedHeight 高度设置时
        const positions = this.getDrawPosition() as Cesium.Cartesian3[]
        if (!positions || positions.length === 0) return

        const maxHight = getMaxHeight(positions)
        if (this.entity.polygon) {
          this.entity.polygon.extrudedHeight = maxHight + Number(style.extrudedHeight)
        }
      } catch (error) {
        console.warn('DrawPolygon.updateAttrForDrawing: 更新高度失败', error)
      }
    }
  }

  /**
   * 图形绘制结束后调用
   */
  finish(): void {
    if (!this.entity) {
      console.warn('DrawPolygon.finish: entity 不存在')
      return
    }

    const entity = this.entity
    const extEntity = entity as ExtendedEntity

    try {
      extEntity.editing = this.getEditClass(entity) // 绑定编辑对象

      const positions = this.getDrawPosition() as Cesium.Cartesian3[]
      if (!positions || positions.length === 0) {
        console.warn('DrawPolygon.finish: positions 为空')
        return
      }

      extEntity._positions_draw = positions

      if (entity.polygon) {
        entity.polygon.hierarchy = new Cesium.CallbackProperty(() => {
          const pos = extEntity._positions_draw
          if (!pos || pos.length === 0) return new Cesium.PolygonHierarchy([])
          return new Cesium.PolygonHierarchy(pos)
        }, false) as unknown as Cesium.PolygonHierarchy
      }
    } catch (error) {
      console.error('DrawPolygon.finish: 完成绘制失败', error)
    }
  }
}
