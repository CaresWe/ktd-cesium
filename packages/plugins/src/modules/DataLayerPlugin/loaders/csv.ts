import type { DataItem } from '../types'
import type { DataLoadResult, CSVLoadOptions } from './types'
import { Color } from 'cesium'

/**
 * 加载 CSV 数据
 * @param options 加载选项
 * @returns 加载结果
 */
export async function loadCSV(options: CSVLoadOptions): Promise<DataLoadResult> {
  try {
    let csvText: string

    // 从 URL 加载
    if (options.url) {
      const response = await fetch(options.url, {
        headers: options.headers
      })
      csvText = await response.text()
    }
    // 从数据加载
    else if (options.data) {
      if (typeof options.data === 'string') {
        csvText = options.data
      } else if (options.data instanceof Blob || options.data instanceof File) {
        csvText = await options.data.text()
      } else {
        throw new Error('Unsupported data type for CSV')
      }
    } else {
      throw new Error('Either url or data must be provided')
    }

    // 解析 CSV
    const parsed = parseCSV(csvText, options)
    const items = convertCSVToDataItems(parsed, options)

    return {
      items,
      rawData: parsed,
      metadata: {
        rowCount: items.length,
        columnCount: parsed.headers.length
      }
    }
  } catch (error) {
    console.error('Failed to load CSV:', error)
    throw error
  }
}

/**
 * 解析 CSV 文本
 */
function parseCSV(text: string, options: CSVLoadOptions): { headers: string[]; rows: string[][] } {
  const delimiter = options.delimiter || ','
  const lines = text.trim().split(/\r?\n/)

  let headers: string[] = []
  let dataLines = lines

  if (options.hasHeader !== false) {
    headers = lines[0].split(delimiter).map((h) => h.trim())
    dataLines = lines.slice(1)
  } else {
    // 生成默认列名
    const columnCount = lines[0].split(delimiter).length
    headers = Array.from({ length: columnCount }, (_, i) => `column_${i}`)
  }

  const rows = dataLines.map((line) => line.split(delimiter).map((cell) => cell.trim()))

  return { headers, rows }
}

/**
 * 将 CSV 数据转换为 DataItem 数组
 */
function convertCSVToDataItems(parsed: { headers: string[]; rows: string[][] }, options: CSVLoadOptions): DataItem[] {
  const items: DataItem[] = []
  const { headers, rows } = parsed

  const lonIndex = headers.indexOf(options.longitudeField)
  const latIndex = headers.indexOf(options.latitudeField)
  const heightIndex = options.heightField ? headers.indexOf(options.heightField) : -1
  const idIndex = options.idField ? headers.indexOf(options.idField) : -1

  if (lonIndex === -1 || latIndex === -1) {
    throw new Error(
      `Longitude field '${options.longitudeField}' or latitude field '${options.latitudeField}' not found`
    )
  }

  rows.forEach((row, index) => {
    try {
      const lon = parseFloat(row[lonIndex])
      const lat = parseFloat(row[latIndex])
      const height = heightIndex !== -1 ? parseFloat(row[heightIndex]) || 0 : 0

      if (isNaN(lon) || isNaN(lat)) {
        console.warn(`Invalid coordinates at row ${index + 1}`)
        return
      }

      // 构建属性对象
      const properties: Record<string, string> = {}
      headers.forEach((header, i) => {
        properties[header] = row[i]
      })

      const id = idIndex !== -1 ? row[idIndex] : `csv_row_${index}`

      items.push({
        id,
        geometryType: 'point',
        position: [lon, lat, height],
        data: properties,
        style: {
          point: {
            pixelSize: 8,
            color: Color.BLUE,
            outlineColor: Color.WHITE,
            outlineWidth: 2
          }
        }
      })
    } catch (error) {
      console.warn(`Failed to parse row ${index + 1}:`, error)
    }
  })

  return items
}
