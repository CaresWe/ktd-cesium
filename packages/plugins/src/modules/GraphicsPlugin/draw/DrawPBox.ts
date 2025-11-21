import * as Cesium from 'cesium'
import { DrawPPoint } from './DrawPPoint'
import { getCurrentMousePosition } from '@ktd-cesium/shared'
import { defaultMessages } from '../../TooltipPlugin/messages'
import { GraphicsEventType } from '../../EventPlugin'
import type { BoxPrimitiveAttribute } from '../types'

/**
 * Primitive 方式的立方体绘制类
 * 使用 Primitive + BoxGeometry
 *
 * 性能对比：
 * - Entity 方式：适合 < 100 个立方体
 * - Primitive 方式：适合 > 100 个立方体，性能提升显著
 */
export class DrawPBox extends DrawPPoint {
  override type = 'box-p'

  /** 当前绘制的 Primitive */
  private currentPrimitive: Cesium.Primitive | null = null

  /**
   * 创建 Primitive
   */
  protected override createPrimitive(attribute: Record<string, unknown>): Cesium.Primitive | null {
    this._positions_draw = null

    const boxAttr = attribute as BoxPrimitiveAttribute
    const style = boxAttr.style

    // 创建 Box Geometry
    const dimensions = style.dimensions || new Cesium.Cartesian3(100, 100, 100)
    const halfDimensions = Cesium.Cartesian3.multiplyByScalar(dimensions, 0.5, new Cesium.Cartesian3())

    const geometryInstance = new Cesium.GeometryInstance({
      geometry: new Cesium.BoxGeometry({
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
        minimum: Cesium.Cartesian3.negate(halfDimensions, new Cesium.Cartesian3()),
        maximum: halfDimensions
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
        closed: true,
        translucent: true
      }),
      show: style.show !== undefined ? style.show : false
    })

    // 保存配置
    ;(this.currentPrimitive as unknown as Record<string, unknown>).attribute = boxAttr

    this.primitives!.add(this.currentPrimitive)
    this.primitive = this.currentPrimitive

    return this.currentPrimitive
  }

  /**
   * 更新 Box 位置
   */
  private updateBoxPosition(position: Cesium.Cartesian3): void {
    if (!this.currentPrimitive) return

    // 移除旧的 Primitive
    if (this.primitives!.contains(this.currentPrimitive)) {
      this.primitives!.remove(this.currentPrimitive)
    }

    const attr = (this.currentPrimitive as unknown as Record<string, unknown>).attribute as BoxPrimitiveAttribute
    const style = attr.style
    const dimensions = style.dimensions || new Cesium.Cartesian3(100, 100, 100)
    const halfDimensions = Cesium.Cartesian3.multiplyByScalar(dimensions, 0.5, new Cesium.Cartesian3())

    // 创建平移矩阵
    const modelMatrix = Cesium.Matrix4.fromTranslation(position)

    const geometryInstance = new Cesium.GeometryInstance({
      geometry: new Cesium.BoxGeometry({
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
        minimum: Cesium.Cartesian3.negate(halfDimensions, new Cesium.Cartesian3()),
        maximum: halfDimensions
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
        closed: true,
        translucent: true
      }),
      show: style.show !== undefined ? style.show : false
    })

    // 保留配置
    ;(this.currentPrimitive as unknown as Record<string, unknown>).attribute = attr

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
        this.updateBoxPosition(point)
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
        this.updateBoxPosition(point)
        this.disable()
      }
    })
  }

  /**
   * Primitive 绘制结束
   */
  protected override finishPrimitive(): void {
    if (!this.currentPrimitive) return

    // 显示 Box
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

    // 如果是中断绘制，清理 Box
    if (hasWB && this.currentPrimitive && this.primitives) {
      if (this.primitives.contains(this.currentPrimitive)) {
        this.primitives.remove(this.currentPrimitive)
      }
    }

    this.currentPrimitive = null
    return this
  }
}
