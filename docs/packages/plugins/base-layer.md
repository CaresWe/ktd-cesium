# BaseLayerPlugin

瓦片底图管理插件，支持 **XYZ、TMS、WMS、WMTS、ArcGIS MapServer** 等多种瓦片服务，内置**天地图、高德、腾讯、百度、星图地球、超图**等国内外地图服务商的预设配置，提供完善的图层管理功能。

## 导入

```typescript
import { BaseLayerPlugin } from '@ktd-cesium/plugins'
import {
  CoordinateSystem,
  CoordinateOffset,
  TiandituLayerType,
  AmapLayerType,
  TencentLayerType,
  BaiduLayerType,
  GeovisLayerType,
  SuperMapLayerType
} from '@ktd-cesium/plugins'
```

## 核心特性

- **多种瓦片服务类型**：XYZ、TMS、WMS、WMTS、ArcGIS MapServer
- **国内外地图预设**：天地图、高德、腾讯、百度、星图地球、超图
- **多坐标系支持**：WGS84、EPSG3857、CGCS2000（大地2000）
- **坐标偏移纠正**：内置 GCJ-02、BD-09 偏移处理，配合 `coordinateOffset` 快速对齐国内瓦片
- **图层管理**：显示/隐藏、透明度、亮度、对比度控制
- **图层排序**：支持图层上移、下移、置顶、置底
- **批量操作**：批量添加、移除图层

## 安装

```typescript
import { KtdViewer } from '@ktd-cesium/core'
import { BaseLayerPlugin } from '@ktd-cesium/plugins'

const viewer = new KtdViewer(cesiumViewer)
const baseLayer = viewer.use(BaseLayerPlugin)
```

## API - 瓦片服务类型

### addXYZ(id, options)

添加 XYZ 标准金字塔瓦片图层。

```typescript
const layer = baseLayer.addXYZ('osm', {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  subdomains: ['a', 'b', 'c'],
  minimumLevel: 0,
  maximumLevel: 19,
  rectangle: [west, south, east, north],  // 可选：限制显示区域
  coordinateSystem: CoordinateSystem.EPSG3857,
  alpha: 1.0,
  brightness: 1.0,
  contrast: 1.0,
  show: true,
  index: 0
})

// GCJ-02 偏移的高德底图
baseLayer.addXYZ('amap', {
  url: 'https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&style=7',
  subdomains: ['1', '2', '3', '4'],
  maximumLevel: 18,
  coordinateOffset: CoordinateOffset.GCJ02
})

// 百度 BD-09 偏移瓦片
baseLayer.addXYZ('baidu', {
  url: 'https://example.com/baidu/{z}/{x}/{y}.png',
  coordinateOffset: CoordinateOffset.BD09
})
```

**参数说明：**
- `id`: 图层唯一标识
- `url`: 瓦片 URL 模板，支持 `{z}`、`{x}`、`{y}`、`{s}` 占位符
- `subdomains`: 子域名数组（可选）
- `minimumLevel`/`maximumLevel`: 最小/最大缩放级别
- `rectangle`: 显示区域 `[west, south, east, north]`（度数）
- `coordinateSystem`: 坐标系统
- `coordinateOffset`: 坐标偏移模式（`NONE`、`GCJ02`、`BD09`）
- `alpha`: 透明度 (0-1)
- `brightness`: 亮度
- `contrast`: 对比度
- `show`: 是否显示
- `index`: 图层索引位置

### addTMS(id, options)

添加 TMS 瓦片图层（Y 轴反向）。

```typescript
const layer = baseLayer.addTMS('tms-layer', {
  url: 'https://example.com/tms/{z}/{x}/{y}.png',
  coordinateSystem: CoordinateSystem.WGS84,
  maximumLevel: 18
})
```

### addWMS(id, options)

添加 WMS 图层（Web Map Service）。

```typescript
const layer = baseLayer.addWMS('wms-layer', {
  url: 'https://example.com/wms',
  layers: 'layer1,layer2',
  version: '1.3.0',
  format: 'image/png',
  transparent: true,
  crs: 'EPSG:4326',
  styles: 'default'
})
```

### addWMTS(id, options)

添加 WMTS 图层（Web Map Tile Service）。

