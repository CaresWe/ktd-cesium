# PopupPlugin

弹窗管理插件，支持 **HTML、Vue 组件、React 组件**三种内容类型，支持**屏幕坐标**和**世界坐标**两种定位方式，提供丰富的交互功能。

## 导入

```typescript
import { PopupPlugin } from '@auto-cesium/plugins'
import { PopupAlignment } from '@auto-cesium/plugins'
```

## 安装

```typescript
import { AutoViewer } from '@auto-cesium/core'
import { PopupPlugin } from '@auto-cesium/plugins'

const viewer = new AutoViewer(cesiumViewer)
const popup = viewer.use(PopupPlugin)
```

## 核心特性

- **三种内容类型**：HTML 字符串/元素、Vue 3 组件、React 组件
- **两种定位方式**：固定屏幕位置、跟随世界坐标
- **九种对齐方式**：支持上下左右中心等九种对齐
- **交互功能**：可拖拽、点击外部关闭
- **自动更新**：世界坐标弹窗自动跟随相机移动

## API

### create(options)

创建弹窗（通用方法）。

```typescript
const popupId = await popup.create({
  type: 'html', // 'html' | 'vue' | 'react'
  content: '<div>内容</div>', // 弹窗内容
  positionType: 'world', // 'screen' | 'world'
  position: [116.4, 39.9, 0], // 位置
  alignment: PopupAlignment.TOP_CENTER, // 对齐方式
  offset: [0, -30], // 偏移 [x, y]
  show: true, // 是否显示
  className: 'my-popup', // 自定义类名
  draggable: true, // 是否可拖拽
  closeOnClickOutside: true, // 点击外部关闭
  onClose: () => {} // 关闭回调
})
```

### createHTML(content, position, options?)

创建 HTML 弹窗（快捷方法）。

```typescript
const popupId = await popup.createHTML(
  '<h3>标题</h3><p>内容</p>', // HTML 字符串或 HTMLElement
  [116.4, 39.9, 0], // 世界坐标 或 [x, y] 屏幕坐标
  {
    alignment: PopupAlignment.BOTTOM_CENTER,
    offset: [0, 20],
    closeOnClickOutside: true
  }
)
```

### createVue(config, position, options?)

创建 Vue 组件弹窗。

```typescript
import MyPopupComponent from './MyPopupComponent.vue'

const popupId = await popup.createVue(
  {
    component: MyPopupComponent,
    props: {
      title: '北京',
      data: { lon: 116.4, lat: 39.9 }
    }
  },
  [116.4, 39.9, 0]
)
```

### createReact(config, position, options?)

创建 React 组件弹窗。

```typescript
import MyPopupComponent from './MyPopupComponent'

const popupId = await popup.createReact(
  {
    component: MyPopupComponent,
    props: {
      title: '北京',
      data: { lon: 116.4, lat: 39.9 }
    }
  },
  [116.4, 39.9, 0]
)
```

### get(id)

获取弹窗实例。

```typescript
const popupInstance = popup.get(popupId)
if (popupInstance) {
  popupInstance.show()
  popupInstance.hide()
  popupInstance.updatePosition([116.5, 40.0, 0])
  popupInstance.updateContent('<div>新内容</div>')
  popupInstance.destroy()
}
```

### show(id) / hide(id)

显示/隐藏弹窗。

```typescript
popup.show(popupId)
popup.hide(popupId)
```

### remove(id) / removeAll()

移除弹窗。

```typescript
popup.remove(popupId) // 移除指定弹窗
popup.removeAll() // 移除所有弹窗
```

### updatePosition(id, position)

更新弹窗位置。

```typescript
popup.updatePosition(popupId, [116.5, 40.0, 0])
```

### updateContent(id, content)

更新弹窗内容。

```typescript
await popup.updateContent(popupId, '<div>新内容</div>')
```

## 对齐方式

```typescript
import { PopupAlignment } from '@auto-cesium/plugins'

PopupAlignment.TOP_LEFT // 左上角
PopupAlignment.TOP_CENTER // 顶部居中
PopupAlignment.TOP_RIGHT // 右上角
PopupAlignment.MIDDLE_LEFT // 左侧居中
PopupAlignment.CENTER // 正中央
PopupAlignment.MIDDLE_RIGHT // 右侧居中
PopupAlignment.BOTTOM_LEFT // 左下角
PopupAlignment.BOTTOM_CENTER // 底部居中
PopupAlignment.BOTTOM_RIGHT // 右下角
```

## 使用场景

