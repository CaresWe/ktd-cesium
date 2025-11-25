import * as Cesium from 'cesium'
import { DrawPPoint } from './DrawPPoint'
import { getCurrentMousePosition } from '@ktd-cesium/shared'
import { defaultMessages } from '../../TooltipPlugin/messages'
import { GraphicsEventType } from '../../EventPlugin'
import type {  PlanePrimitiveAttribute } from '../types'

/**
 * Primitive 方式的平面绘制类
 * 使用 Primitive + PlaneGeometry
 *
 * 性能对比：
 * - Entity 方式：适合 < 100 个平面
 * - Primitive 方式：适合 > 100 个平面，性能提升显著
 */
export class DrawPPlane extends DrawPPoint {
  override type = 'plane-p'

  /** 当前绘制的 Primitive */
  private currentPrimitive: Cesium.Primitive | null = null

  /**
   * 创建 Primitive
   */
  protected override createPrimitive(attribute: Record<string, unknown>): Cesium.Primitive | null {
    this._positions_draw = null

    const planeAttr = attribute as PlanePrimitiveAttribute
    const style = planeAttr.style

    // 创建 Plane Geometry
    const dimensions = style.dimensions || new Cesium.Cartesian2(100, 100)

    const geometryInstance = new Cesium.GeometryInstance({
      geometry: new Cesium.PlaneGeometry({
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
      }),
      modelMatrix: Cesium.Matrix4.IDENTITY.clone(),
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
          this.parseColor(style.color) || Cesium.Color.YELLOW.withAlpha(0.5)
        )
      }
    })

    this.currentPrimitive = new Cesium.Primitive({
      geometryInstances: geometryInstance,
      appearance: new Cesium.PerInstanceColorAppearance({
        closed: false,
        translucent: true
      }),
      show: style.show !== undefined ? style.show : false
    })

    // 保存配置
    ;(this.currentPrimitive as unknown as Record<string, unknown>).attribute = planeAttr
    ;(this.currentPrimitive as unknown as Record<string, unknown>).dimensions = dimensions

    this.primitives!.add(this.currentPrimitive)
    this.primitive = this.currentPrimitive

    return this.currentPrimitive
  }

  /**
   * 更新 Plane 位置
   */
  private updatePlanePosition(position: Cesium.Cartesian3): void {
    if (!this.currentPrimitive) return

    // 移除旧的 Primitive
    if (this.primitives!.contains(this.currentPrimitive)) {
      this.primitives!.remove(this.currentPrimitive)
    }

    const attr = (this.currentPrimitive as unknown as Record<string, unknown>).attribute as PlanePrimitiveAttribute
    const style = attr.style
    const dimensions = (this.currentPrimitive as unknown as Record<string, unknown>).dimensions as Cesium.Cartesian2

    // 创建平移和缩放矩阵
    const translation = Cesium.Matrix4.fromTranslation(position)
    const scale = Cesium.Matrix4.fromScale(new Cesium.Cartesian3(dimensions.x, dimensions.y, 1))
    const modelMatrix = Cesium.Matrix4.multiply(translation, scale, new Cesium.Matrix4())

    const geometryInstance = new Cesium.GeometryInstance({
      geometry: new Cesium.PlaneGeometry({
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
      }),
      modelMatrix: modelMatrix,
      attributes: (this.currentPrimitive as unknown as Record<string, unknown>)._instanceAttributes as Record<string, unknown> || {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
          this.parseColor(style.color) || Cesium.Color.YELLOW.withAlpha(0.5)
        )
      }
    })

    this.currentPrimitive = new Cesium.Primitive({
      geometryInstances: geometryInstance,
      appearance: new Cesium.PerInstanceColorAppearance({
        closed: false,
        translucent: true
      }),
      show: style.show !== undefined ? style.show : false
    })

    // 保留配置
    ;(this.currentPrimitive as unknown as Record<string, unknown>).attribute = attr
    ;(this.currentPrimitive as unknown as Record<string, unknown>).dimensions = dimensions

    this.primitives!.add(this.currentPrimitive)
    this.primitive = this.currentPrimitive
  }

  /**
   * 绑定鼠标事件（支持PC端和移动端）
   */
  override bindEvent(): void {
    // 鼠标移动或触摸移动
    this.bindMoveEvent((position: Cesium.Cartesian2) => {
      const point = getCurrentMousePosition(this.viewer.scene, position, null)
      if (point) {
        this._positions_draw = point
        this.updatePlanePosition(point)
      }

      // 显示 Tooltip 提示
      if (this.tooltip) {
        this.tooltip.showAt(position, defaultMessages.draw.point.start)
      }

      // 触发鼠标移动事件
      this.fire(GraphicsEventType.DRAW_MOUSE_MOVE, {
        drawtype: this.type,
        primitive: this.currentPrimitive,
        position: point
      })
    })

    // 左键点击或触摸
    this.bindClickEvent((position: Cesium.Cartesian2) => {
      const point = getCurrentMousePosition(this.viewer.scene, position, null)
      if (point) {
        this._positions_draw = point
        this.updatePlanePosition(point)
        this.disable()
      }
    })
  }

  /**
   * Primitive 绘制结束
   */
  protected override finishPrimitive(): void {
    if (!this.currentPrimitive) return

    // 显示 Plane
    this.currentPrimitive.show = true
    ;(this.currentPrimitive as unknown as Record<string, unknown>)._positions_draw = this.getDrawPosition()

    // 绑定编辑对象
    // (this.currentPrimitive as unknown as Record<string, unknown>).editing = this.getEditClass(this.currentPrimitive as unknown as Cesium.Entity)
  }

  /**
   * 清理资源
   */
  override disable(hasWB?: boolean): this {
    super.disable(hasWB)

    // 如果是中断绘制，清理 Plane
    if (hasWB && this.currentPrimitive && this.primitives) {
      if (this.primitives.contains(this.currentPrimitive)) {
        this.primitives.remove(this.currentPrimitive)
      }
    }

    this.currentPrimitive = null
    return this
  }
}
