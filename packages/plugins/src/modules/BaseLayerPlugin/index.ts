import type {
  ImageryLayer,
  UrlTemplateImageryProvider as CesiumUrlTemplateImageryProvider,
  WebMapServiceImageryProvider as CesiumWebMapServiceImageryProvider,
  WebMapTileServiceImageryProvider as CesiumWebMapTileServiceImageryProvider,
  Rectangle
} from 'cesium'
import {
  UrlTemplateImageryProvider,
  WebMapServiceImageryProvider,
  WebMapTileServiceImageryProvider,
  ArcGisMapServerImageryProvider,
  SingleTileImageryProvider,
  Rectangle as CesiumRectangle,
  WebMercatorTilingScheme,
  GeographicTilingScheme
} from 'cesium'
import { BasePlugin } from '../../BasePlugin'
import type { AutoViewer } from '@auto-cesium/core'
import type {
  BaseLayerOptions,
  XYZLayerOptions,
  TMSLayerOptions,
  WMSLayerOptions,
  WMTSLayerOptions,
  ArcGISLayerOptions,
  SingleImageLayerOptions,
  TimeSeriesLayerOptions
} from './types'
import { CoordinateSystem } from './types'
import {
  createTiandituConfig,
  createAmapConfig,
  createTencentConfig,
  createBaiduConfig,
  createGeovisConfig,
  createSuperMapConfig,
  type TiandituOptions,
  type AmapOptions,
  type TencentOptions,
  type BaiduOptions,
  type GeovisOptions,
  type SuperMapOptions
} from './presets'

/**
 * 瓦片底图管理插件
 * 支持 XYZ、TMS、WMS、WMTS、ArcGIS MapServer 等多种底图服务
 * 支持国内坐标偏移类型（标准无偏移、GCJ-02 国测局偏移、BD-09 百度偏移）
 */
export class BaseLayerPlugin extends BasePlugin {
  static readonly pluginName = 'baseLayer'
  readonly name = 'baseLayer'

  /** 图层集合 */
  private layers: Map<string, ImageryLayer> = new Map()

  /** 时序图层配置集合 */
  private timeSeriesConfigs: Map<
    string,
    {
      provider: UrlTemplateImageryProvider
      times: Date[]
      currentIndex: number
      timeFormatter: (date: Date) => string
      urlTemplate: string
    }
  > = new Map()

  protected onInstall(_viewer: AutoViewer): void {
    // Layer plugin installed
  }

  /**
   * 根据坐标系创建瓦片方案
   * @private
   */
  private createTilingScheme(
    coordinateSystem?: CoordinateSystem | string
  ): GeographicTilingScheme | WebMercatorTilingScheme {
    const coordSys = coordinateSystem || CoordinateSystem.EPSG3857

    switch (coordSys) {
      case CoordinateSystem.WGS84:
      case CoordinateSystem.CGCS2000: // CGCS2000 与 WGS84 高度兼容，使用地理坐标系
      case 'EPSG:4326':
        return new GeographicTilingScheme()

      case CoordinateSystem.EPSG3857:
      case 'EPSG:3857':
      default:
        return new WebMercatorTilingScheme()
    }
  }

