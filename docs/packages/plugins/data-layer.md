# DataLayerPlugin

数据图层管理插件，支持 **Entity 和 Primitive** 两种渲染模式，提供**聚合、点击事件、弹窗、数据映射**等功能，适用于批量数据可视化场景。

## 导入

```typescript
import { DataLayerPlugin } from '@ktd-cesium/plugins'
import type {
  DataLayerConfig,
  DataLayerInstance,
  DataItem,
  GeometryType,
  ClusterConfig,
  PopupConfig,
  DataMappingConfig
} from '@ktd-cesium/plugins'
```

## 核心特性

- **双渲染模式**：Entity 模式（功能完整）和 Primitive 模式（高性能）
- **多种几何类型**：点、线、面、模型、圆、椭圆、矩形、走廊、墙、圆柱、盒子
- **聚合功能**：Entity 模式使用 Cesium 原生聚合，Primitive 模式自定义聚合算法
- **点击交互**：支持点击事件回调、弹窗展示（HTML/Vue/React）
- **数据映射**：从数组数据自动映射创建图层，支持字段转换和过滤
- **图层管理**：创建、删除、显示/隐藏、飞行等完整管理功能

## 安装

```typescript
import { KtdViewer } from '@ktd-cesium/core'
import { DataLayerPlugin } from '@ktd-cesium/plugins'

const viewer = new KtdViewer(cesiumViewer)
const dataLayer = viewer.use(DataLayerPlugin)
```

## 快速上手

### 创建 Entity 图层

```typescript
const layerId = dataLayer.createLayer({
  name: '点位图层',
  type: 'entity',
  show: true,
  defaultStyle: {
    point: {
      pixelSize: 10,
      color: Cesium.Color.BLUE,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2
    }
  }
})

const layer = dataLayer.getLayer(layerId)

// 添加数据
layer.addItem({
  id: 'point-001',
  geometryType: 'point',
  position: [116.4074, 39.9042, 0],
  data: { name: '北京', value: 100 }
})

// 批量添加
layer.addItems([
  {
    id: 'point-002',
    geometryType: 'point',
    position: [121.4737, 31.2304, 0],
    data: { name: '上海', value: 200 }
  },
  {
    id: 'point-003',
    geometryType: 'point',
    position: [113.2644, 23.1291, 0],
    data: { name: '广州', value: 150 }
  }
])
```

### 创建 Primitive 图层（高性能）

```typescript
const layerId = dataLayer.createLayer({
  name: '高性能点位图层',
  type: 'primitive',
  show: true,
  defaultStyle: {
    point: {
      pixelSize: 8,
      color: Cesium.Color.RED
    }
  }
})

const layer = dataLayer.getLayer(layerId)

// 添加大量数据（适合万级数据）
const items = Array.from({ length: 10000 }, (_, i) => ({
  id: `point-${i}`,
  geometryType: 'point' as GeometryType,
  position: [
    116 + Math.random() * 0.1,
    39 + Math.random() * 0.1,
    0
  ] as [number, number, number],
  data: { index: i }
}))

layer.addItems(items)
```

## 支持的几何类型

| 类型 | 说明 | 位置字段 | 样式配置 |
| --- | --- | --- | --- |
| `point` | 点 | `position` | `point` 或 `icon` |
| `polyline` | 折线 | `positions` | `polyline` |
| `polygon` | 面 | `positions` | `polygon` |
| `model` | 3D模型 | `position` | `model` |
| `circle` | 圆形 | `position` | `circle` |
| `ellipse` | 椭圆 | `position` | `ellipse` |
| `rectangle` | 矩形 | `geometry.rectangleBounds` | `rectangle` |
| `corridor` | 走廊 | `positions` | `corridor` |
| `wall` | 墙体 | `positions` | `wall` |
| `cylinder` | 圆柱体 | `position` | `cylinder` |
| `box` | 立方体 | `position` | `box` |

## API 概览

### 图层管理

#### createLayer(config)

创建数据图层。

```typescript
const layerId = dataLayer.createLayer({
  name: '图层名称',
  type: 'entity', // 'entity' | 'primitive'
  show: true,
  defaultStyle: { /* 默认样式 */ },
  clustering: { /* 聚合配置 */ },
  popup: { /* 弹窗配置 */ },
  onClick: (item, event) => { /* 点击回调 */ }
})
```

