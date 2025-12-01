# 快速开始

本指南将帮助你快速上手 KTD-Cesium。

## 安装

使用 pnpm 安装（推荐）：

```bash
pnpm add @auto-cesium/core @auto-cesium/shared @auto-cesium/plugins cesium
```

使用 npm：

```bash
npm install @auto-cesium/core @auto-cesium/shared @auto-cesium/plugins cesium
```

使用 yarn：

```bash
yarn add @auto-cesium/core @auto-cesium/shared @auto-cesium/plugins cesium
```

## 基础使用

### 创建地图

```typescript
import { AutoViewer } from '@auto-cesium/core'
import * as Cesium from 'cesium'

// 先创建 Cesium Viewer
const cesiumViewer = new Cesium.Viewer('cesiumContainer', {
  terrain: Cesium.Terrain.fromWorldTerrain()
})

// 创建 AutoViewer 实例（包装 Cesium Viewer）
const viewer = new AutoViewer(cesiumViewer)

// AutoViewer 完全兼容 Cesium.Viewer 的所有 API
viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(116.4, 39.9, 10000)
})
```

### 使用工具函数

```typescript
import { degreesToCartesian, formatDistance } from '@auto-cesium/shared'

// 经纬度转笛卡尔坐标
const cartesian = degreesToCartesian(116.4, 39.9, 0)

// 格式化距离
const distance = formatDistance(1500) // "1.50 km"
```

### 使用插件

```typescript
import { AutoViewer } from '@auto-cesium/core'
import { BaseLayerPlugin, CameraPlugin } from '@auto-cesium/plugins'
import * as Cesium from 'cesium'

// 创建 Cesium Viewer
const cesiumViewer = new Cesium.Viewer('cesiumContainer')

// 创建 AutoViewer
const viewer = new AutoViewer(cesiumViewer)

// 使用插件（推荐方式）
const baseLayer = viewer.use(BaseLayerPlugin)
const camera = viewer.use(CameraPlugin)

// 使用插件功能
baseLayer.addLayer({
  type: 'tianditu',
  layer: 'img_w'
})

camera.flyTo({
  destination: [116.4, 39.9, 10000],
  duration: 2
})
```

## 完整示例

这里是一个完整的示例，展示如何创建一个带有基础图层和相机控制的 3D 地图：

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>KTD-Cesium 示例</title>
    <style>
      #cesiumContainer {
        width: 100vw;
        height: 100vh;
      }
    </style>
  </head>
  <body>
    <div id="cesiumContainer"></div>

    <script type="module">
      import { AutoViewer } from '@auto-cesium/core'
      import { BaseLayerPlugin, CameraPlugin } from '@auto-cesium/plugins'
      import * as Cesium from 'cesium'

      // 创建 Cesium Viewer
      const cesiumViewer = new Cesium.Viewer('cesiumContainer')

      // 创建 AutoViewer
      const viewer = new AutoViewer(cesiumViewer)

      // 使用插件
      const baseLayer = viewer.use(BaseLayerPlugin)
      const camera = viewer.use(CameraPlugin)

      // 添加底图
      baseLayer.addLayer({
        type: 'tianditu',
        layer: 'img_w'
      })

      // 飞到北京
      camera.flyTo({
        destination: [116.4, 39.9, 100000],
        duration: 2
      })
    </script>
  </body>
</html>
```

## 在框架中使用

### Vue 3

```vue
<template>
  <div ref="containerRef" class="cesium-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { AutoViewer } from '@auto-cesium/core'
import { BaseLayerPlugin } from '@auto-cesium/plugins'
import * as Cesium from 'cesium'

const containerRef = ref<HTMLElement>()
let viewer: AutoViewer | null = null

onMounted(() => {
  if (containerRef.value) {
    // 创建 Cesium Viewer
    const cesiumViewer = new Cesium.Viewer(containerRef.value)

    // 创建 AutoViewer
    viewer = new AutoViewer(cesiumViewer)

    // 使用插件
    viewer.use(BaseLayerPlugin)
  }
})

onBeforeUnmount(() => {
  // 清理资源
  if (viewer) {
    viewer.destroy()
  }
})
</script>

<style scoped>
.cesium-container {
  width: 100%;
  height: 100vh;
}
</style>
```

### React

```tsx
import { useEffect, useRef } from 'react'
import { AutoViewer } from '@auto-cesium/core'
import { BaseLayerPlugin } from '@auto-cesium/plugins'
import * as Cesium from 'cesium'

function App() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      // 创建 Cesium Viewer
      const cesiumViewer = new Cesium.Viewer(containerRef.current)

      // 创建 AutoViewer
      const viewer = new AutoViewer(cesiumViewer)

      // 使用插件
      viewer.use(BaseLayerPlugin)

      return () => {
        // 清理资源
        viewer.destroy()
      }
    }
  }, [])

  return <div ref={containerRef} style={{ width: '100vw', height: '100vh' }} />
}

export default App
```

## 更多示例

### 绘制图形

```typescript
import { GraphicsPlugin } from '@auto-cesium/plugins'

const graphics = viewer.use(GraphicsPlugin)

// 绘制点
graphics.startDraw({
  type: 'point',
  attr: { name: '标记点' }
})

// 绘制多边形
graphics.startDraw({
  type: 'polygon',
  style: {
    fillColor: '#3388ff',
    fillOpacity: 0.5
  }
})
```

### 量算分析

```typescript
import { AnalysisPlugin } from '@auto-cesium/plugins'

const analysis = viewer.use(AnalysisPlugin)

// 开始距离测量
analysis.startMeasure({
  type: 'distance',
  onComplete: (result) => {
    console.log('距离:', result.value, '米')
  }
})
```

### 使用工具函数

```typescript
import { degreesToCartesian, formatDistance, hexToColor } from '@auto-cesium/shared'

// 坐标转换
const cartesian = degreesToCartesian(116.4, 39.9, 0)

// 格式化距离
const formatted = formatDistance(1500) // "1.50 km"

// 颜色转换
const color = hexToColor('#ff0000', 0.8)
```

## 下一步

- 了解 [Shared 包](/packages/shared/overview) 提供的工具函数
- 探索 [Core 包](/packages/core/overview) 的核心功能
- 使用 [Plugins 包](/packages/plugins/overview) 扩展功能
- 查看 [安装指南](/guide/installation) 了解详细配置
