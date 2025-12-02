import { CoordinateOffset, type RGBColor } from '@auto-cesium/shared'

/**
 * 支持的坐标系类型
 */
export enum CoordinateSystem {
  /** Web Mercator 投影 (EPSG:3857) */
  EPSG3857 = 'EPSG:3857',
  /** WGS84 地理坐标系 (EPSG:4326) */
  WGS84 = 'EPSG:4326',
  /** 中国大地2000坐标系 (CGCS2000) - 与 WGS84 高度兼容 */
  CGCS2000 = 'CGCS2000'
}

// 重新导出 CoordinateOffset
export { CoordinateOffset }

/**
 * 通用图层选项
 */
export interface BaseLayerOptions {
  /** 透明度 (0-1) */
  alpha?: number
  /** 亮度 */
  brightness?: number
  /** 对比度 */
  contrast?: number
  /** 色调（色相偏移）单位：弧度，范围 0-2π */
  hue?: number
  /** 饱和度，0 表示灰度，1 表示正常，>1 表示增强饱和度 */
  saturation?: number
  /** Gamma 校正值，默认 1.0（无校正），<1 变亮，>1 变暗 */
  gamma?: number
  /**
   * 颜色转透明：将指定的 RGB 颜色转为透明
   * 支持格式：
   * - 数组形式：[255, 255, 255] 或 [255, 255, 255, 0.1]
   * - 十六进制字符串：'#FFFFFF' 或 '#FFFFFF1A'
   * 最后一个参数为容差值（0-1），默认为 0.004
   */
  colorToAlpha?: RGBColor
  /** colorToAlpha 的容差值（0-1），默认为 0.004 */
  colorToAlphaThreshold?: number
  /** 是否显示 */
  show?: boolean
  /** 图层索引位置 */
  index?: number
  /** 坐标系类型，默认为 EPSG:3857 (Web Mercator) */
  coordinateSystem?: CoordinateSystem | string
  /** 坐标偏移类型（用于国内地图），默认无偏移 */
  coordinateOffset?: CoordinateOffset
}

/**
 * XYZ 瓦片配置
 */
export interface XYZLayerOptions extends BaseLayerOptions {
  /** 瓦片 URL 模板，支持 {x} {y} {z} {s} 占位符 */
  url: string
  /** 子域名数组，用于负载均衡 */
  subdomains?: string[]
  /** 最小层级 */
  minimumLevel?: number
  /** 最大层级 */
  maximumLevel?: number
  /** 瓦片宽度 */
  tileWidth?: number
  /** 瓦片高度 */
  tileHeight?: number
  /** 区域范围 [west, south, east, north] (度) */
  rectangle?: [number, number, number, number]
}

/**
 * TMS 瓦片配置
 */
export interface TMSLayerOptions extends BaseLayerOptions {
  /** 瓦片 URL 模板 */
  url: string
  /** 最小层级 */
  minimumLevel?: number
  /** 最大层级 */
  maximumLevel?: number
  /** 瓦片宽度 */
  tileWidth?: number
  /** 瓦片高度 */
  tileHeight?: number
  /** 区域范围 [west, south, east, north] (度) */
  rectangle?: [number, number, number, number]
}

/**
 * WMS 服务配置
 */
export interface WMSLayerOptions extends BaseLayerOptions {
  /** WMS 服务地址 */
  url: string
  /** 图层名称 */
  layers: string
  /** WMS 版本 */
  version?: string
  /** 坐标系统 */
  crs?: string
  /** 样式 */
  styles?: string
  /** 图片格式 */
  format?: string
  /** 是否透明 */
  transparent?: boolean
  /** 瓦片宽度 */
  tileWidth?: number
  /** 瓦片高度 */
  tileHeight?: number
  /** 区域范围 [west, south, east, north] (度) */
  rectangle?: [number, number, number, number]
}

/**
 * WMTS 服务配置
 */
export interface WMTSLayerOptions extends BaseLayerOptions {
  /** WMTS 服务地址 */
  url: string
  /** 图层标识 */
  layer: string
  /** 样式 */
  style: string
  /** 瓦片矩阵集 */
  tileMatrixSetID: string
  /** 图片格式 */
  format?: string
  /** 瓦片矩阵标签 */
  tileMatrixLabels?: string[]
  /** 区域范围 [west, south, east, north] (度) */
  rectangle?: [number, number, number, number]
}

/**
 * ArcGIS MapServer 配置
 */
export interface ArcGISLayerOptions extends BaseLayerOptions {
  /** ArcGIS 服务地址 */
  url: string
  /** 图层 ID 列表 */
  layers?: string
  /** 是否启用服务器端拾取 */
  enablePickFeatures?: boolean
  /** 区域范围 [west, south, east, north] (度) */
  rectangle?: [number, number, number, number]
}

/**
 * 单图片底图配置
 */
export interface SingleImageLayerOptions extends BaseLayerOptions {
  /** 图片 URL */
  url: string
  /** 区域范围 [west, south, east, north] (度) - 必填 */
  rectangle: [number, number, number, number]
}

/**
 * 时序图配置
 */
export interface TimeSeriesLayerOptions extends BaseLayerOptions {
  /** 瓦片 URL 模板，支持 {x} {y} {z} {s} {time} 占位符 */
  url: string
  /** 时间列表，可以是 Date 对象数组或 ISO 字符串数组 */
  times: Date[] | string[]
  /** 子域名数组，用于负载均衡 */
  subdomains?: string[]
  /** 最小层级 */
  minimumLevel?: number
  /** 最大层级 */
  maximumLevel?: number
  /** 瓦片宽度 */
  tileWidth?: number
  /** 瓦片高度 */
  tileHeight?: number
  /** 区域范围 [west, south, east, north] (度) */
  rectangle?: [number, number, number, number]
  /** 当前时间索引，默认为 0 */
  currentTimeIndex?: number
  /** 时间格式化函数，用于将 Date 转换为 URL 中的时间字符串 */
  timeFormatter?: (date: Date) => string
}
