# 最佳实践

本文档介绍使用 KTD-Cesium 的最佳实践和推荐做法。

## 项目结构

### 推荐的目录结构

```
src/
├── cesium/
│   ├── viewer.ts          # Viewer 初始化
│   ├── plugins.ts         # 插件配置
│   └── types.ts           # 类型定义
├── components/            # Vue/React 组件
├── utils/                 # 工具函数
└── App.vue / App.tsx     # 主应用
```

### Viewer 初始化

```typescript
// cesium/viewer.ts
import { KtdViewer } from '@ktd-cesium/core'
import * as Cesium from 'cesium'
import type { KtdViewer as KtdViewerType } from '@ktd-cesium/core'

let viewer: KtdViewerType | null = null

export function initViewer(container: HTMLElement | string): KtdViewerType {
  if (viewer) {
    console.warn('Viewer already initialized')
    return viewer
  }

  const cesiumViewer = new Cesium.Viewer(container, {
    terrain: Cesium.Terrain.fromWorldTerrain(),
    animation: false,
    timeline: false,
    vrButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    sceneModePicker: false,
    selectionIndicator: false,
    navigationHelpButton: false,
    navigationInstructionsInitiallyVisible: false
  })

  viewer = new KtdViewer(cesiumViewer)
  return viewer
}

export function getViewer(): KtdViewerType | null {
  return viewer
}

export function destroyViewer(): void {
  if (viewer) {
    viewer.destroy()
    viewer = null
  }
}
```

### 插件管理

```typescript
// cesium/plugins.ts
import type { KtdViewer } from '@ktd-cesium/core'
import { BaseLayerPlugin, CameraPlugin, EventPlugin, GraphicsPlugin, PopupPlugin } from '@ktd-cesium/plugins'

export function setupPlugins(viewer: KtdViewer) {
  // 基础图层
  const baseLayer = viewer.use(BaseLayerPlugin)
  baseLayer.addLayer({
    type: 'tianditu',
    layer: 'img_w'
  })

  // 相机控制
  const camera = viewer.use(CameraPlugin)

  // 事件处理
  const events = viewer.use(EventPlugin)

  // 图形绘制
  const graphics = viewer.use(GraphicsPlugin, {
    hasEdit: true,
    transform: {
      enabled: true,
      mode: 'translate'
    }
  })

  // 弹窗
  const popup = viewer.use(PopupPlugin)

  return {
    baseLayer,
    camera,
    events,
    graphics,
    popup
  }
}
```

## 性能优化

### 1. 按需加载插件

```typescript
// 只在需要时加载插件
function loadGraphicsPlugin() {
  if (!viewer.getPlugin('graphics')) {
    return viewer.use(GraphicsPlugin)
  }
  return viewer.getPlugin('graphics')
}
```

### 2. 使用 Primitive 模式提升性能

```typescript
// 大量数据时使用 Primitive 模式
graphics.startDraw({
  type: 'model-p', // Primitive 模式
  style: {
    url: '/models/building.glb'
  }
})
```

### 3. 合理使用聚合

```typescript
// 大量点数据时启用聚合
const dataLayer = viewer.use(DataLayerPlugin)
dataLayer.createLayer({
  type: 'entity',
  clustering: {
    enabled: true,
    pixelRange: 80,
    minimumClusterSize: 3
  }
})
```

### 4. 及时清理资源

```typescript
// 组件卸载时清理
onBeforeUnmount(() => {
  // 停止绘制
  graphics.stopDraw()

  // 清除图形
  graphics.clear()

  // 销毁 Viewer
  viewer.destroy()
})
```

## 错误处理

### 1. Viewer 初始化错误处理

```typescript
try {
  const cesiumViewer = new Cesium.Viewer('cesiumContainer')
  const viewer = new KtdViewer(cesiumViewer)
} catch (error) {
  console.error('Failed to initialize viewer:', error)
  // 显示错误提示
}
```

### 2. 插件加载错误处理

```typescript
try {
  const graphics = viewer.use(GraphicsPlugin)
} catch (error) {
  console.error('Failed to load GraphicsPlugin:', error)
  // 降级处理
}
```

### 3. 异步操作错误处理

```typescript
// 异步加载 GeoJSON
graphics
  .loadJson('/data/features.geojson')
  .then((entities) => {
    console.log('Loaded', entities.length, 'entities')
  })
  .catch((error) => {
    console.error('Failed to load GeoJSON:', error)
  })
```

## 类型安全

### 1. 使用类型断言

```typescript
import type { GraphicsPlugin } from '@ktd-cesium/plugins'

const graphics = viewer.use(GraphicsPlugin)
const plugin = viewer.getPlugin<GraphicsPlugin>('graphics')
if (plugin) {
  // 类型安全的使用
  plugin.startDraw({})
}
```

