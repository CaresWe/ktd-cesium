import * as Cesium from 'cesium'
import { DrawPPolygon } from './DrawPPolygon'

/**
 * Primitive 方式的扩展多边形绘制类
 * 用于外部扩展使用，绘制的点与显示的点不一致的标绘
 * 子类需要重写 getShowPositions 方法
 *
 * 性能对比：
 * - Entity 方式：适合 < 50 个扩展多边形
 * - Primitive 方式：适合 > 50 个扩展多边形，性能提升显著
 */
export class DrawPPolygonEx extends DrawPPolygon {
  override type = 'polygonEx-p'

  /** 显示的多边形坐标 */
  protected _positions_show: Cesium.Cartesian3[] | null = null

  /**
   * 获取绘制位置（返回显示坐标）
   */
  override getDrawPosition(): Cesium.Cartesian3[] | Cesium.Cartesian3 | null {
    return this._positions_show || this._positions_draw
  }

  /**
   * 更新多边形几何体（覆盖父类方法）
   */
  protected updatePolygonGeometry(): void {
    const positions = this._positions_draw as Cesium.Cartesian3[]

    if (positions.length < this._minPointNum) {
      this._positions_show = positions
      return
    }

    // 生成显示坐标
    const primitiveObj = this.currentGroundPrimitive as unknown as Record<string, unknown>
    const attribute = primitiveObj?.attribute as Record<string, unknown> | undefined
    this._positions_show = this.getShowPositions(positions, attribute)

    // 调用父类方法更新几何体，但使用 _positions_show
    if (!this.currentGroundPrimitive || !this._positions_show || this._positions_show.length < 2) return

    // 保存当前状态
    const oldShow = this.currentGroundPrimitive.show
    const oldClassificationType = this.currentGroundPrimitive.classificationType
    const attr = (this.currentGroundPrimitive as unknown as Record<string, unknown>).attribute

    // 移除旧的 Primitive
    if (this.primitives!.contains(this.currentGroundPrimitive)) {
      this.primitives!.remove(this.currentGroundPrimitive)
    }

    // 创建新的几何体
    const geometryInstance = new Cesium.GeometryInstance({
      geometry: new Cesium.PolygonGeometry({
        polygonHierarchy: new Cesium.PolygonHierarchy(this._positions_show),
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
   * 子类中重写，根据标绘绘制的点，生成显示的边界点
   * @param positions 原始绘制点
   * @param _attribute 属性
   * @returns 显示点位
   */
  protected getShowPositions(
    positions: Cesium.Cartesian3[],
    _attribute?: Record<string, unknown>
  ): Cesium.Cartesian3[] {
    return positions
  }

  /**
   * Primitive 绘制结束（覆盖父类方法）
   */
  protected override finishPrimitive(): void {
    if (!this.currentGroundPrimitive) return

    // 保存原始绘制点和显示点
    const primitiveObj = this.currentGroundPrimitive as unknown as Record<string, unknown>
    primitiveObj._positions_draw = this._positions_draw
    primitiveObj._positions_show = this._positions_show

    // 绑定编辑对象
    // primitiveObj.editing = this.getEditClass(this.currentGroundPrimitive as unknown as Cesium.Entity)

    // 清理临时变量
    this._positions_show = null
  }

  /**
   * 清理资源（覆盖父类方法）
   */
  override disable(hasWB?: boolean): this {
    super.disable(hasWB)
    this._positions_show = null
    return this
  }
}
