/**
 * 贴地距离测量
 * 测量贴合地形表面的距离
 */

import * as Cesium from 'cesium'
import { MeasureBase } from '../MeasureBase'
import { MeasureResult } from '../types'
import type { DrawConfig } from '../../GraphicsPlugin/types'

/**
 * 贴地距离测量类
 */
export class MeasureSurfaceDistance extends MeasureBase {
  measureType = 'surfaceDistance' as const

  private lineEntity: Cesium.Entity | null = null
  private pointEntities: Cesium.Entity[] = []
  private labelEntity: Cesium.Entity | null = null
  private positions: Cesium.Cartesian3[] = []

  constructor(opts: DrawConfig) {
    super(opts)
  }

  /**
   * 创建要素
   */
  protected override createFeature(_attribute: Record<string, unknown>): Cesium.Entity | null {
    // 贴地距离测量不需要预先创建实体
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
   * 计算贴地距离
   * 通过在两点之间插值多个点来近似贴地距离
   */
  private calculateSurfaceDistance(pos1: Cesium.Cartesian3, pos2: Cesium.Cartesian3): number {
    const carto1 = Cesium.Cartographic.fromCartesian(pos1)
    const carto2 = Cesium.Cartographic.fromCartesian(pos2)

    // 计算两点之间需要插值的数量（基于距离）
    const straightDistance = Cesium.Cartesian3.distance(pos1, pos2)
    const steps = Math.max(Math.ceil(straightDistance / 100), 10) // 每100米一个插值点，最少10个

    let totalDistance = 0
    let prevPos = pos1

    for (let i = 1; i <= steps; i++) {
      const fraction = i / steps
      const carto = new Cesium.Cartographic(
        Cesium.Math.lerp(carto1.longitude, carto2.longitude, fraction),
        Cesium.Math.lerp(carto1.latitude, carto2.latitude, fraction)
      )

      // 获取地形高度
      const height = this.viewer.scene.globe.getHeight(carto) || 0
      carto.height = height

      const currentPos = Cesium.Cartographic.toCartesian(carto)
      totalDistance += Cesium.Cartesian3.distance(prevPos, currentPos)
      prevPos = currentPos
    }

    return totalDistance
  }

  /**
   * 计算总贴地距离
   */
  private calculateTotalSurfaceDistance(positions: Cesium.Cartesian3[]): number {
    if (positions.length < 2) return 0

    let totalDistance = 0
    for (let i = 0; i < positions.length - 1; i++) {
      totalDistance += this.calculateSurfaceDistance(positions[i], positions[i + 1])
    }
    return totalDistance
  }

  /**
   * 计算量算结果
   */
  protected calculateResult(positions: Cesium.Cartesian3[]): MeasureResult {
    const totalDistance = this.calculateTotalSurfaceDistance(positions)
    return {
      type: this.measureType,
      value: totalDistance,
      positions: [...positions],
      text: `贴地距离: ${this.formatDistance(totalDistance)}`
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

    // 创建/更新线实体（贴地）
    if (positions.length >= 2) {
      if (this.lineEntity) {
        this.dataSource?.entities.remove(this.lineEntity)
      }
      // 贴地线需要设置 clampToGround
      this.lineEntity = this.dataSource!.entities.add({
        polyline: {
          positions,
          width: this.style.lineWidth,
          material: Cesium.Color.fromCssColorString(this.style.lineColor),
          clampToGround: true
        }
      })
    }

    // 更新中间点
    this.updateMidpoints(positions)

    // 计算并更新结果
    this.result = this.calculateResult(positions)

    // 创建/更新标签
    if (positions.length >= 2) {
      const lastPosition = positions[positions.length - 1]
      if (this.labelEntity) {
        this.dataSource?.entities.remove(this.labelEntity)
      }
      this.labelEntity = this.createLabelEntity(lastPosition, this.result.text!)

      // 添加分段距离标签
      for (let i = 0; i < positions.length - 1; i++) {
        const segmentDistance = this.calculateSurfaceDistance(positions[i], positions[i + 1])
        const midpoint = Cesium.Cartesian3.midpoint(positions[i], positions[i + 1], new Cesium.Cartesian3())
        this.createLabelEntity(midpoint, this.formatDistance(segmentDistance), new Cesium.Cartesian2(0, -10))
      }
    }

    // 触发更新事件
    if (this.liveUpdate) {
      this.fire('measure:update', { result: this.result })
    }
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
  }

  /**
   * 右键点击事件 - 完成测量
   */
  protected onRightClick(): void {
    this.disable()
  }
}