```typescript
const layer = baseLayer.addWMTS('wmts-layer', {
  url: 'https://example.com/wmts',
  layer: 'layer_id',
  style: 'default',
  tileMatrixSetID: 'GoogleMapsCompatible',
  format: 'image/png',
  tileMatrixLabels: ['0', '1', '2', ...]  // 可选
})
```

### addArcGIS(id, options)

添加 ArcGIS MapServer 图层。

```typescript
const layer = baseLayer.addArcGIS('arcgis-layer', {
  url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
  enablePickFeatures: false,
  layers: '0,1,2'  // 可选：指定图层
})
```

## API - 国内地图服务预设

### addTianditu(id, options)

添加天地图图层。

```typescript
import { TiandituLayerType } from '@ktd-cesium/plugins'

// 影像底图
baseLayer.addTianditu('tdt-img', {
  token: 'your_tianditu_token',
  layerType: TiandituLayerType.IMG,
  projection: 'EPSG:4326'  // 'EPSG:4326' 或 'EPSG:3857'
})

// 矢量底图
baseLayer.addTianditu('tdt-vec', {
  token: 'your_tianditu_token',
  layerType: TiandituLayerType.VEC
})

// 地形底图
baseLayer.addTianditu('tdt-ter', {
  token: 'your_tianditu_token',
  layerType: TiandituLayerType.TER
})

// 影像标注（叠加在影像上）
baseLayer.addTianditu('tdt-cia', {
  token: 'your_tianditu_token',
  layerType: TiandituLayerType.CIA
})

// 矢量标注（叠加在矢量上）
baseLayer.addTianditu('tdt-cva', {
  token: 'your_tianditu_token',
  layerType: TiandituLayerType.CVA
})
```

**天地图图层类型：**
- `IMG`: 影像底图
- `VEC`: 矢量底图
- `TER`: 地形底图
- `CIA`: 影像标注
- `CVA`: 矢量标注
- `CTA`: 地形标注

### addAmap(id, options)

添加高德地图图层。

```typescript
import { AmapLayerType } from '@ktd-cesium/plugins'

// 矢量地图
baseLayer.addAmap('amap-vector', {
  layerType: AmapLayerType.VECTOR
})

// 卫星影像
baseLayer.addAmap('amap-satellite', {
  layerType: AmapLayerType.SATELLITE
})

// 路网图（叠加在卫星图上）
baseLayer.addAmap('amap-road', {
  layerType: AmapLayerType.ROAD
})
```

**高德地图图层类型：**
- `VECTOR`: 矢量地图
- `SATELLITE`: 卫星影像
- `ROAD`: 路网标注

### addTencent(id, options)

添加腾讯地图图层。

```typescript
import { TencentLayerType } from '@ktd-cesium/plugins'

// 矢量地图
baseLayer.addTencent('tencent-vector', {
  layerType: TencentLayerType.VECTOR
})

// 卫星影像
baseLayer.addTencent('tencent-satellite', {
  layerType: TencentLayerType.SATELLITE
})

// 地形图
baseLayer.addTencent('tencent-terrain', {
  layerType: TencentLayerType.TERRAIN
})
```

### addBaidu(id, options)

添加百度地图图层。

```typescript
import { BaiduLayerType } from '@ktd-cesium/plugins'

// 普通地图
baseLayer.addBaidu('baidu-normal', {
  layerType: BaiduLayerType.NORMAL
})

// 卫星影像
baseLayer.addBaidu('baidu-satellite', {
  layerType: BaiduLayerType.SATELLITE
})

// 深色主题
baseLayer.addBaidu('baidu-midnight', {
  layerType: BaiduLayerType.MIDNIGHT
})
```

**百度地图图层类型：**
- `NORMAL`: 普通地图
- `SATELLITE`: 卫星影像
- `TRAFFIC`: 实时交通
- `MIDNIGHT`: 深色主题

### addGeovis(id, options)

添加星图地球图层。

```typescript
import { GeovisLayerType } from '@ktd-cesium/plugins'

baseLayer.addGeovis('geovis-img', {
  token: 'your_geovis_token',
  layerType: GeovisLayerType.SATELLITE
})
```

### addSuperMap(id, options)

