# Cesium 工具

Cesium 工具模块提供了 GeoJSON 处理、样式配置、鼠标位置拾取等 Cesium 相关的工具函数。

## 导入

```typescript
import {
  StyleConfig,
  GeoJSONGeometry,
  GeoJSONFeature,
  removeGeoJsonDefVal,
  addGeoJsonDefVal,
  getDefStyle,
  getPositionByGeoJSON,
  formatPosition,
  getCurrentMousePosition,
  defConfigStyle
} from '@ktd-cesium/shared'
```

## API

### removeGeoJsonDefVal

移除 GeoJSON 中与默认值相同的属性。

**类型签名**

```typescript
function removeGeoJsonDefVal(geojson: GeoJSONFeature): GeoJSONFeature
```

**参数**

- `geojson`: GeoJSON Feature 对象

**返回值**

- `GeoJSONFeature`: 清理后的 GeoJSON Feature

**示例**

```typescript
import { removeGeoJsonDefVal } from '@ktd-cesium/shared'

const geojson = {
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [116.4, 39.9]
  },
  properties: {
    type: 'point',
    style: {
      pixelSize: 10, // 默认值
      color: '#ff0000' // 非默认值
    }
  }
}

// 移除默认值属性，只保留自定义样式
const cleaned = removeGeoJsonDefVal(geojson)
// properties.style 中只保留 color
```

### addGeoJsonDefVal

为 GeoJSON 属性添加默认值。

**类型签名**

```typescript
function addGeoJsonDefVal(properties: GeoJSONFeature['properties']): GeoJSONFeature['properties']
```

**参数**

- `properties`: GeoJSON Feature 的 properties

**返回值**

- 补充默认值后的 properties

**示例**

```typescript
import { addGeoJsonDefVal } from '@ktd-cesium/shared'

const properties = {
  type: 'point',
  style: {
    color: '#ff0000'
    // 缺少其他默认属性
  }
}

// 补充默认值
const filled = addGeoJsonDefVal(properties)
// properties.style 现在包含所有默认属性
```

### getDefStyle

获取默认样式。

**类型签名**

```typescript
function getDefStyle(type: string, style?: StyleConfig): StyleConfig
```

**参数**

- `type`: 图形类型（如 'point', 'polyline', 'polygon'）
- `style`: 自定义样式（可选）

**返回值**

- `StyleConfig`: 合并后的样式配置

**示例**

```typescript
import { getDefStyle } from '@ktd-cesium/shared'

// 获取点的默认样式
const defaultPointStyle = getDefStyle('point')

// 获取自定义样式（会合并默认值）
const customStyle = getDefStyle('point', {
  color: '#ff0000',
  pixelSize: 15
})
```

### getPositionByGeoJSON

根据 GeoJSON 获取位置。

**类型签名**

```typescript
function getPositionByGeoJSON(
  geojson: GeoJSONFeature | GeoJSONGeometry,
  defHeight?: number
): Cesium.Cartesian3 | Cesium.Cartesian3[] | null
```

**参数**

- `geojson`: GeoJSON Feature 或 Geometry 对象
- `defHeight`: 默认高度（可选）

**返回值**

- `Cesium.Cartesian3 | Cesium.Cartesian3[] | null`: 位置或位置数组，解析失败返回 null

**示例**

```typescript
import { getPositionByGeoJSON } from '@ktd-cesium/shared'

// Point
const pointGeoJSON = {
  type: 'Point',
  coordinates: [116.4, 39.9, 100]
}
const position = getPositionByGeoJSON(pointGeoJSON)
// Cesium.Cartesian3

// LineString
const lineGeoJSON = {
  type: 'LineString',
  coordinates: [
    [116.4, 39.9],
    [116.5, 39.9]
  ]
}
const positions = getPositionByGeoJSON(lineGeoJSON, 0)
// Cesium.Cartesian3[]

// Feature
const feature = {
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [116.4, 39.9]
  }
}
const pos = getPositionByGeoJSON(feature)
```

### formatPosition

格式化位置为可读格式。

**类型签名**

```typescript
function formatPosition(position: Cesium.Cartesian3): { x: number; y: number; z: number } | null
```

**参数**

- `position`: Cesium Cartesian3 位置

**返回值**

- `{ x: number; y: number; z: number } | null`: 格式化后的位置对象
  - `x`: 经度（度）
  - `y`: 纬度（度）
  - `z`: 高度（米）

**示例**

```typescript
import { formatPosition } from '@ktd-cesium/shared'

const position = Cesium.Cartesian3.fromDegrees(116.4074, 39.9042, 100)
const formatted = formatPosition(position)
// { x: 116.4074, y: 39.9042, z: 100 }
```

### getCurrentMousePosition

获取当前鼠标在 3D 场景中的位置。

**类型签名**

```typescript
function getCurrentMousePosition(
  scene: Cesium.Scene,
  position: Cesium.Cartesian2,
  noPickEntity?: unknown
): Cesium.Cartesian3 | undefined
```

**参数**

- `scene`: Cesium Scene
- `position`: 屏幕坐标（Cartesian2）
- `noPickEntity`: 排除的实体（可选）

**返回值**

- `Cesium.Cartesian3 | undefined`: 3D 场景中的位置

**示例**

```typescript
import { getCurrentMousePosition } from '@ktd-cesium/shared'

viewer.screenSpaceEventHandler.setInputAction((movement) => {
  const cartesian = getCurrentMousePosition(viewer.scene, movement.endPosition)

  if (cartesian) {
    console.log('鼠标位置:', cartesian)

    // 添加标记
    viewer.entities.add({
      position: cartesian,
      point: {
        pixelSize: 10,
        color: Cesium.Color.RED
      }
    })
  }
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
```