  /**
   * 添加 XYZ 标准金字塔瓦片图层
   * @param id 图层 ID
   * @param options 配置选项
   * @returns ImageryLayer 图层实例
   * @example
   * ```ts
   * // 添加 OpenStreetMap
   * layer.addXYZ('osm', {
   *   url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
   *   subdomains: ['a', 'b', 'c'],
   *   maximumLevel: 19
   * })
   *
   * // 添加区域影像
   * layer.addXYZ('region', {
   *   url: 'https://example.com/tiles/{z}/{x}/{y}.png',
   *   rectangle: [110, 30, 120, 40], // 限制在指定区域
   *   minimumLevel: 10,
   *   maximumLevel: 18
   * })
   *
   * // 使用 WGS84 坐标系
   * layer.addXYZ('wgs84-layer', {
   *   url: 'https://example.com/tiles/{z}/{x}/{y}.png',
   *   coordinateSystem: CoordinateSystem.WGS84
   * })
   *
   * // 使用大地2000坐标系
   * layer.addXYZ('cgcs2000-layer', {
   *   url: 'https://example.com/tiles/{z}/{x}/{y}.png',
   *   coordinateSystem: CoordinateSystem.CGCS2000
   * })
   *
   * // 添加国内GCJ-02坐标系的瓦片（如高德、腾讯地图）
   * layer.addXYZ('amap', {
   *   url: 'https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&style=7',
   *   subdomains: ['1', '2', '3', '4'],
   *   coordinateOffset: CoordinateOffset.GCJ02,
   *   maximumLevel: 18
   * })
   *
   * // 添加百度BD-09坐标系的瓦片
   * layer.addXYZ('baidu', {
   *   url: 'https://example.com/baidu/tiles/{z}/{x}/{y}.png',
   *   coordinateOffset: CoordinateOffset.BD09
   * })
   * ```
   */
  addXYZ(id: string, options: XYZLayerOptions): ImageryLayer {
    this.ensureInstalled()

    if (this.layers.has(id)) {
      console.warn(`Layer "${id}" already exists`)
      return this.layers.get(id)!
    }

    const providerOptions: CesiumUrlTemplateImageryProvider.ConstructorOptions = {
      url: options.url,
      subdomains: options.subdomains,
      minimumLevel: options.minimumLevel,
      maximumLevel: options.maximumLevel,
      tileWidth: options.tileWidth,
      tileHeight: options.tileHeight,
      tilingScheme: this.createTilingScheme(options.coordinateSystem)
    }

    // 设置区域范围
    if (options.rectangle) {
      providerOptions.rectangle = CesiumRectangle.fromDegrees(
        options.rectangle[0],
        options.rectangle[1],
        options.rectangle[2],
        options.rectangle[3]
      )
    }

    const provider = new UrlTemplateImageryProvider(providerOptions)
    return this.addLayerFromProvider(id, provider, options)
  }

  /**
   * 添加 TMS 瓦片图层
   * @param id 图层 ID
   * @param options 配置选项
   * @returns ImageryLayer 图层实例
   * @example
   * ```ts
   * layer.addTMS('tms-layer', {
   *   url: 'https://example.com/tms/{z}/{x}/{y}.png',
   *   minimumLevel: 0,
   *   maximumLevel: 18
   * })
   *
   * // 使用 WGS84 坐标系的 TMS
   * layer.addTMS('tms-wgs84', {
   *   url: 'https://example.com/tms/{z}/{x}/{y}.png',
   *   coordinateSystem: CoordinateSystem.WGS84
   * })
   * ```
   */
  addTMS(id: string, options: TMSLayerOptions): ImageryLayer {
    this.ensureInstalled()

    if (this.layers.has(id)) {
      console.warn(`Layer "${id}" already exists`)
      return this.layers.get(id)!
    }

    const providerOptions: CesiumUrlTemplateImageryProvider.ConstructorOptions = {
      url: options.url,
      tilingScheme: this.createTilingScheme(options.coordinateSystem),
      minimumLevel: options.minimumLevel,
      maximumLevel: options.maximumLevel,
      tileWidth: options.tileWidth,
      tileHeight: options.tileHeight
    }

    // 设置区域范围
    if (options.rectangle) {
      providerOptions.rectangle = CesiumRectangle.fromDegrees(
        options.rectangle[0],
        options.rectangle[1],
        options.rectangle[2],
        options.rectangle[3]
      )
    }

    const provider = new UrlTemplateImageryProvider(providerOptions)
    return this.addLayerFromProvider(id, provider, options)
  }

