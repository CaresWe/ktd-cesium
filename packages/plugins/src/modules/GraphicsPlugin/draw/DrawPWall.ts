import * as Cesium from 'cesium'
import { DrawPPolyline } from './DrawPPolyline'
import { getCurrentMousePosition } from '@ktd-cesium/shared'
import { defaultMessages } from '../../TooltipPlugin/messages'
import { GraphicsEventType } from '../../EventPlugin'
import type { WallPrimitiveAttribute } from '../types'

/**
 * Primitive 方式的墙体绘制类
 * 使用 Primitive + WallGeometry
 *
 * 性能对比：
 * - Entity 方式：适合 < 50 个墙体
 * - Primitive 方式：适合 > 50 个墙体，性能提升显著
 */
export class DrawPWall extends DrawPPolyline {
  override type = 'wall-p'

  // 坐标位置相关
  protected override _minPointNum = 2
  protected override _maxPointNum = 9999

  /** 当前绘制的 Primitive */
  private currentPrimitive: Cesium.Primitive | null = null

  /** 墙体高度数组 */
  private maximumHeights: number[] = []
  private minimumHeights: number[] = []

  /**
   * 创建 Primitive
   */
  protected override createPrimitive(attribute: Record<string, unknown>): Cesium.Primitive | null {
    this._positions_draw = []
    this.maximumHeights = []
    this.minimumHeights = []

    const wallAttr = attribute as WallPrimitiveAttribute

    if (!this._minPointNum_def) this._minPointNum_def = this._minPointNum
    if (!this._maxPointNum_def) this._maxPointNum_def = this._maxPointNum

    if (wallAttr.config) {
      this._minPointNum = wallAttr.config.minPointNum || this._minPointNum_def
      this._maxPointNum = wallAttr.config.maxPointNum || this._maxPointNum_def
    } else {
      this._minPointNum = this._minPointNum_def
      this._maxPointNum = this._maxPointNum_def
    }

    // 创建 Primitive（初始为空几何）
    const style = wallAttr.style
    const geometryInstance = new Cesium.GeometryInstance({
      geometry: new Cesium.WallGeometry({
        positions: [],
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
    ;(this.currentPrimitive as unknown as Record<string, unknown>).attribute = wallAttr

    this.primitives!.add(this.currentPrimitive)
    this.primitive = this.currentPrimitive

    return this.currentPrimitive
  }

  /**
   * 更新高度数组
   */
  private updateHeights(): void {
    const positions = this._positions_draw as Cesium.Cartesian3[]
    const attr = (this.currentPrimitive as unknown as Record<string, unknown>)?.attribute as WallPrimitiveAttribute
    const extrudedHeight = attr?.style?.extrudedHeight || 100

    const len = positions.length
    this.maximumHeights = new Array(len)
    this.minimumHeights = new Array(len)

    for (let i = 0; i < len; i++) {
      const height = Cesium.Cartographic.fromCartesian(positions[i]).height
      this.minimumHeights[i] = height
      this.maximumHeights[i] = height + extrudedHeight
    }
  }

  /**
   * 更新墙体几何体
   */
  private updateWallGeometry(): void {
    if (!this.currentPrimitive) return

    const positions = this._positions_draw as Cesium.Cartesian3[]
    if (positions.length < 2) return

    // 更新高度数组
    this.updateHeights()

    // 移除旧的 Primitive
    if (this.primitives!.contains(this.currentPrimitive)) {
      this.primitives!.remove(this.currentPrimitive)
    }

    const attr = (this.currentPrimitive as unknown as Record<string, unknown>).attribute as WallPrimitiveAttribute

    // 创建新的几何体
    const geometryInstance = new Cesium.GeometryInstance({
      geometry: new Cesium.WallGeometry({
        positions: positions,
        minimumHeights: this.minimumHeights,
        maximumHeights: this.maximumHeights,
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
      }),
      attributes: ((this.currentPrimitive as unknown as Record<string, unknown>)._instanceAttributes as Record<
        string,
        unknown
      >) || {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
          this.parseColor(attr.style.color) || Cesium.Color.YELLOW.withAlpha(0.5)
        )
      }
    })

    this.currentPrimitive = new Cesium.Primitive({
      geometryInstances: geometryInstance,
      appearance: new Cesium.PerInstanceColorAppearance({
        closed: false,
        translucent: true
      }),
      show: attr.style.show !== undefined ? attr.style.show : true
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
        this.updateWallGeometry()

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
        this.updateWallGeometry()
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
        this.updateWallGeometry()

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

        if (Math.abs(mpt1.x - mpt2.x) < 1 && Math.abs(mpt1.y - mpt2.y) < 1 && Math.abs(mpt1.z - mpt2.z) < 1) {
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

    // 保存最终位置和高度
    const primitiveObj = this.currentPrimitive as unknown as Record<string, unknown>
    primitiveObj._positions_draw = this.getDrawPosition()
    primitiveObj._minimumHeights = this.minimumHeights
    primitiveObj._maximumHeights = this.maximumHeights

    // 绑定编辑对象
    // primitiveObj.editing = this.getEditClass(this.currentPrimitive as unknown as Cesium.Entity)
  }

  /**
   * 清理资源
   */
  override disable(hasWB?: boolean): this {
    super.disable(hasWB)

    // 如果是中断绘制，清理墙体
    if (hasWB && this.currentPrimitive && this.primitives) {
      if (this.primitives.contains(this.currentPrimitive)) {
        this.primitives.remove(this.currentPrimitive)
      }
    }

    this.currentPrimitive = null
    this.maximumHeights = []
    this.minimumHeights = []
    return this
  }
}
