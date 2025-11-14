import * as Cesium from 'cesium'
import { DrawPolyline } from './DrawPolyline'
import * as attr from '../attr/AttrCircle'
import { EditCircle } from '../edit/EditCircle'

/**
 * 判断是否为数字
 */
function isNumber(obj: any): boolean {
  return typeof obj === 'number' && obj.constructor === Number
}

/**
 * 圆/椭圆绘制类
 *
 * 类型说明:
 * - 圆: 需要2个点，中心点和半径点，生成圆形
 * - 椭圆: 需要3个点，中心点、长半轴点和短半轴点，生成椭圆形
 */
export class DrawCircle extends DrawPolyline {
  type = 'circle'
  // 坐标位置相关
  _minPointNum = 2 // 至少需要点的个数
  _maxPointNum = 2 // 最多允许点的个数 (圆2个,椭圆3个)

  editClass = EditCircle
  attrClass = attr

  /**
   * 获取显示位置(中心点)
   */
  getShowPosition(this: any, time?: Cesium.JulianDate): Cesium.Cartesian3 | null {
    if (this._positions_draw && this._positions_draw.length > 0) {
      return this._positions_draw[0]
    }
    return null
  }

  /**
   * 根据attribute参数创建Entity
   */
  createFeature(attribute: any): Cesium.Entity {
    this._positions_draw = []

    // 椭圆需要3个点,圆需要2个点
    if (attribute.type === 'ellipse') {
      this._maxPointNum = 3
    } else {
      this._maxPointNum = 2
    }

    const that = this
    const addattr: any = {
      position: new Cesium.CallbackProperty(() => {
        return that.getShowPosition()
      }, false),
      ellipse: attr.style2Entity(attribute.style),
      attribute: attribute
    }

    // 线：边线宽度大于1时
    addattr.polyline = {
      clampToGround: attribute.style.clampToGround,
      arcType: Cesium.ArcType.RHUMB,
      show: false
    }

    this.entity = this.dataSource!.entities.add(addattr) // 创建要素对象
    this.bindOutline(this.entity) // 绑定边线
    return this.entity
  }

  /**
   * 样式转entity
   */
  style2Entity(style: any, entity: Cesium.Entity): any {
    return attr.style2Entity(style, (entity as any).ellipse)
  }

  /**
   * 绑定边线
   */
  bindOutline(entity: Cesium.Entity): void {
    // 是否显示：边线宽度大于1时
    ;(entity as any).polyline.show = new Cesium.CallbackProperty((time: Cesium.JulianDate) => {
      return (
        (entity as any).ellipse.outline &&
        (entity as any).ellipse.outline.getValue(time) &&
        (entity as any).ellipse.outlineWidth &&
        (entity as any).ellipse.outlineWidth.getValue(time) > 1
      )
    }, false)

    ;(entity as any).polyline.positions = new Cesium.CallbackProperty((time: Cesium.JulianDate) => {
      if (!(entity as any).polyline.show.getValue(time)) return null
      return attr.getOutlinePositions(entity)
    }, false)

    ;(entity as any).polyline.width = new Cesium.CallbackProperty((time: Cesium.JulianDate) => {
      return (entity as any).ellipse.outlineWidth
    }, false)

    // Cesium 1.134+ 要求 material 必须是 MaterialProperty
    ;(entity as any).polyline.material = new Cesium.ColorMaterialProperty(
      new Cesium.CallbackProperty((time: Cesium.JulianDate) => {
        // 确保返回有效的 Color 对象
        if ((entity as any).ellipse.outlineColor) {
          const outlineColor = (entity as any).ellipse.outlineColor
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
   * 绘制过程中实时更新
   */
  updateAttrForDrawing(isLoad?: boolean): void {
    if (!this._positions_draw) return

    if (isLoad) {
      if (this._positions_draw instanceof Cesium.Cartesian3) {
        this._positions_draw = [this._positions_draw]
      }
      this.addPositionsForRadius(this._positions_draw[0])
      return
    }

    if (this._positions_draw.length < 2) return

    const style = this.entity!.attribute.style

    // 高度处理
    if (!style.clampToGround) {
      const height = this.formatNum(
        Cesium.Cartographic.fromCartesian(this._positions_draw[0]).height,
        2
      )
      ;(this.entity as any).ellipse.height = height
      style.height = height

      if (style.extrudedHeight && isNumber(style.extrudedHeight)) {
        const extrudedHeight = height + Number(style.extrudedHeight)
        ;(this.entity as any).ellipse.extrudedHeight = extrudedHeight
      }
    }

    // 半径处理
    const radius = this.formatNum(
      Cesium.Cartesian3.distance(this._positions_draw[0], this._positions_draw[1]),
      2
    )
    ;(this.entity as any).ellipse.semiMinorAxis = radius // 短半轴

    if (this._maxPointNum === 3) {
      // 椭圆 - 长半轴
      let semiMajorAxis
      if (this._positions_draw.length === 3) {
        semiMajorAxis = this.formatNum(
          Cesium.Cartesian3.distance(this._positions_draw[0], this._positions_draw[2]),
          2
        )
      } else {
        semiMajorAxis = radius
      }
      ;(this.entity as any).ellipse.semiMajorAxis = semiMajorAxis

      style.semiMinorAxis = radius
      style.semiMajorAxis = semiMajorAxis
    } else {
      // 圆
      ;(this.entity as any).ellipse.semiMajorAxis = radius
      style.radius = radius
    }
  }

  /**
   * 根据半径添加坐标点
   */
  addPositionsForRadius(position: Cesium.Cartesian3): void {
    const style = this.entity!.attribute.style

    // 获取圆（或椭圆）边线上的坐标点数组
    const outerPositions = attr.getEllipseOuterPositions({
      position: position,
      semiMajorAxis: (this.entity as any).ellipse.semiMajorAxis.getValue(
        this.viewer!.clock.currentTime
      ),
      semiMinorAxis: (this.entity as any).ellipse.semiMinorAxis.getValue(
        this.viewer!.clock.currentTime
      ),
      rotation: Cesium.Math.toRadians(Number(style.rotation || 0))
    })

    // 长半轴上的坐标点
    const majorPos = outerPositions[1]
    this._positions_draw.push(majorPos)

    if (this._maxPointNum === 3) {
      // 椭圆 - 短半轴上的坐标点
      const minorPos = outerPositions[0]
      this._positions_draw.push(minorPos)
    }
  }

  /**
   * 图形绘制结束后调用
   */
  finish(): void {
    const entity = this.entity!

    entity.editing = this.getEditClass(entity) // 绑定编辑对象

    ;(entity as any)._positions_draw = this._positions_draw
    entity.position = new Cesium.CallbackProperty(() => {
      if ((entity as any)._positions_draw && (entity as any)._positions_draw.length > 0) {
        return (entity as any)._positions_draw[0]
      }
      return null
    }, false)
  }
}
