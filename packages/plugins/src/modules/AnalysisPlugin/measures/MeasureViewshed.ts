/**
 * 通视分析（视线分析）
 * 分析从观察点到目标点之间是否存在地形或模型遮挡
 */

import * as Cesium from 'cesium'
import { MeasureBase } from '../MeasureBase'
import type { MeasureResult, ViewshedOptions } from '../types'
import type { DrawConfig } from '../../GraphicsPlugin/types'

/**
 * 通视分析结果数据点
 */
interface ViewshedDataPoint {
  /** 距起点的距离（米） */
  distance: number
  /** 该点的高程（米） */
  elevation: number
  /** 视线高度（米） */
  sightHeight: number
  /** 是否可见 */
  visible: boolean
  /** 该点的世界坐标 */
  position: Cesium.Cartesian3
}

/**
 * 通视分析类
 */
export class MeasureViewshed extends MeasureBase {
  measureType = 'viewshed' as const

  private observerPoint: Cesium.Entity | null = null
  private targetPoint: Cesium.Entity | null = null
  private visibleLines: Cesium.Entity[] = []
  private invisibleLines: Cesium.Entity[] = []
  private blockPoint: Cesium.Entity | null = null
  private labelEntity: Cesium.Entity | null = null
  private positions: Cesium.Cartesian3[] = []
  private viewshedData: ViewshedDataPoint[] = []

  /** 通视分析配置 */
  private viewshedOptions: Required<ViewshedOptions>

  constructor(opts: DrawConfig) {
    super(opts)

    // 默认通视配置
    this.viewshedOptions = {
      observerHeight: 1.6, // 人眼高度
      targetHeight: 0,
      sampleCount: 100,
      visibleColor: '#00ff00',
      invisibleColor: '#ff0000',
      showBlockPoint: true
    }
  }

  /**
   * 设置通视配置
   */
  setViewshedOptions(options: Partial<ViewshedOptions>): this {
    this.viewshedOptions = {
      ...this.viewshedOptions,
      ...options
    }
    return this
  }

