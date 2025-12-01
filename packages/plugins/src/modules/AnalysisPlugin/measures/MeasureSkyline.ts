/**
 * 环视分析（天际线分析）
 * 从观察点出发，分析360度全方位的可视区域和天际线
 */

import * as Cesium from 'cesium'
import { MeasureBase } from '../MeasureBase'
import type { MeasureResult, SkylineOptions } from '../types'
import type { DrawConfig } from '../../GraphicsPlugin/types'

/**
 * 天际线数据点
 */
interface SkylineDataPoint {
  /** 方位角（度，0-360） */
  azimuth: number
  /** 俯仰角（度） */
  pitch: number
  /** 距离（米） */
  distance: number
  /** 该方向是否可见 */
  visible: boolean
  /** 世界坐标 */
  position: Cesium.Cartesian3
}

/**
 * 环视分析类
 */
export class MeasureSkyline extends MeasureBase {
  measureType = 'skyline' as const

  private observerPoint: Cesium.Entity | null = null
  private radiusCircle: Cesium.Entity | null = null
  private visibleSectors: Cesium.Entity[] = []
  private invisibleSectors: Cesium.Entity[] = []
  private skylinePolyline: Cesium.Entity | null = null
  private labelEntity: Cesium.Entity | null = null
  private position: Cesium.Cartesian3 | null = null
  private skylineData: SkylineDataPoint[] = []

  /** 环视分析配置 */
  private skylineOptions: Required<SkylineOptions>

  constructor(opts: DrawConfig) {
    super(opts)

    // 默认环视配置
    this.skylineOptions = {
      observerHeight: 1.6,
      radius: 1000,
      azimuthSamples: 360,
      pitchSamples: 90,
      minPitch: -90,
      maxPitch: 90,
      visibleColor: 'rgba(0, 255, 0, 0.3)',
      invisibleColor: 'rgba(255, 0, 0, 0.3)',
      showSkyline: true,
      skylineColor: '#ffff00',
      skylineWidth: 3
    }
  }

  /**
   * 设置环视配置
   */
  setSkylineOptions(options: Partial<SkylineOptions>): this {
    this.skylineOptions = {
      ...this.skylineOptions,
      ...options
    }
    return this
  }

  /**
   * 创建要素
   */
  protected override createFeature(_attribute: Record<string, unknown>): Cesium.Entity | null {
    return null
  }

  /**
   * 绑定事件
   */
  protected override bindEvent(): void {
    this.bindClickEvent((screenPosition) => {
      const worldPosition = this.getWorldPosition(screenPosition)
      if (worldPosition) {
        this.onLeftClick(worldPosition)
      }
    })

    this.bindRightClickEvent(() => {
      this.disable()
    })

    this.bindDoubleClickEvent(() => {
      this.disable()
    })

    this.bindLongPressEvent(() => {
      this.disable()
    })
  }

  /**
   * 计算量算结果
   */
  protected calculateResult(positions: Cesium.Cartesian3[]): MeasureResult {
    if (positions.length === 0) {
      return {
        type: this.measureType,
        value: {
          radius: 0,
          observerHeight: 0,
          visiblePercent: 0,
          invisiblePercent: 0,
          visibleCount: 0,
          invisibleCount: 0,
          totalSamples: 0,
          skylineLength: 0,
          skylineData: []
        },
        positions: [],
        text: ''
      }
    }

    const position = positions[0]

    // 计算环视分析数据
    this.skylineData = this.calculateSkylineData(position)

    // 统计可见区域和不可见区域
    let visibleCount = 0
    let invisibleCount = 0

    for (const point of this.skylineData) {
      if (point.visible) {
        visibleCount++
      } else {
        invisibleCount++
      }
    }

    const total = this.skylineData.length
    const visiblePercent = total > 0 ? (visibleCount / total) * 100 : 0
    const invisiblePercent = total > 0 ? (invisibleCount / total) * 100 : 0

    // 计算天际线长度
    let skylineLength = 0
    for (let i = 0; i < this.skylineData.length - 1; i++) {
      const dist = Cesium.Cartesian3.distance(this.skylineData[i].position, this.skylineData[i + 1].position)
      skylineLength += dist
    }

    return {
      type: this.measureType,
      value: {
        radius: this.skylineOptions.radius,
        observerHeight: this.skylineOptions.observerHeight,
        visiblePercent,
        invisiblePercent,
        visibleCount,
        invisibleCount,
        totalSamples: total,
        skylineLength,
        skylineData: this.skylineData
      },
      positions: [position],
      text: `分析半径: ${this.skylineOptions.radius}m\n可见区域: ${visiblePercent.toFixed(1)}%\n不可见区域: ${invisiblePercent.toFixed(1)}%`
    }
  }

