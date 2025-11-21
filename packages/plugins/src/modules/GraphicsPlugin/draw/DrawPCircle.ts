import * as Cesium from 'cesium'
import { DrawPPolyline } from './DrawPPolyline'
import { getCurrentMousePosition } from '@ktd-cesium/shared'
import { defaultMessages } from '../../TooltipPlugin/messages'
import { GraphicsEventType } from '../../EventPlugin'
import type { CirclePrimitiveAttribute } from '../types'

/**
 * Primitive 方式的圆形绘制类
 * 使用 GroundPrimitive，将圆形转换为多边形
 *
 * 性能对比：
 * - Entity 方式：适合 < 50 个圆形
 * - Primitive 方式：适合 > 50 个圆形，性能提升显著
 *
 * 注意：圆形通过多边形近似，granularity 控制细分数量
 */
export class DrawPCircle extends DrawPPolyline {
  override type = 'circle-p'

  // 坐标位置相关
  protected override _minPointNum = 2 // 中心点和半径点
  protected override _maxPointNum = 2

  /** 当前绘制的 GroundPrimitive */
  private currentGroundPrimitive: Cesium.GroundPrimitive | null = null

  /** 圆心 */
  private center: Cesium.Cartesian3 | null = null

  /** 半径 */
  private radius = 0

  /**
   * 创建 GroundPrimitive
   */
  protected override createPrimitive(attribute: Record<string, unknown>): Cesium.GroundPrimitive | null {
    this._positions_draw = []
    this.center = null
    this.radius = 0

    const circleAttr = attribute as CirclePrimitiveAttribute

    // 创建 GroundPrimitive
    const style = circleAttr.style
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

    // 保存配置
    ;(this.currentGroundPrimitive as unknown as Record<string, unknown>).attribute = circleAttr

    this.primitives!.add(this.currentGroundPrimitive)
    this.primitive = this.currentGroundPrimitive

    return this.currentGroundPrimitive
  }

  /**
   * 生成圆形的多边形坐标
   */
  private generateCirclePositions(center: Cesium.Cartesian3, radius: number, granularity = 64): Cesium.Cartesian3[] {
    const positions: Cesium.Cartesian3[] = []
    const cartographic = Cesium.Cartographic.fromCartesian(center)
    const longitude = cartographic.longitude
    const latitude = cartographic.latitude
    const height = cartographic.height

    for (let i = 0; i < granularity; i++) {
      const angle = (i / granularity) * Math.PI * 2
      const dx = radius * Math.cos(angle)
      const dy = radius * Math.sin(angle)

      // 将相对距离转换为经纬度偏移
      const dLon = dx / (Cesium.Ellipsoid.WGS84.maximumRadius * Math.cos(latitude))
      const dLat = dy / Cesium.Ellipsoid.WGS84.maximumRadius

      const position = Cesium.Cartesian3.fromRadians(longitude + dLon, latitude + dLat, height)
      positions.push(position)
    }

    return positions
  }

  /**
   * 更新圆形几何体
   */
  private updateCircleGeometry(): void {
    if (!this.currentGroundPrimitive || !this.center || this.radius <= 0) return

    const positions = this._positions_draw as Cesium.Cartesian3[]
    if (positions.length < 2) return

    // 移除旧的 Primitive
    if (this.primitives!.contains(this.currentGroundPrimitive)) {
      this.primitives!.remove(this.currentGroundPrimitive)
    }

    // 获取配置
    const attr = (this.currentGroundPrimitive as unknown as Record<string, unknown>).attribute as CirclePrimitiveAttribute
    const granularity = attr.config?.granularity || 64

    // 生成圆形多边形坐标
    const circlePositions = this.generateCirclePositions(this.center, this.radius, granularity)

    // 保存当前状态
    const oldShow = this.currentGroundPrimitive.show
    const oldClassificationType = this.currentGroundPrimitive.classificationType

    // 创建新的几何体
    const geometryInstance = new Cesium.GeometryInstance({
      geometry: new Cesium.PolygonGeometry({
        polygonHierarchy: new Cesium.PolygonHierarchy(circlePositions),
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
      }),
      attributes: (this.currentGroundPrimitive as unknown as Record<string, unknown>)._instanceAttributes as Record<string, unknown> || {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.YELLOW.withAlpha(0.5))
      }
    })

    this.currentGroundPrimitive = new Cesium.GroundPrimitive({
      geometryInstances: geometryInstance,
      appearance: new Cesium.PerInstanceColorAppearance({
        closed: false
      }),
      show: oldShow,
      classificationType: oldClassificationType
    })

    // 保留配置
    ;(this.currentGroundPrimitive as unknown as Record<string, unknown>).attribute = attr

    this.primitives!.add(this.currentGroundPrimitive)
    this.primitive = this.currentGroundPrimitive
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

        if (positions.length === 1) {
          // 第一个点：圆心
          this.center = point
        } else if (positions.length === 2) {
          // 第二个点：半径点
          this.radius = Cesium.Cartesian3.distance(this.center!, point)
          this.updateCircleGeometry()
          this.disable()
        }

        this.fire(GraphicsEventType.DRAW_ADD_POINT, {
          drawtype: this.type,
          primitive: this.currentGroundPrimitive,
          position: point,
          positions: positions
        })
      }
    })

    // 鼠标移动或触摸移动
    this.bindMoveEvent((position: Cesium.Cartesian2) => {
      // 显示提示信息
      if (positions.length === 0) {
        this.tooltip!.showAt(position, defaultMessages.draw.circle.start)
      } else {
        this.tooltip!.showAt(position, defaultMessages.draw.circle.end)
      }

      const point = getCurrentMousePosition(this.viewer!.scene, position, null)
      if (point) {
        if (positions.length === 1) {
          // 已有圆心，动态显示半径
          if (lastPointTemporary) {
            positions.pop()
          }
          lastPointTemporary = true

          positions.push(point)
          this.radius = Cesium.Cartesian3.distance(this.center!, point)
          this.updateCircleGeometry()

          this.fire(GraphicsEventType.DRAW_MOUSE_MOVE, {
            drawtype: this.type,
            primitive: this.currentGroundPrimitive,
            position: point,
            positions: positions
          })
        }
      }
    })
  }

  /**
   * Primitive 绘制结束
   */
  protected override finishPrimitive(): void {
    if (!this.currentGroundPrimitive) return

    // 保存最终位置
    const primitiveObj = this.currentGroundPrimitive as unknown as Record<string, unknown>
    primitiveObj._positions_draw = this.getDrawPosition()
    primitiveObj.center = this.center
    primitiveObj.radius = this.radius

    // 绑定编辑对象
    // primitiveObj.editing = this.getEditClass(this.currentGroundPrimitive as unknown as Cesium.Entity)
  }

  /**
   * 清理资源
   */
  override disable(hasWB?: boolean): this {
    super.disable(hasWB)

    // 如果是中断绘制，清理圆形
    if (hasWB && this.currentGroundPrimitive && this.primitives) {
      if (this.primitives.contains(this.currentGroundPrimitive)) {
        this.primitives.remove(this.currentGroundPrimitive)
      }
    }

    this.currentGroundPrimitive = null
    this.center = null
    this.radius = 0
    return this
  }
}
