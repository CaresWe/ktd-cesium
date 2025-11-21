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
 * 绘制提示消息接口（点类型）
 */
export interface DrawPointMessages {
  start: string
}

/**
 * 绘制提示消息接口（多点类型）
 */
export interface DrawMultiPointMessages {
  start: string
  cont: string
  end: string
  end2: string
}

/**
 * 绘制提示消息接口（圆形/矩形等两点类型）
 */
export interface DrawTwoPointMessages {
  start: string
  end: string
}

/**
 * 默认提示消息配置
 */
export interface TooltipMessages {
  draw: {
    point: DrawPointMessages
    polyline: DrawMultiPointMessages
    polygon: DrawMultiPointMessages
    circle: DrawTwoPointMessages
    rectangle: DrawTwoPointMessages
    [key: string]: DrawPointMessages | DrawMultiPointMessages | DrawTwoPointMessages | unknown
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
