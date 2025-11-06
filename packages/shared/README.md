# @ktd-cesium/shared

Cesium 共享基础库，提供坐标转换、数学计算、颜色处理、格式化等实用工具。

## 安装

```bash
pnpm add @ktd-cesium/shared cesium
```

## 功能模块

### 坐标转换 (coordinate)

```typescript
import {
  degreesToCartesian,
  cartesianToDegrees,
  calculateDistance
} from '@ktd-cesium/shared'

// 经纬度转笛卡尔坐标
const cartesian = degreesToCartesian(116.4, 39.9, 0)

// 笛卡尔坐标转经纬度
const { longitude, latitude, height } = cartesianToDegrees(cartesian)

// 计算两点距离
const distance = calculateDistance(
  { longitude: 116.4, latitude: 39.9 },
  { longitude: 117.0, latitude: 40.0 }
)
```

### 数学计算 (math)

```typescript
import { clamp, lerp, mapRange, random } from '@ktd-cesium/shared'

// 限制数值范围
const value = clamp(150, 0, 100) // 100

// 线性插值
const interpolated = lerp(0, 100, 0.5) // 50

// 范围映射
const mapped = mapRange(50, 0, 100, 0, 1) // 0.5

// 随机数
const randomValue = random(0, 100)
const randomInt = randomInt(1, 10)
```

### 颜色处理 (color)

```typescript
import { hexToColor, rgbToColor, lerpColor } from '@ktd-cesium/shared'

// 十六进制转颜色
const color1 = hexToColor('#ff0000', 0.8)

// RGB转颜色
const color2 = rgbToColor(255, 0, 0, 1)

// 颜色插值
const interpolatedColor = lerpColor(color1, color2, 0.5)
```

### 格式化 (format)

```typescript
import {
  formatCoordinate,
  formatDistance,
  formatArea,
  formatHeight
} from '@ktd-cesium/shared'

// 格式化坐标
const coord = formatCoordinate(116.4074, 39.9042) // "39.9042°N, 116.4074°E"

// 格式化距离
const dist = formatDistance(1500) // "1.50 km"

// 格式化面积
const area = formatArea(15000) // "1.50 ha"

// 格式化高度
const height = formatHeight(2500) // "2.50 km"
```

## License

MIT
