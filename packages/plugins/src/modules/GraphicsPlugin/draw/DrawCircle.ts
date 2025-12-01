import * as Cesium from 'cesium'
import { isNumber } from '@auto-cesium/shared'
import { DrawPolyline } from './DrawPolyline'
import type { AttrClass, EditClassConstructor, CircleDrawAttribute, CircleExtendedEntity } from '../types'
import * as attr from '../attr/AttrCircle'
import { EditCircle } from '../edit/EditCircle'
import type { EditBase } from '../edit/EditBase'
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
  override _minPointNum = 2 // 至少需要点的个数
  override _maxPointNum = 2 // 最多允许点的个数 (圆2个,椭圆3个)

  override editClass = EditCircle as EditClassConstructor
  override attrClass = attr as AttrClass

  /**
   * 获取显示位置(中心点)
   */
  getShowPosition(_time?: Cesium.JulianDate): Cesium.Cartesian3 | null {
    const positions = this._positions_draw as Cesium.Cartesian3[] | null
    if (positions && positions.length > 0) {
      return positions[0]
    }
    return null
  }

  /**
   * 根据attribute参数创建Entity
   */
  override createFeature(attribute: Record<string, unknown>): Cesium.Entity {
    this._positions_draw = []

    const circleAttr = attribute as CircleDrawAttribute

    // 椭圆需要3个点,圆需要2个点
    if (circleAttr.type === 'ellipse') {
      this._maxPointNum = 3
    } else {
      this._maxPointNum = 2
    }

    const addattr: Cesium.Entity.ConstructorOptions & { attribute: CircleDrawAttribute } = {
      position: new Cesium.CallbackProperty(() => {
        return this.getShowPosition()
      }, false) as unknown as Cesium.PositionProperty,
      ellipse: attr.style2Entity(circleAttr.style),
      attribute: circleAttr
    }

    // 线：边线宽度大于1时
    addattr.polyline = {
      clampToGround: circleAttr.style.clampToGround,
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
  protected override style2Entity(
    style: Record<string, unknown>,
    entity: Cesium.Entity
  ): Cesium.EllipseGraphics.ConstructorOptions {
    const extEntity = entity as CircleExtendedEntity
    return attr.style2Entity(style, extEntity.ellipse)
  }

  /**
   * 绑定边线
   */
  bindOutline(entity: Cesium.Entity): void {
    const extEntity = entity as CircleExtendedEntity

    if (!extEntity.polyline || !extEntity.ellipse) {
      return
    }

    // 是否显示：边线宽度大于1时
    extEntity.polyline.show = new Cesium.CallbackProperty((time?: Cesium.JulianDate) => {
      if (!extEntity.ellipse) return false

      const outline = extEntity.ellipse.outline
      const outlineValue = outline && typeof outline.getValue === 'function' ? outline.getValue(time) : outline

      const outlineWidth = extEntity.ellipse.outlineWidth
      const widthValue =
        outlineWidth && typeof outlineWidth.getValue === 'function' ? outlineWidth.getValue(time) : outlineWidth

      return Boolean(outlineValue && widthValue && Number(widthValue) > 1)
    }, false)

    extEntity.polyline.positions = new Cesium.CallbackProperty((time?: Cesium.JulianDate) => {
      if (!extEntity.polyline) return null

      const show = extEntity.polyline.show
      const showValue = show && typeof show.getValue === 'function' ? show.getValue(time) : show

      if (!showValue) return null
      return attr.getOutlinePositions(entity)
    }, false) as unknown as Cesium.PositionProperty

    extEntity.polyline.width = new Cesium.CallbackProperty((_time?: Cesium.JulianDate) => {
      return extEntity.ellipse?.outlineWidth
    }, false) as unknown as Cesium.Property

    // Cesium 1.134+ 要求 material 必须是 MaterialProperty
    extEntity.polyline.material = new Cesium.ColorMaterialProperty(
      new Cesium.CallbackProperty((time?: Cesium.JulianDate) => {
        // 确保返回有效的 Color 对象
        if (extEntity.ellipse?.outlineColor) {
          const outlineColor = extEntity.ellipse.outlineColor
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
  override updateAttrForDrawing(isLoad?: boolean): void {
    const positions = this._positions_draw as Cesium.Cartesian3[] | null
    if (!positions) return

    const extEntity = this.entity as CircleExtendedEntity | null
    if (!extEntity || !extEntity.attribute) return

    if (isLoad) {
      if (this._positions_draw instanceof Cesium.Cartesian3) {
        this._positions_draw = [this._positions_draw]
      }
      this.addPositionsForRadius((this._positions_draw as Cesium.Cartesian3[])[0])
      return
    }

    if (positions.length < 2) return

    const style = extEntity.attribute.style

    // 高度处理
    if (!style.clampToGround && extEntity.ellipse) {
      const height = this.formatNum(Cesium.Cartographic.fromCartesian(positions[0]).height, 2)
      extEntity.ellipse.height = new Cesium.ConstantProperty(height)
      style.height = height

      if (style.extrudedHeight && isNumber(style.extrudedHeight)) {
        const extrudedHeight = height + Number(style.extrudedHeight)
        extEntity.ellipse.extrudedHeight = new Cesium.ConstantProperty(extrudedHeight)
      }
    }

    // 半径处理
    const radius = this.formatNum(Cesium.Cartesian3.distance(positions[0], positions[1]), 2)

    if (extEntity.ellipse) {
      extEntity.ellipse.semiMinorAxis = new Cesium.ConstantProperty(radius) // 短半轴

      if (this._maxPointNum === 3) {
        // 椭圆 - 长半轴
        let semiMajorAxis
        if (positions.length === 3) {
          semiMajorAxis = this.formatNum(Cesium.Cartesian3.distance(positions[0], positions[2]), 2)
        } else {
          semiMajorAxis = radius
        }
        extEntity.ellipse.semiMajorAxis = new Cesium.ConstantProperty(semiMajorAxis)

        style.semiMinorAxis = radius
        style.semiMajorAxis = semiMajorAxis
      } else {
        // 圆
        extEntity.ellipse.semiMajorAxis = new Cesium.ConstantProperty(radius)
        style.radius = radius
      }
    }
  }

  /**
   * 根据半径添加坐标点
   */
  addPositionsForRadius(position: Cesium.Cartesian3): void {
    const extEntity = this.entity as CircleExtendedEntity | null
    if (!extEntity || !extEntity.attribute || !extEntity.ellipse) return

    const style = extEntity.attribute.style

    // 获取圆（或椭圆）边线上的坐标点数组
    const semiMajorAxisProp = extEntity.ellipse.semiMajorAxis
    const semiMinorAxisProp = extEntity.ellipse.semiMinorAxis

    const semiMajorAxis =
      semiMajorAxisProp && typeof semiMajorAxisProp.getValue === 'function'
        ? semiMajorAxisProp.getValue(this.viewer!.clock.currentTime)
        : semiMajorAxisProp

    const semiMinorAxis =
      semiMinorAxisProp && typeof semiMinorAxisProp.getValue === 'function'
        ? semiMinorAxisProp.getValue(this.viewer!.clock.currentTime)
        : semiMinorAxisProp

    if (!semiMajorAxis || !semiMinorAxis) return

    const outerPositions = attr.getEllipseOuterPositions({
      position: position,
      semiMajorAxis: Number(semiMajorAxis),
      semiMinorAxis: Number(semiMinorAxis),
      rotation: Cesium.Math.toRadians(Number(style.rotation || 0))
    })

    // 长半轴上的坐标点
    const majorPos = outerPositions[1]
    const positions = this._positions_draw as Cesium.Cartesian3[]
    positions.push(majorPos)

    if (this._maxPointNum === 3) {
      // 椭圆 - 短半轴上的坐标点
      const minorPos = outerPositions[0]
      positions.push(minorPos)
    }
  }

  /**
   * 图形绘制结束后调用
   */
  override finish(): void {
    const entity = this.entity as CircleExtendedEntity | null
    if (!entity) return

    entity.editing = this.getEditClass(entity as Cesium.Entity) as EditBase // 绑定编辑对象

    entity._positions_draw = this._positions_draw as Cesium.Cartesian3[]
    entity.position = new Cesium.CallbackProperty(() => {
      if (entity._positions_draw && entity._positions_draw.length > 0) {
        return entity._positions_draw[0]
      }
      return null
    }, false) as unknown as Cesium.PositionProperty
  }
}