**参数说明：**

- `name`: 图层名称
- `type`: 图层类型，`entity` 或 `primitive`
- `show`: 是否显示（默认 `true`）
- `defaultStyle`: 默认样式配置
- `clustering`: 聚合配置（仅 Entity 模式）
- `popup`: 弹窗配置
- `onClick`: 点击回调函数

#### getLayer(id)

获取图层实例。

```typescript
const layer = dataLayer.getLayer(layerId)
if (layer) {
  layer.addItem({ /* ... */ })
  layer.setShow(false)
  layer.flyTo()
}
```

#### getLayerByName(name)

根据名称获取图层。

```typescript
const layer = dataLayer.getLayerByName('点位图层')
```

#### removeLayer(id)

移除图层。

```typescript
dataLayer.removeLayer(layerId)
```

#### removeAllLayers()

移除所有图层。

```typescript
dataLayer.removeAllLayers()
```

#### getAllLayerIds()

获取所有图层 ID。

```typescript
const ids = dataLayer.getAllLayerIds()
```

#### getLayerCount()

获取图层数量。

```typescript
const count = dataLayer.getLayerCount()
```

### 图层实例方法

#### addItem(item)

添加单个数据项。

```typescript
layer.addItem({
  id: 'item-001',
  geometryType: 'point',
  position: [116.4074, 39.9042, 0],
  data: { name: '数据项' },
  style: { /* 样式覆盖 */ }
})
```

#### addItems(items)

批量添加数据项。

```typescript
layer.addItems([
  { id: 'item-001', geometryType: 'point', position: [116, 39, 0] },
  { id: 'item-002', geometryType: 'point', position: [121, 31, 0] }
])
```

#### removeItem(itemId)

移除数据项。

```typescript
layer.removeItem('item-001')
```

#### clear()

清空图层所有数据。

```typescript
layer.clear()
```

#### getItem(itemId)

获取数据项。

```typescript
const item = layer.getItem('item-001')
```

#### updateItem(itemId, updates)

更新数据项。

```typescript
layer.updateItem('item-001', {
  position: [116.5, 39.9, 0],
  style: { point: { pixelSize: 15 } },
  data: { name: '更新后的名称' }
})
```

#### setShow(show)

设置图层显示/隐藏。

```typescript
layer.setShow(false) // 隐藏
layer.setShow(true)  // 显示
```

#### flyTo(duration?)

飞行到图层。

```typescript
await layer.flyTo(2.0) // 2秒飞行动画
```

#### destroy()

销毁图层。

```typescript
layer.destroy()
```

## 各类型数据项示例

### 点类型

```typescript
// 基础点
layer.addItem({
  id: 'point-001',
  geometryType: 'point',
  position: [116.4074, 39.9042, 0],
  style: {
    point: {
      pixelSize: 10,
      color: Cesium.Color.BLUE,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2
    }
  }
})

// 图标点
layer.addItem({
  id: 'icon-001',
  geometryType: 'point',
  position: [116.4074, 39.9042, 0],
  style: {
    icon: {
      image: '/icons/marker.png',
      scale: 1.5,
      color: Cesium.Color.WHITE
    },
    label: {
      text: '标注点',
      font: '14px sans-serif',
      fillColor: Cesium.Color.WHITE,
      pixelOffset: [0, -30]
    }
  }
})
```

### 线类型

```typescript
layer.addItem({
  id: 'polyline-001',
  geometryType: 'polyline',
  positions: [
    [116.4074, 39.9042, 0],
    [116.4084, 39.9052, 0],
    [116.4094, 39.9062, 0]
  ],
  style: {
    polyline: {
      width: 3,
      material: Cesium.Color.BLUE,
      clampToGround: true
    }
  }
})
```

### 面类型

```typescript
layer.addItem({
  id: 'polygon-001',
  geometryType: 'polygon',
  positions: [
    [116.4074, 39.9042, 0],
    [116.4084, 39.9042, 0],
    [116.4084, 39.9052, 0],
    [116.4074, 39.9052, 0],
    [116.4074, 39.9042, 0]
  ],
  style: {
    polygon: {
      material: Cesium.Color.BLUE.withAlpha(0.6),
      outline: true,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2,
      height: 0,
      extrudedHeight: 100
    }
  }
})
```

