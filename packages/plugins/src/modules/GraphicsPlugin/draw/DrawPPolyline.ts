import * as Cesium from 'cesium'
import { DrawPrimitiveBase } from './DrawPrimitiveBase'
import { getCurrentMousePosition, addPositionsHeight } from '@auto-cesium/shared'
import { defaultMessages } from '../../TooltipPlugin/messages'
import { GraphicsEventType } from '../../EventPlugin'
import type { PolylinePrimitiveStyle, PolylinePrimitiveAttribute, ExtendedPolyline } from '../types'

/**
 * Primitive 方式的折线绘制类
 * 使用 PolylineCollection，适合大量折线绘制
 *
 * 性能对比：
 * - Entity 方式：适合 < 100 条折线
 * - Primitive 方式：适合 > 100 条折线，性能提升显著
 */
export class DrawPPolyline extends DrawPrimitiveBase {
  type = 'polyline-p'

  // 坐标位置相关
  protected _minPointNum = 2 // 至少需要点的个数
  protected _maxPointNum = 9999 // 最多允许点的个数
  protected _minPointNum_def?: number
  protected _maxPointNum_def?: number

  /** PolylineCollection 实例 */
  protected polylineCollection: Cesium.PolylineCollection | null = null

  /** 当前绘制的折线 */
  protected currentPolyline: ExtendedPolyline | null = null

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
   * 创建 Polyline Primitive
   */
  protected override createPrimitive(
    attribute: Record<string, unknown>
  ): Cesium.Primitive | Cesium.GroundPrimitive | null {
    this._positions_draw = []

    const polylineAttr = attribute as PolylinePrimitiveAttribute

    if (!this._minPointNum_def) this._minPointNum_def = this._minPointNum
    if (!this._maxPointNum_def) this._maxPointNum_def = this._maxPointNum

    if (polylineAttr.config) {
      // 允许外部传入
      this._minPointNum = polylineAttr.config.minPointNum || this._minPointNum_def
      this._maxPointNum = polylineAttr.config.maxPointNum || this._maxPointNum_def
    } else {
      this._minPointNum = this._minPointNum_def
      this._maxPointNum = this._maxPointNum_def
    }

    // 创建或获取 PolylineCollection
    if (!this.polylineCollection) {
      this.polylineCollection = new Cesium.PolylineCollection()
      this.primitives!.add(this.polylineCollection)
    }

    // 创建折线
    const style = polylineAttr.style
    const polyline = this.polylineCollection.add({
      positions: [],
      width: style.width || 2,
      material: Cesium.Material.fromType('Color', {
        color: this.parseColor(style.color) || Cesium.Color.YELLOW
      }),
      show: style.show !== undefined ? style.show : true
    }) as ExtendedPolyline

    polyline.attribute = polylineAttr
    this.currentPolyline = polyline
    this.primitive = this.polylineCollection as unknown as Cesium.Primitive

    return this.polylineCollection as unknown as Cesium.Primitive
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
        // 如果未拾取到点，并且存在 MOUSE_MOVE 时，取最后一个 move 的点
        point = positions[positions.length - 1]
      }

