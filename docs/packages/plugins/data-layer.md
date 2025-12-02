# DataLayerPlugin

数据图层管理插件，支持 **Entity 和 Primitive** 两种渲染模式，提供**聚合、点击事件、弹窗、数据映射**等功能，适用于批量数据可视化场景。

## 导入

```typescript
import { DataLayerPlugin } from '@auto-cesium/plugins'
import type {
  DataLayerConfig,
  DataLayerInstance,
  DataItem,
  GeometryType,
  ClusterConfig,
  PopupConfig,
  DataMappingConfig
} from '@auto-cesium/plugins'

// 数据加载器
import {
  loadGeoJSONLayer,
  loadGeoJSONNative,
  loadCSVLayer,
  loadExcelLayer,
  loadShapefileLayer,
  loadWKTLayer,
  loadWFSLayer,
  loadKMLLayer,
  applyLayerGradient,
  GRADIENT_PRESETS
} from '@auto-cesium/plugins'
```

## 核心特性

- **双渲染模式**：Entity 模式（功能完整）和 Primitive 模式（高性能）
- **多种几何类型**：点、线、面、模型、圆、椭圆、矩形、走廊、墙、圆柱、盒子
- **多格式支持**：GeoJSON、CSV、Excel、Shapefile、WKT、WFS、KML/KMZ
- **聚合功能**：Entity 模式使用 Cesium 原生聚合，Primitive 模式自定义聚合算法
- **点击交互**：支持点击事件回调、弹窗展示（HTML/Vue/React）
- **数据映射**：从数组数据自动映射创建图层，支持字段转换和过滤
- **图层管理**：创建、删除、显示/隐藏、飞行等完整管理功能
- **渐变色渲染**：支持根据数据值自动应用渐变色

## 安装

```typescript
import { AutoViewer } from '@auto-cesium/core'
import { DataLayerPlugin } from '@auto-cesium/plugins'

const viewer = new AutoViewer(cesiumViewer)
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
  position: [116 + Math.random() * 0.1, 39 + Math.random() * 0.1, 0] as [number, number, number],
  data: { index: i }
}))

layer.addItems(items)
```

## 支持的几何类型

| 类型        | 说明   | 位置字段                   | 样式配置          |
| ----------- | ------ | -------------------------- | ----------------- |
| `point`     | 点     | `position`                 | `point` 或 `icon` |
| `polyline`  | 折线   | `positions`                | `polyline`        |
| `polygon`   | 面     | `positions`                | `polygon`         |
| `model`     | 3D模型 | `position`                 | `model`           |
| `circle`    | 圆形   | `position`                 | `circle`          |
| `ellipse`   | 椭圆   | `position`                 | `ellipse`         |
| `rectangle` | 矩形   | `geometry.rectangleBounds` | `rectangle`       |
| `corridor`  | 走廊   | `positions`                | `corridor`        |
| `wall`      | 墙体   | `positions`                | `wall`            |
| `cylinder`  | 圆柱体 | `position`                 | `cylinder`        |
| `box`       | 立方体 | `position`                 | `box`             |

## API 概览

### 图层管理

#### createLayer(config)

创建数据图层。

