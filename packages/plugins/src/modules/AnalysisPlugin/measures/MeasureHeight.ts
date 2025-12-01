/**
 * 高度差测量
 * 测量两点之间的高度差
 */

import * as Cesium from 'cesium'
import { MeasureBase } from '../MeasureBase'
import { MeasureResult } from '../types'
import type { DrawConfig } from '../../GraphicsPlugin/types'

/**
 * 高度差测量类
 */
export class MeasureHeight extends MeasureBase {
  measureType = 'height' as const

  private pointEntities: Cesium.Entity[] = []
  private lineEntity: Cesium.Entity | null = null
  private auxiliaryLineEntity: Cesium.Entity | null = null
  private labelEntity: Cesium.Entity | null = null
  private positions: Cesium.Cartesian3[] = []

  constructor(opts: DrawConfig) {
    super(opts)
  }

  /**
   * 创建要素
   */
  protected override createFeature(_attribute: Record<string, unknown>): Cesium.Entity | null {
    // 高度差测量不需要预先创建实体
    return null
  }

  /**
   * 绑定事件
   */
  protected override bindEvent(): void {
    this.bindMoveEvent((screenPosition) => {
      const worldPosition = this.getWorldPosition(screenPosition)
      if (worldPosition) {
        this.onMouseMove(worldPosition)
      }
    })

    this.bindClickEvent((screenPosition) => {
      const worldPosition = this.getWorldPosition(screenPosition)
      if (worldPosition) {
        this.onLeftClick(worldPosition)
      }
    })

    this.bindRightClickEvent(() => {
      this.onRightClick()
    })

    this.bindDoubleClickEvent(() => {
      this.onRightClick()
    })

    // 绑定移动端长按事件
    this.bindLongPressEvent(() => {
      this.onRightClick()
    })
  }

  /**
   * 计算量算结果
   */
  protected calculateResult(positions: Cesium.Cartesian3[]): MeasureResult {
    if (positions.length < 2) {
      return {
        type: this.measureType,
        value: 0,
        positions: [...positions],
        text: '高度差: 0 m'
      }
    }

    const heightDiff = this.calculateHeightDiff(positions[0], positions[1])
    const horizontalDistance = this.calculateDistance(positions[0], positions[1])
    const carto1 = Cesium.Cartographic.fromCartesian(positions[0])
    const carto2 = Cesium.Cartographic.fromCartesian(positions[1])

    return {
      type: this.measureType,
      value: heightDiff,
      positions: [...positions],
      text: `高度差: ${this.formatDistance(heightDiff)}\n起点高程: ${this.formatDistance(carto1.height)}\n终点高程: ${this.formatDistance(carto2.height)}\n水平距离: ${this.formatDistance(horizontalDistance)}`
    }
  }

  /**
   * 更新显示
   */
  protected updateDisplay(positions: Cesium.Cartesian3[]): void {
    if (positions.length === 0) return

    // 创建/更新点实体
    positions.forEach((position, index) => {
      if (!this.pointEntities[index]) {
        this.pointEntities[index] = this.createPointEntity(position)
      }
    })

    // 创建/更新连线
    if (positions.length >= 2) {
      if (this.lineEntity) {
        this.dataSource?.entities.remove(this.lineEntity)
      }
      this.lineEntity = this.createLineEntity(positions)

      // 创建辅助线（从起点到终点的垂直投影）
      const carto1 = Cesium.Cartographic.fromCartesian(positions[0])
      const carto2 = Cesium.Cartographic.fromCartesian(positions[1])

      // 在起点高度创建水平投影点
      const projectedPos = Cesium.Cartesian3.fromRadians(carto2.longitude, carto2.latitude, carto1.height)

      if (this.auxiliaryLineEntity) {
        this.dataSource?.entities.remove(this.auxiliaryLineEntity)
      }
      this.auxiliaryLineEntity = this.createLineEntity([projectedPos, positions[1]], true)

      // 计算并更新结果
      this.result = this.calculateResult(positions)

      // 创建/更新标签
      const midpoint = Cesium.Cartesian3.midpoint(positions[0], positions[1], new Cesium.Cartesian3())
      if (this.labelEntity) {
        this.dataSource?.entities.remove(this.labelEntity)
      }
      this.labelEntity = this.createLabelEntity(midpoint, this.result.text!)
    }

    // 触发更新事件
    if (this.liveUpdate && positions.length >= 2) {
      this.fire('measure:update', { result: this.result })
    }
  }

  /**
   * 开始绘制
   */
  override enable(): this {
    super.enable()
    this.fire('measure:start', { type: this.measureType })
    return this
  }

  /**
   * 完成绘制
   */
  override disable(hasWB = true): this {
    if (this.positions.length >= 2) {
      this.result = this.calculateResult(this.positions)
      this.fire('measure:complete', { result: this.result })
    }
    return super.disable(hasWB)
  }

  /**
   * 鼠标移动事件
   */
  protected onMouseMove(position: Cesium.Cartesian3): void {
    if (this.positions.length === 0) return

    const tempPositions = [...this.positions, position]
    this.updateDisplay(tempPositions)
  }

  /**
   * 左键点击事件
   */
  protected onLeftClick(position: Cesium.Cartesian3): void {
    // 检查顶点吸附
    const screenPos = Cesium.SceneTransforms.worldToWindowCoordinates(this.viewer.scene, position)
    if (screenPos) {
      const snappedPos = this.snapToVertex(screenPos)
      if (snappedPos) {
        position = snappedPos
      }
    }

    this.positions.push(position)
    this.updateDisplay(this.positions)
    this.fire('measure:pointAdd', { position, positions: [...this.positions] })

    // 高度差测量只需要两个点
    if (this.positions.length >= 2) {
      this.disable()
    }
  }

  /**
   * 右键点击事件 - 完成测量
   */
  protected onRightClick(): void {
    if (this.positions.length >= 2) {
      this.disable()
    }
  }
}
