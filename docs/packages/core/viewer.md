# KtdViewer

KtdViewer 是对 Cesium.Viewer 的增强封装，提供了插件系统支持，同时保留了 Cesium.Viewer 的所有功能。

## 导入

```typescript
import { KtdViewer } from '@ktd-cesium/core'
import type { KtdViewerOptions, ViewerPlugin } from '@ktd-cesium/core'
```

## 构造函数

### KtdViewer

创建一个 KtdViewer 实例。

**类型签名**

```typescript
constructor(
  viewer: Cesium.Viewer,
  options?: KtdViewerOptions
)
```

**参数**

- `viewer`: Cesium.Viewer 实例
- `options`: 配置选项（可选）
  - `plugins`: 预装载的插件数组

**返回值**

- `KtdViewer`: KtdViewer 实例（通过 Proxy 代理）

**示例**

```typescript
import { KtdViewer } from '@ktd-cesium/core'
import * as Cesium from 'cesium'

// 基础用法
const cesiumViewer = new Cesium.Viewer('cesiumContainer')
const viewer = new KtdViewer(cesiumViewer)

// 带预装插件
import { BaseLayerPlugin, CameraPlugin } from '@ktd-cesium/plugins'

const viewerWithPlugins = new KtdViewer(cesiumViewer, {
  plugins: [BaseLayerPlugin, CameraPlugin]
})
```

## 属性

### plugins

只读属性，插件集合。

**类型**

```typescript
readonly plugins: Map<string, ViewerPlugin>
```

**示例**

```typescript
// 获取所有已安装的插件
console.log(viewer.plugins.size)

// 遍历所有插件
for (const [name, plugin] of viewer.plugins) {
  console.log(`Plugin: ${name}`)
}
```

### cesiumViewer

只读属性，获取原始 Cesium Viewer 实例。

**类型**

```typescript
readonly cesiumViewer: Cesium.Viewer
```

**示例**

```typescript
// 获取原始 Cesium Viewer
const cesiumViewer = viewer.cesiumViewer

// 访问 Cesium Viewer 的属性
console.log(cesiumViewer.scene)
```

### destroyed

只读属性，检查是否已销毁。

**类型**

```typescript
readonly destroyed: boolean
```

**示例**

```typescript
if (!viewer.destroyed) {
  // Viewer 仍然可用
  viewer.camera.flyTo({...})
}
```

## 方法

### use

安装并使用插件。

**类型签名**

```typescript
use<T extends ViewerPlugin>(
  Plugin: ViewerPluginConstructor<T>
): T
```

**参数**

- `Plugin`: 插件构造函数

**返回值**

- `T`: 插件实例

**示例**

```typescript
import { BaseLayerPlugin, CameraPlugin } from '@ktd-cesium/plugins'

// 安装插件
const baseLayer = viewer.use(BaseLayerPlugin)
const camera = viewer.use(CameraPlugin)

// 使用插件
baseLayer.addLayer({...})
camera.flyTo({...})

// 重复安装会返回已有实例（并显示警告）
const samePlugin = viewer.use(BaseLayerPlugin)
console.log(samePlugin === baseLayer)  // true
```

### getPlugin

获取已安装的插件实例。

**类型签名**

```typescript
getPlugin<T extends ViewerPlugin>(name: string): T | undefined
```

**参数**

- `name`: 插件名称

**返回值**

- `T | undefined`: 插件实例，如果未安装则返回 undefined

**示例**

```typescript
// 获取插件
const baseLayer = viewer.getPlugin<BaseLayerPlugin>('BaseLayerPlugin')

if (baseLayer) {
  baseLayer.addLayer({...})
} else {
  console.log('BaseLayerPlugin is not installed')
}
```

### destroy

销毁 Viewer 及所有插件。

**类型签名**

```typescript
destroy(): void
```

**示例**

```typescript
// 销毁 Viewer
viewer.destroy()

// 检查是否已销毁
console.log(viewer.destroyed)  // true

// 销毁后的操作会被忽略
viewer.destroy()  // 不会重复销毁
```

## 类型定义

### KtdViewerOptions

Viewer 配置选项。

```typescript
interface KtdViewerOptions {
  /** 预装载的插件 */
  plugins?: ViewerPluginConstructor[]
}
```

### ViewerPlugin

插件接口。

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

### ViewerPluginConstructor

插件构造函数类型。

```typescript
interface ViewerPluginConstructor<T extends ViewerPlugin = ViewerPlugin> {
  new (): T
  readonly pluginName: string
}
```

## 使用场景

### 场景 1：在 Vue 3 中使用

```vue
<template>
  <div ref="containerRef" class="cesium-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { KtdViewer } from '@ktd-cesium/core'
import { BaseLayerPlugin } from '@ktd-cesium/plugins'
import * as Cesium from 'cesium'

const containerRef = ref<HTMLElement>()
let viewer: KtdViewer

onMounted(() => {
  if (containerRef.value) {
    const cesiumViewer = new Cesium.Viewer(containerRef.value)
    viewer = new KtdViewer(cesiumViewer, {
      plugins: [BaseLayerPlugin]
    })

    // 使用插件
    const baseLayer = viewer.getPlugin('BaseLayerPlugin')
    baseLayer?.addLayer({...})
  }
})

onBeforeUnmount(() => {
  viewer?.destroy()
})
</script>
```

