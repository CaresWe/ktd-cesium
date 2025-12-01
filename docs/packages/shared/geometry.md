# 几何计算

几何计算模块提供了矩阵变换、旋转、平移、平行线计算等几何计算功能。

## 导入

```typescript
import {
  getHeadingPitchRollByOrientation,
  getHeadingPitchRollByMatrix,
  getRotateCenterPoint,
  getOnLinePointByLen,
  getPositionTranslation,
  getOffsetLine,
  centerOfMass,
  getMidpoint,
  getPerpendicularPoint,
  getPointToLineDistance
} from '@auto-cesium/shared'
```

## API

### getHeadingPitchRollByOrientation

通过四元数获取 HeadingPitchRoll。

**类型签名**

```typescript
function getHeadingPitchRollByOrientation(
  position: Cesium.Cartesian3,
  orientation: Cesium.Quaternion,
  ellipsoid?: Cesium.Ellipsoid,
  fixedFrameTransform?: Cesium.Transforms.LocalFrameToFixedFrame
): Cesium.HeadingPitchRoll
```

**参数**

- `position`: 位置
- `orientation`: 方向四元数
- `ellipsoid`: 椭球体（可选）
- `fixedFrameTransform`: 坐标系转换函数（可选）

**返回值**

- `Cesium.HeadingPitchRoll`: 航向、俯仰、翻滚角度

**示例**

```typescript
import { getHeadingPitchRollByOrientation } from '@auto-cesium/shared'

const position = Cesium.Cartesian3.fromDegrees(116.4, 39.9, 1000)
const orientation = Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_Z, Cesium.Math.toRadians(45))

const hpr = getHeadingPitchRollByOrientation(position, orientation)
console.log(`航向: ${Cesium.Math.toDegrees(hpr.heading)}°`)
console.log(`俯仰: ${Cesium.Math.toDegrees(hpr.pitch)}°`)
console.log(`翻滚: ${Cesium.Math.toDegrees(hpr.roll)}°`)
```

### getHeadingPitchRollByMatrix

通过矩阵获取 HeadingPitchRoll。

**类型签名**

```typescript
function getHeadingPitchRollByMatrix(
  matrix: Cesium.Matrix4,
  ellipsoid?: Cesium.Ellipsoid,
  fixedFrameTransform?: Cesium.Transforms.LocalFrameToFixedFrame,
  result?: Cesium.HeadingPitchRoll
): Cesium.HeadingPitchRoll
```

**示例**

```typescript
import { getHeadingPitchRollByMatrix } from '@auto-cesium/shared'

const matrix = Cesium.Matrix4.fromRotationTranslation(
  Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(45)),
  Cesium.Cartesian3.fromDegrees(116.4, 39.9, 1000)
)

const hpr = getHeadingPitchRollByMatrix(matrix)
```

### getRotateCenterPoint

获取绕中心点旋转后的点。

**类型签名**

```typescript
function getRotateCenterPoint(center: Cesium.Cartesian3, point: Cesium.Cartesian3, angle: number): Cesium.Cartesian3
```

**参数**

- `center`: 旋转中心点
- `point`: 要旋转的点
- `angle`: 旋转角度（度）

**返回值**

- `Cesium.Cartesian3`: 旋转后的新点

**示例**

```typescript
import { getRotateCenterPoint } from '@auto-cesium/shared'

const center = Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0)
const point = Cesium.Cartesian3.fromDegrees(116.41, 39.9, 0)

// 绕中心点旋转 90 度
const rotatedPoint = getRotateCenterPoint(center, point, 90)
```

### getOnLinePointByLen

在直线上获取距离 p1 指定长度的点（朝向 p2 方向）。

**类型签名**

```typescript
function getOnLinePointByLen(
  p1: Cesium.Cartesian3,
  p2: Cesium.Cartesian3,
  len: number,
  addBS?: boolean
): Cesium.Cartesian3
```

**参数**

- `p1`: 起点
- `p2`: 终点
- `len`: 距离长度（米）
- `addBS`: 是否在原距离基础上增加（默认 false）

