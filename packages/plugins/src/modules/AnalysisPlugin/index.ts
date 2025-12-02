/**
 * 分析类插件
 * 提供量算功能（空间距离、水平面积、高度差、坐标测量、贴地距离、贴地面积、三角测量、方位角）
 * 支持顶点吸附、GeoJSON导入导出、修改标绘坐标更新测量结果
 */

import { BasePlugin } from '../../BasePlugin'
import type { AutoViewer } from '@auto-cesium/core'
import type { GraphicsPlugin } from '../GraphicsPlugin'
import * as Cesium from 'cesium'
import type { MeasureTypeString, MeasureStyle, MeasureResult, SnapConfig, MeasureOptions, MeasureConfig } from './types'
import { MeasureEventType } from './types'
import { MeasureBase } from './MeasureBase'
import { MeasureDistance } from './measures/MeasureDistance'
import { MeasureSurfaceDistance } from './measures/MeasureSurfaceDistance'
import { MeasureArea } from './measures/MeasureArea'
import { MeasureSurfaceArea } from './measures/MeasureSurfaceArea'
import { MeasureHeight } from './measures/MeasureHeight'
import { MeasureCoordinate } from './measures/MeasureCoordinate'
import { MeasureTriangle } from './measures/MeasureTriangle'
import { MeasureAngle } from './measures/MeasureAngle'
import { MeasureProfile } from './measures/MeasureProfile'
import { MeasureVolume } from './measures/MeasureVolume'
import { MeasureViewshed } from './measures/MeasureViewshed'
import { MeasureSkyline } from './measures/MeasureSkyline'
import { MeasureShortestPath } from './measures/MeasureShortestPath'
import { MeasureBuffer } from './measures/MeasureBuffer'
import { MeasureViewshedAnalysis } from './measures/MeasureViewshedAnalysis'
import { MeasureSunlight } from './measures/MeasureSunlight'
import { MeasureOverlay } from './measures/MeasureOverlay'

/**
 * GeoJSON 几何类型
 */
interface GeoJSONGeometry {
  type: 'Point' | 'LineString' | 'Polygon'
  coordinates: number[] | number[][] | number[][][]
}

/**
 * GeoJSON 特征
 */
interface GeoJSONFeature {
  type: 'Feature'
  properties: {
    measureType: string
    value: number | string | Record<string, unknown>
    text?: string
  }
  geometry: GeoJSONGeometry
}

/**
 * 分析插件配置
 */
export interface AnalysisPluginOptions {
  /** 默认样式 */
  style?: Partial<MeasureStyle>
  /** 顶点吸附配置 */
  snap?: Partial<SnapConfig>
  /** 是否显示中间点 */
  showMidpoint?: boolean
  /** 是否实时更新测量值 */
  liveUpdate?: boolean
}

/**
 * 分析插件类
 */
export class AnalysisPlugin extends BasePlugin {
  static readonly pluginName = 'analysis'
  readonly name = 'analysis'

  /** 插件配置 */
  private options: AnalysisPluginOptions = {
    showMidpoint: true,
    liveUpdate: true
  }

  /** 图形插件实例 */
  private graphicsPlugin: GraphicsPlugin | null = null

  /** 数据源 */
  private dataSource: Cesium.CustomDataSource | null = null

  /** 当前量算工具实例 */
  private currentMeasure: MeasureBase | null = null

  /** 量算结果集合 */
  private results: Map<string, MeasureResult> = new Map()

  /** 事件监听器 */
  private listeners: Map<MeasureEventType, Set<(data: Record<string, unknown>) => void>> = new Map()

  /**
   * 插件安装
   */
  protected onInstall(viewer: AutoViewer, options?: AnalysisPluginOptions): void {
    this.options = { ...this.options, ...(options || {}) }

    // 获取图形插件实例
    this.graphicsPlugin = viewer.getPlugin<GraphicsPlugin>('graphics') || null

    // 创建数据源（如果GraphicsPlugin存在则共享数据源）
    const sharedDataSource = this.graphicsPlugin?.getDataSource()
    if (sharedDataSource) {
      this.dataSource = sharedDataSource
    } else {
      this.dataSource = new Cesium.CustomDataSource('AnalysisPlugin-DataSource')
      this.cesiumViewer.dataSources.add(this.dataSource)
    }
  }

