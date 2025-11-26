# WeatherEffectManager - 天气效果管理器

为 3D Tiles 模型添加真实的天气效果，包括雨水滴和积雪效果。

## 特性

- ✅ **雨水滴效果** - 模拟雨天模型表面的水滴和流淌效果
- ✅ **积雪效果** - 模拟下雪天模型表面的积雪覆盖
- ✅ **基于 CustomShader** - 使用 Cesium CustomShader API 实现高性能渲染
- ✅ **智能覆盖** - 根据表面法线自动判断积雪/水滴覆盖区域
- ✅ **实时调整** - 支持动态调整效果强度和参数

## 实现原理

### 雨水滴效果

使用 CustomShader 在片段着色器中实现：

1. **表面检测**：通过法线向量检测表面朝向，只在接近水平向上的表面显示水滴
2. **多层水滴**：生成3层不同尺寸的水滴图案，叠加形成自然效果
3. **流淌动画**：基于帧数计算时间，模拟水滴流淌效果
4. **材质调整**：
   - 增加表面反光（specular）
   - 降低粗糙度（roughness）
   - 混合水滴颜色

### 积雪效果

使用 CustomShader 在片段着色器中实现：

1. **表面检测**：检测表面朝上程度，只有朝上的表面才积雪
2. **噪声变化**：添加随机噪声，使积雪覆盖更自然
3. **高度影响**：根据模型高度调整积雪厚度
4. **材质调整**：
   - 混合雪白色
   - 增加粗糙度
   - 降低高光
   - 提升亮度

## 快速开始

```typescript
import { TilesPlugin } from '@ktd-cesium/plugins'

const tiles = viewer.use(TilesPlugin)

// 加载模型
const layerId = await tiles.createLayer({
  name: '建筑模型',
  url: '/path/to/tileset.json'
})

const layer = tiles.getLayer(layerId)

// 添加雨水滴效果
layer.enableRainDrops({
  intensity: 0.6,
  flowSpeed: 1.2
})

// 或添加积雪效果
layer.enableSnowAccumulation({
  thickness: 0.7,
  coverageThreshold: 0.5
})
```

## API 文档

### 启用雨水滴效果

```typescript
layer.enableRainDrops(config?: RainDropsConfig): void
```

**配置参数：**

```typescript
interface RainDropsConfig {
  /** 水滴强度 0-1，默认 0.5 */
  intensity?: number
  /** 水滴大小，默认 0.05 */
  dropSize?: number
  /** 水滴颜色，默认 Color(0.5, 0.5, 0.6, 0.8) */
  dropColor?: Cesium.Color
  /** 流淌速度，默认 1.0 */
  flowSpeed?: number
  /** 是否启用法线贴图 */
  enableNormalMap?: boolean
}
```

**示例：**

```typescript
// 轻度雨水滴
layer.enableRainDrops({
  intensity: 0.3,
  flowSpeed: 0.8
})

// 强烈雨水滴
layer.enableRainDrops({
  intensity: 0.9,
  dropSize: 0.08,
  flowSpeed: 2.0
})

// 自定义水滴颜色
layer.enableRainDrops({
  intensity: 0.6,
  dropColor: new Cesium.Color(0.4, 0.4, 0.7, 0.9)
})
```

---

### 更新雨水滴强度

```typescript
layer.updateRainIntensity(intensity: number): void
```

动态调整雨水滴强度，无需重新启用效果。

**示例：**

```typescript
// 渐变增强雨滴
let intensity = 0.1
const interval = setInterval(() => {
  intensity += 0.1
  layer.updateRainIntensity(intensity)

  if (intensity >= 1.0) {
    clearInterval(interval)
  }
}, 1000)
```

---

### 启用积雪效果

```typescript
layer.enableSnowAccumulation(config?: SnowAccumulationConfig): void
```

**配置参数：**

```typescript
interface SnowAccumulationConfig {
  /** 积雪厚度 0-1，默认 0.5 */
  thickness?: number
  /** 积雪颜色，默认 Color(0.95, 0.95, 0.98, 1.0) */
  snowColor?: Cesium.Color
  /** 积雪粗糙度 0-1，默认 0.8 */
  roughness?: number
  /** 积雪覆盖阈值 0-1，默认 0.5（表面法线Y值大于此值才积雪） */
  coverageThreshold?: number
}
```

**示例：**

```typescript
// 薄积雪
layer.enableSnowAccumulation({
  thickness: 0.3,
  coverageThreshold: 0.7 // 更严格的积雪条件
})

// 厚积雪
layer.enableSnowAccumulation({
  thickness: 0.9,
  coverageThreshold: 0.3 // 更宽松的积雪条件
})

// 自定义雪色（偏蓝）
layer.enableSnowAccumulation({
  thickness: 0.6,
  snowColor: new Cesium.Color(0.9, 0.92, 0.98, 1.0)
})
```

