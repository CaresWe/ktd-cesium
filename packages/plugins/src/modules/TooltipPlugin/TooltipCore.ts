/**
 * Tooltip 核心类
 * 负责 Tooltip 的创建、定位和显示逻辑
 */

import type { TooltipOptions, TooltipPosition, TooltipContent } from './types'

export class TooltipCore {
  private _container: HTMLElement
  private _div: HTMLDivElement
  private _arrow: HTMLDivElement
  private _content: HTMLDivElement
  private _options: Required<TooltipOptions>

  constructor(options: TooltipOptions) {
    this._container = options.container

    // 设置默认选项
    this._options = {
      container: options.container,
      classPrefix: options.classPrefix || 'ktd-tooltip',
      placement: options.placement || 'right',
      offset: options.offset ?? 30,
      hideOnHover: options.hideOnHover ?? true,
      customRenderer: options.customRenderer || {
        render: this._defaultRender.bind(this)
      }
    }

    // 创建 DOM 结构
    this._div = this._createTooltipElement()
    this._arrow = this._createArrowElement()
    this._content = this._createContentElement()

    this._div.appendChild(this._arrow)
    this._div.appendChild(this._content)

    // 添加到容器
    this._container.appendChild(this._div)

    // 绑定事件
    if (this._options.hideOnHover) {
      this._div.addEventListener('mouseover', () => {
        this.hide()
      })
    }
  }

  /**
   * 创建 Tooltip 元素
   */
  private _createTooltipElement(): HTMLDivElement {
    const div = document.createElement('div')
    div.className = `${this._options.classPrefix} ${this._options.placement}`
    div.style.display = 'none'
    div.style.position = 'absolute'
    div.style.zIndex = '9999'
    return div
  }

  /**
   * 创建箭头元素
   */
  private _createArrowElement(): HTMLDivElement {
    const arrow = document.createElement('div')
    arrow.className = `${this._options.classPrefix}-arrow`
    return arrow
  }

  /**
   * 创建内容元素
   */
  private _createContentElement(): HTMLDivElement {
    const content = document.createElement('div')
    content.className = `${this._options.classPrefix}-inner`
    return content
  }

  /**
   * 默认渲染器
   */
  private _defaultRender(container: HTMLElement, content: TooltipContent): void {
    if (typeof content === 'string') {
      container.innerHTML = content
    } else {
      console.warn(
        'TooltipCore: Default renderer only supports string content. Use customRenderer for Vue/React components.'
      )
      container.innerHTML = 'Unsupported content type'
    }
  }

  /**
   * 显示 Tooltip
   */
  show(): void {
    this._div.style.display = 'block'
  }

  /**
   * 隐藏 Tooltip
   */
  hide(): void {
    this._div.style.display = 'none'
  }

  /**
   * 设置可见性
   */
  setVisible(visible: boolean): void {
    if (visible) {
      this.show()
    } else {
      this.hide()
    }
  }

  /**
   * 在指定位置显示内容
   */
  showAt(position: TooltipPosition | null, content?: TooltipContent): void {
    if (!position || !content) {
      this.hide()
      return
    }

    this.show()

    // 渲染内容
    if (typeof content === 'string') {
      this._options.customRenderer.render(this._content, content)
    } else {
      // Vue 或 React 组件
      this._options.customRenderer.render(this._content, content)
    }

    // 计算位置
    this._updatePosition(position)
  }

  /**
   * 更新位置
   */
  private _updatePosition(position: TooltipPosition): void {
    const { placement, offset } = this._options

    // 等待 DOM 更新后计算尺寸
    requestAnimationFrame(() => {
      const width = this._div.offsetWidth
      const height = this._div.offsetHeight

      let top = 0
      let left = 0

      switch (placement) {
        case 'right':
          top = position.y - height / 2
          left = position.x + offset
          break
        case 'left':
          top = position.y - height / 2
          left = position.x - width - offset
          break
        case 'top':
          top = position.y - height - offset
          left = position.x - width / 2
          break
        case 'bottom':
          top = position.y + offset
          left = position.x - width / 2
          break
      }

      this._div.style.top = `${top}px`
      this._div.style.left = `${left}px`
    })
  }

  /**
   * 更新配置
   */
  updateOptions(options: Partial<TooltipOptions>): void {
    Object.assign(this._options, options)

    if (options.placement) {
      this._div.className = `${this._options.classPrefix} ${options.placement}`
    }
  }

  /**
   * 销毁 Tooltip
   */
  destroy(): void {
    if (this._options.customRenderer.destroy) {
      this._options.customRenderer.destroy()
    }

    if (this._div.parentNode) {
      this._div.parentNode.removeChild(this._div)
    }
  }

  /**
   * 获取 DOM 元素
   */
  getElement(): HTMLDivElement {
    return this._div
  }

  /**
   * 获取内容容器
   */
  getContentElement(): HTMLDivElement {
    return this._content
  }
}
