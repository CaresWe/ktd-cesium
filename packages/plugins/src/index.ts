// 导出基类
export { BasePlugin } from './BasePlugin'

// 导出所有插件
export {
  CameraPlugin,
  RoamingManager,
  KeyboardRoamingManager,
  IndoorRoamingManager
} from './modules/CameraPlugin'
export * from './modules/CameraPlugin/types'
export { EventPlugin } from './modules/EventPlugin'
export * from './modules/EventPlugin/types'
export { PopupPlugin } from './modules/PopupPlugin'
export * from './modules/PopupPlugin/types'
export { DataLayerPlugin } from './modules/DataLayerPlugin'
export * from './modules/DataLayerPlugin/types'
export {
  BaseLayerPlugin,
  CoordinateSystem,
  CoordinateOffset,
  type BaseLayerOptions,
  type XYZLayerOptions,
  type TMSLayerOptions,
  type WMSLayerOptions,
  type WMTSLayerOptions,
  type ArcGISLayerOptions,
  // 地图服务商预设
  TiandituLayerType,
  AmapLayerType,
  TencentLayerType,
  BaiduLayerType,
  GeovisLayerType,
  SuperMapLayerType,
  // 地图服务商 URL 常量
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
  type TiandituOptions,
  type AmapOptions,
  type TencentOptions,
  type BaiduOptions,
  type GeovisOptions,
  type SuperMapOptions,
  // 坐标转换工具（从 shared 包重新导出）
  wgs84ToGcj02,
  gcj02ToWgs84,
  gcj02ToBd09,
  bd09ToGcj02,
  wgs84ToBd09,
  bd09ToWgs84,
  transformCoordinate
} from './modules/BaseLayerPlugin'
export { TransformPlugin } from './modules/TransformPlugin'
export * from './modules/TransformPlugin/types'
export { TilesPlugin } from './modules/TilesPlugin'
export * from './modules/TilesPlugin/types'
export { ScenePlugin } from './modules/ScenePlugin'
export * from './modules/ScenePlugin/types'
export {
  RainEffect,
  SnowEffect,
  FogEffect,
  LightningEffect,
  HeightFogEffect,
  LocalRainEffect
} from './modules/ScenePlugin'
export { GraphicsPlugin } from './modules/GraphicsPlugin'
export * from './modules/GraphicsPlugin/types'
