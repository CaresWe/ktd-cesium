# CameraPlugin - 相机控制插件

CameraPlugin 提供全面的相机控制功能，包括基础的飞行、视角控制，以及高级的飞行漫游、绕点飞行等功能。

## 特性

- ✅ **基础相机控制** - flyTo、setView、lookAt 等方法
- ✅ **飞行漫游** - 沿航点平滑飞行，支持 Hermite 和 Lagrange 插值
- ✅ **模型漫游** - 3D 模型沿路径运动，支持轨迹显示
- ✅ **绕点飞行** - 围绕指定点进行环绕飞行
- ✅ **室内漫游** - 第一人称视角自动漫游，支持插值平滑
- ✅ **键盘漫游** - WASD + 鼠标控制的第一人称漫游
- ✅ **实时数据跟踪** - 经纬度、高程、距离、进度等实时数据
- ✅ **多种视角模式** - 跟随、俯视、侧视、自定义视角
- ✅ **速度控制** - 暂停/继续、速度倍率调整
- ✅ **贴地/贴模型** - 支持贴地形和贴 3D Tiles 模型飞行

## 快速开始

```typescript
import { AutoViewer } from '@auto-cesium/core'
import { CameraPlugin } from '@auto-cesium/plugins'

const viewer = new AutoViewer(cesiumViewer)
const camera = viewer.use(CameraPlugin)

// 飞行到指定位置
await camera.flyTo({
  destination: [116.4, 39.9, 10000],
  duration: 3,
  heading: 0,
  pitch: -45
})

// 相机漫游
camera.startCameraRoaming({
  waypoints: [
    [114.35, 30.54, 1000],
    [114.41, 30.51, 100]
  ],
  duration: 10
})
```

## 基础相机控制

### flyTo - 飞行到指定位置

平滑飞行到目标位置，支持自定义视角和飞行时长。

```typescript
await camera.flyTo({
  destination: [116.4, 39.9, 10000], // [经度, 纬度, 高度]
  duration: 3, // 飞行时长（秒）
  heading: 0, // 航向角（度，0 = 正北）
  pitch: -45, // 俯仰角（度，-90 = 正下方）
  roll: 0, // 翻滚角（度）
  complete: () => console.log('飞行完成'),
  cancel: () => console.log('飞行取消')
})
```

**参数说明：**

- `destination`: [经度, 纬度, 高度（米）]
- `duration`: 飞行时长，默认 3 秒
- `heading`: 航向角，0° = 正北，90° = 正东
- `pitch`: 俯仰角，0° = 水平，-90° = 正下方
- `roll`: 翻滚角，通常为 0
- `easingFunction`: 缓动函数，默认 `LINEAR_NONE`（避免抖动）

---

### setView - 设置相机视角

立即设置相机视角，无动画过渡。

```typescript
camera.setView({
  destination: [116.4, 39.9, 10000],
  heading: 0,
  pitch: -90,
  roll: 0
})
```

---

### lookAt - 环绕指定点查看

相机环绕指定点，保持固定距离观察。

```typescript
camera.lookAt({
  target: [116.4, 39.9, 0], // 观察目标点
  heading: 0, // 航向角
  pitch: -45, // 俯仰角
  range: 10000 // 距离（米）
})
```

---

### getCurrentPosition - 获取当前相机位置

获取相机的详细位置信息。

```typescript
const position = camera.getCurrentPosition()

console.log(`
  经度: ${position.longitude}
  纬度: ${position.latitude}
  高度: ${position.height}
  航向角: ${position.heading}
  俯仰角: ${position.pitch}
  翻滚角: ${position.roll}
`)
```

---

### 实体相关方法

```typescript
// 缩放到实体（无动画）
camera.zoomToEntity(entity)

// 缩放到实体（带偏移）
camera.zoomToEntity(entity, new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-45), 1000))

// 飞行到实体
await camera.flyToEntity(entity, {
  duration: 2,
  offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-45), 1000)
})

// 飞行到矩形区域
await camera.flyToRectangle([110, 30, 120, 40], 3)
```

---

## 飞行漫游

飞行漫游功能允许相机或模型沿预定义的航点路径平滑移动。

### 相机漫游

相机沿航点飞行，支持多种插值算法和视角控制。

