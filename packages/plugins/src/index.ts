// 导出基类
export { BasePlugin } from './BasePlugin'

// 导出所有插件
export { CameraPlugin } from './plugins/CameraPlugin'
export { EventPlugin } from './plugins/EventPlugin'
export * from './plugins/EventPlugin/types'
export { PopupPlugin } from './plugins/PopupPlugin'
export * from './plugins/PopupPlugin/types'
export { DataLayerPlugin } from './plugins/DataLayerPlugin'
export * from './plugins/DataLayerPlugin/types'
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
} from './plugins/BaseLayerPlugin'
