# 粒子系统 (Particle System)

GraphicsPlugin 提供了强大的粒子系统绘制功能，支持火焰、水枪、爆炸、喷雾、烟雾等多种特效。

## 快速开始

### 基本用法

```typescript
import { GraphicsPlugin } from '@auto-cesium/plugins'
import { createFireEffect } from '@auto-cesium/plugins'

const graphics = viewer.use(GraphicsPlugin)

// 绘制火焰效果
graphics.startDraw({
  type: 'particle',
  style: {
    image: '/path/to/fire.png',
    ...createFireEffect('/path/to/fire.png')
  }
})
```

### 点击地图设置位置

用户点击地图后，粒子系统会在点击位置创建并开始播放。

## 预设粒子效果

GraphicsPlugin 提供了 5 种预设的粒子效果，可以直接使用：

### 1. 火焰效果 (Fire)

```typescript
import { createFireEffect } from '@auto-cesium/plugins'

graphics.startDraw({
  type: 'particle',
  style: createFireEffect('/path/to/fire.png')
})
```

**效果特点**：

- 锥形发射器（45度）
- 白色到红色渐变
- 向上运动

### 2. 水枪效果 (Water)

```typescript
import { createWaterEffect } from '@auto-cesium/plugins'

graphics.startDraw({
  type: 'particle',
  style: createWaterEffect('/path/to/water.png')
})
```

**效果特点**：

- 圆形发射器
- 蓝白色渐变
- 重力下落效果

### 3. 爆炸效果 (Explosion)

```typescript
import { createExplosionEffect } from '@auto-cesium/plugins'

graphics.startDraw({
  type: 'particle',
  style: createExplosionEffect('/path/to/explosion.png')
})
```

**效果特点**：

- 大范围圆形发射
- 红色到黄色渐变
- 爆炸扩散效果

### 4. 喷雾效果 (Spray)

```typescript
import { createSprayEffect } from '@auto-cesium/plugins'

graphics.startDraw({
  type: 'particle',
  style: createSprayEffect('/path/to/spray.png')
})
```

**效果特点**：

- 小角度锥形发射
- 白色半透明
- 轻微重力和扩散

### 5. 烟雾效果 (Smoke)

```typescript
import { createSmokeEffect } from '@auto-cesium/plugins'

graphics.startDraw({
  type: 'particle',
  style: createSmokeEffect('/path/to/smoke.png')
})
```

**效果特点**：

- 圆形发射器
- 黑色到白色渐变
- 向上飘散效果

## 自定义粒子效果

### 完整配置示例

```typescript
graphics.startDraw({
  type: 'particle',
  style: {
    // 粒子图片（必需）
    image: '/path/to/particle.png',

    // 颜色配置
    startColor: '#ffffff', // 或 Cesium.Color.WHITE
    endColor: '#ff0000', // 或 Cesium.Color.RED.withAlpha(0)

    // 缩放配置
    startScale: 0.0,
    endScale: 10.0,

    // 生命周期（秒）
    minimumParticleLife: 1.0,
    maximumParticleLife: 6.0,

    // 速度配置
    minimumSpeed: 1.0,
    maximumSpeed: 4.0,

    // 粒子大小（像素）
    particleSize: 25.0,

    // 发射率（每秒发射的粒子数）
    emissionRate: 5.0,

    // 系统生命周期（秒）
    lifetime: 16.0,

    // 是否循环
    loop: true,

    // 大小单位（米或像素）
    sizeInMeters: true,

    // 发射器类型
    emitterType: 'cone', // 'cone' | 'box' | 'circle' | 'sphere'

    // 发射器参数
    emitterOptions: 45.0, // 圆锥角度（度）

    // 发射器位置偏移
    emitterOffset: { x: -4.0, y: 0.0, z: 1.4 },

    // 发射器旋转
    emitterRotation: { heading: 0, pitch: 0, roll: 0 },

    // 重力类型
    gravityType: 'none' // 'none' | 'water' | 'smoke' | 'spray'
  }
})
```

### 发射器类型说明

| 类型     | 参数            | 说明                         |
| -------- | --------------- | ---------------------------- |
| `cone`   | `number` (角度) | 锥形发射器，参数为锥角（度） |
| `box`    | `{x, y, z}`     | 盒形发射器，参数为盒子尺寸   |
| `circle` | `number` (半径) | 圆形发射器，参数为半径（米） |
| `sphere` | `number` (半径) | 球形发射器，参数为半径（米） |

### 重力效果类型

| 类型    | 效果         |
| ------- | ------------ |
| `none`  | 无重力效果   |
| `water` | 水流下落效果 |
| `smoke` | 烟雾上升效果 |
| `spray` | 喷雾扩散效果 |

## 编辑粒子系统

### 启用编辑