### 场景 1：HTML 弹窗

```typescript
const popupId = await popup.createHTML(
  `
  <div style="padding: 15px; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); min-width: 250px;">
    <h3 style="margin: 0 0 10px 0; color: #333;">北京</h3>
    <table style="width: 100%;">
      <tr><td>经度:</td><td>116.4074°</td></tr>
      <tr><td>纬度:</td><td>39.9042°</td></tr>
      <tr><td>人口:</td><td>2154万</td></tr>
    </table>
    <button onclick="alert('查看详情')">详情</button>
  </div>
  `,
  [116.4074, 39.9042, 0],
  {
    alignment: PopupAlignment.BOTTOM_CENTER,
    offset: [0, 30],
    closeOnClickOutside: true
  }
)
```

### 场景 2：Vue 组件弹窗

```vue
<!-- PopupContent.vue -->
<template>
  <div class="popup-content">
    <h3>{{ title }}</h3>
    <div class="info">
      <p>经度: {{ data.longitude }}</p>
      <p>纬度: {{ data.latitude }}</p>
      <p>高度: {{ data.height }}m</p>
    </div>
    <button @click="handleClose">关闭</button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  data: {
    longitude: number
    latitude: number
    height: number
  }
}>()

const emit = defineEmits(['close'])

function handleClose() {
  emit('close')
}
</script>

<style scoped>
.popup-content {
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 250px;
}
</style>
```

```typescript
import PopupContent from './PopupContent.vue'

const popupId = await popup.createVue(
  {
    component: PopupContent,
    props: {
      title: '位置信息',
      data: {
        longitude: 116.4074,
        latitude: 39.9042,
        height: 100
      }
    }
  },
  [116.4074, 39.9042, 100]
)
```

### 场景 3：React 组件弹窗

```tsx
// PopupContent.tsx
interface PopupContentProps {
  title: string
  data: {
    longitude: number
    latitude: number
    height: number
  }
  onClose?: () => void
}

function PopupContent({ title, data, onClose }: PopupContentProps) {
  return (
    <div
      style={{
        padding: '15px',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        minWidth: '250px'
      }}
    >
      <h3>{title}</h3>
      <div>
        <p>经度: {data.longitude}</p>
        <p>纬度: {data.latitude}</p>
        <p>高度: {data.height}m</p>
      </div>
      <button onClick={onClose}>关闭</button>
    </div>
  )
}

export default PopupContent
```

```typescript
import PopupContent from './PopupContent'

const popupId = await popup.createReact(
  {
    component: PopupContent,
    props: {
      title: '位置信息',
      data: {
        longitude: 116.4074,
        latitude: 39.9042,
        height: 100
      },
      onClose: () => popup.remove(popupId)
    }
  },
  [116.4074, 39.9042, 100]
)
```

### 场景 4：屏幕固定位置弹窗

```typescript
// 在屏幕右上角显示通知
const popupId = await popup.createHTML(
  `
  <div style="padding: 15px; background: #4CAF50; color: white; border-radius: 8px;">
    <h4 style="margin: 0;">提示</h4>
    <p style="margin: 5px 0 0 0;">数据加载成功！</p>
  </div>
  `,
  [window.innerWidth - 250, 50], // 屏幕坐标 [x, y]
  {
    alignment: PopupAlignment.TOP_RIGHT
  }
)

// 3秒后自动关闭
setTimeout(() => popup.remove(popupId), 3000)
```

### 场景 5：可拖拽弹窗

```typescript
const popupId = await popup.createHTML(
  `
  <div style="padding: 15px; background: white; border-radius: 8px; cursor: move;">
    <h3 style="margin: 0; user-select: none;">可拖拽面板</h3>
    <p>拖拽我试试！</p>
  </div>
  `,
  [window.innerWidth / 2, window.innerHeight / 2],
  {
    draggable: true,
    alignment: PopupAlignment.CENTER
  }
)
```

### 场景 6：动态更新弹窗

```typescript
const popupId = await popup.createHTML('<div id="countdown">倒计时: 10</div>', [116.4, 39.9, 0])

let count = 10
const timer = setInterval(() => {
  count--
  popup.updateContent(popupId, `<div id="countdown">倒计时: ${count}</div>`)

  if (count === 0) {
    clearInterval(timer)
    popup.remove(popupId)
  }
}, 1000)
```

### 场景 7：多弹窗管理

