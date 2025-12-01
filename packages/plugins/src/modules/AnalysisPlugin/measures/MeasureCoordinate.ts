/**
 * 坐标测量
 * 测量点的经纬度和高程
 */

import * as Cesium from 'cesium'
import { MeasureBase } from '../MeasureBase'
import { MeasureResult } from '../types'
import type { DrawConfig } from '../../GraphicsPlugin/types'

/**
 * 坐标测量类
 */
export class MeasureCoordinate extends MeasureBase {
  measureType = 'coordinate' as const

  private pointEntity: Cesium.Entity | null = null
  private labelEntity: Cesium.Entity | null = null
  private positions: Cesium.Cartesian3[] = []

  constructor(opts: DrawConfig) {
    super(opts)
  }

  /**
   * 创建要素
   */
  protected override createFeature(_attribute: Record<string, unknown>): Cesium.Entity | null {
    // 坐标测量不需要预先创建实体
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

    // 注意：坐标测量是单点测量，点击即完成，不需要长按事件

    this.bindRightClickEvent(() => {
      this.onRightClick()
    })

    this.bindDoubleClickEvent(() => {
      this.onRightClick()
    })
  }

  /**
   * 计算量算结果
   */
  protected calculateResult(positions: Cesium.Cartesian3[]): MeasureResult {
    if (positions.length === 0) {
      return {
        type: this.measureType,
        value: { lng: 0, lat: 0, height: 0 },
        positions: [],
        text: ''
      }
    }

    const coordinate = this.formatCoordinate(positions[0])

    return {
      type: this.measureType,
      value: coordinate,
      positions: [...positions],
      text: `经度: ${coordinate.lng.toFixed(6)}°\n纬度: ${coordinate.lat.toFixed(6)}°\n高程: ${coordinate.height.toFixed(2)} m`
    }
  }

  /**
   * 更新显示
   */
  protected updateDisplay(positions: Cesium.Cartesian3[]): void {
    if (positions.length === 0) return

    // 创建/更新点实体
    if (!this.pointEntity) {
      this.pointEntity = this.createPointEntity(positions[0])
    }

    // 计算并更新结果
    this.result = this.calculateResult(positions)

    // 创建/更新标签
    if (this.labelEntity) {
      this.dataSource?.entities.remove(this.labelEntity)
    }
    this.labelEntity = this.createLabelEntity(positions[0], this.result.text!)

    // 触发更新事件
    if (this.liveUpdate) {
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
    if (this.positions.length >= 1) {
      this.result = this.calculateResult(this.positions)
      this.fire('measure:complete', { result: this.result })
    }
    return super.disable(hasWB)
  }

  /**
   * 鼠标移动事件
   */
  protected onMouseMove(position: Cesium.Cartesian3): void {
    const tempPositions = [position]
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

    // 坐标测量只需要一个点，点击后立即完成
    this.disable()
  }

  /**
   * 右键点击事件 - 完成测量
   */
  protected onRightClick(): void {
    if (this.positions.length >= 1) {
      this.disable()
    }
  }
}
