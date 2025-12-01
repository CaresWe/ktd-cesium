# ScenePlugin

ScenePlugin 是 Ktd Cesium 的场景特效插件，提供丰富的天气效果和环境渲染功能，包括**雨、雪、雾、闪电、高度雾、局部下雨**等场景特效。

## 导入

```typescript
import { ScenePlugin } from '@auto-cesium/plugins'
import type {
  ScenePluginOptions,
  RainEffectOptions,
  SnowEffectOptions,
  FogEffectOptions,
  LightningEffectOptions,
  HeightFogEffectOptions,
  LocalRainEffectOptions
} from '@auto-cesium/plugins'
```

## 安装

```typescript
import { AutoViewer } from '@auto-cesium/core'
import { ScenePlugin } from '@auto-cesium/plugins'

const viewer = new AutoViewer(cesiumViewer)
const scene = viewer.use(ScenePlugin)
```

## 核心特性

- **天气特效**:支持雨、雪、雾等常见天气效果，基于 WebGL 后期处理实现
- **闪电效果**:基于分形算法的真实闪电效果，支持自定义混合系数和频率
- **高度雾**:基于高度的雾效果，可配置雾高度、密度和颜色
- **局部下雨**:指定区域的局部下雨效果，支持自定义雨滴参数
- **统一管理**:所有效果统一管理，支持显示/隐藏、添加/移除操作
- **高性能**:基于 Cesium PostProcessStage 和 BillboardCollection 实现，性能优异

## 插件选项

ScenePlugin 目前不需要配置选项，预留扩展能力。

```typescript
export interface ScenePluginOptions {
  // 预留扩展选项
}
```

## 效果类型

### SceneEffectType

```typescript
enum SceneEffectType {
  RAIN = 'rain', // 雨
  SNOW = 'snow', // 雪
  FOG = 'fog', // 雾
  LIGHTNING = 'lightning', // 闪电
  HEIGHT_FOG = 'heightFog', // 高度雾
  LOCAL_RAIN = 'localRain' // 局部下雨
}
```

## API 文档

### 添加雨效果

```typescript
addRain(options?: RainEffectOptions): RainEffect
```

添加全屏雨效果。

**参数:**

- `options.name` - 效果名称，默认 `'rain-effect'`
- `options.mixFactor` - 混合系数 0-1，控制效果强度

**示例:**

```typescript
const rain = scene.addRain({
  name: 'my-rain',
  mixFactor: 0.5
})

// 移除效果
rain.remove()
// 或
scene.removeEffect('my-rain')
```

---

### 添加雪效果

```typescript
addSnow(options?: SnowEffectOptions): SnowEffect
```

添加全屏雪效果。

**参数:**

- `options.name` - 效果名称，默认 `'snow-effect'`
- `options.mixFactor` - 混合系数 0-1，控制效果强度

**示例:**

```typescript
const snow = scene.addSnow({
  name: 'my-snow',
  mixFactor: 0.3
})

// 隐藏/显示
snow.hide()
snow.show()
```

---

### 添加雾效果

```typescript
addFog(options?: FogEffectOptions): FogEffect
```

添加全屏雾效果。

**参数:**

- `options.name` - 效果名称，默认 `'fog-effect'`
- `options.color` - 雾颜色，支持 Cesium.Color 或 CSS 颜色字符串
- `options.mixFactor` - 混合系数 0-1，控制雾的浓度

**示例:**

```typescript
const fog = scene.addFog({
  name: 'my-fog',
  color: '#cccccc',
  mixFactor: 0.8
})
```

---

### 添加闪电效果

```typescript
addLightning(options?: LightningEffectOptions): LightningEffect
```

添加闪电效果，支持与雨效果叠加使用。

**参数:**

- `options.name` - 效果名称，默认 `'lightning-effect'`
- `options.mixFactor` - 混合系数 0-1，默认 `0.35`
- `options.fallInterval` - 下落间隔 0-1，默认 `0.8`

**示例:**

