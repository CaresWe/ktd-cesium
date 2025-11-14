import * as Cesium from 'cesium'
import { DrawPolyline } from './DrawPolyline'
import * as attr from '../attr/AttrRectangle'
import { EditRectangle } from '../edit/EditRectangle'

/**
 * 判断是否是数字
 */
function isNumber(obj: any): boolean {
  return typeof obj === 'number' && obj.constructor === Number
}

/**
 * 获取坐标数组中的最大高度
 */
function getMaxHeight(positions: Cesium.Cartesian3[]): number {
  if (!positions || positions.length === 0) return 0

  let maxHeight = 0
  for (const position of positions) {
    const cartographic = Cesium.Cartographic.fromCartesian(position)
    if (cartographic.height > maxHeight) {
      maxHeight = cartographic.height
    }
  }
  return maxHeight
}

/**
 * 矩形绘制类
 *
 * 绘制流程:
 * - 第一个点: 点击确定矩形的一个角点
 * - 第二个点: 移动鼠标确定矩形的对角点，点击完成绘制
 */
export class DrawRectangle extends DrawPolyline {
  type = 'rectangle'
  // 坐标点数
  _minPointNum = 2 // 至少需要点的个数
  _maxPointNum = 2 // 最多允许点的个数

  editClass = EditRectangle
  attrClass = attr

  /**
   * 获取矩形范围
   */
  getRectangle(this: any): Cesium.Rectangle | null {
    const positions = this.getDrawPosition()
    if (positions.length < 2) return null
    return Cesium.Rectangle.fromCartesianArray(positions)
  }

  /**
   * 根据 attribute 创建 Entity
   */
  createFeature(attribute: any): Cesium.Entity {
    this._positions_draw = []

    const that = this
    const addattr: any = {
      rectangle: attr.style2Entity(attribute.style),
      attribute: attribute
    }

    addattr.rectangle.coordinates = new Cesium.CallbackProperty(() => {
      return that.getRectangle()
    }, false)

    // 线：边线宽度大于1时
    addattr.polyline = {
      clampToGround: attribute.style.clampToGround,
      arcType: Cesium.ArcType.RHUMB,
      show: false
    }

    this.entity = this.dataSource!.entities.add(addattr) // 创建要素对象
    ;(this.entity as any)._draw_positions = this._positions_draw
    this.bindOutline(this.entity) // 边线

    return this.entity
  }

  /**
   * 样式 Entity
   */
  style2Entity(style: any, entity: Cesium.Entity): any {
    return attr.style2Entity(style, (entity as any).rectangle)
  }

  /**
   * 绑定轮廓线
   */
  bindOutline(entity: Cesium.Entity): void {
    // 是否显示：边线宽度大于1时
    ;(entity as any).polyline.show = new Cesium.CallbackProperty((time: Cesium.JulianDate) => {
      return (
        (entity as any).rectangle.outline &&
        (entity as any).rectangle.outline.getValue(time) &&
        (entity as any).rectangle.outlineWidth &&
        (entity as any).rectangle.outlineWidth.getValue(time) > 1
      )
    }, false)

    ;(entity as any).polyline.positions = new Cesium.CallbackProperty((time: Cesium.JulianDate) => {
      if (!(entity as any).polyline.show.getValue(time)) return null
      if (!(entity as any)._draw_positions) return null
      return attr.getOutlinePositions(entity)
    }, false)

    ;(entity as any).polyline.width = new Cesium.CallbackProperty((time: Cesium.JulianDate) => {
      return (entity as any).rectangle.outlineWidth
    }, false)

    // Cesium 1.134+ 要求 material 必须是 MaterialProperty
    ;(entity as any).polyline.material = new Cesium.ColorMaterialProperty(
      new Cesium.CallbackProperty((time: Cesium.JulianDate) => {
        // 确保返回有效的 Color 对象
        if ((entity as any).rectangle.outlineColor) {
          const outlineColor = (entity as any).rectangle.outlineColor
          if (typeof outlineColor.getValue === 'function') {
            return outlineColor.getValue(time) || Cesium.Color.YELLOW
          }
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
    if (!this._positions_draw) return

    const style = this.entity!.attribute.style
    if (!style.clampToGround) {
      const maxHeight = getMaxHeight(this.getDrawPosition())
      if (maxHeight !== 0) {
        ;(this.entity as any).rectangle.height = maxHeight
        style.height = maxHeight

        if (style.extrudedHeight && isNumber(style.extrudedHeight)) {
          ;(this.entity as any).rectangle.extrudedHeight = maxHeight + Number(style.extrudedHeight)
        }
      }
    }
  }

  /**
   * 完成绘制后调用
   */
  finish(): void {
    const entity = this.entity!

    entity.editing = this.getEditClass(entity) // 绑定编辑对象

    ;(entity as any)._positions_draw = this._positions_draw
    ;(entity as any).rectangle.coordinates = new Cesium.CallbackProperty(() => {
      if ((entity as any)._positions_draw.length < 2) return null
      return Cesium.Rectangle.fromCartesianArray((entity as any)._positions_draw)
    }, false)
  }
}
