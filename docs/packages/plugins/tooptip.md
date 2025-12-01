# TooltipPlugin

提示框插件，支持 **HTML、Vue 组件、React 组件**三种内容类型，提供灵活的定位和样式配置，适用于绘制、编辑等场景的交互提示。

## 导入

```typescript
import { TooltipCore, createTooltip, VueRenderer, ReactRenderer, defaultMessages } from '@ktd-cesium/plugins'
import type {
  TooltipOptions,
  TooltipPosition,
  TooltipContent,
  TooltipVNode,
  TooltipReactNode
} from '@ktd-cesium/plugins'
```

## 核心特性

- **三种内容类型**：HTML 字符串、Vue 3 组件、React 组件
- **四种定位方式**：left、right、top、bottom
- **自定义渲染器**：支持 Vue/React 组件渲染
- **灵活配置**：箭头位置、偏移距离、鼠标悬停隐藏等
- **默认消息**：内置绘制、编辑等场景的提示消息

## 安装

TooltipPlugin 是一个工具类，不需要通过 `viewer.use()` 安装，直接创建实例即可使用。

```typescript
import { createTooltip } from '@ktd-cesium/plugins'

const tooltip = createTooltip({
  container: document.getElementById('cesiumContainer')!,
  placement: 'right',
  offset: 30
})
```

## 基础使用

### HTML 内容

```typescript
import { createTooltip } from '@ktd-cesium/plugins'

const tooltip = createTooltip({
  container: viewer.cesiumViewer.container as HTMLElement
})

// 显示 HTML 内容
tooltip.showAt({ x: 100, y: 200 }, '<div style="padding: 10px;">提示内容</div>')

// 隐藏
tooltip.hide()

// 设置可见性
tooltip.setVisible(false)
```

### 配置选项

```typescript
const tooltip = createTooltip({
  container: viewer.cesiumViewer.container as HTMLElement,
  classPrefix: 'ktd-tooltip', // CSS 类名前缀
  placement: 'right', // 'left' | 'right' | 'top' | 'bottom'
  offset: 30, // 偏移距离（像素）
  hideOnHover: true // 鼠标移入时是否隐藏
})
```

## Vue 组件支持

### 基础配置

```typescript
import { createTooltip, VueRenderer } from '@ktd-cesium/plugins'
import { createApp, h } from 'vue'
import MyTooltipComponent from './MyTooltipComponent.vue'

// 创建 Vue 渲染器
const vueRenderer = new VueRenderer()
vueRenderer.setVue({ createApp, h })

// 创建 Tooltip 实例
const tooltip = createTooltip({
  container: viewer.cesiumViewer.container as HTMLElement,
  customRenderer: vueRenderer
})

// 显示 Vue 组件
tooltip.showAt(
  { x: 100, y: 200 },
  {
    type: 'vue',
    component: MyTooltipComponent,
    props: {
      message: 'Hello from Vue',
      data: { value: 100 }
    }
  }
)
```

### Vue 组件示例

```vue
<!-- MyTooltipComponent.vue -->
<template>
  <div class="tooltip-content">
    <h4>{{ title }}</h4>
    <p>{{ message }}</p>
    <div v-if="data">
      <span>值: {{ data.value }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  message?: string
  data?: { value: number }
}

defineProps<Props>()
</script>

<style scoped>
.tooltip-content {
  padding: 10px;
  min-width: 200px;
}
</style>
```

## React 组件支持

### 基础配置

```typescript
import { createTooltip, ReactRenderer } from '@ktd-cesium/plugins'
import React from 'react'
import ReactDOM from 'react-dom/client'
import MyTooltipComponent from './MyTooltipComponent'

// 创建 React 渲染器
const reactRenderer = new ReactRenderer()
reactRenderer.setReact(React, ReactDOM)

// 创建 Tooltip 实例
const tooltip = createTooltip({
  container: viewer.cesiumViewer.container as HTMLElement,
  customRenderer: reactRenderer
})

// 显示 React 组件
tooltip.showAt(
  { x: 100, y: 200 },
  {
    type: 'react',
    component: MyTooltipComponent,
    props: {
      message: 'Hello from React',
      data: { value: 100 }
    }
  }
)
```

### React 组件示例