```typescript
camera.startCameraRoaming({
  waypoints: [
    [114.35231209, 30.53542614, 1000],
    [114.40782845, 30.51011682, 100],
    [114.45, 30.5, 500]
  ],
  duration: 20, // 总时长 20 秒
  speedMultiplier: 1.5, // 速度倍率 1.5x
  loop: false, // 不循环
  interpolation: 'hermite', // Hermite 插值（平滑）
  interpolationDegree: 100, // 插值度数
  cameraOffset: {
    // 相机偏移
    heading: 0,
    pitch: -30,
    range: 200
  },
  showPath: true, // 显示路径
  pathOptions: {
    width: 2,
    material: Cesium.Color.YELLOW,
    resolution: 1
  }
})
```

**配置说明：**

- `waypoints`: 航点数组，每个航点 [经度, 纬度, 高度]
- `duration`: 漫游总时长（秒），默认 360
- `speedMultiplier`: 速度倍率，默认 1
- `loop`: 是否循环漫游，默认 false
- `clampToGround`: 是否贴地飞行，默认 false
- `clampToTileset`: 是否贴 3D Tiles 模型，默认 false
- `interpolation`: 插值算法
  - `'hermite'`: Hermite 多项式，平滑曲线（默认）
  - `'lagrange'`: Lagrange 多项式，更自然的运动
- `interpolationDegree`: 插值度数
  - Hermite 默认 100（更平滑）
  - Lagrange 默认 5（更自然）
- `cameraOffset`: 相机偏移配置
  - `heading`: 航向偏移（度）
  - `pitch`: 俯仰偏移（度）
  - `range`: 距离（米）
- `showPath`: 是否显示飞行路径
- `pathOptions`: 路径样式配置

---

### 模型漫游

3D 模型沿路径运动，支持轨迹显示、标签、圆柱体标记等。

```typescript
camera.startModelRoaming({
  waypoints: [
    [114.35, 30.54, 1000],
    [114.41, 30.51, 100]
  ],
  duration: 15,
  speedMultiplier: 1,
  loop: false,
  interpolation: 'lagrange',

  // 模型配置
  model: {
    uri: '/path/to/airplane.glb',
    minimumPixelSize: 64,
    maximumScale: 20000
  },

  // 显示标签
  showLabel: true,
  labelOptions: {
    text: '飞机',
    font: '14pt sans-serif',
    fillColor: Cesium.Color.WHITE,
    outlineColor: Cesium.Color.BLACK,
    outlineWidth: 2,
    pixelOffset: new Cesium.Cartesian2(0, -40)
  },

  // 显示轨迹折线
  showPolyline: true,
  polylineOptions: {
    width: 3,
    material: Cesium.Color.RED
  },

  // 显示圆柱体标记
  showCylinder: true,
  cylinderOptions: {
    topRadius: 0,
    bottomRadius: 100,
    material: Cesium.Color.RED.withAlpha(0.3),
    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
  },

  // 显示飞行路径
  showPath: true,
  pathOptions: {
    width: 2,
    material: Cesium.Color.YELLOW
  }
})
```

**模型漫游特有选项：**

- `model`: 模型配置
  - `uri`: 模型文件路径（.glb、.gltf）
  - `minimumPixelSize`: 最小像素大小，默认 64
  - `maximumScale`: 最大缩放比例
- `showLabel`: 是否显示标签
- `labelOptions`: 标签样式
- `showPolyline`: 是否显示已飞行轨迹折线
- `polylineOptions`: 折线样式
- `showCylinder`: 是否显示圆柱体标记（从模型到地面）
- `cylinderOptions`: 圆柱体样式

---

### 绕点飞行

相机围绕指定点进行环绕飞行。

```typescript
camera.startCircleAroundPoint({
  center: [120, 30, 100000], // 中心点
  radius: 500000, // 半径（米）
  pitch: -30, // 俯仰角
  duration: 10, // 飞行时长
  clockwise: true, // 顺时针
  loop: true, // 循环
  anglePerSecond: 36 // 每秒旋转角度（可选）
})
```

**示例：10 秒环绕一周**

```typescript
camera.startCircleAroundPoint({
  center: [116.4, 39.9, 0],
  radius: 50000,
  pitch: -45,
  duration: 10,
  loop: true
})
```

---

## 漫游控制

### 暂停/继续

```typescript
// 暂停漫游
camera.pauseOrContinueRoaming(false)

// 继续漫游
camera.pauseOrContinueRoaming(true)
```

---

### 改变速度