---

### 更新积雪厚度

```typescript
layer.updateSnowThickness(thickness: number): void
```

动态调整积雪厚度。

**示例：**

```typescript
// 积雪逐渐增加
let thickness = 0
const interval = setInterval(() => {
  thickness += 0.05
  layer.updateSnowThickness(thickness)

  if (thickness >= 1.0) {
    clearInterval(interval)
  }
}, 500)
```

---

### 禁用天气效果

```typescript
layer.disableWeatherEffect(): void
```

移除当前应用的天气效果，恢复模型原始外观。

**示例：**

```typescript
layer.disableWeatherEffect()
```

---

### 获取当前天气效果

```typescript
layer.getCurrentWeatherEffect(): 'rainDrops' | 'snowAccumulation' | null
```

查询当前应用的天气效果类型。

**示例：**

```typescript
const effect = layer.getCurrentWeatherEffect()

if (effect === 'rainDrops') {
  console.log('当前正在显示雨水滴效果')
} else if (effect === 'snowAccumulation') {
  console.log('当前正在显示积雪效果')
} else {
  console.log('未应用天气效果')
}
```

---

## 完整示例

### 动态天气切换

```typescript
import { TilesPlugin } from '@ktd-cesium/plugins'

const tiles = viewer.use(TilesPlugin)

const layerId = await tiles.createLayer({
  name: '城市建筑',
  url: '/data/city-buildings.json'
})

const layer = tiles.getLayer(layerId)

// 天气类型
let weatherType = 'clear'

function changeWeather(type: 'clear' | 'rain' | 'snow') {
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

  weatherType = type
}

// 使用
changeWeather('rain')  // 切换到雨天
changeWeather('snow')  // 切换到雪天
changeWeather('clear') // 切换到晴天
```

### 结合场景插件的全屏天气

```typescript
import { TilesPlugin, ScenePlugin } from '@ktd-cesium/plugins'

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
  // 全屏雨效果
  scene.addRain({ mixFactor: 0.6 })
  scene.addLightning({ mixFactor: 0.4 })

  // 模型雨水滴
  layer.enableRainDrops({
    intensity: 0.8,
    flowSpeed: 2.0
  })
}

// 雪天场景
function enableSnowScene() {
  // 全屏雪效果
  scene.addSnow({ mixFactor: 0.4 })
  scene.addFog({ mixFactor: 0.3 })

  // 模型积雪
  layer.enableSnowAccumulation({
    thickness: 0.7
  })
}

enableThunderstorm()
```

### 实时天气模拟

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

---

## 性能优化

### 1. 合理控制强度

```typescript
// 低端设备使用较低强度
const isMobile = /mobile/i.test(navigator.userAgent)

layer.enableRainDrops({
  intensity: isMobile ? 0.3 : 0.7
})
```

### 2. 按需启用

```typescript
// 只在相机靠近时启用效果
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

---

## 注意事项

1. **Shader 兼容性**：天气效果使用 Cesium CustomShader API，需要 Cesium 1.87+ 版本
2. **单一效果**：同一时间只能启用一种天气效果（雨水滴或积雪），启用新效果会自动替换旧效果
3. **法线依赖**：效果依赖模型法线信息，确保 3D Tiles 模型包含正确的法线数据
4. **性能影响**：天气效果会增加 GPU 负担，在低端设备上建议降低强度或禁用效果
5. **原始 Shader**：如果模型本身已有 customShader，启用天气效果会替换原有 shader

---

## 技术细节

### GLSL 着色器结构

```glsl
// 片段着色器入口
void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
  // 1. 获取表面信息
  vec3 normalEC = fsInput.attributes.normalEC;
  vec3 positionMC = fsInput.attributes.positionMC;

  // 2. 计算效果遮罩
  float mask = calculateMask(normalEC);

  // 3. 生成效果图案
  float pattern = generatePattern(positionMC, time);

  // 4. 混合材质属性
  material.diffuse = mix(material.diffuse, effectColor, mask * pattern);
  material.specular = mix(material.specular, vec3(1.0), mask * pattern);
  material.roughness = mix(material.roughness, targetRoughness, mask * pattern);
}
```

### 算法优化

- 使用 `smoothstep` 实现平滑过渡
- 多层采样提高视觉质量
- 基于帧数的时间动画，避免时间戳计算开销
- 预计算常量，减少片段着色器计算量

---

## 版本历史

- v1.0.0 - 初始版本，支持雨水滴和积雪效果

## 作者

ktd-cesium 团队

## 许可

MIT License
