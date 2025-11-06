/**
 * 常见地图服务商预设配置
 * 包括天地图、高德、腾讯、百度、星图地球、超图等
 */

import type { XYZLayerOptions } from './types'
import { CoordinateSystem, CoordinateOffset } from './types'

// ==================== 地图服务商 URL 模板 ====================

/**
 * 天地图服务地址
 */
export const TIANDITU_URLS = {
  /** 天地图服务域名（支持子域名 0-7） */
  DOMAIN: 'https://t{s}.tianditu.gov.cn',
  /** 天地图 DataServer 接口 */
  DATASERVER: 'https://t{s}.tianditu.gov.cn/DataServer?T={layerType}_{projection}&x={x}&y={y}&l={z}&tk={token}'
} as const

/**
 * 高德地图服务地址
 */
export const AMAP_URLS = {
  /** 高德矢量地图（标准样式） */
  VECTOR: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}',
  /** 高德矢量地图（自定义样式） */
  VECTOR_CUSTOM: 'https://webst0{s}.is.autonavi.com/appmaptile?style={style}&x={x}&y={y}&z={z}',
  /** 高德影像地图 */
  SATELLITE: 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
  /** 高德路网标注 */
  ROAD: 'https://webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}'
} as const

/**
 * 腾讯地图服务地址
 */
export const TENCENT_URLS = {
  /** 腾讯矢量地图 */
  VECTOR: 'https://rt{s}.map.gtimg.com/realtimerender?z={z}&x={x}&y={y}&type={style}',
  /** 腾讯影像地图 */
  SATELLITE: 'https://p{s}.map.gtimg.com/sateTiles/{z}/{sx}/{sy}/{x}_{y}.jpg',
  /** 腾讯地形地图 */
  TERRAIN: 'https://p{s}.map.gtimg.com/demTiles/{z}/{sx}/{sy}/{x}_{y}.jpg'
} as const

/**
 * 百度地图服务地址
 */
export const BAIDU_URLS = {
  /** 百度普通地图 */
  NORMAL: 'http://online{s}.map.bdimg.com/onlinelabel/?qt=tile&x={x}&y={y}&z={z}&styles=pl&scaler=1&p=1',
  /** 百度普通地图（自定义样式） */
  NORMAL_CUSTOM: 'http://api{s}.map.bdimg.com/customimage/tile?&x={x}&y={y}&z={z}&scale=1&customid={customid}',
  /** 百度影像地图 */
  SATELLITE: 'http://shangetu{s}.map.bdimg.com/it/u=x={x};y={y};z={z};v=009;type=sate&fm=46',
  /** 百度路网标注 */
  ROAD: 'http://online{s}.map.bdimg.com/tile/?qt=tile&x={x}&y={y}&z={z}&styles=sl&v=020',
  /** 百度深色主题 */
  MIDNIGHT: 'http://api{s}.map.bdimg.com/customimage/tile?&x={x}&y={y}&z={z}&scale=1&customid=midnight'
} as const

/**
 * 星图地球服务地址
 */
export const GEOVIS_URLS = {
  /** 星图地球域名（支持子域名 1-4） */
  DOMAIN: 'https://tiles{s}.geovisearth.com',
  /** 星图地球瓦片服务 */
  TILE: 'https://tiles{s}.geovisearth.com/base/v1/{layerType}/w/{z}/{x}/{y}?token={token}'
} as const

/**
 * 天地图图层类型
 */
export enum TiandituLayerType {
  /** 矢量底图 */
  VEC = 'vec',
  /** 矢量标注 */
  CVA = 'cva',
  /** 影像底图 */
  IMG = 'img',
  /** 影像标注 */
  CIA = 'cia',
  /** 地形底图 */
  TER = 'ter',
  /** 地形标注 */
  CTA = 'cta'
}

/**
 * 高德地图图层类型
 */
export enum AmapLayerType {
  /** 矢量底图 */
  VECTOR = 'vector',
  /** 影像底图 */
  SATELLITE = 'satellite',
  /** 路网标注 */
  ROAD = 'road'
}

/**
 * 腾讯地图图层类型
 */
export enum TencentLayerType {
  /** 矢量底图 */
  VECTOR = 'vector',
  /** 影像底图 */
  SATELLITE = 'satellite',
  /** 地形底图 */
  TERRAIN = 'terrain'
}

/**
 * 百度地图图层类型
 */
export enum BaiduLayerType {
  /** 普通地图 */
  NORMAL = 'normal',
  /** 影像地图 */
  SATELLITE = 'satellite',
  /** 路网标注 */
  ROAD = 'road',
  /** 自定义样式（深色） */
  MIDNIGHT = 'midnight'
}

/**
 * 星图地球图层类型
 */
export enum GeovisLayerType {
  /** 矢量底图 */
  VECTOR = 'vector',
  /** 影像底图 */
  SATELLITE = 'satellite',
  /** 地形底图 */
  TERRAIN = 'terrain'
}

/**
 * 超图图层类型
 */
export enum SuperMapLayerType {
  /** 矢量底图 */
  VECTOR = 'vector',
  /** 影像底图 */
  SATELLITE = 'satellite'
}