  /**
   * 创建要素
   */
  protected override createFeature(_attribute: Record<string, unknown>): Cesium.Entity | null {
    // 通视分析不需要预先创建实体
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
        value: {
          distance: 0,
          visible: false,
          blockDistance: 0,
          visibleDistance: 0,
          invisibleDistance: 0
        },
        positions: [...positions],
        text: ''
      }
    }

    const observerPos = positions[0]
    const targetPos = positions[1]

    // 计算通视分析数据
    this.viewshedData = this.calculateViewshedData(observerPos, targetPos)

    // 计算总距离
    const totalDistance = Cesium.Cartesian3.distance(observerPos, targetPos)

    // 查找遮挡点
    let isVisible = true
    let blockDistance = 0
    let visibleDistance = 0
    let invisibleDistance = 0
    let blockPosition: Cesium.Cartesian3 | null = null

    for (const point of this.viewshedData) {
      if (!point.visible) {
        isVisible = false
        if (!blockPosition) {
          blockPosition = point.position
          blockDistance = point.distance
        }
        invisibleDistance += point.distance - (this.viewshedData[this.viewshedData.indexOf(point) - 1]?.distance || 0)
      } else {
        visibleDistance += point.distance - (this.viewshedData[this.viewshedData.indexOf(point) - 1]?.distance || 0)
      }
    }

    return {
      type: this.measureType,
      value: {
        distance: totalDistance,
        visible: isVisible,
        blockDistance,
        blockPosition,
        visibleDistance,
        invisibleDistance,
        observerHeight: this.viewshedOptions.observerHeight,
        targetHeight: this.viewshedOptions.targetHeight,
        viewshedData: this.viewshedData
      },
      positions: [...positions],
      text: `总距离: ${this.formatDistance(totalDistance)}\n通视状态: ${isVisible ? '可见' : '不可见'}\n${!isVisible ? `遮挡距离: ${this.formatDistance(blockDistance)}` : ''}`
    }
  }

  /**
   * 计算通视分析数据
   */
  private calculateViewshedData(observerPos: Cesium.Cartesian3, targetPos: Cesium.Cartesian3): ViewshedDataPoint[] {
    const sampleCount = this.viewshedOptions.sampleCount
    const data: ViewshedDataPoint[] = []

    // 获取观察点和目标点的高程
    const observerCarto = Cesium.Cartographic.fromCartesian(observerPos)
    const targetCarto = Cesium.Cartographic.fromCartesian(targetPos)

    // 应用高度偏移
    const observerHeight = observerCarto.height + this.viewshedOptions.observerHeight
    const targetHeight = targetCarto.height + this.viewshedOptions.targetHeight

    // 总距离
    const totalDistance = Cesium.Cartesian3.distance(observerPos, targetPos)

    // 沿线采样
    for (let i = 0; i < sampleCount; i++) {
      const t = i / (sampleCount - 1)
      const currentDistance = totalDistance * t

      // 插值获取当前点位置
      const interpolatedPos = new Cesium.Cartesian3()
      Cesium.Cartesian3.lerp(observerPos, targetPos, t, interpolatedPos)

      // 获取当前点的地形高程
      const currentCarto = Cesium.Cartographic.fromCartesian(interpolatedPos)
      const terrainHeight = currentCarto.height

      // 计算理论视线高度（从观察点到目标点的直线）
      const sightHeight = observerHeight + (targetHeight - observerHeight) * t

      // 判断是否可见（地形高度是否低于视线高度）
      const visible = terrainHeight <= sightHeight

      data.push({
        distance: currentDistance,
        elevation: terrainHeight,
        sightHeight,
        visible,
        position: interpolatedPos
      })
    }

    return data
  }

  /**
   * 更新显示
   */
  protected updateDisplay(positions: Cesium.Cartesian3[]): void {
    if (positions.length === 0) return

    // 清除之前的线段
    this.visibleLines.forEach((line) => this.dataSource?.entities.remove(line))
    this.invisibleLines.forEach((line) => this.dataSource?.entities.remove(line))
    this.visibleLines = []
    this.invisibleLines = []

    // 创建/更新观察点
    if (positions.length >= 1) {
      if (this.observerPoint) {
        this.dataSource?.entities.remove(this.observerPoint)
      }
      this.observerPoint = this.createViewshedPoint(positions[0], '#0000ff', 10)
    }

    // 创建/更新目标点和线段
    if (positions.length >= 2) {
      if (this.targetPoint) {
        this.dataSource?.entities.remove(this.targetPoint)
      }
      this.targetPoint = this.createViewshedPoint(positions[1], '#ffff00', 10)

      // 计算结果
      this.result = this.calculateResult(positions)

      // 绘制可见/不可见线段
      this.drawViewshedLines()

      // 创建遮挡点标记
      if (this.viewshedOptions.showBlockPoint && this.result.value) {
        const resultValue = this.result.value as {
          visible: boolean
          blockPosition?: Cesium.Cartesian3
        }
        if (!resultValue.visible && resultValue.blockPosition) {
          if (this.blockPoint) {
            this.dataSource?.entities.remove(this.blockPoint)
          }
          this.blockPoint = this.createViewshedPoint(resultValue.blockPosition, '#ff00ff', 12)
        }
      }

      // 创建/更新标签
      if (this.labelEntity) {
        this.dataSource?.entities.remove(this.labelEntity)
      }

      const midPoint = Cesium.Cartesian3.midpoint(positions[0], positions[1], new Cesium.Cartesian3())
      this.labelEntity = this.createLabelEntity(midPoint, this.result.text || '')
    }

    // 触发更新事件
    if (this.liveUpdate && positions.length >= 2) {
      this.fire('measure:update', { result: this.result })
    }
  }

  /**
   * 绘制可见/不可见线段
   */
  private drawViewshedLines(): void {
    if (this.viewshedData.length === 0) return

    const visibleColor = Cesium.Color.fromCssColorString(this.viewshedOptions.visibleColor)
    const invisibleColor = Cesium.Color.fromCssColorString(this.viewshedOptions.invisibleColor)

    let segmentStart = 0
    let currentVisible = this.viewshedData[0].visible

    for (let i = 1; i < this.viewshedData.length; i++) {
      // 当可见性状态改变时，绘制前一段
      if (this.viewshedData[i].visible !== currentVisible || i === this.viewshedData.length - 1) {
        const endIndex = i === this.viewshedData.length - 1 ? i : i - 1
        const segmentPositions = this.viewshedData.slice(segmentStart, endIndex + 1).map((p) => p.position)

        if (segmentPositions.length >= 2) {
          const lineEntity = this.createViewshedLine(segmentPositions, currentVisible ? visibleColor : invisibleColor)

          if (currentVisible) {
            this.visibleLines.push(lineEntity)
          } else {
            this.invisibleLines.push(lineEntity)
          }
        }

        segmentStart = i
        currentVisible = this.viewshedData[i].visible
      }
    }
  }

  /**
   * 创建通视分析专用点实体
   */
  private createViewshedPoint(position: Cesium.Cartesian3, color: string, size: number): Cesium.Entity {
    if (!this.dataSource) {
      throw new Error('DataSource is not initialized')
    }

    return this.dataSource.entities.add({
      position,
      point: {
        pixelSize: size,
        color: Cesium.Color.fromCssColorString(color),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      }
    })
  }

  /**
   * 创建通视分析专用线实体
   */
  private createViewshedLine(positions: Cesium.Cartesian3[], color: Cesium.Color): Cesium.Entity {
    if (!this.dataSource) {
      throw new Error('DataSource is not initialized')
    }

    return this.dataSource.entities.add({
      polyline: {
        positions,
        width: 3,
        material: color,
        clampToGround: true
      }
    })
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

    // 通视分析只需要两个点（观察点和目标点）
    if (this.positions.length >= 2) {
      this.disable()
    }
  }

  /**
   * 右键点击事件 - 取消测量
   */
  protected onRightClick(): void {
    if (this.positions.length > 0) {
      this.disable()
    }
  }

  /**
   * 获取通视数据
   */
  getViewshedData(): ViewshedDataPoint[] {
    return this.viewshedData
  }

  /**
   * 获取通视结果
   */
  isVisible(): boolean {
    if (!this.result) return false
    const value = this.result.value as { visible: boolean }
    return value.visible
  }
}
