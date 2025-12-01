# 曲线处理

曲线处理模块提供了将折线转换为平滑曲线的功能，支持贝塞尔曲线、Catmull-Rom 样条等多种插值算法。

## 导入

```typescript
import {
  line2curve,
  bezierInterpolation,
  catmullRomSpline,
  simpleBezierCurve,
  quadraticBezier,
  cubicBezier
} from '@ktd-cesium/shared'
```

## API

### line2curve

将折线转换为平滑曲线（贝塞尔曲线插值）。

**类型签名**

```typescript
function line2curve(positions: Cesium.Cartesian3[], closure?: boolean): Cesium.Cartesian3[]
```

**参数**

- `positions`: 原始折线点位
- `closure`: 是否闭合曲线（可选，默认为 false）

**返回值**

- `Cesium.Cartesian3[]`: 平滑后的曲线点位

**示例**

```typescript
import { line2curve } from '@ktd-cesium/shared'

// 原始折线
const positions = [
  Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0),
  Cesium.Cartesian3.fromDegrees(116.5, 39.9, 0),
  Cesium.Cartesian3.fromDegrees(116.6, 39.95, 0),
  Cesium.Cartesian3.fromDegrees(116.7, 39.9, 0)
]

// 转换为平滑曲线
const smoothCurve = line2curve(positions)

// 创建曲线实体
viewer.entities.add({
  polyline: {
    positions: smoothCurve,
    width: 3,
    material: Cesium.Color.CYAN
  }
})
```

### bezierInterpolation

贝塞尔曲线插值算法。

**类型签名**

```typescript
function bezierInterpolation(points: number[][], resolution?: number): number[][]
```

**参数**

- `points`: 控制点数组 `[[lon, lat, height], ...]`
- `resolution`: 每段插值点数（可选，默认为 20）

**返回值**

- `number[][]`: 平滑后的点数组

**示例**

```typescript
import { bezierInterpolation } from '@ktd-cesium/shared'

const controlPoints = [
  [116.4, 39.9, 0],
  [116.5, 39.9, 0],
  [116.6, 39.95, 0]
]

// 每段生成 30 个点
const smoothPoints = bezierInterpolation(controlPoints, 30)
```

### catmullRomSpline

Catmull-Rom 样条插值。

**类型签名**

```typescript
function catmullRomSpline(p0: number[], p1: number[], p2: number[], p3: number[], t: number): number[]
```

**参数**

- `p0`: 前一个控制点
- `p1`: 起始控制点
- `p2`: 结束控制点
- `p3`: 后一个控制点
- `t`: 插值参数 [0, 1]

**返回值**

- `number[]`: 插值点 `[lon, lat, height]`

**示例**

```typescript
import { catmullRomSpline } from '@ktd-cesium/shared'

const p0 = [116.3, 39.9, 0]
const p1 = [116.4, 39.9, 0]
const p2 = [116.5, 39.9, 0]
const p3 = [116.6, 39.9, 0]

// 中点插值
const midPoint = catmullRomSpline(p0, p1, p2, p3, 0.5)
```

### quadraticBezier

二次贝塞尔曲线计算。

**类型签名**

```typescript
function quadraticBezier(p0: number[], p1: number[], p2: number[], t: number): number[]
```

**参数**

- `p0`: 起点
- `p1`: 控制点
- `p2`: 终点
- `t`: 参数 [0, 1]

**返回值**

- `number[]`: 曲线上的点

**示例**

```typescript
import { quadraticBezier } from '@ktd-cesium/shared'

const start = [116.4, 39.9, 0]
const control = [116.5, 40.0, 0]
const end = [116.6, 39.9, 0]

// 生成曲线上的点
const curvePoints = []
for (let t = 0; t <= 1; t += 0.1) {
  curvePoints.push(quadraticBezier(start, control, end, t))
}
```

### cubicBezier

三次贝塞尔曲线计算。

**类型签名**

```typescript
function cubicBezier(p0: number[], p1: number[], p2: number[], p3: number[], t: number): number[]
```

**参数**

- `p0`: 起点
- `p1`: 控制点1
- `p2`: 控制点2
- `p3`: 终点
- `t`: 参数 [0, 1]

**返回值**

- `number[]`: 曲线上的点

**示例**

```typescript
import { cubicBezier } from '@ktd-cesium/shared'

const p0 = [116.4, 39.9, 0]
const p1 = [116.45, 40.0, 0]
const p2 = [116.55, 40.0, 0]
const p3 = [116.6, 39.9, 0]

const point = cubicBezier(p0, p1, p2, p3, 0.5)
```

## 使用场景

### 场景 1：平滑路径