### 圆形

```typescript
layer.addItem({
  id: 'circle-001',
  geometryType: 'circle',
  position: [116.4074, 39.9042, 0],
  style: {
    circle: {
      semiMajorAxis: 1000, // 半径（米）
      material: Cesium.Color.RED.withAlpha(0.5),
      outline: true,
      outlineColor: Cesium.Color.BLACK,
      height: 0,
      extrudedHeight: 50
    }
  }
})
```

### 椭圆

```typescript
layer.addItem({
  id: 'ellipse-001',
  geometryType: 'ellipse',
  position: [116.4074, 39.9042, 0],
  style: {
    ellipse: {
      semiMajorAxis: 2000, // 长半轴（米）
      semiMinorAxis: 1000,  // 短半轴（米）
      material: Cesium.Color.GREEN.withAlpha(0.5)
    }
  }
})
```

### 矩形

```typescript
layer.addItem({
  id: 'rectangle-001',
  geometryType: 'rectangle',
  geometry: {
    rectangleBounds: {
      west: 116.4074,
      south: 39.9042,
      east: 116.4084,
      north: 39.9052
    }
  },
  style: {
    rectangle: {
      material: Cesium.Color.YELLOW.withAlpha(0.5),
      outline: true,
      height: 0,
      extrudedHeight: 30
    }
  }
})
```

### 走廊

```typescript
layer.addItem({
  id: 'corridor-001',
  geometryType: 'corridor',
  positions: [
    [116.4074, 39.9042, 0],
    [116.4084, 39.9052, 0]
  ],
  style: {
    corridor: {
      width: 500, // 宽度（米）
      material: Cesium.Color.CYAN.withAlpha(0.5),
      outline: true
    }
  },
  geometry: {
    cornerType: 'ROUNDED' // 'ROUNDED' | 'MITERED' | 'BEVELED'
  }
})
```

### 墙体

```typescript
layer.addItem({
  id: 'wall-001',
  geometryType: 'wall',
  positions: [
    [116.4074, 39.9042, 0],
    [116.4084, 39.9052, 0],
    [116.4094, 39.9062, 0]
  ],
  style: {
    wall: {
      material: Cesium.Color.ORANGE.withAlpha(0.5),
      minimumHeights: [0, 0, 0],
      maximumHeights: [100, 100, 100]
    }
  }
})
```

### 圆柱体

```typescript
layer.addItem({
  id: 'cylinder-001',
  geometryType: 'cylinder',
  position: [116.4074, 39.9042, 0],
  style: {
    cylinder: {
      length: 2000,
      topRadius: 500,
      bottomRadius: 500,
      material: Cesium.Color.PURPLE.withAlpha(0.5)
    }
  }
})
```

### 立方体

```typescript
layer.addItem({
  id: 'box-001',
  geometryType: 'box',
  position: [116.4074, 39.9042, 0],
  style: {
    box: {
      dimensions: {
        x: 1000, // 长度（米）
        y: 1000, // 宽度（米）
        z: 500   // 高度（米）
      },
      material: Cesium.Color.PINK.withAlpha(0.5)
    }
  }
})
```

### 3D模型

```typescript
layer.addItem({
  id: 'model-001',
  geometryType: 'model',
  position: [116.4074, 39.9042, 0],
  style: {
    model: {
      uri: '/models/vehicle.glb',
      scale: 1.0,
      minimumPixelSize: 128,
      maximumScale: 20000
    }
  }
})
```

## 聚合功能

### Entity 模式聚合

```typescript
const layerId = dataLayer.createLayer({
  name: '聚合图层',
  type: 'entity',
  clustering: {
    enabled: true,
    pixelRange: 80,        // 聚合像素范围
    minimumClusterSize: 3, // 最小聚合数量
    showLabels: true,
    clusterStyle: (clusteredEntities, cluster) => {
      const count = clusteredEntities.length
      return {
        image: '/icons/cluster.png',
        label: `${count} 个`,
        scale: count >= 100 ? 1.5 : 1.0
      }
    }
  }
})
```

