# BasePlugin

`BasePlugin` 是所有插件的抽象基类，提供了插件的基础功能和生命周期管理。

## 导入

```typescript
import { BasePlugin } from '@auto-cesium/plugins'
```

## 概述

`BasePlugin` 实现了 `ViewerPlugin` 接口，提供了：

- 插件安装和销毁的生命周期管理
- 对 Viewer 实例的访问
- 统一的错误处理机制
- 类型安全的插件开发基础

## 属性

### name

只读抽象属性，插件名称。

**类型**

```typescript
abstract readonly name: string
```

**说明**

子类必须实现此属性。

### installed

只读属性，插件是否已安装。

**类型**

```typescript
readonly installed: boolean
```

**示例**

```typescript
if (plugin.installed) {
  plugin.doSomething()
}
```

### viewer (protected)

受保护属性，AutoViewer 实例。

**类型**

```typescript
protected viewer: AutoViewer | null
```

**说明**

仅在子类中可访问。

### cesiumViewer (protected)

受保护的 getter，获取 Cesium Viewer 实例。

**类型**

```typescript
protected get cesiumViewer(): Cesium.Viewer
```

**说明**

提供类型安全的方式访问原始 Cesium Viewer。如果插件未安装，会抛出错误。

## 方法

### install

安装插件。

**类型签名**

```typescript
install(viewer: AutoViewer): void | Promise<void>
```

**参数**

- `viewer`: AutoViewer 实例

**说明**

此方法会：

1. 检查插件是否已安装
2. 保存 viewer 引用
3. 标记插件为已安装
4. 调用子类的 `onInstall` 方法

**示例**

```typescript
// 通常不直接调用，而是通过 viewer.use()
const plugin = viewer.use(MyPlugin)
```

### onInstall (protected, abstract)

插件安装时的回调方法。

**类型签名**

```typescript
protected abstract onInstall(viewer: AutoViewer): void | Promise<void>
```

**参数**

- `viewer`: AutoViewer 实例

**说明**

子类必须实现此方法，用于初始化插件功能。

### destroy

销毁插件。

**类型签名**

```typescript
destroy(): void | Promise<void>
```

**说明**

此方法会：

1. 检查插件是否已安装
2. 调用子类的 `onDestroy` 方法
3. 清理 viewer 引用
4. 标记插件为未安装

### onDestroy (protected)

插件销毁时的回调方法。

**类型签名**

```typescript
protected onDestroy(): void | Promise<void>
```

**说明**

子类可以重写此方法，用于清理资源。默认不执行任何操作。

### ensureInstalled (protected)

确保插件已安装，否则抛出错误。

**类型签名**

```typescript
protected ensureInstalled(): void
```

**说明**

在插件方法中调用此方法可确保插件处于可用状态。

## 创建自定义插件

### 基础示例

```typescript
import { BasePlugin } from '@auto-cesium/plugins'
import type { AutoViewer } from '@auto-cesium/core'

export class MyPlugin extends BasePlugin {
  // 静态属性：插件名称（用于注册）
  static readonly pluginName = 'MyPlugin'

  // 实例属性：插件名称
  readonly name = 'MyPlugin'

  // 实现安装方法
  protected onInstall(viewer: AutoViewer): void {
    console.log('MyPlugin installed')

    // 初始化插件功能
    this.initializeFeatures()
  }

  // 实现销毁方法
  protected onDestroy(): void {
    console.log('MyPlugin destroyed')

    // 清理资源
    this.cleanupResources()
  }

  // 私有方法
  private initializeFeatures() {
    // 设置事件监听器等
  }

  private cleanupResources() {
    // 移除事件监听器等
  }

  // 公共方法
  public doSomething() {
    this.ensureInstalled()

    console.log('Doing something...')
  }
}
```

### 访问 Viewer

```typescript
export class ViewerAccessPlugin extends BasePlugin {
  static readonly pluginName = 'ViewerAccessPlugin'
  readonly name = 'ViewerAccessPlugin'

  protected onInstall(viewer: AutoViewer): void {
    // 方式 1：使用 this.viewer（可能为 null）
    if (this.viewer) {
      console.log(this.viewer.scene.globe)
    }

    // 方式 2：使用参数 viewer（推荐）
    console.log(viewer.scene.globe)

    // 方式 3：使用 this.cesiumViewer（访问原始 Cesium Viewer）
    console.log(this.cesiumViewer.scene.globe)
  }

  public someMethod() {
    this.ensureInstalled()

    // 在方法中访问 viewer
    this.viewer!.camera.flyHome(0)

    // 或使用 cesiumViewer
    this.cesiumViewer.camera.flyHome(0)
  }
}
```

