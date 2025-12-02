/**
 * 地形插件
 * 支持多种地形服务(Cesium World Terrain、ArcGIS、Google、自定义服务等)
 * 提供水效果、地形淹没分析功能
 */

import { BasePlugin } from '../../BasePlugin'
import type { AutoViewer } from '@auto-cesium/core'
import * as Cesium from 'cesium'
import type {
  TerrainOptions,
  CesiumWorldTerrainOptions,
  CesiumIonTerrainOptions,
  ArcGISTerrainOptions,
  GoogleTerrainOptions,
  MapboxTerrainOptions,
  CustomTerrainOptions,
  EllipsoidTerrainOptions,
  WaterEffectOptions,
  FloodAnalysisOptions,
  TerrainSampleOptions,
  TerrainElevationData
} from './types'

/**
 * 扩展 Globe 接口，添加地形夸张属性
 */
interface ExtendedGlobe extends Cesium.Globe {
  terrainExaggeration?: number
  terrainExaggerationRelativeHeight?: number
}

/**
 * 地形插件配置
 */
export interface TerrainPluginOptions {
  /** 默认地形配置 */
  defaultTerrain?: TerrainOptions
  /** 是否自动应用地形 */
  autoApply?: boolean
}

/**
 * 地形插件类
 */
export class TerrainPlugin extends BasePlugin {
  static readonly pluginName = 'terrain'
  readonly name = 'terrain'

  /** 插件配置 */
  private options: TerrainPluginOptions = {
    autoApply: true
  }

  /** 当前地形提供者 */
  private currentTerrainProvider: Cesium.TerrainProvider | null = null

  /** 当前地形配置 */
  private currentTerrainOptions: TerrainOptions | null = null

  /** 水效果实体集合 */
  private waterEffects: Map<string, Cesium.Entity> = new Map()

  /** 地形淹没分析实例集合 */
  private floodAnalyses: Map<string, FloodAnalysis> = new Map()

  /** 数据源 */
  private dataSource: Cesium.CustomDataSource | null = null

  /**
   * 插件安装
   */
  protected onInstall(_viewer: AutoViewer, options?: TerrainPluginOptions): void {
    this.options = { ...this.options, ...(options || {}) }

    // 创建数据源
    this.dataSource = new Cesium.CustomDataSource('TerrainPlugin-DataSource')
    this.cesiumViewer.dataSources.add(this.dataSource)

    // 应用默认地形
    if (this.options.autoApply && this.options.defaultTerrain) {
      this.setTerrain(this.options.defaultTerrain)
    }
  }

  /**
   * 设置地形
   * @param options 地形配置
   * @returns Promise<void>
   * @example
   * ```ts
   * // 使用 Cesium World Terrain
   * await terrain.setTerrain({
   *   type: TerrainServiceType.CESIUM_WORLD,
   *   requestWaterMask: true,
   *   requestVertexNormals: true,
   *   enableLighting: true
   * })
   *
   * // 使用自定义地形服务
   * await terrain.setTerrain({
   *   type: TerrainServiceType.CUSTOM,
   *   url: 'https://example.com/terrain',
   *   requestVertexNormals: true,
   *   enableLighting: true
   * })
   * ```
   */
  async setTerrain(options: TerrainOptions): Promise<void> {
    this.ensureInstalled()

    try {
      const provider = await this.createTerrainProvider(options)

      // 应用地形提供者
      this.cesiumViewer.terrainProvider = provider
      this.currentTerrainProvider = provider
      this.currentTerrainOptions = options

      // 应用地形配置
      this.applyTerrainOptions(options)
    } catch (error) {
      console.error('Failed to set terrain:', error)
      throw error
    }
  }

  /**
   * 创建地形提供者
   * @private
   */
  private async createTerrainProvider(options: TerrainOptions): Promise<Cesium.TerrainProvider> {
    switch (options.type) {
      case 'cesium-world':
        return this.createCesiumWorldTerrain(options as CesiumWorldTerrainOptions)

      case 'cesium-ion':
        return this.createCesiumIonTerrain(options as CesiumIonTerrainOptions)

      case 'arcgis':
        return this.createArcGISTerrain(options as ArcGISTerrainOptions)

      case 'google':
        return this.createGoogleTerrain(options as GoogleTerrainOptions)

      case 'mapbox':
        return this.createMapboxTerrain(options as MapboxTerrainOptions)

      case 'custom':
        return this.createCustomTerrain(options as CustomTerrainOptions)

      case 'ellipsoid':
        return this.createEllipsoidTerrain(options as EllipsoidTerrainOptions)

      default:
        return new Cesium.EllipsoidTerrainProvider()
    }
  }