### Primitive 模式聚合

```typescript
const layerId = dataLayer.createLayer({
  name: 'Primitive聚合图层',
  type: 'primitive',
  clustering: {
    enabled: true,
    pixelRange: 60,
    minimumClusterSize: 5,
    showLabels: true
  }
})
```

**注意：** Primitive 模式的聚合会在相机移动时自动更新，使用自定义聚合算法。

## 弹窗功能

### HTML 弹窗

```typescript
const layerId = dataLayer.createLayer({
  name: '弹窗图层',
  type: 'entity',
  popup: {
    enabled: true,
    content: (item) => {
      return `
        <div style="padding: 15px;">
          <h3>${item.data.name}</h3>
          <p>值: ${item.data.value}</p>
        </div>
      `
    }
  }
})
```

### 字段配置弹窗

```typescript
const layerId = dataLayer.createLayer({
  name: '字段弹窗图层',
  type: 'entity',
  popup: {
    enabled: true,
    title: '数据详情',
    fields: [
      {
        field: 'name',
        label: '名称',
        formatter: (value) => `<strong>${value}</strong>`
      },
      {
        field: 'value',
        label: '数值',
        formatter: (value) => `${value.toLocaleString()}`
      },
      {
        field: 'user.name', // 支持嵌套字段
        label: '用户名'
      }
    ],
    style: {
      width: '300px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      padding: '15px'
    }
  }
})
```

### Vue 组件弹窗

```typescript
import MyPopupComponent from './MyPopupComponent.vue'

const layerId = dataLayer.createLayer({
  name: 'Vue弹窗图层',
  type: 'entity',
  popup: {
    enabled: true,
    vueComponent: (item) => ({
      component: MyPopupComponent,
      props: {
        data: item.data,
        position: item.position
      }
    })
  }
})
```

### React 组件弹窗

```typescript
import MyPopupComponent from './MyPopupComponent'

const layerId = dataLayer.createLayer({
  name: 'React弹窗图层',
  type: 'entity',
  popup: {
    enabled: true,
    reactComponent: (item) => ({
      component: MyPopupComponent,
      props: {
        data: item.data,
        position: item.position
      }
    })
  }
})
```

### 点击回调

```typescript
const layerId = dataLayer.createLayer({
  name: '点击回调图层',
  type: 'entity',
  onClick: (item, event) => {
    console.log('点击了数据项:', item.id, item.data)
    console.log('点击位置:', event.position)
    
    // 自定义处理逻辑
    if (item.data.type === 'warning') {
      alert('警告数据！')
    }
  },
  showPopup: false // 禁用默认弹窗
})
```

## 数据映射（从数组导入）

### 基础映射

```typescript
// 原始数据
const rawData = [
  { id: 1, lon: 116.4074, lat: 39.9042, name: '北京', value: 100 },
  { id: 2, lon: 121.4737, lat: 31.2304, name: '上海', value: 200 },
  { id: 3, lon: 113.2644, lat: 23.1291, name: '广州', value: 150 }
]

// 创建图层
const layerId = dataLayer.createLayer({
  name: '映射图层',
  type: 'entity'
})

// 导入数据
dataLayer.importArrayData(layerId, rawData, {
  idField: 'id',
  geometryType: 'point',
  position: {
    lonField: 'lon',
    latField: 'lat'
  },
  styleMapping: {
    'point.pixelSize': (item) => item.value > 150 ? 15 : 10,
    'point.color': (item) => item.value > 150 ? Cesium.Color.RED : Cesium.Color.BLUE
  }
})
```

### 复杂映射

```typescript
const rawData = [
  {
    id: 'polygon-001',
    type: 'polygon',
    coordinates: [
      [116.4074, 39.9042],
      [116.4084, 39.9042],
      [116.4084, 39.9052],
      [116.4074, 39.9052]
    ],
    name: '区域A',
    area: 1000,
    status: 'active'
  }
]

dataLayer.importArrayData(layerId, rawData, {
  idField: 'id',
  geometryType: 'type', // 从数据中读取类型
  positions: {
    field: 'coordinates',
    format: 'lonlat'
  },
  styleMapping: {
    'polygon.material': (item) => {
      return item.status === 'active' 
        ? Cesium.Color.GREEN.withAlpha(0.5)
        : Cesium.Color.RED.withAlpha(0.5)
    },
    'polygon.outlineColor': Cesium.Color.BLACK
  },
  filter: (item) => item.status === 'active', // 只导入激活的数据
  transform: (item) => ({
    ...item,
    name: item.name.toUpperCase() // 数据转换
  })
})
```

