# 位置处理

位置处理模块提供了 Cesium 位置相关的工具方法，包括高度计算、距离计算、位置插值等。

## 导入

```typescript
import {
  getMaxHeight,
  getMinHeight,
  getAverageHeight,
  addPositionsHeight,
  setPositionsHeight,
  getDistance,
  getTotalDistance,
  getCenterPosition,
  lerpPosition,
  interpolatePositions,
  setPositionSurfaceHeight
} from '@ktd-cesium/shared'
```

## API

### getMaxHeight

获取位置数组中的最大高度。

**类型签名**

```typescript
function getMaxHeight(positions: Cesium.Cartesian3[], defaultVal?: number): number
```

**参数**

- `positions`: 位置数组
- `defaultVal`: 默认值（可选，默认为 0）

**返回值**

- `number`: 最大高度值（米）

**示例**

```typescript
import { getMaxHeight } from '@ktd-cesium/shared'

const positions = [
  Cesium.Cartesian3.fromDegrees(116.4, 39.9, 100),
  Cesium.Cartesian3.fromDegrees(116.5, 39.9, 200),
  Cesium.Cartesian3.fromDegrees(116.6, 39.9, 150)
]

const maxHeight = getMaxHeight(positions)
// 200
```

### getMinHeight

获取位置数组中的最小高度。

**类型签名**

```typescript
function getMinHeight(positions: Cesium.Cartesian3[], defaultVal?: number): number
```

**示例**

```typescript
import { getMinHeight } from '@ktd-cesium/shared'

const minHeight = getMinHeight(positions)
// 100
```

### getAverageHeight

获取位置数组的平均高度。

**类型签名**

```typescript
function getAverageHeight(positions: Cesium.Cartesian3[]): number
```

**示例**

```typescript
import { getAverageHeight } from '@ktd-cesium/shared'

const avgHeight = getAverageHeight(positions)
// 150
```

### addPositionsHeight

为位置添加高度值。

**类型签名**

```typescript
function addPositionsHeight(
  positions: Cesium.Cartesian3 | Cesium.Cartesian3[],
  addHeight: number
): Cesium.Cartesian3 | Cesium.Cartesian3[]
```

**参数**

- `positions`: 单个位置或位置数组
- `addHeight`: 要添加的高度值（米）

**返回值**

- 处理后的位置或位置数组

**示例**

```typescript
import { addPositionsHeight } from '@ktd-cesium/shared'

// 单个位置
const position = Cesium.Cartesian3.fromDegrees(116.4, 39.9, 100)
const raised = addPositionsHeight(position, 50)
// 高度变为 150

// 位置数组
const positions = [
  /* ... */
]
const raisedPositions = addPositionsHeight(positions, 50)
```

### setPositionsHeight

设置位置为指定高度。

**类型签名**

```typescript
function setPositionsHeight(
  positions: Cesium.Cartesian3 | Cesium.Cartesian3[],
  height: number
): Cesium.Cartesian3 | Cesium.Cartesian3[]
```

**示例**

```typescript
import { setPositionsHeight } from '@ktd-cesium/shared'

// 将所有位置设置为 100 米高度
const fixedPositions = setPositionsHeight(positions, 100)
```

### getDistance

计算两个位置之间的距离。

**类型签名**

```typescript
function getDistance(pos1: Cesium.Cartesian3, pos2: Cesium.Cartesian3): number
```

**返回值**

- `number`: 距离（米）

**示例**

```typescript
import { getDistance } from '@ktd-cesium/shared'

const pos1 = Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0)
const pos2 = Cesium.Cartesian3.fromDegrees(116.5, 39.9, 0)
const distance = getDistance(pos1, pos2)
// 约 8880 米
```

### getTotalDistance

计算位置数组的总距离。

**类型签名**

```typescript
function getTotalDistance(positions: Cesium.Cartesian3[]): number
```

**示例**

