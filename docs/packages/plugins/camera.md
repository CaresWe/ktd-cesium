# CameraPlugin

相机控制插件，提供简化的相机操作 API，包括飞行、定位、视角控制等功能。

## 核心特性

- **飞行动画**：平滑的相机飞行到指定位置
- **视角控制**：设置相机位置、方向、观察点
- **位置查询**：获取当前相机位置信息
- **实体缩放**：自动缩放到指定实体

## 导入与安装

```typescript
import { KtdViewer } from '@ktd-cesium/core'
import { CameraPlugin } from '@ktd-cesium/plugins'

const viewer = new KtdViewer(cesiumViewer)
const camera = viewer.use(CameraPlugin)
```

## 基本用法

### 飞行到指定位置

```typescript
// 飞行到经纬度位置（带高度）
await camera.flyTo(116.4074, 39.9042, 10000, 3)
// 参数：经度, 纬度, 高度(米), 动画时长(秒，默认3秒)

// 飞行到北京天安门
await camera.flyTo(116.3974, 39.9093, 5000, 2)

// 飞行到上海外滩
await camera.flyTo(121.4879, 31.2396, 8000, 2.5)
```

### 直接设置视角（无动画）

```typescript
// 直接设置相机位置，无动画
camera.setView(116.4074, 39.9042, 10000)
// 参数：经度, 纬度, 高度(米)

// 快速切换到目标位置
camera.setView(121.4737, 31.2304, 15000)
```

### 环绕指定点查看

```typescript
// 环绕指定点查看（类似 lookAt）
camera.lookAt(
  116.4074,  // 经度
  39.9042,  // 纬度
  0,        // 高度（米）
  0,        // 航向角（度，0-360）
  -45,      // 俯仰角（度，-90到90，负值向下看）
  10000     // 距离（米）
)

// 从侧面观察建筑物
camera.lookAt(116.3974, 39.9093, 0, 90, -30, 5000)

// 从上方俯视
camera.lookAt(116.3974, 39.9093, 0, 0, -90, 2000)
```

### 获取当前相机位置

```typescript
const position = camera.getCurrentPosition()
if (position) {
  console.log('经度:', position.longitude)
  console.log('纬度:', position.latitude)
  console.log('高度:', position.height)
  
  // 保存当前视图状态
  saveViewState(position)
}
```

### 缩放到实体

```typescript
// 缩放到指定实体（Entity）
const entity = viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(116.4074, 39.9042),
  point: { pixelSize: 10, color: Cesium.Color.RED }
})

camera.zoomToEntity(entity)

// 缩放到数据源
const dataSource = await Cesium.CzmlDataSource.load('path/to/data.czml')
viewer.dataSources.add(dataSource)
camera.zoomToEntity(dataSource.entities.values[0])
```

## API 详解

### flyTo(longitude, latitude, height?, duration?)

飞行到指定位置。

| 参数 | 类型 | 说明 | 默认值 |
| --- | --- | --- | --- |
| `longitude` | `number` | 经度（度） | 必填 |
| `latitude` | `number` | 纬度（度） | 必填 |
| `height` | `number` | 高度（米） | `10000` |
| `duration` | `number` | 动画时长（秒） | `3` |

**返回值**：`Promise<void>`，飞行完成后 resolve。

**示例**：
```typescript
// 飞行到北京，高度 10000 米，耗时 3 秒
await camera.flyTo(116.4074, 39.9042, 10000, 3)

// 快速飞行到上海，高度 5000 米，耗时 1 秒
await camera.flyTo(121.4737, 31.2304, 5000, 1)
```

### setView(longitude, latitude, height?)

直接设置相机位置，无动画。

| 参数 | 类型 | 说明 | 默认值 |
| --- | --- | --- | --- |
| `longitude` | `number` | 经度（度） | 必填 |
| `latitude` | `number` | 纬度（度） | 必填 |
| `height` | `number` | 高度（米） | `10000` |

**示例**：
```typescript
// 立即切换到目标位置
camera.setView(116.4074, 39.9042, 15000)
```

### lookAt(longitude, latitude, height?, heading?, pitch?, range?)

环绕指定点查看。

