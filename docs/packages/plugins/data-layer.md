# DataLayerPlugin

数据图层管理插件，负责在 Cesium 中统一管理 Entity 与 Primitive 两种渲染方式的数据点位，并与事件、弹窗等插件协同工作。

## 核心特性

- 同时支持 Entity 与 Primitive 图层，按需选择性能或功能
- 完整的数据项生命周期（增删改查、批量更新、飞行定位）
- 内建 Entity 聚合与自定义 Primitive 聚合（像素范围、标签样式可调）
- 与 `EventPlugin`、`PopupPlugin` 解耦集成，支持 Vue、React、HTML 三类弹窗
- 提供 `createDataItemsFromArray`、`importArrayData` 辅助函数，快速把业务数据映射为 DataItem

## 导入与安装

```typescript
import { KtdViewer } from '@ktd-cesium/core'
import { DataLayerPlugin } from '@ktd-cesium/plugins'

const viewer = new KtdViewer(cesiumViewer)
const dataLayer = viewer.use(DataLayerPlugin)
```

> `DataLayerPlugin` 会在安装阶段尝试获取 `EventPlugin` 与 `PopupPlugin`，若已安装则自动接入点击事件与弹窗能力。

## 创建图层

### Entity 图层（支持多种几何体）

```typescript
const layerId = dataLayer.createLayer({
  name: 'administration',
  type: 'entity',
  defaultStyle: {
    polygon: { material: Cesium.Color.BLUE.withAlpha(0.25) },
    label: { text: '行政区', font: '16px sans-serif' }
  },
  clustering: {
    enabled: true,
    pixelRange: 100,
    minimumClusterSize: 5
  },
  popup: {
    enabled: true,
    title: item => item.data?.name ?? '未命名区域',
    fields: [
      { field: 'code', label: '行政区划码' },
      { field: 'population', label: '人口', formatter: value => `${value ?? 0} 人` }
    ]
  },
  onClick: (item) => console.log('clicked', item.id)
})

const layer = dataLayer.getLayer(layerId)!
layer.addItem({
  id: 'bj',
  geometryType: 'polygon',
  positions: beijingPositions,
  data: { name: '北京市', code: '110000', population: 21893095 }
})

await layer.flyTo()
```

### Primitive 图层（极致性能的点要素）

```typescript
const primitiveLayerId = dataLayer.createLayer({
  name: 'poi',
  type: 'primitive',
  defaultStyle: {
    point: { pixelSize: 8, color: Cesium.Color.CYAN }
  },
  clustering: {
    enabled: true,
    minimumClusterSize: 10,
    showLabels: true
  }
})

const primitiveLayer = dataLayer.getLayer(primitiveLayerId)!
primitiveLayer.addItems(poiList.map(poi => ({
  id: poi.id,
  geometryType: 'point',
  position: [poi.lon, poi.lat],
  data: poi
})))
```

## DataLayerConfig（图层配置）

| 字段 | 说明 |
| --- | --- |
| `name: string` | 图层名称，用于人类可读识别 |
| `type: 'entity' | 'primitive'` | 渲染模式：Entity 功能丰富、Primitive 极致性能 |
| `mode?: 'normal' | 'cluster'` | 渲染模式标记（目前主要用于语义说明） |
| `show?: boolean` | 是否默认显示 |
| `clustering?: ClusterConfig` | 聚合配置（Entity 原生、Primitive 内置算法） |
| `defaultStyle?: DataItemStyle` | DataItem 默认样式 |
| `onClick?: (item, event) => void` | 点击回调（依赖 EventPlugin） |
| `showPopup?: boolean` | 简单开关，等价于 `popup.enabled` |
| `popup?: PopupConfig` | 弹窗配置：支持字段驱动、HTML、Vue、React |
| `popupContent?: (item) => string | HTMLElement` | 兼容旧版自定义弹窗（建议改用 `popup.content`） |

## DataItem（数据项描述）

```typescript
interface DataItem {
  id: string | number
  geometryType: 'point' | 'polyline' | 'polygon' | 'model' | 'circle' | 'ellipse' | 'rectangle' | 'corridor' | 'wall' | 'cylinder' | 'box'
  position?: Cartesian3 | [number, number, number?]           // 点、模型、圆心等
  positions?: Cartesian3[] | Array<[number, number, number?]> // 线、面、走廊、墙等
  data?: any                                                   // 业务属性，自动挂到 Entity properties
  style?: DataItemStyle                                        // 覆盖 defaultStyle
  show?: boolean
  geometry?: GeometryConfig                                    // rectangleBounds、cornerType 等
}
```

### 常见几何

