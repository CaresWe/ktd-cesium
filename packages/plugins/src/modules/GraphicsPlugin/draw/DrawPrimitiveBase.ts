import * as Cesium from 'cesium'
import { DrawBase } from './DrawBase'
import type { DrawPrimitiveConfig, PrimitiveObject } from '../types'

/**
 * Primitive 绘制基类
 * 所有使用 Primitive 方式的绘制类都应该继承此类
 *
 * 与 DrawBase 的区别：
 * - DrawBase: 使用 Entity 方式，功能完整，适合少量图形，支持拖拽点编辑
 * - DrawPrimitiveBase: 使用 Primitive 方式，性能更高，适合大量图形，不支持拖拽点编辑
 *
 * 注意：Primitive 对象不支持像 Entity 那样的交互式编辑功能
 * - Primitive 设计用于高性能批量渲染，不是为交互编辑设计的
 * - 如需编辑功能，请使用对应的 Entity 绘制类（如 DrawPoint, DrawPolyline 等）
 * - Primitive 对象的属性可以通过编程方式修改（如直接设置坐标、样式等）
 */
export class DrawPrimitiveBase extends DrawBase {
  /** Primitive 对象（替代 entity），支持 Primitive, GroundPrimitive 和 Collection 类型 */
  protected primitive: (Cesium.Primitive | Cesium.GroundPrimitive | PrimitiveObject) | null = null

  /**
   * 构造函数
   */
  constructor(opts: DrawPrimitiveConfig) {
    super(opts)

    if (!this.primitives) {
      throw new Error('DrawPrimitiveBase: primitives 参数不能为空')
    }
  }

  /**
   * 激活绘制（重写）
   * 注意：虽然返回类型是 Entity，但实际返回的是 Primitive 对象（类型转换以保持兼容）
   */
  override activate(
    attribute: Record<string, unknown>,
    drawOkCallback?: (entity: Cesium.Entity) => void
  ): Cesium.Entity {
    if (this._enabled && this.primitive) {
      return this.primitive as unknown as Cesium.Entity
    }

    this._enabled = true
    this.drawOkCallback = drawOkCallback || null

    this.createPrimitive(attribute)
    if (this.primitive) {
      const extPrimitive = this.primitive as PrimitiveObject
      extPrimitive.inProgress = true
    }

    this.setCursor(true)
    this.enableControl(false)
    this.bindEvent()

    this.fire('draw.start', { drawtype: this.type, primitive: this.primitive })

    return this.primitive as unknown as Cesium.Entity
  }

  /**
   * 释放绘制（重写）
   */
  override disable(hasWB?: boolean): this {
    if (!this._enabled) {
      return this
    }

    this._enabled = false

    this.setCursor(false)
    this.enableControl(true)

    const extPrimitive = this.primitive as PrimitiveObject | null

    if (hasWB && extPrimitive?.inProgress) {
      // 外部释放时，尚未结束的标绘移除
      if (this.primitives && this.primitive && this.primitives.contains(this.primitive as Cesium.Primitive)) {
        this.primitives.remove(this.primitive as Cesium.Primitive)
      }
    } else if (this.primitive) {
      if (extPrimitive) {
        extPrimitive.inProgress = false
      }
      this.finishPrimitive()

      if (this.drawOkCallback) {
        this.drawOkCallback(this.primitive as unknown as Cesium.Entity)
        this.drawOkCallback = null
      }

      this.fire('draw.created', { drawtype: this.type, primitive: this.primitive })
    }

    this.destroyHandler()
    this._positions_draw = null
    this.primitive = null
    this.tooltip?.setVisible(false)

    return this
  }

  /**
   * 创建 Primitive（子类需要重写）
   */
  protected createPrimitive(_attribute: Record<string, unknown>): Cesium.Primitive | Cesium.GroundPrimitive | null {
    // 子类实现
    return null
  }

  /**
   * Primitive 绘制结束后调用（子类需要重写）
   */
  protected finishPrimitive(): void {
    // 子类实现
  }

  /**
   * 创建 Entity（保持兼容，但不推荐使用）
   */
  protected override createFeature(attribute: Record<string, unknown>): Cesium.Entity | null {
    const primitive = this.createPrimitive(attribute)
    return primitive as unknown as Cesium.Entity
  }

  /**
   * 图形绘制结束（保持兼容）
   */
  protected override finish(): void {
    this.finishPrimitive()
  }

  /**
   * 获取绘制的 Primitive 对象
   */
  getPrimitive(): (Cesium.Primitive | Cesium.GroundPrimitive | PrimitiveObject) | null {
    return this.primitive
  }

  /**
   * 将 Primitive 转换为 Entity 以支持编辑
   * @returns 对应的 Entity 绘制类名称（如 'point', 'polyline' 等）
   */
  toEntityType(): string | null {
    // 子类需要重写此方法，返回对应的 Entity 类型名称
    // 例如：DrawPPoint 返回 'point'，DrawPPolyline 返回 'polyline'
    return null
  }

  /**
   * 获取 Primitive 的属性，用于转换为 Entity
   * @returns 属性对象
   */
  getAttributeForEntity(): Record<string, unknown> {
    const primObj = this.primitive as PrimitiveObject
    return primObj?.attribute || {}
  }

  /**
   * 删除当前 Primitive 对象
   */
  removePrimitive(): void {
    if (this.primitive && this.primitives) {
      // 根据类型判断如何删除
      if (this.primitive instanceof Cesium.PointPrimitiveCollection ||
          this.primitive instanceof Cesium.BillboardCollection ||
          this.primitive instanceof Cesium.LabelCollection ||
          this.primitive instanceof Cesium.PolylineCollection) {
        // Collection 类型，需要从 primitives 中移除整个 Collection
        // 但这会删除所有项，所以我们只移除单个项
        // 注意：这需要在子类中具体处理
      } else if (this.primitive instanceof Cesium.Primitive ||
                 this.primitive instanceof Cesium.GroundPrimitive) {
        // 单个 Primitive，直接从 primitives 中移除
        this.primitives.remove(this.primitive as Cesium.Primitive)
      }
    }
    this.primitive = null
  }
}