```typescript
import { getTotalDistance } from '@ktd-cesium/shared'

const positions = [
  Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0),
  Cesium.Cartesian3.fromDegrees(116.5, 39.9, 0),
  Cesium.Cartesian3.fromDegrees(116.6, 39.9, 0)
]

const totalDistance = getTotalDistance(positions)
// 总距离（米）
```

### getCenterPosition

计算位置数组的中心点。

**类型签名**

```typescript
function getCenterPosition(positions: Cesium.Cartesian3[]): Cesium.Cartesian3 | null
```

**返回值**

- `Cesium.Cartesian3 | null`: 中心点位置，如果数组为空返回 null

**示例**

```typescript
import { getCenterPosition } from '@ktd-cesium/shared'

const center = getCenterPosition(positions)
if (center) {
  viewer.camera.flyTo({
    destination: center
  })
}
```

### lerpPosition

插值两个位置之间的点。

**类型签名**

```typescript
function lerpPosition(pos1: Cesium.Cartesian3, pos2: Cesium.Cartesian3, t: number): Cesium.Cartesian3
```

**参数**

- `pos1`: 起点
- `pos2`: 终点
- `t`: 插值参数 [0, 1]，0 返回起点，1 返回终点

**返回值**

- `Cesium.Cartesian3`: 插值点

**示例**

```typescript
import { lerpPosition } from '@ktd-cesium/shared'

const start = Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0)
const end = Cesium.Cartesian3.fromDegrees(116.5, 39.9, 0)

// 中点
const mid = lerpPosition(start, end, 0.5)

// 三分之一处
const third = lerpPosition(start, end, 0.33)
```

### interpolatePositions

在两个位置之间生成多个插值点。

**类型签名**

```typescript
function interpolatePositions(pos1: Cesium.Cartesian3, pos2: Cesium.Cartesian3, count: number): Cesium.Cartesian3[]
```

**参数**

- `pos1`: 起点
- `pos2`: 终点
- `count`: 生成的点数（不包括起点和终点）

**返回值**

- `Cesium.Cartesian3[]`: 插值点数组（包含起点和终点）

**示例**

```typescript
import { interpolatePositions } from '@ktd-cesium/shared'

const start = Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0)
const end = Cesium.Cartesian3.fromDegrees(116.5, 39.9, 0)

// 生成 5 个中间点
const points = interpolatePositions(start, end, 5)
// 共 7 个点：起点 + 5个中间点 + 终点
```

### setPositionSurfaceHeight

设置坐标中海拔高度为贴地或贴模型的高度。

**类型签名**

```typescript
function setPositionSurfaceHeight(
  viewer: Cesium.Viewer | Cesium.Scene,
  position: Cesium.Cartesian3
): Cesium.Cartesian3 | null
```

**参数**

- `viewer`: Cesium Viewer 或 Scene
- `position`: 位置

**返回值**

- `Cesium.Cartesian3 | null`: 调整后的位置，如果获取高度失败则返回 null

**示例**

```typescript
import { setPositionSurfaceHeight } from '@ktd-cesium/shared'

const position = Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0)
const surfacePosition = setPositionSurfaceHeight(viewer, position)

if (surfacePosition) {
  viewer.entities.add({
    position: surfacePosition,
    point: { pixelSize: 10, color: Cesium.Color.RED }
  })
}
```

## 使用场景

### 场景 1：计算路径总长度

```typescript
import { getTotalDistance, formatDistance } from '@ktd-cesium/shared'

function calculatePathLength(entity: Cesium.Entity) {
  const positions = entity.polyline?.positions?.getValue(Cesium.JulianDate.now())

  if (positions && positions.length >= 2) {
    const totalDistance = getTotalDistance(positions)
    const formatted = formatDistance(totalDistance)
    console.log(`路径总长度: ${formatted}`)
    return totalDistance
  }

  return 0
}
```

### 场景 2：平滑路径插值

