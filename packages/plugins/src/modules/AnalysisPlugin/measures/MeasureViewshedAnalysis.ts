/**
 * 可视域分析（视域范围分析）
 * 分析从观察点出发在指定范围和视角内的可见区域
 */

import * as Cesium from 'cesium'
import { MeasureBase } from '../MeasureBase'
import type { MeasureResult, ViewshedAnalysisOptions } from '../types'
import type { DrawConfig } from '../../GraphicsPlugin/types'

/**
 * 可视域数据点
 */
interface ViewshedPoint {
  /** 方位角（度） */
  azimuth: number
  /** 距离（米） */
  distance: number
  /** 该点的高程（米） */
  elevation: number
  /** 视线高度（米） */
  sightHeight: number
  /** 是否可见 */
  visible: boolean
  /** 世界坐标 */
  position: Cesium.Cartesian3
}

/**
 * 可视域分析类
 */
export class MeasureViewshedAnalysis extends MeasureBase {
  measureType = 'viewshedAnalysis' as const

  private observerPoint: Cesium.Entity | null = null
  private radiusCircle: Cesium.Entity | null = null
  private visiblePolygons: Cesium.Entity[] = []
  private invisiblePolygons: Cesium.Entity[] = []
  private boundaryLines: Cesium.Entity[] = []
  private labelEntity: Cesium.Entity | null = null
  private position: Cesium.Cartesian3 | null = null
  private viewshedData: ViewshedPoint[][] = []

  /** 可视域配置 */
  private analysisOptions: Required<ViewshedAnalysisOptions>

  constructor(opts: DrawConfig) {
    super(opts)

    // 默认配置
    this.analysisOptions = {
      observerHeight: 1.6,
      radius: 500,
      horizontalFov: 360,
      horizontalAngle: 0,
      verticalFov: 90,
      verticalAngle: -45,
      azimuthSamples: 180,
      distanceSamples: 50,
      visibleColor: 'rgba(0, 255, 0, 0.3)',
      invisibleColor: 'rgba(255, 0, 0, 0.3)',
      showBoundary: true,
      boundaryColor: '#ffff00',
      boundaryWidth: 2
    }
  }

