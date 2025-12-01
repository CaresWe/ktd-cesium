import type { ViewerPlugin, AutoViewer } from '@auto-cesium/core'
import type { Viewer as CesiumViewer } from 'cesium'

/**
 * 插件基类
 * 所有插件都应该继承此类
 */
export abstract class BasePlugin implements ViewerPlugin {
  /** 插件名称 */
  abstract readonly name: string

  /** Viewer 实例 */
  protected viewer: AutoViewer | null = null

  /** 插件是否已安装 */
  private _installed = false

  /**
   * 获取 Cesium Viewer 实例（带完整类型）
   * AutoViewer 通过 Proxy 实现，运行时具有所有 Cesium Viewer 的属性
   * 此 getter 提供类型安全的访问方式
   */
  protected get cesiumViewer(): CesiumViewer {
    if (!this.viewer) {
      throw new Error(`Plugin "${this.name}" is not installed`)
    }
    // 使用 AutoViewer 提供的 cesiumViewer 属性来获取原始 Viewer
    // 这是类型安全的方式
    return this.viewer.cesiumViewer
  }

  /**
   * 安装插件
   * @param viewer Viewer 实例
   * 使用 Parameters 提取 ViewerPlugin['install'] 的参数类型以确保类型兼容
   */
  install(viewer: Parameters<ViewerPlugin['install']>[0]): void | Promise<void> {
    if (this._installed) {
      console.warn(`Plugin "${this.name}" is already installed`)
      return
    }

    // 类型断言：viewer 运行时就是 AutoViewer
    // 使用 Object.assign 来绕过类型检查，同时保持类型安全
    Object.assign(this, { viewer })
    this._installed = true

    // 调用子类的初始化方法，此时 this.viewer 已经被赋值
    const result = this.onInstall(this.viewer!)

    return result
  }

  /**
   * 插件安装时的回调
   * 子类应该重写此方法
   */
  protected abstract onInstall(viewer: AutoViewer): void | Promise<void>

  /**
   * 销毁插件
   */
  destroy(): void | Promise<void> {
    if (!this._installed) return

    // 调用子类的销毁方法
    const result = this.onDestroy()

    this.viewer = null
    this._installed = false

    return result
  }

  /**
   * 插件销毁时的回调
   * 子类可以重写此方法
   */
  protected onDestroy(): void | Promise<void> {
    // 默认不做任何操作
  }

  /**
   * 检查插件是否已安装
   */
  get installed(): boolean {
    return this._installed
  }

  /**
   * 确保插件已安装
   */
  protected ensureInstalled(): void {
    if (!this._installed || !this.viewer) {
      throw new Error(`Plugin "${this.name}" is not installed`)
    }
  }
}