      if (point) {
        if (lastPointTemporary) {
          positions.pop()
        }
        lastPointTemporary = false

        // 在绘制点基础自动增加高度
        if (this.currentPolyline?.attribute?.config?.addHeight) {
          point = addPositionsHeight(point, this.currentPolyline.attribute.config.addHeight) as Cesium.Cartesian3
        }

        positions.push(point)
        this.updatePolylinePositions()

        this.fire(GraphicsEventType.DRAW_ADD_POINT, {
          drawtype: this.type,
          primitive: this.currentPolyline,
          position: point,
          positions: positions
        })

        if (positions.length >= this._maxPointNum) {
          // 点数满足最大数量，自动结束
          this.disable()
        }
      }
    })

    // 右键删除上一个点（PC端专用）
    this.bindRightClickEvent((position: Cesium.Cartesian2) => {
      positions.pop() // 删除最后标的一个点

      const point = getCurrentMousePosition(this.viewer!.scene, position, null)
      if (point) {
        if (lastPointTemporary) {
          positions.pop()
        }
        lastPointTemporary = true

        this.fire(GraphicsEventType.DRAW_REMOVE_POINT, {
          drawtype: this.type,
          primitive: this.currentPolyline,
          position: point,
          positions: positions
        })

        positions.push(point)
        this.updatePolylinePositions()
      }
    })

    // 鼠标移动或触摸移动
    this.bindMoveEvent((position: Cesium.Cartesian2) => {
      // 显示提示信息
      if (positions.length <= 1) {
        this.tooltip!.showAt(position, defaultMessages.draw.polyline.start)
      } else if (positions.length < this._minPointNum) {
        this.tooltip!.showAt(position, defaultMessages.draw.polyline.cont)
      } else if (positions.length >= this._maxPointNum) {
        this.tooltip!.showAt(position, defaultMessages.draw.polyline.end2)
      } else {
        this.tooltip!.showAt(position, defaultMessages.draw.polyline.end)
      }

      const point = getCurrentMousePosition(this.viewer!.scene, position, null)
      if (point) {
        if (lastPointTemporary) {
          positions.pop()
        }
        lastPointTemporary = true

        positions.push(point)
        this.updatePolylinePositions()

        this.fire(GraphicsEventType.DRAW_MOUSE_MOVE, {
          drawtype: this.type,
          primitive: this.currentPolyline,
          position: point,
          positions: positions
        })
      }
    })

    // 双击结束标绘（PC端专用，移动端通过 endDraw 按钮结束）移动端也支持长按结束
    this.bindDoubleClickEvent(() => {
      // 必要代码 消除双击带来的多余经纬度
      if (positions.length > this._minPointNum) {
        const mpt1 = positions[positions.length - 1]
        const mpt2 = positions[positions.length - 2]

        if (Math.abs(mpt1.x - mpt2.x) < 1 && Math.abs(mpt1.y - mpt2.y) < 1 && Math.abs(mpt1.z - mpt2.z) < 1) {
          positions.pop()
        }
      }
      this.endDraw()
    })
  }

  /**
   * 更新折线位置
   */
  protected updatePolylinePositions(): void {
    if (this.currentPolyline) {
      this.currentPolyline.positions = this._positions_draw as Cesium.Cartesian3[]
    }
  }

  /**
   * 外部控制，完成绘制（支持双击、长按或手动调用结束）
   */
  endDraw(): this {
    if (!this._enabled) {
      return this
    }

    const positions = this._positions_draw as Cesium.Cartesian3[]
    if (positions.length < this._minPointNum) return this // 点数不够
    this.disable()
    return this
  }

  /**
   * Primitive 绘制结束
   */
  protected override finishPrimitive(): void {
    if (!this.currentPolyline) return

    this.currentPolyline._positions_draw = this.getDrawPosition()
    this.currentPolyline.positions = this._positions_draw as Cesium.Cartesian3[]

    // 绑定编辑对象
    // this.currentPolyline.editing = this.getEditClass(this.currentPolyline as unknown as Cesium.Entity)
  }

  /**
   * 样式转 Primitive（支持动态更新样式）
   */
  protected override style2Entity(style: Record<string, unknown>, _entity: Cesium.Entity): void {
    if (!this.currentPolyline) return

    const polylineStyle = style as PolylinePrimitiveStyle
    if (polylineStyle.width !== undefined) this.currentPolyline.width = polylineStyle.width
    if (polylineStyle.color) {
      this.currentPolyline.material = Cesium.Material.fromType('Color', {
        color: this.parseColor(polylineStyle.color)
      })
    }
    if (polylineStyle.show !== undefined) this.currentPolyline.show = polylineStyle.show
  }

  /**
   * 清理资源
   */
  override disable(hasWB?: boolean): this {
    super.disable(hasWB)

    // 如果是中断绘制，清理折线
    if (hasWB && this.currentPolyline && this.polylineCollection) {
      this.polylineCollection.remove(this.currentPolyline)
    }

    this.currentPolyline = null
    return this
  }

  override toEntityType(): string {
    return 'polyline'
  }

  override removePrimitive(): void {
    if (this.currentPolyline && this.polylineCollection) {
      this.polylineCollection.remove(this.currentPolyline)
    }
    this.currentPolyline = null
    this.primitive = null
  }
}
