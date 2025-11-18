/**
 * React 渲染器
 * 支持 React 组件渲染
 */

import type { TooltipRenderer, TooltipReactNode, TooltipVNode, TooltipContent } from '../types'

/**
 * React Root 接口 (React 18+)
 */
interface ReactRoot {
  render: (element: unknown) => void
  unmount: () => void
}

/**
 * React createElement 函数类型
 */
type CreateElementFn = (component: unknown, props?: Record<string, unknown> | null) => unknown

/**
 * ReactDOM createRoot 函数类型 (React 18+)
 */
type CreateRootFn = (container: HTMLElement) => ReactRoot

/**
 * ReactDOM render 函数类型 (React 17-)
 */
type RenderFn = (element: unknown, container: HTMLElement) => void

export class ReactRenderer implements TooltipRenderer {
  private _root: ReactRoot | null = null
  private _createRoot: CreateRootFn | null = null
  private _legacyRender: RenderFn | null = null
  private _createElement: CreateElementFn | null = null
  private _container: HTMLElement | null = null

  /**
   * 设置 React 和 ReactDOM
   * @param React React 对象
   * @param ReactDOM ReactDOM 对象
   */
  setReact(
    React: { createElement: unknown },
    ReactDOM: { createRoot?: unknown; render?: unknown }
  ): void {
    this._createElement = React.createElement as CreateElementFn
    this._createRoot = (ReactDOM.createRoot ? ReactDOM.createRoot as CreateRootFn : null)
    this._legacyRender = (ReactDOM.render ? ReactDOM.render as RenderFn : null)
  }

  /**
   * 渲染内容
   */
  render(container: HTMLElement, content: TooltipContent): void {
    if (typeof content === 'string') {
      container.innerHTML = content
      return
    }

    if (content.type !== 'react') {
      console.warn('ReactRenderer: content type is not react')
      return
    }

    if (!this._createElement) {
      console.error('ReactRenderer: React is not set. Call setReact() first.')
      return
    }

    try {
      const node = content as TooltipReactNode
      const element = this._createElement(node.component, node.props || null)

      this._container = container

      // React 18+ (使用 createRoot)
      if (this._createRoot) {
        if (!this._root) {
          this._root = this._createRoot(container)
        }
        this._root.render(element)
      }
      // React 17 及以下 (使用 render)
      else if (this._legacyRender) {
        this._legacyRender(element, container)
      } else {
        throw new Error('ReactDOM.createRoot or ReactDOM.render not found')
      }
    } catch (error) {
      console.error('ReactRenderer: Failed to render React component', error)
      container.innerHTML = 'Error rendering component'
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    if (this._root) {
      try {
        this._root.unmount()
      } catch (error) {
        console.error('ReactRenderer: Failed to unmount root', error)
      }
      this._root = null
    }
    this._container = null
  }
}
