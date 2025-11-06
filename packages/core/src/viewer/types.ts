import type { Viewer as CesiumViewer } from 'cesium'

/**
 * KtdViewer 的独有属性和方法
 */
export interface IKtdViewer {
  /** 插件集合 */
  readonly plugins: Map<string, ViewerPlugin>

  /** 原始 Cesium Viewer 实例 */
  readonly cesiumViewer: CesiumViewer

  /** 使用插件 */
  use<T extends ViewerPlugin>(plugin: ViewerPluginConstructor<T>): T

  /** 获取插件实例 */
  getPlugin<T extends ViewerPlugin>(name: string): T | undefined

  /** 销毁 Viewer 及所有插件 */
  destroy(): void

  /** 是否已销毁 */
  readonly destroyed: boolean
}

/**
 * 扩展的 Viewer 类型
 * 通过 Proxy 实现，同时包含 KtdViewer 的插件功能和 CesiumViewer 的所有属性和方法
 */
export type KtdViewer = IKtdViewer & CesiumViewer

/**
 * 插件接口
 */
export interface ViewerPlugin {
  /** 插件名称 */
  readonly name: string

  /** 插件是否已安装 */
  readonly installed: boolean

  /** 安装插件 */
  install(viewer: KtdViewer): void | Promise<void>

  /** 销毁插件 */
  destroy?(): void | Promise<void>
}

/**
 * 插件构造函数类型
 */
export interface ViewerPluginConstructor<T extends ViewerPlugin = ViewerPlugin> {
  new (): T
  readonly pluginName: string
}

/**
 * Viewer 配置选项
 */
export interface KtdViewerOptions {
  /** 预装载的插件 */
  plugins?: ViewerPluginConstructor[]
}
