import type { Cartesian3 } from 'cesium'

/**
 * 弹窗类型
 */
export enum PopupType {
  /** HTML 字符串或 DOM 元素 */
  HTML = 'html',
  /** Vue 组件 */
  VUE = 'vue',
  /** React 组件 */
  REACT = 'react'
}

/**
 * 弹窗位置类型
 */
export enum PopupPosition {
  /** 固定屏幕位置 */
  SCREEN = 'screen',
  /** 跟随世界坐标 */
  WORLD = 'world'
}

/**
 * 弹窗对齐方式
 */
export enum PopupAlignment {
  /** 左上角对齐 */
  TOP_LEFT = 'top-left',
  /** 顶部居中 */
  TOP_CENTER = 'top-center',
  /** 右上角对齐 */
  TOP_RIGHT = 'top-right',
  /** 左侧居中 */
  MIDDLE_LEFT = 'middle-left',
  /** 正中央 */
  CENTER = 'center',
  /** 右侧居中 */
  MIDDLE_RIGHT = 'middle-right',
  /** 左下角对齐 */
  BOTTOM_LEFT = 'bottom-left',
  /** 底部居中 */
  BOTTOM_CENTER = 'bottom-center',
  /** 右下角对齐 */
  BOTTOM_RIGHT = 'bottom-right'
}

/**
 * Vue 组件配置
 */
export interface VueComponentConfig {
  /** Vue 组件定义 */
  component: unknown
  /** 传递给组件的 props */
  props?: Record<string, unknown>
  /** 事件监听器 */
  listeners?: Record<string, (...args: unknown[]) => unknown>
}

/**
 * React 组件配置
 */
export interface ReactComponentConfig {
  /** React 组件 */
  component: unknown
  /** 传递给组件的 props */
  props?: Record<string, unknown>
}

/**
 * HTML 内容配置
 */
export type HTMLContent = string | HTMLElement

/**
 * 弹窗内容
 */
export type PopupContent = HTMLContent | VueComponentConfig | ReactComponentConfig

/**
 * 基础弹窗选项
 */
export interface BasePopupOptions {
  /** 弹窗内容 */
  content: PopupContent
  /** 弹窗类型 */
  type: PopupType
  /** 位置类型 */
  positionType?: PopupPosition
  /** 是否显示 */
  show?: boolean
  /** 偏移量 [x, y] (像素) */
  offset?: [number, number]
  /** 对齐方式 */
  alignment?: PopupAlignment
  /** 自定义类名 */
  className?: string
  /** 是否可拖拽 */
  draggable?: boolean
  /** 点击外部是否关闭 */
  closeOnClickOutside?: boolean
  /** 关闭回调 */
  onClose?: () => void
}

/**
 * 屏幕位置弹窗选项
 */
export interface ScreenPopupOptions extends BasePopupOptions {
  positionType: PopupPosition.SCREEN
  /** 屏幕坐标 [x, y] (像素) */
  position: [number, number]
}

/**
 * 世界坐标弹窗选项
 */
export interface WorldPopupOptions extends BasePopupOptions {
  positionType: PopupPosition.WORLD
  /** 世界坐标（Cartesian3）或经纬度 [longitude, latitude, height?] */
  position: Cartesian3 | [number, number, number?]
  /** 是否跟随相机移动自动更新位置 */
  autoUpdate?: boolean
}

/**
 * 弹窗选项（联合类型）
 */
export type PopupOptions = ScreenPopupOptions | WorldPopupOptions

/**
 * 弹窗实例
 */
export interface PopupInstance {
  /** 弹窗 ID */
  id: string
  /** 弹窗容器元素 */
  container: HTMLElement
  /** 弹窗选项 */
  options: PopupOptions
  /** 显示弹窗 */
  show: () => void
  /** 隐藏弹窗 */
  hide: () => void
  /** 更新位置 */
  updatePosition: (position: Cartesian3 | [number, number, number?] | [number, number]) => void
  /** 更新内容 */
  updateContent: (content: PopupContent) => void
  /** 销毁弹窗 */
  destroy: () => void
  /** Vue 应用实例（仅 Vue 组件） */
  vueApp?: unknown
  /** React Root 实例（仅 React 组件） */
  reactRoot?: unknown
}

/**
 * 弹窗事件类型
 */
export enum PopupEventType {
  /** 弹窗打开 */
  OPEN = 'open',
  /** 弹窗关闭 */
  CLOSE = 'close',
  /** 弹窗移动 */
  MOVE = 'move'
}

/**
 * 弹窗事件回调
 */
export type PopupEventCallback = (popup: PopupInstance) => void