  /**
   * 添加 WMS 图层
   * @param id 图层 ID
   * @param options 配置选项
   * @returns ImageryLayer 图层实例
   * @example
   * ```ts
   * layer.addWMS('wms-layer', {
   *   url: 'https://example.com/wms',
   *   layers: 'layer1,layer2',
   *   version: '1.3.0',
   *   format: 'image/png',
   *   transparent: true
   * })
   * ```
   */
  addWMS(id: string, options: WMSLayerOptions): ImageryLayer {
    this.ensureInstalled()

    if (this.layers.has(id)) {
      console.warn(`Layer "${id}" already exists`)
      return this.layers.get(id)!
    }

    const providerOptions: CesiumWebMapServiceImageryProvider.ConstructorOptions = {
      url: options.url,
      layers: options.layers,
      parameters: {
        version: options.version || '1.3.0',
        format: options.format || 'image/png',
        transparent: options.transparent !== false
      },
      tileWidth: options.tileWidth,
      tileHeight: options.tileHeight
    }

    // 设置 CRS
    if (options.crs) {
      providerOptions.parameters!.crs = options.crs
    }

    // 设置样式
    if (options.styles) {
      providerOptions.parameters!.styles = options.styles
    }

    // 设置区域范围
    if (options.rectangle) {
      providerOptions.rectangle = CesiumRectangle.fromDegrees(
        options.rectangle[0],
        options.rectangle[1],
        options.rectangle[2],
        options.rectangle[3]
      )
    }

    const provider = new WebMapServiceImageryProvider(providerOptions)
    return this.addLayerFromProvider(id, provider, options)
  }

  /**
   * 添加 WMTS 图层
   * @param id 图层 ID
   * @param options 配置选项
   * @returns ImageryLayer 图层实例
   * @example
   * ```ts
   * layer.addWMTS('wmts-layer', {
   *   url: 'https://example.com/wmts',
   *   layer: 'layer_id',
   *   style: 'default',
   *   tileMatrixSetID: 'GoogleMapsCompatible',
   *   format: 'image/png'
   * })
   * ```
   */
  addWMTS(id: string, options: WMTSLayerOptions): ImageryLayer {
    this.ensureInstalled()

    if (this.layers.has(id)) {
      console.warn(`Layer "${id}" already exists`)
      return this.layers.get(id)!
    }

    const providerOptions: CesiumWebMapTileServiceImageryProvider.ConstructorOptions = {
      url: options.url,
      layer: options.layer,
      style: options.style,
      tileMatrixSetID: options.tileMatrixSetID,
      format: options.format || 'image/png',
      tileMatrixLabels: options.tileMatrixLabels
    }

    // 设置区域范围
    if (options.rectangle) {
      providerOptions.rectangle = CesiumRectangle.fromDegrees(
        options.rectangle[0],
        options.rectangle[1],
        options.rectangle[2],
        options.rectangle[3]
      )
    }

    const provider = new WebMapTileServiceImageryProvider(providerOptions)
    return this.addLayerFromProvider(id, provider, options)
  }

  /**
   * 添加 ArcGIS MapServer 图层
   * @param id 图层 ID
   * @param options 配置选项
   * @returns ImageryLayer 图层实例
   * @example
   * ```ts
   * // ArcGIS MapServer
   * layer.addArcGIS('arcgis-layer', {
   *   url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
   *   enablePickFeatures: false
   * })
   *
   * // 指定图层
   * layer.addArcGIS('arcgis-specific', {
   *   url: 'https://example.com/arcgis/rest/services/MyService/MapServer',
   *   layers: '0,1,2'
   * })
   * ```
   */
  addArcGIS(id: string, options: ArcGISLayerOptions): ImageryLayer {
    this.ensureInstalled()

    if (this.layers.has(id)) {
      console.warn(`Layer "${id}" already exists`)
      return this.layers.get(id)!
    }

    const providerOptions: {
      url: string
      enablePickFeatures: boolean
      layers?: string
      rectangle?: Rectangle
    } = {
      url: options.url,
      enablePickFeatures: options.enablePickFeatures ?? true
    }

    // 设置图层
    if (options.layers) {
      providerOptions.layers = options.layers
    }

    // 设置区域范围
    if (options.rectangle) {
      providerOptions.rectangle = CesiumRectangle.fromDegrees(
        options.rectangle[0],
        options.rectangle[1],
        options.rectangle[2],
        options.rectangle[3]
      )
    }

    const provider = new ArcGisMapServerImageryProvider(providerOptions)
    return this.addLayerFromProvider(id, provider, options)
  }