### 手动创建数据项

```typescript
// 从数组创建数据项（不导入图层）
const dataItems = dataLayer.createDataItemsFromArray(rawData, {
  idField: 'id',
  geometryType: 'point',
  position: {
    lonField: 'lon',
    latField: 'lat'
  }
})

// 手动添加到图层
const layer = dataLayer.getLayer(layerId)
layer.addItems(dataItems)
```

## 使用场景

### 场景 1：POI 点位展示

```typescript
// 创建 POI 图层
const poiLayerId = dataLayer.createLayer({
  name: 'POI点位',
  type: 'entity',
  clustering: {
    enabled: true,
    pixelRange: 60,
    minimumClusterSize: 3
  },
  popup: {
    enabled: true,
    fields: [
      { field: 'name', label: '名称' },
      { field: 'address', label: '地址' },
      { field: 'phone', label: '电话' }
    ]
  },
  defaultStyle: {
    icon: {
      image: '/icons/poi.png',
      scale: 1.0
    }
  }
})

// 从 API 加载数据
async function loadPOIData() {
  const response = await fetch('/api/poi')
  const data = await response.json()
  
  dataLayer.importArrayData(poiLayerId, data, {
    idField: 'id',
    geometryType: 'point',
    position: {
      lonField: 'longitude',
      latField: 'latitude'
    },
    styleMapping: {
      'icon.image': (item) => `/icons/${item.category}.png`
    }
  })
  
  // 飞行到数据
  const layer = dataLayer.getLayer(poiLayerId)
  await layer.flyTo()
}
```

### 场景 2：轨迹线展示

```typescript
const trackLayerId = dataLayer.createLayer({
  name: '轨迹线',
  type: 'entity',
  defaultStyle: {
    polyline: {
      width: 3,
      material: Cesium.Color.CYAN,
      clampToGround: true
    }
  }
})

// 添加轨迹
trackLayerId.addItem({
  id: 'track-001',
  geometryType: 'polyline',
  positions: [
    [116.4074, 39.9042, 0],
    [116.4084, 39.9052, 0],
    [116.4094, 39.9062, 0]
  ],
  data: {
    vehicleId: 'V001',
    startTime: '2024-01-01 10:00:00',
    endTime: '2024-01-01 11:00:00'
  }
})
```

### 场景 3：区域统计

```typescript
const regionLayerId = dataLayer.createLayer({
  name: '区域统计',
  type: 'entity',
  popup: {
    enabled: true,
    title: '区域统计',
    fields: [
      { field: 'name', label: '区域名称' },
      { 
        field: 'population', 
        label: '人口',
        formatter: (value) => `${value.toLocaleString()} 人`
      },
      {
        field: 'area',
        label: '面积',
        formatter: (value) => `${value.toFixed(2)} km²`
      }
    ]
  },
  defaultStyle: {
    polygon: {
      material: Cesium.Color.BLUE.withAlpha(0.3),
      outline: true,
      outlineColor: Cesium.Color.BLUE,
      outlineWidth: 2
    }
  }
})

// 根据数据值设置不同颜色
function addRegion(region: any) {
  const layer = dataLayer.getLayer(regionLayerId)
  layer.addItem({
    id: region.id,
    geometryType: 'polygon',
    positions: region.boundary,
    data: region,
    style: {
      polygon: {
        material: getColorByValue(region.population).withAlpha(0.3)
      }
    }
  })
}

function getColorByValue(value: number): Cesium.Color {
  if (value > 1000000) return Cesium.Color.RED
  if (value > 500000) return Cesium.Color.ORANGE
  return Cesium.Color.GREEN
}
```

### 场景 4：高性能海量数据