- `point`：支持 `billboard` 图标或 `point` 原语；可叠加 `label`
- `polyline`：宽度、颜色、贴地、depthFailMaterial
- `polygon`：填充、边框、挤压、贴地
- `model`：GLTF URI、scale、minimumPixelSize、颜色
- `circle` / `ellipse`：半轴、材质、挤压
- `rectangle`：通过 `geometry.rectangleBounds` 指定边界
- `corridor`：`positions` + `width` + `cornerType`
- `wall`：支持 `minimumHeights` / `maximumHeights`
- `cylinder`、`box`：三维体渲染

## DataLayerInstance API

`dataLayer.getLayer(layerId)` / `dataLayer.getLayerByName(name)` 返回图层实例，具备以下方法：

| 方法 | 说明 |
| --- | --- |
| `setShow(show: boolean)` | 显示 / 隐藏图层 |
| `addItem(item: DataItem)` | 新增数据项 |
| `addItems(items: DataItem[])` | 批量新增 |
| `removeItem(id)` | 删除数据项 |
| `clear()` | 清空所有数据 |
| `getItem(id)` | 获取数据项（原始结构） |
| `updateItem(id, updates)` | 更新位置、样式、显隐、业务字段 |
| `flyTo(duration?)` | 视角飞向图层要素（Entity 使用 `viewer.flyTo`，Primitive 使用 `flyToBoundingSphere`） |
| `destroy()` | 销毁并从 DataLayerManager 中移除 |

管理层 API：

- `dataLayer.createLayer(config)`：返回 layerId
- `dataLayer.getLayer(id)` / `getLayerByName(name)`
- `dataLayer.removeLayer(id)` / `removeAllLayers()`
- `dataLayer.getAllLayerIds()` / `getLayerCount()`

## 弹窗与点击

1. DataLayer 安装后会尝试从 Viewer 中获取 `EventPlugin`，并自动注册左键点击回调。
2. 当点中图层内的 Entity / Primitive，插件会：
   - 执行 `config.onClick(item, info)` 自定义逻辑
   - 若开启 `showPopup` 或 `popup.enabled` 且存在 `PopupPlugin`，则基于配置渲染弹窗
3. `PopupConfig` 支持以下优先级：
   - `vueComponent` / `reactComponent`：直接交给 PopupPlugin 创建对应前端组件
   - `content(item)`：返回 HTML 字符串或 HTMLElement
   - `fields`：按字段渲染表格
   - 默认模板：展示 `item.data` 的键值

> 如果未安装 `PopupPlugin` 或没有点击到数据项，插件会忽略弹窗逻辑而不中断流程。

## 聚合能力

### Entity 聚合（Cesium 原生）

```typescript
clustering: {
  enabled: true,
  pixelRange: 80,
  minimumClusterSize: 3,
  showLabels: true,
  clusterStyle: (clusteredEntities, cluster) => ({
    label: `${clusteredEntities.length} 个点`,
    image: '/assets/cluster.png',
    scale: 0.8
  })
}
```

- 将配置写入 `CustomDataSource.clustering`
- `clusterStyle` 可自定义 label、billboard 或 point

### Primitive 聚合（插件内置）

- 通过 `camera.moveEnd` 监听实时聚合
- `pixelRange`/`minimumClusterSize` 与 Entity 同步语义
- `clusterStyle` 同样可自定义标签文本和聚合图形
- 插件自动清理监听器，`removeLayer` 时释放事件

## 数据映射与批量导入

### createDataItemsFromArray

```typescript
const items = dataLayer.createDataItemsFromArray(rawList, {
  idField: 'id',
  geometryType: 'polygon',
  positions: { field: 'coordinates', format: 'lonlat' },
  styleMapping: {
    polygon: data => ({
      material: Cesium.Color.fromCssColorString(data.color).withAlpha(0.4)
    }),
    label: data => ({ text: data.name })
  },
  showField: 'visible',
  filter: item => item.coordinates?.length > 3
})

const layer = dataLayer.getLayer(layerId)!
layer.addItems(items)
```

### importArrayData

```typescript
dataLayer.importArrayData(layerId, rawList, {
  idField: 'id',
  geometryType: 'point',
  position: { lonField: 'lon', latField: 'lat', heightField: 'height' },
  styleMapping: {
    point: item => ({
      pixelSize: item.level > 3 ? 14 : 8,
      color: item.level > 3 ? Cesium.Color.RED : Cesium.Color.YELLOW
    })
  }
})
```

`importArrayData` 内部会调用 `createDataItemsFromArray` 并直接 `addItems`。

### importArrayData 混合几何类型

单次调用 `importArrayData` 需要为 `geometryType` 指定一个固定值；如果原始数据混合了点、线、面等多种要素，可以先对源数据分组，再分别调用该方法：