  /**
   * 添加单图片底图
   * @param id 图层 ID
   * @param options 配置选项
   * @returns ImageryLayer 图层实例
   * @example
   * ```ts
   * // 添加区域影像图片
   * layer.addSingleImage('region-image', {
   *   url: 'https://example.com/image.jpg',
   *   rectangle: [110, 30, 120, 40] // [west, south, east, north]
   * })
   *
   * // 添加带透明度的图片
   * layer.addSingleImage('overlay-image', {
   *   url: 'https://example.com/overlay.png',
   *   rectangle: [110, 30, 120, 40],
   *   alpha: 0.7
   * })
   * ```
   */
  addSingleImage(id: string, options: SingleImageLayerOptions): ImageryLayer {
    this.ensureInstalled()

    if (this.layers.has(id)) {
      console.warn(`Layer "${id}" already exists`)
      return this.layers.get(id)!
    }

    const provider = new SingleTileImageryProvider({
      url: options.url,
      rectangle: CesiumRectangle.fromDegrees(
        options.rectangle[0],
        options.rectangle[1],
        options.rectangle[2],
        options.rectangle[3]
      )
    })

    return this.addLayerFromProvider(id, provider, options)
  }

  /**
   * 添加时序图层
   * @param id 图层 ID
   * @param options 配置选项
   * @returns ImageryLayer 图层实例
   * @example
   * ```ts
   * // 添加时序气象数据
   * layer.addTimeSeries('weather-series', {
   *   url: 'https://example.com/tiles/{z}/{x}/{y}?time={time}',
   *   times: [
   *     new Date('2024-01-01T00:00:00Z'),
   *     new Date('2024-01-01T06:00:00Z'),
   *     new Date('2024-01-01T12:00:00Z')
   *   ],
   *   timeFormatter: (date) => date.toISOString()
   * })
   *
   * // 使用自定义时间格式
   * layer.addTimeSeries('custom-time', {
   *   url: 'https://example.com/tiles/{z}/{x}/{y}/{time}.png',
   *   times: ['2024-01-01', '2024-01-02', '2024-01-03'],
   *   currentTimeIndex: 0,
   *   timeFormatter: (date) => {
   *     const year = date.getFullYear()
   *     const month = String(date.getMonth() + 1).padStart(2, '0')
   *     const day = String(date.getDate()).padStart(2, '0')
   *     return `${year}${month}${day}`
   *   }
   * })
   * ```
   */
  addTimeSeries(id: string, options: TimeSeriesLayerOptions): ImageryLayer {
    this.ensureInstalled()

    if (this.layers.has(id)) {
      console.warn(`Layer "${id}" already exists`)
      return this.layers.get(id)!
    }

    // 转换时间列表为 Date 数组
    const times = options.times.map((time) => (time instanceof Date ? time : new Date(time)))

    // 默认时间格式化函数
    const timeFormatter =
      options.timeFormatter ||
      ((date: Date) => {
        return date.toISOString()
      })

    const currentIndex = options.currentTimeIndex || 0
    const currentTime = times[currentIndex]

    // 创建初始 URL（替换 {time} 占位符）
    const initialUrl = options.url.replace('{time}', timeFormatter(currentTime))

    const providerOptions: CesiumUrlTemplateImageryProvider.ConstructorOptions = {
      url: initialUrl,
      subdomains: options.subdomains,
      minimumLevel: options.minimumLevel,
      maximumLevel: options.maximumLevel,
      tileWidth: options.tileWidth,
      tileHeight: options.tileHeight,
      tilingScheme: this.createTilingScheme(options.coordinateSystem)
    }

    // 设置区域范围
    if (options.rectangle) {
      providerOptions.rectangle = CesiumRectangle.fromDegrees(
        options.rectangle[0],
        options.rectangle[1],
        options.rectangle[2],
        options.rectangle[3]
      )
    }

    const provider = new UrlTemplateImageryProvider(providerOptions)
    const layer = this.addLayerFromProvider(id, provider, options)

    // 保存时序配置
    this.timeSeriesConfigs.set(id, {
      provider,
      times,
      currentIndex,
      timeFormatter,
      urlTemplate: options.url
    })

    return layer
  }

