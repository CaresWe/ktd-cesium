import * as Cesium from 'cesium'
import { DrawPPolyline } from './DrawPPolyline'
import { getCurrentMousePosition } from '@auto-cesium/shared'
import { defaultMessages } from '../../TooltipPlugin/messages'
import { GraphicsEventType } from '../../EventPlugin'
import type { RectanglePrimitiveAttribute } from '../types'

/**
 * Primitive 方式的矩形绘制类
 * 使用 GroundPrimitive，将矩形转换为多边形
 *
 * 性能对比：
 * - Entity 方式：适合 < 50 个矩形
 * - Primitive 方式：适合 > 50 个矩形，性能提升显著
 */
export class DrawPRectangle extends DrawPPolyline {
  override type = 'rectangle-p'

  // 坐标位置相关
  protected override _minPointNum = 2 // 对角两个点
  protected override _maxPointNum = 2

  /** 当前绘制的 GroundPrimitive */
  private currentGroundPrimitive: Cesium.GroundPrimitive | null = null

  /** 矩形的两个对角点 */
  private corner1: Cesium.Cartesian3 | null = null
  private corner2: Cesium.Cartesian3 | null = null

  /**
   * 创建 GroundPrimitive
   */
  protected override createPrimitive(attribute: Record<string, unknown>): Cesium.GroundPrimitive | null {
    this._positions_draw = []
    this.corner1 = null
    this.corner2 = null

    const rectangleAttr = attribute as RectanglePrimitiveAttribute

    // 创建 GroundPrimitive
    const style = rectangleAttr.style
    const geometryInstance = new Cesium.GeometryInstance({
      geometry: new Cesium.PolygonGeometry({
        polygonHierarchy: new Cesium.PolygonHierarchy([]),
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
      }),
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
          this.parseColor(style.color) || Cesium.Color.YELLOW.withAlpha(0.5)
        )
      }
    })

    this.currentGroundPrimitive = new Cesium.GroundPrimitive({
      geometryInstances: geometryInstance,
      appearance: new Cesium.PerInstanceColorAppearance({
        closed: false
      }),
      show: style.show !== undefined ? style.show : true,
      classificationType: style.classificationType || Cesium.ClassificationType.BOTH
    })

    // 保存配置
    ;(this.currentGroundPrimitive as unknown as Record<string, unknown>).attribute = rectangleAttr

    this.primitives!.add(this.currentGroundPrimitive)
    this.primitive = this.currentGroundPrimitive

    return this.currentGroundPrimitive
  }

  /**
   * 根据两个对角点生成矩形的四个顶点
   */
  private generateRectanglePositions(corner1: Cesium.Cartesian3, corner2: Cesium.Cartesian3): Cesium.Cartesian3[] {
    const carto1 = Cesium.Cartographic.fromCartesian(corner1)
    const carto2 = Cesium.Cartographic.fromCartesian(corner2)

    const west = Math.min(carto1.longitude, carto2.longitude)
    const east = Math.max(carto1.longitude, carto2.longitude)
    const south = Math.min(carto1.latitude, carto2.latitude)
    const north = Math.max(carto1.latitude, carto2.latitude)
    const height = Math.max(carto1.height, carto2.height)

    return [
      Cesium.Cartesian3.fromRadians(west, south, height),
      Cesium.Cartesian3.fromRadians(east, south, height),
      Cesium.Cartesian3.fromRadians(east, north, height),
      Cesium.Cartesian3.fromRadians(west, north, height)
    ]
  }

  /**
   * 更新矩形几何体
   */
  private updateRectangleGeometry(): void {
    if (!this.currentGroundPrimitive || !this.corner1 || !this.corner2) return

    const positions = this._positions_draw as Cesium.Cartesian3[]
    if (positions.length < 2) return

    // 移除旧的 Primitive
    if (this.primitives!.contains(this.currentGroundPrimitive)) {
      this.primitives!.remove(this.currentGroundPrimitive)
    }

    // 生成矩形四个顶点
    const rectanglePositions = this.generateRectanglePositions(this.corner1, this.corner2)

    // 保存当前状态
    const oldShow = this.currentGroundPrimitive.show
    const oldClassificationType = this.currentGroundPrimitive.classificationType
    const attr = (this.currentGroundPrimitive as unknown as Record<string, unknown>).attribute

    // 创建新的几何体
    const geometryInstance = new Cesium.GeometryInstance({
      geometry: new Cesium.PolygonGeometry({
        polygonHierarchy: new Cesium.PolygonHierarchy(rectanglePositions),
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
      }),
      attributes: ((this.currentGroundPrimitive as unknown as Record<string, unknown>)._instanceAttributes as Record<
        string,
        unknown
      >) || {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.YELLOW.withAlpha(0.5))
      }
    })

    this.currentGroundPrimitive = new Cesium.GroundPrimitive({
      geometryInstances: geometryInstance,
      appearance: new Cesium.PerInstanceColorAppearance({
        closed: false
      }),
      show: oldShow,
      classificationType: oldClassificationType
    })

    // 保留配置
    ;(this.currentGroundPrimitive as unknown as Record<string, unknown>).attribute = attr

    this.primitives!.add(this.currentGroundPrimitive)
    this.primitive = this.currentGroundPrimitive
  }

  /**
   * 绑定鼠标事件（支持PC端和移动端）
   */
  override bindEvent(): void {
    let lastPointTemporary = false
    const positions = this._positions_draw as Cesium.Cartesian3[]

    // 左键点击或触摸添加点
    this.bindClickEvent((position: Cesium.Cartesian2) => {
      let point = getCurrentMousePosition(this.viewer!.scene, position, null)
      if (!point && lastPointTemporary) {
        point = positions[positions.length - 1]
      }

      if (point) {
        if (lastPointTemporary) {
          positions.pop()
        }
        lastPointTemporary = false

        positions.push(point)

        if (positions.length === 1) {
          // 第一个点：第一个角点
          this.corner1 = point
        } else if (positions.length === 2) {
          // 第二个点：对角点
          this.corner2 = point
          this.updateRectangleGeometry()
          this.disable()
        }

        this.fire(GraphicsEventType.DRAW_ADD_POINT, {
          drawtype: this.type,
          primitive: this.currentGroundPrimitive,
          position: point,
          positions: positions
        })
      }
    })

    // 鼠标移动或触摸移动
    this.bindMoveEvent((position: Cesium.Cartesian2) => {
      // 显示提示信息
      if (positions.length === 0) {
        this.tooltip!.showAt(position, defaultMessages.draw.rectangle.start)
      } else {
        this.tooltip!.showAt(position, defaultMessages.draw.rectangle.end)
      }

      const point = getCurrentMousePosition(this.viewer!.scene, position, null)
      if (point) {
        if (positions.length === 1) {
          // 已有第一个角点，动态显示矩形
          if (lastPointTemporary) {
            positions.pop()
          }
          lastPointTemporary = true

          positions.push(point)
          this.corner2 = point
          this.updateRectangleGeometry()

          this.fire(GraphicsEventType.DRAW_MOUSE_MOVE, {
            drawtype: this.type,
            primitive: this.currentGroundPrimitive,
            position: point,
            positions: positions
          })
        }
      }
    })
  }

  /**
   * Primitive 绘制结束
   */
  protected override finishPrimitive(): void {
    if (!this.currentGroundPrimitive) return

    // 保存最终位置
    const primitiveObj = this.currentGroundPrimitive as unknown as Record<string, unknown>
    primitiveObj._positions_draw = this.getDrawPosition()
    primitiveObj.corner1 = this.corner1
    primitiveObj.corner2 = this.corner2

    // 绑定编辑对象
    // primitiveObj.editing = this.getEditClass(this.currentGroundPrimitive as unknown as Cesium.Entity)
  }

  /**
   * 清理资源
   */
  override disable(hasWB?: boolean): this {
    super.disable(hasWB)

    // 如果是中断绘制，清理矩形
    if (hasWB && this.currentGroundPrimitive && this.primitives) {
      if (this.primitives.contains(this.currentGroundPrimitive)) {
        this.primitives.remove(this.currentGroundPrimitive)
      }
    }

    this.currentGroundPrimitive = null
    this.corner1 = null
    this.corner2 = null
    return this
  }
}
