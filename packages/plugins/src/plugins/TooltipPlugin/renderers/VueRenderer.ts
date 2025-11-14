/**
 * Vue 渲染器
 * 支持 Vue 3 组件渲染
 */

import type { TooltipRenderer, TooltipVNode, TooltipReactNode, TooltipContent } from '../types'

/**
 * Vue App 实例接口
 */
interface VueApp {
  mount: (el: HTMLElement) => void
  unmount: () => void
}

/**
 * Vue createApp 函数类型
 */
type CreateAppFn = (component: unknown, props?: Record<string, unknown>) => VueApp

/**
 * Vue h 函数类型
 */
type HFn = (component: unknown, props?: Record<string, unknown>) => unknown

export class VueRenderer implements TooltipRenderer {
  private _app: VueApp | null = null
  private _createApp: CreateAppFn | null = null
  private _h: HFn | null = null

  /**
   * 设置 Vue 实例
   * @param vue Vue 对象 (需要包含 createApp 和 h 方法)
   */
  setVue(vue: { createApp: unknown; h: unknown }): void {
    this._createApp = vue.createApp as CreateAppFn
    this._h = vue.h as HFn
  }

  /**
   * 渲染内容
   */
  render(container: HTMLElement, content: TooltipContent): void {
    // 清理之前的应用
    this.destroy()

    if (typeof content === 'string') {
      container.innerHTML = content
      return
    }

    if (content.type !== 'vue') {
      console.warn('VueRenderer: content type is not vue')
      return
    }

    if (!this._createApp) {
      console.error('VueRenderer: Vue is not set. Call setVue() first.')
      return
    }

    try {
      // 创建 Vue 应用
      const vnode = content as TooltipVNode
      const app = this._createApp(vnode.component, vnode.props)

      // 挂载到容器
      app.mount(container)

      this._app = app
    } catch (error) {
      console.error('VueRenderer: Failed to render Vue component', error)
      container.innerHTML = 'Error rendering component'
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    if (this._app) {
      try {
        this._app.unmount()
      } catch (error) {
        console.error('VueRenderer: Failed to unmount app', error)
      }
      this._app = null
    }
  }
}