  /**
   * 设置可视域配置
   */
  setViewshedAnalysisOptions(options: Partial<ViewshedAnalysisOptions>): this {
    this.analysisOptions = {
      ...this.analysisOptions,
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
          horizontalFov: 0,
          verticalFov: 0,
          visiblePercent: 0,
          invisiblePercent: 0,
          visibleCount: 0,
          totalCount: 0,
          viewshedData: []
        },
        positions: [],
        text: ''
      }
    }

    const position = positions[0]

    // 计算可视域数据
    this.viewshedData = this.calculateViewshedData(position)

    // 统计可见和不可见点
    let visibleCount = 0
    let totalCount = 0

    for (const rayData of this.viewshedData) {
      for (const point of rayData) {
        totalCount++
        if (point.visible) {
          visibleCount++
        }
      }
    }

    const visiblePercent = totalCount > 0 ? (visibleCount / totalCount) * 100 : 0
    const invisiblePercent = 100 - visiblePercent

    return {
      type: this.measureType,
      value: {
        radius: this.analysisOptions.radius,
        observerHeight: this.analysisOptions.observerHeight,
        horizontalFov: this.analysisOptions.horizontalFov,
        verticalFov: this.analysisOptions.verticalFov,
        visiblePercent,
        invisiblePercent,
        visibleCount,
        totalCount,
        viewshedData: this.viewshedData
      },
      positions: [position],
      text: `分析半径: ${this.analysisOptions.radius}m\n水平视角: ${this.analysisOptions.horizontalFov}°\n可见区域: ${visiblePercent.toFixed(1)}%\n不可见区域: ${invisiblePercent.toFixed(1)}%`
    }
  }

  /**
   * 计算可视域数据
   */
  private calculateViewshedData(observerPos: Cesium.Cartesian3): ViewshedPoint[][] {
    const data: ViewshedPoint[][] = []
    const observerCarto = Cesium.Cartographic.fromCartesian(observerPos)
    const observerHeight = observerCarto.height + this.analysisOptions.observerHeight

    const startAngle = this.analysisOptions.horizontalAngle
    const angleStep = this.analysisOptions.horizontalFov / this.analysisOptions.azimuthSamples

    // 对每个方位角方向进行分析
    for (let i = 0; i <= this.analysisOptions.azimuthSamples; i++) {
      const azimuth = startAngle + i * angleStep
      const rayData = this.analyzeRay(observerPos, observerHeight, azimuth)
      data.push(rayData)
    }

    return data
  }

  /**
   * 分析单条射线的可见性
   */
  private analyzeRay(observerPos: Cesium.Cartesian3, observerHeight: number, azimuth: number): ViewshedPoint[] {
    const rayData: ViewshedPoint[] = []
    const observerCarto = Cesium.Cartographic.fromCartesian(observerPos)

    const azimuthRad = Cesium.Math.toRadians(azimuth)
    const radius = this.analysisOptions.radius

    // 计算方向向量
    const dx = radius * Math.sin(azimuthRad)
    const dy = radius * Math.cos(azimuthRad)

    // 转换为经纬度偏移
    const metersPerDegree = 111320
    const lonOffset = dx / (metersPerDegree * Math.cos(observerCarto.latitude))
    const latOffset = dy / metersPerDegree

    // 沿射线采样
    let maxTerrainAngle = -90 // 当前方向的最大地形仰角

    for (let i = 1; i <= this.analysisOptions.distanceSamples; i++) {
      const t = i / this.analysisOptions.distanceSamples
      const currentDistance = radius * t

      const currentLon = observerCarto.longitude + lonOffset * t
      const currentLat = observerCarto.latitude + latOffset * t

      const currentCarto = new Cesium.Cartographic(currentLon, currentLat, 0)
      const currentPos = Cesium.Ellipsoid.WGS84.cartographicToCartesian(currentCarto)

      // 获取地形高程
      const terrainCarto = Cesium.Cartographic.fromCartesian(currentPos)
      const terrainHeight = terrainCarto.height

      // 计算从观察点到该点的仰角
      const heightDiff = terrainHeight - observerHeight
      const terrainAngle = Cesium.Math.toDegrees(Math.atan2(heightDiff, currentDistance))

      // 判断可见性：如果当前地形仰角大于之前的最大仰角，则被遮挡
      const visible = terrainAngle <= maxTerrainAngle

      // 更新最大地形仰角
      if (terrainAngle > maxTerrainAngle) {
        maxTerrainAngle = terrainAngle
      }

      // 计算理论视线高度
      const verticalAngleRad = Cesium.Math.toRadians(this.analysisOptions.verticalAngle)
      const sightHeight = observerHeight + currentDistance * Math.tan(verticalAngleRad)

      rayData.push({
        azimuth,
        distance: currentDistance,
        elevation: terrainHeight,
        sightHeight,
        visible,
        position: currentPos
      })
    }

    return rayData
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
    this.observerPoint = this.createViewshedPoint(position, '#0000ff', 12)

    // 创建分析半径圆
    this.radiusCircle = this.createRadiusCircle(position)

    // 计算结果
    this.result = this.calculateResult(positions)

    // 绘制可视域
    this.drawViewshed(position)

    // 创建标签
    const labelPos = this.calculateLabelPosition(position)
    this.labelEntity = this.createLabelEntity(labelPos, this.result.text || '')

    // 触发更新事件
    if (this.liveUpdate) {
      this.fire('measure:update', { result: this.result })
    }
  }

  /**
   * 绘制可视域
   */
  private drawViewshed(observerPos: Cesium.Cartesian3): void {
    if (this.viewshedData.length === 0) return

    // 绘制可见和不可见区域
    this.drawVisibilityPolygons(observerPos)

    // 绘制边界线
    if (this.analysisOptions.showBoundary) {
      this.drawBoundaryLines()
    }
  }

  /**
   * 绘制可见/不可见多边形
   */
  private drawVisibilityPolygons(_observerPos: Cesium.Cartesian3): void {
    const visibleColor = Cesium.Color.fromCssColorString(this.analysisOptions.visibleColor)
    const invisibleColor = Cesium.Color.fromCssColorString(this.analysisOptions.invisibleColor)

    // 遍历每条射线，绘制扇形区域
    for (let i = 0; i < this.viewshedData.length - 1; i++) {
      const currentRay = this.viewshedData[i]
      const nextRay = this.viewshedData[i + 1]

      // 沿每条射线的采样点绘制小扇形
      for (let j = 0; j < currentRay.length - 1; j++) {
        const p1 = currentRay[j]
        const p2 = currentRay[j + 1]
        const p3 = nextRay[j + 1]
        const p4 = nextRay[j]

        // 判断这个小扇形是否可见（取四个顶点的平均可见性）
        const visibleCount = [p1, p2, p3, p4].filter((p) => p.visible).length
        const isVisible = visibleCount >= 2

        // 创建四边形
        const positions = [p1.position, p2.position, p3.position, p4.position]

        const polygon = this.createViewshedPolygon(positions, isVisible ? visibleColor : invisibleColor)

        if (isVisible) {
          this.visiblePolygons.push(polygon)
        } else {
          this.invisiblePolygons.push(polygon)
        }
      }
    }
  }

  /**
   * 绘制边界线
   */
  private drawBoundaryLines(): void {
    const boundaryColor = Cesium.Color.fromCssColorString(this.analysisOptions.boundaryColor)

    // 绘制每条射线的最远点连线
    const boundaryPositions: Cesium.Cartesian3[] = []

    for (const rayData of this.viewshedData) {
      if (rayData.length > 0) {
        const lastPoint = rayData[rayData.length - 1]
        boundaryPositions.push(lastPoint.position)
      }
    }

    // 闭合边界
    if (boundaryPositions.length > 0 && this.analysisOptions.horizontalFov === 360) {
      boundaryPositions.push(boundaryPositions[0])
    }

    if (boundaryPositions.length >= 2 && this.dataSource) {
      const boundaryLine = this.dataSource.entities.add({
        polyline: {
          positions: boundaryPositions,
          width: this.analysisOptions.boundaryWidth,
          material: boundaryColor,
          clampToGround: true
        }
      })
      this.boundaryLines.push(boundaryLine)
    }
  }

  /**
   * 创建观察点
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
   * 创建半径圆
   */
  private createRadiusCircle(position: Cesium.Cartesian3): Cesium.Entity {
    if (!this.dataSource) {
      throw new Error('DataSource is not initialized')
    }

    return this.dataSource.entities.add({
      position,
      ellipse: {
        semiMinorAxis: this.analysisOptions.radius,
        semiMajorAxis: this.analysisOptions.radius,
        material: Cesium.Color.YELLOW.withAlpha(0.1),
        outline: true,
        outlineColor: Cesium.Color.YELLOW.withAlpha(0.5),
        outlineWidth: 1,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      }
    })
  }

  /**
   * 创建多边形实体
   */
  private createViewshedPolygon(positions: Cesium.Cartesian3[], color: Cesium.Color): Cesium.Entity {
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

    this.visiblePolygons.forEach((polygon) => this.dataSource?.entities.remove(polygon))
    this.invisiblePolygons.forEach((polygon) => this.dataSource?.entities.remove(polygon))
    this.boundaryLines.forEach((line) => this.dataSource?.entities.remove(line))

    this.visiblePolygons = []
    this.invisiblePolygons = []
    this.boundaryLines = []

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

    // 可视域分析只需要一个点（观察点）
    this.disable()
  }

  /**
   * 获取可视域数据
   */
  getViewshedData(): ViewshedPoint[][] {
    return this.viewshedData
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