  /**
   * 创建 Cesium World Terrain
   * @private
   */
  private async createCesiumWorldTerrain(options: CesiumWorldTerrainOptions): Promise<Cesium.TerrainProvider> {
    return Cesium.CesiumTerrainProvider.fromUrl(Cesium.IonResource.fromAssetId(1), {
      requestWaterMask: options.requestWaterMask,
      requestVertexNormals: options.requestVertexNormals
    })
  }

  /**
   * 创建 Cesium Ion 地形
   * @private
   */
  private async createCesiumIonTerrain(options: CesiumIonTerrainOptions): Promise<Cesium.TerrainProvider> {
    const resource = await Cesium.IonResource.fromAssetId(options.assetId, {
      accessToken: options.accessToken
    })

    return Cesium.CesiumTerrainProvider.fromUrl(resource, {
      requestWaterMask: options.requestWaterMask,
      requestVertexNormals: options.requestVertexNormals
    })
  }

  /**
   * 创建 ArcGIS 地形
   * @private
   */
  private async createArcGISTerrain(options: ArcGISTerrainOptions): Promise<Cesium.TerrainProvider> {
    return Cesium.ArcGISTiledElevationTerrainProvider.fromUrl(options.url, {
      token: options.token
    })
  }

  /**
   * 创建 Google 地形
   * @private
   */
  private async createGoogleTerrain(options: GoogleTerrainOptions): Promise<Cesium.TerrainProvider> {
    // Google Photorealistic 3D Tiles 包含地形数据
    // 这里使用 GoogleEarthEnterpriseTerrainProvider
    if (options.apiKey) {
      // 如果有API密钥，可以配置访问
      console.warn('Google Terrain requires proper configuration')
    }

    // Google Earth Enterprise 地形需要特定的服务器配置
    // 这里返回基础的椭球体地形作为占位
    return new Cesium.EllipsoidTerrainProvider()
  }

  /**
   * 创建 Mapbox 地形
   * @private
   */
  private async createMapboxTerrain(options: MapboxTerrainOptions): Promise<Cesium.TerrainProvider> {
    const mapId = options.mapId || 'mapbox.terrain-rgb'
    const url = `https://api.mapbox.com/v4/${mapId}/{z}/{x}/{y}.terrain?access_token=${options.accessToken}`

    return Cesium.CesiumTerrainProvider.fromUrl(url, {
      requestWaterMask: false,
      requestVertexNormals: false
    })
  }

  /**
   * 创建自定义地形
   * @private
   */
  private async createCustomTerrain(options: CustomTerrainOptions): Promise<Cesium.TerrainProvider> {
    // 构建基础配置
    const providerOptions: Partial<Cesium.CesiumTerrainProvider.ConstructorOptions> & {
      rectangle?: Cesium.Rectangle
      minimumLevel?: number
      maximumLevel?: number
      credit?: string
    } = {
      requestWaterMask: options.requestWaterMask,
      requestVertexNormals: options.requestVertexNormals
    }

    // 设置区域范围
    if (options.rectangle) {
      providerOptions.rectangle = Cesium.Rectangle.fromDegrees(
        options.rectangle[0],
        options.rectangle[1],
        options.rectangle[2],
        options.rectangle[3]
      )
    }

    // 设置层级范围
    if (options.minimumLevel !== undefined) {
      providerOptions.minimumLevel = options.minimumLevel
    }
    if (options.maximumLevel !== undefined) {
      providerOptions.maximumLevel = options.maximumLevel
    }

    // 设置信用信息
    if (options.credit) {
      providerOptions.credit = options.credit
    }

    return Cesium.CesiumTerrainProvider.fromUrl(options.url, providerOptions)
  }

  /**
   * 创建椭球体地形
   * @private
   */
  private createEllipsoidTerrain(_options: EllipsoidTerrainOptions): Cesium.TerrainProvider {
    return new Cesium.EllipsoidTerrainProvider()
  }

  /**
   * 应用地形配置
   * @private
   */
  private applyTerrainOptions(options: TerrainOptions): void {
    const scene = this.cesiumViewer.scene
    const globe = scene.globe as ExtendedGlobe

    // 设置光照
    if (options.enableLighting !== undefined) {
      globe.enableLighting = options.enableLighting
    }

    // 设置地形夸张倍数
    if (options.exaggeration !== undefined) {
      globe.terrainExaggeration = options.exaggeration
    }

    // 设置地形相对高度夸张
    if (options.exaggerationRelativeHeight !== undefined) {
      globe.terrainExaggerationRelativeHeight = options.exaggerationRelativeHeight
    }

    // 设置可见性
    if (options.show !== undefined) {
      globe.show = options.show
    }
  }