### 异步初始化

```typescript
export class AsyncPlugin extends BasePlugin {
  static readonly pluginName = 'AsyncPlugin'
  readonly name = 'AsyncPlugin'

  protected async onInstall(viewer: AutoViewer): Promise<void> {
    console.log('Starting async initialization...')

    // 异步加载资源
    await this.loadResources()

    console.log('Async initialization complete')
  }

  private async loadResources(): Promise<void> {
    // 模拟异步加载
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Resources loaded')
        resolve()
      }, 1000)
    })
  }

  protected async onDestroy(): Promise<void> {
    console.log('Starting async cleanup...')

    await this.cleanup()

    console.log('Cleanup complete')
  }

  private async cleanup(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, 500)
    })
  }
}
```

### 带状态管理

```typescript
export class StatefulPlugin extends BasePlugin {
  static readonly pluginName = 'StatefulPlugin'
  readonly name = 'StatefulPlugin'

  private enabled = false
  private listeners: Array<() => void> = []

  protected onInstall(viewer: AutoViewer): void {
    this.enabled = true
    this.setupListeners()
  }

  protected onDestroy(): void {
    this.enabled = false
    this.removeListeners()
  }

  private setupListeners() {
    // 设置事件监听器
  }

  private removeListeners() {
    this.listeners.forEach((remove) => remove())
    this.listeners = []
  }

  public toggle() {
    this.ensureInstalled()

    this.enabled = !this.enabled
    console.log(`Plugin is now ${this.enabled ? 'enabled' : 'disabled'}`)
  }

  public isEnabled(): boolean {
    return this.enabled
  }
}
```

### 错误处理

```typescript
export class SafePlugin extends BasePlugin {
  static readonly pluginName = 'SafePlugin'
  readonly name = 'SafePlugin'

  protected onInstall(viewer: AutoViewer): void {
    try {
      this.initializeFeatures()
    } catch (error) {
      console.error('Failed to initialize plugin:', error)
      throw error
    }
  }

  private initializeFeatures() {
    // 可能抛出错误的操作
  }

  public safeMethod() {
    try {
      this.ensureInstalled()

      // 执行操作
      this.performOperation()
    } catch (error) {
      console.error('Operation failed:', error)
      // 返回默认值或抛出错误
      throw error
    }
  }

  private performOperation() {
    // 实现
  }
}
```

## 最佳实践

### 1. 总是使用 ensureInstalled

在公共方法中检查插件状态：

```typescript
public myMethod() {
  this.ensureInstalled()  // 确保插件已安装

  // 执行操作
}
```

### 2. 正确清理资源

在 `onDestroy` 中清理所有资源：

```typescript
protected onDestroy(): void {
  // 移除事件监听器
  this.removeListeners()

  // 清理实体
  this.entities.forEach(entity => {
    this.cesiumViewer.entities.remove(entity)
  })
  this.entities.clear()

  // 清理其他资源
  this.cleanup()
}
```

### 3. 使用 TypeScript 类型

```typescript
import type { Entity } from 'cesium'

export class TypedPlugin extends BasePlugin {
  static readonly pluginName = 'TypedPlugin'
  readonly name = 'TypedPlugin'

  private entities: Set<Entity> = new Set()

  public addEntity(entity: Entity): void {
    this.ensureInstalled()

    this.entities.add(entity)
    this.cesiumViewer.entities.add(entity)
  }
}
```

### 4. 提供清晰的 API

```typescript
export class WellDesignedPlugin extends BasePlugin {
  static readonly pluginName = 'WellDesignedPlugin'
  readonly name = 'WellDesignedPlugin'

  /**
   * 启用某个功能
   * @param options 配置选项
   */
  public enable(options?: EnableOptions): void {
    this.ensureInstalled()
    // 实现
  }

  /**
   * 禁用某个功能
   */
  public disable(): void {
    this.ensureInstalled()
    // 实现
  }

  /**
   * 获取当前状态
   */
  public getState(): PluginState {
    this.ensureInstalled()
    // 实现
    return { enabled: true }
  }
}

interface EnableOptions {
  autoStart?: boolean
}

interface PluginState {
  enabled: boolean
}
```

## 注意事项

1. **插件名称唯一性**：确保 `pluginName` 和 `name` 一致且唯一
2. **资源清理**：总是在 `onDestroy` 中清理所有资源
3. **错误处理**：使用 try-catch 处理可能的错误
4. **异步操作**：`onInstall` 和 `onDestroy` 可以返回 Promise
5. **类型安全**：利用 TypeScript 的类型系统
6. **状态检查**：在公共方法中使用 `ensureInstalled()`