```typescript
const layerId = dataLayer.createLayer({
  name: '图层名称',
  type: 'entity', // 'entity' | 'primitive'
  show: true,
  defaultStyle: {
    /* 默认样式 */
  },
  clustering: {
    /* 聚合配置 */
  },
  popup: {
    /* 弹窗配置 */
  },
  onClick: (item, event) => {
    /* 点击回调 */
  }
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
  layer.addItem({
    /* ... */
  })
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
  style: {
    /* 样式覆盖 */
  }
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
layer.setShow(true) // 显示
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
      semiMinorAxis: 1000, // 短半轴（米）
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
        z: 500 // 高度（米）
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

DataLayerPlugin 支持强大的聚合功能，可以优化大量数据的显示性能。

### Entity 模式聚合

Entity 模式使用 Cesium 原生聚合引擎，性能优秀。

```typescript
const layerId = dataLayer.createLayer({
  name: '聚合图层',
  type: 'entity',
  clustering: {
    enabled: true,
    pixelRange: 80, // 聚合像素范围
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

Primitive 模式使用自定义聚合算法，在相机移动时自动更新。

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

### 聚合配置参数

| 参数                 | 类型       | 默认值  | 说明                                 |
| -------------------- | ---------- | ------- | ------------------------------------ |
| `enabled`            | `boolean`  | `false` | 是否启用聚合                         |
| `pixelRange`         | `number`   | `80`    | 屏幕像素范围，此范围内的对象会被聚合 |
| `minimumClusterSize` | `number`   | `2`     | 最小聚合数量，少于此数量不聚合       |
| `showLabels`         | `boolean`  | `true`  | 是否显示聚合点数量标签               |
| `clusterStyle`       | `function` | -       | 自定义聚合样式回调函数               |

### 聚合支持的几何类型

✅ **直接支持聚合**：

- `point` - 点
- `billboard` - 图标标注
- `label` - 文字标注

⚠️ **通过中心点参与聚合**（非点类型）：

- `polyline` - 线
- `polygon` - 面
- `circle` / `ellipse` - 圆/椭圆
- `rectangle` - 矩形
- `corridor` - 走廊
- `wall` - 墙体
- `box` - 立方体
- `cylinder` - 圆柱体
- `model` - 3D模型

**原理**：对于非点类型的几何体，插件会计算其中心点位置，并使用该中心点参与聚合显示。当聚合时，原始几何体会被隐藏；当缩放接近时，聚合解散，显示原始几何体。

### 动态聚合示例

```typescript
// 根据缩放级别自动调整聚合
viewer.camera.changed.addEventListener(() => {
  const height = viewer.camera.positionCartographic.height

  if (height > 100000) {
    // 高空视角：启用聚合
    layer.updateConfig({
      clustering: {
        enabled: true,
        pixelRange: 100,
        minimumClusterSize: 3
      }
    })
  } else if (height > 10000) {
    // 中等高度：温和聚合
    layer.updateConfig({
      clustering: {
        pixelRange: 60,
        minimumClusterSize: 5
      }
    })
  } else {
    // 近距离：禁用聚合
    layer.updateConfig({
      clustering: {
        enabled: false
      }
    })
  }
})
```

### 性能建议

- **少量数据（< 100）**：不需要聚合
- **中等数据（100-1000）**：推荐 `pixelRange: 60-80`，`minimumClusterSize: 3-5`
- **大量数据（1000-10000）**：推荐 `pixelRange: 80-120`，`minimumClusterSize: 5-10`
- **海量数据（> 10000）**：推荐使用 Primitive 模式 + 激进聚合配置

## 数据格式加载器

DataLayerPlugin 提供了丰富的数据格式加载器，支持从多种常见地理数据格式导入数据。

### GeoJSON 加载

GeoJSON 是最常用的地理数据交换格式。

```typescript
import { loadGeoJSONLayer } from '@auto-cesium/plugins'

// 从 URL 加载
const layerId = await loadGeoJSONLayer(
  dataLayer,
  {
    name: 'GeoJSON图层',
    type: 'entity'
  },
  {
    url: '/data/regions.geojson',
    fill: Cesium.Color.BLUE.withAlpha(0.5),
    stroke: Cesium.Color.BLACK,
    strokeWidth: 2,
    markerColor: Cesium.Color.RED,
    markerSize: 10,
    clampToGround: true
  }
)

// 从数据加载
const geojsonData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [116.4074, 39.9042]
      },
      properties: {
        name: '北京'
      }
    }
  ]
}

const layerId2 = await loadGeoJSONLayer(
  dataLayer,
  { name: 'GeoJSON数据', type: 'entity' },
  { data: JSON.stringify(geojsonData) }
)
```

**支持的 GeoJSON 几何类型**：

- Point
- LineString
- Polygon
- MultiPoint（取第一个点）
- MultiLineString（取第一条线）
- MultiPolygon（取第一个面）

### CSV 加载

从 CSV 文件加载点位数据。

```typescript
import { loadCSVLayer } from '@auto-cesium/plugins'

const layerId = await loadCSVLayer(
  dataLayer,
  {
    name: 'CSV图层',
    type: 'entity'
  },
  {
    url: '/data/points.csv',
    delimiter: ',',
    hasHeader: true,
    longitudeField: 'lon', // 经度字段名
    latitudeField: 'lat', // 纬度字段名
    heightField: 'height', // 高度字段名（可选）
    idField: 'id' // ID字段名（可选）
  }
)
```

**CSV 文件示例**：

```csv
id,lon,lat,height,name,value
1,116.4074,39.9042,0,北京,100
2,121.4737,31.2304,0,上海,200
3,113.2644,23.1291,0,广州,150
```

### Excel 加载

支持加载 Excel 文件（.xlsx）中的点位数据。

**依赖安装**：

```bash
npm install xlsx
# 或
pnpm install xlsx
```

```typescript
import { loadExcelLayer } from '@auto-cesium/plugins'

const layerId = await loadExcelLayer(
  dataLayer,
  {
    name: 'Excel图层',
    type: 'entity'
  },
  {
    url: '/data/points.xlsx',
    sheet: 0, // 工作表索引，或使用工作表名称 'Sheet1'
    startRow: 1, // 数据起始行（跳过表头）
    longitudeField: 'longitude', // 可以是字段名或列索引
    latitudeField: 'latitude',
    heightField: 'height',
    idField: 'id'
  }
)

// 从本地文件加载
const fileInput = document.querySelector('input[type="file"]')
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0]
  const layerId = await loadExcelLayer(
    dataLayer,
    { name: 'Excel本地文件', type: 'entity' },
    {
      data: file, // 直接传入 File 对象
      sheet: 0,
      longitudeField: 0, // 也可以使用列索引
      latitudeField: 1
    }
  )
})
```

**降级方案**：如果未安装 xlsx 库，会尝试将 Excel 作为 CSV 格式处理（仅支持简单格式）。

### Shapefile 加载

支持加载 Shapefile 格式（.shp + .dbf + .prj）。

**依赖安装**：

```bash
npm install shpjs
# 或
pnpm install shpjs
```

```typescript
import { loadShapefileLayer } from '@auto-cesium/plugins'

const layerId = await loadShapefileLayer(
  dataLayer,
  {
    name: 'Shapefile图层',
    type: 'entity'
  },
  {
    shpUrl: '/data/regions.shp',
    dbfUrl: '/data/regions.dbf',
    prjUrl: '/data/regions.prj' // 投影信息（可选）
  }
)

// 如果没有 .prj 文件，可以指定源坐标系
const layerId2 = await loadShapefileLayer(
  dataLayer,
  { name: 'Shapefile图层2', type: 'entity' },
  {
    shpUrl: '/data/regions.shp',
    dbfUrl: '/data/regions.dbf',
    sourceEPSG: 4326 // WGS84
  }
)

// 从压缩文件加载
const layerId3 = await loadShapefileLayer(
  dataLayer,
  { name: 'Shapefile压缩包', type: 'entity' },
  {
    url: '/data/regions.zip' // 包含 .shp、.dbf、.prj 的 zip 文件
  }
)
```

### WKT 加载

WKT (Well-Known Text) 是一种用文本表示几何对象的格式。

```typescript
import { loadWKTLayer } from '@auto-cesium/plugins'

const layerId = loadWKTLayer(
  dataLayer,
  {
    name: 'WKT图层',
    type: 'entity'
  },
  {
    wkt: 'POINT(116.4074 39.9042)',
    properties: { name: '北京' }
  }
)

// 批量加载
const layerId2 = loadWKTLayer(
  dataLayer,
  { name: 'WKT批量', type: 'entity' },
  {
    wkt: [
      'POINT(116.4074 39.9042)',
      'LINESTRING(116.4074 39.9042, 116.4084 39.9052, 116.4094 39.9062)',
      'POLYGON((116.4074 39.9042, 116.4084 39.9042, 116.4084 39.9052, 116.4074 39.9052, 116.4074 39.9042))'
    ],
    properties: [
      { name: '点', type: 'point' },
      { name: '线', type: 'line' },
      { name: '面', type: 'polygon' }
    ]
  }
)
```

**支持的 WKT 类型**：

- POINT - 点
- LINESTRING - 线
- POLYGON - 面
- MULTIPOINT - 多点（取第一个）
- MULTILINESTRING - 多线（取第一条）
- MULTIPOLYGON - 多面（取第一个）

**WKT 格式示例**：

```
POINT(116.4074 39.9042)
POINT(116.4074 39.9042 100) // 带高度
LINESTRING(116.4074 39.9042, 116.4084 39.9052, 116.4094 39.9062)
POLYGON((116.4074 39.9042, 116.4084 39.9042, 116.4084 39.9052, 116.4074 39.9042))
```

### WFS 加载

从 WFS (Web Feature Service) 服务加载数据。

```typescript
import { loadWFSLayer } from '@auto-cesium/plugins'

const layerId = await loadWFSLayer(
  dataLayer,
  {
    name: 'WFS图层',
    type: 'entity'
  },
  {
    url: 'https://example.com/geoserver/wfs',
    typeName: 'workspace:layer_name',
    version: '2.0.0',
    maxFeatures: 1000,
    cqlFilter: 'population > 100000', // CQL 过滤器
    bbox: [116.0, 39.0, 117.0, 40.0], // 边界框过滤
    outputFormat: 'application/json',
    srsName: 'EPSG:4326'
  }
)
```

**WFS 配置参数**：

- `url`: WFS 服务地址
- `typeName`: 图层名称（必需）
- `version`: WFS 版本（1.0.0、1.1.0、2.0.0）
- `maxFeatures`: 最大要素数量
- `cqlFilter`: CQL 过滤表达式
- `bbox`: 边界框 [minx, miny, maxx, maxy]
- `outputFormat`: 输出格式
- `srsName`: 坐标系

### KML/KMZ 加载

加载 KML 或 KMZ 文件（使用 Cesium 原生 DataSource）。

```typescript
import { loadKMLLayer } from '@auto-cesium/plugins'

// KML 文件
await loadKMLLayer(dataLayer, 'KML图层', '/data/regions.kml')

// KMZ 文件
await loadKMLLayer(dataLayer, 'KMZ图层', '/data/regions.kmz')
```

**注意**：KML/KMZ 使用 Cesium 原生 KmlDataSource，不通过 DataLayerPlugin 的图层系统，而是直接添加到 `viewer.dataSources`。

### 渐变色应用

为图层数据应用渐变色，根据数据值自动着色。

```typescript
import { applyLayerGradient, GRADIENT_PRESETS } from '@auto-cesium/plugins'

// 使用预设渐变色
applyLayerGradient(dataLayer, layerId, {
  field: 'population', // 数据字段名
  colors: GRADIENT_PRESETS.rainbow, // 预设渐变色
  autoRange: true // 自动计算数值范围
})

// 自定义渐变色
applyLayerGradient(dataLayer, layerId, {
  field: 'temperature',
  colors: [
    Cesium.Color.BLUE, // 低值
    Cesium.Color.GREEN,
    Cesium.Color.YELLOW,
    Cesium.Color.RED // 高值
  ],
  range: [0, 100] // 手动指定范围
})
```

**预设渐变色**：

```typescript
GRADIENT_PRESETS = {
  rainbow: [...], // 彩虹色
  heatmap: [...], // 热力图
  blueToRed: [...], // 蓝到红
  greenToRed: [...], // 绿到红
  grayscale: [...] // 灰度
}
```

### 数据加载器使用建议

| 格式      | 适用场景      | 性能       | 依赖  |
| --------- | ------------- | ---------- | ----- |
| GeoJSON   | 通用、Web友好 | ⭐⭐⭐⭐   | 无    |
| CSV       | 简单点位数据  | ⭐⭐⭐⭐⭐ | 无    |
| Excel     | Excel数据导出 | ⭐⭐⭐     | xlsx  |
| Shapefile | GIS标准格式   | ⭐⭐⭐     | shpjs |
| WKT       | 数据库导出    | ⭐⭐⭐⭐⭐ | 无    |
| WFS       | 实时GIS服务   | ⭐⭐⭐     | 无    |
| KML/KMZ   | Google Earth  | ⭐⭐⭐⭐   | 无    |

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
    'point.pixelSize': (item) => (item.value > 150 ? 15 : 10),
    'point.color': (item) => (item.value > 150 ? Cesium.Color.RED : Cesium.Color.BLUE)
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
      return item.status === 'active' ? Cesium.Color.GREEN.withAlpha(0.5) : Cesium.Color.RED.withAlpha(0.5)
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
  position: [116 + Math.random() * 0.5, 39 + Math.random() * 0.5, 0] as [number, number, number],
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
    position: [116.4074 + Math.random() * 0.01, 39.9042 + Math.random() * 0.01, 0],
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
    position: [116.4074 + Math.random() * 0.1, 39.9042 + Math.random() * 0.1, 0],
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

    layerIds.forEach((id) => {
      const layer = this.dataLayer.getLayer(id)
      layer?.setShow(true)
    })
  }

  hideGroup(groupName: string) {
    const layerIds = this.groups.get(groupName)
    if (!layerIds) return

    layerIds.forEach((id) => {
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

## 综合示例：数据加载 + 聚合 + 弹窗

结合数据加载器、聚合和弹窗功能的完整示例。

```typescript
import { AutoViewer } from '@auto-cesium/core'
import {
  DataLayerPlugin,
  loadGeoJSONLayer,
  loadCSVLayer,
  loadExcelLayer,
  applyLayerGradient,
  GRADIENT_PRESETS
} from '@auto-cesium/plugins'

const viewer = new AutoViewer(cesiumViewer)
const dataLayer = viewer.use(DataLayerPlugin)

// 示例 1：从 GeoJSON 加载带聚合的区域数据
async function loadRegions() {
  const layerId = await loadGeoJSONLayer(
    dataLayer,
    {
      name: '行政区域',
      type: 'entity',
      clustering: {
        enabled: true,
        pixelRange: 80,
        minimumClusterSize: 3,
        showLabels: true
      },
      popup: {
        enabled: true,
        title: '区域信息',
        fields: [
          { field: 'name', label: '名称' },
          {
            field: 'population',
            label: '人口',
            formatter: (v) => `${v.toLocaleString()} 人`
          },
          {
            field: 'area',
            label: '面积',
            formatter: (v) => `${v.toFixed(2)} km²`
          }
        ]
      }
    },
    {
      url: '/data/regions.geojson',
      fill: Cesium.Color.BLUE.withAlpha(0.5),
      stroke: Cesium.Color.BLACK,
      strokeWidth: 2
    }
  )

  // 应用渐变色
  applyLayerGradient(dataLayer, layerId, {
    field: 'population',
    colors: GRADIENT_PRESETS.heatmap,
    autoRange: true
  })

  // 飞行到图层
  const layer = dataLayer.getLayer(layerId)
  await layer.flyTo()
}

// 示例 2：从 CSV 加载带聚合的点位数据
async function loadPOIs() {
  const layerId = await loadCSVLayer(
    dataLayer,
    {
      name: 'POI点位',
      type: 'entity',
      clustering: {
        enabled: true,
        pixelRange: 60,
        minimumClusterSize: 2
      },
      popup: {
        enabled: true,
        content: (item) => `
          <div style="padding: 15px; min-width: 200px;">
            <h3 style="margin: 0 0 10px 0;">${item.data.name}</h3>
            <p><strong>类型:</strong> ${item.data.category}</p>
            <p><strong>评分:</strong> ${item.data.rating} ⭐</p>
            <p><strong>地址:</strong> ${item.data.address}</p>
          </div>
        `
      },
      onClick: (item) => {
        console.log('点击了POI:', item.data.name)
      }
    },
    {
      url: '/data/pois.csv',
      hasHeader: true,
      longitudeField: 'lon',
      latitudeField: 'lat',
      idField: 'id'
    }
  )

  // 根据类别设置不同的图标
  const layer = dataLayer.getLayer(layerId)
  const items = Array.from(layer.dataMap.values())

  items.forEach((item) => {
    layer.updateItem(item.id, {
      style: {
        icon: {
          image: `/icons/${item.data.category}.png`,
          scale: 1.0
        }
      }
    })
  })
}

// 示例 3：从 Excel 加载大量数据并启用聚合
async function loadMassiveData() {
  const layerId = await loadExcelLayer(
    dataLayer,
    {
      name: '海量数据',
      type: 'primitive', // 使用 Primitive 模式提高性能
      clustering: {
        enabled: true,
        pixelRange: 50,
        minimumClusterSize: 10
      }
    },
    {
      url: '/data/massive.xlsx',
      sheet: 0,
      startRow: 1,
      longitudeField: 'longitude',
      latitudeField: 'latitude',
      heightField: 'height'
    }
  )

  console.log(`加载了 ${dataLayer.getLayer(layerId).dataMap.size} 条数据`)
}

// 示例 4：多图层管理
async function multiLayerDemo() {
  // 加载多个图层
  const layer1 = await loadGeoJSONLayer(dataLayer, { name: '省界', type: 'entity' }, { url: '/data/provinces.geojson' })

  const layer2 = await loadCSVLayer(
    dataLayer,
    { name: '城市', type: 'entity', clustering: { enabled: true } },
    { url: '/data/cities.csv', longitudeField: 'lon', latitudeField: 'lat' }
  )

  // 图层控制
  setTimeout(() => {
    dataLayer.getLayer(layer1)?.setShow(false) // 隐藏省界
  }, 5000)

  setTimeout(() => {
    dataLayer.getLayer(layer1)?.setShow(true) // 显示省界
  }, 10000)

  // 移除图层
  setTimeout(() => {
    dataLayer.removeLayer(layer2) // 移除城市图层
  }, 15000)
}

// 运行示例
loadRegions()
loadPOIs()
loadMassiveData()
```

## 最佳实践总结

### 数据量级与模式选择

| 数据量     | 推荐模式         | 是否聚合 | 配置建议                                |
| ---------- | ---------------- | -------- | --------------------------------------- |
| < 100      | Entity           | 否       | 完整交互功能                            |
| 100-1000   | Entity           | 是       | pixelRange: 60-80                       |
| 1000-10000 | Entity/Primitive | 是       | pixelRange: 80-100                      |
| > 10000    | Primitive        | 是       | pixelRange: 50, minimumClusterSize: 10+ |

### 性能优化技巧

1. **使用合适的渲染模式**：大数据量使用 Primitive 模式
2. **启用聚合**：减少同时渲染的对象数量
3. **及时清理**：不需要的图层及时 `removeLayer()`
4. **分批加载**：大数据集分批次加载和添加
5. **按需加载**：根据视野范围动态加载数据

### 格式选择建议

- **前端可视化**：优先使用 GeoJSON
- **数据库导出**：使用 WKT 或 CSV
- **Excel 数据**：直接使用 Excel 加载器
- **GIS 标准**：使用 Shapefile 或 WFS
- **Google Earth**：使用 KML/KMZ

DataLayerPlugin 提供了完整的数据图层管理能力，支持多种数据格式、强大的聚合功能和丰富的交互特性，适用于各种数据可视化场景，从简单的点位展示到复杂的海量数据渲染都能很好地支持。
