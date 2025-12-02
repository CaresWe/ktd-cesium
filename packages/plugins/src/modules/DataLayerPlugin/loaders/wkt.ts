import type { DataItem } from '../types'
import type { WKTLoadOptions } from './types'
import { Color } from 'cesium'

/**
 * 解析 WKT (Well-Known Text) 格式
 * @param options WKT 选项
 * @returns DataItem 数组
 */
export function parseWKT(options: WKTLoadOptions): DataItem[] {
  const wktArray = Array.isArray(options.wkt) ? options.wkt : [options.wkt]
  const propertiesArray = Array.isArray(options.properties) ? options.properties : [options.properties || {}]

  return wktArray.map((wkt, index) => parseWKTString(wkt, index, propertiesArray[index] || {}))
}

/**
 * 解析单个 WKT 字符串
 */
function parseWKTString(wkt: string, id: number, properties: Record<string, unknown>): DataItem {
  const trimmed = wkt.trim().toUpperCase()

  // POINT
  if (trimmed.startsWith('POINT')) {
    return parseWKTPoint(wkt, id, properties)
  }
  // LINESTRING
  else if (trimmed.startsWith('LINESTRING')) {
    return parseWKTLineString(wkt, id, properties)
  }
  // POLYGON
  else if (trimmed.startsWith('POLYGON')) {
    return parseWKTPolygon(wkt, id, properties)
  }
  // MULTIPOINT
  else if (trimmed.startsWith('MULTIPOINT')) {
    return parseWKTMultiPoint(wkt, id, properties)
  }
  // MULTILINESTRING
  else if (trimmed.startsWith('MULTILINESTRING')) {
    return parseWKTMultiLineString(wkt, id, properties)
  }
  // MULTIPOLYGON
  else if (trimmed.startsWith('MULTIPOLYGON')) {
    return parseWKTMultiPolygon(wkt, id, properties)
  }

  throw new Error(`Unsupported WKT type: ${wkt}`)
}

/**
 * 解析 WKT POINT
 */
function parseWKTPoint(wkt: string, id: number, properties: Record<string, unknown>): DataItem {
  const match = wkt.match(/POINT\s*\(([^)]+)\)/i)
  if (!match) throw new Error('Invalid WKT POINT format')

  const [lon, lat, height = 0] = match[1].split(/\s+/).map(Number)

  return {
    id: `wkt_point_${id}`,
    geometryType: 'point',
    position: [lon, lat, height],
    data: properties,
    style: {
      point: {
        pixelSize: 10,
        color: Color.BLUE,
        outlineColor: Color.WHITE,
        outlineWidth: 2
      }
    }
  }
}

/**
 * 解析 WKT LINESTRING
 */
function parseWKTLineString(wkt: string, id: number, properties: Record<string, unknown>): DataItem {
  const match = wkt.match(/LINESTRING\s*\(([^)]+)\)/i)
  if (!match) throw new Error('Invalid WKT LINESTRING format')

  const coordinates = match[1].split(',').map((coord) => {
    const [lon, lat, height = 0] = coord.trim().split(/\s+/).map(Number)
    return [lon, lat, height] as [number, number, number]
  })

  return {
    id: `wkt_linestring_${id}`,
    geometryType: 'polyline',
    positions: coordinates,
    data: properties,
    style: {
      polyline: {
        width: 2,
        material: Color.BLUE
      }
    }
  }
}

/**
 * 解析 WKT POLYGON
 */
function parseWKTPolygon(wkt: string, id: number, properties: Record<string, unknown>): DataItem {
  const match = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/i)
  if (!match) throw new Error('Invalid WKT POLYGON format')

  const coordinates = match[1].split(',').map((coord) => {
    const [lon, lat, height = 0] = coord.trim().split(/\s+/).map(Number)
    return [lon, lat, height] as [number, number, number]
  })

  return {
    id: `wkt_polygon_${id}`,
    geometryType: 'polygon',
    positions: coordinates,
    data: properties,
    style: {
      polygon: {
        material: Color.BLUE.withAlpha(0.5),
        outline: true,
        outlineColor: Color.BLACK,
        outlineWidth: 1
      }
    }
  }
}

/**
 * 解析 WKT MULTIPOINT (返回第一个点)
 */
function parseWKTMultiPoint(wkt: string, id: number, properties: Record<string, unknown>): DataItem {
  const match = wkt.match(/MULTIPOINT\s*\(([^)]+)\)/i)
  if (!match) throw new Error('Invalid WKT MULTIPOINT format')

  const firstPoint = match[1].split(',')[0]
  const [lon, lat, height = 0] = firstPoint.trim().replace(/[()]/g, '').split(/\s+/).map(Number)

  return {
    id: `wkt_multipoint_${id}`,
    geometryType: 'point',
    position: [lon, lat, height],
    data: properties
  }
}

/**
 * 解析 WKT MULTILINESTRING (返回第一条线)
 */
function parseWKTMultiLineString(wkt: string, id: number, properties: Record<string, unknown>): DataItem {
  const match = wkt.match(/MULTILINESTRING\s*\(\(([^)]+)\)\)/i)
  if (!match) throw new Error('Invalid WKT MULTILINESTRING format')

  return parseWKTLineString(`LINESTRING(${match[1]})`, id, properties)
}

/**
 * 解析 WKT MULTIPOLYGON (返回第一个面)
 */
function parseWKTMultiPolygon(wkt: string, id: number, properties: Record<string, unknown>): DataItem {
  const match = wkt.match(/MULTIPOLYGON\s*\(\(\(([^)]+)\)\)\)/i)
  if (!match) throw new Error('Invalid WKT MULTIPOLYGON format')

  return parseWKTPolygon(`POLYGON((${match[1]}))`, id, properties)
}