/**
 * 天地图配置接口
 */
export interface TiandituOptions {
  /** 天地图 API Key（必需） */
  token: string
  /** 图层类型 */
  layerType: TiandituLayerType
  /** 自定义 URL 模板（可选，用于代理服务） */
  url?: string
  /** 坐标系，默认 Web Mercator */
  coordinateSystem?: CoordinateSystem
  /** 最大层级，默认 18 */
  maximumLevel?: number
  /** 其他图层选项 */
  [key: string]: any
}

/**
 * 高德地图配置接口
 */
export interface AmapOptions {
  /** 图层类型 */
  layerType: AmapLayerType
  /** 自定义 URL 模板（可选，用于代理服务） */
  url?: string
  /** 样式 ID（可选） */
  style?: string
  /** 最大层级，默认 18 */
  maximumLevel?: number
  /** 其他图层选项 */
  [key: string]: any
}

/**
 * 腾讯地图配置接口
 */
export interface TencentOptions {
  /** 图层类型 */
  layerType: TencentLayerType
  /** 自定义 URL 模板（可选，用于代理服务） */
  url?: string
  /** 样式 ID（可选） */
  style?: number
  /** 最大层级，默认 18 */
  maximumLevel?: number
  /** 其他图层选项 */
  [key: string]: any
}

/**
 * 百度地图配置接口
 */
export interface BaiduOptions {
  /** 图层类型 */
  layerType: BaiduLayerType
  /** 自定义 URL 模板（可选，用于代理服务） */
  url?: string
  /** 自定义样式（可选） */
  customStyle?: string
  /** 最大层级，默认 19 */
  maximumLevel?: number
  /** 其他图层选项 */
  [key: string]: any
}

/**
 * 星图地球配置接口
 */
export interface GeovisOptions {
  /** 星图地球 Token（必需） */
  token: string
  /** 图层类型 */
  layerType: GeovisLayerType
  /** 自定义 URL 模板（可选，用于代理服务） */
  url?: string
  /** 最大层级，默认 18 */
  maximumLevel?: number
  /** 其他图层选项 */
  [key: string]: any
}

/**
 * 超图配置接口
 */
export interface SuperMapOptions {
  /** 服务地址（必需） */
  url: string
  /** 图层类型 */
  layerType: SuperMapLayerType
  /** 图层名称 */
  layerName?: string
  /** 坐标系 */
  coordinateSystem?: CoordinateSystem
  /** 最大层级，默认 18 */
  maximumLevel?: number
  /** 其他图层选项 */
  [key: string]: any
}

/**
 * 创建天地图图层配置
 */
export function createTiandituConfig(options: TiandituOptions): XYZLayerOptions {
  const { token, layerType, url, coordinateSystem = CoordinateSystem.EPSG3857, maximumLevel = 18, ...rest } = options

  // 根据坐标系选择对应的服务
  const projectionCode = coordinateSystem === CoordinateSystem.EPSG3857 ? 'w' : 'c'

  // 使用自定义 URL 或默认 URL
  const tileUrl =
    url || `https://t{s}.tianditu.gov.cn/DataServer?T=${layerType}_${projectionCode}&x={x}&y={y}&l={z}&tk=${token}`

  return {
    url: tileUrl,
    subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
    coordinateSystem,
    coordinateOffset: CoordinateOffset.NONE, // 天地图使用标准坐标
    maximumLevel,
    ...rest
  }
}

/**
 * 创建高德地图图层配置
 */
export function createAmapConfig(options: AmapOptions): XYZLayerOptions {
  const { layerType, url: customUrl, style, maximumLevel = 18, ...rest } = options

  let tileUrl: string
  if (customUrl) {
    // 使用自定义 URL（代理地址）
    tileUrl = customUrl
  } else {
    // 使用默认 URL
    switch (layerType) {
      case AmapLayerType.VECTOR:
        // 矢量底图
        tileUrl = style
          ? `https://webst0{s}.is.autonavi.com/appmaptile?style=${style}&x={x}&y={y}&z={z}`
          : 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}'
        break
      case AmapLayerType.SATELLITE:
        // 影像底图
        tileUrl = 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}'
        break
      case AmapLayerType.ROAD:
        // 路网标注（通常叠加在影像上）
        tileUrl = 'https://webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}'
        break
      default:
        tileUrl = 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}'
    }
  }

  return {
    url: tileUrl,
    subdomains: ['1', '2', '3', '4'],
    coordinateSystem: CoordinateSystem.EPSG3857,
    coordinateOffset: CoordinateOffset.GCJ02, // 高德使用 GCJ-02 坐标
    maximumLevel,
    ...rest
  }
}

/**
 * 创建腾讯地图图层配置
 */