```typescript
import { interpolatePositions } from '@ktd-cesium/shared'

function smoothPath(positions: Cesium.Cartesian3[]): Cesium.Cartesian3[] {
  if (positions.length < 2) return positions

  const smoothed: Cesium.Cartesian3[] = [positions[0]]

  for (let i = 0; i < positions.length - 1; i++) {
    // 在每两个点之间插入 3 个点
    const segment = interpolatePositions(positions[i], positions[i + 1], 3)
    // 跳过第一个点（已添加）
    smoothed.push(...segment.slice(1))
  }

  return smoothed
}
```

### 场景 3：计算多边形中心并设置高度

```typescript
import { getCenterPosition, setPositionSurfaceHeight, getAverageHeight } from '@ktd-cesium/shared'

function centerPolygon(entity: Cesium.Entity) {
  const positions = entity.polygon?.hierarchy?.getValue(Cesium.JulianDate.now())?.positions

  if (!positions) return

  // 计算中心点
  const center = getCenterPosition(positions)
  if (!center) return

  // 获取平均高度
  const avgHeight = getAverageHeight(positions)

  // 设置中心点高度
  const centerWithHeight = setPositionsHeight([center], avgHeight)[0]

  // 添加中心标记
  viewer.entities.add({
    position: centerWithHeight,
    point: {
      pixelSize: 15,
      color: Cesium.Color.YELLOW,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2
    },
    label: {
      text: '中心点',
      font: '14px sans-serif',
      fillColor: Cesium.Color.WHITE
    }
  })
}
```

### 场景 4：贴地/贴模型高度调整

```typescript
import { setPositionSurfaceHeight } from '@ktd-cesium/shared'

// 鼠标点击时，将点放置在地表或模型表面
viewer.screenSpaceEventHandler.setInputAction((click) => {
  const cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid)

  if (cartesian) {
    // 尝试获取表面高度（地形或模型）
    const surfacePosition = setPositionSurfaceHeight(viewer, cartesian)

    if (surfacePosition) {
      viewer.entities.add({
        position: surfacePosition,
        point: {
          pixelSize: 10,
          color: Cesium.Color.RED
        }
      })
    } else {
      // 如果获取失败，使用椭球面高度
      viewer.entities.add({
        position: cartesian,
        point: {
          pixelSize: 10,
          color: Cesium.Color.BLUE
        }
      })
    }
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK)
```

### 场景 5：批量调整高度

```typescript
import { addPositionsHeight, setPositionsHeight } from '@ktd-cesium/shared'

// 将所有位置提升 100 米
function raiseAllPositions(entity: Cesium.Entity, height: number) {
  const positions = entity.polyline?.positions?.getValue(Cesium.JulianDate.now())

  if (positions) {
    const raisedPositions = addPositionsHeight(positions, height)
    entity.polyline!.positions = new Cesium.ConstantProperty(raisedPositions)
  }
}

// 将所有位置设置为统一高度
function flattenPositions(entity: Cesium.Entity, height: number) {
  const positions = entity.polygon?.hierarchy?.getValue(Cesium.JulianDate.now())?.positions

  if (positions) {
    const flattenedPositions = setPositionsHeight(positions, height)
    entity.polygon!.hierarchy = new Cesium.ConstantProperty(new Cesium.PolygonHierarchy(flattenedPositions))
  }
}
```

## 注意事项

1. **高度单位**：所有高度值单位都是**米**

2. **距离计算**：
   - `getDistance` 计算的是 3D 空间直线距离
   - `getTotalDistance` 计算的是路径各段距离之和

3. **插值参数**：
   - `lerpPosition` 的 `t` 参数范围是 [0, 1]
   - `t < 0` 或 `t > 1` 会进行外插

4. **表面高度**：
   - `setPositionSurfaceHeight` 会优先尝试获取 3D Tiles 模型高度
   - 如果没有模型，会尝试获取地形高度
   - 获取失败返回 null

5. **性能考虑**：
   - 批量操作时，建议一次性处理整个数组
   - 避免在循环中逐个调用函数