```typescript
const popups: string[] = []

// 添加多个弹窗
const positions = [
  [116.4, 39.9, 0],
  [117.0, 40.0, 0],
  [116.5, 39.5, 0]
]

for (const pos of positions) {
  const id = await popup.createHTML(`<div>位置: ${pos[0]}, ${pos[1]}</div>`, pos as [number, number, number])
  popups.push(id)
}

// 批量关闭
function closeAll() {
  popups.forEach((id) => popup.remove(id))
  popups.length = 0
}
```

## 完整示例 - Vue

```vue
<template>
  <div>
    <div ref="containerRef" class="map-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { AutoViewer } from '@auto-cesium/core'
import { EventPlugin, PopupPlugin } from '@auto-cesium/plugins'
import { PopupAlignment } from '@auto-cesium/plugins'
import * as Cesium from 'cesium'
import PopupContent from './PopupContent.vue'

const containerRef = ref<HTMLElement>()
let viewer: AutoViewer
let popup: PopupPlugin

onMounted(() => {
  if (containerRef.value) {
    const cesiumViewer = new Cesium.Viewer(containerRef.value)
    viewer = new AutoViewer(cesiumViewer)

    const events = viewer.use(EventPlugin)
    popup = viewer.use(PopupPlugin)

    // 点击显示 Vue 组件弹窗
    events.onLeftClick(async (info) => {
      if (info.coordinates) {
        await popup.createVue(
          {
            component: PopupContent,
            props: {
              title: '点击位置',
              data: info.coordinates
            }
          },
          [info.coordinates.longitude, info.coordinates.latitude, info.coordinates.height],
          {
            alignment: PopupAlignment.BOTTOM_CENTER,
            offset: [0, 30],
            closeOnClickOutside: true
          }
        )
      }
    })
  }
})

onBeforeUnmount(() => {
  viewer?.destroy()
})
</script>
```

### 场景 8：与 DataLayerPlugin 配合使用

```typescript
import { DataLayerPlugin, PopupPlugin } from '@auto-cesium/plugins'

const dataLayer = viewer.use(DataLayerPlugin)
const popup = viewer.use(PopupPlugin)

// 创建图层时配置弹窗
const layerId = dataLayer.createLayer({
  name: 'poi',
  type: 'entity',
  popup: {
    enabled: true,
    title: (item) => item.data?.name || '兴趣点',
    fields: [
      { field: 'address', label: '地址' },
      { field: 'phone', label: '电话' },
      { field: 'rating', label: '评分', formatter: (v) => `${v} 星` }
    ]
  }
})

// 或者使用自定义 Vue 组件
const layerId2 = dataLayer.createLayer({
  name: 'buildings',
  type: 'entity',
  popup: {
    enabled: true,
    vueComponent: (item) => ({
      component: BuildingPopup,
      props: { building: item.data }
    })
  }
})
```

### 场景 9：响应式弹窗内容

```typescript
// 创建可更新的弹窗
const popupId = await popup.createHTML('<div id="status">等待数据...</div>', [116.4, 39.9, 0])

// 模拟数据加载
async function loadData() {
  popup.updateContent(popupId, '<div id="status">加载中...</div>')

  const data = await fetch('/api/data').then((r) => r.json())

  popup.updateContent(
    popupId,
    `<div>
      <h3>数据详情</h3>
      <p>名称: ${data.name}</p>
      <p>值: ${data.value}</p>
    </div>`
  )
}

loadData()
```

### 场景 10：弹窗实例操作

```typescript
const popupId = await popup.createHTML('<div>内容</div>', [116.4, 39.9, 0])

const instance = popup.get(popupId)
if (instance) {
  // 显示/隐藏
  instance.hide()
  setTimeout(() => instance.show(), 1000)

  // 更新位置
  instance.updatePosition([116.5, 40.0, 0])

  // 更新内容
  await instance.updateContent('<div>新内容</div>')

  // 销毁
  instance.destroy()
}
```

### 场景 11：弹窗生命周期管理

```typescript
// 创建带关闭回调的弹窗
const popupId = await popup.createHTML('<div>重要提示</div>', [116.4, 39.9, 0], {
  closeOnClickOutside: true,
  onClose: () => {
    console.log('弹窗已关闭')
    // 可以执行清理操作
    cleanup()
  }
})

// 手动关闭
popup.remove(popupId) // 会触发 onClose 回调
```

### 场景 12：批量管理弹窗

```typescript
// 获取所有弹窗
const allIds = popup.getAllIds()
console.log(`当前有 ${allIds.length} 个弹窗`)

// 获取弹窗数量
const count = popup.getCount()

// 移除所有弹窗
popup.removeAll()
```

