# TilesPlugin - 3D Tiles 模型插件

TilesPlugin 提供 3D Tiles 模型的加载、管理和高级特效功能。

## 特性

- ✅ **模型加载** - 支持 3D Tiles 格式模型加载
- ✅ **图层管理** - 支持多图层管理，显示/隐藏控制
- ✅ **裁剪分析** - 支持单体化、平面裁剪、盒子裁剪
- ✅ **淹没分析** - 支持水面淹没模拟
- ✅ **压平分析** - 支持地形压平
- ✅ **天气效果** - 支持雨水滴和积雪效果，为模型表面添加真实天气
- ✅ **样式控制** - 支持 3D Tiles 样式定制

## 快速开始

```typescript
import { AutoViewer } from '@auto-cesium/core'
import { TilesPlugin } from '@auto-cesium/plugins'

const viewer = new AutoViewer(cesiumViewer)
const tiles = viewer.use(TilesPlugin)

// 加载 3D Tiles 模型
const layerId = await tiles.createLayer({
  name: '建筑模型',
  url: '/path/to/tileset.json'
})

// 获取图层实例
const layer = tiles.getLayer(layerId)
```

## 基础功能

### 创建图层

```typescript
const layerId = await tiles.createLayer({
  name: '城市建筑',
  url: 'https://example.com/tileset.json',
  maximumScreenSpaceError: 16,
  maximumMemoryUsage: 512
})
```

### 图层控制

```typescript
// 显示/隐藏图层
layer.show()
layer.hide()

// 移除图层
tiles.removeLayer(layerId)

// 获取所有图层
const allLayers = tiles.getAllLayers()
```

## 天气效果

TilesPlugin 支持为 3D Tiles 模型添加天气效果，包括雨水滴和积雪效果。这些效果使用 Cesium CustomShader API 实现，在模型表面渲染真实的天气现象。

### 雨水滴效果

在模型表面添加雨天的水滴和流淌效果：

```typescript
const layer = tiles.getLayer(layerId)

// 启用雨水滴
layer.enableRainDrops({
  intensity: 0.7, // 水滴强度 0-1
  dropSize: 0.06, // 水滴大小
  flowSpeed: 1.5, // 流淌速度
  dropColor: new Cesium.Color(0.5, 0.5, 0.6, 0.8)
})

// 动态调整强度
layer.updateRainIntensity(0.9)

// 禁用效果
layer.disableWeatherEffect()
```

**效果原理：**

- 通过法线检测，只在接近水平向上的表面（如屋顶）显示水滴
- 多层水滴图案叠加，形成自然效果
- 基于帧数的流淌动画
- 调整材质的高光（specular）和粗糙度（roughness）模拟水面反光

### 积雪效果

在模型表面添加积雪覆盖效果：

```typescript
// 启用积雪
layer.enableSnowAccumulation({
  thickness: 0.8, // 积雪厚度 0-1
  coverageThreshold: 0.5, // 覆盖阈值（法线 Y 值）
  snowColor: new Cesium.Color(0.95, 0.95, 0.98, 1.0),
  roughness: 0.8 // 积雪表面粗糙度
})

// 动态调整厚度
layer.updateSnowThickness(0.6)

// 禁用效果
layer.disableWeatherEffect()
```

**效果原理：**

- 根据表面法线检测朝上程度，只在朝上的表面积雪
- 添加噪声变化，使积雪分布更自然
- 根据模型高度调整积雪厚度
- 调整材质颜色和粗糙度模拟雪面特性

### 天气效果查询

```typescript
// 获取当前天气效果类型
const effectType = layer.getCurrentWeatherEffect()

if (effectType === 'rainDrops') {
  console.log('当前显示雨水滴效果')
} else if (effectType === 'snowAccumulation') {
  console.log('当前显示积雪效果')
} else {
  console.log('未应用天气效果')
}
```

### 完整示例：动态天气切换