添加超图地图图层。

```typescript
import { SuperMapLayerType } from '@ktd-cesium/plugins'

baseLayer.addSuperMap('supermap-layer', {
  url: 'https://your-supermap-server.com/iserver/services',
  layerType: SuperMapLayerType.VECTOR,
  layerName: 'your_layer_name'
})
```

## API - 图层管理

### removeLayer(id)

移除指定图层。

```typescript
baseLayer.removeLayer('layer-id')
```

### getLayer(id)

获取图层实例。

```typescript
const layer = baseLayer.getLayer('layer-id')
```

### setLayerVisible(id, visible)

设置图层可见性。

```typescript
baseLayer.setLayerVisible('layer-id', false)  // 隐藏
baseLayer.setLayerVisible('layer-id', true)   // 显示
```

### setLayerAlpha(id, alpha)

设置图层透明度。

```typescript
baseLayer.setLayerAlpha('layer-id', 0.5)  // 50% 透明
```

### setLayerBrightness(id, brightness)

设置图层亮度。

```typescript
baseLayer.setLayerBrightness('layer-id', 1.5)  // 增加亮度
```

### setLayerContrast(id, contrast)

设置图层对比度。

```typescript
baseLayer.setLayerContrast('layer-id', 1.2)  // 增加对比度
```

### moveLayer(id, index)

移动图层到指定位置。

```typescript
baseLayer.moveLayer('layer-id', 0)  // 移到最底层
```

### raiseLayer(id)

向上移动一层。

```typescript
baseLayer.raiseLayer('layer-id')
```

### lowerLayer(id)

向下移动一层。

```typescript
baseLayer.lowerLayer('layer-id')
```

### raiseLayerToTop(id)

移到最顶层。

```typescript
baseLayer.raiseLayerToTop('layer-id')
```

### lowerLayerToBottom(id)

移到最底层。

```typescript
baseLayer.lowerLayerToBottom('layer-id')
```

### clearAll()

清除所有图层。

```typescript
baseLayer.clearAll()
```

### getAllLayerIds()

获取所有图层 ID。

```typescript
const ids = baseLayer.getAllLayerIds()
// ['layer-1', 'layer-2', ...]
```

### getLayerCount()

获取图层数量。

```typescript
const count = baseLayer.getLayerCount()
```

## 坐标系统

```typescript
import { CoordinateSystem } from '@ktd-cesium/plugins'

CoordinateSystem.WGS84      // WGS84 地理坐标系 (EPSG:4326)
CoordinateSystem.EPSG3857   // Web 墨卡托投影 (Google/OSM)
CoordinateSystem.CGCS2000   // 中国大地2000坐标系
```

## 坐标偏移

```typescript
import { CoordinateOffset } from '@ktd-cesium/plugins'

CoordinateOffset.NONE   // 无偏移，标准 WGS84/CGCS2000
CoordinateOffset.GCJ02  // 国测局偏移（高德、腾讯、天地图等）
CoordinateOffset.BD09   // 百度偏移
```

- `coordinateOffset` 由 BaseLayerPlugin 统一处理，内部调用 shared 包的转换工具，无需手动改写 URL。
- 如果瓦片服务本身输出 WGS84/3857，则保持 `CoordinateOffset.NONE`（默认值）。
- 当同一场景混合多家国内地图时，可为底图/标注分别设置偏移，避免出现错位。

## 使用场景

### 场景 1：天地图完整配置

```typescript
// 1. 添加影像底图
const imgLayer = baseLayer.addTianditu('tdt-img', {
  token: 'your_token',
  layerType: TiandituLayerType.IMG,
  projection: 'EPSG:4326'
})

// 2. 添加影像标注（叠加在影像上）
const ciaLayer = baseLayer.addTianditu('tdt-cia', {
  token: 'your_token',
  layerType: TiandituLayerType.CIA,
  projection: 'EPSG:4326'
})

// 调整标注透明度
baseLayer.setLayerAlpha('tdt-cia', 0.8)
```

### 场景 2：高德+腾讯混合