  /**
   * 开始量算
   */
  startMeasure(options: MeasureOptions): this {
    // 停止当前的量算
    this.stopMeasure()

    if (!this.dataSource) {
      return this
    }

    // 创建量算配置
    const measureConfig: MeasureConfig = {
      viewer: this.cesiumViewer,
      dataSource: this.dataSource,
      style: { ...this.options.style, ...options.style },
      snap: this.options.snap,
      showMidpoint: this.options.showMidpoint,
      liveUpdate: this.options.liveUpdate
    }

    // 根据类型创建对应的量算工具
    this.currentMeasure = this.createMeasure(options.type, measureConfig)

    if (!this.currentMeasure) {
      return this
    }

    // 设置样式
    if (measureConfig.style) {
      this.currentMeasure.setStyle(measureConfig.style)
    }

    // 设置顶点吸附
    if (measureConfig.snap) {
      this.currentMeasure.setSnapConfig(measureConfig.snap)
    }

    // 设置剖面分析配置
    if (options.type === 'profile' && options.profileOptions) {
      const profileMeasure = this.currentMeasure as MeasureProfile
      profileMeasure.setProfileOptions(options.profileOptions)
    }

    // 设置方量分析配置
    if (options.type === 'volume' && options.volumeOptions) {
      const volumeMeasure = this.currentMeasure as MeasureVolume
      volumeMeasure.setVolumeOptions(options.volumeOptions)
    }

    // 设置通视分析配置
    if (options.type === 'viewshed' && options.viewshedOptions) {
      const viewshedMeasure = this.currentMeasure as MeasureViewshed
      viewshedMeasure.setViewshedOptions(options.viewshedOptions)
    }

    // 设置环视分析配置
    if (options.type === 'skyline' && options.skylineOptions) {
      const skylineMeasure = this.currentMeasure as MeasureSkyline
      skylineMeasure.setSkylineOptions(options.skylineOptions)
    }

    // 设置最短路径分析配置
    if (options.type === 'shortestPath' && options.shortestPathOptions) {
      const shortestPathMeasure = this.currentMeasure as MeasureShortestPath
      shortestPathMeasure.setShortestPathOptions(options.shortestPathOptions)
    }

    // 设置缓冲区分析配置
    if (options.type === 'buffer' && options.bufferOptions) {
      const bufferMeasure = this.currentMeasure as MeasureBuffer
      bufferMeasure.setBufferOptions(options.bufferOptions)
    }

    // 设置可视域分析配置
    if (options.type === 'viewshedAnalysis' && options.viewshedAnalysisOptions) {
      const viewshedAnalysisMeasure = this.currentMeasure as MeasureViewshedAnalysis
      viewshedAnalysisMeasure.setViewshedAnalysisOptions(options.viewshedAnalysisOptions)
    }

    // 设置日照分析配置
    if (options.type === 'sunlight' && options.sunlightOptions) {
      const sunlightMeasure = this.currentMeasure as MeasureSunlight
      sunlightMeasure.setSunlightOptions(options.sunlightOptions)
    }

    // 设置叠面分析配置
    if (options.type === 'overlay' && options.overlayOptions) {
      const overlayMeasure = this.currentMeasure as MeasureOverlay
      overlayMeasure.setOverlayOptions(options.overlayOptions)
    }

    // 绑定事件
    if (options.onComplete) {
      this.currentMeasure.on('measure:complete', (...args: unknown[]) => {
        const result = args[0] as MeasureResult
        this.results.set(result.entity?.id || '', result)
        options.onComplete?.(result)
      })
    }

    if (options.onUpdate) {
      this.currentMeasure.on('measure:update', (...args: unknown[]) => {
        const result = args[0] as MeasureResult
        options.onUpdate?.(result)
      })
    }

    // 转发所有事件
    const eventTypes: MeasureEventType[] = [
      MeasureEventType.START,
      MeasureEventType.POINT_ADD,
      MeasureEventType.COMPLETE,
      MeasureEventType.UPDATE,
      MeasureEventType.CLEAR,
      MeasureEventType.REMOVE,
      MeasureEventType.SNAP
    ]

    eventTypes.forEach((eventType) => {
      this.currentMeasure?.on(eventType, (...args: unknown[]) => {
        const data = (args[0] as Record<string, unknown>) || {}
        this.fireEvent(eventType, data)
      })
    })

    // 启用量算工具
    this.currentMeasure.enable()

    return this
  }