  /**
   * 计算环视分析数据
   */
  private calculateSkylineData(observerPos: Cesium.Cartesian3): SkylineDataPoint[] {
    const data: SkylineDataPoint[] = []
    const observerCarto = Cesium.Cartographic.fromCartesian(observerPos)
    const observerHeight = observerCarto.height + this.skylineOptions.observerHeight

    const azimuthStep = 360 / this.skylineOptions.azimuthSamples

    // 对每个方位角进行采样
    for (let i = 0; i < this.skylineOptions.azimuthSamples; i++) {
      const azimuth = i * azimuthStep

      // 查找该方向的天际线（最大俯仰角）
      const skylinePoint = this.findSkylineInDirection(observerPos, observerHeight, azimuth)

      if (skylinePoint) {
        data.push(skylinePoint)
      }
    }

    return data
  }

  /**
   * 在指定方向查找天际线
   */
  private findSkylineInDirection(
    observerPos: Cesium.Cartesian3,
    observerHeight: number,
    azimuth: number
  ): SkylineDataPoint | null {
    const observerCarto = Cesium.Cartographic.fromCartesian(observerPos)
    const radius = this.skylineOptions.radius

    // 计算该方向的目标点
    const azimuthRad = Cesium.Math.toRadians(azimuth)

    // 使用地心坐标系进行计算
    const ellipsoid = Cesium.Ellipsoid.WGS84

    // 简化计算：使用经纬度偏移
    const dx = radius * Math.sin(azimuthRad)
    const dy = radius * Math.cos(azimuthRad)

    // 转换为经纬度偏移（近似）
    const metersPerDegree = 111320 // 1度约等于111.32km
    const lonOffset = dx / (metersPerDegree * Math.cos(observerCarto.latitude))
    const latOffset = dy / metersPerDegree

    const targetLon = observerCarto.longitude + lonOffset
    const targetLat = observerCarto.latitude + latOffset

    // 沿该方向采样，查找最高的遮挡点
    let maxPitch = -90
    let maxPitchDistance = radius
    let maxPitchPosition = Cesium.Cartesian3.fromRadians(targetLon, targetLat, 0)

    const sampleCount = 50
    for (let i = 0; i <= sampleCount; i++) {
      const t = i / sampleCount
      const currentDistance = radius * t

      const currentLon = observerCarto.longitude + lonOffset * t
      const currentLat = observerCarto.latitude + latOffset * t

      const currentCarto = new Cesium.Cartographic(currentLon, currentLat, 0)
      const currentPos = ellipsoid.cartographicToCartesian(currentCarto)

      // 获取地形高程
      const currentCartoWithHeight = Cesium.Cartographic.fromCartesian(currentPos)
      const terrainHeight = currentCartoWithHeight.height

      // 计算俯仰角
      const heightDiff = terrainHeight - observerHeight
      const pitch = Cesium.Math.toDegrees(Math.atan2(heightDiff, currentDistance))

      if (pitch > maxPitch) {
        maxPitch = pitch
        maxPitchDistance = currentDistance
        maxPitchPosition = currentPos
      }
    }

    // 判断该方向是否可见（俯仰角是否在视野范围内）
    const visible = maxPitch >= this.skylineOptions.minPitch && maxPitch <= this.skylineOptions.maxPitch

    return {
      azimuth,
      pitch: maxPitch,
      distance: maxPitchDistance,
      visible,
      position: maxPitchPosition
    }
  }

  /**
   * 更新显示
   */
  protected updateDisplay(positions: Cesium.Cartesian3[]): void {
    if (positions.length === 0) return

    const position = positions[0]

    // 清除之前的实体
    this.clearEntities()

    // 创建观察点
    this.observerPoint = this.createSkylinePoint(position, '#0000ff', 12)

    // 创建分析半径圆
    this.radiusCircle = this.createRadiusCircle(position)

    // 计算结果
    this.result = this.calculateResult(positions)

    // 绘制可视区域和天际线
    this.drawSkylineVisualization(position)

    // 创建标签
    const labelPos = this.calculateLabelPosition(position)
    this.labelEntity = this.createLabelEntity(labelPos, this.result.text || '')

    // 触发更新事件
    if (this.liveUpdate) {
      this.fire('measure:update', { result: this.result })
    }
  }

  /**
   * 绘制天际线可视化
   */
  private drawSkylineVisualization(observerPos: Cesium.Cartesian3): void {
    if (this.skylineData.length === 0) return

    // 绘制可见/不可见扇形区域
    this.drawSectors(observerPos)

    // 绘制天际线
    if (this.skylineOptions.showSkyline) {
      this.drawSkyline()
    }
  }

