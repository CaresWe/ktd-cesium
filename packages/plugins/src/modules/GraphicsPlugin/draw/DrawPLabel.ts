import * as Cesium from 'cesium'
import { DrawPrimitiveBase, type PrimitiveObject } from './DrawPrimitiveBase'
import { getCurrentMousePosition } from '@ktd-cesium/shared'
import { defaultMessages } from '../../TooltipPlugin/messages'
import { GraphicsEventType } from '../../EventPlugin'
import type { LabelPrimitiveStyle, LabelPrimitiveAttribute } from '../types'

/**
 * 扩展的 Label 接口
 */
interface ExtendedLabel extends Cesium.Label, PrimitiveObject {
  attribute?: LabelPrimitiveAttribute
}

/**
 * Primitive 方式的 Label 绘制类
 * 使用 LabelCollection，适合大量文字标注绘制
 *
 * 性能对比：
 * - Entity 方式：适合 < 500 个标注
 * - Primitive 方式：适合 > 500 个标注，性能提升显著
 */
export class DrawPLabel extends DrawPrimitiveBase {
  type = 'label-p'

  /** LabelCollection 实例 */
  private labelCollection: Cesium.LabelCollection | null = null

  /** 当前绘制的 Label */
  private currentLabel: ExtendedLabel | null = null

  /**
   * 创建 Label Primitive
   */
  protected override createPrimitive(attribute: Record<string, unknown>): Cesium.Primitive | null {
    this._positions_draw = null

    const labelAttr = attribute as LabelPrimitiveAttribute

    // 创建或获取 LabelCollection
    if (!this.labelCollection) {
      this.labelCollection = new Cesium.LabelCollection()
      this.primitives!.add(this.labelCollection)
    }

    // 创建 Label
    const style = labelAttr.style
    const label = this.labelCollection.add({
      position: Cesium.Cartesian3.ZERO,
      text: style.text || '',
      font: style.font || '16px sans-serif',
      fillColor: this.parseColor(style.fillColor) || Cesium.Color.WHITE,
      outlineColor: this.parseColor(style.outlineColor) || Cesium.Color.BLACK,
      outlineWidth: style.outlineWidth || 0,
      style: style.style || Cesium.LabelStyle.FILL,
      pixelOffset: style.pixelOffset || Cesium.Cartesian2.ZERO,
      eyeOffset: style.eyeOffset || Cesium.Cartesian3.ZERO,
      horizontalOrigin: style.horizontalOrigin || Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: style.verticalOrigin || Cesium.VerticalOrigin.CENTER,
      scale: style.scale || 1.0,
      show: style.show !== undefined ? style.show : false,
      disableDepthTestDistance: style.disableDepthTestDistance || Number.POSITIVE_INFINITY,
      backgroundColor: this.parseColor(style.backgroundColor) || Cesium.Color.TRANSPARENT,
      backgroundPadding: style.backgroundPadding || new Cesium.Cartesian2(7, 5),
      showBackground: style.showBackground || false
    }) as ExtendedLabel

    label.attribute = labelAttr
    this.currentLabel = label
    this.primitive = this.labelCollection as unknown as Cesium.Primitive

    return this.labelCollection as unknown as Cesium.Primitive
  }

  /**
   * 解析颜色
   */
  private parseColor(color: string | Cesium.Color | undefined): Cesium.Color | undefined {
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
      if (point && this.currentLabel) {
        this._positions_draw = point
        this.currentLabel.position = point
      }

      // 显示 Tooltip 提示
      if (this.tooltip) {
        this.tooltip.showAt(position, defaultMessages.draw.point.start)
      }

      // 触发鼠标移动事件
      this.fire(GraphicsEventType.DRAW_MOUSE_MOVE, {
        drawtype: this.type,
        primitive: this.currentLabel,
        position: point
      })
    })

    // 左键点击或触摸
    this.bindClickEvent((position: Cesium.Cartesian2) => {
      const point = getCurrentMousePosition(this.viewer.scene, position, null)
      if (point) {
        this._positions_draw = point
        if (this.currentLabel) {
          this.currentLabel.position = point
        }
        this.disable()
      }
    })
  }

  /**
   * Primitive 绘制结束
   */
  protected override finishPrimitive(): void {
    if (!this.currentLabel) return

    this.currentLabel.show = true
    this.currentLabel._positions_draw = this.getDrawPosition()

    // 绑定编辑对象
    // this.currentLabel.editing = this.getEditClass(this.currentLabel as unknown as Cesium.Entity)
  }

  /**
   * 样式转 Primitive（支持动态更新样式）
   */
  protected override style2Entity(style: Record<string, unknown>, _entity: Cesium.Entity): void {
    if (!this.currentLabel) return

    const labelStyle = style as LabelPrimitiveStyle
    if (labelStyle.text !== undefined) this.currentLabel.text = labelStyle.text
    if (labelStyle.font !== undefined) this.currentLabel.font = labelStyle.font
    if (labelStyle.fillColor) this.currentLabel.fillColor = this.parseColor(labelStyle.fillColor)!
    if (labelStyle.outlineColor) this.currentLabel.outlineColor = this.parseColor(labelStyle.outlineColor)!
    if (labelStyle.outlineWidth !== undefined) this.currentLabel.outlineWidth = labelStyle.outlineWidth
    if (labelStyle.style !== undefined) this.currentLabel.style = labelStyle.style
    if (labelStyle.pixelOffset) this.currentLabel.pixelOffset = labelStyle.pixelOffset
    if (labelStyle.eyeOffset) this.currentLabel.eyeOffset = labelStyle.eyeOffset
    if (labelStyle.horizontalOrigin !== undefined) this.currentLabel.horizontalOrigin = labelStyle.horizontalOrigin
    if (labelStyle.verticalOrigin !== undefined) this.currentLabel.verticalOrigin = labelStyle.verticalOrigin
    if (labelStyle.scale !== undefined) this.currentLabel.scale = labelStyle.scale
    if (labelStyle.show !== undefined) this.currentLabel.show = labelStyle.show
    if (labelStyle.backgroundColor) this.currentLabel.backgroundColor = this.parseColor(labelStyle.backgroundColor)!
    if (labelStyle.backgroundPadding) this.currentLabel.backgroundPadding = labelStyle.backgroundPadding
    if (labelStyle.showBackground !== undefined) this.currentLabel.showBackground = labelStyle.showBackground
  }

  /**
   * 清理资源
   */
  override disable(hasWB?: boolean): this {
    super.disable(hasWB)

    // 如果是中断绘制，清理 Label
    if (hasWB && this.currentLabel && this.labelCollection) {
      this.labelCollection.remove(this.currentLabel)
    }

    this.currentLabel = null
    return this
  }

  override toEntityType(): string {
    return 'label'
  }

  override removePrimitive(): void {
    if (this.currentLabel && this.labelCollection) {
      this.labelCollection.remove(this.currentLabel)
    }
    this.currentLabel = null
    this.primitive = null
  }
}