```typescript
// 加速到 2 倍速
camera.changeRoamingSpeed(2)

// 减速到 0.5 倍速
camera.changeRoamingSpeed(0.5)

// 恢复正常速度
camera.changeRoamingSpeed(1)
```

---

### 停止漫游

```typescript
camera.stopRoaming()
```

---

## 视角切换

漫游过程中可以切换不同的观察视角。

```typescript
import { ViewMode } from '@auto-cesium/plugins'

// 1. 跟随模式（第一人称）
camera.changeRoamingView(ViewMode.FOLLOW)

// 2. 俯视模式（正上方）
camera.changeRoamingView(ViewMode.TOP_DOWN)

// 3. 侧视模式（侧面观察）
camera.changeRoamingView(ViewMode.SIDE_VIEW)

// 4. 自定义视角
camera.changeRoamingView(ViewMode.CUSTOM, {
  heading: 45, // 航向角 45°
  pitch: -60, // 俯仰角 -60°
  range: 5000 // 距离 5000 米
})
```

**视角说明：**

| 模式      | 说明     | 默认参数                           |
| --------- | -------- | ---------------------------------- |
| FOLLOW    | 跟随模式 | 跟踪实体，相机跟随移动             |
| TOP_DOWN  | 俯视模式 | heading=0, pitch=-90               |
| SIDE_VIEW | 侧视模式 | heading=-90, pitch=-15, range=8000 |
| CUSTOM    | 自定义   | 可自定义 heading、pitch、range     |

---

## 实时数据监听

监听漫游过程中的实时数据。

```typescript
camera.onRoamingDataUpdate((data) => {
  console.log(`
    是否正在漫游: ${data.isRoaming}
    当前位置: ${data.longitude}, ${data.latitude}
    当前高程: ${data.elevation} 米
    地面高程: ${data.terrainHeight} 米
    离地高度: ${data.heightAboveTerrain} 米
    总时长: ${data.totalDurationFormatted}
    已用时长: ${data.elapsedDurationFormatted}
    总距离: ${data.totalDistance} 米
    已飞距离: ${data.elapsedDistance} 米
    进度: ${data.progress}%
  `)
})

// 或者主动获取数据
const data = camera.getRoamingData()
```

**数据字段说明：**

```typescript
interface RoamingData {
  isRoaming: boolean // 是否正在漫游
  longitude: number // 当前经度
  latitude: number // 当前纬度
  elevation: number // 当前高程（米）
  terrainHeight: number // 地面高程（米）
  heightAboveTerrain: number // 离地高度（米）
  totalDuration: number // 总时长（秒）
  elapsedDuration: number // 已用时长（秒）
  totalDistance: number // 总距离（米）
  elapsedDistance: number // 已飞距离（米）
  progress: number // 进度（0-100）
  totalDurationFormatted: string // 格式化总时长（如 "1小时20分钟"）
  elapsedDurationFormatted: string // 格式化已用时长
}
```

---

## 完整示例

### 航拍视锥体

飞行漫游支持显示相机视锥体，展示航拍的视野范围。

```typescript
camera.startCameraRoaming({
  waypoints: [
    [116.391, 39.916, 1000],
    [116.407, 39.904, 1500],
    [116.413, 39.982, 800]
  ],
  duration: 60,
  cameraOffset: {
    heading: 0,
    pitch: -45, // 向下 45 度航拍
    range: 500
  },
  showPath: true,
  showFrustum: true, // 显示相机视锥体
  frustumOptions: {
    length: 100, // 视锥体长度 100 米
    fov: 60, // 视野角度 60 度
    color: Cesium.Color.BLUE.withAlpha(0.3),
    outlineColor: Cesium.Color.BLUE
  }
})
```

**视锥体参数：**

- `length`：视锥体长度（米），默认 100
- `fov`：视野角度（度），默认 60
- `color`：填充颜色，默认半透明蓝色
- `outlineColor`：线框颜色，默认蓝色

---

### 示例 1：城市巡航

