# DataLayerPlugin

数据图层管理插件，用于加载和管理各种数据图层，如 GeoJSON、KML、CZML 等。

## 导入

```typescript
import { DataLayerPlugin } from '@ktd-cesium/plugins'
```

## 安装

```typescript
import { KtdViewer } from '@ktd-cesium/core'
import { DataLayerPlugin } from '@ktd-cesium/plugins'

const viewer = new KtdViewer(cesiumViewer)
const dataLayer = viewer.use(DataLayerPlugin)
```

## 基本用法

### 加载 GeoJSON

```typescript
// 从 URL 加载
const source = await dataLayer.addGeoJSON('https://example.com/data.geojson')

// 从对象加载
const geoJsonData = {
  type: 'FeatureCollection',
  features: [...]
}
const source = await dataLayer.addGeoJSON(geoJsonData)
```

### 加载 KML

```typescript
const source = await dataLayer.addKML('https://example.com/data.kml')
```

### 加载 CZML

```typescript
const source = await dataLayer.addCZML('https://example.com/data.czml')
```

## 使用场景

### 场景 1：显示行政区划

```typescript
// 加载省份边界
const provinces = await dataLayer.addGeoJSON('/data/provinces.geojson', {
  stroke: Cesium.Color.BLUE,
  fill: Cesium.Color.BLUE.withAlpha(0.1),
  strokeWidth: 2
})
```

### 场景 2：显示兴趣点

```typescript
const pois = await dataLayer.addGeoJSON('/data/pois.geojson', {
  markerSymbol: '?',
  markerColor: Cesium.Color.RED
})
```

### 场景 3：在 Vue 中使用

```vue
<template>
  <div>
    <div ref="containerRef" class="map-container"></div>
    <div class="controls">
      <button @click="loadProvinces">加载省份</button>
      <button @click="loadCities">加载城市</button>
      <button @click="clearAll">清除所有</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { KtdViewer } from '@ktd-cesium/core'
import { DataLayerPlugin } from '@ktd-cesium/plugins'
import * as Cesium from 'cesium'

const containerRef = ref<HTMLElement>()
let viewer: KtdViewer
let dataLayer: DataLayerPlugin

onMounted(() => {
  if (containerRef.value) {
    const cesiumViewer = new Cesium.Viewer(containerRef.value)
    viewer = new KtdViewer(cesiumViewer)
    dataLayer = viewer.use(DataLayerPlugin)
  }
})

onBeforeUnmount(() => {
  viewer?.destroy()
})

async function loadProvinces() {
  await dataLayer.addGeoJSON('/data/provinces.geojson')
}

async function loadCities() {
  await dataLayer.addGeoJSON('/data/cities.geojson')
}

function clearAll() {
  dataLayer.clear()
}
</script>
```

## 注意事项

1. 大文件加载可能需要时间
2. 注意数据格式的正确性
3. 考虑数据量对性能的影响