```tsx
// MyTooltipComponent.tsx
import React from 'react'

interface Props {
  title?: string
  message?: string
  data?: { value: number }
}

export default function MyTooltipComponent({ title, message, data }: Props) {
  return (
    <div style={{ padding: '10px', minWidth: '200px' }}>
      {title && <h4>{title}</h4>}
      {message && <p>{message}</p>}
      {data && <div>值: {data.value}</div>}
    </div>
  )
}
```

## API 概览

### createTooltip(options)

创建 Tooltip 实例的便捷函数。

```typescript
const tooltip = createTooltip({
  container: HTMLElement,
  classPrefix?: string,
  placement?: 'left' | 'right' | 'top' | 'bottom',
  offset?: number,
  hideOnHover?: boolean,
  customRenderer?: TooltipRenderer
})
```

### TooltipCore 类方法

#### show()

显示 Tooltip。

```typescript
tooltip.show()
```

#### hide()

隐藏 Tooltip。

```typescript
tooltip.hide()
```

#### setVisible(visible)

设置可见性。

```typescript
tooltip.setVisible(true) // 显示
tooltip.setVisible(false) // 隐藏
```

#### showAt(position, content?)

在指定位置显示内容。

```typescript
tooltip.showAt({ x: 100, y: 200 }, '<div>提示内容</div>')

// Vue 组件
tooltip.showAt(
  { x: 100, y: 200 },
  {
    type: 'vue',
    component: MyComponent,
    props: { message: 'Hello' }
  }
)

// React 组件
tooltip.showAt(
  { x: 100, y: 200 },
  {
    type: 'react',
    component: MyComponent,
    props: { message: 'Hello' }
  }
)
```

#### updateOptions(options)

更新配置选项。

```typescript
tooltip.updateOptions({
  placement: 'left',
  offset: 50
})
```

#### getElement()

获取 Tooltip DOM 元素。

```typescript
const element = tooltip.getElement()
element.style.backgroundColor = '#ff0000'
```

#### getContentElement()

获取内容容器元素。

```typescript
const contentElement = tooltip.getContentElement()
contentElement.innerHTML = '<div>新内容</div>'
```

#### destroy()

销毁 Tooltip 实例。

```typescript
tooltip.destroy()
```

## 定位方式

### 四种位置

```typescript
// 右侧（默认）
const tooltip = createTooltip({
  container: container,
  placement: 'right',
  offset: 30
})

// 左侧
const tooltip = createTooltip({
  container: container,
  placement: 'left',
  offset: 30
})

// 顶部
const tooltip = createTooltip({
  container: container,
  placement: 'top',
  offset: 30
})

// 底部
const tooltip = createTooltip({
  container: container,
  placement: 'bottom',
  offset: 30
})
```

### 动态位置计算

```typescript
function showTooltipAtMouse(event: MouseEvent) {
  const position = {
    x: event.clientX,
    y: event.clientY
  }

  // 根据鼠标位置动态选择位置
  const placement = event.clientX > window.innerWidth / 2 ? 'left' : 'right'

  tooltip.updateOptions({ placement })
  tooltip.showAt(position, '提示内容')
}
```

## 自定义渲染器

### 实现自定义渲染器

```typescript
import type { TooltipRenderer, TooltipContent } from '@ktd-cesium/plugins'

class CustomRenderer implements TooltipRenderer {
  render(container: HTMLElement, content: TooltipContent): void {
    if (typeof content === 'string') {
      container.innerHTML = content
    } else {
      // 处理自定义内容类型
      container.innerHTML = this.renderCustomContent(content)
    }
  }

  destroy(): void {
    // 清理资源
  }

  private renderCustomContent(content: any): string {
    // 自定义渲染逻辑
    return '<div>自定义内容</div>'
  }
}

const tooltip = createTooltip({
  container: container,
  customRenderer: new CustomRenderer()
})
```

## 默认消息配置

### 使用默认消息

```typescript
import { defaultMessages } from '@ktd-cesium/plugins'

// 绘制提示
const drawMessage = defaultMessages.draw.polyline.start
// '单击 开始绘制'

const editMessage = defaultMessages.edit.start
// '单击后 激活编辑<br/>右击 单击菜单删除'

const draggerMessage = defaultMessages.dragger.def
// '拖动该点后<br/>修改位置'
```