```typescript
import { line2curve } from '@ktd-cesium/shared'

// 用户绘制的折线
const userDrawnLine = [
  Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0),
  Cesium.Cartesian3.fromDegrees(116.41, 39.91, 0),
  Cesium.Cartesian3.fromDegrees(116.42, 39.92, 0),
  Cesium.Cartesian3.fromDegrees(116.43, 39.93, 0)
]

// 转换为平滑曲线
const smoothPath = line2curve(userDrawnLine)

viewer.entities.add({
  polyline: {
    positions: smoothPath,
    width: 5,
    material: Cesium.Color.YELLOW,
    clampToGround: true
  }
})
```

### 场景 2：闭合曲线

```typescript
import { line2curve } from '@ktd-cesium/shared'

// 创建闭合区域
const boundary = [
  Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0),
  Cesium.Cartesian3.fromDegrees(116.5, 39.9, 0),
  Cesium.Cartesian3.fromDegrees(116.5, 40.0, 0),
  Cesium.Cartesian3.fromDegrees(116.4, 40.0, 0)
]

// 转换为闭合平滑曲线
const smoothBoundary = line2curve(boundary, true)

viewer.entities.add({
  polygon: {
    hierarchy: new Cesium.PolygonHierarchy(smoothBoundary),
    material: Cesium.Color.BLUE.withAlpha(0.5)
  }
})
```

### 场景 3：自定义插值密度

```typescript
import { bezierInterpolation, lonlats2cartesians, cartesians2lonlats } from '@ktd-cesium/shared'

function smoothLineWithDensity(positions: Cesium.Cartesian3[], density: number = 20) {
  // 转换为经纬度数组
  const lonlats = cartesians2lonlats(positions)

  // 使用自定义密度插值
  const smoothLonlats = bezierInterpolation(lonlats, density)

  // 转换回 Cartesian3
  return lonlats2cartesians(smoothLonlats)
}

// 使用
const originalLine = [
  /* ... */
]
const smoothLine = smoothLineWithDensity(originalLine, 50) // 高密度
```

### 场景 4：动画路径

```typescript
import { line2curve, interpolatePositions } from '@ktd-cesium/shared'

// 创建平滑的飞行路径
const waypoints = [
  Cesium.Cartesian3.fromDegrees(116.4, 39.9, 1000),
  Cesium.Cartesian3.fromDegrees(116.5, 39.95, 2000),
  Cesium.Cartesian3.fromDegrees(116.6, 39.9, 1500)
]

// 先转换为平滑曲线
const smoothPath = line2curve(waypoints)

// 再生成动画关键帧
const keyframes: Cesium.Cartesian3[] = []
for (let i = 0; i < smoothPath.length - 1; i++) {
  const segment = interpolatePositions(smoothPath[i], smoothPath[i + 1], 10)
  keyframes.push(...segment.slice(0, -1)) // 避免重复
}
keyframes.push(smoothPath[smoothPath.length - 1])

// 使用关键帧创建动画
viewer.entities.add({
  position: new Cesium.SampledPositionProperty(),
  model: {
    uri: '/models/airplane.glb'
  }
})

// 添加位置采样
const property = viewer.entities.values[0].position as Cesium.SampledPositionProperty
const start = Cesium.JulianDate.now()
keyframes.forEach((pos, index) => {
  const time = Cesium.JulianDate.addSeconds(start, index * 0.1, new Cesium.JulianDate())
  property.addSample(time, pos)
})
```

### 场景 5：曲线简化

```typescript
import { line2curve } from '@ktd-cesium/shared'

// 原始路径点过多，先简化再平滑
function simplifyAndSmooth(positions: Cesium.Cartesian3[]): Cesium.Cartesian3[] {
  // 简化：每 N 个点取一个
  const step = Math.max(1, Math.floor(positions.length / 20))
  const simplified = positions.filter((_, index) => index % step === 0)

  // 平滑
  return line2curve(simplified)
}
```

## 注意事项

1. **最少点数**：
   - `line2curve` 需要至少 3 个点才能生成平滑曲线
   - 少于 3 个点会直接返回原数组

2. **插值密度**：
   - `resolution` 参数控制每段的插值点数
   - 值越大，曲线越平滑，但计算量也越大
   - 建议值：20-50

3. **闭合曲线**：
   - `closure: true` 会在末尾添加起点，形成闭合曲线
   - 适用于多边形边界等场景

4. **高度处理**：
   - 曲线插值会保持原始高度信息
   - 如果控制点高度不同，插值点会平滑过渡

5. **性能考虑**：
   - 大量点的情况下，建议先简化再平滑
   - 避免对实时更新的路径频繁调用平滑函数

6. **算法选择**：
   - `line2curve` 使用 Catmull-Rom 样条，适合一般路径平滑
   - `quadraticBezier` 和 `cubicBezier` 适合需要精确控制曲线的场景