  /**
   * 设置时序图层的时间
   * @param id 图层 ID
   * @param timeIndex 时间索引
   * @returns 是否设置成功
   */
  setTimeSeriesTime(id: string, timeIndex: number): boolean {
    const config = this.timeSeriesConfigs.get(id)
    if (!config) {
      console.warn(`Time series layer "${id}" not found`)
      return false
    }

    if (timeIndex < 0 || timeIndex >= config.times.length) {
      console.warn(`Invalid time index: ${timeIndex}`)
      return false
    }

    const newTime = config.times[timeIndex]
    const newUrl = config.urlTemplate.replace('{time}', config.timeFormatter(newTime))

    // 更新 provider 的 URL
    // @ts-expect-error - Cesium 的 UrlTemplateImageryProvider 支持动态修改 URL
    config.provider._resource._url = newUrl
    config.currentIndex = timeIndex

    // 刷新图层
    const layer = this.layers.get(id)
    if (layer) {
      // @ts-expect-error - 触发图层重新加载
      layer._imageryProvider._reload()
    }

    return true
  }

  /**
   * 获取时序图层的当前时间索引
   * @param id 图层 ID
   * @returns 当前时间索引，如果图层不存在则返回 undefined
   */
  getTimeSeriesCurrentIndex(id: string): number | undefined {
    return this.timeSeriesConfigs.get(id)?.currentIndex
  }

  /**
   * 获取时序图层的时间列表
   * @param id 图层 ID
   * @returns 时间列表，如果图层不存在则返回 undefined
   */
  getTimeSeriesTimes(id: string): Date[] | undefined {
    return this.timeSeriesConfigs.get(id)?.times
  }

  /**
   * 从 Provider 添加图层（内部方法）
   */
  private addLayerFromProvider(
    id: string,
    provider:
      | UrlTemplateImageryProvider
      | WebMapServiceImageryProvider
      | WebMapTileServiceImageryProvider
      | ArcGisMapServerImageryProvider
      | SingleTileImageryProvider,
    options: BaseLayerOptions
  ): ImageryLayer {
    const layer = this.cesiumViewer.imageryLayers.addImageryProvider(provider, options.index)

    // 应用图层选项
    if (options.alpha !== undefined) layer.alpha = options.alpha
    if (options.brightness !== undefined) layer.brightness = options.brightness
    if (options.contrast !== undefined) layer.contrast = options.contrast
    if (options.show !== undefined) layer.show = options.show

    this.layers.set(id, layer)
    return layer
  }

  /**
   * 移除图层
   * @param id 图层 ID
   * @returns 是否移除成功
   */
  removeLayer(id: string): boolean {
    this.ensureInstalled()

    const layer = this.layers.get(id)
    if (!layer) {
      console.warn(`Layer "${id}" not found`)
      return false
    }

    this.cesiumViewer.imageryLayers.remove(layer)
    this.layers.delete(id)

    // 如果是时序图层，也删除其配置
    if (this.timeSeriesConfigs.has(id)) {
      this.timeSeriesConfigs.delete(id)
    }

    return true
  }

  /**
   * 获取图层
   * @param id 图层 ID
   * @returns 图层实例
   */
  getLayer(id: string): ImageryLayer | undefined {
    return this.layers.get(id)
  }

  /**
   * 设置图层可见性
   * @param id 图层 ID
   * @param visible 是否可见
   */
  setLayerVisible(id: string, visible: boolean): void {
    const layer = this.layers.get(id)
    if (layer) {
      layer.show = visible
    }
  }

  /**
   * 设置图层透明度
   * @param id 图层 ID
   * @param alpha 透明度 (0-1)
   */
  setLayerAlpha(id: string, alpha: number): void {
    const layer = this.layers.get(id)
    if (layer) {
      layer.alpha = Math.max(0, Math.min(1, alpha))
    }
  }

  /**
   * 设置图层亮度
   * @param id 图层 ID
   * @param brightness 亮度
   */
  setLayerBrightness(id: string, brightness: number): void {
    const layer = this.layers.get(id)
    if (layer) {
      layer.brightness = brightness
    }
  }

  /**
   * 设置图层对比度
   * @param id 图层 ID
   * @param contrast 对比度
   */
  setLayerContrast(id: string, contrast: number): void {
    const layer = this.layers.get(id)
    if (layer) {
      layer.contrast = contrast
    }
  }

