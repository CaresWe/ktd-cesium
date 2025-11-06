# 快速开始

本指南将帮助你快速上手 KTD-Cesium。

## 安装

使用 pnpm 安装（推荐）：

```bash
pnpm add @ktd-cesium/core @ktd-cesium/shared @ktd-cesium/plugins cesium
```

使用 npm：

```bash
npm install @ktd-cesium/core @ktd-cesium/shared @ktd-cesium/plugins cesium
```

使用 yarn：

```bash
yarn add @ktd-cesium/core @ktd-cesium/shared @ktd-cesium/plugins cesium
```

## 基础使用

### 创建地图

```typescript
import { KtdViewer } from '@ktd-cesium/core'

// 创建地图实例
const viewer = new KtdViewer({
  container: 'cesiumContainer',
  // 其他配置...
})
```

### 使用工具函数

```typescript
import { degreesToCartesian, formatDistance } from '@ktd-cesium/shared'

// 经纬度转笛卡尔坐标
const cartesian = degreesToCartesian(116.4, 39.9, 0)

// 格式化距离
const distance = formatDistance(1500) // "1.50 km"
```

### 使用插件

```typescript
import { KtdViewer } from '@ktd-cesium/core'
import { BaseLayerPlugin, CameraPlugin } from '@ktd-cesium/plugins'

// 创建地图实例
const viewer = new KtdViewer({
  container: 'cesiumContainer',
})

// 注册插件
const baseLayerPlugin = new BaseLayerPlugin(viewer)
const cameraPlugin = new CameraPlugin(viewer)

// 使用插件功能
baseLayerPlugin.addLayer({
  // 图层配置...
})

cameraPlugin.flyTo({
  destination: [116.4, 39.9, 10000],
})
```

## 完整示例

这里是一个完整的示例，展示如何创建一个带有基础图层和相机控制的 3D 地图：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
    import { KtdViewer } from '@ktd-cesium/core'
    import { BaseLayerPlugin, CameraPlugin } from '@ktd-cesium/plugins'

    // 创建地图
    const viewer = new KtdViewer({
      container: 'cesiumContainer',
    })

    // 添加基础图层插件
    const baseLayer = new BaseLayerPlugin(viewer)

    // 添加相机插件
    const camera = new CameraPlugin(viewer)

    // 飞到北京
    camera.flyTo({
      destination: [116.4, 39.9, 100000],
      duration: 2,
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
import { ref, onMounted } from 'vue'
import { KtdViewer } from '@ktd-cesium/core'
import { BaseLayerPlugin } from '@ktd-cesium/plugins'

const containerRef = ref<HTMLElement>()
let viewer: KtdViewer

onMounted(() => {
  if (containerRef.value) {
    viewer = new KtdViewer({
      container: containerRef.value,
    })

    new BaseLayerPlugin(viewer)
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
import { KtdViewer } from '@ktd-cesium/core'
import { BaseLayerPlugin } from '@ktd-cesium/plugins'

function App() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      const viewer = new KtdViewer({
        container: containerRef.current,
      })

      new BaseLayerPlugin(viewer)

      return () => {
        viewer.destroy()
      }
    }
  }, [])

  return <div ref={containerRef} style={{ width: '100vw', height: '100vh' }} />
}

export default App
```

## 下一步

- 了解 [Shared 包](/packages/shared/overview) 提供的工具函数
- 探索 [Core 包](/packages/core/overview) 的核心功能
- 使用 [Plugins 包](/packages/plugins/overview) 扩展功能