### defConfigStyle

默认样式配置对象，包含所有图形类型的默认样式。

**类型**

```typescript
const defConfigStyle: {
  [key: string]: StyleConfig
}
```

**支持的图形类型**

- `point`: 点
- `billboard`: 广告牌
- `label`: 标签
- `polyline`: 折线
- `polygon`: 多边形
- `rectangle`: 矩形
- `circle`: 圆形
- `ellipse`: 椭圆
- `model`: 模型
- `box`: 立方体
- `cylinder`: 圆柱
- `ellipsoid`: 椭球
- `wall`: 墙体
- `corridor`: 走廊
- 等等...

**示例**

```typescript
import { defConfigStyle } from '@ktd-cesium/shared'

// 获取点的默认样式
const pointStyle = defConfigStyle.point
// { pixelSize: 10, color: '#3388ff', opacity: 1, ... }

// 获取折线的默认样式
const polylineStyle = defConfigStyle.polyline
```

## 使用场景

### 场景 1：加载 GeoJSON 并创建实体

```typescript
import { getPositionByGeoJSON, getDefStyle } from '@ktd-cesium/shared'

function loadGeoJSON(geojson: GeoJSONFeature) {
  const positions = getPositionByGeoJSON(geojson.geometry)
  if (!positions) return

  const type = geojson.properties?.type || 'point'
  const style = getDefStyle(type, geojson.properties?.style)

  if (type === 'point' && positions instanceof Cesium.Cartesian3) {
    viewer.entities.add({
      position: positions,
      point: {
        pixelSize: style.pixelSize,
        color: Cesium.Color.fromCssColorString(style.color),
        opacity: style.opacity
      }
    })
  } else if (type === 'polyline' && Array.isArray(positions)) {
    viewer.entities.add({
      polyline: {
        positions: positions,
        width: style.width,
        material: Cesium.Color.fromCssColorString(style.color)
      }
    })
  }
}
```

### 场景 2：导出 GeoJSON 并清理默认值

```typescript
import { removeGeoJsonDefVal } from '@ktd-cesium/shared'

function exportEntityAsGeoJSON(entity: Cesium.Entity): GeoJSONFeature {
  const geojson = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [116.4, 39.9]
    },
    properties: {
      type: 'point',
      style: {
        pixelSize: entity.point?.pixelSize?.getValue(),
        color: entity.point?.color?.getValue().toCssColorString()
      }
    }
  }

  // 移除默认值，减小文件大小
  return removeGeoJsonDefVal(geojson)
}
```

### 场景 3：鼠标拾取位置

```typescript
import { getCurrentMousePosition, formatPosition } from '@ktd-cesium/shared'

viewer.screenSpaceEventHandler.setInputAction((click) => {
  const cartesian = getCurrentMousePosition(viewer.scene, click.position)

  if (cartesian) {
    const formatted = formatPosition(cartesian)
    console.log(`经度: ${formatted?.x}, 纬度: ${formatted?.y}, 高度: ${formatted?.z}`)

    // 显示在 UI 上
    document.getElementById('position-info')!.textContent =
      `位置: ${formatted?.x.toFixed(6)}, ${formatted?.y.toFixed(6)}, ${formatted?.z.toFixed(2)}m`
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK)
```

### 场景 4：批量处理 GeoJSON

```typescript
import { addGeoJsonDefVal, getPositionByGeoJSON } from '@ktd-cesium/shared'

function processGeoJSONCollection(features: GeoJSONFeature[]) {
  return features.map((feature) => {
    // 补充默认值
    if (feature.properties) {
      feature.properties = addGeoJsonDefVal(feature.properties)
    }

    // 获取位置
    const positions = getPositionByGeoJSON(feature.geometry)

    return {
      feature,
      positions
    }
  })
}
```

### 场景 5：自定义样式合并

```typescript
import { getDefStyle } from '@ktd-cesium/shared'

function createStyledEntity(type: string, customStyle: StyleConfig) {
  // 获取合并后的样式（自定义样式覆盖默认值）
  const style = getDefStyle(type, customStyle)

  // 根据类型创建实体
  if (type === 'point') {
    return {
      point: {
        pixelSize: style.pixelSize,
        color: Cesium.Color.fromCssColorString(style.color),
        opacity: style.opacity
      }
    }
  }
  // ... 其他类型
}
```

## 注意事项

1. **GeoJSON 格式**：
   - 支持标准的 GeoJSON Feature 和 Geometry 格式
   - 坐标顺序为 `[经度, 纬度, 高度]`

2. **样式配置**：
   - `defConfigStyle` 包含所有图形类型的默认样式
   - 使用 `getDefStyle` 可以合并自定义样式和默认样式

3. **鼠标位置拾取**：
   - `getCurrentMousePosition` 会优先尝试获取 3D Tiles 模型高度
   - 如果没有模型，会尝试获取地形高度
   - 最后回退到椭球面高度

4. **性能考虑**：
   - 批量处理 GeoJSON 时，建议一次性处理整个集合
   - 鼠标移动事件中频繁调用 `getCurrentMousePosition` 时注意性能

5. **高度处理**：
   - `getPositionByGeoJSON` 支持从 GeoJSON 坐标中读取高度
   - 如果没有高度信息，可以使用 `defHeight` 参数