  /**
   * 移除地形(恢复为椭球体)
   */
  removeTerrain(): void {
    this.ensureInstalled()

    this.cesiumViewer.terrainProvider = new Cesium.EllipsoidTerrainProvider()
    this.currentTerrainProvider = null
    this.currentTerrainOptions = null
  }

  /**
   * 设置地形夸张倍数
   * @param exaggeration 夸张倍数
   */
  setExaggeration(exaggeration: number): void {
    this.ensureInstalled()
    const globe = this.cesiumViewer.scene.globe as ExtendedGlobe
    globe.terrainExaggeration = exaggeration
  }

  /**
   * 设置地形相对高度夸张
   * @param height 相对高度
   */
  setExaggerationRelativeHeight(height: number): void {
    this.ensureInstalled()
    const globe = this.cesiumViewer.scene.globe as ExtendedGlobe
    globe.terrainExaggerationRelativeHeight = height
  }

  /**
   * 启用/禁用地形光照
   * @param enabled 是否启用
   */
  enableLighting(enabled: boolean): void {
    this.ensureInstalled()
    this.cesiumViewer.scene.globe.enableLighting = enabled
  }

  /**
   * 获取当前地形配置
   */
  getCurrentTerrainOptions(): TerrainOptions | null {
    return this.currentTerrainOptions
  }

  /**
   * 获取当前地形提供者
   */
  getCurrentTerrainProvider(): Cesium.TerrainProvider | null {
    return this.currentTerrainProvider
  }

  /**
   * 采样地形高程
   * @param positions 采样位置
   * @param options 采样配置
   * @returns Promise<TerrainElevationData[]>
   * @example
   * ```ts
   * const positions = [
   *   Cesium.Cartesian3.fromDegrees(116.4, 39.9),
   *   Cesium.Cartesian3.fromDegrees(121.5, 31.2)
   * ]
   * const elevations = await terrain.sampleTerrain(positions)
   * console.log(elevations[0].elevation) // 海拔高度(米)
   * ```
   */
  async sampleTerrain(
    positions: Cesium.Cartesian3[],
    _options?: TerrainSampleOptions
  ): Promise<TerrainElevationData[]> {
    this.ensureInstalled()

    const terrainProvider = this.currentTerrainProvider || this.cesiumViewer.terrainProvider

    // 转换为地理坐标
    const cartographicPositions = positions.map((pos) => Cesium.Cartographic.fromCartesian(pos))

    // 采样地形
    const sampledPositions = await Cesium.sampleTerrainMostDetailed(terrainProvider, cartographicPositions)

    // 转换为结果格式
    return sampledPositions.map((cartographic, index) => ({
      position: positions[index],
      elevation: cartographic.height,
      longitude: Cesium.Math.toDegrees(cartographic.longitude),
      latitude: Cesium.Math.toDegrees(cartographic.latitude)
    }))
  }

  /**
   * 添加水效果
   * @param id 水效果ID
   * @param options 水效果配置
   * @returns 水效果实体
   * @example
   * ```ts
   * const waterPositions = [
   *   Cesium.Cartesian3.fromDegrees(116.4, 39.9),
   *   Cesium.Cartesian3.fromDegrees(116.5, 39.9),
   *   Cesium.Cartesian3.fromDegrees(116.5, 40.0),
   *   Cesium.Cartesian3.fromDegrees(116.4, 40.0)
   * ]
   *
   * terrain.addWaterEffect('lake', {
   *   positions: waterPositions,
   *   height: 100,
   *   color: '#0088ff',
   *   alpha: 0.6
   * })
   * ```
   */
  addWaterEffect(id: string, options: WaterEffectOptions): Cesium.Entity {
    this.ensureInstalled()

    if (this.waterEffects.has(id)) {
      console.warn(`Water effect "${id}" already exists`)
      return this.waterEffects.get(id)!
    }

    if (!this.dataSource) {
      throw new Error('Data source not initialized')
    }

    const entity = this.dataSource.entities.add({
      id: `water-${id}`,
      polygon: {
        hierarchy: new Cesium.PolygonHierarchy(options.positions),
        height: options.height,
        material: Cesium.Color.fromCssColorString(options.color || '#0088ff').withAlpha(options.alpha ?? 0.5),
        show: options.show !== false
      }
    })

    this.waterEffects.set(id, entity)
    return entity
  }