```typescript
import { TilesPlugin } from '@auto-cesium/plugins'

const tiles = viewer.use(TilesPlugin)

// 加载建筑模型
const layerId = await tiles.createLayer({
  name: '城市建筑',
  url: '/data/city-buildings.json'
})

const layer = tiles.getLayer(layerId)

// 天气切换函数
function setWeather(type: 'clear' | 'rain' | 'snow') {
  layer.disableWeatherEffect()

  switch (type) {
    case 'rain':
      layer.enableRainDrops({
        intensity: 0.7,
        flowSpeed: 1.5
      })
      break
    case 'snow':
      layer.enableSnowAccumulation({
        thickness: 0.6
      })
      break
    case 'clear':
    default:
      // 已禁用效果
      break
  }
}

// 使用
setWeather('rain') // 切换到雨天
setWeather('snow') // 切换到雪天
setWeather('clear') // 切换到晴天
```

### 结合场景插件的全屏天气

天气效果可以与 ScenePlugin 配合使用，实现全场景天气模拟：

```typescript
import { TilesPlugin, ScenePlugin } from '@auto-cesium/plugins'

const tiles = viewer.use(TilesPlugin)
const scene = viewer.use(ScenePlugin)

// 加载建筑模型
const layerId = await tiles.createLayer({
  name: '建筑群',
  url: '/data/buildings.json'
})

const layer = tiles.getLayer(layerId)

// 雷雨天气
function enableThunderstorm() {
  // 全屏雨效果（ScenePlugin）
  scene.addRain({ mixFactor: 0.6 })
  scene.addLightning({ mixFactor: 0.4 })

  // 模型雨水滴（TilesPlugin）
  layer.enableRainDrops({
    intensity: 0.8,
    flowSpeed: 2.0
  })
}

// 雪天场景
function enableSnowScene() {
  // 全屏雪效果（ScenePlugin）
  scene.addSnow({ mixFactor: 0.4 })
  scene.addFog({ mixFactor: 0.3 })

  // 模型积雪（TilesPlugin）
  layer.enableSnowAccumulation({
    thickness: 0.7
  })
}

enableThunderstorm()
```

### 实时天气模拟

模拟降雨和降雪过程的渐变效果：

```typescript
const layer = tiles.getLayer(layerId)

// 模拟降雨过程（从小雨到大雨）
function simulateRain() {
  let intensity = 0.1

  layer.enableRainDrops({ intensity })

  const interval = setInterval(() => {
    intensity = Math.min(1.0, intensity + 0.05)
    layer.updateRainIntensity(intensity)

    if (intensity >= 1.0) {
      clearInterval(interval)
      console.log('雨势达到最大')
    }
  }, 1000)
}

// 模拟积雪过程
function simulateSnowfall() {
  let thickness = 0

  layer.enableSnowAccumulation({ thickness })

  const interval = setInterval(() => {
    thickness = Math.min(1.0, thickness + 0.02)
    layer.updateSnowThickness(thickness)

    if (thickness >= 1.0) {
      clearInterval(interval)
      console.log('积雪达到最厚')
    }
  }, 2000)
}

simulateRain()
```

## 分析功能

### 裁剪分析

```typescript
// 平面裁剪
layer.enableClipping({
  type: 'plane',
  position: [116.4, 39.9, 100],
  normal: [0, 0, 1]
})

// 盒子裁剪
layer.enableClipping({
  type: 'box',
  minPosition: [116.3, 39.8, 0],
  maxPosition: [116.5, 40.0, 200]
})

// 禁用裁剪
layer.disableClipping()
```

### 淹没分析

```typescript
// 启用淹没分析
layer.enableFloodAnalysis({
  minHeight: 0,
  maxHeight: 100,
  currentHeight: 0,
  floodColor: new Cesium.Color(0, 0.5, 1, 0.5)
})

// 更新水位高度
layer.updateFloodHeight(50)

// 禁用淹没分析
layer.disableFloodAnalysis()
```

### 压平分析

```typescript
// 启用压平
layer.enableFlatten({
  height: 100,
  positions: [
    [116.4, 39.9],
    [116.5, 39.9],
    [116.5, 40.0],
    [116.4, 40.0]
  ]
})

// 禁用压平
layer.disableFlatten()
```

## API 文档

### TilesPlugin

#### 方法

**createLayer(options: TilesLayerOptions): Promise<string>**

