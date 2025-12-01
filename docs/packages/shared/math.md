# 数学计算

数学计算模块提供了常用的数学工具函数，包括数值限制、线性插值、范围映射、随机数生成等。

## 导入

```typescript
import { clamp, lerp, mapRange, random, randomInt } from '@auto-cesium/shared'
```

## API

### clamp

将数值限制在指定范围内。

**类型签名**

```typescript
function clamp(value: number, min: number, max: number): number
```

**参数**

- `value`: 要限制的值
- `min`: 最小值
- `max`: 最大值

**返回值**

- `number`: 限制后的值

**示例**

```typescript
import { clamp } from '@auto-cesium/shared'

clamp(150, 0, 100) // 100
clamp(-10, 0, 100) // 0
clamp(50, 0, 100) // 50
```

### lerp

线性插值函数。

**类型签名**

```typescript
function lerp(start: number, end: number, t: number): number
```

**参数**

- `start`: 起始值
- `end`: 结束值
- `t`: 插值系数（0-1）

**返回值**

- `number`: 插值结果

**示例**

```typescript
import { lerp } from '@auto-cesium/shared'

lerp(0, 100, 0) // 0
lerp(0, 100, 0.5) // 50
lerp(0, 100, 1) // 100
lerp(10, 20, 0.3) // 13
```

### mapRange

将值从一个范围映射到另一个范围。

**类型签名**

```typescript
function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number
```

**参数**

- `value`: 输入值
- `inMin`: 输入范围最小值
- `inMax`: 输入范围最大值
- `outMin`: 输出范围最小值
- `outMax`: 输出范围最大值

**返回值**

- `number`: 映射后的值

**示例**

```typescript
import { mapRange } from '@auto-cesium/shared'

// 将 0-100 的值映射到 0-1
mapRange(50, 0, 100, 0, 1) // 0.5

// 将温度 -20~40 映射到颜色值 0~255
mapRange(10, -20, 40, 0, 255) // 127.5

// 将百分比映射到角度
mapRange(50, 0, 100, 0, 360) // 180
```

### random

生成指定范围内的随机浮点数。

**类型签名**

```typescript
function random(min: number, max: number): number
```

**参数**

- `min`: 最小值
- `max`: 最大值

**返回值**

- `number`: 随机浮点数

**示例**

```typescript
import { random } from '@auto-cesium/shared'

const value = random(0, 100)
console.log(value) // 例如: 45.234567

const height = random(1000, 5000)
console.log(height) // 例如: 3456.789
```

### randomInt

生成指定范围内的随机整数。

**类型签名**

```typescript
function randomInt(min: number, max: number): number
```

**参数**

- `min`: 最小值（包含）
- `max`: 最大值（包含）

**返回值**

- `number`: 随机整数

**示例**

```typescript
import { randomInt } from '@auto-cesium/shared'

const dice = randomInt(1, 6)
console.log(dice) // 1, 2, 3, 4, 5, 或 6

const index = randomInt(0, 9)
console.log(index) // 0 到 9 之间的整数
```

## 使用场景

### 场景 1：限制相机高度

```typescript
import { clamp } from '@auto-cesium/shared'

function setCameraHeight(viewer, height) {
  // 限制高度在 100 到 100000 米之间
  const clampedHeight = clamp(height, 100, 100000)

  viewer.camera.position = Cesium.Cartesian3.fromDegrees(116.4074, 39.9042, clampedHeight)
}
```

### 场景 2：动画插值

```typescript
import { lerp } from '@auto-cesium/shared'

function animate(startValue, endValue, duration) {
  const startTime = Date.now()

  function update() {
    const elapsed = Date.now() - startTime
    const t = Math.min(elapsed / duration, 1)

    const currentValue = lerp(startValue, endValue, t)

    // 使用 currentValue 更新场景
    console.log(currentValue)

    if (t < 1) {
      requestAnimationFrame(update)
    }
  }

  update()
}

// 从 0 动画到 100，持续 2 秒
animate(0, 100, 2000)
```

### 场景 3：温度可视化

```typescript
import { mapRange, lerpColor, hexToColor } from '@auto-cesium/shared'

function getTemperatureColor(temperature) {
  // 温度范围：-20°C 到 40°C
  // 蓝色（冷）到红色（热）

  const t = mapRange(temperature, -20, 40, 0, 1)
  const coldColor = hexToColor('#0000ff')
  const hotColor = hexToColor('#ff0000')

  return lerpColor(coldColor, hotColor, t)
}

// 使用
const color = getTemperatureColor(25)
```

### 场景 4：随机生成建筑物

```typescript
import { random, randomInt } from '@auto-cesium/shared'

function createRandomBuilding(viewer, longitude, latitude) {
  const height = random(10, 100) // 随机高度
  const width = random(20, 50) // 随机宽度
  const color = randomInt(0, 0xffffff) // 随机颜色

  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(longitude, latitude),
    box: {
      dimensions: new Cesium.Cartesian3(width, width, height),
      material: Cesium.Color.fromRandom()
    }
  })
}
```

### 场景 5：平滑缩放

```typescript
import { lerp, clamp } from '@auto-cesium/shared'

class SmoothZoom {
  constructor(viewer) {
    this.viewer = viewer
    this.targetZoom = 1
    this.currentZoom = 1
  }

  setZoom(zoom) {
    // 限制缩放范围
    this.targetZoom = clamp(zoom, 0.1, 10)
  }

  update() {
    // 平滑插值到目标缩放
    this.currentZoom = lerp(this.currentZoom, this.targetZoom, 0.1)

    // 应用缩放
    // ...
  }
}
```

## 注意事项

1. `clamp` 函数确保 `min <= value <= max`
2. `lerp` 的插值系数 `t` 通常在 0-1 之间，但也可以超出范围实现外插
3. `mapRange` 可以用于反向映射（outMin > outMax）
4. `random` 和 `randomInt` 使用 `Math.random()`，不适合加密用途
5. `randomInt` 的范围是包含端点的，即 [min, max]
