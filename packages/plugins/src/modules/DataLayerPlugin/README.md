# DataLayerPlugin 数据加载器

DataLayerPlugin 现已支持多种数据格式的加载和显示，包括 GeoJSON、CSV、Shapefile、Excel、KML/KMZ、WKT 和 WFS。

## 功能特性

### 1. GeoJSON 支持

```typescript
import { loadGeoJSONLayer, loadGeoJSONNative } from '@auto-cesium/plugins'

// 方式 1: 使用 DataLayerPlugin 加载（可自定义样式）
const layerId = await loadGeoJSONLayer(
  dataLayerPlugin,
  {
    name: 'GeoJSON 图层',
    type: 'entity'
  },
  {
    url: 'https://example.com/data.geojson',
    fill: Color.BLUE.withAlpha(0.5),
    stroke: Color.BLACK,
    strokeWidth: 2,
    markerColor: Color.RED,
    markerSize: 10,
    clampToGround: true
  }
)

// 方式 2: 使用 Cesium 原生 DataSource（性能更好）
await loadGeoJSONNative(dataLayerPlugin, 'GeoJSON 图层', {
  url: 'https://example.com/data.geojson'
})
```

### 2. CSV 支持

```typescript
import { loadCSVLayer } from '@auto-cesium/plugins'

const layerId = await loadCSVLayer(
  dataLayerPlugin,
  {
    name: 'CSV 数据',
    type: 'entity'
  },
  {
    url: 'https://example.com/data.csv',
    longitudeField: 'lon',
    latitudeField: 'lat',
    heightField: 'height', // 可选
    idField: 'id', // 可选
    delimiter: ',',
    hasHeader: true
  }
)
```

### 3. WKT (Well-Known Text) 支持

```typescript
import { loadWKTLayer, parseWKT } from '@auto-cesium/plugins'

// 加载 WKT 数据
const layerId = loadWKTLayer(
  dataLayerPlugin,
  {
    name: 'WKT 数据',
    type: 'entity'
  },
  {
    wkt: [
      'POINT(116.404 39.915)',
      'LINESTRING(116.404 39.915, 121.473 31.230)',
      'POLYGON((116.404 39.915, 121.473 31.230, 113.665 34.758, 116.404 39.915))'
    ],
    properties: [{ name: '北京' }, { name: '京沪线' }, { name: '三角区' }]
  }
)
```

### 4. WFS (Web Feature Service) 支持

```typescript
import { loadWFSLayer } from '@auto-cesium/plugins'

const layerId = await loadWFSLayer(
  dataLayerPlugin,
  {
    name: 'WFS 图层',
    type: 'entity'
  },
  {
    url: 'https://example.com/geoserver/wfs',
    typeName: 'workspace:layer_name',
    version: '2.0.0',
    maxFeatures: 1000,
    cqlFilter: 'population > 1000000',
    bbox: [110, 30, 120, 40], // [minx, miny, maxx, maxy]
    outputFormat: 'application/json'
  }
)
```

### 5. KML/KMZ 支持

```typescript
import { loadKMLLayer } from '@auto-cesium/plugins'

// KML/KMZ 使用 Cesium 原生 DataSource
await loadKMLLayer(dataLayerPlugin, 'KML 图层', 'https://example.com/data.kml')
```

### 6. Excel 支持

**注意**: Excel 支持需要安装第三方库 `xlsx`

```bash
npm install xlsx
```

```typescript
import { loadExcelLayer } from '@auto-cesium/plugins'

const layerId = await loadExcelLayer(
  dataLayerPlugin,
  {
    name: 'Excel 数据',
    type: 'entity'
  },
  {
    url: 'https://example.com/data.xlsx',
    sheet: 0, // 工作表索引或名称
    longitudeField: 'longitude',
    latitudeField: 'latitude',
    heightField: 'altitude',
    idField: 'id',
    startRow: 1 // 跳过表头
  }
)
```

### 7. Shapefile 支持

**注意**: Shapefile 支持需要安装第三方库 `shpjs`

```bash
npm install shpjs
```

```typescript
import { loadShapefileLayer } from '@auto-cesium/plugins'

// 方式 1: 从单独的文件加载
const layerId = await loadShapefileLayer(
  dataLayerPlugin,
  {
    name: 'Shapefile 图层',
    type: 'entity'
  },
  {
    shpUrl: 'https://example.com/data.shp',
    dbfUrl: 'https://example.com/data.dbf',
    prjUrl: 'https://example.com/data.prj' // 可选
  }
)

// 方式 2: 从 ZIP 文件加载
const layerId2 = await loadShapefileLayer(
  dataLayerPlugin,
  {
    name: 'Shapefile ZIP',
    type: 'entity'
  },
  {
    url: 'https://example.com/shapefile.zip'
  }
)
```

