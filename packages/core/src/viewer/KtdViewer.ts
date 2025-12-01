import type { Viewer as CesiumViewer } from 'cesium'
import type {
  IKtdViewer,
  KtdViewer as KtdViewerType,
  KtdViewerOptions,
  ViewerPlugin,
  ViewerPluginConstructor
} from './types'

/**
 * 扩展的 Cesium Viewer
 * 支持插件系统，可以挂载各种功能模块
 * 使用包装器模式
 */
export class KtdViewer implements IKtdViewer {
  /** 原始 Cesium Viewer 实例 */
  private readonly viewer: CesiumViewer

  /** 插件集合 */
  readonly plugins: Map<string, ViewerPlugin> = new Map()

  /** 是否已销毁 */
  private _destroyed = false

  constructor(viewer: CesiumViewer, options: KtdViewerOptions = {}) {
    this.viewer = viewer

    // 安装预设插件
    if (options.plugins && options.plugins.length > 0) {
      options.plugins.forEach((Plugin) => {
        this.use(Plugin)
      })
    }

    // 使用 Proxy 代理所有 viewer 的属性和方法
    return new Proxy(this, {
      get(target, prop, receiver) {
        // 优先返回 KtdViewer 自己的属性和方法
        if (prop in target) {
          return Reflect.get(target, prop, receiver)
        }
        // 否则代理到原始 viewer
        const value = Reflect.get(target.viewer, prop)
        // 如果是函数，绑定 this 到原始 viewer
        if (typeof value === 'function') {
          return value.bind(target.viewer)
        }
        return value
      },
      set(target, prop, value) {
        // 如果是 KtdViewer 自己的属性，直接设置
        if (prop in target) {
          return Reflect.set(target, prop, value)
        }
        // 否则设置到原始 viewer
        return Reflect.set(target.viewer, prop, value)
      }
    }) as unknown as KtdViewer & CesiumViewer
  }

  /**
   * 使用插件
   * @param Plugin 插件构造函数
   * @returns 插件实例
   */
  use<T extends ViewerPlugin>(Plugin: ViewerPluginConstructor<T>): T {
    const pluginName = Plugin.pluginName

    // 检查插件是否已安装
    if (this.plugins.has(pluginName)) {
      console.warn(`Plugin "${pluginName}" is already installed`)
      return this.plugins.get(pluginName) as T
    }

    // 创建插件实例
    const plugin = new Plugin()

    // 安装插件（使用类型断言，因为 Proxy 会在运行时提供所有 CesiumViewer 的属性）
    const result = plugin.install(this as unknown as KtdViewerType)

    // 如果安装返回 Promise，则等待完成
    if (result instanceof Promise) {
      result
        .then(() => {
          this.plugins.set(pluginName, plugin)
        })
        .catch((error) => {
          console.error(`Failed to install plugin "${pluginName}":`, error)
        })
    } else {
      this.plugins.set(pluginName, plugin)
    }

    return plugin
  }

  /**
   * 获取插件实例
   * @param name 插件名称
   * @returns 插件实例
   */
  getPlugin<T extends ViewerPlugin>(name: string): T | undefined {
    return this.plugins.get(name) as T | undefined
  }

  /**
   * 销毁 Viewer 及所有插件
   */
  destroy(): void {
    if (this._destroyed) return

    // 销毁所有插件
    for (const [name, plugin] of this.plugins) {
      if (plugin.destroy) {
        try {
          const result = plugin.destroy()
          if (result instanceof Promise) {
            result.catch((error) => {
              console.error(`Failed to destroy plugin "${name}":`, error)
            })
          }
        } catch (error) {
          console.error(`Failed to destroy plugin "${name}":`, error)
        }
      }
    }

    this.plugins.clear()

    // 调用原始 viewer 的 destroy
    if (!this.viewer.isDestroyed()) {
      this.viewer.destroy()
    }

    this._destroyed = true
  }

  /**
   * 检查是否已销毁
   */
  get destroyed(): boolean {
    return this._destroyed
  }

  /**
   * 获取原始 Cesium Viewer 实例
   */
  get cesiumViewer(): CesiumViewer {
    return this.viewer
  }
}
