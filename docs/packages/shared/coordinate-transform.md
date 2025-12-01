# 坐标转换（国内坐标系）

坐标转换模块提供了 WGS84、GCJ-02（火星坐标系）、BD-09（百度坐标系）之间的相互转换功能，以及 Cesium Cartesian3 与经纬度数组之间的转换。

## 导入

```typescript
import {
  CoordinateOffset,
  wgs84ToGcj02,
  gcj02ToWgs84,
  gcj02ToBd09,
  bd09ToGcj02,
  wgs84ToBd09,
  bd09ToWgs84,
  transformCoordinate,
  cartesians2lonlats,
  cartesian2lonlat,
  lonlats2cartesians,
  lonlat2cartesian
} from '@auto-cesium/shared'
```

## 坐标系说明

| 坐标系     | 说明                           | 使用场景                        |
| ---------- | ------------------------------ | ------------------------------- |
| **WGS84**  | 世界大地测量系统，GPS 原始坐标 | GPS 设备、国际标准              |
| **GCJ-02** | 国测局坐标系（火星坐标系）     | 高德地图、腾讯地图、Google 中国 |
| **BD-09**  | 百度坐标系                     | 百度地图                        |

## API

### CoordinateOffset

坐标偏移类型枚举：

```typescript
enum CoordinateOffset {
  NONE = 'NONE', // 无偏移 - 标准 WGS84/CGCS2000 坐标
  GCJ02 = 'GCJ02', // 国测局偏移 - GCJ-02（火星坐标系）
  BD09 = 'BD09' // 百度偏移 - BD-09（百度坐标系）
}
```

### wgs84ToGcj02

WGS84 转 GCJ-02。

**类型签名**

```typescript
function wgs84ToGcj02(lng: number, lat: number): [number, number]
```

**参数**

- `lng`: WGS84 经度
- `lat`: WGS84 纬度

**返回值**

- `[number, number]`: [GCJ-02 经度, GCJ-02 纬度]

**示例**

```typescript
import { wgs84ToGcj02 } from '@auto-cesium/shared'

// 北京天安门 WGS84 坐标
const [gcjLng, gcjLat] = wgs84ToGcj02(116.3974, 39.9093)
console.log(`GCJ-02: ${gcjLng}, ${gcjLat}`)
```

### gcj02ToWgs84

GCJ-02 转 WGS84（粗略算法）。

**类型签名**

```typescript
function gcj02ToWgs84(lng: number, lat: number): [number, number]
```

**参数**

- `lng`: GCJ-02 经度
- `lat`: GCJ-02 纬度

**返回值**

- `[number, number]`: [WGS84 经度, WGS84 纬度]

**示例**

```typescript
import { gcj02ToWgs84 } from '@auto-cesium/shared'

// 高德地图坐标转 WGS84
const [wgsLng, wgsLat] = gcj02ToWgs84(116.4039, 39.9151)
```

### gcj02ToBd09

GCJ-02 转 BD-09。

**类型签名**

```typescript
function gcj02ToBd09(lng: number, lat: number): [number, number]
```

**示例**

```typescript
import { gcj02ToBd09 } from '@auto-cesium/shared'

const [bdLng, bdLat] = gcj02ToBd09(116.4039, 39.9151)
```

### bd09ToGcj02

BD-09 转 GCJ-02。

**类型签名**

```typescript
function bd09ToGcj02(lng: number, lat: number): [number, number]
```

**示例**

```typescript
import { bd09ToGcj02 } from '@auto-cesium/shared'

const [gcjLng, gcjLat] = bd09ToGcj02(116.4104, 39.9216)
```

### wgs84ToBd09

WGS84 转 BD-09。

**类型签名**

```typescript
function wgs84ToBd09(lng: number, lat: number): [number, number]
```

**示例**

```typescript
import { wgs84ToBd09 } from '@auto-cesium/shared'

const [bdLng, bdLat] = wgs84ToBd09(116.3974, 39.9093)
```

