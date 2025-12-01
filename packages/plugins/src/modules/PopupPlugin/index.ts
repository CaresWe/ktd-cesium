import { Cartesian3, SceneTransforms } from 'cesium'
import { BasePlugin } from '../../BasePlugin'
import type { KtdViewer } from '@ktd-cesium/core'
import type {
  PopupOptions,
  PopupInstance,
  PopupContent,
  PopupType,
  PopupAlignment,
  VueComponentConfig,
  ReactComponentConfig,
  ScreenPopupOptions,
  WorldPopupOptions
} from './types'

/**
 * 弹窗管理插件
 * 支持 HTML、Vue 组件、React 组件三种弹窗类型
 * 支持屏幕固定位置和世界坐标跟随两种定位方式
 */
export class PopupPlugin extends BasePlugin {
  static readonly pluginName = 'popup'
  readonly name = 'popup'

  /** 弹窗集合 */
  private popups: Map<string, PopupInstance> = new Map()

  /** 弹窗ID计数器 */
  private popupIdCounter = 0

  /** 弹窗容器元素 */
  private containerElement: HTMLElement | null = null

  /** 渲染更新监听器移除函数 */
  private removeRenderListener?: () => void

  protected onInstall(viewer: KtdViewer): void {
    try {
      // 创建弹窗容器
      this.containerElement = document.createElement('div')
      this.containerElement.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1000;
      `
      // 使用 cesiumViewer 属性访问原始 Cesium Viewer
      viewer.cesiumViewer.container.appendChild(this.containerElement)

      // 监听场景渲染，更新世界坐标弹窗位置
      this.removeRenderListener = viewer.cesiumViewer.scene.postRender.addEventListener(() => {
        this.updateWorldPopups()
      })
    } catch (error) {
      console.error('Failed to install popup plugin:', error)
      throw error
    }
  }

  /**
   * 生成唯一的弹窗ID
   */
  private generatePopupId(): string {
    return `popup_${this.popupIdCounter++}`
  }

  /**
   * 创建弹窗容器
   */
  private createPopupContainer(id: string, options: PopupOptions): HTMLElement {
    const container = document.createElement('div')
    container.id = id
    container.style.cssText = `
      position: absolute;
      pointer-events: auto;
      ${options.show !== false ? '' : 'display: none;'}
    `

    // 添加自定义类名
    if (options.className) {
      container.className = options.className
    }

    // 应用对齐方式
    this.applyAlignment(container, options.alignment)

    return container
  }

  /**
   * 应用对齐方式
   */
  private applyAlignment(container: HTMLElement, alignment?: PopupAlignment): void {
    if (!alignment) return

    const alignmentStyles: Record<string, string> = {
      'top-left': 'transform-origin: top left;',
      'top-center': 'transform-origin: top center; transform: translateX(-50%);',
      'top-right': 'transform-origin: top right; transform: translateX(-100%);',
      'middle-left': 'transform-origin: center left; transform: translateY(-50%);',
      center: 'transform-origin: center; transform: translate(-50%, -50%);',
      'middle-right': 'transform-origin: center right; transform: translate(-100%, -50%);',
      'bottom-left': 'transform-origin: bottom left; transform: translateY(-100%);',
      'bottom-center': 'transform-origin: bottom center; transform: translate(-50%, -100%);',
      'bottom-right': 'transform-origin: bottom right; transform: translate(-100%, -100%);'
    }

    const style = alignmentStyles[alignment]
    if (style) {
      container.style.cssText += style
    }
  }

  /**
   * 渲染HTML内容
   */
  private renderHTML(container: HTMLElement, content: string | HTMLElement): void {
    try {
      if (typeof content === 'string') {
        container.innerHTML = content
      } else {
        container.innerHTML = ''
        container.appendChild(content)
      }
    } catch (error) {
      console.error('Failed to render HTML content:', error)
      throw error
    }
  }

  /**
   * 渲染Vue组件
   */
  private async renderVue(container: HTMLElement, config: VueComponentConfig): Promise<unknown> {
    try {
      // 动态导入 Vue
      // @ts-expect-error - Vue is an optional peer dependency
      const { createApp, h } = await import('vue')

      // 创建 Vue 应用
      const app = createApp({
        render() {
          return h(config.component, config.props || {})
        }
      })

      // 挂载到容器
      app.mount(container)

      return app
    } catch (error) {
      console.error('Failed to render Vue component:', error)
      console.error('Make sure Vue is installed: pnpm add vue')
      throw error
    }
  }

  /**
   * 渲染React组件
   */
  private async renderReact(container: HTMLElement, config: ReactComponentConfig): Promise<unknown> {
    try {
      // 动态导入 React 和 ReactDOM
      // @ts-expect-error - React is an optional peer dependency
      const React = await import('react')
      // @ts-expect-error - React DOM is an optional peer dependency
      const ReactDOM = await import('react-dom/client')

      // 创建 React 元素
      const element = React.createElement(config.component, config.props || {})

      // 使用 React 18+ 的 createRoot API
      const root = ReactDOM.createRoot(container)
      root.render(element)

      return root
    } catch (error) {
      console.error('Failed to render React component:', error)
      console.error('Make sure React is installed: pnpm add react react-dom')
      throw error
    }
  }

  /**
   * 渲染弹窗内容
   */
  private async renderContent(
    container: HTMLElement,
    content: PopupContent,
    type: PopupType
  ): Promise<{ vueApp?: unknown; reactRoot?: unknown }> {
    try {
      const result: { vueApp?: unknown; reactRoot?: unknown } = {}

      switch (type) {
        case 'html':
          this.renderHTML(container, content as string | HTMLElement)
          break

        case 'vue':
          result.vueApp = await this.renderVue(container, content as VueComponentConfig)
          break

        case 'react':
          result.reactRoot = await this.renderReact(container, content as ReactComponentConfig)
          break

        default:
          throw new Error(`Unsupported popup type: ${type}`)
      }

      return result
    } catch (error) {
      console.error('Failed to render popup content:', error)
      throw error
    }
  }

  /**
   * 计算屏幕位置
   */
  private calculateScreenPosition(
    position: [number, number],
    offset?: [number, number]
  ): { left: string; top: string } {
    const [x, y] = position
    const [offsetX = 0, offsetY = 0] = offset || []

    return {
      left: `${x + offsetX}px`,
      top: `${y + offsetY}px`
    }
  }

  /**
   * 计算世界坐标对应的屏幕位置
   */
  private calculateWorldPosition(
    position: Cartesian3 | [number, number, number?],
    offset?: [number, number]
  ): { left: string; top: string } | null {
    try {
      this.ensureInstalled()

      // 转换为 Cartesian3
      let cartesian: Cartesian3
      if (Array.isArray(position)) {
        const [lon, lat, height = 0] = position
        cartesian = Cartesian3.fromDegrees(lon, lat, height)
      } else {
        cartesian = position
      }

      // 转换为屏幕坐标
      const screenPosition = SceneTransforms.worldToWindowCoordinates(this.cesiumViewer.scene, cartesian)

      if (!screenPosition) {
        return null
      }

      const [offsetX = 0, offsetY = 0] = offset || []

      return {
        left: `${screenPosition.x + offsetX}px`,
        top: `${screenPosition.y + offsetY}px`
      }
    } catch (error) {
      console.error('Failed to calculate world position:', error)
      return null
    }
  }

  /**
   * 更新弹窗位置
   */
  private updatePopupPosition(popup: PopupInstance): void {
    const { options, container } = popup

    let position: { left: string; top: string } | null = null

    if (options.positionType === 'screen') {
      position = this.calculateScreenPosition((options as ScreenPopupOptions).position, options.offset)
    } else if (options.positionType === 'world') {
      position = this.calculateWorldPosition((options as WorldPopupOptions).position, options.offset)
    }

    if (position) {
      container.style.left = position.left
      container.style.top = position.top
      container.style.display = options.show !== false ? 'block' : 'none'
    } else {
      // 如果位置无效（例如在地球背面），隐藏弹窗
      container.style.display = 'none'
    }
  }

  /**
   * 更新所有世界坐标弹窗的位置
   */
  private updateWorldPopups(): void {
    try {
      for (const popup of this.popups.values()) {
        if (popup.options.positionType === 'world' && (popup.options as WorldPopupOptions).autoUpdate !== false) {
          this.updatePopupPosition(popup)
        }
      }
    } catch (error) {
      console.error('Failed to update world popups:', error)
    }
  }

  /**
   * 设置拖拽功能
   */
  private setupDraggable(container: HTMLElement, _popup: PopupInstance): void {
    try {
      let isDragging = false
      let startX = 0
      let startY = 0
      let offsetX = 0
      let offsetY = 0

      const onMouseDown = (e: MouseEvent) => {
        try {
          isDragging = true
          startX = e.clientX
          startY = e.clientY

          const rect = container.getBoundingClientRect()
          offsetX = rect.left
          offsetY = rect.top

          document.addEventListener('mousemove', onMouseMove)
          document.addEventListener('mouseup', onMouseUp)
          e.preventDefault()
        } catch (error) {
          console.error('Failed to handle mouse down:', error)
        }
      }

      const onMouseMove = (e: MouseEvent) => {
        try {
          if (!isDragging) return

          const dx = e.clientX - startX
          const dy = e.clientY - startY

          container.style.left = `${offsetX + dx}px`
          container.style.top = `${offsetY + dy}px`
        } catch (error) {
          console.error('Failed to handle mouse move:', error)
        }
      }

      const onMouseUp = () => {
        try {
          isDragging = false
          document.removeEventListener('mousemove', onMouseMove)
          document.removeEventListener('mouseup', onMouseUp)
        } catch (error) {
          console.error('Failed to handle mouse up:', error)
        }
      }

      container.addEventListener('mousedown', onMouseDown)

      // 保存清理函数
      interface ContainerWithCleanup extends HTMLElement {
        _removeDraggable?: () => void
      }
      ;(container as ContainerWithCleanup)._removeDraggable = () => {
        try {
          container.removeEventListener('mousedown', onMouseDown)
          document.removeEventListener('mousemove', onMouseMove)
          document.removeEventListener('mouseup', onMouseUp)
        } catch (error) {
          console.error('Failed to remove draggable listeners:', error)
        }
      }
    } catch (error) {
      console.error('Failed to setup draggable:', error)
    }
  }

  /**
   * 设置点击外部关闭功能
   */
  private setupCloseOnClickOutside(container: HTMLElement, popup: PopupInstance): void {
    try {
      const onClickOutside = (e: MouseEvent) => {
        try {
          if (!container.contains(e.target as Node)) {
            this.remove(popup.id)
          }
        } catch (error) {
          console.error('Failed to handle click outside:', error)
        }
      }

      // 延迟添加监听器，避免立即触发
      setTimeout(() => {
        try {
          document.addEventListener('click', onClickOutside)
        } catch (error) {
          console.error('Failed to add click outside listener:', error)
        }
      }, 100)

      // 保存清理函数
      interface ContainerWithClickOutside extends HTMLElement {
        _removeClickOutside?: () => void
      }
      ;(container as ContainerWithClickOutside)._removeClickOutside = () => {
        try {
          document.removeEventListener('click', onClickOutside)
        } catch (error) {
          console.error('Failed to remove click outside listener:', error)
        }
      }
    } catch (error) {
      console.error('Failed to setup close on click outside:', error)
    }
  }

  /**
   * 创建弹窗
   * @param options 弹窗选项
   * @returns 弹窗ID
   */
  async create(options: PopupOptions): Promise<string> {
    try {
      this.ensureInstalled()

      const id = this.generatePopupId()
      const container = this.createPopupContainer(id, options)

      // 渲染内容
      const { vueApp, reactRoot } = await this.renderContent(container, options.content, options.type)

      // 添加到容器
      this.containerElement!.appendChild(container)

      // 创建弹窗实例
      const popup: PopupInstance = {
        id,
        container,
        options,
        vueApp,
        reactRoot,
        show: () => {
          try {
            popup.options.show = true
            container.style.display = 'block'
          } catch (error) {
            console.error('Failed to show popup:', error)
          }
        },
        hide: () => {
          try {
            popup.options.show = false
            container.style.display = 'none'
          } catch (error) {
            console.error('Failed to hide popup:', error)
          }
        },
        updatePosition: (position) => {
          try {
            if (popup.options.positionType === 'screen') {
              ;(popup.options as ScreenPopupOptions).position = position as [number, number]
            } else {
              ;(popup.options as WorldPopupOptions).position = position as Cartesian3 | [number, number, number?]
            }
            this.updatePopupPosition(popup)
          } catch (error) {
            console.error('Failed to update popup position:', error)
          }
        },
        updateContent: async (content) => {
          try {
            // 清理旧内容
            if (popup.vueApp) {
              popup.vueApp.unmount()
              popup.vueApp = undefined
            }
            if (popup.reactRoot) {
              popup.reactRoot.unmount()
              popup.reactRoot = undefined
            }

            popup.options.content = content

            // 渲染新内容
            const result = await this.renderContent(container, content, popup.options.type)
            popup.vueApp = result.vueApp
            popup.reactRoot = result.reactRoot
          } catch (error) {
            console.error('Failed to update popup content:', error)
            throw error
          }
        },
        destroy: () => {
          try {
            this.remove(id)
          } catch (error) {
            console.error('Failed to destroy popup:', error)
          }
        }
      }

      // 设置拖拽
      if (options.draggable) {
        this.setupDraggable(container, popup)
      }

      // 设置点击外部关闭
      if (options.closeOnClickOutside) {
        this.setupCloseOnClickOutside(container, popup)
      }

      // 更新位置
      this.updatePopupPosition(popup)

      // 保存弹窗
      this.popups.set(id, popup)

      return id
    } catch (error) {
      console.error('Failed to create popup:', error)
      throw error
    }
  }

  /**
   * 创建HTML弹窗
   */
  async createHTML(
    content: string | HTMLElement,
    position: [number, number] | Cartesian3 | [number, number, number?],
    options?: Partial<PopupOptions>
  ): Promise<string> {
    const positionType = Array.isArray(position) && position.length === 2 ? 'screen' : 'world'

    return this.create({
      content,
      type: 'html',
      positionType,
      position,
      ...options
    } as PopupOptions)
  }

  /**
   * 创建Vue组件弹窗
   */
  async createVue(
    config: VueComponentConfig,
    position: [number, number] | Cartesian3 | [number, number, number?],
    options?: Partial<PopupOptions>
  ): Promise<string> {
    const positionType = Array.isArray(position) && position.length === 2 ? 'screen' : 'world'

    return this.create({
      content: config,
      type: 'vue',
      positionType,
      position,
      ...options
    } as PopupOptions)
  }

  /**
   * 创建React组件弹窗
   */
  async createReact(
    config: ReactComponentConfig,
    position: [number, number] | Cartesian3 | [number, number, number?],
    options?: Partial<PopupOptions>
  ): Promise<string> {
    const positionType = Array.isArray(position) && position.length === 2 ? 'screen' : 'world'

    return this.create({
      content: config,
      type: 'react',
      positionType,
      position,
      ...options
    } as PopupOptions)
  }

  /**
   * 获取弹窗实例
   */
  get(id: string): PopupInstance | undefined {
    return this.popups.get(id)
  }

  /**
   * 移除弹窗
   */
  remove(id: string): boolean {
    try {
      const popup = this.popups.get(id)
      if (!popup) {
        return false
      }

      // 清理Vue应用
      if (popup.vueApp) {
        try {
          popup.vueApp.unmount()
        } catch (error) {
          console.error('Failed to unmount Vue app:', error)
        }
      }

      // 清理React根节点
      if (popup.reactRoot) {
        try {
          popup.reactRoot.unmount()
        } catch (error) {
          console.error('Failed to unmount React root:', error)
        }
      }

      // 清理拖拽监听器
      interface ContainerWithCleanup extends HTMLElement {
        _removeDraggable?: () => void
      }
      if ((popup.container as ContainerWithCleanup)._removeDraggable) {
        try {
          ;(popup.container as ContainerWithCleanup)._removeDraggable()
        } catch (error) {
          console.error('Failed to remove draggable listeners:', error)
        }
      }

      // 清理点击外部监听器
      interface ContainerWithClickOutside extends HTMLElement {
        _removeClickOutside?: () => void
      }
      if ((popup.container as ContainerWithClickOutside)._removeClickOutside) {
        try {
          ;(popup.container as ContainerWithClickOutside)._removeClickOutside()
        } catch (error) {
          console.error('Failed to remove click outside listener:', error)
        }
      }

      // 移除DOM元素
      if (popup.container.parentElement) {
        try {
          popup.container.parentElement.removeChild(popup.container)
        } catch (error) {
          console.error('Failed to remove container element:', error)
        }
      }

      // 调用关闭回调
      if (popup.options.onClose) {
        try {
          popup.options.onClose()
        } catch (error) {
          console.error('Failed to execute onClose callback:', error)
        }
      }

      this.popups.delete(id)
      return true
    } catch (error) {
      console.error('Failed to remove popup:', error)
      return false
    }
  }

  /**
   * 显示弹窗
   */
  show(id: string): void {
    const popup = this.popups.get(id)
    if (popup) {
      popup.show()
    }
  }

  /**
   * 隐藏弹窗
   */
  hide(id: string): void {
    const popup = this.popups.get(id)
    if (popup) {
      popup.hide()
    }
  }

  /**
   * 更新弹窗位置
   */
  updatePosition(id: string, position: [number, number] | Cartesian3 | [number, number, number?]): void {
    const popup = this.popups.get(id)
    if (popup) {
      popup.updatePosition(position)
    }
  }

  /**
   * 更新弹窗内容
   */
  async updateContent(id: string, content: PopupContent): Promise<void> {
    try {
      const popup = this.popups.get(id)
      if (popup) {
        await popup.updateContent(content)
      }
    } catch (error) {
      console.error('Failed to update popup content:', error)
      throw error
    }
  }

  /**
   * 移除所有弹窗
   */
  removeAll(): void {
    try {
      const ids = Array.from(this.popups.keys())
      ids.forEach((id) => this.remove(id))
    } catch (error) {
      console.error('Failed to remove all popups:', error)
    }
  }

  /**
   * 获取所有弹窗ID
   */
  getAllIds(): string[] {
    return Array.from(this.popups.keys())
  }

  /**
   * 获取弹窗数量
   */
  getCount(): number {
    return this.popups.size
  }

  protected onDestroy(): void {
    try {
      // 移除所有弹窗
      this.removeAll()

      // 移除渲染监听器
      if (this.removeRenderListener) {
        try {
          this.removeRenderListener()
        } catch (error) {
          console.error('Failed to remove render listener:', error)
        }
      }

      // 移除容器元素
      if (this.containerElement && this.containerElement.parentElement) {
        try {
          this.containerElement.parentElement.removeChild(this.containerElement)
        } catch (error) {
          console.error('Failed to remove container element:', error)
        }
      }
    } catch (error) {
      console.error('Failed to destroy popup plugin:', error)
    }
  }
}

// 导出类型
export * from './types'
