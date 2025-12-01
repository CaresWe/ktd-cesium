/**
 * 方量分析（土方量计算）
 * 计算多边形区域内的挖方量和填方量
 */

import * as Cesium from 'cesium'
import { MeasureBase } from '../MeasureBase'
import type { MeasureResult, VolumeOptions } from '../types'
import type { DrawConfig } from '../../GraphicsPlugin/types'

/**
 * 方量分析类
 */
export class MeasureVolume extends MeasureBase {
  measureType = 'volume' as const

  private polygonEntity: Cesium.Entity | null = null
  private pointEntities: Cesium.Entity[] = []
  private labelEntity: Cesium.Entity | null = null
  private positions: Cesium.Cartesian3[] = []

  /** 方量分析配置 */
  private volumeOptions: Required<VolumeOptions>

  constructor(opts: DrawConfig) {
    super(opts)

    // 默认方量配置
    this.volumeOptions = {
      baseElevation: 0,
      gridSize: 10,
      sampleTerrain: false
    }
  }

  /**
   * 设置方量配置
   */
  setVolumeOptions(options: Partial<VolumeOptions>): this {
    this.volumeOptions = {
      ...this.volumeOptions,
      ...options
    }
    return this
  }

  /**
   * 创建要素
   */
  protected override createFeature(_attribute: Record<string, unknown>): Cesium.Entity | null {
    // 方量分析不需要预先创建实体
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
    if (positions.length < 3) {
      return {
        type: this.measureType,
        value: {
          area: 0,
          cutVolume: 0,
          fillVolume: 0,
          totalVolume: 0
        },
        positions: [...positions],
        text: ''
      }
    }

    // 计算底面积
    const area = this.calculateArea(positions)

    // 计算方量
    const volumeData = this.calculateVolume(positions)

    return {
      type: this.measureType,
      value: {
        area,
        ...volumeData
      },
      positions: [...positions],
      text: `面积: ${this.formatArea(area)}\n挖方: ${volumeData.cutVolume.toFixed(2)} m³\n填方: ${volumeData.fillVolume.toFixed(2)} m³\n净方量: ${volumeData.netVolume.toFixed(2)} m³\n总方量: ${volumeData.totalVolume.toFixed(2)} m³`
    }
  }

  /**
   * 计算方量
   */
  private calculateVolume(positions: Cesium.Cartesian3[]): {
    cutVolume: number
    fillVolume: number
    netVolume: number
    totalVolume: number
    baseElevation: number
    minElevation: number
    maxElevation: number
    avgElevation: number
  } {
    // 生成网格采样点
    const gridPoints = this.generateGridPoints(positions)

    if (gridPoints.length === 0) {
      return {
        cutVolume: 0,
        fillVolume: 0,
        netVolume: 0,
        totalVolume: 0,
        baseElevation: this.volumeOptions.baseElevation,
        minElevation: 0,
        maxElevation: 0,
        avgElevation: 0
      }
    }

    // 计算高程统计
    const elevations = gridPoints.map((p) => p.elevation)
    const minElevation = Math.min(...elevations)
    const maxElevation = Math.max(...elevations)
    const avgElevation = elevations.reduce((sum, e) => sum + e, 0) / elevations.length

    // 确定基准高程
    const baseElevation = this.volumeOptions.baseElevation !== 0 ? this.volumeOptions.baseElevation : avgElevation

    // 计算每个网格单元的体积
    const gridSize = this.volumeOptions.gridSize
    const cellArea = gridSize * gridSize

    let cutVolume = 0 // 挖方（地形高于基准面）
    let fillVolume = 0 // 填方（地形低于基准面）

    for (const point of gridPoints) {
      const heightDiff = point.elevation - baseElevation

      if (heightDiff > 0) {
        // 需要挖方
        cutVolume += heightDiff * cellArea
      } else if (heightDiff < 0) {
        // 需要填方
        fillVolume += Math.abs(heightDiff) * cellArea
      }
    }

    const netVolume = cutVolume - fillVolume // 净方量（正为挖方多，负为填方多）
    const totalVolume = cutVolume + fillVolume // 总方量

    return {
      cutVolume,
      fillVolume,
      netVolume,
      totalVolume,
      baseElevation,
      minElevation,
      maxElevation,
      avgElevation
    }
  }