```typescript
const grouped = rawFeatures.reduce(
  (acc, feature) => {
    acc[feature.kind]?.push(feature)
    return acc
  },
  {
    point: [] as Feature[],
    line: [] as Feature[],
    area: [] as Feature[]
  }
)

dataLayer.importArrayData(pointLayerId, grouped.point, {
  idField: 'id',
  geometryType: 'point',
  position: { lonField: 'lon', latField: 'lat', heightField: 'height' },
  styleMapping: {
    point: item => ({
      pixelSize: item.level > 3 ? 12 : 8,
      color: item.level > 3 ? Cesium.Color.ORANGE : Cesium.Color.SKYBLUE
    })
  }
})

dataLayer.importArrayData(lineLayerId, grouped.line, {
  idField: 'id',
  geometryType: 'polyline',
  positions: { field: 'coordinates' },
  styleMapping: {
    polyline: item => ({
      width: item.width || 2,
      material: Cesium.Color.fromCssColorString(item.stroke || '#33ffff')
    })
  }
})

dataLayer.importArrayData(polygonLayerId, grouped.area, {
  idField: 'id',
  geometryType: 'polygon',
  positions: { field: 'coordinates' },
  styleMapping: {
    polygon: item => ({
      material: Cesium.Color.fromCssColorString(item.fill || '#2670ff').withAlpha(0.3),
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 1
    })
  }
})
```

这样既能复用 `importArrayData` 的映射能力，又能让不同几何类型落在各自的图层上（必要时还能给每类图层配置差异化的聚合、弹窗、默认样式）。

## React & Vue 示例

### React 18（结合 PopupPlugin）

```tsx
use client

import { useEffect, useRef } from 'react'
import { KtdViewer } from '@ktd-cesium/core'
import { DataLayerPlugin, PopupPlugin } from '@ktd-cesium/plugins'
import * as Cesium from 'cesium'

export function PoiLayerDemo() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const cesiumViewer = new Cesium.Viewer(containerRef.current)
    const viewer = new KtdViewer(cesiumViewer)
    const popup = viewer.use(PopupPlugin)
    const dataLayer = viewer.use(DataLayerPlugin)

    popup.registerReactRenderer()

    const layerId = dataLayer.createLayer({
      name: 'poi',
      type: 'entity',
      popup: {
        enabled: true,
        reactComponent: (item) => ({
          component: PoiPopup,
          props: { data: item.data }
        })
      }
    })

    dataLayer.importArrayData(layerId, poiList, {
      idField: 'id',
      geometryType: 'point',
      position: { lonField: 'lon', latField: 'lat' }
    })

    return () => viewer.destroy()
  }, [])

  return <div ref={containerRef} className="map-container" />
}
```

### Vue 3

```vue
<script setup lang="ts">
use client

import { ref, onMounted, onBeforeUnmount } from 'vue'
import { KtdViewer } from '@ktd-cesium/core'
import { DataLayerPlugin } from '@ktd-cesium/plugins'
import * as Cesium from 'cesium'

const containerRef = ref<HTMLElement>()
let viewer: KtdViewer | null = null
let dataLayer: DataLayerPlugin | null = null

onMounted(() => {
  if (!containerRef.value) return
  const cesiumViewer = new Cesium.Viewer(containerRef.value)
  viewer = new KtdViewer(cesiumViewer)
  dataLayer = viewer.use(DataLayerPlugin)

  const layerId = dataLayer.createLayer({
    name: 'province',
    type: 'entity',
    defaultStyle: { polygon: { material: Cesium.Color.SKYBLUE.withAlpha(0.3) } }
  })

  // 业务数据转换示例
  dataLayer.importArrayData(layerId, provinceList, {
    idField: 'code',
    geometryType: 'polygon',
    positions: { field: 'positions' }
  })
})

onBeforeUnmount(() => {
  viewer?.destroy()
})
</script>

<template>
  <div ref="containerRef" class="map-container" />
</template>
```

## 注意事项

1. Primitive 聚合通过 `camera.moveEnd` 监听实现，长时间存在大量图层时请及时 `destroy` 释放监听器。
2. Entity 图层聚合依赖 Cesium 原生能力，仅对点状要素生效。
3. 弹窗渲染需要 PopupPlugin 支持：Vue 需 `createApp` 宿主，React 需 `createRoot` 宿主，确保在 Viewer 初始化时注册。
4. `DataLayerPlugin` 不直接加载 GeoJSON/KML/CZML 文件，如需格式转换请在上游解析后构造 `DataItem`。
5. 大数据量（>10w）建议优先使用 Primitive 模式，并适当开启聚合以减少屏幕元素数量。
