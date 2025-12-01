/**
 * 方位角测量
 * 测量两点连线相对于正北方向的夹角
 */

import * as Cesium from 'cesium'
import { MeasureBase } from '../MeasureBase'
import { MeasureResult } from '../types'
import type { DrawConfig } from '../../GraphicsPlugin/types'

/**
 * 方位角测量类
 */
export class MeasureAngle extends MeasureBase {
  measureType = 'angle' as const

  private pointEntities: Cesium.Entity[] = []
  private lineEntity: Cesium.Entity | null = null
  private northLineEntity: Cesium.Entity | null = null
  private labelEntity: Cesium.Entity | null = null
  private positions: Cesium.Cartesian3[] = []

  constructor(opts: DrawConfig) {
    super(opts)
  }

  /**
   * 创建要素
   */
  protected override createFeature(_attribute: Record<string, unknown>): Cesium.Entity | null {
    // 方位角测量不需要预先创建实体
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
        text: '方位角: 0°'
      }
    }

    const angle = this.calculateAngle(positions[0], positions[1])
    const distance = this.calculateDistance(positions[0], positions[1])

    return {
      type: this.measureType,
      value: angle,
      positions: [...positions],
      text: `方位角: ${this.formatAngle(angle)}\n距离: ${this.formatDistance(distance)}`
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

    // 创建/更新测量线
    if (positions.length >= 2) {
      if (this.lineEntity) {
        this.dataSource?.entities.remove(this.lineEntity)
      }
      this.lineEntity = this.createLineEntity(positions)

      // 创建指北辅助线
      if (this.northLineEntity) {
        this.dataSource?.entities.remove(this.northLineEntity)
      }

      const carto1 = Cesium.Cartographic.fromCartesian(positions[0])

      // 计算距离用于绘制指北线
      const distance = this.calculateDistance(positions[0], positions[1])
      const northDistance = Math.min(distance * 0.5, 1000) // 指北线长度

      // 创建正北方向的参考点
      const northCarto = new Cesium.Cartographic(
        carto1.longitude,
        carto1.latitude + Cesium.Math.toRadians(northDistance / 111000), // 约111km/度
        carto1.height
      )
      const northPosition = Cesium.Cartographic.toCartesian(northCarto)

      this.northLineEntity = this.createLineEntity([positions[0], northPosition], true)

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

    // 方位角测量需要两个点
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