### 2. 定义自定义类型

```typescript
// types/cesium.ts
import type { Entity } from 'cesium'

export interface CustomEntity extends Entity {
  customProperty?: string
  customMethod?(): void
}
```

## 代码组织

### 1. 封装常用操作

```typescript
// utils/map-operations.ts
import type { KtdViewer } from '@ktd-cesium/core'
import { CameraPlugin } from '@ktd-cesium/plugins'

export function flyToBeijing(viewer: KtdViewer) {
  const camera = viewer.getPlugin<CameraPlugin>('camera')
  if (camera) {
    camera.flyTo({
      destination: [116.4, 39.9, 10000],
      duration: 2
    })
  }
}
```

### 2. 使用组合式函数（Vue 3）

```typescript
// composables/useCesium.ts
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { KtdViewer } from '@ktd-cesium/core'
import * as Cesium from 'cesium'

export function useCesium(container: Ref<HTMLElement | undefined>) {
  const viewer = ref<KtdViewer | null>(null)

  onMounted(() => {
    if (container.value) {
      const cesiumViewer = new Cesium.Viewer(container.value)
      viewer.value = new KtdViewer(cesiumViewer)
    }
  })

  onBeforeUnmount(() => {
    if (viewer.value) {
      viewer.value.destroy()
    }
  })

  return { viewer }
}
```

### 3. 使用自定义 Hook（React）

```typescript
// hooks/useCesium.ts
import { useEffect, useRef, useState } from 'react'
import { KtdViewer } from '@ktd-cesium/core'
import * as Cesium from 'cesium'

export function useCesium() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [viewer, setViewer] = useState<KtdViewer | null>(null)

  useEffect(() => {
    if (containerRef.current) {
      const cesiumViewer = new Cesium.Viewer(containerRef.current)
      const ktdViewer = new KtdViewer(cesiumViewer)
      setViewer(ktdViewer)

      return () => {
        ktdViewer.destroy()
      }
    }
  }, [])

  return { containerRef, viewer }
}
```

## 调试技巧

### 1. 启用调试模式

```typescript
// 开发环境启用调试
if (import.meta.env.DEV) {
  window.viewer = viewer // 在控制台访问
  window.Cesium = Cesium // 访问 Cesium API
}
```

### 2. 监听事件

```typescript
// 监听所有图形事件
graphics.on('*', (event, data) => {
  console.log('Graphics event:', event, data)
})
```

### 3. 检查插件状态

```typescript
// 检查插件是否已安装
console.log('Installed plugins:', Array.from(viewer.plugins.keys()))

// 检查插件实例
const graphics = viewer.getPlugin('graphics')
console.log('Graphics plugin:', graphics)
```

## 常见模式

### 1. 单例模式

```typescript
// 确保只有一个 Viewer 实例
class ViewerManager {
  private static instance: KtdViewer | null = null

  static getInstance(container?: HTMLElement | string): KtdViewer {
    if (!this.instance && container) {
      const cesiumViewer = new Cesium.Viewer(container)
      this.instance = new KtdViewer(cesiumViewer)
    }
    return this.instance!
  }

  static destroy() {
    if (this.instance) {
      this.instance.destroy()
      this.instance = null
    }
  }
}
```

### 2. 观察者模式

```typescript
// 使用事件系统实现观察者模式
class MapObserver {
  constructor(private viewer: KtdViewer) {
    this.setupListeners()
  }

  private setupListeners() {
    const events = this.viewer.getPlugin('event')
    const graphics = this.viewer.getPlugin('graphics')

    events?.on('click', (data) => {
      this.onMapClick(data)
    })

    graphics?.on('draw-created', (data) => {
      this.onDrawCreated(data)
    })
  }

  private onMapClick(data: unknown) {
    // 处理点击事件
  }

  private onDrawCreated(data: unknown) {
    // 处理绘制完成事件
  }
}
```

## 注意事项

1. **内存管理**：
   - 及时清理不需要的实体和 Primitive
   - 组件卸载时调用 `destroy()` 方法
   - 避免内存泄漏

2. **性能监控**：
   - 使用 Cesium 的性能监控工具
   - 注意帧率变化
   - 优化大量数据的渲染

3. **版本兼容**：
   - 确保所有 `@ktd-cesium/*` 包版本一致
   - 注意 Cesium 版本兼容性

4. **类型安全**：
   - 充分利用 TypeScript 类型检查
   - 使用类型断言时确保类型正确

5. **错误处理**：
   - 对所有异步操作添加错误处理
   - 提供友好的错误提示

遵循这些最佳实践可以帮助你构建更稳定、高性能的 3D 地图应用。
