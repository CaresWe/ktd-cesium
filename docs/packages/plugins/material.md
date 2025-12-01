# MaterialPlugin

材质插件提供了自定义 Cesium 材质，包括水面材质、线状流动材质、圆形波纹材质、视频材质等，用于创建各种视觉效果。

## 导入

```typescript
import {
  WaterMaterial,
  createWaterMaterial,
  LineFlowMaterial,
  CircleWaveMaterial,
  VideoMaterial,
  createVideoMaterial
} from '@ktd-cesium/plugins'
import type {
  WaterMaterialOptions,
  WaveType,
  LineFlowMaterialOptions,
  CircleWaveMaterialOptions,
  VideoMaterialOptions
} from '@ktd-cesium/plugins'
```

## 核心特性

- **水面材质**：支持反射水面、波纹动画、流动效果
- **线状流动材质**：支持线条流动动画效果
- **圆形波纹材质**：支持圆形波纹扩散效果
- **视频材质**：支持视频纹理材质

## WaterMaterial - 水面材质

### 创建水面材质

```typescript
import { WaterMaterial, createWaterMaterial } from '@ktd-cesium/plugins'

// 方式 1：使用类
const waterMaterial = new WaterMaterial({
  baseWaterColor: '#1e90ff',
  blendColor: '#00bfff',
  waveType: 'ripple',
  frequency: 8.0,
  amplitude: 0.01,
  animationSpeed: 0.005
})

// 方式 2：使用工厂函数
const waterMaterial = createWaterMaterial({
  baseWaterColor: '#1e90ff',
  blendColor: '#00bfff',
  waveType: 'ripple'
})
```

### 配置选项

```typescript
interface WaterMaterialOptions {
  baseWaterColor?: Cesium.Color | string // 基础水体颜色
  blendColor?: Cesium.Color | string // 混合颜色
  normalMap?: string // 法线贴图 URL
  waveType?: WaveType // 波浪类型
  frequency?: number // 波浪频率
  amplitude?: number // 波浪振幅
  animationSpeed?: number // 动画速度
  specularIntensity?: number // 镜面反射强度
  fadeFactor?: number // 颜色渐变因子
  flowDirection?: number // 流动方向（角度，0-360）
  flowSpeed?: number // 流动速度
}
```

### 波浪类型

```typescript
type WaveType = 'calm' | 'ripple' | 'wave' | 'turbulent'
```

| 类型        | 说明 | 频率 | 振幅  | 速度  |
| ----------- | ---- | ---- | ----- | ----- |
| `calm`      | 平静 | 2.0  | 0.002 | 0.002 |
| `ripple`    | 涟漪 | 8.0  | 0.01  | 0.005 |
| `wave`      | 波浪 | 15.0 | 0.02  | 0.01  |
| `turbulent` | 湍流 | 25.0 | 0.04  | 0.02  |

### 使用示例

```typescript
import { createWaterMaterial } from '@ktd-cesium/plugins'

// 创建水面实体
const waterEntity = viewer.cesiumViewer.entities.add({
  polygon: {
    hierarchy: Cesium.Cartesian3.fromDegreesArray([116.4, 39.9, 116.5, 39.9, 116.5, 40.0, 116.4, 40.0]),
    material: createWaterMaterial({
      baseWaterColor: '#1e90ff',
      blendColor: '#00bfff',
      waveType: 'ripple',
      normalMap: '/textures/water_normal.jpg',
      flowDirection: 45,
      flowSpeed: 0.02
    }),
    extrudedHeight: 0,
    height: 100
  }
})
```

## LineFlowMaterial - 线状流动材质

### 创建线状流动材质

```typescript
import { LineFlowMaterial } from '@ktd-cesium/plugins'

const lineFlowMaterial = new LineFlowMaterial({
  color: Cesium.Color.CYAN,
  url: '/textures/line_flow.png',
  duration: 2000,
  repeat: new Cesium.Cartesian2(1, 1),
  axisY: false
})
```

### 配置选项

```typescript
interface LineFlowMaterialOptions {
  color?: Cesium.Color // 颜色
  url?: string // 流动纹理 URL
  duration?: number // 动画持续时间（毫秒）
  repeat?: Cesium.Cartesian2 // 纹理重复次数
  axisY?: boolean // 是否沿 Y 轴流动
  bgUrl?: string // 背景纹理 URL
  bgColor?: Cesium.Color // 背景颜色
}
```

### 使用示例

```typescript
import { LineFlowMaterial } from '@ktd-cesium/plugins'

// 创建流动线条
const flowLine = viewer.cesiumViewer.entities.add({
  polyline: {
    positions: Cesium.Cartesian3.fromDegreesArray([116.4, 39.9, 116.5, 39.9, 116.6, 39.95]),
    width: 5,
    material: new LineFlowMaterial({
      color: Cesium.Color.CYAN,
      url: '/textures/line_flow.png',
      duration: 2000
    })
  }
})
```

## CircleWaveMaterial - 圆形波纹材质

### 创建圆形波纹材质

```typescript
import { CircleWaveMaterial } from '@ktd-cesium/plugins'

const circleWaveMaterial = new CircleWaveMaterial({
  color: Cesium.Color.CYAN,
  speed: 1.0,
  count: 3,
  gradient: 0.4
})
```

### 配置选项

```typescript
interface CircleWaveMaterialOptions {
  color?: Cesium.Color // 波纹颜色
  speed?: number // 扩散速度
  count?: number // 波纹数量
  gradient?: number // 渐变因子
}
```

### 使用示例

