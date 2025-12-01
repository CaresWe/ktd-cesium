import * as Cesium from 'cesium'
import { DrawPrimitiveBase } from './DrawPrimitiveBase'
import { getCurrentMousePosition } from '@ktd-cesium/shared'
import { defaultMessages } from '../../TooltipPlugin/messages'
import { GraphicsEventType } from '../../EventPlugin'
import type { BillboardPrimitiveStyle, BillboardPrimitiveAttribute, PrimitiveObject } from '../types'

/**
 * 扩展的 Billboard 接口
 */
interface ExtendedBillboard extends Cesium.Billboard, PrimitiveObject {
  attribute?: BillboardPrimitiveAttribute
}

/**
 * Primitive 方式的 Billboard 绘制类
 * 使用 BillboardCollection，适合大量图标绘制
 *
 * 性能对比：
 * - Entity 方式：适合 < 500 个图标
 * - Primitive 方式：适合 > 500 个图标，性能提升显著
 */
export class DrawPBillboard extends DrawPrimitiveBase {
  type = 'billboard-p'

  /** BillboardCollection 实例 */
  private billboardCollection: Cesium.BillboardCollection | null = null

  /** 当前绘制的 Billboard */
  private currentBillboard: ExtendedBillboard | null = null

  /**
   * 创建 Billboard Primitive
   */
  protected override createPrimitive(attribute: Record<string, unknown>): Cesium.Primitive | null {
    this._positions_draw = null

    const billboardAttr = attribute as BillboardPrimitiveAttribute

    // 创建或获取 BillboardCollection
    if (!this.billboardCollection) {
      this.billboardCollection = new Cesium.BillboardCollection()
      this.primitives!.add(this.billboardCollection)
    }

    // 创建 Billboard
    const style = billboardAttr.style
    const billboardOptions: Cesium.Billboard.ConstructorOptions = {
      position: Cesium.Cartesian3.ZERO,
      scale: style.scale || 1.0,
      pixelOffset: style.pixelOffset || Cesium.Cartesian2.ZERO,
      eyeOffset: style.eyeOffset || Cesium.Cartesian3.ZERO,
      horizontalOrigin: style.horizontalOrigin || Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: style.verticalOrigin || Cesium.VerticalOrigin.CENTER,
      color: this.parseColor(style.color) || Cesium.Color.WHITE,
      rotation: style.rotation || 0,
      alignedAxis: style.alignedAxis || Cesium.Cartesian3.ZERO,
      show: style.show !== undefined ? style.show : false,
      disableDepthTestDistance: style.disableDepthTestDistance || Number.POSITIVE_INFINITY,
      image: style.image || '',
      width: style.width,
      height: style.height
    }

    const billboard = this.billboardCollection.add(billboardOptions) as ExtendedBillboard

    billboard.attribute = billboardAttr
    this.currentBillboard = billboard
    this.primitive = this.billboardCollection as unknown as Cesium.Primitive

    return this.billboardCollection as unknown as Cesium.Primitive
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
      if (point && this.currentBillboard) {
        this._positions_draw = point
        this.currentBillboard.position = point
      }

      // 显示 Tooltip 提示
      if (this.tooltip) {
        this.tooltip.showAt(position, defaultMessages.draw.point.start)
      }

      // 触发鼠标移动事件
      this.fire(GraphicsEventType.DRAW_MOUSE_MOVE, {
        drawtype: this.type,
        primitive: this.currentBillboard,
        position: point
      })
    })

    // 左键点击或触摸
    this.bindClickEvent((position: Cesium.Cartesian2) => {
      const point = getCurrentMousePosition(this.viewer.scene, position, null)
      if (point) {
        this._positions_draw = point
        if (this.currentBillboard) {
          this.currentBillboard.position = point
        }
        this.disable()
      }
    })
  }

  /**
   * Primitive 绘制结束
   */
  protected override finishPrimitive(): void {
    if (!this.currentBillboard) return

    this.currentBillboard.show = true
    this.currentBillboard._positions_draw = this.getDrawPosition()

    // 绑定编辑对象
    // this.currentBillboard.editing = this.getEditClass(this.currentBillboard as unknown as Cesium.Entity)
  }

  /**
   * 样式转 Primitive（支持动态更新样式）
   */
  protected override style2Entity(style: Record<string, unknown>, _entity: Cesium.Entity): void {
    if (!this.currentBillboard) return

    const billboardStyle = style as BillboardPrimitiveStyle
    if (billboardStyle.image !== undefined) this.currentBillboard.image = billboardStyle.image
    if (billboardStyle.scale !== undefined) this.currentBillboard.scale = billboardStyle.scale
    if (billboardStyle.pixelOffset) this.currentBillboard.pixelOffset = billboardStyle.pixelOffset
    if (billboardStyle.eyeOffset) this.currentBillboard.eyeOffset = billboardStyle.eyeOffset
    if (billboardStyle.horizontalOrigin !== undefined)
      this.currentBillboard.horizontalOrigin = billboardStyle.horizontalOrigin
    if (billboardStyle.verticalOrigin !== undefined)
      this.currentBillboard.verticalOrigin = billboardStyle.verticalOrigin
    if (billboardStyle.color) this.currentBillboard.color = this.parseColor(billboardStyle.color)!
    if (billboardStyle.rotation !== undefined) this.currentBillboard.rotation = billboardStyle.rotation
    if (billboardStyle.alignedAxis) this.currentBillboard.alignedAxis = billboardStyle.alignedAxis
    if (billboardStyle.width !== undefined) this.currentBillboard.width = billboardStyle.width
    if (billboardStyle.height !== undefined) this.currentBillboard.height = billboardStyle.height
    if (billboardStyle.show !== undefined) this.currentBillboard.show = billboardStyle.show
  }

  /**
   * 清理资源
   */
  override disable(hasWB?: boolean): this {
    super.disable(hasWB)

    // 如果是中断绘制，清理 Billboard
    if (hasWB && this.currentBillboard && this.billboardCollection) {
      this.billboardCollection.remove(this.currentBillboard)
    }

    this.currentBillboard = null
    return this
  }

  /**
   * 返回对应的 Entity 类型名称
   */
  override toEntityType(): string {
    return 'billboard'
  }

  /**
   * 删除当前 Primitive 对象
   */
  override removePrimitive(): void {
    if (this.currentBillboard && this.billboardCollection) {
      this.billboardCollection.remove(this.currentBillboard)
    }
    this.currentBillboard = null
    this.primitive = null
  }
}