### bd09ToWgs84

BD-09 转 WGS84。

**类型签名**

```typescript
function bd09ToWgs84(lng: number, lat: number): [number, number]
```

**示例**

```typescript
import { bd09ToWgs84 } from '@auto-cesium/shared'

const [wgsLng, wgsLat] = bd09ToWgs84(116.4104, 39.9216)
```

### transformCoordinate

坐标转换工厂函数，根据源偏移类型和目标偏移类型进行转换。

**类型签名**

```typescript
function transformCoordinate(lng: number, lat: number, from: CoordinateOffset, to: CoordinateOffset): [number, number]
```

**参数**

- `lng`: 经度
- `lat`: 纬度
- `from`: 源坐标偏移类型
- `to`: 目标坐标偏移类型

**返回值**

- `[number, number]`: [转换后经度, 转换后纬度]

**示例**

```typescript
import { transformCoordinate, CoordinateOffset } from '@auto-cesium/shared'

// GCJ-02 转 BD-09
const [bdLng, bdLat] = transformCoordinate(116.4039, 39.9151, CoordinateOffset.GCJ02, CoordinateOffset.BD09)

// WGS84 转 GCJ-02
const [gcjLng, gcjLat] = transformCoordinate(116.3974, 39.9093, CoordinateOffset.NONE, CoordinateOffset.GCJ02)
```

### cartesians2lonlats

将 Cartesian3 数组转换为经纬度数组。

**类型签名**

```typescript
function cartesians2lonlats(cartesians: Cesium.Cartesian3[]): number[][]
```

**返回值**

- `number[][]`: 经纬度数组 `[[lon, lat, height], ...]`

**示例**

```typescript
import { cartesians2lonlats } from '@auto-cesium/shared'
import * as Cesium from 'cesium'

const cartesians = [Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0), Cesium.Cartesian3.fromDegrees(116.5, 39.9, 100)]

const lonlats = cartesians2lonlats(cartesians)
// [[116.4, 39.9, 0], [116.5, 39.9, 100]]
```

### cartesian2lonlat

将 Cartesian3 转换为经纬度数组。

**类型签名**

```typescript
function cartesian2lonlat(cartesian: Cesium.Cartesian3): number[]
```

**返回值**

- `number[]`: 经纬度数组 `[lon, lat, height]`

**示例**

```typescript
import { cartesian2lonlat } from '@auto-cesium/shared'

const cartesian = Cesium.Cartesian3.fromDegrees(116.4, 39.9, 100)
const lonlat = cartesian2lonlat(cartesian)
// [116.4, 39.9, 100]
```

### lonlats2cartesians

将经纬度数组转换为 Cartesian3 数组。

**类型签名**

```typescript
function lonlats2cartesians(lonlats: number[][], defHeight?: number): Cesium.Cartesian3[]
```

**参数**

- `lonlats`: 经纬度数组 `[[lon, lat, height], ...]`
- `defHeight`: 默认高度（如果坐标中没有高度信息）

**返回值**

- `Cesium.Cartesian3[]`: Cartesian3 数组

**示例**

```typescript
import { lonlats2cartesians } from '@auto-cesium/shared'

const lonlats = [
  [116.4, 39.9],
  [116.5, 39.9]
]

const cartesians = lonlats2cartesians(lonlats, 0)
// 使用默认高度 0
```

### lonlat2cartesian

将经纬度数组转换为 Cartesian3。

**类型签名**

```typescript
function lonlat2cartesian(lonlat: number[], defHeight?: number): Cesium.Cartesian3
```

**参数**

- `lonlat`: 经纬度数组 `[lon, lat, height]`
- `defHeight`: 默认高度（如果坐标中没有高度信息）

**返回值**

- `Cesium.Cartesian3`: Cartesian3 坐标

**示例**

```typescript
import { lonlat2cartesian } from '@auto-cesium/shared'

const lonlat = [116.4, 39.9]
const cartesian = lonlat2cartesian(lonlat, 100)
```

