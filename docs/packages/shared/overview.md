# Shared 包概述

`@ktd-cesium/shared` 是 KTD-Cesium 的共享基础库，提供了一系列常用的工具函数，帮助开发者更高效地处理 Cesium 开发中的常见任务。

## 安装

```bash
pnpm add @ktd-cesium/shared cesium
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
import { degreesToCartesian, cartesianToDegrees } from '@ktd-cesium/shared'

// 经纬度转笛卡尔坐标
const cartesian = degreesToCartesian(116.4, 39.9, 0)

// 笛卡尔坐标转经纬度
const { longitude, latitude, height } = cartesianToDegrees(cartesian)
```

### [数学计算 (math)](/packages/shared/math)

提供常用的数学计算工具函数。

```typescript
import { clamp, lerp, mapRange } from '@ktd-cesium/shared'

const value = clamp(150, 0, 100) // 100
const interpolated = lerp(0, 100, 0.5) // 50
const mapped = mapRange(50, 0, 100, 0, 1) // 0.5
```

### [颜色处理 (color)](/packages/shared/color)

提供颜色转换和处理功能。

```typescript
import { hexToColor, rgbToColor, lerpColor } from '@ktd-cesium/shared'

const color1 = hexToColor('#ff0000', 0.8)
const color2 = rgbToColor(255, 0, 0, 1)
const interpolated = lerpColor(color1, color2, 0.5)
```

### [格式化 (format)](/packages/shared/format)

提供数据格式化工具。

```typescript
import { formatCoordinate, formatDistance } from '@ktd-cesium/shared'

const coord = formatCoordinate(116.4074, 39.9042)
const dist = formatDistance(1500)
```

## 使用场景

### 场景 1：计算两点距离并格式化显示

```typescript
import { calculateDistance, formatDistance } from '@ktd-cesium/shared'

const point1 = { longitude: 116.4, latitude: 39.9 }
const point2 = { longitude: 117.0, latitude: 40.0 }

const distance = calculateDistance(point1, point2)
const formatted = formatDistance(distance)

console.log(`距离：${formatted}`)
```

### 场景 2：处理颜色渐变

```typescript
import { hexToColor, lerpColor } from '@ktd-cesium/shared'

const startColor = hexToColor('#ff0000')
const endColor = hexToColor('#00ff00')

// 计算中间颜色
const midColor = lerpColor(startColor, endColor, 0.5)
```

### 场景 3：数值范围映射

```typescript
import { mapRange } from '@ktd-cesium/shared'

// 将温度范围 -20~40 映射到颜色值 0~1
const temperature = 25
const colorValue = mapRange(temperature, -20, 40, 0, 1)
```

## API 文档

详细的 API 文档请查看各个模块：

- [坐标转换 API](/packages/shared/coordinate)
- [数学计算 API](/packages/shared/math)
- [颜色处理 API](/packages/shared/color)
- [格式化 API](/packages/shared/format)