**返回值**

- `Cesium.Cartesian3`: 计算出的点

**示例**

```typescript
import { getOnLinePointByLen } from '@auto-cesium/shared'

const start = Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0)
const end = Cesium.Cartesian3.fromDegrees(116.5, 39.9, 0)

// 在起点和终点之间，距离起点 1000 米的点
const point = getOnLinePointByLen(start, end, 1000)
```

### getPositionTranslation

通过偏移量平移位置。

**类型签名**

```typescript
function getPositionTranslation(
  position: Cesium.Cartesian3,
  offset: { x?: number; y?: number; z?: number },
  degree?: number,
  type?: string,
  fixedFrameTransform?: Cesium.Transforms.LocalFrameToFixedFrame
): Cesium.Cartesian3
```

**参数**

- `position`: 原始位置
- `offset`: 偏移量 `{x, y, z}`（米）
- `degree`: 旋转角度（度，可选）
- `type`: 旋转轴类型（'x', 'y', 'z'，默认 'z'）
- `fixedFrameTransform`: 坐标系转换函数（可选）

**返回值**

- `Cesium.Cartesian3`: 平移后的位置

**示例**

```typescript
import { getPositionTranslation } from '@auto-cesium/shared'

const position = Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0)

// 向东偏移 100 米，向北偏移 50 米
const translated = getPositionTranslation(position, {
  x: 100, // 东
  y: 50 // 北
})

// 带旋转的偏移
const rotatedTranslated = getPositionTranslation(
  position,
  { x: 100, y: 50 },
  45, // 旋转 45 度
  'z' // 绕 Z 轴旋转
)
```

### getOffsetLine

计算平行线（偏移线）。

**类型签名**

```typescript
function getOffsetLine(positions: Cesium.Cartesian3[], offset: number): Cesium.Cartesian3[]
```

**参数**

- `positions`: 原始线的点位数组
- `offset`: 偏移距离（千米，正负值决定偏移方向）

**返回值**

- `Cesium.Cartesian3[]`: 偏移后的线点位数组

**示例**

```typescript
import { getOffsetLine } from '@auto-cesium/shared'

const originalLine = [
  Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0),
  Cesium.Cartesian3.fromDegrees(116.5, 39.9, 0),
  Cesium.Cartesian3.fromDegrees(116.6, 39.9, 0)
]

// 向右偏移 0.5 千米
const offsetLine = getOffsetLine(originalLine, 0.5)

// 向左偏移 0.3 千米
const leftOffsetLine = getOffsetLine(originalLine, -0.3)
```

### centerOfMass

计算质心（中心点）。

**类型签名**

```typescript
function centerOfMass(positions: Cesium.Cartesian3[]): Cesium.Cartesian3
```

**参数**

- `positions`: 位置数组

**返回值**

- `Cesium.Cartesian3`: 质心位置

**示例**

```typescript
import { centerOfMass } from '@auto-cesium/shared'

const positions = [
  Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0),
  Cesium.Cartesian3.fromDegrees(116.5, 39.9, 0),
  Cesium.Cartesian3.fromDegrees(116.5, 40.0, 0),
  Cesium.Cartesian3.fromDegrees(116.4, 40.0, 0)
]

const center = centerOfMass(positions)
```

### getMidpoint

计算两点的中点。

**类型签名**

```typescript
function getMidpoint(p1: Cesium.Cartesian3, p2: Cesium.Cartesian3): Cesium.Cartesian3
```

**示例**

```typescript
import { getMidpoint } from '@auto-cesium/shared'

const p1 = Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0)
const p2 = Cesium.Cartesian3.fromDegrees(116.5, 39.9, 0)

const midpoint = getMidpoint(p1, p2)
```

### getPerpendicularPoint

计算点到直线的垂足。

**类型签名**

```typescript
function getPerpendicularPoint(
  point: Cesium.Cartesian3,
  lineStart: Cesium.Cartesian3,
  lineEnd: Cesium.Cartesian3
): Cesium.Cartesian3
```

**参数**