| 参数 | 类型 | 说明 | 默认值 |
| --- | --- | --- | --- |
| `longitude` | `number` | 经度（度） | 必填 |
| `latitude` | `number` | 纬度（度） | 必填 |
| `height` | `number` | 目标点高度（米） | `0` |
| `heading` | `number` | 航向角（度，0-360） | `0` |
| `pitch` | `number` | 俯仰角（度，-90到90） | `-45` |
| `range` | `number` | 距离（米） | `10000` |

**示例**：
```typescript
// 从正东方向观察，俯仰角 -30 度，距离 5000 米
camera.lookAt(116.4074, 39.9042, 0, 90, -30, 5000)
```

### getCurrentPosition()

获取当前相机位置。

**返回值**：`{ longitude: number; latitude: number; height: number } | null`

**示例**：
```typescript
const pos = camera.getCurrentPosition()
if (pos) {
  console.log(`当前位置: ${pos.longitude}, ${pos.latitude}, ${pos.height}m`)
}
```

### zoomToEntity(entity)

缩放到指定实体。

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `entity` | `Entity` | Cesium Entity 对象 |

**示例**：
```typescript
const entity = viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(116.4074, 39.9042),
  billboard: { image: 'icon.png' }
})

camera.zoomToEntity(entity)
```

## 使用场景

### 场景 1：地点导航

```typescript
const locations = [
  { name: '北京天安门', lon: 116.3974, lat: 39.9093, height: 5000 },
  { name: '上海外滩', lon: 121.4879, lat: 31.2396, height: 8000 },
  { name: '广州塔', lon: 113.3245, lat: 23.1064, height: 6000 },
  { name: '深圳平安大厦', lon: 114.0556, lat: 22.5431, height: 7000 }
]

let currentIndex = 0

async function nextLocation() {
  const loc = locations[currentIndex]
  
  await camera.flyTo(loc.lon, loc.lat, loc.height, 2)
  console.log(`已到达: ${loc.name}`)
  
  currentIndex = (currentIndex + 1) % locations.length
}

// 每 5 秒切换到下一个位置
setInterval(nextLocation, 5000)
```

### 场景 2：相机动画序列

```typescript
async function animateCamera() {
  const positions = [
    { lon: 116.4, lat: 39.9, height: 10000 },
    { lon: 117.0, lat: 40.0, height: 15000 },
    { lon: 116.5, lat: 39.5, height: 12000 },
    { lon: 116.3, lat: 39.8, height: 8000 }
  ]

  for (const pos of positions) {
    await camera.flyTo(pos.lon, pos.lat, pos.height, 2)
    // 在每个位置停留 1 秒
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

animateCamera()
```

### 场景 3：保存和恢复视图

```typescript
// 保存当前视图
function saveViewState() {
  const position = camera.getCurrentPosition()
  if (position) {
    localStorage.setItem('viewState', JSON.stringify(position))
    console.log('视图已保存')
  }
}

// 恢复视图
function restoreViewState() {
  const saved = localStorage.getItem('viewState')
  if (saved) {
    const position = JSON.parse(saved)
    camera.flyTo(position.longitude, position.latitude, position.height, 2)
    console.log('视图已恢复')
  }
}

// 使用
saveViewState()
// ... 用户操作后
restoreViewState()
```

### 场景 4：环绕建筑物观察

```typescript
async function orbitBuilding(lon: number, lat: number, height: number) {
  const angles = [0, 45, 90, 135, 180, 225, 270, 315]
  
  for (const heading of angles) {
    camera.lookAt(lon, lat, height, heading, -45, 5000)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

// 环绕北京天安门观察
orbitBuilding(116.3974, 39.9093, 0)
```

### 场景 5：根据数据范围自动调整视角

```typescript
function flyToBounds(minLon: number, minLat: number, maxLon: number, maxLat: number) {
  const centerLon = (minLon + maxLon) / 2
  const centerLat = (minLat + maxLat) / 2
  
  // 计算合适的高度（根据范围大小）
  const lonRange = maxLon - minLon
  const latRange = maxLat - minLat
  const maxRange = Math.max(lonRange, latRange)
  const height = maxRange * 111000 * 2 // 转换为米并放大
  
  camera.flyTo(centerLon, centerLat, height, 2)
}

// 飞行到数据范围
flyToBounds(116.0, 39.0, 117.0, 40.0)
```

### 场景 6：在 Vue 中使用

