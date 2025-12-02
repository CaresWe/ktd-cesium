import type { DataLoadResult, ShapefileLoadOptions } from './types'

/**
 * 加载 Shapefile 数据
 * 支持两种方式：
 * 1. 安装 shpjs 库后自动使用（推荐）
 * 2. 提供降级提示
 *
 * @param options Shapefile 选项
 * @returns 加载结果
 */
export async function loadShapefile(options: ShapefileLoadOptions): Promise<DataLoadResult> {
  try {
    // 尝试使用 shpjs 库
    return await loadShapefileWithShpjs(options)
  } catch (error) {
    if (error instanceof Error && error.message.includes('Cannot find module')) {
      throw new Error(
        'Shapefile support requires shpjs library. Please install it: npm install shpjs\n' +
          'After installation, you can load Shapefiles from:\n' +
          '- ZIP file: { url: "path/to/file.zip" }\n' +
          '- Separate files: { shpUrl: "path/to/file.shp", dbfUrl: "path/to/file.dbf" }'
      )
    }
    console.error('Failed to load Shapefile:', error)
    throw error
  }
}

/**
 * 使用 shpjs 库加载 Shapefile
 */
async function loadShapefileWithShpjs(options: ShapefileLoadOptions): Promise<DataLoadResult> {
  // 动态导入 shpjs
  const shp = await import('shpjs')

  let geojson: unknown

  // 从 ZIP 文件加载
  if (options.url) {
    const response = await fetch(options.url, {
      headers: options.headers
    })
    const buffer = await response.arrayBuffer()
    geojson = await shp.default(buffer)
  }
  // 从单独的文件加载
  else if (options.shpUrl && options.dbfUrl) {
    // 分别加载 .shp 和 .dbf 文件
    const shpResponse = await fetch(options.shpUrl)
    const dbfResponse = await fetch(options.dbfUrl)

    const shpBuffer = await shpResponse.arrayBuffer()
    const dbfBuffer = await dbfResponse.arrayBuffer()

    // .prj 文件（投影信息）- 可选（暂不处理）
    if (options.prjUrl) {
      // const prjResponse = await fetch(options.prjUrl)
      // const prjText = await prjResponse.text()
      // TODO: 处理投影信息
    }

    // 解析 .shp 和 .dbf
    const shpData = shp.parseShp(shpBuffer)
    const dbfData = shp.parseDbf(dbfBuffer)

    // 合并为 GeoJSON
    geojson = shp.combine([shpData, dbfData])
  }
  // 从 ArrayBuffer/Blob/File 加载
  else if (options.data) {
    let buffer: ArrayBuffer
    const data = options.data

    if (data instanceof ArrayBuffer) {
      buffer = data
    } else if (typeof data === 'object' && 'arrayBuffer' in data) {
      // Blob 或 File 类型
      buffer = await (data as Blob).arrayBuffer()
    } else if (typeof data === 'string') {
      throw new Error('String data not supported for Shapefile, use ArrayBuffer or Blob')
    } else {
      throw new Error('Invalid data type for Shapefile')
    }

    geojson = await shp.default(buffer)
  } else {
    throw new Error('Either url, shpUrl+dbfUrl, or data must be provided')
  }

  // 使用 GeoJSON 加载器处理
  const { loadGeoJSON } = await import('./geojson')
  return await loadGeoJSON({
    data: JSON.stringify(geojson)
  })
}

/**
 * 检查是否安装了 shpjs 库
 */
export async function hasShpjsLibrary(): Promise<boolean> {
  try {
    await import('shpjs')
    return true
  } catch {
    return false
  }
}

/**
 * Shapefile 加载说明
 *
 * 要使用 Shapefile 支持，请按以下步骤操作：
 *
 * 1. 安装依赖：
 *    npm install shpjs
 *
 * 2. 使用示例：
 *    const result = await loadShapefile({
 *      shpUrl: 'path/to/file.shp',
 *      dbfUrl: 'path/to/file.dbf',
 *      prjUrl: 'path/to/file.prj' // 可选
 *    })
 *
 * 3. 或直接从 ZIP 文件加载：
 *    const result = await loadShapefile({
 *      url: 'path/to/shapefile.zip'
 *    })
 */