```typescript
// 添加雨效果
const rain = scene.addRain({ mixFactor: 0.5 })

// 添加闪电效果
const lightning = scene.addLightning({
  name: 'thunder-storm',
  mixFactor: 0.35,
  fallInterval: 0.8
})

// 动态调整参数
lightning.setMixFactor(0.5)
lightning.setFallInterval(0.6)
```

---

### 添加高度雾效果

```typescript
addHeightFog(options?: HeightFogEffectOptions): HeightFogEffect
```

添加基于高度的雾效果，适合山地、高原等场景。

**参数:**

- `options.name` - 效果名称，默认 `'height-fog-effect'`
- `options.fogColor` - 雾颜色，支持 Cesium.Color 或 `[r, g, b]` 数组
- `options.fogHeight` - 雾高度（米），默认 `1000`
- `options.globalDensity` - 全局密度，默认 `0.6`

**示例:**

```typescript
const heightFog = scene.addHeightFog({
  name: 'mountain-fog',
  fogColor: [0.8, 0.82, 0.84],
  fogHeight: 1500,
  globalDensity: 0.8
})

// 动态调整参数
heightFog.setFogHeight(2000)
heightFog.setGlobalDensity(0.6)
heightFog.setFogColor([0.9, 0.9, 0.95])
```

---

### 添加局部下雨效果

```typescript
addLocalRain(options?: LocalRainEffectOptions): LocalRainEffect
```

在指定区域内添加局部下雨效果，支持**多边形区域**和**矩形区域**，适合局部天气场景。

**参数:**

- `options.name` - 效果名称，默认 `'local-rain-effect'`
- `options.positions` - **多边形区域坐标数组** `[longitude, latitude][]`，至少3个点（优先使用）
- `options.minLongitude` - 最小经度，默认 `-100`（当未提供 positions 时使用矩形边界）
- `options.minLatitude` - 最小纬度，默认 `30`
- `options.maxLongitude` - 最大经度，默认 `-99.5`
- `options.maxLatitude` - 最大纬度，默认 `30.5`
- `options.dropWidth` - 雨滴宽度（像素），默认 `15`
- `options.dropCount` - 雨滴数量，默认 `5000`
- `options.dropSpeed` - 雨滴下落速度，默认 `50`
- `options.dropImage` - 雨滴图片 URL

**示例 1: 使用多边形区域**

```typescript
// 在不规则多边形区域内降雨（如行政区划边界）
const localRain = scene.addLocalRain({
  name: 'city-rain',
  positions: [
    [116.3, 39.9], // 左下
    [116.5, 39.9], // 右下
    [116.5, 40.1], // 右上
    [116.4, 40.15], // 顶部中心
    [116.3, 40.1] // 左上
  ],
  dropCount: 8000,
  dropSpeed: 60
})

// 动态调整多边形区域
localRain.setRainPolygon([
  [116.2, 39.8],
  [116.6, 39.8],
  [116.6, 40.2],
  [116.2, 40.2]
])

// 获取当前区域配置
const area = localRain.getRainArea()
if (area.type === 'polygon') {
  console.log('多边形顶点:', area.positions)
}
```

**示例 2: 使用矩形区域**

```typescript
const localRain = scene.addLocalRain({
  name: 'city-rain',
  minLongitude: 116.3,
  minLatitude: 39.9,
  maxLongitude: 116.5,
  maxLatitude: 40.1,
  dropWidth: 20,
  dropCount: 8000,
  dropSpeed: 60
})

// 动态调整矩形区域
localRain.setRainArea(116.2, 39.8, 116.6, 40.2)

// 动态调整参数
localRain.setDropSpeed(80)
```

---

### 效果管理

