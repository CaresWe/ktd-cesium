import type { DataLoadResult, WFSLoadOptions } from './types'
import { loadGeoJSON } from './geojson'

/**
 * 加载 WFS (Web Feature Service) 数据
 * @param options WFS 选项
 * @returns 加载结果
 */
export async function loadWFS(options: WFSLoadOptions): Promise<DataLoadResult> {
  try {
    const url = buildWFSURL(options)

    // WFS 通常返回 GeoJSON 格式，使用 GeoJSON 加载器
    return await loadGeoJSON({ url })
  } catch (error) {
    console.error('Failed to load WFS:', error)
    throw error
  }
}

/**
 * 构建 WFS 请求 URL
 */
function buildWFSURL(options: WFSLoadOptions): string {
  const params = new URLSearchParams({
    service: 'WFS',
    version: options.version || '2.0.0',
    request: 'GetFeature',
    typeName: options.typeName,
    outputFormat: options.outputFormat || 'application/json'
  })

  if (options.maxFeatures) {
    params.set('maxFeatures', options.maxFeatures.toString())
  }

  if (options.cqlFilter) {
    params.set('cql_filter', options.cqlFilter)
  }

  if (options.bbox) {
    params.set('bbox', options.bbox.join(','))
  }

  if (options.srsName) {
    params.set('srsName', options.srsName)
  }

  return `${options.url}?${params.toString()}`
}