export function createTencentConfig(options: TencentOptions): XYZLayerOptions {
  const { layerType, url: customUrl, style = 1, maximumLevel = 18, ...rest } = options

  let tileUrl: string
  if (customUrl) {
    // 使用自定义 URL（代理地址）
    tileUrl = customUrl
  } else {
    // 使用默认 URL
    switch (layerType) {
      case TencentLayerType.VECTOR:
        // 矢量底图
        tileUrl = `https://rt{s}.map.gtimg.com/realtimerender?z={z}&x={x}&y={y}&type=${style}`
        break
      case TencentLayerType.SATELLITE:
        // 影像底图
        tileUrl = 'https://p{s}.map.gtimg.com/sateTiles/{z}/{sx}/{sy}/{x}_{y}.jpg'
        break
      case TencentLayerType.TERRAIN:
        // 地形底图
        tileUrl = 'https://p{s}.map.gtimg.com/demTiles/{z}/{sx}/{sy}/{x}_{y}.jpg'
        break
      default:
        tileUrl = `https://rt{s}.map.gtimg.com/realtimerender?z={z}&x={x}&y={y}&type=${style}`
    }
  }

  return {
    url: tileUrl,
    subdomains: ['0', '1', '2', '3'],
    coordinateSystem: CoordinateSystem.EPSG3857,
    coordinateOffset: CoordinateOffset.GCJ02, // 腾讯使用 GCJ-02 坐标
    maximumLevel,
    ...rest
  }
}

/**
 * 创建百度地图图层配置
 */
export function createBaiduConfig(options: BaiduOptions): XYZLayerOptions {
  const { layerType, url: customUrl, customStyle, maximumLevel = 19, ...rest } = options

  let tileUrl: string
  if (customUrl) {
    // 使用自定义 URL（代理地址）
    tileUrl = customUrl
  } else {
    // 使用默认 URL
    switch (layerType) {
      case BaiduLayerType.NORMAL:
        // 普通地图
        tileUrl = customStyle
          ? `http://api{s}.map.bdimg.com/customimage/tile?&x={x}&y={y}&z={z}&scale=1&customid=${customStyle}`
          : 'http://online{s}.map.bdimg.com/onlinelabel/?qt=tile&x={x}&y={y}&z={z}&styles=pl&scaler=1&p=1'
        break
      case BaiduLayerType.SATELLITE:
        // 影像地图
        tileUrl = 'http://shangetu{s}.map.bdimg.com/it/u=x={x};y={y};z={z};v=009;type=sate&fm=46'
        break
      case BaiduLayerType.ROAD:
        // 路网标注
        tileUrl = 'http://online{s}.map.bdimg.com/tile/?qt=tile&x={x}&y={y}&z={z}&styles=sl&v=020'
        break
      case BaiduLayerType.MIDNIGHT:
        // 深色主题
        tileUrl = 'http://api{s}.map.bdimg.com/customimage/tile?&x={x}&y={y}&z={z}&scale=1&customid=midnight'
        break
      default:
        tileUrl = 'http://online{s}.map.bdimg.com/onlinelabel/?qt=tile&x={x}&y={y}&z={z}&styles=pl&scaler=1&p=1'
    }
  }

  return {
    url: tileUrl,
    subdomains: ['0', '1', '2', '3'],
    coordinateSystem: CoordinateSystem.EPSG3857,
    coordinateOffset: CoordinateOffset.BD09, // 百度使用 BD-09 坐标
    maximumLevel,
    ...rest
  }
}

/**
 * 创建星图地球图层配置
 */
export function createGeovisConfig(options: GeovisOptions): XYZLayerOptions {
  const { token, layerType, url: customUrl, maximumLevel = 18, ...rest } = options

  let tileUrl: string
  if (customUrl) {
    // 使用自定义 URL（代理地址）
    tileUrl = customUrl
  } else {
    // 使用默认 URL
    let layerPath: string
    switch (layerType) {
      case GeovisLayerType.VECTOR:
        layerPath = 'vec'
        break
      case GeovisLayerType.SATELLITE:
        layerPath = 'img'
        break
      case GeovisLayerType.TERRAIN:
        layerPath = 'ter'
        break
      default:
        layerPath = 'vec'
    }
    tileUrl = `https://tiles{s}.geovisearth.com/base/v1/${layerPath}/w/{z}/{x}/{y}?token=${token}`
  }

  return {
    url: tileUrl,
    subdomains: ['1', '2', '3', '4'],
    coordinateSystem: CoordinateSystem.EPSG3857,
    coordinateOffset: CoordinateOffset.NONE, // 星图地球使用标准坐标
    maximumLevel,
    ...rest
  }
}

/**
 * 创建超图图层配置
 */
export function createSuperMapConfig(options: SuperMapOptions): XYZLayerOptions {
  const {
    url,
    layerType,
    layerName = 'layer',
    coordinateSystem = CoordinateSystem.EPSG3857,
    maximumLevel = 18,
    ...rest
  } = options

  // 超图的 URL 格式通常是: {url}/maps/{layerName}/layers/{layerType}
  const fullUrl = `${url}/maps/${layerName}/${layerType}/{z}/{x}/{y}.png`

  return {
    url: fullUrl,
    coordinateSystem,
    coordinateOffset: CoordinateOffset.NONE, // 根据服务配置可能需要调整
    maximumLevel,
    ...rest
  }
}
