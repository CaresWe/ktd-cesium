# 颜色处理

颜色处理模块提供了颜色转换和处理功能，支持十六进制、RGB 与 Cesium Color 之间的转换，以及颜色插值等操作。

## 导入

```typescript
import {
  hexToColor,
  rgbToColor,
  rgbaToColor,
  lerpColor,
  colorToRgb
} from '@ktd-cesium/shared'
```

## API

### hexToColor

将十六进制颜色字符串转换为 Cesium.Color。

**类型签名**

```typescript
function hexToColor(hex: string, alpha?: number): Cesium.Color
```

**参数**

- `hex`: 十六进制颜色字符串（支持 #RGB、#RRGGBB 格式）
- `alpha`: 透明度（0-1），可选，默认为 1

**返回值**

- `Cesium.Color`: Cesium 颜色对象

**示例**

```typescript
import { hexToColor } from '@ktd-cesium/shared'

// 完全不透明的红色
const red = hexToColor('#ff0000')
const red2 = hexToColor('#f00')  // 简写形式

// 半透明的蓝色
const blue = hexToColor('#0000ff', 0.5)

// 使用在实体上
viewer.entities.add({
  position: position,
  point: {
    pixelSize: 10,
    color: hexToColor('#ff6b6b', 0.8)
  }
})
```

### rgbToColor

将 RGB 值转换为 Cesium.Color。

**类型签名**

```typescript
function rgbToColor(r: number, g: number, b: number): Cesium.Color
```

**参数**

- `r`: 红色值（0-255）
- `g`: 绿色值（0-255）
- `b`: 蓝色值（0-255）

**返回值**

- `Cesium.Color`: Cesium 颜色对象

**示例**

```typescript
import { rgbToColor } from '@ktd-cesium/shared'

const red = rgbToColor(255, 0, 0)
const green = rgbToColor(0, 255, 0)
const purple = rgbToColor(128, 0, 128)
```

### rgbaToColor

将 RGBA 值转换为 Cesium.Color。

**类型签名**

```typescript
function rgbaToColor(
  r: number,
  g: number,
  b: number,
  a: number
): Cesium.Color
```

**参数**

- `r`: 红色值（0-255）
- `g`: 绿色值（0-255）
- `b`: 蓝色值（0-255）
- `a`: 透明度（0-1）

**返回值**

- `Cesium.Color`: Cesium 颜色对象

**示例**

```typescript
import { rgbaToColor } from '@ktd-cesium/shared'

const semiTransparentRed = rgbaToColor(255, 0, 0, 0.5)
const transparentGreen = rgbaToColor(0, 255, 0, 0.3)
```

### lerpColor

在两个颜色之间进行线性插值。

**类型签名**

```typescript
function lerpColor(
  startColor: Cesium.Color,
  endColor: Cesium.Color,
  t: number
): Cesium.Color
```

**参数**

- `startColor`: 起始颜色
- `endColor`: 结束颜色
- `t`: 插值系数（0-1）

**返回值**

- `Cesium.Color`: 插值后的颜色

**示例**

```typescript
import { hexToColor, lerpColor } from '@ktd-cesium/shared'

const red = hexToColor('#ff0000')
const blue = hexToColor('#0000ff')

// 红蓝之间的中间色（紫色）
const purple = lerpColor(red, blue, 0.5)

// 更接近红色
const reddish = lerpColor(red, blue, 0.2)

// 更接近蓝色
const bluish = lerpColor(red, blue, 0.8)
```

### colorToRgb

将 Cesium.Color 转换为 RGB 对象。

**类型签名**

```typescript
function colorToRgb(color: Cesium.Color): {
  r: number
  g: number
  b: number
  a: number
}
```

**参数**

- `color`: Cesium 颜色对象

**返回值**

- `object`: RGB 对象
  - `r`: 红色值（0-255）
  - `g`: 绿色值（0-255）
  - `b`: 蓝色值（0-255）
  - `a`: 透明度（0-1）

**示例**

```typescript
import { hexToColor, colorToRgb } from '@ktd-cesium/shared'

const color = hexToColor('#ff6b6b', 0.8)
const rgb = colorToRgb(color)

console.log(rgb)
// { r: 255, g: 107, b: 107, a: 0.8 }
```

## 使用场景

### 场景 1：热力图颜色映射