### 场景 2：在 React 中使用

```tsx
import { useEffect, useRef } from 'react'
import { KtdViewer } from '@ktd-cesium/core'
import { BaseLayerPlugin, CameraPlugin } from '@ktd-cesium/plugins'
import * as Cesium from 'cesium'

function MapComponent() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<KtdViewer>()

  useEffect(() => {
    if (containerRef.current) {
      const cesiumViewer = new Cesium.Viewer(containerRef.current)
      const viewer = new KtdViewer(cesiumViewer, {
        plugins: [BaseLayerPlugin, CameraPlugin]
      })

      viewerRef.current = viewer

      // 使用 Viewer
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(116.4, 39.9, 10000)
      })

      return () => {
        viewer.destroy()
      }
    }
  }, [])

  return <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />
}
```

### 场景 3：动态插件管理

```typescript
class PluginManager {
  private viewer: KtdViewer
  private installedPlugins: Set<string> = new Set()

  constructor(viewer: KtdViewer) {
    this.viewer = viewer
  }

  installPlugin(Plugin: ViewerPluginConstructor) {
    if (this.installedPlugins.has(Plugin.pluginName)) {
      console.log(`Plugin ${Plugin.pluginName} is already installed`)
      return
    }

    const plugin = this.viewer.use(Plugin)
    this.installedPlugins.add(Plugin.pluginName)

    return plugin
  }

  hasPlugin(name: string): boolean {
    return this.installedPlugins.has(name)
  }

  getInstalledPlugins(): string[] {
    return Array.from(this.installedPlugins)
  }
}
```

### 场景 4：自定义插件

```typescript
import type { ViewerPlugin, KtdViewer } from '@ktd-cesium/core'

class MyCustomPlugin implements ViewerPlugin {
  static readonly pluginName = 'MyCustomPlugin'

  readonly name = 'MyCustomPlugin'
  private _installed = false
  private viewer?: KtdViewer

  get installed() {
    return this._installed
  }

  install(viewer: KtdViewer) {
    this.viewer = viewer
    this._installed = true

    console.log('MyCustomPlugin installed')

    // 初始化插件功能
    this.setupEventListeners()
  }

  private setupEventListeners() {
    // 设置事件监听器
  }

  destroy() {
    console.log('MyCustomPlugin destroyed')

    // 清理资源
    this._installed = false
    this.viewer = undefined
  }

  // 自定义方法
  doSomething() {
    if (!this._installed) {
      throw new Error('Plugin not installed')
    }

    console.log('Doing something...')
  }
}

// 使用自定义插件
const viewer = new KtdViewer(cesiumViewer)
const myPlugin = viewer.use(MyCustomPlugin)
myPlugin.doSomething()
```

### 场景 5：条件插件加载

```typescript
function createViewer(container: string, features: string[]) {
  const cesiumViewer = new Cesium.Viewer(container)
  const plugins: ViewerPluginConstructor[] = []

  // 根据需要的功能加载插件
  if (features.includes('baseLayer')) {
    plugins.push(BaseLayerPlugin)
  }

  if (features.includes('camera')) {
    plugins.push(CameraPlugin)
  }

  if (features.includes('events')) {
    plugins.push(EventPlugin)
  }

  return new KtdViewer(cesiumViewer, { plugins })
}

// 使用
const viewer = createViewer('cesiumContainer', ['baseLayer', 'camera'])
```

## Proxy 代理说明

KtdViewer 使用 Proxy 模式，自动代理所有 Cesium.Viewer 的属性和方法：

```typescript
// 这些都是有效的
viewer.scene.globe.enableLighting = true  // 设置属性
viewer.entities.add({...})                // 调用方法
viewer.camera.flyTo({...})                // 调用方法

// 同时保留 KtdViewer 的功能
viewer.use(Plugin)                        // KtdViewer 方法
viewer.getPlugin('name')                  // KtdViewer 方法
viewer.destroy()                          // KtdViewer 方法
```

访问优先级：
1. 优先访问 KtdViewer 自己的属性和方法
2. 如果不存在，则代理到 Cesium.Viewer

## 注意事项

1. **销毁顺序**：调用 `destroy()` 时，会先销毁所有插件，然后销毁 Cesium Viewer
2. **插件唯一性**：每个插件在一个 Viewer 中只能安装一次
3. **异步插件**：插件的 `install` 和 `destroy` 方法可以返回 Promise
4. **Proxy 限制**：某些高级用法（如 `instanceof` 检查）可能不适用于代理对象
5. **类型安全**：使用 TypeScript 时，KtdViewer 会提供完整的类型提示

## 最佳实践

1. **总是销毁 Viewer**：在组件卸载时调用 `destroy()`
2. **使用预装插件**：在构造函数中预装常用插件
3. **检查插件存在**：使用 `getPlugin` 前检查插件是否安装
4. **错误处理**：插件安装失败不会抛出异常，而是输出错误日志
5. **获取原始 Viewer**：需要时使用 `cesiumViewer` 属性获取原始实例