## 使用场景

### 场景 1：高德地图坐标转 Cesium

```typescript
import { gcj02ToWgs84, lonlat2cartesian } from '@auto-cesium/shared'

// 高德地图返回的 GCJ-02 坐标
const amapLng = 116.4039
const amapLat = 39.9151

// 转换为 WGS84
const [wgsLng, wgsLat] = gcj02ToWgs84(amapLng, amapLat)

// 转换为 Cesium Cartesian3
const position = lonlat2cartesian([wgsLng, wgsLat, 0])

// 添加到场景
viewer.entities.add({
  position: position,
  point: { pixelSize: 10, color: Cesium.Color.RED }
})
```

### 场景 2：百度地图坐标转 Cesium

```typescript
import { bd09ToWgs84, lonlat2cartesian } from '@auto-cesium/shared'

// 百度地图返回的 BD-09 坐标
const baiduLng = 116.4104
const baiduLat = 39.9216

// 转换为 WGS84
const [wgsLng, wgsLat] = bd09ToWgs84(baiduLng, baiduLat)

// 转换为 Cesium Cartesian3
const position = lonlat2cartesian([wgsLng, wgsLat, 0])
```

### 场景 3：批量转换坐标数组

```typescript
import { gcj02ToWgs84, lonlats2cartesians } from '@auto-cesium/shared'

// 高德地图返回的坐标数组（GCJ-02）
const amapCoords = [
  [116.4039, 39.9151],
  [116.404, 39.9152],
  [116.4041, 39.9153]
]

// 批量转换为 WGS84
const wgsCoords = amapCoords.map(([lng, lat]) => gcj02ToWgs84(lng, lat))

// 转换为 Cesium Cartesian3 数组
const cartesians = lonlats2cartesians(wgsCoords, 0)
```

### 场景 4：使用工厂函数转换

```typescript
import { transformCoordinate, CoordinateOffset } from '@auto-cesium/shared'

// 从高德地图（GCJ-02）转换到百度地图（BD-09）
function convertAmapToBaidu(amapLng: number, amapLat: number) {
  return transformCoordinate(amapLng, amapLat, CoordinateOffset.GCJ02, CoordinateOffset.BD09)
}

// 使用
const [baiduLng, baiduLat] = convertAmapToBaidu(116.4039, 39.9151)
```

### 场景 5：坐标数组与 Cesium 实体互转

```typescript
import { cartesians2lonlats, lonlats2cartesians } from '@auto-cesium/shared'

// 从 Cesium 实体获取坐标
const entity = viewer.entities.values[0]
const cartesians = entity.polyline?.positions?.getValue(Cesium.JulianDate.now())

if (cartesians) {
  // 转换为经纬度数组（用于保存或传输）
  const lonlats = cartesians2lonlats(cartesians)
  console.log('坐标数组:', lonlats)

  // 从经纬度数组恢复 Cesium 坐标
  const restoredCartesians = lonlats2cartesians(lonlats, 0)
  // 更新实体
  entity.polyline!.positions = new Cesium.ConstantProperty(restoredCartesians)
}
```

## 注意事项

1. **精度限制**：
   - GCJ-02 转 WGS84 使用粗略算法，精度有限（通常误差在 10-50 米）
   - 如需高精度转换，建议使用专业坐标转换库

2. **适用范围**：
   - 转换函数会自动检测坐标是否在中国境内
   - 中国境外坐标不进行转换，直接返回原坐标

3. **高度处理**：
   - 坐标转换函数只处理经纬度，不处理高度
   - 高度信息需要在转换后单独处理

4. **性能考虑**：
   - 批量转换时，建议使用 `lonlats2cartesians` 和 `cartesians2lonlats`
   - 避免在循环中逐个转换

5. **坐标系选择**：
   - Cesium 使用 WGS84 坐标系
   - 国内地图服务商通常使用 GCJ-02 或 BD-09
   - 显示前需要转换为 WGS84