- `point`: 点
- `lineStart`: 直线起点
- `lineEnd`: 直线终点

**返回值**

- `Cesium.Cartesian3`: 垂足点

**示例**

```typescript
import { getPerpendicularPoint } from '@auto-cesium/shared'

const point = Cesium.Cartesian3.fromDegrees(116.45, 39.95, 0)
const lineStart = Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0)
const lineEnd = Cesium.Cartesian3.fromDegrees(116.5, 39.9, 0)

const perpendicular = getPerpendicularPoint(point, lineStart, lineEnd)
```

### getPointToLineDistance

计算点到直线的距离。

**类型签名**

```typescript
function getPointToLineDistance(
  point: Cesium.Cartesian3,
  lineStart: Cesium.Cartesian3,
  lineEnd: Cesium.Cartesian3
): number
```

**返回值**

- `number`: 距离（米）

**示例**

```typescript
import { getPointToLineDistance } from '@auto-cesium/shared'

const distance = getPointToLineDistance(point, lineStart, lineEnd)
console.log(`距离: ${distance} 米`)
```

## 使用场景

### 场景 1：计算模型的方向角

```typescript
import { getHeadingPitchRollByOrientation } from '@auto-cesium/shared'

function getModelOrientation(entity: Cesium.Entity) {
  const position = entity.position?.getValue(Cesium.JulianDate.now())
  const orientation = entity.orientation?.getValue(Cesium.JulianDate.now())

  if (position && orientation) {
    const hpr = getHeadingPitchRollByOrientation(position, orientation)
    return {
      heading: Cesium.Math.toDegrees(hpr.heading),
      pitch: Cesium.Math.toDegrees(hpr.pitch),
      roll: Cesium.Math.toDegrees(hpr.roll)
    }
  }
  return null
}
```

### 场景 2：创建平行道路

```typescript
import { getOffsetLine } from '@auto-cesium/shared'

function createParallelRoads(centerLine: Cesium.Cartesian3[], width: number) {
  // 左侧道路（偏移 -width/2 千米）
  const leftRoad = getOffsetLine(centerLine, -width / 2 / 1000)

  // 右侧道路（偏移 width/2 千米）
  const rightRoad = getOffsetLine(centerLine, width / 2 / 1000)

  viewer.entities.add({
    polyline: {
      positions: leftRoad,
      width: 5,
      material: Cesium.Color.YELLOW
    }
  })

  viewer.entities.add({
    polyline: {
      positions: rightRoad,
      width: 5,
      material: Cesium.Color.YELLOW
    }
  })
}
```

### 场景 3：旋转多边形

```typescript
import { getRotateCenterPoint } from '@auto-cesium/shared'

function rotatePolygon(positions: Cesium.Cartesian3[], angle: number) {
  // 计算中心点
  const center = centerOfMass(positions)

  // 旋转所有点
  return positions.map((point) => getRotateCenterPoint(center, point, angle))
}
```

### 场景 4：计算点到路径的距离

```typescript
import { getPointToLineDistance } from '@auto-cesium/shared'

function getDistanceToPath(point: Cesium.Cartesian3, path: Cesium.Cartesian3[]): number {
  let minDistance = Infinity

  for (let i = 0; i < path.length - 1; i++) {
    const distance = getPointToLineDistance(point, path[i], path[i + 1])
    minDistance = Math.min(minDistance, distance)
  }

  return minDistance
}
```

## 注意事项

1. **角度单位**：
   - `getRotateCenterPoint` 和 `getPositionTranslation` 的角度参数使用**度**
   - `getHeadingPitchRollByOrientation` 返回的角度是**弧度**

2. **偏移距离**：
   - `getOffsetLine` 的偏移距离单位是**千米**
   - `getOnLinePointByLen` 的距离单位是**米**

3. **坐标系**：
   - 大部分函数使用 WGS84 坐标系
   - `getPositionTranslation` 支持自定义坐标系转换函数

4. **性能考虑**：
   - 矩阵计算会创建临时对象，频繁调用时注意性能
   - 批量操作时，建议一次性处理整个数组
