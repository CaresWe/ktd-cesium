# Core 包概述

`@auto-cesium/core` 是 Auto-Cesium的核心功能包，提供了对 Cesium Viewer 的封装，并实现了强大的插件系统。

## 安装

```bash
pnpm add @auto-cesium/core @auto-cesium/shared cesium
```

## 特性

- **AutoViewer**：对 Cesium.Viewer 的增强封装
- **插件系统**：支持动态加载和卸载插件
- **Proxy 代理**：无缝访问 Cesium.Viewer 的所有属性和方法
- **TypeScript 支持**：完整的类型定义
- **生命周期管理**：统一的资源销毁机制

## 核心概念

### AutoViewer

AutoViewer 是对 `Cesium.Viewer` 的封装，使用 Proxy 模式实现，既保留了 Cesium.Viewer 的所有功能，又增加了插件系统的支持。

```typescript
import { AutoViewer } from '@auto-cesium/core'
import * as Cesium from 'cesium'

// 创建原始 Cesium Viewer
const cesiumViewer = new Cesium.Viewer('cesiumContainer')

// 封装为 AutoViewer
const viewer = new AutoViewer(cesiumViewer)

// 可以像使用 Cesium.Viewer 一样使用
viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(116.4, 39.9, 10000)
})

// 同时具有插件功能
viewer.use(SomePlugin)
```

### 插件系统

插件系统允许你以模块化的方式扩展 AutoViewer 的功能。每个插件都是一个独立的类，实现了 `ViewerPlugin` 接口。

```typescript
import { AutoViewer } from '@auto-cesium/core'
import { BaseLayerPlugin, CameraPlugin } from '@auto-cesium/plugins'

const viewer = new AutoViewer(cesiumViewer)

// 安装插件
const baseLayer = viewer.use(BaseLayerPlugin)
const camera = viewer.use(CameraPlugin)

// 使用插件功能
baseLayer.addLayer({...})
camera.flyTo({...})
```

### Proxy 代理

AutoViewer 使用 Proxy 模式，自动代理所有 Cesium.Viewer 的属性和方法。这意味着你可以：

1. 直接访问 Cesium.Viewer 的所有属性
2. 调用 Cesium.Viewer 的所有方法
3. 使用完整的 TypeScript 类型提示

```typescript
// 这些都可以正常工作
viewer.scene.globe.enableLighting = true
viewer.entities.add({...})
viewer.camera.setView({...})

// 同时保留 AutoViewer 的功能
viewer.use(Plugin)
viewer.getPlugin('pluginName')
```

## 主要功能

### [AutoViewer](/packages/core/viewer)

- 创建和配置 Viewer
- 插件管理（安装、获取、卸载）
- 生命周期管理（销毁）
- 访问原始 Cesium Viewer

## 使用场景

### 场景 1：基础使用

```typescript
import { AutoViewer } from '@auto-cesium/core'
import * as Cesium from 'cesium'

// 创建 Viewer
const cesiumViewer = new Cesium.Viewer('cesiumContainer', {
  terrain: Cesium.Terrain.fromWorldTerrain()
})

const viewer = new AutoViewer(cesiumViewer)

// 使用
viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(116.4, 39.9, 10000)
})
```

### 场景 2：预装插件

```typescript
import { AutoViewer } from '@auto-cesium/core'
import { BaseLayerPlugin, CameraPlugin } from '@auto-cesium/plugins'
import * as Cesium from 'cesium'

const cesiumViewer = new Cesium.Viewer('cesiumContainer')

const viewer = new AutoViewer(cesiumViewer, {
  plugins: [BaseLayerPlugin, CameraPlugin]
})

// 插件已自动安装
const baseLayer = viewer.getPlugin('BaseLayerPlugin')
```

### 场景 3：动态插件管理

```typescript
// 动态安装插件
const eventPlugin = viewer.use(EventPlugin)

// 获取插件实例
const plugin = viewer.getPlugin('EventPlugin')

// 使用插件
if (plugin) {
  plugin.on('click', (event) => {
    console.log('Clicked:', event)
  })
}
```

### 场景 4：资源清理

```typescript
// 销毁 Viewer 及所有插件
viewer.destroy()

// 检查是否已销毁
if (viewer.destroyed) {
  console.log('Viewer has been destroyed')
}
```

## API 文档

详细的 API 文档请查看：

- [AutoViewer API](/packages/core/viewer)

## 与 Cesium.Viewer 的对比

| 特性                | Cesium.Viewer | AutoViewer |
| ------------------- | ------------- | ---------- |
| 基础地图功能        | ✅            | ✅         |
| 所有 Cesium API     | ✅            | ✅         |
| 插件系统            | ❌            | ✅         |
| 统一生命周期管理    | ❌            | ✅         |
| TypeScript 类型提示 | ✅            | ✅         |
| 模块化扩展          | ❌            | ✅         |

## 架构设计

AutoViewer 采用以下设计模式：

1. **包装器模式**：封装 Cesium.Viewer，提供额外功能
2. **Proxy 模式**：透明代理，保持 API 兼容性
3. **插件模式**：模块化扩展功能
4. **单例模式**：每个插件在一个 Viewer 中只能安装一次

## 最佳实践

### 1. 总是销毁 Viewer

```typescript
// 在组件卸载或页面关闭时销毁
useEffect(() => {
  const viewer = new AutoViewer(cesiumViewer)

  return () => {
    viewer.destroy()
  }
}, [])
```

### 2. 使用插件封装功能

```typescript
// 推荐：使用插件
const camera = viewer.use(CameraPlugin)
camera.flyTo({...})

// 不推荐：直接操作 viewer
viewer.camera.flyTo({...})
```

### 3. 获取原始 Viewer

```typescript
// 如果需要访问原始 Cesium Viewer
const cesiumViewer = viewer.cesiumViewer

// 或者直接使用代理
viewer.scene.globe.enableLighting = true
```

## 下一步

- 了解 [AutoViewer 详细 API](/packages/core/viewer)
- 探索 [Plugins 包](/packages/plugins/overview) 的可用插件
- 查看 [Shared 包](/packages/shared/overview) 的工具函数