```typescript
import { CameraPlugin, ViewMode } from '@auto-cesium/plugins'

const camera = viewer.use(CameraPlugin)

// 定义城市巡航路线
const cityTour = [
  [116.391, 39.916, 1000], // 天安门
  [116.407, 39.904, 1500], // 故宫
  [116.413, 39.982, 800], // 鸟巢
  [116.288, 39.988, 1200] // 颐和园
]

// 开始巡航
camera.startCameraRoaming({
  waypoints: cityTour,
  duration: 60, // 60 秒完成
  speedMultiplier: 1,
  loop: true, // 循环巡航
  interpolation: 'hermite',
  cameraOffset: {
    heading: 0,
    pitch: -45,
    range: 500
  },
  showPath: true,
  pathOptions: {
    width: 3,
    material: Cesium.Color.CYAN
  },
  showFrustum: true, // 显示航拍视野
  frustumOptions: {
    length: 150,
    fov: 70,
    color: Cesium.Color.BLUE.withAlpha(0.2)
  }
})

// 监听实时数据
camera.onRoamingDataUpdate((data) => {
  document.getElementById('progress').textContent = `${data.progress}%`
  document.getElementById('location').textContent = `${data.longitude.toFixed(4)}, ${data.latitude.toFixed(4)}`
  document.getElementById('altitude').textContent = `${data.heightAboveTerrain.toFixed(1)} 米`
})

// 控制按钮
document.getElementById('pause').onclick = () => {
  camera.pauseOrContinueRoaming(false)
}

document.getElementById('resume').onclick = () => {
  camera.pauseOrContinueRoaming(true)
}

document.getElementById('faster').onclick = () => {
  camera.changeRoamingSpeed(2)
}

document.getElementById('slower').onclick = () => {
  camera.changeRoamingSpeed(0.5)
}

document.getElementById('stop').onclick = () => {
  camera.stopRoaming()
}

// 视角切换
document.getElementById('topView').onclick = () => {
  camera.changeRoamingView(ViewMode.TOP_DOWN)
}

document.getElementById('sideView').onclick = () => {
  camera.changeRoamingView(ViewMode.SIDE_VIEW)
}
```

---

### 示例 2：飞机飞行模拟

```typescript
import { CameraPlugin } from '@auto-cesium/plugins'

const camera = viewer.use(CameraPlugin)

// 飞行航线
const flightPath = [
  [116.4, 39.9, 10000],
  [117.2, 39.1, 8000],
  [118.8, 39.0, 9000],
  [120.2, 30.3, 7000]
]

// 开始飞行
camera.startModelRoaming({
  waypoints: flightPath,
  duration: 30,
  speedMultiplier: 1,
  loop: false,
  interpolation: 'lagrange',

  model: {
    uri: '/models/airplane.glb',
    minimumPixelSize: 64,
    maximumScale: 20000
  },

  showLabel: true,
  labelOptions: {
    text: 'CA1234 航班',
    font: '16pt Microsoft YaHei',
    fillColor: Cesium.Color.WHITE,
    outlineColor: Cesium.Color.BLACK,
    outlineWidth: 2
  },

  showPolyline: true,
  polylineOptions: {
    width: 2,
    material: Cesium.Color.YELLOW
  },

  showPath: true,
  pathOptions: {
    width: 1,
    material: Cesium.Color.CYAN.withAlpha(0.5)
  },

  showFrustum: true, // 显示机载相机视野
  frustumOptions: {
    length: 200, // 航拍距离 200 米
    fov: 60,
    color: Cesium.Color.GREEN.withAlpha(0.2),
    outlineColor: Cesium.Color.GREEN
  }
})

// 实时显示飞行数据
camera.onRoamingDataUpdate((data) => {
  console.log(`飞行高度: ${data.heightAboveTerrain.toFixed(0)} 米`)
  console.log(`飞行进度: ${data.progress}%`)
  console.log(`预计剩余: ${data.totalDurationFormatted}`)
})
```

---

### 示例 3：地标环绕展示

```typescript
const camera = viewer.use(CameraPlugin)

// 环绕鸟巢
camera.startCircleAroundPoint({
  center: [116.3972, 39.9926, 0], // 鸟巢坐标
  radius: 1000, // 1km 半径
  pitch: -30, // 俯角 30°
  duration: 20, // 20 秒一圈
  clockwise: true,
  loop: true
})

// 5 秒后切换到逆时针
setTimeout(() => {
  camera.stopRoaming()
  camera.startCircleAroundPoint({
    center: [116.3972, 39.9926, 0],
    radius: 1000,
    pitch: -45,
    duration: 15,
    clockwise: false,
    loop: true
  })
}, 5000)
```

---

## 注意事项

1. **插值算法选择**：
   - Hermite：适合相机漫游，曲线更平滑
   - Lagrange：适合模型漫游，运动更自然