  /**
   * 绘制扇形区域
   */
  private drawSectors(observerPos: Cesium.Cartesian3): void {
    let sectorStart = 0
    let currentVisible = this.skylineData[0].visible

    for (let i = 1; i <= this.skylineData.length; i++) {
      const isLast = i === this.skylineData.length
      const currentPoint = isLast ? this.skylineData[0] : this.skylineData[i]

      if (currentPoint.visible !== currentVisible || isLast) {
        const endIndex = isLast ? this.skylineData.length : i

        // 创建扇形
        const sectorPositions = this.createSectorPositions(observerPos, this.skylineData.slice(sectorStart, endIndex))

        if (sectorPositions.length >= 3) {
          const color = currentVisible
            ? Cesium.Color.fromCssColorString(this.skylineOptions.visibleColor)
            : Cesium.Color.fromCssColorString(this.skylineOptions.invisibleColor)

          const sectorEntity = this.createSectorEntity(sectorPositions, color)

          if (currentVisible) {
            this.visibleSectors.push(sectorEntity)
          } else {
            this.invisibleSectors.push(sectorEntity)
          }
        }

        sectorStart = i
        currentVisible = currentPoint.visible
      }
    }
  }

  /**
   * 创建扇形位置数组
   */
  private createSectorPositions(observerPos: Cesium.Cartesian3, points: SkylineDataPoint[]): Cesium.Cartesian3[] {
    const positions: Cesium.Cartesian3[] = []

    // 添加观察点作为扇形的中心
    positions.push(observerPos)

    // 添加扇形边缘点
    for (const point of points) {
      positions.push(point.position)
    }

    // 闭合扇形
    if (positions.length > 1) {
      positions.push(observerPos)
    }

    return positions
  }

  /**
   * 绘制天际线
   */
  private drawSkyline(): void {
    const skylinePositions = this.skylineData.map((p) => p.position)

    // 闭合天际线
    if (skylinePositions.length > 0) {
      skylinePositions.push(skylinePositions[0])
    }

    if (skylinePositions.length >= 2 && this.dataSource) {
      this.skylinePolyline = this.dataSource.entities.add({
        polyline: {
          positions: skylinePositions,
          width: this.skylineOptions.skylineWidth,
          material: Cesium.Color.fromCssColorString(this.skylineOptions.skylineColor),
          clampToGround: true
        }
      })
    }
  }

  /**
   * 创建观察点
   */
  private createSkylinePoint(position: Cesium.Cartesian3, color: string, size: number): Cesium.Entity {
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
   * 创建半径圆
   */
  private createRadiusCircle(position: Cesium.Cartesian3): Cesium.Entity {
    if (!this.dataSource) {
      throw new Error('DataSource is not initialized')
    }

    return this.dataSource.entities.add({
      position,
      ellipse: {
        semiMinorAxis: this.skylineOptions.radius,
        semiMajorAxis: this.skylineOptions.radius,
        material: Cesium.Color.YELLOW.withAlpha(0.1),
        outline: true,
        outlineColor: Cesium.Color.YELLOW,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      }
    })
  }

  /**
   * 创建扇形实体
   */
  private createSectorEntity(positions: Cesium.Cartesian3[], color: Cesium.Color): Cesium.Entity {
    if (!this.dataSource) {
      throw new Error('DataSource is not initialized')
    }

    return this.dataSource.entities.add({
      polygon: {
        hierarchy: new Cesium.PolygonHierarchy(positions),
        material: color,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      }
    })
  }

  /**
   * 计算标签位置
   */
  private calculateLabelPosition(observerPos: Cesium.Cartesian3): Cesium.Cartesian3 {
    const observerCarto = Cesium.Cartographic.fromCartesian(observerPos)

    // 标签显示在观察点上方
    return Cesium.Cartesian3.fromRadians(observerCarto.longitude, observerCarto.latitude, observerCarto.height + 50)
  }

  /**
   * 清除所有实体
   */
  private clearEntities(): void {
    if (this.observerPoint) {
      this.dataSource?.entities.remove(this.observerPoint)
      this.observerPoint = null
    }

    if (this.radiusCircle) {
      this.dataSource?.entities.remove(this.radiusCircle)
      this.radiusCircle = null
    }

    this.visibleSectors.forEach((sector) => this.dataSource?.entities.remove(sector))
    this.invisibleSectors.forEach((sector) => this.dataSource?.entities.remove(sector))
    this.visibleSectors = []
    this.invisibleSectors = []

    if (this.skylinePolyline) {
      this.dataSource?.entities.remove(this.skylinePolyline)
      this.skylinePolyline = null
    }

    if (this.labelEntity) {
      this.dataSource?.entities.remove(this.labelEntity)
      this.labelEntity = null
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
    if (this.position) {
      this.result = this.calculateResult([this.position])
      this.fire('measure:complete', { result: this.result })
    }

    return super.disable(hasWB)
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

    this.position = position
    this.updateDisplay([position])
    this.fire('measure:pointAdd', { position, positions: [position] })

    // 环视分析只需要一个点（观察点）
    this.disable()
  }

  /**
   * 获取天际线数据
   */
  getSkylineData(): SkylineDataPoint[] {
    return this.skylineData
  }

  /**
   * 获取可见区域百分比
   */
  getVisiblePercent(): number {
    if (!this.result) return 0
    const value = this.result.value as { visiblePercent: number }
    return value.visiblePercent
  }
}
