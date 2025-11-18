/**
 * Tooltip 插件类型定义
 */

/**
 * 位置信息
 */
export interface TooltipPosition {
  x: number
  y: number
}

/**
 * Tooltip 配置选项
 */
export interface TooltipOptions {
  /** 容器元素 */
  container: HTMLElement
  /** CSS 类名前缀 */
  classPrefix?: string
  /** 箭头位置 ('left' | 'right' | 'top' | 'bottom') */
  placement?: 'left' | 'right' | 'top' | 'bottom'
  /** 偏移距离 */
  offset?: number
  /** 是否在鼠标移入时隐藏 */
  hideOnHover?: boolean
  /** 自定义渲染器 */
  customRenderer?: TooltipRenderer
}

/**
 * 自定义渲染器接口
 */
export interface TooltipRenderer {
  /** 渲染内容 */
  render: (container: HTMLElement, content: string | TooltipVNode | TooltipReactNode) => void
  /** 销毁 */
  destroy?: () => void
}

/**
 * Vue 虚拟节点类型
 */
export interface TooltipVNode {
  type: 'vue'
  component: unknown
  props?: Record<string, unknown>
}

/**
 * React 节点类型
 */
export interface TooltipReactNode {
  type: 'react'
  component: unknown
  props?: Record<string, unknown>
}

/**
 * Tooltip 内容类型
 */
export type TooltipContent = string | TooltipVNode | TooltipReactNode

/**
 * 默认提示消息配置
 */
export interface TooltipMessages {
  draw: {
    point: {
      start: string
    }
    polyline: {
      start: string
      cont: string
      end: string
      end2: string
    }
    [key: string]: unknown
  }
  edit: {
    start: string
    end: string
  }
  dragger: {
    def: string
    moveAll: string
    addMidPoint: string
    moveHeight: string
    editRadius: string
    editHeading: string
    editScale: string
  }
  del: {
    def: string
    min: string
  }
}