```typescript
// 获取效果
getEffect(name: string): SceneEffect | undefined

// 根据类型获取效果
getEffectsByType(type: SceneEffectType): SceneEffect[]

// 获取所有效果
getAllEffects(): SceneEffect[]

// 移除效果
removeEffect(name: string): void

// 移除某类型的所有效果
removeEffectsByType(type: SceneEffectType): void

// 移除所有效果
removeAllEffects(): void

// 显示/隐藏效果
showEffect(name: string): void
hideEffect(name: string): void

// 显示/隐藏所有效果
showAllEffects(): void
hideAllEffects(): void
```

**示例:**

```typescript
// 获取效果
const rain = scene.getEffect('rain-effect')

// 获取所有雨效果
const rainEffects = scene.getEffectsByType(SceneEffectType.RAIN)

// 移除所有雾效果
scene.removeEffectsByType(SceneEffectType.FOG)

// 隐藏所有效果
scene.hideAllEffects()

// 显示所有效果
scene.showAllEffects()
```

---

## 完整示例

### 雷雨天气

```typescript
import { AutoViewer } from '@auto-cesium/core'
import { ScenePlugin } from '@auto-cesium/plugins'

const viewer = new AutoViewer(cesiumViewer)
const scene = viewer.use(ScenePlugin)

// 添加雨效果
const rain = scene.addRain({ mixFactor: 0.5 })

// 添加闪电效果
const lightning = scene.addLightning({
  mixFactor: 0.35,
  fallInterval: 0.8
})

// 可选：添加音效
const audio = new Audio('/path/to/thunder.mp3')
audio.loop = true
audio.play()
```

### 雪天场景

```typescript
const scene = viewer.use(ScenePlugin)

// 添加雪效果
const snow = scene.addSnow({ mixFactor: 0.3 })

// 添加雾效果增强氛围
const fog = scene.addFog({ mixFactor: 0.6 })
```

### 山地高度雾

```typescript
const scene = viewer.use(ScenePlugin)

// 添加高度雾
const heightFog = scene.addHeightFog({
  fogColor: [0.85, 0.87, 0.9],
  fogHeight: 1200,
  globalDensity: 0.7
})

// 飞行到合适位置观察效果
viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(116.4, 40.0, 5000),
  orientation: {
    heading: Cesium.Math.toRadians(0),
    pitch: Cesium.Math.toRadians(-30),
    roll: 0
  }
})
```

### 局部降雨区域（多边形）

```typescript
const scene = viewer.use(ScenePlugin)

// 方案1: 在北京市范围内添加局部降雨（多边形）
const beijingBoundary = [
  [116.0, 39.5],
  [117.0, 39.5],
  [117.0, 40.5],
  [116.5, 41.0],
  [116.0, 40.5]
]

const localRain = scene.addLocalRain({
  name: 'beijing-rain',
  positions: beijingBoundary,
  dropCount: 10000,
  dropSpeed: 80
})

// 方案2: 使用矩形区域（更简单但不够精确）
const localRain2 = scene.addLocalRain({
  name: 'beijing-rain-rect',
  minLongitude: 116.0,
  minLatitude: 39.5,
  maxLongitude: 117.0,
  maxLatitude: 40.5,
  dropCount: 10000,
  dropSpeed: 80
})

// 飞行到降雨区域
viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(116.4, 40.0, 50000)
})
```

---

## 高级用法

### 动态天气切换

```typescript
const scene = viewer.use(ScenePlugin)

// 天气状态
let currentWeather = 'clear'

function changeWeather(weather: 'clear' | 'rain' | 'snow' | 'fog') {
  // 移除所有效果
  scene.removeAllEffects()

  switch (weather) {
    case 'rain':
      scene.addRain({ mixFactor: 0.5 })
      scene.addLightning({ mixFactor: 0.35 })
      break
    case 'snow':
      scene.addSnow({ mixFactor: 0.3 })
      scene.addFog({ mixFactor: 0.5 })
      break
    case 'fog':
      scene.addFog({ mixFactor: 0.8 })
      break
    case 'clear':
    default:
      // 无效果
      break
  }

  currentWeather = weather
}

// 使用
changeWeather('rain')
```

### 时间驱动的天气变化