## 渐变行政区域面

### 基本用法

```typescript
import { applyLayerGradient, GRADIENT_PRESETS } from '@auto-cesium/plugins'
import { Color } from 'cesium'

// 1. 加载行政区域数据（GeoJSON）
const layerId = await loadGeoJSONLayer(
  dataLayerPlugin,
  {
    name: '中国省份',
    type: 'entity'
  },
  {
    url: 'https://example.com/china-provinces.geojson'
  }
)

// 2. 应用渐变色
applyLayerGradient(dataLayerPlugin, layerId, {
  field: 'population', // 数据字段名
  colors: GRADIENT_PRESETS.heatmap, // 使用预设渐变
  autoRange: true // 自动计算数值范围
})

// 或使用自定义渐变色
applyLayerGradient(dataLayerPlugin, layerId, {
  field: 'gdp',
  colors: [Color.GREEN, Color.YELLOW, Color.RED],
  range: [0, 100000] // 指定范围
})
```

### 预设渐变色方案

```typescript
import { GRADIENT_PRESETS } from '@auto-cesium/plugins'

// 可用的预设方案：
GRADIENT_PRESETS.heatmap // 红黄绿（热力图）
GRADIENT_PRESETS.temperature // 蓝白红（温度）
GRADIENT_PRESETS.ocean // 蓝绿（海洋）
GRADIENT_PRESETS.terrain // 绿黄棕（地形）
GRADIENT_PRESETS.rainbow // 彩虹色
GRADIENT_PRESETS.blues // 单色渐变 - 蓝色
GRADIENT_PRESETS.greens // 单色渐变 - 绿色
GRADIENT_PRESETS.reds // 单色渐变 - 红色
```

### 完整示例：中国省份人口热力图

```typescript
import { loadGeoJSONLayer, applyLayerGradient, GRADIENT_PRESETS } from '@auto-cesium/plugins'

// 加载省份边界
const layerId = await loadGeoJSONLayer(
  dataLayerPlugin,
  {
    name: '中国省份人口',
    type: 'entity',
    defaultStyle: {
      polygon: {
        outline: true,
        outlineColor: Color.WHITE,
        outlineWidth: 2,
        extrudedHeight: 50000 // 可选：拉伸高度
      }
    }
  },
  {
    url: '/data/china-provinces.geojson'
  }
)

// 应用人口数据渐变
applyLayerGradient(dataLayerPlugin, layerId, {
  field: 'properties.population', // GeoJSON properties 中的字段
  colors: GRADIENT_PRESETS.heatmap,
  autoRange: true
})

// 飞到图层
const layer = dataLayerPlugin.getLayer(layerId)
await layer?.flyTo()
```

## 数据格式说明

### GeoJSON 格式

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [116.404, 39.915]
      },
      "properties": {
        "name": "北京",
        "population": 21540000
      }
    }
  ]
}
```

### CSV 格式

```csv
id,name,longitude,latitude,height,population
1,北京,116.404,39.915,0,21540000
2,上海,121.473,31.230,0,24280000
```

### WKT 格式

```
POINT(116.404 39.915)
LINESTRING(116.404 39.915, 121.473 31.230)
POLYGON((116.404 39.915, 121.473 31.230, 113.665 34.758, 116.404 39.915))
```

## 性能建议

1. **大数据量**: 对于超过10000个点的数据，建议使用 `primitive` 类型而不是 `entity`
2. **GeoJSON**: 对于复杂的 GeoJSON，使用 `loadGeoJSONNative` 可以获得更好的性能
3. **聚合**: 对于密集的点数据，启用聚合功能可以提升性能

```typescript
{
  type: 'primitive', // 使用 primitive 模式
  clustering: {
    enabled: true,
    pixelRange: 80,
    minimumClusterSize: 3
  }
}
```

## 错误处理

```typescript
try {
  const layerId = await loadGeoJSONLayer(plugin, config, options)
  console.log('图层加载成功:', layerId)
} catch (error) {
  console.error('图层加载失败:', error)
}
```

## 类型定义

所有的类型定义都可以从插件中导入：

```typescript
import type {
  GeoJSONLoadOptions,
  CSVLoadOptions,
  WKTLoadOptions,
  WFSLoadOptions,
  ExcelLoadOptions,
  ShapefileLoadOptions,
  GradientConfig
} from '@auto-cesium/plugins'
```