创建 3D Tiles 图层。

- `options.name` - 图层名称
- `options.url` - Tileset JSON 地址
- `options.maximumScreenSpaceError` - 最大屏幕空间误差（默认 16）
- `options.maximumMemoryUsage` - 最大内存使用（MB，默认 512）

返回图层 ID。

**getLayer(id: string): TilesLayerInstance**

获取图层实例。

**removeLayer(id: string): void**

移除图层。

**getAllLayers(): TilesLayerInstance[]**

获取所有图层。

### TilesLayerInstance

#### 天气效果方法

**enableRainDrops(config?: RainDropsConfig): void**

启用雨水滴效果。

- `config.intensity` - 水滴强度 0-1（默认 0.5）
- `config.dropSize` - 水滴大小（默认 0.05）
- `config.dropColor` - 水滴颜色
- `config.flowSpeed` - 流淌速度（默认 1.0）

**enableSnowAccumulation(config?: SnowAccumulationConfig): void**

启用积雪效果。

- `config.thickness` - 积雪厚度 0-1（默认 0.5）
- `config.snowColor` - 积雪颜色
- `config.roughness` - 积雪粗糙度（默认 0.8）
- `config.coverageThreshold` - 覆盖阈值 0-1（默认 0.5）

**updateRainIntensity(intensity: number): void**

更新雨水滴强度。

**updateSnowThickness(thickness: number): void**

更新积雪厚度。

**disableWeatherEffect(): void**

禁用天气效果，恢复模型原始外观。

**getCurrentWeatherEffect(): 'rainDrops' | 'snowAccumulation' | null**

获取当前天气效果类型。

#### 显示控制方法

**show(): void**

显示图层。

**hide(): void**

隐藏图层。

**isVisible(): boolean**

查询图层可见性。

## 性能优化

### 天气效果优化

```typescript
// 低端设备使用较低强度
const isMobile = /mobile/i.test(navigator.userAgent)

layer.enableRainDrops({
  intensity: isMobile ? 0.3 : 0.7
})

// 按需启用效果（相机距离控制）
viewer.camera.changed.addEventListener(() => {
  const height = viewer.camera.positionCartographic.height

  if (height < 5000) {
    // 低高度启用雨水滴
    if (!layer.getCurrentWeatherEffect()) {
      layer.enableRainDrops({ intensity: 0.5 })
    }
  } else {
    // 高高度禁用效果
    layer.disableWeatherEffect()
  }
})
```

### 模型加载优化

```typescript
// 调整最大屏幕空间误差（值越大性能越好，但质量越低）
const layerId = await tiles.createLayer({
  name: '建筑模型',
  url: '/data/tileset.json',
  maximumScreenSpaceError: 32 // 默认 16
})

// 限制内存使用
const layerId2 = await tiles.createLayer({
  name: '大型模型',
  url: '/data/large-tileset.json',
  maximumMemoryUsage: 256 // 默认 512
})
```

## 注意事项

1. **CustomShader 兼容性**：天气效果使用 Cesium CustomShader API，需要 Cesium 1.87+ 版本
2. **单一天气效果**：同一图层同一时间只能启用一种天气效果（雨水滴或积雪）
3. **法线依赖**：天气效果依赖模型法线信息，确保 3D Tiles 模型包含正确的法线数据
4. **性能影响**：天气效果会增加 GPU 负担，在低端设备上建议降低强度或禁用效果
5. **Shader 替换**：如果模型本身已有 customShader，启用天气效果会替换原有 shader

## 参考文档

- [WeatherEffectManager 详细文档](https://github.com/your-repo/blob/main/packages/plugins/src/modules/TilesPlugin/WeatherEffectManager.md)
- [ScenePlugin 场景特效](/packages/plugins/scene)
- [Cesium CustomShader 官方文档](https://cesium.com/learn/cesiumjs/ref-doc/CustomShader.html)

## 版本历史

- v1.1.0 - 添加天气效果支持（雨水滴、积雪）
- v1.0.0 - 初始版本，基础图层管理和分析功能

## 作者

auto-cesium 团队

## 许可

MIT License
