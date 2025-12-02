import { GeoJsonDataSource, Color } from 'cesium'
import type { DataItem } from '../types'
import type { DataLoadResult, GeoJSONLoadOptions } from './types'

/**
 * 加载 GeoJSON 数据
 * @param options 加载选项
 * @returns 加载结果
 */
export async function loadGeoJSON(options: GeoJSONLoadOptions): Promise<DataLoadResult> {
  try {
    let geojsonData: string | object

    // 从 URL 加载
    if (options.url) {
      const response = await fetch(options.url, {
        headers: options.headers
      })
      geojsonData = await response.json()
    }
    // 从数据加载
    else if (options.data) {
      if (typeof options.data === 'string') {
        geojsonData = JSON.parse(options.data)
      } else if (options.data instanceof Blob || options.data instanceof File) {
        const text = await options.data.text()
        geojsonData = JSON.parse(text)
      } else {
        throw new Error('Unsupported data type for GeoJSON')
      }
    } else {
      throw new Error('Either url or data must be provided')
    }

    // 解析 GeoJSON 为 DataItem
    const items = parseGeoJSONToDataItems(geojsonData, options)

    return {
      items,
      rawData: geojsonData,
      metadata: {
        featureCount: items.length
      }
    }
  } catch (error) {
    console.error('Failed to load GeoJSON:', error)
    throw error
  }
}

/**
 * 解析 GeoJSON 数据为 DataItem 数组
 */
function parseGeoJSONToDataItems(geojson: unknown, options: GeoJSONLoadOptions): DataItem[] {
  const items: DataItem[] = []
  const data = geojson as { type: string; features?: unknown[]; coordinates?: unknown }

  if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
    data.features.forEach((feature, index) => {
      const item = parseFeature(feature, index, options)
      if (item) items.push(item)
    })
  } else if (data.type === 'Feature') {
    const item = parseFeature(data, 0, options)
    if (item) items.push(item)
  } else if (data.type && data.coordinates) {
    // 单个几何对象
    const item = parseGeometry(data, '0', {}, options)
    if (item) items.push(item)
  }

  return items
}

/**
 * 解析 GeoJSON Feature
 */
function parseFeature(feature: unknown, index: number, options: GeoJSONLoadOptions): DataItem | null {
  try {
    const f = feature as {
      type: string
      geometry: unknown
      properties?: Record<string, unknown>
      id?: string | number
    }

    if (!f.geometry) return null

    const properties = f.properties || {}
    const id = String(f.id ?? properties.id ?? `feature_${index}`)

    return parseGeometry(f.geometry, id, properties, options)
  } catch (error) {
    console.error('Failed to parse feature:', error)
    return null
  }
}

/**
 * 解析 GeoJSON Geometry
 */
function parseGeometry(
  geometry: unknown,
  id: string | number,
  properties: Record<string, unknown>,
  options: GeoJSONLoadOptions
): DataItem | null {
  try {
    const geom = geometry as { type: string; coordinates: unknown }

    switch (geom.type) {
      case 'Point':
        return parsePoint(geom.coordinates, id, properties, options)
      case 'LineString':
        return parseLineString(geom.coordinates, id, properties, options)
      case 'Polygon':
        return parsePolygon(geom.coordinates, id, properties, options)
      case 'MultiPoint':
        return parseMultiPoint(geom.coordinates, id, properties, options)
      case 'MultiLineString':
        return parseMultiLineString(geom.coordinates, id, properties, options)
      case 'MultiPolygon':
        return parseMultiPolygon(geom.coordinates, id, properties, options)
      default:
        console.warn(`Unsupported geometry type: ${geom.type}`)
        return null
    }
  } catch (error) {
    console.error('Failed to parse geometry:', error)
    return null
  }
}

/**
 * 解析 Point
 */
