import * as Cesium from 'cesium'
import { EditBase, type ExtendedEntity } from './EditBase'
import * as draggerCtl from './Dragger'
import type { EditController, WaterEditPrimitive, WaterEditEntity } from '../types'

/**
 * 水面编辑类
 * 支持：
 * - 多边形顶点拖拽
 * - 中间点插入新顶点
 * - 整体移动
 * - 右键删除顶点
 */
export class EditWater extends EditBase implements EditController {
  /** 绑定的 Primitive */
  protected bindedPrimitive: WaterEditPrimitive | null = null

  /** 更新几何体的回调 */
  protected updateGeometryCallback: (() => void) | null = null

  /**
   * 构造函数
   * @param primitive 水面 Primitive
   * @param viewer Cesium Viewer
   * @param dataSource 数据源
   * @param updateCallback 更新几何体回调
   */
  constructor(
    primitive: unknown,
    viewer: Cesium.Viewer,
    dataSource: Cesium.CustomDataSource,
    updateCallback?: () => void
  ) {
    // 创建一个虚拟 Entity 用于编辑系统
    const virtualEntity = new Cesium.Entity({
      id: 'water-edit-' + Date.now()
    })
    super(virtualEntity, viewer, dataSource)

    this.bindedPrimitive = primitive as WaterEditPrimitive
    this.updateGeometryCallback = updateCallback || null

    // 将 primitive 引用存储在 entity 上
    ;(this.entity as WaterEditEntity)._bindedPrimitive = this.bindedPrimitive

    // 获取位置
    if (this.bindedPrimitive._positions_draw) {
      this._positions_draw = this.bindedPrimitive._positions_draw
    }
  }

  /**
   * 激活编辑
   */
  override activate(): this {
    if (this._enabled) {
      return this
    }
    this._enabled = true

    // 获取位置
    if (this.bindedPrimitive?._positions_draw) {
      this._positions_draw = this.bindedPrimitive._positions_draw
    }

    if (!this._positions_draw || this._positions_draw.length < 3) {
      console.warn('EditWater: No valid positions found')
      return this
    }

    this._minPointNum = 3

    this.bindDraggers()
    this.bindEvent()

    this.fire('edit-start', {
      edittype: 'water',
      primitive: this.bindedPrimitive
    })

    return this
  }

  /**
   * 禁用编辑
   */
  override disable(): this {
    if (!this._enabled) {
      return this
    }
    this._enabled = false

    this.destroyEvent()
    this.destroyDraggers()

    this.fire('edit-stop', {
      edittype: 'water',
      primitive: this.bindedPrimitive
    })

    this.tooltip?.setVisible(false)

    return this
  }

  /**
   * 绑定拖拽点
   */
  protected override bindDraggers(): void {
    if (!this._positions_draw) return

    const positions = this._positions_draw

    // 创建顶点拖拽点
    for (let i = 0; i < positions.length; i++) {
      const position = positions[i]
      this.createDragger(position, i, draggerCtl.PointType.Control, '拖拽移动点')
    }

    // 创建中间点（用于添加新顶点）
    for (let i = 0; i < positions.length; i++) {
      const nextIndex = (i + 1) % positions.length
      const midPosition = Cesium.Cartesian3.midpoint(positions[i], positions[nextIndex], new Cesium.Cartesian3())
      this.createMidDragger(midPosition, i)
    }
  }

  /**
   * 创建顶点拖拽点
   */
  private createDragger(
    position: Cesium.Cartesian3,
    index: number,
    pointType: draggerCtl.PointType,
    tooltip: string
  ): void {
    const dragger = draggerCtl.createDragger(this.dataSource, {
      position: position,
      type: pointType,
      tooltip: tooltip,
      onDrag: (dragger: ExtendedEntity, newPosition: Cesium.Cartesian3) => {
        this.onDragVertex(dragger, newPosition)
      }
    })

    dragger.index = index
    this.draggers.push(dragger)
  }

  /**
   * 创建中间点拖拽点（半透明，拖拽后插入新顶点）
   */
  private createMidDragger(position: Cesium.Cartesian3, afterIndex: number): void {
    const dragger = draggerCtl.createDragger(this.dataSource, {
      position: position,
      type: draggerCtl.PointType.AddMidPoint,
      tooltip: '拖拽添加点',
      onDrag: (dragger: ExtendedEntity, newPosition: Cesium.Cartesian3) => {
        this.onDragMidPoint(dragger, newPosition, afterIndex)
      }
    })

    // 设置半透明样式
    if (dragger.point) {
      dragger.point.color = new Cesium.ConstantProperty(Cesium.Color.CYAN.withAlpha(0.6))
      dragger.point.pixelSize = new Cesium.ConstantProperty(8)
    }

    dragger.index = afterIndex
    this.draggers.push(dragger)
  }

  /**
   * 顶点拖拽处理
   */
  private onDragVertex(dragger: ExtendedEntity, newPosition: Cesium.Cartesian3): void {
    if (!this._positions_draw || dragger.index === undefined) return

    // 更新位置
    this._positions_draw[dragger.index] = newPosition

    // 同步到 Primitive
    if (this.bindedPrimitive) {
      this.bindedPrimitive._positions_draw = this._positions_draw
    }

    // 触发几何体更新
    this.updateGeometry()
  }

  /**
   * 中间点拖拽处理（插入新顶点）
   */
  private onDragMidPoint(_dragger: ExtendedEntity, newPosition: Cesium.Cartesian3, afterIndex: number): void {
    if (!this._positions_draw) return

    // 在 afterIndex 后插入新顶点
    const insertIndex = afterIndex + 1
    this._positions_draw.splice(insertIndex, 0, newPosition)

    // 同步到 Primitive
    if (this.bindedPrimitive) {
      this.bindedPrimitive._positions_draw = this._positions_draw
    }

    // 更新拖拽点
    this.updateDraggers()

    // 触发几何体更新
    this.updateGeometry()
  }

  /**
   * 更新几何体
   */
  private updateGeometry(): void {
    if (this.updateGeometryCallback) {
      this.updateGeometryCallback()
    }
  }

  /**
   * 更新编辑属性
   */
  updateAttrForEditing(): void {
    this.updateGeometry()
  }

  /**
   * 删除顶点
   */
  protected override deletePointForDragger(dragger: ExtendedEntity, position: Cesium.Cartesian2): boolean {
    if (!this._positions_draw) return false

    if (this._positions_draw.length <= this._minPointNum) {
      this.tooltip?.showAt(position, `至少需要 ${this._minPointNum} 个点`)
      return false
    }

    const index = dragger.index
    if (index !== undefined && index >= 0 && index < this._positions_draw.length) {
      this._positions_draw.splice(index, 1)

      // 同步到 Primitive
      if (this.bindedPrimitive) {
        this.bindedPrimitive._positions_draw = this._positions_draw
      }

      this.updateDraggers()
      this.updateGeometry()
      return true
    }

    return false
  }

  /**
   * 设置位置
   */
  override setPositions(positions: Cesium.Cartesian3[]): void {
    this._positions_draw = positions

    if (this.bindedPrimitive) {
      this.bindedPrimitive._positions_draw = positions
    }

    if (this._enabled) {
      this.updateDraggers()
      this.updateGeometry()
    }
  }

  /**
   * 获取位置
   */
  getPositions(): Cesium.Cartesian3[] {
    return this._positions_draw?.map((p) => p.clone()) || []
  }
}