  /**
   * 创建量算工具
   */
  private createMeasure(type: MeasureTypeString, config: MeasureConfig): MeasureBase | null {
    const drawConfig = {
      viewer: config.viewer,
      dataSource: config.dataSource,
      style: config.style
    }

    switch (type) {
      case 'distance':
        return new MeasureDistance(drawConfig)
      case 'surfaceDistance':
        return new MeasureSurfaceDistance(drawConfig)
      case 'area':
        return new MeasureArea(drawConfig)
      case 'surfaceArea':
        return new MeasureSurfaceArea(drawConfig)
      case 'height':
        return new MeasureHeight(drawConfig)
      case 'coordinate':
        return new MeasureCoordinate(drawConfig)
      case 'triangle':
        return new MeasureTriangle(drawConfig)
      case 'angle':
        return new MeasureAngle(drawConfig)
      case 'profile':
        return new MeasureProfile(drawConfig)
      case 'volume':
        return new MeasureVolume(drawConfig)
      case 'viewshed':
        return new MeasureViewshed(drawConfig)
      case 'skyline':
        return new MeasureSkyline(drawConfig)
      case 'shortestPath':
        return new MeasureShortestPath(drawConfig)
      case 'buffer':
        return new MeasureBuffer(drawConfig)
      case 'viewshedAnalysis':
        return new MeasureViewshedAnalysis(drawConfig)
      case 'sunlight':
        return new MeasureSunlight(drawConfig)
      case 'overlay':
        return new MeasureOverlay(drawConfig)
      default:
        return null
    }
  }

  /**
   * 停止量算
   */
  stopMeasure(): this {
    if (this.currentMeasure) {
      this.currentMeasure.disable()
      this.currentMeasure = null
    }
    return this
  }

  /**
   * 清除所有量算结果
   */
  clearAll(): this {
    this.stopMeasure()

    if (this.dataSource) {
      this.dataSource.entities.removeAll()
    }

    this.results.clear()
    this.fireEvent(MeasureEventType.CLEAR, {})
    return this
  }

  /**
   * 移除指定的量算结果
   */
  remove(entityId: string): this {
    if (this.dataSource) {
      const entity = this.dataSource.entities.getById(entityId)
      if (entity) {
        this.dataSource.entities.remove(entity)
        this.results.delete(entityId)
        this.fireEvent(MeasureEventType.REMOVE, { entityId })
      }
    }
    return this
  }

  /**
   * 获取所有量算结果
   */
  getResults(): MeasureResult[] {
    return Array.from(this.results.values())
  }

  /**
   * 获取指定的量算结果
   */
  getResult(entityId: string): MeasureResult | null {
    return this.results.get(entityId) || null
  }

  /**
   * 导出为 GeoJSON
   */
  exportGeoJSON(): GeoJSONFeature[] {
    const features: GeoJSONFeature[] = []

    this.results.forEach((result) => {
      const coordinates = result.positions.map((pos) => {
        const carto = Cesium.Cartographic.fromCartesian(pos)
        return [Cesium.Math.toDegrees(carto.longitude), Cesium.Math.toDegrees(carto.latitude), carto.height]
      })

      let geometry: GeoJSONGeometry
      if (result.positions.length === 1) {
        geometry = { type: 'Point', coordinates: coordinates[0] }
      } else if (result.type === 'area' || result.type === 'surfaceArea' || result.type === 'triangle') {
        // 闭合多边形
        const closedCoords = [...coordinates]
        if (coordinates.length > 0 && coordinates[0] !== coordinates[coordinates.length - 1]) {
          closedCoords.push(coordinates[0])
        }
        geometry = { type: 'Polygon', coordinates: [closedCoords] }
      } else {
        geometry = { type: 'LineString', coordinates }
      }

      features.push({
        type: 'Feature',
        properties: {
          measureType: result.type,
          value: result.value,
          text: result.text
        },
        geometry
      })
    })

    return features
  }

