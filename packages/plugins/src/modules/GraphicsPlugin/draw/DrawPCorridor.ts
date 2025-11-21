import * as Cesium from 'cesium'
import { DrawPPolyline } from './DrawPPolyline'
import { getCurrentMousePosition } from '@ktd-cesium/shared'
import { defaultMessages } from '../../TooltipPlugin/messages'
import { GraphicsEventType } from '../../EventPlugin'
import type { CorridorPrimitiveAttribute } from '../types'

/**
 * Primitive 方式的走廊绘制类
 * 使用 Primitive + CorridorGeometry
 *
 * 性能对比：
 * - Entity 方式：适合 < 50 个走廊
 * - Primitive 方式：适合 > 50 个走廊，性能提升显著
 */
export class DrawPCorridor extends DrawPPolyline {
  override type = 'corridor-p'

  // 坐标位置相关
  protected override _minPointNum = 2
  protected override _maxPointNum = 9999

  /** 当前绘制的 Primitive */
  private currentPrimitive: Cesium.Primitive | null = null

  /**
   * 创建 Primitive
   */
  protected override createPrimitive(attribute: Record<string, unknown>): Cesium.Primitive | null {
    this._positions_draw = []

    const corridorAttr = attribute as CorridorPrimitiveAttribute

    if (!this._minPointNum_def) this._minPointNum_def = this._minPointNum
    if (!this._maxPointNum_def) this._maxPointNum_def = this._maxPointNum

    if (corridorAttr.config) {
      this._minPointNum = corridorAttr.config.minPointNum || this._minPointNum_def
      this._maxPointNum = corridorAttr.config.maxPointNum || this._maxPointNum_def
    } else {
      this._minPointNum = this._minPointNum_def
      this._maxPointNum = this._maxPointNum_def
    }

    // 创建 Primitive（初始为空几何）
    const style = corridorAttr.style
    const geometryInstance = new Cesium.GeometryInstance({
      geometry: new Cesium.CorridorGeometry({
        positions: [],
        width: style.width || 100,
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
      }),
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
      show: style.show !== undefined ? style.show : true
    })

    // 保存配置
    ;(this.currentPrimitive as unknown as Record<string, unknown>).attribute = corridorAttr

    this.primitives!.add(this.currentPrimitive)
    this.primitive = this.currentPrimitive

    return this.currentPrimitive
  }

  /**
   * 更新走廊几何体
   */
  private updateCorridorGeometry(): void {
    if (!this.currentPrimitive) return

    const positions = this._positions_draw as Cesium.Cartesian3[]
    if (positions.length < 2) return

    // 移除旧的 Primitive
    if (this.primitives!.contains(this.currentPrimitive)) {
      this.primitives!.remove(this.currentPrimitive)
    }

    const attr = (this.currentPrimitive as unknown as Record<string, unknown>).attribute as CorridorPrimitiveAttribute
    const style = attr.style

    // 创建新的几何体
    const geometryInstance = new Cesium.GeometryInstance({
      geometry: new Cesium.CorridorGeometry({
        positions: positions,
        width: style.width || 100,
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
      }),
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
      show: style.show !== undefined ? style.show : true
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
        this.updateCorridorGeometry()

        this.fire(GraphicsEventType.DRAW_ADD_POINT, {
          drawtype: this.type,
          primitive: this.currentPrimitive,
          position: point,
          positions: positions
        })

        if (positions.length >= this._maxPointNum) {
          this.disable()
        }
      }
    })

    // 右键删除上一个点（PC端专用）
    this.bindRightClickEvent((position: Cesium.Cartesian2) => {
      positions.pop()

      const point = getCurrentMousePosition(this.viewer!.scene, position, null)
      if (point) {
        if (lastPointTemporary) {
          positions.pop()
        }
        lastPointTemporary = true

        this.fire(GraphicsEventType.DRAW_REMOVE_POINT, {
          drawtype: this.type,
          primitive: this.currentPrimitive,
          position: point,
          positions: positions
        })

        positions.push(point)
        this.updateCorridorGeometry()
      }
    })

    // 鼠标移动或触摸移动
    this.bindMoveEvent((position: Cesium.Cartesian2) => {
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
        this.updateCorridorGeometry()

        this.fire(GraphicsEventType.DRAW_MOUSE_MOVE, {
          drawtype: this.type,
          primitive: this.currentPrimitive,
          position: point,
          positions: positions
        })
      }
    })

    // 双击结束标绘（PC端专用，移动端通过 endDraw 按钮结束）移动端也支持长按结束
    this.bindDoubleClickEvent(() => {
      if (positions.length > this._minPointNum) {
        const mpt1 = positions[positions.length - 1]
        const mpt2 = positions[positions.length - 2]

        if (
          Math.abs(mpt1.x - mpt2.x) < 1 &&
          Math.abs(mpt1.y - mpt2.y) < 1 &&
          Math.abs(mpt1.z - mpt2.z) < 1
        ) {
          positions.pop()
        }
      }
      this.endDraw()
    })
  }

  /**
   * Primitive 绘制结束
   */
  protected override finishPrimitive(): void {
    if (!this.currentPrimitive) return

    // 保存最终位置
    const primitiveObj = this.currentPrimitive as unknown as Record<string, unknown>
    primitiveObj._positions_draw = this.getDrawPosition()

    // 绑定编辑对象
    // primitiveObj.editing = this.getEditClass(this.currentPrimitive as unknown as Cesium.Entity)
  }

  /**
   * 清理资源
   */
  override disable(hasWB?: boolean): this {
    super.disable(hasWB)

    // 如果是中断绘制，清理走廊
    if (hasWB && this.currentPrimitive && this.primitives) {
      if (this.primitives.contains(this.currentPrimitive)) {
        this.primitives.remove(this.currentPrimitive)
      }
    }

    this.currentPrimitive = null
    return this
  }
}