```vue
<template>
  <div>
    <div ref="containerRef" class="map-container"></div>
    <div class="controls">
      <button @click="flyToBeijing">飞到北京</button>
      <button @click="flyToShanghai">飞到上海</button>
      <button @click="goHome">回到初始位置</button>
      <button @click="saveView">保存视图</button>
      <button @click="restoreView">恢复视图</button>
    </div>
    <div v-if="currentPosition" class="info">
      <p>当前位置: {{ currentPosition.longitude.toFixed(4) }}, {{ currentPosition.latitude.toFixed(4) }}</p>
      <p>高度: {{ currentPosition.height.toFixed(0) }}m</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { KtdViewer } from '@ktd-cesium/core'
import { CameraPlugin } from '@ktd-cesium/plugins'
import * as Cesium from 'cesium'

const containerRef = ref<HTMLElement>()
const currentPosition = ref<{ longitude: number; latitude: number; height: number } | null>(null)

let viewer: KtdViewer
let camera: CameraPlugin
let updateTimer: number | null = null

onMounted(() => {
  if (containerRef.value) {
    const cesiumViewer = new Cesium.Viewer(containerRef.value)
    viewer = new KtdViewer(cesiumViewer)
    camera = viewer.use(CameraPlugin)
    
    // 定期更新位置信息
    updateTimer = window.setInterval(() => {
      currentPosition.value = camera.getCurrentPosition()
    }, 1000)
  }
})

onBeforeUnmount(() => {
  if (updateTimer) {
    clearInterval(updateTimer)
  }
  viewer?.destroy()
})

async function flyToBeijing() {
  await camera.flyTo(116.4074, 39.9042, 100000, 2)
}

async function flyToShanghai() {
  await camera.flyTo(121.4737, 31.2304, 100000, 2)
}

function goHome() {
  camera.setView(116.4074, 39.9042, 100000)
}

function saveView() {
  const pos = camera.getCurrentPosition()
  if (pos) {
    localStorage.setItem('viewState', JSON.stringify(pos))
    alert('视图已保存')
  }
}

function restoreView() {
  const saved = localStorage.getItem('viewState')
  if (saved) {
    const pos = JSON.parse(saved)
    camera.flyTo(pos.longitude, pos.latitude, pos.height, 2)
  }
}
</script>
```

### 场景 7：在 React 中使用

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { KtdViewer } from '@ktd-cesium/core'
import { CameraPlugin } from '@ktd-cesium/plugins'
import * as Cesium from 'cesium'

export function CameraControlDemo() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<string>('')
  
  useEffect(() => {
    if (!containerRef.current) return
    
    const cesiumViewer = new Cesium.Viewer(containerRef.current)
    const viewer = new KtdViewer(cesiumViewer)
    const camera = viewer.use(CameraPlugin)
    
    // 定期更新位置
    const timer = setInterval(() => {
      const pos = camera.getCurrentPosition()
      if (pos) {
        setPosition(`${pos.longitude.toFixed(4)}, ${pos.latitude.toFixed(4)}, ${pos.height.toFixed(0)}m`)
      }
    }, 1000)
    
    return () => {
      clearInterval(timer)
      viewer.destroy()
    }
  }, [])
  
  return (
    <div>
      <div ref={containerRef} className="map-container" />
      {position && <div className="info">当前位置: {position}</div>}
    </div>
  )
}
```

## 注意事项

1. **坐标单位**：
   - 经纬度使用**度数**，不是弧度
   - 高度单位是**米**

2. **角度单位**：
   - `lookAt` 中的航向角、俯仰角使用**度数**
   - 航向角范围：0-360 度（0 度为正北，顺时针增加）
   - 俯仰角范围：-90 到 90 度（负值向下看，正值向上看）

3. **飞行动画**：
   - `flyTo` 返回 Promise，可以使用 `await` 等待飞行完成
   - 新的飞行会打断正在进行的飞行动画
   - 飞行时长建议设置在 1-5 秒之间，过长可能影响用户体验

4. **性能考虑**：
   - `getCurrentPosition()` 可以频繁调用，性能开销很小
   - 避免在循环中频繁调用 `flyTo`，可能导致动画卡顿

5. **实体缩放**：
   - `zoomToEntity` 会自动计算实体的边界并调整相机
   - 如果实体不可见或无效，可能不会产生效果