import type { Cartesian3 } from 'cesium'

/**
 * 地形服务类型
 */
export enum TerrainServiceType {
  /** Cesium World Terrain */
  CESIUM_WORLD = 'cesium-world',
  /** Cesium Ion 资产 */
  CESIUM_ION = 'cesium-ion',
  /** ArcGIS地形服务 */
  ARCGIS = 'arcgis',
  /** Google 地形服务 */
  GOOGLE = 'google',
  /** Mapbox 地形服务 */
  MAPBOX = 'mapbox',
  /** 自定义地形服务 */
  CUSTOM = 'custom',
  /** Ellipsoid 椭球体地形 */
  ELLIPSOID = 'ellipsoid'
}

/**
 * 地形配置基础选项
 */
export interface BaseTerrainOptions {
  /** 是否启用光照 */
  enableLighting?: boolean
  /** 地形夸张倍数 */
  exaggeration?: number
  /** 是否启用地形请求垂直夸张 */
  exaggerationRelativeHeight?: number
  /** 是否显示 */
  show?: boolean
}

/**
 * Cesium World Terrain 配置
 */
export interface CesiumWorldTerrainOptions extends BaseTerrainOptions {
  /** 服务类型 */
  type: TerrainServiceType.CESIUM_WORLD
  /** Cesium Ion 访问令牌 */
  accessToken?: string
  /** 是否请求水面法线 */
  requestWaterMask?: boolean
  /** 是否请求顶点法线 */
  requestVertexNormals?: boolean
}

/**
 * Cesium Ion 地形配置
 */
export interface CesiumIonTerrainOptions extends BaseTerrainOptions {
  /** 服务类型 */
  type: TerrainServiceType.CESIUM_ION
  /** Ion 资产 ID */
  assetId: number
  /** Cesium Ion 访问令牌 */
  accessToken: string
  /** 是否请求水面法线 */
  requestWaterMask?: boolean
  /** 是否请求顶点法线 */
  requestVertexNormals?: boolean
}

/**
 * ArcGIS 地形配置
 */
export interface ArcGISTerrainOptions extends BaseTerrainOptions {
  /** 服务类型 */
  type: TerrainServiceType.ARCGIS
  /** 地形服务 URL */
  url: string
  /** 访问令牌 */
  token?: string
}

/**
 * Google 地形配置
 */
export interface GoogleTerrainOptions extends BaseTerrainOptions {
  /** 服务类型 */
  type: TerrainServiceType.GOOGLE
  /** Google API 密钥 */
  apiKey?: string
}

/**
 * Mapbox 地形配置
 */
export interface MapboxTerrainOptions extends BaseTerrainOptions {
  /** 服务类型 */
  type: TerrainServiceType.MAPBOX
  /** Mapbox 访问令牌 */
  accessToken: string
  /** 地形集 ID */
  mapId?: string
}

/**
 * 自定义地形配置
 */
export interface CustomTerrainOptions extends BaseTerrainOptions {
  /** 服务类型 */
  type: TerrainServiceType.CUSTOM
  /** 地形服务 URL */
  url: string
  /** 是否请求水面法线 */
  requestWaterMask?: boolean
  /** 是否请求顶点法线 */
  requestVertexNormals?: boolean
  /** 最小细节层级 */
  minimumLevel?: number
  /** 最大细节层级 */
  maximumLevel?: number
  /** 区域范围 [west, south, east, north] */
  rectangle?: [number, number, number, number]
  /** 信用信息 */
  credit?: string
}

/**
 * 椭球体地形配置
 */
export interface EllipsoidTerrainOptions extends BaseTerrainOptions {
  /** 服务类型 */
  type: TerrainServiceType.ELLIPSOID
}

/**
 * 地形配置联合类型
 */
export type TerrainOptions =
  | CesiumWorldTerrainOptions
  | CesiumIonTerrainOptions
  | ArcGISTerrainOptions
  | GoogleTerrainOptions
  | MapboxTerrainOptions
  | CustomTerrainOptions
  | EllipsoidTerrainOptions

/**
 * 水效果配置
 */
export interface WaterEffectOptions {
  /** 水体区域坐标点数组 */
  positions: Cartesian3[]
  /** 水面高度(米) */
  height: number
  /** 水面颜色 */
  color?: string
  /** 水面透明度 */
  alpha?: number
  /** 波纹强度 */
  waveIntensity?: number
  /** 波纹速度 */
  waveSpeed?: number
  /** 波纹频率 */
  frequency?: number
  /** 折射强度 */
  refractionIntensity?: number
  /** 反射强度 */
  reflectionIntensity?: number
  /** 是否显示 */
  show?: boolean
}

/**
 * 地形淹没分析配置
 */
export interface FloodAnalysisOptions {
  /** 淹没区域坐标点数组 */
  positions: Cartesian3[]
  /** 起始水位高度(米) */
  startHeight: number
  /** 目标水位高度(米) */
  targetHeight: number
  /** 当前水位高度(米) */
  currentHeight?: number
  /** 水位上升速度(米/秒) */
  riseSpeed?: number
  /** 淹没动画持续时间(秒) */
  duration?: number
  /** 水面颜色 */
  waterColor?: string
  /** 水面透明度 */
  alpha?: number
  /** 是否自动开始 */
  autoStart?: boolean
  /** 是否循环播放 */
  loop?: boolean
  /** 是否显示高程标注 */
  showHeightLabel?: boolean
  /** 淹没完成回调 */
  onComplete?: () => void
  /** 水位更新回调 */
  onHeightChange?: (height: number) => void
}

/**
 * 地形分析结果
 */
export interface TerrainAnalysisResult {
  /** 分析类型 */
  type: 'flood' | 'slope' | 'aspect' | 'elevation'
  /** 分析区域 */
  positions: Cartesian3[]
  /** 最小高程 */
  minElevation: number
  /** 最大高程 */
  maxElevation: number
  /** 平均高程 */
  avgElevation: number
  /** 高程数据数组 */
  elevations?: number[]
  /** 淹没面积(平方米) */
  floodArea?: number
  /** 淹没体积(立方米) */
  floodVolume?: number
}

/**
 * 地形采样配置
 */
export interface TerrainSampleOptions {
  /** 采样位置 */
  positions: Cartesian3[]
  /** 采样精度等级(0-最高, 数值越大精度越低) */
  level?: number
  /** 是否异步采样 */
  async?: boolean
}

/**
 * 地形高程数据
 */
export interface TerrainElevationData {
  /** 位置坐标 */
  position: Cartesian3
  /** 高程值(米) */
  elevation: number
  /** 经度 */
  longitude: number
  /** 纬度 */
  latitude: number
}