### 自定义消息

```typescript
import { defaultMessages } from '@ktd-cesium/plugins'

// 修改默认消息
defaultMessages.draw.point.start = '点击地图完成绘制'

// 使用自定义消息
tooltip.showAt(position, defaultMessages.draw.point.start)
```

## 使用场景

### 场景 1：绘制提示

```typescript
import { createTooltip, defaultMessages } from '@ktd-cesium/plugins'

const tooltip = createTooltip({
  container: viewer.cesiumViewer.container as HTMLElement,
  placement: 'right',
  offset: 20
})

// 开始绘制时显示提示
function onDrawStart(drawType: string) {
  const message = defaultMessages.draw[drawType]?.start || '开始绘制'
  tooltip.showAt(mousePosition, message)
}

// 绘制过程中更新提示
function onDrawMove(drawType: string, pointCount: number) {
  if (pointCount === 1) {
    const message = defaultMessages.draw[drawType]?.cont || '继续绘制'
    tooltip.showAt(mousePosition, message)
  }
}

// 绘制结束时隐藏
function onDrawEnd() {
  tooltip.hide()
}
```

### 场景 2：鼠标悬停提示

```typescript
const tooltip = createTooltip({
  container: viewer.cesiumViewer.container as HTMLElement,
  placement: 'top',
  offset: 10,
  hideOnHover: true
})

// 监听鼠标移动
viewer.cesiumViewer.canvas.addEventListener('mousemove', (event) => {
  const pick = viewer.cesiumViewer.scene.pick(new Cesium.Cartesian2(event.clientX, event.clientY))

  if (pick && pick.id) {
    const entity = pick.id
    const position = Cesium.SceneTransforms.wgs84ToWindowCoordinates(
      viewer.cesiumViewer.scene,
      entity.position.getValue(viewer.cesiumViewer.clock.currentTime)
    )

    if (position) {
      tooltip.showAt({ x: position.x, y: position.y }, `<div>${entity.name || '未命名'}</div>`)
    }
  } else {
    tooltip.hide()
  }
})
```

### 场景 3：Vue 组件提示

```typescript
import { createTooltip, VueRenderer } from '@ktd-cesium/plugins'
import { createApp, h } from 'vue'
import TooltipContent from './TooltipContent.vue'

const vueRenderer = new VueRenderer()
vueRenderer.setVue({ createApp, h })

const tooltip = createTooltip({
  container: viewer.cesiumViewer.container as HTMLElement,
  customRenderer: vueRenderer
})

// 显示带数据的 Vue 组件
function showEntityTooltip(entity: Cesium.Entity, position: { x: number; y: number }) {
  tooltip.showAt(position, {
    type: 'vue',
    component: TooltipContent,
    props: {
      title: entity.name,
      data: entity.properties?.getValue(),
      onClose: () => tooltip.hide()
    }
  })
}
```

### 场景 4：React 组件提示

```typescript
import { createTooltip, ReactRenderer } from '@ktd-cesium/plugins'
import React from 'react'
import ReactDOM from 'react-dom/client'
import TooltipContent from './TooltipContent'

const reactRenderer = new ReactRenderer()
reactRenderer.setReact(React, ReactDOM)

const tooltip = createTooltip({
  container: viewer.cesiumViewer.container as HTMLElement,
  customRenderer: reactRenderer
})

// 显示带数据的 React 组件
function showEntityTooltip(entity: Cesium.Entity, position: { x: number; y: number }) {
  tooltip.showAt(position, {
    type: 'react',
    component: TooltipContent,
    props: {
      title: entity.name,
      data: entity.properties?.getValue(),
      onClose: () => tooltip.hide()
    }
  })
}
```

### 场景 5：动态内容更新

```typescript
const tooltip = createTooltip({
  container: viewer.cesiumViewer.container as HTMLElement
})

let updateInterval: number | null = null

function startDynamicTooltip(position: { x: number; y: number }) {
  let count = 0

  updateInterval = window.setInterval(() => {
    count++
    tooltip.showAt(
      position,
      `
      <div>
        <h4>动态内容</h4>
        <p>计数: ${count}</p>
        <p>时间: ${new Date().toLocaleTimeString()}</p>
      </div>
    `
    )
  }, 1000)
}

function stopDynamicTooltip() {
  if (updateInterval) {
    clearInterval(updateInterval)
    updateInterval = null
  }
  tooltip.hide()
}
```