```typescript
// 使用 Primitive 模式处理大量数据
const massiveLayerId = dataLayer.createLayer({
  name: '海量数据',
  type: 'primitive',
  clustering: {
    enabled: true,
    pixelRange: 50,
    minimumClusterSize: 10
  },
  defaultStyle: {
    point: {
      pixelSize: 5,
      color: Cesium.Color.BLUE
    }
  }
})

// 生成10万条数据
const items = Array.from({ length: 100000 }, (_, i) => ({
  id: `item-${i}`,
  geometryType: 'point' as GeometryType,
  position: [
    116 + Math.random() * 0.5,
    39 + Math.random() * 0.5,
    0
  ] as [number, number, number],
  data: { index: i, value: Math.random() * 100 }
}))

const layer = dataLayer.getLayer(massiveLayerId)
layer.addItems(items)
```

### 场景 5：动态更新数据

```typescript
const dynamicLayerId = dataLayer.createLayer({
  name: '动态数据',
  type: 'entity'
})

const layer = dataLayer.getLayer(dynamicLayerId)

// 定时更新数据
setInterval(() => {
  // 更新现有数据项
  layer.updateItem('item-001', {
    position: [
      116.4074 + Math.random() * 0.01,
      39.9042 + Math.random() * 0.01,
      0
    ],
    style: {
      point: {
        pixelSize: 10 + Math.random() * 5
      }
    }
  })
  
  // 添加新数据
  layer.addItem({
    id: `item-${Date.now()}`,
    geometryType: 'point',
    position: [
      116.4074 + Math.random() * 0.1,
      39.9042 + Math.random() * 0.1,
      0
    ],
    data: { timestamp: Date.now() }
  })
}, 1000)
```

### 场景 6：图层分组管理

```typescript
class LayerGroupManager {
  private dataLayer: DataLayerPlugin
  private groups: Map<string, string[]> = new Map()
  
  constructor(dataLayer: DataLayerPlugin) {
    this.dataLayer = dataLayer
  }
  
  createGroup(groupName: string, layerIds: string[]) {
    this.groups.set(groupName, layerIds)
  }
  
  showGroup(groupName: string) {
    const layerIds = this.groups.get(groupName)
    if (!layerIds) return
    
    layerIds.forEach(id => {
      const layer = this.dataLayer.getLayer(id)
      layer?.setShow(true)
    })
  }
  
  hideGroup(groupName: string) {
    const layerIds = this.groups.get(groupName)
    if (!layerIds) return
    
    layerIds.forEach(id => {
      const layer = this.dataLayer.getLayer(id)
      layer?.setShow(false)
    })
  }
  
  flyToGroup(groupName: string) {
    const layerIds = this.groups.get(groupName)
    if (!layerIds) return
    
    // 飞行到第一个图层
    const firstLayer = this.dataLayer.getLayer(layerIds[0])
    firstLayer?.flyTo()
  }
}

// 使用示例
const manager = new LayerGroupManager(dataLayer)
manager.createGroup('基础图层', [layerId1, layerId2])
manager.showGroup('基础图层')
```

## 注意事项

1. **Entity vs Primitive**：
   - Entity 模式：功能完整，支持聚合、弹窗、点击等，适合中小规模数据（< 1万）
   - Primitive 模式：性能更高，适合大规模数据（> 1万），但功能相对简单

2. **聚合性能**：
   - Entity 模式使用 Cesium 原生聚合，性能较好
   - Primitive 模式使用自定义聚合算法，在相机移动时更新，注意性能影响

3. **数据映射**：
   - 使用 `importArrayData` 可以快速从数组数据创建图层
   - 支持字段转换、过滤、样式映射等功能

4. **弹窗依赖**：
   - 弹窗功能需要安装 `PopupPlugin`
   - 点击事件需要安装 `EventPlugin`

5. **内存管理**：
   - 大量数据建议使用 Primitive 模式
   - 及时清理不需要的图层和数据项

6. **坐标系统**：
   - 位置坐标使用 WGS84 坐标系（经纬度）
   - 高度单位为米

DataLayerPlugin 提供了完整的数据图层管理能力，适用于各种数据可视化场景，从简单的点位展示到复杂的海量数据渲染都能很好地支持。