  /**
   * 生成网格采样点
   */
  private generateGridPoints(
    positions: Cesium.Cartesian3[]
  ): Array<{ position: Cesium.Cartesian3; elevation: number }> {
    const gridSize = this.volumeOptions.gridSize

    // 计算多边形的边界框
    const cartographics = positions.map((pos) => Cesium.Cartographic.fromCartesian(pos))

    const lons = cartographics.map((c) => c.longitude)
    const lats = cartographics.map((c) => c.latitude)

    const minLon = Math.min(...lons)
    const maxLon = Math.max(...lons)
    const minLat = Math.min(...lats)
    const maxLat = Math.min(...lats)

    // 转换为米
    const ellipsoid = Cesium.Ellipsoid.WGS84
    const sw = Cesium.Cartesian3.fromRadians(minLon, minLat)
    const width = Cesium.Cartesian3.distance(sw, Cesium.Cartesian3.fromRadians(maxLon, minLat))
    const height = Cesium.Cartesian3.distance(sw, Cesium.Cartesian3.fromRadians(minLon, maxLat))

    // 计算网格数量
    const cols = Math.ceil(width / gridSize)
    const rows = Math.ceil(height / gridSize)

    const gridPoints: Array<{ position: Cesium.Cartesian3; elevation: number }> = []

    // 生成网格点
    for (let i = 0; i <= rows; i++) {
      for (let j = 0; j <= cols; j++) {
        const t1 = i / rows
        const t2 = j / cols

        const lon = minLon + (maxLon - minLon) * t2
        const lat = minLat + (maxLat - minLat) * t1

        const cartographic = new Cesium.Cartographic(lon, lat, 0)
        const position = ellipsoid.cartographicToCartesian(cartographic)

        // 检查点是否在多边形内
        if (this.isPointInPolygon(position, positions)) {
          // 获取该点的地形高程
          const carto = Cesium.Cartographic.fromCartesian(position)
          const elevation = carto.height

          gridPoints.push({
            position,
            elevation
          })
        }
      }
    }

    return gridPoints
  }

  /**
   * 判断点是否在多边形内（射线法）
   */
  private isPointInPolygon(point: Cesium.Cartesian3, polygon: Cesium.Cartesian3[]): boolean {
    const pointCarto = Cesium.Cartographic.fromCartesian(point)
    const polygonCarto = polygon.map((p) => Cesium.Cartographic.fromCartesian(p))

    const x = pointCarto.longitude
    const y = pointCarto.latitude

    let inside = false

    for (let i = 0, j = polygonCarto.length - 1; i < polygonCarto.length; j = i++) {
      const xi = polygonCarto[i].longitude
      const yi = polygonCarto[i].latitude
      const xj = polygonCarto[j].longitude
      const yj = polygonCarto[j].latitude

      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
      if (intersect) inside = !inside
    }

    return inside
  }

  /**
   * 异步采样地形高程（更精确）
   */
  async sampleTerrainAsync(positions: Cesium.Cartesian3[]): Promise<MeasureResult> {
    const terrainProvider = this.viewer.terrainProvider
    const gridPoints = this.generateGridPoints(positions)

    if (gridPoints.length === 0) {
      return this.calculateResult(positions)
    }

    // 准备采样点
    const samplePositions = gridPoints.map((p) => Cesium.Cartographic.fromCartesian(p.position))

    // 异步采样地形
    const sampledPositions = await Cesium.sampleTerrainMostDetailed(terrainProvider, samplePositions)

    // 更新高程
    for (let i = 0; i < gridPoints.length; i++) {
      gridPoints[i].elevation = sampledPositions[i].height
    }

    // 重新计算方量
    return this.calculateResult(positions)
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

    // 创建/更新多边形
    if (positions.length >= 3) {
      if (this.polygonEntity) {
        this.dataSource?.entities.remove(this.polygonEntity)
      }
      this.polygonEntity = this.createPolygonEntity(positions)

      // 计算并更新结果
      this.result = this.calculateResult(positions)

      // 计算中心点位置显示标签
      const center = this.calculatePolygonCenter(positions)

      // 创建/更新标签
      if (this.labelEntity) {
        this.dataSource?.entities.remove(this.labelEntity)
      }

      const area = this.calculateArea(positions)
      this.labelEntity = this.createLabelEntity(center, `方量分析\n面积: ${this.formatArea(area)}`)
    }

    // 触发更新事件
    if (this.liveUpdate && positions.length >= 3) {
      this.fire('measure:update', { result: this.result })
    }
  }

  /**
   * 计算多边形中心点
   */
  private calculatePolygonCenter(positions: Cesium.Cartesian3[]): Cesium.Cartesian3 {
    const cartographics = positions.map((pos) => Cesium.Cartographic.fromCartesian(pos))

    let longitude = 0
    let latitude = 0
    let height = 0

    cartographics.forEach((carto) => {
      longitude += carto.longitude
      latitude += carto.latitude
      height += carto.height
    })

    const count = cartographics.length
    return Cesium.Cartesian3.fromRadians(longitude / count, latitude / count, height / count)
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
    if (this.positions.length >= 3) {
      // 如果启用了异步地形采样
      if (this.volumeOptions.sampleTerrain) {
        this.sampleTerrainAsync(this.positions)
          .then((result) => {
            this.result = result
            this.fire('measure:complete', { result: this.result })
          })
          .catch(() => {
            // 采样失败，使用同步数据
            this.result = this.calculateResult(this.positions)
            this.fire('measure:complete', { result: this.result })
          })
      } else {
        this.result = this.calculateResult(this.positions)
        this.fire('measure:complete', { result: this.result })
      }
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
    if (this.positions.length >= 3) {
      this.disable()
    }
  }

  /**
   * 获取方量数据
   */
  getVolumeData(): Record<string, number> | null {
    if (!this.result) return null
    return this.result.value as Record<string, number>
  }
}