  /**
   * 移除水效果
   * @param id 水效果ID
   */
  removeWaterEffect(id: string): boolean {
    const entity = this.waterEffects.get(id)
    if (!entity || !this.dataSource) {
      return false
    }

    this.dataSource.entities.remove(entity)
    this.waterEffects.delete(id)
    return true
  }

  /**
   * 创建地形淹没分析(基于已绘制的面要素)
   * @param id 分析ID
   * @param entity GraphicsPlugin绘制的面要素
   * @param options 淹没分析配置
   * @returns 淹没分析实例
   * @example
   * ```ts
   * // 1. 先使用 GraphicsPlugin 绘制淹没区域
   * const graphics = viewer.getPlugin<GraphicsPlugin>('graphics')
   * graphics.startDraw({
   *   type: 'polygon',
   *   style: { color: '#00ff00', opacity: 0.3 },
   *   success: (entity) => {
   *     // 2. 绘制完成后,基于绘制的面创建淹没分析
   *     const analysis = terrain.createFloodAnalysis('flood-1', entity, {
   *       startHeight: 0,
   *       targetHeight: 50,
   *       duration: 10,
   *       waterColor: '#0088ff',
   *       onHeightChange: (height) => {
   *         console.log('Current water height:', height)
   *       }
   *     })
   *
   *     // 3. 开始淹没动画
   *     analysis.start()
   *   }
   * })
   * ```
   */
  createFloodAnalysis(
    id: string,
    entity: Cesium.Entity,
    options: Omit<FloodAnalysisOptions, 'positions'>
  ): FloodAnalysis {
    this.ensureInstalled()

    if (this.floodAnalyses.has(id)) {
      console.warn(`Flood analysis "${id}" already exists`)
      return this.floodAnalyses.get(id)!
    }

    if (!this.dataSource) {
      throw new Error('Data source not initialized')
    }

    // 从 GraphicsPlugin 的面要素中获取坐标
    const positions = this.getPositionsFromEntity(entity)
    if (!positions || positions.length === 0) {
      throw new Error('Failed to get positions from entity. Make sure the entity is a polygon.')
    }

    const fullOptions: FloodAnalysisOptions = {
      ...options,
      positions
    }

    const analysis = new FloodAnalysis(this.cesiumViewer, this.dataSource, id, fullOptions, entity)
    this.floodAnalyses.set(id, analysis)

    if (options.autoStart) {
      analysis.start()
    }

    return analysis
  }

  /**
   * 从实体中提取坐标点
   * @private
   */
  private getPositionsFromEntity(entity: Cesium.Entity): Cesium.Cartesian3[] | null {
    // 尝试从 polygon 获取坐标
    if (entity.polygon && entity.polygon.hierarchy) {
      const hierarchy = entity.polygon.hierarchy
      if (hierarchy instanceof Cesium.PolygonHierarchy) {
        return hierarchy.positions
      }
      if (typeof hierarchy.getValue === 'function') {
        const value = hierarchy.getValue(Cesium.JulianDate.now())
        if (value instanceof Cesium.PolygonHierarchy) {
          return value.positions
        }
      }
    }

    // 尝试从 polyline 获取坐标
    if (entity.polyline && entity.polyline.positions) {
      const positions = entity.polyline.positions
      if (Array.isArray(positions)) {
        return positions as Cesium.Cartesian3[]
      }
      if (typeof positions.getValue === 'function') {
        return positions.getValue(Cesium.JulianDate.now()) as Cesium.Cartesian3[]
      }
    }

    // 尝试从自定义属性获取
    const entityExt = entity as Cesium.Entity & { _positions_draw?: Cesium.Cartesian3[] }
    if (entityExt._positions_draw) {
      return entityExt._positions_draw
    }

    return null
  }

  /**
   * 移除淹没分析
   * @param id 分析ID
   */
  removeFloodAnalysis(id: string): boolean {
    const analysis = this.floodAnalyses.get(id)
    if (!analysis) {
      return false
    }

    analysis.destroy()
    this.floodAnalyses.delete(id)
    return true
  }

  /**
   * 获取淹没分析实例
   * @param id 分析ID
   */
  getFloodAnalysis(id: string): FloodAnalysis | undefined {
    return this.floodAnalyses.get(id)
  }

