# Shared 包概述

`@auto-cesium/shared` 是 KTD-Cesium 的共享基础库，提供了一系列常用的工具函数，帮助开发者更高效地处理 Cesium 开发中的常见任务。

## 安装

```bash
pnpm add @auto-cesium/shared cesium
```

## 特性

- **坐标转换**：经纬度与笛卡尔坐标相互转换、距离计算等
- **数学计算**：数值限制、线性插值、范围映射、随机数生成等
- **颜色处理**：十六进制、RGB 与 Cesium Color 的转换、颜色插值等
- **格式化工具**：坐标、距离、面积、高度的格式化显示

## 功能模块

### [坐标转换 (coordinate)](/packages/shared/coordinate)

提供经纬度与笛卡尔坐标的相互转换、距离计算等功能。

```typescript
import { degreesToCartesian, cartesianToDegrees } from '@auto-cesium/shared'

// 经纬度转笛卡尔坐标
const cartesian = degreesToCartesian(116.4, 39.9, 0)

// 笛卡尔坐标转经纬度
const { longitude, latitude, height } = cartesianToDegrees(cartesian)
```

### [坐标转换（国内坐标系）(coordinate-transform)](/packages/shared/coordinate-transform)

提供 WGS84、GCJ-02（火星坐标系）、BD-09（百度坐标系）之间的相互转换。

```typescript
import { wgs84ToGcj02, gcj02ToBd09, transformCoordinate, CoordinateOffset } from '@auto-cesium/shared'

// WGS84 转 GCJ-02
const [gcjLng, gcjLat] = wgs84ToGcj02(116.3974, 39.9093)

// 使用工厂函数转换
const [bdLng, bdLat] = transformCoordinate(116.4039, 39.9151, CoordinateOffset.GCJ02, CoordinateOffset.BD09)
```

### [数学计算 (math)](/packages/shared/math)

提供常用的数学计算工具函数。

```typescript
import { clamp, lerp, mapRange } from '@auto-cesium/shared'

const value = clamp(150, 0, 100) // 100
const interpolated = lerp(0, 100, 0.5) // 50
const mapped = mapRange(50, 0, 100, 0, 1) // 0.5
```

### [颜色处理 (color)](/packages/shared/color)

提供颜色转换和处理功能。

```typescript
import { hexToColor, rgbToColor, lerpColor } from '@auto-cesium/shared'

const color1 = hexToColor('#ff0000', 0.8)
const color2 = rgbToColor(255, 0, 0, 1)
const interpolated = lerpColor(color1, color2, 0.5)
```

### [格式化 (format)](/packages/shared/format)

提供数据格式化工具。

```typescript
import { formatCoordinate, formatDistance } from '@auto-cesium/shared'

const coord = formatCoordinate(116.4074, 39.9042)
const dist = formatDistance(1500)
```

### [工具函数 (utils)](/packages/shared/utils)

提供通用的工具函数，包括对象操作、函数操作、字符串处理等。

```typescript
import { extend, clone, throttle } from '@auto-cesium/shared'

// 对象合并
const merged = extend({ a: 1 }, { b: 2 })

// 深拷贝
const copied = clone(original)

// 节流函数
const throttled = throttle(fn, 100)
```

### [位置处理 (position)](/packages/shared/position)

提供 Cesium 位置相关的工具方法，包括高度计算、距离计算、位置插值等。

```typescript
import { getMaxHeight, getDistance, lerpPosition } from '@auto-cesium/shared'

const maxHeight = getMaxHeight(positions)
const distance = getDistance(pos1, pos2)
const interpolated = lerpPosition(start, end, 0.5)
```

### [曲线处理 (curve)](/packages/shared/curve)

提供将折线转换为平滑曲线的功能。

```typescript
import { line2curve } from '@auto-cesium/shared'

// 将折线转换为平滑曲线
const smoothCurve = line2curve(positions, false)
```

### [几何计算 (geometry)](/packages/shared/geometry)

提供矩阵变换、旋转、平移、平行线计算等几何计算功能。

```typescript
import { getRotateCenterPoint, getOffsetLine } from '@auto-cesium/shared'

// 绕中心点旋转
const rotated = getRotateCenterPoint(center, point, 90)

// 计算平行线
const offsetLine = getOffsetLine(positions, 0.5)
```

### [Cesium 工具 (cesium)](/packages/shared/cesium)

提供 GeoJSON 处理、样式配置、鼠标位置拾取等 Cesium 相关的工具函数。

```typescript
import { getPositionByGeoJSON, getCurrentMousePosition } from '@auto-cesium/shared'

// 从 GeoJSON 获取位置
const position = getPositionByGeoJSON(geojson.geometry)

// 获取鼠标位置
const mousePos = getCurrentMousePosition(scene, screenPosition)
```

### [军标图形 (military-symbols)](/packages/shared/military-symbols)

提供多种军事标绘图形的计算功能。

```typescript
import { computeAttackArrowPositions, computeSectorPositions } from '@auto-cesium/shared'

// 计算攻击箭头
const arrowPositions = computeAttackArrowPositions(positions)

// 计算扇形
const sectorPositions = computeSectorPositions(positions)
```

## 使用场景

### 场景 1：计算两点距离并格式化显示

```typescript
import { calculateDistance, formatDistance } from '@auto-cesium/shared'

const point1 = { longitude: 116.4, latitude: 39.9 }
const point2 = { longitude: 117.0, latitude: 40.0 }

const distance = calculateDistance(point1, point2)
const formatted = formatDistance(distance)

console.log(`距离：${formatted}`)
```

### 场景 2：处理颜色渐变

```typescript
import { hexToColor, lerpColor } from '@auto-cesium/shared'

const startColor = hexToColor('#ff0000')
const endColor = hexToColor('#00ff00')

// 计算中间颜色
const midColor = lerpColor(startColor, endColor, 0.5)
```

### 场景 3：数值范围映射

```typescript
import { mapRange } from '@auto-cesium/shared'

// 将温度范围 -20~40 映射到颜色值 0~1
const temperature = 25
const colorValue = mapRange(temperature, -20, 40, 0, 1)
```

## API 文档

详细的 API 文档请查看各个模块：

- [坐标转换 API](/packages/shared/coordinate)
- [坐标转换（国内坐标系）API](/packages/shared/coordinate-transform)
- [数学计算 API](/packages/shared/math)
- [颜色处理 API](/packages/shared/color)
- [格式化 API](/packages/shared/format)
- [工具函数 API](/packages/shared/utils)
- [位置处理 API](/packages/shared/position)
- [曲线处理 API](/packages/shared/curve)
- [几何计算 API](/packages/shared/geometry)
- [Cesium 工具 API](/packages/shared/cesium)
- [军标图形 API](/packages/shared/military-symbols)
