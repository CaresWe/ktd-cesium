import * as Cesium from 'cesium'
import { DrawPPolyline } from './DrawPPolyline'
import { getCurrentMousePosition, addPositionsHeight } from '@ktd-cesium/shared'
import { defaultMessages } from '../../TooltipPlugin/messages'
import { GraphicsEventType } from '../../EventPlugin'
import type { PolygonPrimitiveAttribute } from '../types'

/**
 * Primitive 方式的多边形绘制类
 * 使用 GroundPrimitive，适合大量贴地多边形绘制
 *
 * 性能对比：
 * - Entity 方式：适合 < 50 个多边形
 * - Primitive 方式：适合 > 50 个多边形，性能提升显著
 *
 * 注意：GroundPrimitive 主要用于贴地多边形
 */
export class DrawPPolygon extends DrawPPolyline {
  override type = 'polygon-p'

  // 坐标位置相关
  protected override _minPointNum = 3 // 至少需要点的个数
  protected override _maxPointNum = 9999 // 最多允许点的个数

  /** 当前绘制的 GroundPrimitive */
  protected currentGroundPrimitive: Cesium.GroundPrimitive | null = null

  /**
   * 创建 GroundPrimitive
   */
  protected override createPrimitive(attribute: Record<string, unknown>): Cesium.Primitive | Cesium.GroundPrimitive | null {
    this._positions_draw = []

    const polygonAttr = attribute as PolygonPrimitiveAttribute

    if (!this._minPointNum_def) this._minPointNum_def = this._minPointNum
    if (!this._maxPointNum_def) this._maxPointNum_def = this._maxPointNum

    if (polygonAttr.config) {
      // 允许外部传入
      this._minPointNum = polygonAttr.config.minPointNum || this._minPointNum_def
      this._maxPointNum = polygonAttr.config.maxPointNum || this._maxPointNum_def
    } else {
      this._minPointNum = this._minPointNum_def
      this._maxPointNum = this._maxPointNum_def
    }

    // 创建 GroundPrimitive
    const style = polygonAttr.style
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

    this.primitives!.add(this.currentGroundPrimitive)
    this.primitive = this.currentGroundPrimitive

    return this.currentGroundPrimitive
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
        const polygonAttr = this.currentGroundPrimitive as any
        if (polygonAttr?.attribute?.config?.addHeight) {
          point = addPositionsHeight(point, polygonAttr.attribute.config.addHeight) as Cesium.Cartesian3
        }

        positions.push(point)
        this.updatePolygonGeometry()

        this.fire(GraphicsEventType.DRAW_ADD_POINT, {
          drawtype: this.type,
          primitive: this.currentGroundPrimitive,
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
          primitive: this.currentGroundPrimitive,
          position: point,
          positions: positions
        })

        positions.push(point)
        this.updatePolygonGeometry()
      }
    })

    // 鼠标移动或触摸移动
    this.bindMoveEvent((position: Cesium.Cartesian2) => {
      // 显示提示信息
      if (positions.length <= 1) {
        this.tooltip!.showAt(position, defaultMessages.draw.polygon.start)
      } else if (positions.length < this._minPointNum) {
        this.tooltip!.showAt(position, defaultMessages.draw.polygon.cont)
      } else if (positions.length >= this._maxPointNum) {
        this.tooltip!.showAt(position, defaultMessages.draw.polygon.end2)
      } else {
        this.tooltip!.showAt(position, defaultMessages.draw.polygon.end)
      }

      const point = getCurrentMousePosition(this.viewer!.scene, position, null)
      if (point) {
        if (lastPointTemporary) {
          positions.pop()
        }
        lastPointTemporary = true

        positions.push(point)
        this.updatePolygonGeometry()

        this.fire(GraphicsEventType.DRAW_MOUSE_MOVE, {
          drawtype: this.type,
          primitive: this.currentGroundPrimitive,
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
   * 更新多边形几何体
   */
  protected updatePolygonGeometry(): void {
    if (!this.currentGroundPrimitive) return

    const positions = this._positions_draw as Cesium.Cartesian3[]
    if (positions.length < 2) return

    // 移除旧的 Primitive
    if (this.primitives!.contains(this.currentGroundPrimitive)) {
      this.primitives!.remove(this.currentGroundPrimitive)
    }

    // 创建新的几何体
    const geometryInstance = new Cesium.GeometryInstance({
      geometry: new Cesium.PolygonGeometry({
        polygonHierarchy: new Cesium.PolygonHierarchy(positions),
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
      }),
      attributes: (this.currentGroundPrimitive as any)._instanceAttributes || {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.YELLOW.withAlpha(0.5))
      }
    })

    this.currentGroundPrimitive = new Cesium.GroundPrimitive({
      geometryInstances: geometryInstance,
      appearance: new Cesium.PerInstanceColorAppearance({
        closed: false
      }),
      show: (this.currentGroundPrimitive as any).show,
      classificationType: (this.currentGroundPrimitive as any).classificationType
    })

    this.primitives!.add(this.currentGroundPrimitive)
    this.primitive = this.currentGroundPrimitive
  }

  /**
   * 外部控制，完成绘制（支持双击、长按或手动调用结束）
   */
  override endDraw(): this {
    if (!this._enabled) {
      return this
    }

    const positions = this._positions_draw as Cesium.Cartesian3[]
    if (positions.length < this._minPointNum) return this // 点数不够
    this.updatePolygonGeometry()
    this.disable()
    return this
  }

  /**
   * Primitive 绘制结束
   */
  protected override finishPrimitive(): void {
    if (!this.currentGroundPrimitive) return

    // 保存最终位置
    ;(this.currentGroundPrimitive as any)._positions_draw = this.getDrawPosition()

    // 绑定编辑对象
    // (this.currentGroundPrimitive as any).editing = this.getEditClass(this.currentGroundPrimitive as unknown as Cesium.Entity)
  }

  /**
   * 清理资源
   */
  override disable(hasWB?: boolean): this {
    super.disable(hasWB)

    // 如果是中断绘制，清理多边形
    if (hasWB && this.currentGroundPrimitive && this.primitives) {
      if (this.primitives.contains(this.currentGroundPrimitive)) {
        this.primitives.remove(this.currentGroundPrimitive)
      }
    }

    this.currentGroundPrimitive = null
    return this
  }

  override toEntityType(): string {
    return 'polygon'
  }

  override removePrimitive(): void {
    if (this.currentGroundPrimitive && this.primitives) {
      if (this.primitives.contains(this.currentGroundPrimitive)) {
        this.primitives.remove(this.currentGroundPrimitive)
      }
    }
    this.currentGroundPrimitive = null
    this.primitive = null
  }
}
