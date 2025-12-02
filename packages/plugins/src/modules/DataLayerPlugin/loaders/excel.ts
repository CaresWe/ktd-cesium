import type { DataLoadResult, ExcelLoadOptions } from './types'
import type { DataItem } from '../types'
import { Color } from 'cesium'
import type * as XLSX from 'xlsx'

/**
 * 加载 Excel 数据
 * 支持两种方式：
 * 1. 安装 xlsx 库后自动使用（推荐）
 * 2. 不安装库时提供降级方案（仅支持简单格式）
 *
 * @param options Excel 选项
 * @returns 加载结果
 */
export async function loadExcel(options: ExcelLoadOptions): Promise<DataLoadResult> {
  try {
    // 尝试使用 xlsx 库
    try {
      return await loadExcelWithXLSX(options)
    } catch (xlsxError) {
      console.warn('xlsx library not found, falling back to basic parser')
      // 降级到基础解析器（仅支持 CSV 导出的 Excel）
      return await loadExcelBasic(options)
    }
  } catch (error) {
    console.error('Failed to load Excel:', error)
    throw error
  }
}

/**
 * 使用 xlsx 库加载 Excel
 */
async function loadExcelWithXLSX(options: ExcelLoadOptions): Promise<DataLoadResult> {
  // 动态导入 xlsx
  const XLSX = (await import('xlsx')) as typeof import('xlsx')

  let workbook: XLSX.WorkBook
  if (options.url) {
    const response = await fetch(options.url, {
      headers: options.headers
    })
    const buffer = await response.arrayBuffer()
    workbook = XLSX.read(buffer, { type: 'array' })
  } else if (options.data) {
    const data = options.data
    if (data instanceof ArrayBuffer) {
      workbook = XLSX.read(data, { type: 'array' })
    } else if (typeof data === 'object' && 'arrayBuffer' in data) {
      // Blob 或 File 类型
      const buffer = await (data as Blob).arrayBuffer()
      workbook = XLSX.read(buffer, { type: 'array' })
    } else if (typeof data === 'string') {
      // 如果是字符串,尝试作为 base64 或二进制字符串处理
      workbook = XLSX.read(data, { type: 'string' })
    } else {
      throw new Error('Unsupported data type')
    }
  } else {
    throw new Error('Either url or data must be provided')
  }

  // 获取工作表
  const sheetName = typeof options.sheet === 'string' ? options.sheet : workbook.SheetNames[options.sheet || 0]

  const worksheet = workbook.Sheets[sheetName]
  if (!worksheet) {
    throw new Error(`Sheet "${sheetName}" not found`)
  }

  // 转换为 JSON 数组
  const jsonData = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    range: options.startRow,
    defval: ''
  }) as unknown[][]

  // 解析数据
  const items = parseExcelData(jsonData, options)

  return {
    items,
    rawData: jsonData,
    metadata: {
      sheetName,
      rowCount: jsonData.length,
      columnCount: jsonData[0]?.length || 0
    }
  }
}

/**
 * 基础 Excel 解析器（降级方案）
 * 仅支持从 URL 加载且服务器返回 CSV 格式
 */
async function loadExcelBasic(options: ExcelLoadOptions): Promise<DataLoadResult> {
  if (!options.url) {
    throw new Error('Basic Excel parser only supports URL loading. Please install xlsx library: npm install xlsx')
  }

  // 尝试作为 CSV 加载
  const { loadCSV } = await import('./csv')

  try {
    return await loadCSV({
      url: options.url,
      longitudeField: String(options.longitudeField),
      latitudeField: String(options.latitudeField),
      heightField: options.heightField ? String(options.heightField) : undefined,
      idField: options.idField ? String(options.idField) : undefined,
      hasHeader: true
    })
  } catch (error) {
    throw new Error('Failed to load Excel file. Please install xlsx library for full Excel support: npm install xlsx')
  }
}

/**
 * 解析 Excel 数据为 DataItem 数组
 */
function parseExcelData(data: unknown[][], options: ExcelLoadOptions): DataItem[] {
  if (data.length === 0) {
    return []
  }

  const items: DataItem[] = []

  // 确定字段索引
  const lonIndex = getFieldIndex(data[0], options.longitudeField)
  const latIndex = getFieldIndex(data[0], options.latitudeField)
  const heightIndex = options.heightField ? getFieldIndex(data[0], options.heightField) : -1
  const idIndex = options.idField ? getFieldIndex(data[0], options.idField) : -1

  if (lonIndex === -1 || latIndex === -1) {
    throw new Error('Longitude or latitude field not found in Excel data')
  }

  // 获取表头（第一行）
  const headers = data[0].map(String)

  // 解析数据行
  for (let i = 1; i < data.length; i++) {
    const row = data[i]

    try {
      const lon = parseFloat(String(row[lonIndex] || ''))
      const lat = parseFloat(String(row[latIndex] || ''))
      const height = heightIndex !== -1 ? parseFloat(String(row[heightIndex] || '0')) || 0 : 0

      if (isNaN(lon) || isNaN(lat)) {
        console.warn(`Invalid coordinates at row ${i + 1}`)
        continue
      }

      // 构建属性对象
      const properties: Record<string, unknown> = {}
      headers.forEach((header, idx) => {
        properties[header] = row[idx]
      })

      const id = idIndex !== -1 ? String(row[idIndex]) : `excel_row_${i}`

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
      console.warn(`Failed to parse row ${i + 1}:`, error)
    }
  }

  return items
}

/**
 * 获取字段索引
 * @param firstRow 第一行数据
 * @param field 字段名或索引
 */
function getFieldIndex(firstRow: unknown[], field: string | number): number {
  if (typeof field === 'number') {
    return field
  }

  // 按字段名查找
  const index = firstRow.findIndex((cell) => String(cell).toLowerCase() === field.toLowerCase())
  return index
}

/**
 * 检查是否安装了 xlsx 库
 */
export async function hasXLSXLibrary(): Promise<boolean> {
  try {
    await import('xlsx')
    return true
  } catch {
    return false
  }
}

/**
 * Excel 加载说明
 *
 * 要使用 Excel 支持，请按以下步骤操作：
 *
 * 1. 安装依赖：
 *    npm install xlsx
 *
 * 2. 使用示例：
 *    const result = await loadExcel({
 *      url: 'path/to/file.xlsx',
 *      sheet: 0, // 或工作表名称
 *      longitudeField: 'longitude',
 *      latitudeField: 'latitude',
 *      heightField: 'height',
 *      startRow: 1 // 跳过表头
 *    })
 */
