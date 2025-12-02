import { KmlDataSource, Camera } from 'cesium'

/**
 * 加载 KML/KMZ 文件
 * 使用 Cesium 原生的 KmlDataSource
 * @param url KML/KMZ 文件的 URL
 * @param options 加载选项
 * @returns KmlDataSource 实例
 */
export async function loadKML(
  url: string,
  options?: {
    camera?: Camera
    canvas?: HTMLCanvasElement
    clampToGround?: boolean
  }
): Promise<KmlDataSource> {
  try {
    const dataSource = await KmlDataSource.load(url, options)
    return dataSource
  } catch (error) {
    console.error('Failed to load KML/KMZ:', error)
    throw error
  }
}
