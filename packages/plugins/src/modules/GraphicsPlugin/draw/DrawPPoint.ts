import * as Cesium from 'cesium'
import { DrawPrimitiveBase } from './DrawPrimitiveBase'
import { getCurrentMousePosition } from '@auto-cesium/shared'
import { defaultMessages } from '../../TooltipPlugin/messages'
import { GraphicsEventType } from '../../EventPlugin'
import type { PointPrimitiveStyle, PointPrimitiveAttribute, ExtendedPointPrimitive } from '../types'

/**
 * Primitive 方式的点绘制类
 * 使用 PointPrimitiveCollection，适合大量点位绘制
 *
 * 性能对比：
 * - Entity 方式：适合 < 1000 个点
 * - Primitive 方式：适合 > 1000 个点，性能提升显著
 */
export class DrawPPoint extends DrawPrimitiveBase {
  type = 'point-p'

  /** PointPrimitiveCollection 实例 */
  private pointCollection: Cesium.PointPrimitiveCollection | null = null

  /** 当前绘制的点 */
  private currentPoint: ExtendedPointPrimitive | null = null

  /**
   * 创建 PointPrimitive
   */
  protected override createPrimitive(attribute: Record<string, unknown>): Cesium.Primitive | null {
    this._positions_draw = null

    const pointAttr = attribute as PointPrimitiveAttribute

    // 创建或获取 PointPrimitiveCollection
    if (!this.pointCollection) {
      this.pointCollection = new Cesium.PointPrimitiveCollection()
      this.primitives!.add(this.pointCollection)
    }

    // 创建点
    const style = pointAttr.style
    const point = this.pointCollection.add({
      position: Cesium.Cartesian3.ZERO,
      pixelSize: style.pixelSize || 10,
      color: this.parseColor(style.color) || Cesium.Color.WHITE,
      outlineColor: this.parseColor(style.outlineColor) || Cesium.Color.BLACK,
      outlineWidth: style.outlineWidth || 0,
      show: style.show !== undefined ? style.show : false,
      disableDepthTestDistance: style.disableDepthTestDistance || Number.POSITIVE_INFINITY
    }) as ExtendedPointPrimitive

    point.attribute = pointAttr
    this.currentPoint = point
    this.primitive = this.pointCollection as unknown as Cesium.Primitive

    return this.pointCollection as unknown as Cesium.Primitive
  }

  /**
   * 解析颜色
   */
  protected parseColor(color: string | Cesium.Color | undefined): Cesium.Color | undefined {
    if (!color) return undefined
    if (color instanceof Cesium.Color) return color
    if (typeof color === 'string') {
      return Cesium.Color.fromCssColorString(color)
    }
    return undefined
  }

  /**
   * 绑定鼠标事件（支持PC端和移动端）
   */
  override bindEvent(): void {
    // 鼠标移动或触摸移动
    this.bindMoveEvent((position: Cesium.Cartesian2) => {
      const point = getCurrentMousePosition(this.viewer.scene, position, null)
      if (point && this.currentPoint) {
        this._positions_draw = point
        this.currentPoint.position = point
      }

      // 显示 Tooltip 提示
      if (this.tooltip) {
        this.tooltip.showAt(position, defaultMessages.draw.point.start)
      }

      // 触发鼠标移动事件
      this.fire(GraphicsEventType.DRAW_MOUSE_MOVE, {
        drawtype: this.type,
        primitive: this.currentPoint,
        position: point
      })
    })

    // 左键点击或触摸
    this.bindClickEvent((position: Cesium.Cartesian2) => {
      const point = getCurrentMousePosition(this.viewer.scene, position, null)
      if (point) {
        this._positions_draw = point
        if (this.currentPoint) {
          this.currentPoint.position = point
        }
        this.disable()
      }
    })
  }

  /**
   * Primitive 绘制结束
   */
  protected override finishPrimitive(): void {
    if (!this.currentPoint) return

    this.currentPoint.show = true
    this.currentPoint._positions_draw = this.getDrawPosition()

    // 注意：Primitive 对象不支持像 Entity 那样的拖拽点编辑
    // 如需编辑功能，建议：
    // 1. 删除此 Primitive 并用 Entity 方式重新绘制
    // 2. 或通过属性面板直接修改坐标值
    // 3. 或实现专门的 Primitive 编辑工具
  }

  /**
   * 样式转 Primitive（支持动态更新样式）
   */
  protected override style2Entity(style: Record<string, unknown>, _entity: Cesium.Entity): void {
    if (!this.currentPoint) return

    const pointStyle = style as PointPrimitiveStyle
    if (pointStyle.pixelSize !== undefined) this.currentPoint.pixelSize = pointStyle.pixelSize
    if (pointStyle.color) this.currentPoint.color = this.parseColor(pointStyle.color)!
    if (pointStyle.outlineColor) this.currentPoint.outlineColor = this.parseColor(pointStyle.outlineColor)!
    if (pointStyle.outlineWidth !== undefined) this.currentPoint.outlineWidth = pointStyle.outlineWidth
    if (pointStyle.show !== undefined) this.currentPoint.show = pointStyle.show
  }

  /**
   * 清理资源
   */
  override disable(hasWB?: boolean): this {
    super.disable(hasWB)

    // 如果是中断绘制，清理点
    if (hasWB && this.currentPoint && this.pointCollection) {
      this.pointCollection.remove(this.currentPoint)
    }

    this.currentPoint = null
    return this
  }

  /**
   * 返回对应的 Entity 类型名称
   */
  override toEntityType(): string {
    return 'point'
  }

  /**
   * 删除当前 Primitive 对象
   */
  override removePrimitive(): void {
    if (this.currentPoint && this.pointCollection) {
      this.pointCollection.remove(this.currentPoint)
    }
    this.currentPoint = null
    this.primitive = null
  }
}