粒子系统支持位置编辑：

```typescript
const graphics = viewer.use(GraphicsPlugin, {
  hasEdit: true // 启用编辑功能
})

// 绘制粒子系统后，点击选中即可拖拽移动位置
```

### 更新样式

```typescript
// 获取当前编辑的实体
const entity = graphics.getCurrentEntity()

// 更新粒子系统样式
graphics.updateAttribute(
  {
    style: {
      emissionRate: 10.0, // 增加发射率
      particleSize: 30.0 // 增大粒子
    }
  },
  entity
)
```

## GeoJSON 导入导出

### 导出粒子系统

```typescript
// 导出单个粒子系统
const entity = graphics.getCurrentEntity()
const geojson = graphics.toGeoJSON(entity)

// 导出所有图形（包括粒子系统）
const allGeoJSON = graphics.toGeoJSON()
```

### 导入粒子系统

```typescript
const particleGeoJSON = {
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [116.39, 39.9, 100] // [经度, 纬度, 高度]
  },
  properties: {
    type: 'particle',
    style: {
      image: '/path/to/fire.png',
      effectType: 'fire',
      gravityType: 'none',
      emissionRate: 5.0,
      particleSize: 25.0
    }
  }
}

graphics.loadJson(particleGeoJSON)
```

## 使用预设效果

使用 `getParticleEffect` 函数快速获取预设效果：

```typescript
import { getParticleEffect } from '@auto-cesium/plugins'

graphics.startDraw({
  type: 'particle',
  style: getParticleEffect('fire', '/path/to/fire.png')
})

// 支持的效果类型: 'fire' | 'water' | 'explosion' | 'spray' | 'smoke'
```

## 性能优化建议

1. **控制粒子数量**：通过 `emissionRate` 控制发射率，避免同时存在过多粒子
2. **合理设置生命周期**：使用 `minimumParticleLife` 和 `maximumParticleLife` 控制粒子存活时间
3. **优化图片资源**：使用较小的纹理图片，并启用 mipmap
4. **限制粒子系统数量**：避免同时渲染过多粒子系统

## 完整示例

```typescript
import { AutoViewer } from '@auto-cesium/core'
import { GraphicsPlugin, createFireEffect, createSmokeEffect } from '@auto-cesium/plugins'

// 初始化
const viewer = new AutoViewer(cesiumViewer)
const graphics = viewer.use(GraphicsPlugin, {
  hasEdit: true
})

// 示例1：绘制火焰效果
graphics.startDraw({
  type: 'particle',
  style: createFireEffect('/assets/fire.png')
})

// 示例2：自定义粒子效果
graphics.startDraw({
  type: 'particle',
  style: {
    image: '/assets/custom-particle.png',
    startColor: '#00ff00',
    endColor: '#0000ff',
    emitterType: 'sphere',
    emitterOptions: 2.0,
    gravityType: 'none',
    emissionRate: 10.0,
    particleSize: 20.0
  }
})

// 示例3：从 GeoJSON 加载
const geoJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [116.39, 39.9, 100]
      },
      properties: {
        type: 'particle',
        style: createSmokeEffect('/assets/smoke.png')
      }
    }
  ]
}

graphics.loadJson(geoJSON, {
  flyTo: true // 加载后飞到该位置
})

// 导出所有图形
const exportedGeoJSON = graphics.toGeoJSON()
console.log(JSON.stringify(exportedGeoJSON, null, 2))
```

## 类型定义

```typescript
interface ParticleStyleConfig {
  image: string
  startColor?: string | Cesium.Color
  endColor?: string | Cesium.Color
  startScale?: number
  endScale?: number
  minimumParticleLife?: number
  maximumParticleLife?: number
  minimumSpeed?: number
  maximumSpeed?: number
  particleSize?: number
  emissionRate?: number
  lifetime?: number
  loop?: boolean
  sizeInMeters?: boolean
  emitterType?: 'cone' | 'box' | 'circle' | 'sphere'
  emitterOptions?: number | { x: number; y: number; z: number }
  emitterOffset?: { x: number; y: number; z: number }
  emitterRotation?: { heading: number; pitch: number; roll: number }
  effectType?: 'fire' | 'water' | 'explosion' | 'spray' | 'smoke' | 'custom'
  gravityType?: 'none' | 'water' | 'smoke' | 'spray'
}
```

## 注意事项

1. **图片资源**：确保粒子图片路径正确且已加载
2. **坐标系统**：粒子位置使用笛卡尔坐标系，通过点击地图自动获取
3. **性能考虑**：大量粒子系统会影响性能，建议根据场景需求合理配置
4. **编辑限制**：目前仅支持位置编辑，样式需通过 `updateAttribute` 修改
5. **循环播放**：默认 `loop: true`，如需单次播放可设置为 `false`