```typescript
const scene = viewer.use(ScenePlugin)

// 根据时间控制雾浓度
viewer.clock.onTick.addEventListener(() => {
  const hour = new Date().getHours()

  // 早晨和晚上雾更浓
  if (hour >= 5 && hour <= 8) {
    const fog = scene.getEffect('morning-fog') as HeightFogEffect
    if (!fog) {
      scene.addHeightFog({
        name: 'morning-fog',
        fogHeight: 800,
        globalDensity: 0.9
      })
    }
  } else {
    scene.removeEffect('morning-fog')
  }
})
```

### 多个局部天气区域（多边形）

```typescript
const scene = viewer.use(ScenePlugin)

// 北京降雨（多边形）
scene.addLocalRain({
  name: 'beijing-rain',
  positions: [
    [116.0, 39.5],
    [117.0, 39.5],
    [117.0, 40.5],
    [116.0, 40.5]
  ],
  dropCount: 8000
})

// 上海降雨（多边形）
scene.addLocalRain({
  name: 'shanghai-rain',
  positions: [
    [121.0, 30.8],
    [122.0, 30.8],
    [122.0, 31.8],
    [121.0, 31.8]
  ],
  dropCount: 8000
})

// 广州降雨（矩形，更简单）
scene.addLocalRain({
  name: 'guangzhou-rain',
  minLongitude: 113.0,
  minLatitude: 22.8,
  maxLongitude: 114.0,
  maxLatitude: 23.8,
  dropCount: 8000
})

// 从 GeoJSON 加载行政区划边界
fetch('/data/beijing-boundary.geojson')
  .then((res) => res.json())
  .then((geojson) => {
    const coordinates = geojson.features[0].geometry.coordinates[0]
    scene.addLocalRain({
      name: 'beijing-precise-rain',
      positions: coordinates,
      dropCount: 15000
    })
  })
```

---

## 性能优化

### 降低雨滴数量

局部下雨效果的性能主要取决于 `dropCount`，建议根据场景需求调整：

```typescript
// 低配置设备
scene.addLocalRain({ dropCount: 3000 })

// 中等配置设备
scene.addLocalRain({ dropCount: 5000 })

// 高配置设备
scene.addLocalRain({ dropCount: 10000 })
```

### 动态启用/禁用效果

根据相机距离动态启用效果：

```typescript
const scene = viewer.use(ScenePlugin)
const localRain = scene.addLocalRain({
  name: 'dynamic-rain',
  minLongitude: 116.0,
  minLatitude: 39.5,
  maxLongitude: 117.0,
  maxLatitude: 40.5
})

viewer.camera.changed.addEventListener(() => {
  const height = viewer.camera.positionCartographic.height

  // 高度大于100km时隐藏局部雨
  if (height > 100000) {
    localRain.hide()
  } else {
    localRain.show()
  }
})
```

---

## 注意事项

1. **WebGL 版本**: 雨、雪、雾效果使用 WebGL 2.0 着色器语法，确保浏览器支持
2. **后期处理冲突**: 多个后期处理效果叠加可能影响性能，建议合理组合使用
3. **局部雨性能**: 局部下雨使用大量 Billboard，数量过多会影响性能
4. **雾效果与地形**: 高度雾效果依赖深度纹理，需要启用 `depthTestAgainstTerrain`
5. **自定义雨滴图片**: 局部下雨支持自定义雨滴图片，推荐使用半透明 PNG 格式

---

## 类型定义

完整的类型定义请参考源码：

```typescript
export * from './types'
export * from './effects'
```

主要类型包括：

- `SceneEffectType` - 效果类型枚举
- `SceneEffect` - 效果基础接口
- `RainEffectOptions` - 雨效果配置
- `SnowEffectOptions` - 雪效果配置
- `FogEffectOptions` - 雾效果配置
- `LightningEffectOptions` - 闪电效果配置
- `HeightFogEffectOptions` - 高度雾效果配置
- `LocalRainEffectOptions` - 局部下雨效果配置