```typescript
// 底图：高德卫星
baseLayer.addAmap('amap-sat', {
  layerType: AmapLayerType.SATELLITE
})

// 叠加：腾讯路网
baseLayer.addTencent('tencent-road', {
  layerType: TencentLayerType.ROAD,
  alpha: 0.7  // 半透明
})
```

### 场景 3：区域限制图层

```typescript
// 只在中国区域显示
baseLayer.addXYZ('china-layer', {
  url: 'https://example.com/{z}/{x}/{y}.png',
  rectangle: [73, 18, 135, 53],  // 中国大致范围
  maximumLevel: 18
})
```

### 场景 4：图层切换器（完整版）

```vue
<template>
  <div>
    <div ref="containerRef" class="map-container"></div>
    <div class="layer-controls">
      <div class="layer-switcher">
        <button
          v-for="layer in baseLayers"
          :key="layer.id"
          :class="{ active: currentLayer === layer.id }"
          @click="switchBaseLayer(layer)"
        >
          {{ layer.name }}
        </button>
      </div>
      <div class="layer-options" v-if="currentLayerId">
        <label>
          透明度:
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            v-model="opacity"
            @input="updateOpacity"
          />
          {{ opacity }}
        </label>
        <label>
          <input type="checkbox" v-model="visible" @change="toggleVisibility" />
          显示图层
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { KtdViewer } from '@ktd-cesium/core'
import { BaseLayerPlugin, TiandituLayerType, AmapLayerType } from '@ktd-cesium/plugins'
import * as Cesium from 'cesium'

const containerRef = ref<HTMLElement>()
const currentLayerId = ref('')
const currentLayer = ref('')
const opacity = ref(1)
const visible = ref(true)

let viewer: KtdViewer
let baseLayer: BaseLayerPlugin

const baseLayers = [
  { id: 'tdt-img', name: '天地图影像', type: 'tianditu', layerType: TiandituLayerType.IMG },
  { id: 'tdt-vec', name: '天地图矢量', type: 'tianditu', layerType: TiandituLayerType.VEC },
  { id: 'amap-sat', name: '高德卫星', type: 'amap', layerType: AmapLayerType.SATELLITE },
  { id: 'amap-vec', name: '高德矢量', type: 'amap', layerType: AmapLayerType.VECTOR }
]

onMounted(() => {
  if (containerRef.value) {
    const cesiumViewer = new Cesium.Viewer(containerRef.value)
    viewer = new KtdViewer(cesiumViewer)
    baseLayer = viewer.use(BaseLayerPlugin)

    // 默认图层
    switchBaseLayer(baseLayers[0])
  }
})

onBeforeUnmount(() => {
  viewer?.destroy()
})

function switchBaseLayer(layer: any) {
  // 清除所有图层
  baseLayer.clearAll()

  // 添加新图层
  if (layer.type === 'tianditu') {
    baseLayer.addTianditu(layer.id, {
      token: 'your_token',
      layerType: layer.layerType
    })
  } else if (layer.type === 'amap') {
    baseLayer.addAmap(layer.id, {
      layerType: layer.layerType
    })
  }

  currentLayerId.value = layer.id
  currentLayer.value = layer.id
  opacity.value = 1
  visible.value = true
}

function updateOpacity() {
  if (currentLayerId.value) {
    baseLayer.setLayerAlpha(currentLayerId.value, opacity.value)
  }
}

function toggleVisibility() {
  if (currentLayerId.value) {
    baseLayer.setLayerVisible(currentLayerId.value, visible.value)
  }
}
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 600px;
}

.layer-controls {
  margin-top: 10px;
}

.layer-switcher {
  margin-bottom: 10px;
}

.layer-switcher button {
  margin-right: 10px;
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
}

.layer-switcher button.active {
  background: #007bff;
  color: white;
}

.layer-options label {
  display: block;
  margin: 5px 0;
}
</style>
```

### 场景 5：WMS 服务

```typescript
// GeoServer WMS 服务
baseLayer.addWMS('geoserver-layer', {
  url: 'https://your-geoserver.com/geoserver/wms',
  layers: 'workspace:layer_name',
  version: '1.3.0',
  format: 'image/png',
  transparent: true,
  crs: 'EPSG:4326',
  styles: 'default'
})
```

### 场景 6：图层效果调整

