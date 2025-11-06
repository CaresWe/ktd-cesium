# CameraPlugin

相机控制插件，提供简化的相机操作 API，包括飞行、定位、视角控制等功能。

## 导入

```typescript
import { CameraPlugin } from '@ktd-cesium/plugins'
```

## 安装

```typescript
import { KtdViewer } from '@ktd-cesium/core'
import { CameraPlugin } from '@ktd-cesium/plugins'

const viewer = new KtdViewer(cesiumViewer)
const camera = viewer.use(CameraPlugin)
```

## 基本用法

### 飞到指定位置

```typescript
// 飞到经纬度位置
camera.flyTo({
  destination: [116.4, 39.9, 10000],  // [经度, 纬度, 高度]
  duration: 2  // 飞行时间（秒）
})

// 飞到笛卡尔坐标位置
import * as Cesium from 'cesium'

camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(116.4, 39.9, 10000),
  duration: 3
})
```

### 设置视角

```typescript
// 设置相机位置和方向
camera.setView({
  destination: [116.4, 39.9, 10000],
  heading: 0,    // 航向角（度）
  pitch: -90,    // 俯仰角（度）
  roll: 0        // 翻滚角（度）
})
```

### 回到初始位置

```typescript
camera.flyHome()
```

## API

所有方法的详细文档（以实际实现为准）。

## 使用场景

### 场景 1：地点导航

```typescript
const locations = [
  { name: '北京', lon: 116.4074, lat: 39.9042, height: 10000 },
  { name: '上海', lon: 121.4737, lat: 31.2304, height: 10000 },
  { name: '广州', lon: 113.2644, lat: 23.1291, height: 10000 },
]

let currentIndex = 0

function nextLocation() {
  const loc = locations[currentIndex]

  camera.flyTo({
    destination: [loc.lon, loc.lat, loc.height],
    duration: 2
  })

  currentIndex = (currentIndex + 1) % locations.length
}

// 每5秒切换到下一个位置
setInterval(nextLocation, 5000)
```

### 场景 2：相机动画

```typescript
function animateCamera() {
  const positions = [
    [116.4, 39.9, 10000],
    [117.0, 40.0, 15000],
    [116.5, 39.5, 12000],
  ]

  let index = 0

  function flyToNext() {
    const pos = positions[index]

    camera.flyTo({
      destination: pos,
      duration: 2,
      complete: () => {
        index = (index + 1) % positions.length
        setTimeout(flyToNext, 1000)
      }
    })
  }

  flyToNext()
}
```

### 场景 3：在 Vue 中使用

```vue
<template>
  <div>
    <div ref="containerRef" class="map-container"></div>
    <div class="controls">
      <button @click="flyToBeijing">飞到北京</button>
      <button @click="flyToShanghai">飞到上海</button>
      <button @click="goHome">回到初始位置</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { KtdViewer } from '@ktd-cesium/core'
import { CameraPlugin } from '@ktd-cesium/plugins'
import * as Cesium from 'cesium'

const containerRef = ref<HTMLElement>()
let viewer: KtdViewer
let camera: CameraPlugin

onMounted(() => {
  if (containerRef.value) {
    const cesiumViewer = new Cesium.Viewer(containerRef.value)
    viewer = new KtdViewer(cesiumViewer)
    camera = viewer.use(CameraPlugin)
  }
})

onBeforeUnmount(() => {
  viewer?.destroy()
})

function flyToBeijing() {
  camera.flyTo({
    destination: [116.4074, 39.9042, 100000],
    duration: 2
  })
}

function flyToShanghai() {
  camera.flyTo({
    destination: [121.4737, 31.2304, 100000],
    duration: 2
  })
}

function goHome() {
  camera.flyHome()
}
</script>
```

## 注意事项

1. 经纬度使用度数，不是弧度
2. 高度单位是米
3. 航向角、俯仰角、翻滚角使用度数
4. 飞行动画可能被新的飞行打断
