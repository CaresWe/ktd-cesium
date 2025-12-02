import type {
  CesiumWorldTerrainOptions,
  ArcGISTerrainOptions,
  GoogleTerrainOptions,
  CustomTerrainOptions,
  EllipsoidTerrainOptions
} from './types'
import { TerrainServiceType } from './types'

/**
 * Cesium World Terrain 预设配置
 */
export function createCesiumWorldTerrainConfig(
  options: Partial<Omit<CesiumWorldTerrainOptions, 'type'>> = {}
): CesiumWorldTerrainOptions {
  return {
    type: TerrainServiceType.CESIUM_WORLD,
    requestWaterMask: true,
    requestVertexNormals: true,
    enableLighting: true,
    ...options
  }
}

/**
 * ArcGIS World Terrain 预设配置
 */
export function createArcGISWorldTerrainConfig(
  options: Partial<Omit<ArcGISTerrainOptions, 'type' | 'url'>> = {}
): ArcGISTerrainOptions {
  return {
    type: TerrainServiceType.ARCGIS,
    url: 'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer',
    enableLighting: true,
    ...options
  }
}

/**
 * Google Terrain 预设配置
 */
export function createGoogleTerrainConfig(
  options: Partial<Omit<GoogleTerrainOptions, 'type'>> = {}
): GoogleTerrainOptions {
  return {
    type: TerrainServiceType.GOOGLE,
    enableLighting: true,
    ...options
  }
}

/**
 * 椭球体地形预设配置
 */
export function createEllipsoidTerrainConfig(
  options: Partial<Omit<EllipsoidTerrainOptions, 'type'>> = {}
): EllipsoidTerrainOptions {
  return {
    type: TerrainServiceType.ELLIPSOID,
    enableLighting: false,
    exaggeration: 1.0,
    ...options
  }
}

/**
 * 中国地形服务预设配置
 * 基于开放数据源
 */
export function createChinaTerrainConfig(
  options: Partial<Omit<CustomTerrainOptions, 'type' | 'url'>> = {}
): CustomTerrainOptions {
  return {
    type: TerrainServiceType.CUSTOM,
    url: 'http://data.marsgis.cn/terrain',
    requestWaterMask: false,
    requestVertexNormals: true,
    enableLighting: true,
    minimumLevel: 0,
    maximumLevel: 13,
    rectangle: [73.0, 3.0, 135.0, 54.0], // 中国范围
    credit: 'China Terrain Data',
    ...options
  }
}

/**
 * GeoServer 地形服务配置生成器
 */
export function createGeoServerTerrainConfig(
  baseUrl: string,
  workspace: string,
  coverageStore: string,
  options: Partial<Omit<CustomTerrainOptions, 'type' | 'url'>> = {}
): CustomTerrainOptions {
  const url = `${baseUrl}/geoserver/gwc/service/tms/1.0.0/${workspace}:${coverageStore}@EPSG:4326@png/{z}/{x}/{y}.png`

  return {
    type: TerrainServiceType.CUSTOM,
    url,
    requestWaterMask: false,
    requestVertexNormals: true,
    enableLighting: true,
    ...options
  }
}

/**
 * SuperMap 地形服务配置生成器
 */
export function createSuperMapTerrainConfig(
  url: string,
  options: Partial<Omit<CustomTerrainOptions, 'type' | 'url'>> = {}
): CustomTerrainOptions {
  return {
    type: TerrainServiceType.CUSTOM,
    url,
    requestWaterMask: false,
    requestVertexNormals: true,
    enableLighting: true,
    ...options
  }
}

/**
 * 自定义地形服务配置生成器
 */
export function createCustomTerrainConfig(
  url: string,
  options: Partial<Omit<CustomTerrainOptions, 'type' | 'url'>> = {}
): CustomTerrainOptions {
  return {
    type: TerrainServiceType.CUSTOM,
    url,
    requestWaterMask: false,
    requestVertexNormals: true,
    enableLighting: true,
    ...options
  }
}

/**
 * 地形服务 URL 常量
 */
export const TERRAIN_URLS = {
  /** Cesium World Terrain */
  CESIUM_WORLD: 'https://assets.cesium.com/1',
  /** ArcGIS World Terrain */
  ARCGIS_WORLD: 'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer',
  /** 中国地形服务 */
  CHINA: 'http://data.marsgis.cn/terrain',
  /** 天地图地形服务(需要token) */
  TIANDITU: (token: string) => `https://t{0-7}.tianditu.gov.cn/DataServer?T=elv_c&x={x}&y={y}&l={z}&tk=${token}`
} as const

/**
 * 获取预设地形配置
 */
export function getPresetTerrainConfig(
  preset: 'cesium-world' | 'arcgis-world' | 'google' | 'china' | 'ellipsoid',
  options: Record<string, unknown> = {}
):
  | CustomTerrainOptions
  | EllipsoidTerrainOptions
  | CesiumWorldTerrainOptions
  | ArcGISTerrainOptions
  | GoogleTerrainOptions {
  switch (preset) {
    case 'cesium-world':
      return createCesiumWorldTerrainConfig(options as Partial<Omit<CesiumWorldTerrainOptions, 'type'>>)
    case 'arcgis-world':
      return createArcGISWorldTerrainConfig(options as Partial<Omit<ArcGISTerrainOptions, 'type' | 'url'>>)
    case 'google':
      return createGoogleTerrainConfig(options as Partial<Omit<GoogleTerrainOptions, 'type'>>)
    case 'china':
      return createChinaTerrainConfig(options as Partial<Omit<CustomTerrainOptions, 'type' | 'url'>>)
    case 'ellipsoid':
      return createEllipsoidTerrainConfig(options as Partial<Omit<EllipsoidTerrainOptions, 'type'>>)
    default:
      return createEllipsoidTerrainConfig()
  }
}
