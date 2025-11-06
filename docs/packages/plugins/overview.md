# Plugins 包概述

`@ktd-cesium/plugins` 是 KTD-Cesium 的插件系统包，提供了一系列功能扩展插件，用于增强 KtdViewer 的能力。

## 安装

```bash
pnpm add @ktd-cesium/plugins @ktd-cesium/core @ktd-cesium/shared cesium
```

## 特性

- **基于插件的架构**：模块化设计，按需加载
- **统一的插件接口**：所有插件遵循相同的规范
- **生命周期管理**：自动管理资源的创建和销毁
- **TypeScript 支持**：完整的类型定义
- **易于扩展**：可以轻松创建自定义插件

## 可用插件

### [BasePlugin](/packages/plugins/base-plugin)

所有插件的基类，提供了基础的插件功能。

```typescript
import { BasePlugin } from '@ktd-cesium/plugins'
```

### [BaseLayerPlugin](/packages/plugins/base-layer)

基础图层管理插件，提供常见的底图服务（天地图、高德、Google 等）。

```typescript
import { BaseLayerPlugin } from '@ktd-cesium/plugins'

const baseLayer = viewer.use(BaseLayerPlugin)
baseLayer.addLayer({
  type: 'tianditu',
  layer: 'img_w'
})
```

### [CameraPlugin](/packages/plugins/camera)

相机控制插件，提供相机操作的便捷方法。

```typescript
import { CameraPlugin } from '@ktd-cesium/plugins'

const camera = viewer.use(CameraPlugin)
camera.flyTo({
  destination: [116.4, 39.9, 10000],
  duration: 2
})
```

### [DataLayerPlugin](/packages/plugins/data-layer)

数据图层管理插件，用于管理各种数据图层（GeoJSON、KML 等）。

```typescript
import { DataLayerPlugin } from '@ktd-cesium/plugins'

const dataLayer = viewer.use(DataLayerPlugin)
dataLayer.addGeoJSON(url, options)
```

### [EventPlugin](/packages/plugins/event)

事件处理插件，简化 Cesium 事件监听。

```typescript
import { EventPlugin } from '@ktd-cesium/plugins'

const events = viewer.use(EventPlugin)
events.on('click', (event) => {
  console.log('Clicked:', event)
})
```

### [PopupPlugin](/packages/plugins/popup)

弹窗管理插件，用于在地图上显示信息窗口。

```typescript
import { PopupPlugin } from '@ktd-cesium/plugins'

const popup = viewer.use(PopupPlugin)
popup.show({
  position: [116.4, 39.9],
  content: '<h3>北京</h3><p>中国首都</p>'
})
```

## 插件架构

所有插件都继承自 `BasePlugin`，遵循统一的接口规范：

```typescript
interface ViewerPlugin {
  /** 插件名称 */
  readonly name: string

  /** 插件是否已安装 */
  readonly installed: boolean

  /** 安装插件 */
  install(viewer: KtdViewer): void | Promise<void>

  /** 销毁插件 */
  destroy?(): void | Promise<void>
}
```

## 使用方式

### 基础用法

```typescript
import { KtdViewer } from '@ktd-cesium/core'
import { BaseLayerPlugin, CameraPlugin } from '@ktd-cesium/plugins'

// 创建 Viewer
const viewer = new KtdViewer(cesiumViewer)

// 安装插件
const baseLayer = viewer.use(BaseLayerPlugin)
const camera = viewer.use(CameraPlugin)

// 使用插件功能
baseLayer.addLayer({...})
camera.flyTo({...})
```

### 预装插件

```typescript
import { KtdViewer } from '@ktd-cesium/core'
import { BaseLayerPlugin, CameraPlugin, EventPlugin } from '@ktd-cesium/plugins'

// 在创建时预装插件
const viewer = new KtdViewer(cesiumViewer, {
  plugins: [BaseLayerPlugin, CameraPlugin, EventPlugin]
})

// 获取插件实例
const baseLayer = viewer.getPlugin<BaseLayerPlugin>('BaseLayerPlugin')
```

### 动态加载

```typescript
// 根据条件动态加载插件
if (needsBasemap) {
  const baseLayer = viewer.use(BaseLayerPlugin)
  baseLayer.addLayer({...})
}

if (needsPopup) {
  const popup = viewer.use(PopupPlugin)
  popup.show({...})
}
```

## 创建自定义插件

你可以通过继承 `BasePlugin` 来创建自己的插件：

```typescript
import { BasePlugin } from '@ktd-cesium/plugins'
import type { KtdViewer } from '@ktd-cesium/core'

export class MyCustomPlugin extends BasePlugin {
  static readonly pluginName = 'MyCustomPlugin'

  install(viewer: KtdViewer): void {
    super.install(viewer)

    // 初始化插件功能
    console.log('MyCustomPlugin installed')
  }

  destroy(): void {
    // 清理资源
    console.log('MyCustomPlugin destroyed')

    super.destroy()
  }

  // 自定义方法
  doSomething() {
    if (!this.installed) {
      throw new Error('Plugin not installed')
    }

    console.log('Doing something with viewer:', this.viewer)
  }
}

// 使用自定义插件
const myPlugin = viewer.use(MyCustomPlugin)
myPlugin.doSomething()
```

## 插件组合

多个插件可以协同工作：

```typescript
import {
  BaseLayerPlugin,
  CameraPlugin,
  EventPlugin,
  PopupPlugin
} from '@ktd-cesium/plugins'

// 安装多个插件
const baseLayer = viewer.use(BaseLayerPlugin)
const camera = viewer.use(CameraPlugin)
const events = viewer.use(EventPlugin)
const popup = viewer.use(PopupPlugin)

// 组合使用
events.on('click', (event) => {
  const position = event.position

  // 飞到点击位置
  camera.flyTo({
    destination: position,
    duration: 1
  })

  // 显示弹窗
  popup.show({
    position: position,
    content: '<h3>点击位置</h3>'
  })
})
```

## 最佳实践

### 1. 按需加载插件

只加载需要的插件，避免不必要的资源消耗：

```typescript
// 好的做法
const viewer = new KtdViewer(cesiumViewer, {
  plugins: [BaseLayerPlugin]  // 只加载需要的插件
})

// 避免
const viewer = new KtdViewer(cesiumViewer, {
  plugins: [/* 加载所有插件 */]  // 可能造成浪费
})
```

### 2. 统一管理插件

```typescript
class PluginManager {
  private plugins = new Map()

  install(viewer: KtdViewer, plugins: ViewerPluginConstructor[]) {
    plugins.forEach(Plugin => {
      const instance = viewer.use(Plugin)
      this.plugins.set(Plugin.pluginName, instance)
    })
  }

  get<T>(name: string): T | undefined {
    return this.plugins.get(name)
  }
}
```

### 3. 错误处理

```typescript
try {
  const plugin = viewer.use(SomePlugin)
  plugin.doSomething()
} catch (error) {
  console.error('Plugin error:', error)
}
```

## API 文档

详细的 API 文档请查看各个插件：

- [BasePlugin](/packages/plugins/base-plugin)
- [BaseLayerPlugin](/packages/plugins/base-layer)
- [CameraPlugin](/packages/plugins/camera)
- [DataLayerPlugin](/packages/plugins/data-layer)
- [EventPlugin](/packages/plugins/event)
- [PopupPlugin](/packages/plugins/popup)

## 下一步

- 了解 [BasePlugin](/packages/plugins/base-plugin) 基类
- 探索具体插件的功能和用法
- 学习如何创建自定义插件
