# TooltipPlugin

灵活的 Tooltip 提示框插件，支持 HTML、Vue 和 React 组件。

## 特性

- ✅ 支持纯 HTML 内容
- ✅ 支持 Vue 3 组件
- ✅ 支持 React 组件（React 17+ 和 React 18+）
- ✅ 灵活的定位配置（上下左右）
- ✅ 自定义渲染器支持
- ✅ TypeScript 类型支持
- ✅ 向后兼容旧的 Tooltip API

## 安装

```bash
npm install @ktd-cesium/plugins
```

## 基础用法

### 1. HTML 内容

```typescript
import { createTooltip } from '@ktd-cesium/plugins/TooltipPlugin'

const tooltip = createTooltip({
  container: document.getElementById('cesiumContainer')!,
  placement: 'right',
  offset: 30
})

// 显示提示
tooltip.showAt({ x: 100, y: 200 }, '<div>Hello World</div>')

// 隐藏提示
tooltip.hide()

// 销毁
tooltip.destroy()
```

### 2. Vue 3 组件

```typescript
import { createTooltip, VueRenderer } from '@ktd-cesium/plugins/TooltipPlugin'
import { createApp, h } from 'vue'
import MyTooltipComponent from './MyTooltipComponent.vue'

// 创建 Vue 渲染器
const vueRenderer = new VueRenderer()
vueRenderer.setVue({ createApp, h })

// 创建 Tooltip
const tooltip = createTooltip({
  container: document.getElementById('cesiumContainer')!,
  customRenderer: vueRenderer
})

// 显示 Vue 组件
tooltip.showAt({ x: 100, y: 200 }, {
  type: 'vue',
  component: MyTooltipComponent,
  props: {
    message: 'Hello from Vue!',
    count: 42
  }
})
```

**MyTooltipComponent.vue**

```vue
<template>
  <div class="my-tooltip">
    <h3>{{ message }}</h3>
    <p>Count: {{ count }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string
  count: number
}>()
</script>

<style scoped>
.my-tooltip {
  padding: 12px;
}
</style>
```

### 3. React 组件

```typescript
import { createTooltip, ReactRenderer } from '@ktd-cesium/plugins/TooltipPlugin'
import React from 'react'
import ReactDOM from 'react-dom/client'
import MyTooltipComponent from './MyTooltipComponent'

// 创建 React 渲染器
const reactRenderer = new ReactRenderer()
reactRenderer.setReact(React, ReactDOM)

// 创建 Tooltip
const tooltip = createTooltip({
  container: document.getElementById('cesiumContainer')!,
  customRenderer: reactRenderer
})

// 显示 React 组件
tooltip.showAt({ x: 100, y: 200 }, {
  type: 'react',
  component: MyTooltipComponent,
  props: {
    message: 'Hello from React!',
    count: 42
  }
})
```

**MyTooltipComponent.tsx**

```tsx
interface Props {
  message: string
  count: number
}

export default function MyTooltipComponent({ message, count }: Props) {
  return (
    <div className="my-tooltip">
      <h3>{message}</h3>
      <p>Count: {count}</p>
    </div>
  )
}
```

## API

### TooltipCore

主要的 Tooltip 类。

#### 构造函数选项

```typescript
interface TooltipOptions {
  /** 容器元素 */
  container: HTMLElement
  /** CSS 类名前缀（默认: 'ktd-tooltip'） */
  classPrefix?: string
  /** 箭头位置（默认: 'right'） */
  placement?: 'left' | 'right' | 'top' | 'bottom'
  /** 偏移距离（默认: 30） */
  offset?: number
  /** 是否在鼠标移入时隐藏（默认: true） */
  hideOnHover?: boolean
  /** 自定义渲染器 */
  customRenderer?: TooltipRenderer
}
```

#### 方法

- `show()` - 显示 Tooltip
- `hide()` - 隐藏 Tooltip
- `setVisible(visible: boolean)` - 设置可见性
- `showAt(position: TooltipPosition | null, content?: TooltipContent)` - 在指定位置显示内容
- `updateOptions(options: Partial<TooltipOptions>)` - 更新配置
- `destroy()` - 销毁 Tooltip
- `getElement()` - 获取 DOM 元素
- `getContentElement()` - 获取内容容器元素

### VueRenderer

Vue 组件渲染器。

#### 方法

- `setVue(vue: { createApp, h })` - 设置 Vue 实例
- `render(container, content)` - 渲染内容
- `destroy()` - 销毁

### ReactRenderer

React 组件渲染器。

#### 方法

- `setReact(React, ReactDOM)` - 设置 React 和 ReactDOM
- `render(container, content)` - 渲染内容
- `destroy()` - 销毁

### 默认消息

```typescript
import { defaultMessages } from '@ktd-cesium/plugins/TooltipPlugin'

console.log(defaultMessages.draw.point.start) // '单击 完成绘制'
console.log(defaultMessages.edit.start) // '单击后 激活编辑<br/>右击 单击菜单删除'
```

## 自定义样式

Tooltip 使用 CSS 类名进行样式控制。默认类名前缀是 `ktd-tooltip`。

```css
/* 自定义样式 */
.ktd-tooltip {
  /* Tooltip 容器 */
}

.ktd-tooltip-inner {
  /* 内容区域 */
  background-color: rgba(0, 0, 0, 0.9);
  border-radius: 8px;
  padding: 12px 16px;
}

.ktd-tooltip-arrow {
  /* 箭头 */
}
```

或者使用自定义类名前缀：

```typescript
const tooltip = createTooltip({
  container: document.getElementById('cesiumContainer')!,
  classPrefix: 'my-custom-tooltip'
})
```

## 迁移指南

### 从旧的 Tooltip 类迁移

旧代码：

```typescript
import { Tooltip } from '@ktd-cesium/plugins/GraphicsPlugin/core/Tooltip'

const tooltip = new Tooltip(container)
tooltip.showAt({ x: 100, y: 200 }, 'Hello')
```

新代码：

```typescript
import { createTooltip } from '@ktd-cesium/plugins/TooltipPlugin'

const tooltip = createTooltip({ container })
tooltip.showAt({ x: 100, y: 200 }, 'Hello')
```

旧的 `Tooltip` 类仍然可用，但已标记为 `@deprecated`，建议迁移到新的 API。

## License

MIT
