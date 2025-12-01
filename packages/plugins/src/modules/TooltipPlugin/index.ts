/**
 * Tooltip 插件
 * 提供灵活的 Tooltip 功能，支持 HTML、Vue 和 React 组件
 */

export { TooltipCore } from './TooltipCore'
export { VueRenderer } from './renderers/VueRenderer'
export { ReactRenderer } from './renderers/ReactRenderer'
export { defaultMessages } from './messages'

export type {
  TooltipPosition,
  TooltipOptions,
  TooltipRenderer,
  TooltipVNode,
  TooltipReactNode,
  TooltipContent,
  TooltipMessages
} from './types'

/**
 * 创建 Tooltip 实例的便捷函数
 */
import { TooltipCore } from './TooltipCore'
import type { TooltipOptions } from './types'

export function createTooltip(options: TooltipOptions): TooltipCore {
  return new TooltipCore(options)
}

/**
 * 使用示例：
 *
 * // 1. HTML 内容
 * const tooltip = createTooltip({
 *   container: document.getElementById('cesiumContainer')
 * })
 * tooltip.showAt({ x: 100, y: 200 }, '<div>Hello World</div>')
 *
 * // 2. Vue 组件
 * import { VueRenderer } from '@auto-cesium/plugins/TooltipPlugin'
 * import { createApp, h } from 'vue'
 * import MyComponent from './MyComponent.vue'
 *
 * const vueRenderer = new VueRenderer()
 * vueRenderer.setVue({ createApp, h })
 *
 * const tooltip = createTooltip({
 *   container: document.getElementById('cesiumContainer'),
 *   customRenderer: vueRenderer
 * })
 *
 * tooltip.showAt({ x: 100, y: 200 }, {
 *   type: 'vue',
 *   component: MyComponent,
 *   props: { message: 'Hello' }
 * })
 *
 * // 3. React 组件
 * import { ReactRenderer } from '@auto-cesium/plugins/TooltipPlugin'
 * import React from 'react'
 * import ReactDOM from 'react-dom/client'
 * import MyComponent from './MyComponent'
 *
 * const reactRenderer = new ReactRenderer()
 * reactRenderer.setReact(React, ReactDOM)
 *
 * const tooltip = createTooltip({
 *   container: document.getElementById('cesiumContainer'),
 *   customRenderer: reactRenderer
 * })
 *
 * tooltip.showAt({ x: 100, y: 200 }, {
 *   type: 'react',
 *   component: MyComponent,
 *   props: { message: 'Hello' }
 * })
 */
