export { KtdViewer } from './KtdViewer'
export * from './types'

// 便捷工厂函数
import type { Viewer as CesiumViewer } from 'cesium'
import type { KtdViewerOptions } from './types'
import { KtdViewer } from './KtdViewer'

/**
 * 创建 KtdViewer 实例
 * @param viewer Cesium Viewer 实例
 * @param options 配置选项
 * @returns KtdViewer 实例
 */
export function createViewer(viewer: CesiumViewer, options?: KtdViewerOptions): KtdViewer {
  return new KtdViewer(viewer, options)
}