  /**
   * 清除所有水效果和淹没分析
   */
  clearAll(): void {
    // 清除水效果
    this.waterEffects.forEach((entity) => {
      if (this.dataSource) {
        this.dataSource.entities.remove(entity)
      }
    })
    this.waterEffects.clear()

    // 清除淹没分析
    this.floodAnalyses.forEach((analysis) => {
      analysis.destroy()
    })
    this.floodAnalyses.clear()
  }

  /**
   * 插件销毁
   */
  protected onDestroy(): void {
    this.clearAll()

    // 移除数据源
    if (this.dataSource && this.cesiumViewer.dataSources.contains(this.dataSource)) {
      this.cesiumViewer.dataSources.remove(this.dataSource, true)
    }

    this.dataSource = null
    this.currentTerrainProvider = null
    this.currentTerrainOptions = null
  }
}

/**
 * 地形淹没分析类
 */
export class FloodAnalysis {
  private dataSource: Cesium.CustomDataSource
  private id: string
  private options: FloodAnalysisOptions
  private entity: Cesium.Entity | null = null
  private sourceEntity: Cesium.Entity | null = null
  private isRunning: boolean = false
  private currentHeight: number
  private animationFrameId: number | null = null

  constructor(
    _viewer: Cesium.Viewer,
    dataSource: Cesium.CustomDataSource,
    id: string,
    options: FloodAnalysisOptions,
    sourceEntity?: Cesium.Entity
  ) {
    this.dataSource = dataSource
    this.id = id
    this.options = options
    this.sourceEntity = sourceEntity || null
    this.currentHeight = options.currentHeight ?? options.startHeight

    // 隐藏原始绘制的面
    if (this.sourceEntity && this.sourceEntity.polygon) {
      this.sourceEntity.show = false
    }

    this.createEntity()
  }

  /**
   * 创建淹没实体
   * @private
   */
  private createEntity(): void {
    this.entity = this.dataSource.entities.add({
      id: `flood-${this.id}`,
      polygon: {
        hierarchy: new Cesium.PolygonHierarchy(this.options.positions),
        height: this.currentHeight,
        material: Cesium.Color.fromCssColorString(this.options.waterColor || '#0088ff').withAlpha(
          this.options.alpha ?? 0.6
        ),
        show: true
      }
    })
  }

  /**
   * 开始淹没动画
   */
  start(): void {
    if (this.isRunning) {
      return
    }

    this.isRunning = true
    const startTime = Date.now()
    const duration = (this.options.duration ?? 5) * 1000 // 转换为毫秒
    const heightDiff = this.options.targetHeight - this.options.startHeight

    const animate = () => {
      if (!this.isRunning) {
        return
      }

      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      this.currentHeight = this.options.startHeight + heightDiff * progress

      // 更新实体高度
      if (this.entity && this.entity.polygon) {
        this.entity.polygon.height = new Cesium.ConstantProperty(this.currentHeight)
      }

      // 触发回调
      this.options.onHeightChange?.(this.currentHeight)

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate)
      } else {
        this.isRunning = false
        this.options.onComplete?.()

        // 循环播放
        if (this.options.loop) {
          this.reset()
          this.start()
        }
      }
    }

    animate()
  }

  /**
   * 暂停淹没动画
   */
  pause(): void {
    this.isRunning = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  /**
   * 重置淹没分析
   */
  reset(): void {
    this.pause()
    this.currentHeight = this.options.startHeight
    if (this.entity && this.entity.polygon) {
      this.entity.polygon.height = new Cesium.ConstantProperty(this.currentHeight)
    }
  }

  /**
   * 设置当前高度
   */
  setHeight(height: number): void {
    this.currentHeight = height
    if (this.entity && this.entity.polygon) {
      this.entity.polygon.height = new Cesium.ConstantProperty(height)
    }
    this.options.onHeightChange?.(height)
  }

  /**
   * 获取当前高度
   */
  getCurrentHeight(): number {
    return this.currentHeight
  }

  /**
   * 显示/隐藏淹没区域
   */
  setVisible(visible: boolean): void {
    if (this.entity && this.entity.polygon) {
      this.entity.polygon.show = new Cesium.ConstantProperty(visible)
    }
  }

  /**
   * 销毁淹没分析
   */
  destroy(): void {
    this.pause()
    if (this.entity) {
      this.dataSource.entities.remove(this.entity)
      this.entity = null
    }

    // 恢复原始绘制的面
    if (this.sourceEntity) {
      this.sourceEntity.show = true
      this.sourceEntity = null
    }
  }
}

// 导出所有类型定义
export * from './types'
export * from './presets'