```typescript
import { CircleWaveMaterial } from '@ktd-cesium/plugins'

// 创建圆形波纹点
const wavePoint = viewer.cesiumViewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0),
  ellipse: {
    semiMajorAxis: 100,
    semiMinorAxis: 100,
    material: new CircleWaveMaterial({
      color: Cesium.Color.CYAN,
      speed: 1.0,
      count: 3,
      gradient: 0.4
    })
  }
})
```

## VideoMaterial - 视频材质

### 创建视频材质

```typescript
import { VideoMaterial, createVideoMaterial } from '@ktd-cesium/plugins'

// 方式 1：使用类
const videoMaterial = new VideoMaterial({
  videoUrl: '/videos/test.mp4',
  loop: true,
  playbackRate: 1.0
})

// 方式 2：使用工厂函数
const videoMaterial = createVideoMaterial({
  videoUrl: '/videos/test.mp4',
  loop: true
})
```

### 配置选项

```typescript
interface VideoMaterialOptions {
  videoUrl?: string // 视频 URL
  loop?: boolean // 是否循环播放
  playbackRate?: number // 播放速度
}
```

### 使用示例

```typescript
import { createVideoMaterial } from '@ktd-cesium/plugins'

// 创建视频纹理实体
const videoEntity = viewer.cesiumViewer.entities.add({
  rectangle: {
    coordinates: Cesium.Rectangle.fromDegrees(116.4, 39.9, 116.5, 40.0),
    material: createVideoMaterial({
      videoUrl: '/videos/test.mp4',
      loop: true,
      playbackRate: 1.0
    })
  }
})
```

## 使用场景

### 场景 1：创建水面效果

```typescript
import { createWaterMaterial } from '@ktd-cesium/plugins'

function createLake(positions: Cesium.Cartesian3[]) {
  viewer.cesiumViewer.entities.add({
    polygon: {
      hierarchy: new Cesium.PolygonHierarchy(positions),
      material: createWaterMaterial({
        baseWaterColor: '#1e90ff',
        blendColor: '#00bfff',
        waveType: 'ripple',
        frequency: 8.0,
        amplitude: 0.01,
        animationSpeed: 0.005,
        normalMap: '/textures/water_normal.jpg',
        flowDirection: 45,
        flowSpeed: 0.02
      }),
      extrudedHeight: 0,
      height: 100
    }
  })
}
```

### 场景 2：创建流动路径

```typescript
import { LineFlowMaterial } from '@ktd-cesium/plugins'

function createFlowPath(positions: Cesium.Cartesian3[]) {
  viewer.cesiumViewer.entities.add({
    polyline: {
      positions: positions,
      width: 8,
      material: new LineFlowMaterial({
        color: Cesium.Color.CYAN,
        url: '/textures/line_flow.png',
        duration: 2000,
        repeat: new Cesium.Cartesian2(1, 1),
        axisY: false
      }),
      clampToGround: true
    }
  })
}
```

### 场景 3：创建雷达扫描效果

```typescript
import { CircleWaveMaterial } from '@ktd-cesium/plugins'

function createRadarScan(center: Cesium.Cartesian3) {
  viewer.cesiumViewer.entities.add({
    position: center,
    ellipse: {
      semiMajorAxis: 500,
      semiMinorAxis: 500,
      material: new CircleWaveMaterial({
        color: Cesium.Color.CYAN.withAlpha(0.6),
        speed: 2.0,
        count: 2,
        gradient: 0.3
      })
    }
  })
}
```

### 场景 4：创建视频投影

```typescript
import { createVideoMaterial } from '@ktd-cesium/plugins'

function createVideoProjection(rectangle: Cesium.Rectangle) {
  viewer.cesiumViewer.entities.add({
    rectangle: {
      coordinates: rectangle,
      material: createVideoMaterial({
        videoUrl: '/videos/projection.mp4',
        loop: true,
        playbackRate: 1.0
      }),
      height: 0
    }
  })
}
```

### 场景 5：动态更新材质属性

```typescript
import { WaterMaterial } from '@ktd-cesium/plugins'

const waterMaterial = new WaterMaterial({
  waveType: 'calm'
})

// 更新波浪类型
waterMaterial.waveType = 'turbulent'

// 更新颜色
waterMaterial.baseWaterColor = Cesium.Color.RED

// 更新流动方向
waterMaterial.flowDirection = 90
```

## 注意事项

1. **性能考虑**：
   - 自定义材质使用 GPU Shader，性能较好
   - 大量使用材质时注意性能优化
   - 视频材质会占用较多资源

2. **纹理资源**：
   - 法线贴图、流动纹理等需要加载图片资源
   - 建议使用压缩格式（如 WebP）减小文件大小
   - 预加载纹理资源避免延迟

3. **视频格式**：
   - 支持 MP4、WebM 等常见视频格式
   - 建议使用 H.264 编码的 MP4 以获得最佳兼容性
   - 视频文件大小会影响加载时间

4. **材质更新**：
   - 材质属性更新会触发 `definitionChanged` 事件
   - 某些属性（如颜色）支持 Cesium.Property，可以实现动画效果

5. **浏览器兼容性**：
   - 需要 WebGL 支持
   - 视频材质需要浏览器支持视频解码
   - 某些旧浏览器可能不支持某些材质效果

6. **与 GraphicsPlugin 集成**：
   - MaterialPlugin 的材质可以直接用于 GraphicsPlugin 绘制的图形
   - 例如 `water`、`video-fusion` 类型使用了这些材质

MaterialPlugin 提供了丰富的自定义材质，可以创建各种视觉效果，增强场景的真实感和交互性。
