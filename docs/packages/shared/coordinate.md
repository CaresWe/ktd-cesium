# 坐标转换

坐标转换模块提供了经纬度与笛卡尔坐标系之间的转换功能，以及距离计算等实用函数。

## 导入

```typescript
import {
  degreesToCartesian,
  cartesianToDegrees,
  calculateDistance,
  degreesToRadians,
  radiansToDegrees
} from '@auto-cesium/shared'
```

## API

### degreesToCartesian

将经纬度坐标转换为笛卡尔坐标。

**类型签名**

```typescript
function degreesToCartesian(longitude: number, latitude: number, height?: number): Cesium.Cartesian3
```

**参数**

- `longitude`: 经度（度数）
- `latitude`: 纬度（度数）
- `height`: 高度（米），可选，默认为 0

**返回值**

- `Cesium.Cartesian3`: 笛卡尔坐标

**示例**

```typescript
import { degreesToCartesian } from '@auto-cesium/shared'

// 转换北京天安门的坐标
const cartesian = degreesToCartesian(116.4074, 39.9042, 0)
console.log(cartesian)
// Cartesian3 { x: ..., y: ..., z: ... }

// 带高度的转换
const cartesianWithHeight = degreesToCartesian(116.4074, 39.9042, 1000)
```

### cartesianToDegrees

将笛卡尔坐标转换为经纬度坐标。

**类型签名**

```typescript
function cartesianToDegrees(cartesian: Cesium.Cartesian3): {
  longitude: number
  latitude: number
  height: number
}
```

**参数**

- `cartesian`: 笛卡尔坐标

**返回值**

- `object`: 包含经度、纬度和高度的对象
  - `longitude`: 经度（度数）
  - `latitude`: 纬度（度数）
  - `height`: 高度（米）

**示例**

```typescript
import { cartesianToDegrees, degreesToCartesian } from '@auto-cesium/shared'

const cartesian = degreesToCartesian(116.4074, 39.9042, 1000)
const degrees = cartesianToDegrees(cartesian)

console.log(degrees)
// { longitude: 116.4074, latitude: 39.9042, height: 1000 }
```

### calculateDistance

计算两个经纬度点之间的距离（单位：米）。

**类型签名**

```typescript
function calculateDistance(
  point1: { longitude: number; latitude: number },
  point2: { longitude: number; latitude: number }
): number
```

**参数**

- `point1`: 第一个点的经纬度
- `point2`: 第二个点的经纬度

**返回值**

- `number`: 两点之间的距离（米）

**示例**

```typescript
import { calculateDistance } from '@auto-cesium/shared'

// 计算北京到上海的距离
const beijing = { longitude: 116.4074, latitude: 39.9042 }
const shanghai = { longitude: 121.4737, latitude: 31.2304 }

const distance = calculateDistance(beijing, shanghai)
console.log(`距离：${(distance / 1000).toFixed(2)} 公里`)
// 距离：1067.52 公里
```

### degreesToRadians

将角度转换为弧度。

**类型签名**

```typescript
function degreesToRadians(degrees: number): number
```

**参数**

- `degrees`: 角度值

**返回值**

- `number`: 弧度值

**示例**

```typescript
import { degreesToRadians } from '@auto-cesium/shared'

const radians = degreesToRadians(180)
console.log(radians) // 3.141592653589793 (Math.PI)
```

### radiansToDegrees

将弧度转换为角度。

**类型签名**

```typescript
function radiansToDegrees(radians: number): number
```

**参数**

- `radians`: 弧度值

**返回值**

- `number`: 角度值

**示例**

```typescript
import { radiansToDegrees } from '@auto-cesium/shared'

const degrees = radiansToDegrees(Math.PI)
console.log(degrees) // 180
```

## 使用场景

### 场景 1：标记点位

```typescript
import { degreesToCartesian } from '@auto-cesium/shared'
import * as Cesium from 'cesium'

const viewer = new Cesium.Viewer('cesiumContainer')

// 在北京添加一个点
const position = degreesToCartesian(116.4074, 39.9042, 0)
viewer.entities.add({
  position: position,
  point: {
    pixelSize: 10,
    color: Cesium.Color.RED
  }
})
```

### 场景 2：计算并显示两点距离

```typescript
import { calculateDistance, formatDistance } from '@auto-cesium/shared'

function showDistance(point1, point2) {
  const distance = calculateDistance(point1, point2)
  const formatted = formatDistance(distance)

  alert(`两点距离：${formatted}`)
}

// 使用
showDistance(
  { longitude: 116.4074, latitude: 39.9042 }, // 北京
  { longitude: 121.4737, latitude: 31.2304 } // 上海
)
```

### 场景 3：获取鼠标点击位置的经纬度

```typescript
import { cartesianToDegrees } from '@auto-cesium/shared'
import * as Cesium from 'cesium'

const viewer = new Cesium.Viewer('cesiumContainer')

viewer.screenSpaceEventHandler.setInputAction((movement) => {
  const cartesian = viewer.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid)

  if (cartesian) {
    const degrees = cartesianToDegrees(cartesian)
    console.log(`经度：${degrees.longitude}, 纬度：${degrees.latitude}`)
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK)
```

## 注意事项

1. 所有的经纬度参数都使用**度数**，不是弧度
2. 高度参数的单位是**米**
3. `calculateDistance` 使用球面距离计算，不考虑地形
4. 坐标转换基于 WGS84 椭球体