  /**
   * 调整图层顺序
   * @param id 图层 ID
   * @param index 新的索引位置
   */
  moveLayer(id: string, index: number): void {
    this.ensureInstalled()

    const layer = this.layers.get(id)
    if (!layer) {
      console.warn(`Layer "${id}" not found`)
      return
    }

    const currentIndex = this.cesiumViewer.imageryLayers.indexOf(layer)
    if (currentIndex === -1) return

    // 移除并重新添加到指定位置
    this.cesiumViewer.imageryLayers.remove(layer, false)
    this.cesiumViewer.imageryLayers.add(layer, index)
  }

  /**
   * 提升图层（向上移动一层）
   * @param id 图层 ID
   */
  raiseLayer(id: string): void {
    this.ensureInstalled()

    const layer = this.layers.get(id)
    if (layer) {
      this.cesiumViewer.imageryLayers.raise(layer)
    }
  }

  /**
   * 降低图层（向下移动一层）
   * @param id 图层 ID
   */
  lowerLayer(id: string): void {
    this.ensureInstalled()

    const layer = this.layers.get(id)
    if (layer) {
      this.cesiumViewer.imageryLayers.lower(layer)
    }
  }

  /**
   * 将图层移到最顶层
   * @param id 图层 ID
   */
  raiseLayerToTop(id: string): void {
    this.ensureInstalled()

    const layer = this.layers.get(id)
    if (layer) {
      this.cesiumViewer.imageryLayers.raiseToTop(layer)
    }
  }

  /**
   * 将图层移到最底层
   * @param id 图层 ID
   */
  lowerLayerToBottom(id: string): void {
    this.ensureInstalled()

    const layer = this.layers.get(id)
    if (layer) {
      this.cesiumViewer.imageryLayers.lowerToBottom(layer)
    }
  }

  /**
   * 清除所有图层
   */
  clearAll(): void {
    this.ensureInstalled()

    this.layers.forEach((layer) => {
      this.cesiumViewer.imageryLayers.remove(layer)
    })
    this.layers.clear()
    this.timeSeriesConfigs.clear()
  }

  /**
   * 获取所有图层 ID
   * @returns 图层 ID 数组
   */
  getAllLayerIds(): string[] {
    return Array.from(this.layers.keys())
  }

  /**
   * 获取图层数量
   * @returns 图层数量
   */
  getLayerCount(): number {
    return this.layers.size
  }

  // ==================== 常见地图服务商便捷方法 ====================

  /**
   * 添加天地图图层
   * @param id 图层 ID
   * @param options 天地图配置选项
   * @returns ImageryLayer 图层实例
   * @example
   * ```ts
   * // 添加天地图矢量底图
   * layer.addTianditu('tdt-vec', {
   *   token: 'your_token',
   *   layerType: TiandituLayerType.VEC
   * })
   *
   * // 添加天地图影像底图
   * layer.addTianditu('tdt-img', {
   *   token: 'your_token',
   *   layerType: TiandituLayerType.IMG
   * })
   *
   * // 添加天地图标注（叠加在底图上）
   * layer.addTianditu('tdt-cva', {
   *   token: 'your_token',
   *   layerType: TiandituLayerType.CVA
   * })
   * ```
   */
  addTianditu(id: string, options: TiandituOptions): ImageryLayer {
    const config = createTiandituConfig(options)
    return this.addXYZ(id, config)
  }

  /**
   * 添加高德地图图层
   * @param id 图层 ID
   * @param options 高德地图配置选项
   * @returns ImageryLayer 图层实例
   * @example
   * ```ts
   * // 添加高德矢量地图
   * layer.addAmap('amap-vector', {
   *   layerType: AmapLayerType.VECTOR
   * })
   *
   * // 添加高德影像地图
   * layer.addAmap('amap-satellite', {
   *   layerType: AmapLayerType.SATELLITE
   * })
   *
   * // 添加高德路网标注
   * layer.addAmap('amap-road', {
   *   layerType: AmapLayerType.ROAD
   * })
   * ```
   */
  addAmap(id: string, options: AmapOptions): ImageryLayer {
    const config = createAmapConfig(options)
    return this.addXYZ(id, config)
  }