```typescript
const layerId = baseLayer.addTianditu('tdt-img', {
  token: 'your_token',
  layerType: TiandituLayerType.IMG
})

// 降低亮度（夜间模式）
baseLayer.setLayerBrightness(layerId, 0.6)

// 增加对比度
baseLayer.setLayerContrast(layerId, 1.3)

// 半透明
baseLayer.setLayerAlpha(layerId, 0.7)
```

### 场景 7：多图层管理

```typescript
class LayerManager {
  private baseLayer: BaseLayerPlugin
  private layers: Map<string, any> = new Map()

  constructor(viewer: KtdViewer) {
    this.baseLayer = viewer.use(BaseLayerPlugin)
  }

  addLayer(config: any) {
    const layer = this.baseLayer.addXYZ(config.id, config)
    this.layers.set(config.id, { config, layer })
    return layer
  }

  removeLayer(id: string) {
    this.baseLayer.removeLayer(id)
    this.layers.delete(id)
  }

  showOnly(id: string) {
    // 隐藏所有图层
    for (const layerId of this.layers.keys()) {
      this.baseLayer.setLayerVisible(layerId, false)
    }
    // 只显示指定图层
    this.baseLayer.setLayerVisible(id, true)
  }

  getAllLayers() {
    return Array.from(this.layers.keys())
  }
}
```

### 场景 8：国内偏移瓦片对齐

```typescript
import { CoordinateOffset } from '@ktd-cesium/plugins'

// 高德底图（GCJ-02）
baseLayer.addXYZ('amap-base', {
  url: 'https://wprd0{s}.is.autonavi.com/appmaptile?style=7&x={x}&y={y}&z={z}',
  subdomains: ['1', '2', '3', '4'],
  maximumLevel: 18,
  coordinateOffset: CoordinateOffset.GCJ02
})

// 百度路网（BD-09），叠加并半透明
baseLayer.addXYZ('baidu-road', {
  url: 'https://example.com/baidu-road/{z}/{x}/{y}.png',
  coordinateOffset: CoordinateOffset.BD09,
  alpha: 0.6
})

// 只需设置 coordinateOffset，插件会自动完成地理配准
```

### 场景 9：WMTS 行政区切换

```typescript
const wmtsConfig = {
  url: 'https://example.com/wmts',
  tileMatrixSetID: 'GoogleMapsCompatible',
  format: 'image/png'
}

const shanghai = baseLayer.addWMTS('wmts-sh', {
  ...wmtsConfig,
  layer: 'Shanghai',
  style: 'default',
  rectangle: [120.8, 30.6, 122.2, 31.6]
})

const hangzhou = baseLayer.addWMTS('wmts-hz', {
  ...wmtsConfig,
  layer: 'Hangzhou',
  style: 'default',
  rectangle: [118.4, 29.0, 121.0, 30.8],
  show: false
})

function switchCity(id: 'wmts-sh' | 'wmts-hz') {
  baseLayer.setLayerVisible('wmts-sh', id === 'wmts-sh')
  baseLayer.setLayerVisible('wmts-hz', id === 'wmts-hz')
  baseLayer.raiseLayerToTop(id) // 切换时置顶，避免被其他叠加层遮挡
}
```

## 注意事项

1. **Token 获取**：
   - 天地图：https://console.tianditu.gov.cn/
   - 星图地球：https://www.geovisearth.com/

2. **坐标系选择**：
   - 天地图、超图：支持 WGS84 和 Web 墨卡托
   - 高德、腾讯、百度：使用 GCJ-02 偏移坐标系
   - OpenStreetMap：Web 墨卡托 (EPSG:3857)

3. **图层顺序**：
   - 后添加的图层在上层
   - 使用 `raiseLayer`/`lowerLayer` 调整顺序
   - 标注图层应在底图上方

4. **性能优化**：
   - 避免同时加载过多图层
   - 设置合理的 `minimumLevel` 和 `maximumLevel`
   - 使用 `rectangle` 限制显示区域

5. **HTTPS 要求**：
   - 现代浏览器要求瓦片服务使用 HTTPS
   - 确保 URL 使用 `https://`

6. **跨域问题**：
   - 某些服务器可能需要配置 CORS
   - 使用代理服务器解决跨域问题
