/**
 * 剖面分析
 * 沿着一条线进行地形剖面分析，返回 ECharts 配置
 */

import * as Cesium from 'cesium'
import { MeasureBase } from '../MeasureBase'
import type { MeasureResult, ProfileDataPoint, ProfileOptions } from '../types'
import type { DrawConfig } from '../../GraphicsPlugin/types'

/**
 * ECharts 配置类型（简化版）
 */
export interface EChartsOption {
  title?: Record<string, unknown>
  tooltip?: Record<string, unknown>
  grid?: Record<string, unknown>
  xAxis?: Record<string, unknown>
  yAxis?: Record<string, unknown>
  series?: Array<Record<string, unknown>>
  [key: string]: unknown
}

/**
 * 剖面分析类
 */
export class MeasureProfile extends MeasureBase {
  measureType = 'profile' as const

  private lineEntity: Cesium.Entity | null = null
  private pointEntities: Cesium.Entity[] = []
  private labelEntity: Cesium.Entity | null = null
  private positions: Cesium.Cartesian3[] = []
  private profileData: ProfileDataPoint[] = []

  /** 剖面分析配置 */
  private profileOptions: Required<ProfileOptions>

  constructor(opts: DrawConfig) {
    super(opts)

    // 默认剖面配置
    this.profileOptions = {
      sampleCount: 100,
      clampToGround: true,
      sampleTerrain: false
    }
  }

  /**
   * 设置剖面配置
   */
  setProfileOptions(options: Partial<ProfileOptions>): this {
    this.profileOptions = {
      ...this.profileOptions,
      ...options
    }
    return this
  }