  /**
   * 从 GeoJSON 导入
   */
  importGeoJSON(features: GeoJSONFeature[]): this {
    features.forEach((feature) => {
      if (!feature.geometry || !feature.properties) return

      const { geometry, properties } = feature
      const positions: Cesium.Cartesian3[] = []

      // 解析坐标
      const parseCoordinates = (coords: number[][]): Cesium.Cartesian3[] => {
        return coords.map((coord) => Cesium.Cartesian3.fromDegrees(coord[0], coord[1], coord[2] || 0))
      }

      switch (geometry.type) {
        case 'Point': {
          const coords = geometry.coordinates as number[]
          positions.push(Cesium.Cartesian3.fromDegrees(coords[0], coords[1], coords[2] || 0))
          break
        }
        case 'LineString': {
          const coords = geometry.coordinates as number[][]
          positions.push(...parseCoordinates(coords))
          break
        }
        case 'Polygon': {
          const coords = geometry.coordinates as number[][][]
          // 取外环
          if (coords.length > 0) {
            positions.push(...parseCoordinates(coords[0]))
          }
          break
        }
      }

      // 创建对应的量算结果
      if (positions.length > 0) {
        const result: MeasureResult = {
          type: properties.measureType as MeasureTypeString,
          value: properties.value,
          positions,
          text: properties.text as string
        }
        this.results.set(result.entity?.id || '', result)
      }
    })

    return this
  }

  /**
   * 设置顶点吸附配置
   */
  setSnapConfig(config: Partial<SnapConfig>): this {
    this.options.snap = { ...this.options.snap, ...config }

    // 如果 GraphicsPlugin 存在且启用吸附，自动添加其数据源
    if (this.graphicsPlugin && config.enabled) {
      const sharedDataSource = this.graphicsPlugin.getDataSource()
      if (sharedDataSource) {
        if (!this.options.snap?.dataSources) {
          this.options.snap.dataSources = []
        }
        if (!this.options.snap.dataSources.includes(sharedDataSource)) {
          this.options.snap.dataSources.push(sharedDataSource)
        }
      }
    }

    return this
  }

  /**
   * 监听事件
   */
  on(type: MeasureEventType, callback: (data: Record<string, unknown>) => void): this {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(callback)
    return this
  }

  /**
   * 取消监听事件
   */
  off(type: MeasureEventType, callback?: (data: Record<string, unknown>) => void): this {
    if (!callback) {
      this.listeners.delete(type)
    } else {
      this.listeners.get(type)?.delete(callback)
    }
    return this
  }

  /**
   * 触发事件
   */
  private fireEvent(type: MeasureEventType, data: Record<string, unknown>): void {
    const callbacks = this.listeners.get(type)
    if (callbacks) {
      callbacks.forEach((callback) => callback(data))
    }
  }

  /**
   * 插件销毁
   */
  protected onDestroy(): void {
    this.stopMeasure()
    this.clearAll()

    // 如果不是共享的数据源，则移除
    const sharedDataSource = this.graphicsPlugin?.getDataSource()
    if (this.dataSource && !sharedDataSource && this.cesiumViewer.dataSources.contains(this.dataSource)) {
      this.cesiumViewer.dataSources.remove(this.dataSource, true)
    }

    this.dataSource = null
    this.graphicsPlugin = null
    this.listeners.clear()
  }
}

// 导出所有类型和类
export * from './types'
export { MeasureBase } from './MeasureBase'
export { MeasureDistance } from './measures/MeasureDistance'
export { MeasureSurfaceDistance } from './measures/MeasureSurfaceDistance'
export { MeasureArea } from './measures/MeasureArea'
export { MeasureSurfaceArea } from './measures/MeasureSurfaceArea'
export { MeasureHeight } from './measures/MeasureHeight'
export { MeasureCoordinate } from './measures/MeasureCoordinate'
export { MeasureTriangle } from './measures/MeasureTriangle'
export { MeasureAngle } from './measures/MeasureAngle'
export { MeasureProfile } from './measures/MeasureProfile'
export { MeasureVolume } from './measures/MeasureVolume'
export { MeasureViewshed } from './measures/MeasureViewshed'
export { MeasureSkyline } from './measures/MeasureSkyline'
export { MeasureShortestPath } from './measures/MeasureShortestPath'
export { MeasureBuffer } from './measures/MeasureBuffer'
export { MeasureViewshedAnalysis } from './measures/MeasureViewshedAnalysis'
export { MeasureSunlight } from './measures/MeasureSunlight'
export { MeasureOverlay } from './measures/MeasureOverlay'
