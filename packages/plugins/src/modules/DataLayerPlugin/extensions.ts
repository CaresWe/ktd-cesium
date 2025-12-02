import type { DataLayerPlugin } from './index'
import type { DataLayerConfig } from './types'
import { loadGeoJSON, loadGeoJSONDataSource } from './loaders/geojson'
import { loadCSV } from './loaders/csv'
import { parseWKT } from './loaders/wkt'
import { loadWFS } from './loaders/wfs'
import { loadKML } from './loaders/kml'
import { loadExcel } from './loaders/excel'
import { loadShapefile } from './loaders/shapefile'
import { applyGradient, GRADIENT_PRESETS } from './loaders/gradient'
import type {
  GeoJSONLoadOptions,
  CSVLoadOptions,
  WKTLoadOptions,
  WFSLoadOptions,
  ExcelLoadOptions,
  ShapefileLoadOptions,
  GradientConfig
} from './loaders/types'

/**
 * 从 GeoJSON 创建图层
 * @param plugin DataLayerPlugin 实例
 * @param config 图层配置
 * @param options GeoJSON 加载选项
 * @returns 图层 ID
 */
export async function loadGeoJSONLayer(
  plugin: DataLayerPlugin,
  config: DataLayerConfig,
  options: GeoJSONLoadOptions
): Promise<string> {
  const result = await loadGeoJSON(options)
  const layerId = plugin.createLayer(config)
  const layer = plugin.getLayer(layerId)

  if (layer) {
    layer.addItems(result.items)
  }

  return layerId
}

/**
 * 从 GeoJSON 创建原生 Cesium DataSource 图层
 * 使用 Cesium 的 GeoJsonDataSource，性能更好
 * @param plugin DataLayerPlugin 实例
 * @param name 图层名称
 * @param options GeoJSON 加载选项
 */
export async function loadGeoJSONNative(
  plugin: DataLayerPlugin,
  name: string,
  options: GeoJSONLoadOptions
): Promise<void> {
  const dataSource = await loadGeoJSONDataSource(options)
  dataSource.name = name
  await plugin['cesiumViewer'].dataSources.add(dataSource)
}

/**
 * 从 CSV 创建图层
 * @param plugin DataLayerPlugin 实例
 * @param config 图层配置
 * @param options CSV 加载选项
 * @returns 图层 ID
 */
export async function loadCSVLayer(
  plugin: DataLayerPlugin,
  config: DataLayerConfig,
  options: CSVLoadOptions
): Promise<string> {
  const result = await loadCSV(options)
  const layerId = plugin.createLayer(config)
  const layer = plugin.getLayer(layerId)

  if (layer) {
    layer.addItems(result.items)
  }

  return layerId
}

/**
 * 从 WKT 创建图层
 * @param plugin DataLayerPlugin 实例
 * @param config 图层配置
 * @param options WKT 选项
 * @returns 图层 ID
 */
export function loadWKTLayer(plugin: DataLayerPlugin, config: DataLayerConfig, options: WKTLoadOptions): string {
  const items = parseWKT(options)
  const layerId = plugin.createLayer(config)
  const layer = plugin.getLayer(layerId)

  if (layer) {
    layer.addItems(items)
  }

  return layerId
}

/**
 * 从 WFS 服务创建图层
 * @param plugin DataLayerPlugin 实例
 * @param config 图层配置
 * @param options WFS 选项
 * @returns 图层 ID
 */
export async function loadWFSLayer(
  plugin: DataLayerPlugin,
  config: DataLayerConfig,
  options: WFSLoadOptions
): Promise<string> {
  const result = await loadWFS(options)
  const layerId = plugin.createLayer(config)
  const layer = plugin.getLayer(layerId)

  if (layer) {
    layer.addItems(result.items)
  }

  return layerId
}

/**
 * 从 KML/KMZ 创建图层
 * 注意：KML 使用 Cesium 原生 DataSource，不通过 DataLayerPlugin
 * @param plugin DataLayerPlugin 实例
 * @param name 图层名称
 * @param url KML/KMZ URL
 */
export async function loadKMLLayer(plugin: DataLayerPlugin, name: string, url: string): Promise<void> {
  const dataSource = await loadKML(url)
  dataSource.name = name
  await plugin['cesiumViewer'].dataSources.add(dataSource)
}

/**
 * 从 Excel 创建图层
 * @param plugin DataLayerPlugin 实例
 * @param config 图层配置
 * @param options Excel 选项
 * @returns 图层 ID
 */
export async function loadExcelLayer(
  plugin: DataLayerPlugin,
  config: DataLayerConfig,
  options: ExcelLoadOptions
): Promise<string> {
  const result = await loadExcel(options)
  const layerId = plugin.createLayer(config)
  const layer = plugin.getLayer(layerId)

  if (layer) {
    layer.addItems(result.items)
  }

  return layerId
}

/**
 * 从 Shapefile 创建图层
 * @param plugin DataLayerPlugin 实例
 * @param config 图层配置
 * @param options Shapefile 选项
 * @returns 图层 ID
 */
export async function loadShapefileLayer(
  plugin: DataLayerPlugin,
  config: DataLayerConfig,
  options: ShapefileLoadOptions
): Promise<string> {
  const result = await loadShapefile(options)
  const layerId = plugin.createLayer(config)
  const layer = plugin.getLayer(layerId)

  if (layer) {
    layer.addItems(result.items)
  }

  return layerId
}

/**
 * 为图层应用渐变色
 * @param plugin DataLayerPlugin 实例
 * @param layerId 图层 ID
 * @param gradientConfig 渐变配置
 */
export function applyLayerGradient(plugin: DataLayerPlugin, layerId: string, gradientConfig: GradientConfig): void {
  const layer = plugin.getLayer(layerId)
  if (!layer) {
    throw new Error(`Layer ${layerId} not found`)
  }

  // 获取所有数据项
  const items = Array.from(layer.dataMap.values())

  // 应用渐变
  const gradientItems = applyGradient(items, gradientConfig)

  // 更新图层
  gradientItems.forEach((item) => {
    layer.updateItem(item.id, item)
  })
}

/**
 * 导出渐变预设
 */
export { GRADIENT_PRESETS }