2. **性能优化**：
   - 航点不宜过多（建议 < 50 个）
   - 贴地/贴模型会增加性能开销
   - 实时数据监听频率较高，避免在回调中执行耗时操作

3. **时钟管理**：
   - 漫游会修改 Cesium 的时钟设置
   - 停止漫游后时钟会重置

4. **视角控制**：
   - 跟随模式下，`cameraOffset` 参数生效
   - 其他视角模式下，使用 `changeRoamingView` 切换

---

## 室内漫游

室内漫游提供第一人称视角的自动漫游功能，适合室内场景展示。

### 基础用法

```typescript
import { CameraPlugin } from '@auto-cesium/plugins'

const camera = viewer.use(CameraPlugin)

// 启动室内漫游
camera.startIndoorRoaming({
  waypoints: [
    [116.4, 39.9, 10], // 起点
    [116.41, 39.91, 10], // 中间点
    [116.42, 39.92, 10] // 终点
  ],
  duration: 30, // 30 秒完成
  interpolation: 'hermite', // 平滑插值
  cameraHeight: 1.7, // 人眼高度 1.7 米
  pitchAngle: 0, // 水平视角
  showPath: true // 显示路径
})

// 停止漫游
camera.stopIndoorRoaming()
```

### 配置选项

```typescript
interface IndoorRoamingOptions {
  waypoints: [number, number, number][] // 航点（经度、纬度、高度）
  duration?: number // 总时长（秒），默认 60
  speedMultiplier?: number // 速度倍率，默认 1
  loop?: boolean // 是否循环，默认 false
  interpolation?: 'hermite' | 'lagrange' // 插值算法，默认 hermite
  interpolationDegree?: number // 插值度数，默认 100（hermite）或 5（lagrange）
  cameraHeight?: number // 相机高度（米），默认 1.7
  pitchAngle?: number // 俯仰角（度），默认 0
  lookAheadDistance?: number // 向前看的距离（米），默认 10
  showPath?: boolean // 是否显示路径，默认 false
  pathOptions?: {
    width?: number // 路径宽度
    material?: Cesium.Color // 路径颜色
  }
  showFrustum?: boolean // 是否显示相机视锥体，默认 false
  frustumOptions?: {
    length?: number // 视锥体长度（米），默认 50
    fov?: number // 视野角度（度），默认 60
    color?: Cesium.Color // 视锥体颜色，默认半透明黄色
    outlineColor?: Cesium.Color // 线框颜色，默认黄色
    outlineWidth?: number // 线框宽度，默认 2
    fill?: boolean // 是否显示填充，默认 true
    outline?: boolean // 是否显示线框，默认 true
  }
}
```

### 控制方法

```typescript
// 暂停漫游
camera.pauseOrContinueIndoorRoaming(false)

// 继续漫游
camera.pauseOrContinueIndoorRoaming(true)

// 改变速度（2 倍速）
camera.changeIndoorRoamingSpeed(2)

// 监听实时数据
camera.onIndoorRoamingDataUpdate((data) => {
  console.log(`位置: ${data.longitude}, ${data.latitude}`)
  console.log(`进度: ${data.progress}%`)
})

// 获取当前数据
const data = camera.getIndoorRoamingData()
```

### 完整示例

```typescript
const camera = viewer.use(CameraPlugin)

// 室内展厅漫游
camera.startIndoorRoaming({
  waypoints: [
    [116.4, 39.9, 5], // 入口
    [116.41, 39.9, 5], // 走廊
    [116.41, 39.91, 5], // 展厅 1
    [116.4, 39.91, 5], // 展厅 2
    [116.4, 39.9, 5] // 回到入口
  ],
  duration: 60,
  loop: true,
  interpolation: 'hermite',
  interpolationDegree: 100,
  cameraHeight: 1.7,
  pitchAngle: 0,
  showPath: true,
  pathOptions: {
    width: 2,
    material: Cesium.Color.CYAN
  },
  showFrustum: true, // 显示相机视锥体
  frustumOptions: {
    length: 50, // 视锥体长度 50 米
    fov: 60, // 视野角度 60 度
    color: Cesium.Color.YELLOW.withAlpha(0.3),
    outlineColor: Cesium.Color.YELLOW,
    outlineWidth: 2
  }
})

// 实时显示进度
camera.onIndoorRoamingDataUpdate((data) => {
  document.getElementById('progress').textContent = `${data.progress}%`
  document.getElementById('time').textContent = data.elapsedDurationFormatted
})

// 控制按钮
document.getElementById('pause').onclick = () => {
  camera.pauseOrContinueIndoorRoaming(false)
}

document.getElementById('resume').onclick = () => {
  camera.pauseOrContinueIndoorRoaming(true)
}

document.getElementById('stop').onclick = () => {
  camera.stopIndoorRoaming()
}
```

