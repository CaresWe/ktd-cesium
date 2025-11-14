import * as Cesium from 'cesium'
import { DrawPolyline } from './DrawPolyline'
import * as attr from '../attr/AttrPolygon'
import { EditPolygon } from '../edit/EditPolygon'

/**
 * 获取最大高度
 */
function getMaxHeight(positions: Cesium.Cartesian3[]): number {
  let maxHeight = 0
  if (!positions || positions.length === 0) return maxHeight

  for (let i = 0; i < positions.length; i++) {
    const tempCarto = Cesium.Cartographic.fromCartesian(positions[i])
    if (tempCarto.height > maxHeight) {
      maxHeight = tempCarto.height
    }
  }
  return Number(maxHeight.toFixed(2))
}

/**
 * 检查是否是数字
 */
function isNumber(obj: any): boolean {
  return typeof obj === 'number' && obj.constructor === Number
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
  createFeature(attribute: any): Cesium.Entity {
    this._positions_draw = []

    if (!this._minPointNum_def) this._minPointNum_def = this._minPointNum
    if (!this._maxPointNum_def) this._maxPointNum_def = this._maxPointNum

    if (attribute.config) {
      // 允许外部传入
      this._minPointNum = attribute.config.minPointNum || this._minPointNum_def
      this._maxPointNum = attribute.config.maxPointNum || this._maxPointNum_def
    } else {
      this._minPointNum = this._minPointNum_def
      this._maxPointNum = this._maxPointNum_def
    }

    const addattr: any = {
      polygon: attr.style2Entity(attribute.style),
      attribute: attribute
    }

    addattr.polygon.hierarchy = new Cesium.CallbackProperty(() => {
      const positions = this.getDrawPosition()
      return new Cesium.PolygonHierarchy(positions)
    }, false)

    // 线：绘制时前2点时 + 边线宽度大于1时
    addattr.polyline = {
      clampToGround: attribute.style.clampToGround,
      show: false
    }

    this.entity = this.dataSource!.entities.add(addattr) // 创建要素对象

    this.bindOutline(this.entity) // 边线

    return this.entity
  }

  /**
   * 样式转 entity
   */
  style2Entity(style: any, entity: Cesium.Entity): any {
    return attr.style2Entity(style, entity.polygon)
  }

  /**
   * 绑定边线
   */
  bindOutline(entity: Cesium.Entity): void {
    // 是否显示：绘制时前2点时 或 边线宽度大于1时
    entity.polyline!.show = new Cesium.CallbackProperty((time: Cesium.JulianDate) => {
      const arr = attr.getPositions(entity as any, true)
      if (arr && arr.length < 3) return true

      return (
        entity.polygon!.outline &&
        entity.polygon!.outline.getValue(time) &&
        entity.polygon!.outlineWidth &&
        entity.polygon!.outlineWidth.getValue(time) > 1
      )
    }, false)

    entity.polyline!.positions = new Cesium.CallbackProperty((time: Cesium.JulianDate) => {
      if (!entity.polyline!.show!.getValue(time)) return null

      const arr = attr.getPositions(entity as any, true)
      if (arr && arr.length < 3) return arr

      return arr.concat([arr[0]])
    }, false)

    entity.polyline!.width = new Cesium.CallbackProperty((time: Cesium.JulianDate) => {
      const arr = attr.getPositions(entity as any, true)
      if (arr && arr.length < 3) return 2

      return entity.polygon!.outlineWidth
    }, false)

    // Cesium 1.134+ 要求 material 必须是 MaterialProperty，不能是返回 Color 的 CallbackProperty
    entity.polyline!.material = new Cesium.ColorMaterialProperty(
      new Cesium.CallbackProperty((time: Cesium.JulianDate) => {
        const arr = attr.getPositions(entity as any, true)
        if (arr && arr.length < 3) {
          // 获取多边形的颜色
          if (entity.polygon!.material) {
            // 如果是 ColorMaterialProperty，获取其 color 值
            const polygonMaterial = entity.polygon!.material as any
            if (polygonMaterial.color) {
              const colorProp = polygonMaterial.color
              if (typeof colorProp.getValue === 'function') {
                return colorProp.getValue(time)
              }
              return colorProp
            }
            // 如果 material 本身是其他类型的 MaterialProperty，尝试获取 color
            if (typeof polygonMaterial.getValue === 'function') {
              const matValue = polygonMaterial.getValue(time)
              if (matValue && matValue.color) {
                return matValue.color
              }
            }
          }
          return Cesium.Color.YELLOW
        }
        // 获取轮廓颜色，确保返回有效的 Color 对象
        if (entity.polygon!.outlineColor) {
          const outlineColor = entity.polygon!.outlineColor as any
          if (typeof outlineColor.getValue === 'function') {
            return outlineColor.getValue(time) || Cesium.Color.YELLOW
          }
          // 如果 outlineColor 本身就是 Color 对象
          if (outlineColor instanceof Cesium.Color) {
            return outlineColor
          }
        }
        return Cesium.Color.YELLOW
      }, false)
    )
  }

  /**
   * 更新绘制属性
   */
  updateAttrForDrawing(): void {
    const style = this.entity!.attribute.style
    if (style.extrudedHeight && isNumber(style.extrudedHeight)) {
      // 存在 extrudedHeight 高度设置时
      const maxHight = getMaxHeight(this.getDrawPosition())
      this.entity!.polygon!.extrudedHeight = maxHight + Number(style.extrudedHeight)
    }
  }

  /**
   * 图形绘制结束后调用
   */
  finish(): void {
    const entity = this.entity!

    entity.editing = this.getEditClass(entity) // 绑定编辑对象

    ;(entity as any)._positions_draw = this.getDrawPosition()
    entity.polygon!.hierarchy = new Cesium.CallbackProperty(() => {
      const positions = (entity as any)._positions_draw
      return new Cesium.PolygonHierarchy(positions)
    }, false)
  }
}
