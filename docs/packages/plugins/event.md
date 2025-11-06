# EventPlugin

事件处理插件，简化 Cesium 的事件监听，提供统一的事件处理接口。

## 导入

```typescript
import { EventPlugin } from '@ktd-cesium/plugins'
```

## 安装

```typescript
import { KtdViewer } from '@ktd-cesium/core'
import { EventPlugin } from '@ktd-cesium/plugins'

const viewer = new KtdViewer(cesiumViewer)
const events = viewer.use(EventPlugin)
```

## 基本用法

### 监听点击事件

```typescript
events.on('click', (event) => {
  console.log('Clicked at:', event.position)
})
```

### 监听鼠标移动

```typescript
events.on('mousemove', (event) => {
  console.log('Mouse position:', event.position)
})
```

### 移除事件监听

```typescript
const handler = (event) => {
  console.log('Clicked')
}

events.on('click', handler)

// 移除监听
events.off('click', handler)
```

## 使用场景

### 场景 1：点击获取坐标

```typescript
import { cartesianToDegrees, formatCoordinate } from '@ktd-cesium/shared'

events.on('click', (event) => {
  const cartesian = viewer.camera.pickEllipsoid(
    event.position,
    viewer.scene.globe.ellipsoid
  )

  if (cartesian) {
    const { longitude, latitude } = cartesianToDegrees(cartesian)
    const formatted = formatCoordinate(longitude, latitude)

    alert(`点击位置：${formatted}`)
  }
})
```

### 场景 2：点击实体显示信息

```typescript
events.on('click', (event) => {
  const pickedObject = viewer.scene.pick(event.position)

  if (Cesium.defined(pickedObject) && pickedObject.id) {
    const entity = pickedObject.id

    console.log('Clicked entity:', entity.name)
  }
})
```

### 场景 3：在 Vue 中使用

```vue
<template>
  <div>
    <div ref="containerRef" class="map-container"></div>
    <div v-if="clickInfo" class="info-panel">
      <h3>点击信息</h3>
      <p>{{ clickInfo }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { KtdViewer } from '@ktd-cesium/core'
import { EventPlugin } from '@ktd-cesium/plugins'
import { cartesianToDegrees, formatCoordinate } from '@ktd-cesium/shared'
import * as Cesium from 'cesium'

const containerRef = ref<HTMLElement>()
const clickInfo = ref('')

let viewer: KtdViewer
let events: EventPlugin

onMounted(() => {
  if (containerRef.value) {
    const cesiumViewer = new Cesium.Viewer(containerRef.value)
    viewer = new KtdViewer(cesiumViewer)
    events = viewer.use(EventPlugin)

    events.on('click', handleClick)
  }
})

onBeforeUnmount(() => {
  events?.off('click', handleClick)
  viewer?.destroy()
})

function handleClick(event: any) {
  const cartesian = viewer.camera.pickEllipsoid(
    event.position,
    viewer.scene.globe.ellipsoid
  )

  if (cartesian) {
    const { longitude, latitude } = cartesianToDegrees(cartesian)
    clickInfo.value = formatCoordinate(longitude, latitude)
  }
}
</script>
```

## 支持的事件

- `click` - 鼠标点击
- `dblclick` - 鼠标双击
- `mousemove` - 鼠标移动
- `mousedown` - 鼠标按下
- `mouseup` - 鼠标松开
- `rightclick` - 右键点击

## 注意事项

1. 及时移除不需要的事件监听器
2. 避免在事件处理函数中执行耗时操作
3. 考虑事件节流/防抖优化性能