---

### 相机视锥体

室内漫游支持在每个航点显示相机视锥体（Camera Frustum），直观展示相机的视角范围。

**启用视锥体：**

```typescript
camera.startIndoorRoaming({
  waypoints: [
    [116.4, 39.9, 5],
    [116.41, 39.91, 5],
    [116.42, 39.92, 5]
  ],
  duration: 30,
  showFrustum: true, // 启用视锥体
  frustumOptions: {
    length: 50, // 视锥体长度（米）
    fov: 60, // 视野角度（度）
    color: Cesium.Color.YELLOW.withAlpha(0.3), // 填充颜色
    outlineColor: Cesium.Color.YELLOW, // 线框颜色
    outlineWidth: 2, // 线框宽度
    fill: true, // 显示填充
    outline: true // 显示线框
  }
})
```

**视锥体参数说明：**

- `length`：视锥体长度（米），表示视野的可见距离，默认 50 米
- `fov`：视野角度（Field of View，度），默认 60 度
- `color`：视锥体填充颜色，默认半透明黄色
- `outlineColor`：视锥体线框颜色，默认黄色
- `outlineWidth`：线框宽度，默认 2
- `fill`：是否显示填充，默认 true
- `outline`：是否显示线框，默认 true

**使用场景：**

- ✅ **路径规划**：预览每个航点的相机视角，优化航点位置
- ✅ **视野检查**：确保关键区域都在视野范围内
- ✅ **展示演示**：向客户展示漫游路线和视角覆盖范围
- ✅ **调试工具**：调试相机朝向和视角设置

**示例：博物馆导览**

```typescript
camera.startIndoorRoaming({
  waypoints: [
    [116.4, 39.9, 3], // 大厅
    [116.41, 39.9, 3], // 展品 A
    [116.41, 39.91, 3], // 展品 B
    [116.4, 39.91, 3] // 展品 C
  ],
  duration: 60,
  loop: true,
  cameraHeight: 1.7,
  pitchAngle: -10, // 略微向下 10 度
  showPath: true,
  showFrustum: true, // 显示视锥体，便于调整航点
  frustumOptions: {
    length: 30, // 室内场景使用较短的视距
    fov: 70, // 较宽的视野角度
    color: Cesium.Color.CYAN.withAlpha(0.2),
    outlineColor: Cesium.Color.CYAN
  }
})
```

---

## 键盘漫游

键盘漫游提供第一人称视角的自由漫游功能，适合交互式场景探索。

### 基础用法

```typescript
import { CameraPlugin, EventPlugin } from '@auto-cesium/plugins'

// 推荐：结合 EventPlugin 使用（统一事件管理）
const event = viewer.use(EventPlugin)
const camera = viewer.use(CameraPlugin)

// 启动键盘漫游
camera.startKeyboardRoaming({
  moveSpeed: 10, // 移动速度 10 米/秒
  rotateSpeed: 0.002, // 旋转速度
  enableCollision: true, // 启用碰撞检测
  minHeight: 1.5 // 最小高度 1.5 米
})

// 停止键盘漫游
camera.stopKeyboardRoaming()
```

**注意**：键盘漫游会自动使用 EventPlugin 进行事件管理（如果已安装）。如果没有安装 EventPlugin，会降级到直接 DOM 事件绑定。

### 键盘控制

| 按键  | 功能         |
| ----- | ------------ |
| W / ↑ | 前进         |
| S / ↓ | 后退         |
| A / ← | 左移         |
| D / → | 右移         |
| Q     | 上升         |
| E     | 下降         |
| Shift | 加速（按住） |

### 鼠标控制

| 操作     | 功能         |
| -------- | ------------ |
| 右键拖拽 | 旋转视角     |
| 滚轮     | 调整移动速度 |

### 配置选项