### 场景 6：多 Tooltip 管理

```typescript
class TooltipManager {
  private tooltips: Map<string, TooltipCore> = new Map()

  createTooltip(id: string, options: TooltipOptions): TooltipCore {
    const tooltip = createTooltip(options)
    this.tooltips.set(id, tooltip)
    return tooltip
  }

  getTooltip(id: string): TooltipCore | undefined {
    return this.tooltips.get(id)
  }

  hideAll(): void {
    this.tooltips.forEach((tooltip) => tooltip.hide())
  }

  destroyAll(): void {
    this.tooltips.forEach((tooltip) => tooltip.destroy())
    this.tooltips.clear()
  }

  removeTooltip(id: string): void {
    const tooltip = this.tooltips.get(id)
    if (tooltip) {
      tooltip.destroy()
      this.tooltips.delete(id)
    }
  }
}

// 使用示例
const manager = new TooltipManager()

const drawTooltip = manager.createTooltip('draw', {
  container: viewer.cesiumViewer.container as HTMLElement,
  placement: 'right'
})

const editTooltip = manager.createTooltip('edit', {
  container: viewer.cesiumViewer.container as HTMLElement,
  placement: 'top'
})

// 隐藏所有
manager.hideAll()
```

### 场景 7：样式自定义

```typescript
const tooltip = createTooltip({
  container: viewer.cesiumViewer.container as HTMLElement,
  classPrefix: 'custom-tooltip'
})

// 通过 CSS 自定义样式
const style = document.createElement('style')
style.textContent = `
  .custom-tooltip-inner {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 8px;
    padding: 12px 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
  
  .custom-tooltip-arrow {
    border-color: #667eea transparent transparent transparent;
  }
`
document.head.appendChild(style)
```

### 场景 8：与 GraphicsPlugin 集成

```typescript
import { GraphicsPlugin } from '@ktd-cesium/plugins'
import { createTooltip, defaultMessages } from '@ktd-cesium/plugins'

const graphics = viewer.use(GraphicsPlugin)
const tooltip = createTooltip({
  container: viewer.cesiumViewer.container as HTMLElement
})

// 监听绘制事件
graphics.on('draw-start', ({ drawtype }) => {
  const message = defaultMessages.draw[drawtype]?.start
  if (message) {
    // 获取鼠标位置并显示提示
    // 注意：需要从事件中获取位置信息
  }
})

graphics.on('draw-mouse-move', ({ position }) => {
  if (position) {
    const screenPos = Cesium.SceneTransforms.worldToWindowCoordinates(viewer.cesiumViewer.scene, position)
    if (screenPos) {
      tooltip.showAt({ x: screenPos.x, y: screenPos.y }, defaultMessages.draw.polyline.cont)
    }
  }
})

graphics.on('draw-created', () => {
  tooltip.hide()
})
```

## 注意事项

1. **容器元素**：必须提供有效的容器元素（通常是 Cesium Viewer 的容器）。

2. **Vue/React 支持**：
   - Vue 需要提供 `createApp` 和 `h` 函数
   - React 需要提供 `React.createElement` 和 `ReactDOM.createRoot`（React 18+）或 `ReactDOM.render`（React 17-）

3. **位置计算**：
   - `showAt` 使用屏幕坐标（像素）
   - 如需世界坐标，需先转换为屏幕坐标

4. **性能优化**：
   - 频繁更新时注意清理定时器
   - 使用 `hide()` 而不是频繁创建/销毁实例

5. **样式覆盖**：
   - 通过 `classPrefix` 自定义 CSS 类名
   - 使用 `getElement()` 或 `getContentElement()` 直接操作 DOM

6. **内存管理**：
   - 组件销毁时调用 `destroy()` 清理资源
   - Vue/React 渲染器会自动卸载组件

7. **默认消息**：
   - `defaultMessages` 包含绘制、编辑等场景的提示
   - 可根据需要修改或扩展

TooltipPlugin 提供了灵活的提示框功能，支持多种内容类型和定位方式，可以很好地集成到各种交互场景中。
