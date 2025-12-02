import type { DataItem } from '../types'
import type { Color } from 'cesium'

/**
 * 数据加载选项
 */
export interface DataLoadOptions {
  /** URL 或文件路径 */
  url?: string
  /** 文件内容 */
  data?: string | ArrayBuffer | Blob | File
  /** 字符编码 */
  encoding?: string
  /** 请求头 */
  headers?: Record<string, string>
}

/**
 * GeoJSON 加载选项
 */
export interface GeoJSONLoadOptions extends DataLoadOptions {
  /** 是否贴地 */
  clampToGround?: boolean
  /** 填充颜色 */
  fill?: Color
  /** 线条颜色 */
  stroke?: Color
  /** 线宽 */
  strokeWidth?: number
  /** 点大小 */
  markerSize?: number
  /** 点颜色 */
  markerColor?: Color
}

/**
 * CSV 加载选项
 */
export interface CSVLoadOptions extends DataLoadOptions {
  /** 分隔符 */
  delimiter?: string
  /** 经度字段名 */
  longitudeField: string
  /** 纬度字段名 */
  latitudeField: string
  /** 高度字段名 */
  heightField?: string
  /** ID 字段名 */
  idField?: string
  /** 是否有表头 */
  hasHeader?: boolean
}

/**
 * Excel 加载选项
 */
export interface ExcelLoadOptions extends DataLoadOptions {
  /** 工作表名称或索引 */
  sheet?: string | number
  /** 经度字段名或列索引 */
  longitudeField: string | number
  /** 纬度字段名或列索引 */
  latitudeField: string | number
  /** 高度字段名或列索引 */
  heightField?: string | number
  /** ID 字段名或列索引 */
  idField?: string | number
  /** 数据起始行 */
  startRow?: number
}

/**
 * Shapefile 加载选项
 */
export interface ShapefileLoadOptions extends DataLoadOptions {
  /** .shp 文件 */
  shpUrl?: string
  /** .dbf 文件 */
  dbfUrl?: string
  /** .prj 文件（投影信息） */
  prjUrl?: string
  /** 源坐标系 EPSG 代码 */
  sourceEPSG?: number
}

/**
 * WKT 加载选项
 */
export interface WKTLoadOptions {
  /** WKT 字符串或字符串数组 */
  wkt: string | string[]
  /** 属性数据 */
  properties?: Record<string, unknown> | Array<Record<string, unknown>>
}

/**
 * WFS 加载选项
 */
export interface WFSLoadOptions {
  /** WFS 服务 URL */
  url: string
  /** 图层名称 (typeName) */
  typeName: string
  /** WFS 版本 */
  version?: '1.0.0' | '1.1.0' | '2.0.0'
  /** 最大要素数量 */
  maxFeatures?: number
  /** CQL 过滤器 */
  cqlFilter?: string
  /** 边界框过滤 [minx, miny, maxx, maxy] */
  bbox?: [number, number, number, number]
  /** 输出格式 */
  outputFormat?: string
  /** 坐标系 */
  srsName?: string
}

/**
 * 渐变配置
 */
export interface GradientConfig {
  /** 数据字段名 */
  field: string
  /** 渐变色数组 */
  colors: Color[]
  /** 数值范围 [min, max] */
  range?: [number, number]
  /** 是否自动计算范围 */
  autoRange?: boolean
}

/**
 * 行政区域配置
 */
export interface AdminRegionOptions {
  /** 区域代码或名称 */
  code?: string | number
  /** 区域名称 */
  name?: string
  /** 区域级别 */
  level?: 'country' | 'province' | 'city' | 'district'
  /** 渐变配置 */
  gradient?: GradientConfig
  /** 是否显示边界 */
  showBorder?: boolean
  /** 边界颜色 */
  borderColor?: Color
  /** 边界宽度 */
  borderWidth?: number
  /** 拉伸高度 */
  extrudedHeight?: number
  /** 数据映射 */
  dataMapping?: Record<string | number, number>
}

/**
 * 数据加载结果
 */
export interface DataLoadResult {
  /** 解析后的数据项 */
  items: DataItem[]
  /** 原始数据 */
  rawData?: unknown
  /** 元数据 */
  metadata?: Record<string, unknown>
}