function parsePoint(
  coordinates: unknown,
  id: string | number,
  properties: Record<string, unknown>,
  options: GeoJSONLoadOptions
): DataItem {
  const coords = coordinates as [number, number, number?]
  return {
    id,
    geometryType: 'point',
    position: [coords[0], coords[1], coords[2] || 0],
    data: properties,
    style: {
      point: {
        pixelSize: options.markerSize || 10,
        color: options.markerColor || Color.BLUE,
        outlineColor: Color.WHITE,
        outlineWidth: 2
      }
    }
  }
}

/**
 * 解析 LineString
 */
function parseLineString(
  coordinates: unknown,
  id: string | number,
  properties: Record<string, unknown>,
  options: GeoJSONLoadOptions
): DataItem {
  const coords = coordinates as Array<[number, number, number?]>
  const positions: Array<[number, number, number]> = coords.map((c) => [c[0], c[1], c[2] || 0])

  return {
    id,
    geometryType: 'polyline',
    positions,
    data: properties,
    style: {
      polyline: {
        width: options.strokeWidth || 2,
        material: options.stroke || Color.BLUE,
        clampToGround: options.clampToGround || false
      }
    }
  }
}

/**
 * 解析 Polygon
 */
function parsePolygon(
  coordinates: unknown,
  id: string | number,
  properties: Record<string, unknown>,
  options: GeoJSONLoadOptions
): DataItem {
  const coords = coordinates as Array<Array<[number, number, number?]>>
  // 使用外环
  const outerRing = coords[0]
  const positions: Array<[number, number, number]> = outerRing.map((c) => [c[0], c[1], c[2] || 0])

  return {
    id,
    geometryType: 'polygon',
    positions,
    data: properties,
    style: {
      polygon: {
        material: options.fill || Color.BLUE.withAlpha(0.5),
        outline: true,
        outlineColor: options.stroke || Color.BLACK,
        outlineWidth: options.strokeWidth || 1,
        clampToGround: options.clampToGround
      }
    }
  }
}

/**
 * 解析 MultiPoint (返回第一个点)
 */
function parseMultiPoint(
  coordinates: unknown,
  id: string | number,
  properties: Record<string, unknown>,
  options: GeoJSONLoadOptions
): DataItem | null {
  const coords = coordinates as Array<[number, number, number?]>
  if (coords.length === 0) return null
  return parsePoint(coords[0], id, properties, options)
}

/**
 * 解析 MultiLineString (返回第一条线)
 */
function parseMultiLineString(
  coordinates: unknown,
  id: string | number,
  properties: Record<string, unknown>,
  options: GeoJSONLoadOptions
): DataItem | null {
  const coords = coordinates as Array<Array<[number, number, number?]>>
  if (coords.length === 0) return null
  return parseLineString(coords[0], id, properties, options)
}

/**
 * 解析 MultiPolygon (返回第一个面)
 */
function parseMultiPolygon(
  coordinates: unknown,
  id: string | number,
  properties: Record<string, unknown>,
  options: GeoJSONLoadOptions
): DataItem | null {
  const coords = coordinates as Array<Array<Array<[number, number, number?]>>>
  if (coords.length === 0) return null
  return parsePolygon(coords[0], id, properties, options)
}

/**
 * 使用 Cesium 原生加载 GeoJSON (返回 DataSource)
 * 这个方法直接使用 Cesium 的 GeoJsonDataSource
 */
export async function loadGeoJSONDataSource(options: GeoJSONLoadOptions): Promise<GeoJsonDataSource> {
  try {
    const dataSource = new GeoJsonDataSource()

    // 设置默认样式
    if (options.fill || options.stroke || options.markerColor) {
      await dataSource.load(options.url || options.data!, {
        fill: options.fill,
        stroke: options.stroke,
        strokeWidth: options.strokeWidth,
        markerColor: options.markerColor,
        markerSize: options.markerSize,
        clampToGround: options.clampToGround
      })
    } else {
      await dataSource.load(options.url || options.data!)
    }

    return dataSource
  } catch (error) {
    console.error('Failed to load GeoJSON data source:', error)
    throw error
  }
}