```typescript
import { hexToColor, lerpColor, mapRange } from '@ktd-cesium/shared'

function getHeatColor(value, min, max) {
  // 定义颜色范围：蓝色（低）-> 绿色 -> 黄色 -> 红色（高）
  const colors = [
    hexToColor('#0000ff'),  // 蓝色
    hexToColor('#00ff00'),  // 绿色
    hexToColor('#ffff00'),  // 黄色
    hexToColor('#ff0000'),  // 红色
  ]

  // 将值映射到 0-1 范围
  const t = mapRange(value, min, max, 0, 1)

  // 确定在哪两个颜色之间插值
  const segmentCount = colors.length - 1
  const segment = Math.floor(t * segmentCount)
  const segmentT = (t * segmentCount) % 1

  const startColor = colors[Math.min(segment, segmentCount)]
  const endColor = colors[Math.min(segment + 1, segmentCount)]

  return lerpColor(startColor, endColor, segmentT)
}

// 使用
const color = getHeatColor(75, 0, 100)
```

### 场景 2：动态改变实体颜色

```typescript
import { hexToColor, lerpColor } from '@ktd-cesium/shared'

class BlinkingEntity {
  constructor(viewer, position) {
    this.entity = viewer.entities.add({
      position: position,
      point: {
        pixelSize: 10,
        color: hexToColor('#ff0000')
      }
    })

    this.startColor = hexToColor('#ff0000')
    this.endColor = hexToColor('#ffff00')
    this.progress = 0
  }

  update(deltaTime) {
    this.progress += deltaTime * 0.001
    const t = (Math.sin(this.progress) + 1) / 2

    this.entity.point.color = lerpColor(
      this.startColor,
      this.endColor,
      t
    )
  }
}
```

### 场景 3：根据高度设置颜色

```typescript
import { hexToColor, lerpColor, mapRange } from '@ktd-cesium/shared'

function addHeightColoredEntity(viewer, longitude, latitude, height) {
  // 高度范围：0-10000 米
  // 颜色：绿色（低）到白色（高）
  const t = mapRange(height, 0, 10000, 0, 1)
  const lowColor = hexToColor('#00ff00')
  const highColor = hexToColor('#ffffff')
  const color = lerpColor(lowColor, highColor, t)

  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(
      longitude,
      latitude,
      height
    ),
    point: {
      pixelSize: 8,
      color: color
    }
  })
}
```

### 场景 4：颜色主题切换

```typescript
import { hexToColor } from '@ktd-cesium/shared'

const themes = {
  light: {
    background: hexToColor('#ffffff'),
    primary: hexToColor('#007bff'),
    secondary: hexToColor('#6c757d'),
    success: hexToColor('#28a745'),
    danger: hexToColor('#dc3545'),
  },
  dark: {
    background: hexToColor('#212529'),
    primary: hexToColor('#0d6efd'),
    secondary: hexToColor('#6c757d'),
    success: hexToColor('#198754'),
    danger: hexToColor('#dc3545'),
  }
}

function applyTheme(viewer, themeName) {
  const theme = themes[themeName]

  viewer.scene.backgroundColor = theme.background

  // 更新所有实体的颜色
  // ...
}
```

### 场景 5：渐变线段

```typescript
import { hexToColor, lerpColor } from '@ktd-cesium/shared'

function createGradientPolyline(viewer, positions) {
  const startColor = hexToColor('#ff0000')
  const endColor = hexToColor('#0000ff')

  // 为每个点计算颜色
  const colors = positions.map((_, index) => {
    const t = index / (positions.length - 1)
    const color = lerpColor(startColor, endColor, t)

    // Cesium 需要为每个顶点提供颜色值
    return color
  })

  viewer.entities.add({
    polyline: {
      positions: positions,
      width: 5,
      material: new Cesium.PolylineColorMaterial({
        colors: colors
      })
    }
  })
}
```

## 注意事项

1. 十六进制颜色支持 `#RGB` 和 `#RRGGBB` 两种格式，必须包含 `#` 前缀
2. RGB 值的范围是 0-255，会自动归一化为 0-1
3. 透明度（alpha）的范围是 0-1
4. `lerpColor` 会创建新的颜色对象，不会修改原始颜色
5. 颜色插值在 RGB 空间进行，可能不是视觉上最平滑的插值方式