  /**
   * 创建要素
   */
  protected override createFeature(_attribute: Record<string, unknown>): Cesium.Entity | null {
    // 剖面分析不需要预先创建实体
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
        value: { distance: 0, profileData: [], chartOption: null },
        positions: [...positions],
        text: ''
      }
    }

    // 计算总距离
    const totalDistance = this.calculateTotalDistance(positions)

    // 采样计算剖面数据
    this.profileData = this.calculateProfileData(positions)

    // 计算高程统计
    const elevations = this.profileData.map((p) => p.elevation)
    const minElevation = Math.min(...elevations)
    const maxElevation = Math.max(...elevations)
    const avgElevation = elevations.reduce((sum, e) => sum + e, 0) / elevations.length

    // 生成 ECharts 配置
    const chartOption = this.generateEChartsOption()

    return {
      type: this.measureType,
      value: {
        distance: totalDistance,
        profileData: this.profileData,
        minElevation,
        maxElevation,
        avgElevation,
        points: positions.length,
        chartOption
      },
      positions: [...positions],
      text: `总距离: ${this.formatDistance(totalDistance)}\n最低高程: ${minElevation.toFixed(2)}m\n最高高程: ${maxElevation.toFixed(2)}m\n平均高程: ${avgElevation.toFixed(2)}m`
    }
  }

  /**
   * 计算剖面数据
   */
  private calculateProfileData(positions: Cesium.Cartesian3[]): ProfileDataPoint[] {
    const sampleCount = this.profileOptions.sampleCount
    const data: ProfileDataPoint[] = []

    // 计算总距离和每段长度
    const segmentDistances: number[] = []
    let totalDistance = 0

    for (let i = 0; i < positions.length - 1; i++) {
      const dist = Cesium.Cartesian3.distance(positions[i], positions[i + 1])
      segmentDistances.push(dist)
      totalDistance += dist
    }

    // 在线段上进行采样
    const stepDistance = totalDistance / (sampleCount - 1)

    for (let i = 0; i < sampleCount; i++) {
      const targetDistance = i * stepDistance

      // 找到目标距离所在的线段
      let accumulatedDistance = 0
      let segmentIndex = 0

      for (let j = 0; j < segmentDistances.length; j++) {
        if (accumulatedDistance + segmentDistances[j] >= targetDistance) {
          segmentIndex = j
          break
        }
        accumulatedDistance += segmentDistances[j]
      }

      // 在线段内插值
      const localDistance = targetDistance - accumulatedDistance
      const segmentLength = segmentDistances[segmentIndex]
      const t = segmentLength > 0 ? localDistance / segmentLength : 0

      const startPos = positions[segmentIndex]
      const endPos = positions[Math.min(segmentIndex + 1, positions.length - 1)]

      // 线性插值获取位置
      const interpolatedPos = new Cesium.Cartesian3()
      Cesium.Cartesian3.lerp(startPos, endPos, t, interpolatedPos)

      // 获取该点的高程
      const cartographic = Cesium.Cartographic.fromCartesian(interpolatedPos)
      const elevation = cartographic.height

      data.push({
        distance: targetDistance,
        elevation,
        longitude: Cesium.Math.toDegrees(cartographic.longitude),
        latitude: Cesium.Math.toDegrees(cartographic.latitude),
        position: interpolatedPos
      })
    }

    return data
  }

  /**
   * 生成 ECharts 配置
   */
  private generateEChartsOption(): EChartsOption {
    if (this.profileData.length === 0) {
      return {}
    }

    // 准备数据
    const distances = this.profileData.map((p) => (p.distance / 1000).toFixed(2)) // 转换为公里
    const elevations = this.profileData.map((p) => p.elevation.toFixed(2))

    const option: EChartsOption = {
      title: {
        text: '地形剖面图',
        left: 'center',
        top: 10
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const paramsArray = params as Array<{ name: string; value: string; seriesName: string }>
          if (paramsArray && paramsArray.length > 0) {
            const param = paramsArray[0]
            return `距离: ${param.name} km<br/>高程: ${param.value} m`
          }
          return ''
        }
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: distances,
        name: '距离 (km)',
        nameLocation: 'middle',
        nameGap: 30,
        boundaryGap: false
      },
      yAxis: {
        type: 'value',
        name: '高程 (m)',
        nameLocation: 'middle',
        nameGap: 50
      },
      series: [
        {
          name: '高程',
          type: 'line',
          data: elevations,
          smooth: true,
          symbol: 'none',
          lineStyle: {
            color: '#4CAF50',
            width: 2
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: 'rgba(76, 175, 80, 0.5)'
                },
                {
                  offset: 1,
                  color: 'rgba(76, 175, 80, 0.1)'
                }
              ]
            }
          }
        }
      ]
    }

    return option
  }

  /**
   * 异步采样地形高程（更精确）
   * 注意：此方法是异步的，需要等待地形数据加载
   */
  async sampleTerrainAsync(positions: Cesium.Cartesian3[]): Promise<ProfileDataPoint[]> {
    const sampleCount = this.profileOptions.sampleCount
    const terrainProvider = this.viewer.terrainProvider

    // 生成采样点
    const samplePositions: Cesium.Cartographic[] = []
    const segmentDistances: number[] = []
    let totalDistance = 0

    for (let i = 0; i < positions.length - 1; i++) {
      const dist = Cesium.Cartesian3.distance(positions[i], positions[i + 1])
      segmentDistances.push(dist)
      totalDistance += dist
    }

    const stepDistance = totalDistance / (sampleCount - 1)

    for (let i = 0; i < sampleCount; i++) {
      const targetDistance = i * stepDistance
      let accumulatedDistance = 0
      let segmentIndex = 0

      for (let j = 0; j < segmentDistances.length; j++) {
        if (accumulatedDistance + segmentDistances[j] >= targetDistance) {
          segmentIndex = j
          break
        }
        accumulatedDistance += segmentDistances[j]
      }

      const localDistance = targetDistance - accumulatedDistance
      const segmentLength = segmentDistances[segmentIndex]
      const t = segmentLength > 0 ? localDistance / segmentLength : 0

      const startPos = positions[segmentIndex]
      const endPos = positions[Math.min(segmentIndex + 1, positions.length - 1)]

      const interpolatedPos = new Cesium.Cartesian3()
      Cesium.Cartesian3.lerp(startPos, endPos, t, interpolatedPos)

      const cartographic = Cesium.Cartographic.fromCartesian(interpolatedPos)
      samplePositions.push(cartographic)
    }

    // 异步采样地形
    const sampledPositions = await Cesium.sampleTerrainMostDetailed(terrainProvider, samplePositions)

    // 转换为 ProfileDataPoint
    const data: ProfileDataPoint[] = []
    for (let i = 0; i < sampledPositions.length; i++) {
      const cartographic = sampledPositions[i]
      const targetDistance = i * stepDistance

      data.push({
        distance: targetDistance,
        elevation: cartographic.height,
        longitude: Cesium.Math.toDegrees(cartographic.longitude),
        latitude: Cesium.Math.toDegrees(cartographic.latitude),
        position: Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, cartographic.height)
      })
    }

    return data
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

    // 创建/更新线实体
    if (positions.length >= 2) {
      if (this.lineEntity) {
        this.dataSource?.entities.remove(this.lineEntity)
      }
      this.lineEntity = this.createLineEntity(positions)

      // 计算并更新结果
      this.result = this.calculateResult(positions)

      // 计算中心点位置显示标签
      const midIndex = Math.floor(positions.length / 2)
      const labelPosition = positions[midIndex]

      // 创建/更新标签
      if (this.labelEntity) {
        this.dataSource?.entities.remove(this.labelEntity)
      }

      const totalDistance = this.calculateTotalDistance(positions)
      this.labelEntity = this.createLabelEntity(
        labelPosition,
        `剖面分析\n距离: ${this.formatDistance(totalDistance)}\n点数: ${positions.length}`
      )
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
      // 如果启用了异步地形采样
      if (this.profileOptions.sampleTerrain) {
        this.sampleTerrainAsync(this.positions)
          .then((data) => {
            this.profileData = data
            this.result = this.calculateResult(this.positions)
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
    if (this.positions.length >= 2) {
      this.disable()
    }
  }

  /**
   * 获取剖面数据
   */
  getProfileData(): ProfileDataPoint[] {
    return this.profileData
  }

  /**
   * 获取 ECharts 配置
   */
  getChartOption(): EChartsOption | null {
    if (!this.result) return null
    const value = this.result.value as { chartOption?: EChartsOption }
    return value.chartOption || null
  }
}