```typescript
interface KeyboardRoamingOptions {
  moveSpeed?: number // 移动速度（米/秒），默认 10
  rotateSpeed?: number // 旋转速度（弧度/像素），默认 0.002
  verticalSpeed?: number // 垂直移动速度（米/秒），默认 5
  speedMultiplier?: number // Shift 加速倍率，默认 3
  enableCollision?: boolean // 是否启用碰撞检测，默认 true
  minHeight?: number // 最小高度（米），默认 1.5
}
```

### 控制方法

```typescript
// 检查是否已启用
const isEnabled = camera.isKeyboardRoamingEnabled()

// 设置移动速度
camera.setKeyboardRoamingSpeed(20) // 20 米/秒

// 获取当前速度
const speed = camera.getKeyboardRoamingSpeed()

// 停止键盘漫游
camera.stopKeyboardRoaming()
```

### 完整示例

```typescript
import { AutoViewer } from '@auto-cesium/core'
import { CameraPlugin, EventPlugin } from '@auto-cesium/plugins'

const ktdViewer = new AutoViewer(cesiumViewer)

// 1. 先安装 EventPlugin（推荐，提供统一的事件管理）
const event = ktdViewer.use(EventPlugin)

// 2. 安装 CameraPlugin（会自动使用 EventPlugin）
const camera = ktdViewer.use(CameraPlugin)

// 3. 启动键盘漫游
camera.startKeyboardRoaming({
  moveSpeed: 15,
  rotateSpeed: 0.003,
  verticalSpeed: 8,
  speedMultiplier: 3,
  enableCollision: true,
  minHeight: 2.0
})

// 显示提示信息
console.log(`
键盘漫游已启动！
控制说明：
- WASD/方向键：移动
- Q/E：上升/下降
- Shift：加速
- 右键拖拽：旋转视角
- 滚轮：调整速度
`)

// 实时显示速度
setInterval(() => {
  if (camera.isKeyboardRoamingEnabled()) {
    const speed = camera.getKeyboardRoamingSpeed()
    document.getElementById('speed').textContent = `${speed.toFixed(1)} 米/秒`
  }
}, 100)

// 退出按钮
document.getElementById('exit').onclick = () => {
  camera.stopKeyboardRoaming()
  console.log('键盘漫游已停止')
}
```

### EventPlugin 集成

键盘漫游使用 EventPlugin 进行统一的事件管理，具有以下优势：

- ✅ **统一管理**：所有事件通过 EventPlugin 统一管理，便于调试和维护
- ✅ **自动清理**：停止漫游时自动清理所有事件监听器，避免内存泄漏
- ✅ **降级支持**：如果未安装 EventPlugin，自动降级到直接 DOM 事件绑定
- ✅ **更好的性能**：EventPlugin 内部优化了事件处理性能

```typescript
// 方式 1：使用 EventPlugin（推荐）
const event = viewer.use(EventPlugin)
const camera = viewer.use(CameraPlugin)
camera.startKeyboardRoaming() // 自动使用 EventPlugin

// 方式 2：不使用 EventPlugin（降级方案）
const camera = viewer.use(CameraPlugin)
camera.startKeyboardRoaming() // 使用直接 DOM 事件绑定
```

---

## 室内漫游 vs 键盘漫游

| 特性     | 室内漫游         | 键盘漫游                       |
| -------- | ---------------- | ------------------------------ |
| 控制方式 | 自动沿航点       | 键盘+鼠标手动控制              |
| 适用场景 | 自动展示、演示   | 交互探索、游戏化体验           |
| 路径规划 | 需要预定义航点   | 自由移动                       |
| 插值平滑 | ✅ 支持          | ❌ 不支持                      |
| 碰撞检测 | ❌ 不支持        | ✅ 支持                        |
| 速度控制 | 速度倍率         | 实时调整+加速键                |
| 视角控制 | 自动朝向运动方向 | 鼠标自由旋转                   |
| 事件管理 | Cesium 时钟事件  | EventPlugin（推荐）或 DOM 事件 |
| 依赖插件 | 无               | EventPlugin（可选）            |

---

## 参考来源

本插件参考了以下示例：

- [Cesium-Examples](https://github.com/jiawanlong/Cesium-Examples) - Roaming.js 漫游示例

---

## 版本历史

- v2.0.0 - 重构为模块化结构，添加飞行漫游功能
- v1.0.0 - 初始版本，基础相机控制

---

## 作者

auto-cesium 团队

## 许可

MIT License
