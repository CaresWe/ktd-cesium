export { AutoViewer } from './AutoViewer'
export * from './types'

// 便捷工厂函数
import type { Viewer as CesiumViewer } from 'cesium'
import type { AutoViewerOptions } from './types'
import { AutoViewer } from './AutoViewer'

/**
 * 创建 AutoViewer 实例
 * @param viewer Cesium Viewer 实例
 * @param options 配置选项
 * @returns AutoViewer 实例
 */
export function createViewer(viewer: CesiumViewer, options?: AutoViewerOptions): AutoViewer {
  return new AutoViewer(viewer, options)
}