  /**
   * 添加腾讯地图图层
   * @param id 图层 ID
   * @param options 腾讯地图配置选项
   * @returns ImageryLayer 图层实例
   * @example
   * ```ts
   * // 添加腾讯矢量地图
   * layer.addTencent('tencent-vector', {
   *   layerType: TencentLayerType.VECTOR
   * })
   *
   * // 添加腾讯影像地图
   * layer.addTencent('tencent-satellite', {
   *   layerType: TencentLayerType.SATELLITE
   * })
   * ```
   */
  addTencent(id: string, options: TencentOptions): ImageryLayer {
    const config = createTencentConfig(options)
    return this.addXYZ(id, config)
  }

  /**
   * 添加百度地图图层
   * @param id 图层 ID
   * @param options 百度地图配置选项
   * @returns ImageryLayer 图层实例
   * @example
   * ```ts
   * // 添加百度普通地图
   * layer.addBaidu('baidu-normal', {
   *   layerType: BaiduLayerType.NORMAL
   * })
   *
   * // 添加百度影像地图
   * layer.addBaidu('baidu-satellite', {
   *   layerType: BaiduLayerType.SATELLITE
   * })
   *
   * // 添加百度深色主题
   * layer.addBaidu('baidu-midnight', {
   *   layerType: BaiduLayerType.MIDNIGHT
   * })
   * ```
   */
  addBaidu(id: string, options: BaiduOptions): ImageryLayer {
    const config = createBaiduConfig(options)
    return this.addXYZ(id, config)
  }

  /**
   * 添加星图地球图层
   * @param id 图层 ID
   * @param options 星图地球配置选项
   * @returns ImageryLayer 图层实例
   * @example
   * ```ts
   * // 添加星图地球矢量地图
   * layer.addGeovis('geovis-vector', {
   *   token: 'your_token',
   *   layerType: GeovisLayerType.VECTOR
   * })
   *
   * // 添加星图地球影像地图
   * layer.addGeovis('geovis-satellite', {
   *   token: 'your_token',
   *   layerType: GeovisLayerType.SATELLITE
   * })
   * ```
   */
  addGeovis(id: string, options: GeovisOptions): ImageryLayer {
    const config = createGeovisConfig(options)
    return this.addXYZ(id, config)
  }

  /**
   * 添加超图地图图层
   * @param id 图层 ID
   * @param options 超图配置选项
   * @returns ImageryLayer 图层实例
   * @example
   * ```ts
   * // 添加超图服务
   * layer.addSuperMap('supermap-layer', {
   *   url: 'https://example.com/iserver/services',
   *   layerType: SuperMapLayerType.VECTOR,
   *   layerName: 'your_layer'
   * })
   * ```
   */
  addSuperMap(id: string, options: SuperMapOptions): ImageryLayer {
    const config = createSuperMapConfig(options)
    return this.addXYZ(id, config)
  }

  protected onDestroy(): void {
    this.clearAll()
  }
}

// 导出类型定义
export type {
  BaseLayerOptions,
  XYZLayerOptions,
  TMSLayerOptions,
  WMSLayerOptions,
  WMTSLayerOptions,
  ArcGISLayerOptions,
  SingleImageLayerOptions,
  TimeSeriesLayerOptions
} from './types'

// 导出枚举
export { CoordinateSystem, CoordinateOffset } from './types'

// 导出预设配置相关
export {
  // 图层类型枚举
  TiandituLayerType,
  AmapLayerType,
  TencentLayerType,
  BaiduLayerType,
  GeovisLayerType,
  SuperMapLayerType,
  // URL 常量
  TIANDITU_URLS,
  AMAP_URLS,
  TENCENT_URLS,
  BAIDU_URLS,
  GEOVIS_URLS,
  // 配置函数
  createTiandituConfig,
  createAmapConfig,
  createTencentConfig,
  createBaiduConfig,
  createGeovisConfig,
  createSuperMapConfig,
  // 类型定义
  type TiandituOptions,
  type AmapOptions,
  type TencentOptions,
  type BaiduOptions,
  type GeovisOptions,
  type SuperMapOptions
} from './presets'

// 导出坐标转换工具（从 shared 包）
export {
  wgs84ToGcj02,
  gcj02ToWgs84,
  gcj02ToBd09,
  bd09ToGcj02,
  wgs84ToBd09,
  bd09ToWgs84,
  transformCoordinate
} from '@auto-cesium/shared'