### 场景 13：自定义样式弹窗

```typescript
const popupId = await popup.createHTML('<div class="custom-popup">自定义样式内容</div>', [116.4, 39.9, 0], {
  className: 'my-custom-popup',
  alignment: PopupAlignment.TOP_CENTER,
  offset: [0, -30]
})

// 在 CSS 中定义样式
// .my-custom-popup {
//   background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//   color: white;
//   border-radius: 12px;
//   padding: 20px;
//   box-shadow: 0 8px 16px rgba(0,0,0,0.2);
// }
```

### 场景 14：在 React 中使用（完整示例）

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { AutoViewer } from '@auto-cesium/core'
import { EventPlugin, PopupPlugin, PopupAlignment } from '@auto-cesium/plugins'
import * as Cesium from 'cesium'
import PopupContent from './PopupContent'

export function MapWithPopup() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const cesiumViewer = new Cesium.Viewer(containerRef.current)
    const viewer = new AutoViewer(cesiumViewer)
    const events = viewer.use(EventPlugin)
    const popup = viewer.use(PopupPlugin)

    // 注册 React 渲染器（如果使用 React 组件弹窗）
    popup.registerReactRenderer()

    const clickId = events.onLeftClick(async (info) => {
      if (info.coordinates) {
        await popup.createReact(
          {
            component: PopupContent,
            props: {
              title: '点击位置',
              coordinates: info.coordinates
            }
          },
          [info.coordinates.longitude, info.coordinates.latitude, info.coordinates.height],
          {
            alignment: PopupAlignment.BOTTOM_CENTER,
            offset: [0, 30],
            closeOnClickOutside: true
          }
        )
      }
    })

    return () => {
      events.off(clickId)
      viewer.destroy()
    }
  }, [])

  return <div ref={containerRef} className="map-container" />
}
```

## PopupInstance API

弹窗实例提供以下方法：

| 方法                       | 说明                               |
| -------------------------- | ---------------------------------- |
| `show()`                   | 显示弹窗                           |
| `hide()`                   | 隐藏弹窗                           |
| `updatePosition(position)` | 更新位置（支持世界坐标或屏幕坐标） |
| `updateContent(content)`   | 更新内容（异步方法）               |
| `destroy()`                | 销毁弹窗                           |

## 注意事项

1. **Vue/React 依赖**：
   - Vue 组件弹窗需要安装 `vue`（Vue 3）
   - React 组件弹窗需要安装 `react` 和 `react-dom`（React 18+）
   - 使用 React 组件前需要调用 `popup.registerReactRenderer()`

2. **坐标类型**：
   - **屏幕坐标**：使用两个元素的数组 `[x, y]`（像素）
   - **世界坐标**：使用三个元素 `[lon, lat, height]` 或 `Cartesian3` 对象
   - 插件会根据数组长度自动判断类型（2 个元素 = 屏幕坐标，3 个元素 = 世界坐标）

3. **自动更新**：
   - 世界坐标弹窗默认会跟随相机移动自动更新位置
   - 可以通过 `autoUpdate: false` 禁用自动更新
   - 屏幕坐标弹窗不会自动更新

4. **拖拽功能**：
   - `draggable: true` 启用拖拽，仅适用于屏幕坐标弹窗
   - 拖拽时弹窗会从固定位置变为可移动

5. **点击外部关闭**：
   - `closeOnClickOutside: true` 启用点击外部关闭
   - 点击弹窗外部区域会自动调用 `remove()`

6. **资源清理**：
   - 使用 `remove()` 或 `removeAll()` 清理弹窗，确保 Vue/React 组件正确卸载
   - 不要直接操作 DOM 删除弹窗元素
   - 组件卸载时会自动清理所有弹窗

7. **性能考虑**：
   - 避免创建过多弹窗（建议 < 10 个）
   - 世界坐标弹窗会在每帧更新位置，数量过多可能影响性能
   - 可以使用 `hide()` 暂时隐藏弹窗而不是删除

8. **对齐方式**：
   - 对齐方式基于弹窗的 `transform-origin` 设置
   - `TOP_CENTER` 表示弹窗顶部中心点对齐到目标位置
   - 结合 `offset` 可以精确控制弹窗位置

9. **内容更新**：
   - `updateContent()` 是异步方法，需要 `await`
   - 更新 Vue/React 组件内容时会先卸载旧组件再挂载新组件
   - HTML 内容更新会直接替换 innerHTML
