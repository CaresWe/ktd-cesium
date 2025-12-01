# 常见问题

本文档收集了使用 Auto-Cesium 时常见的问题和解决方案。

## 安装和配置

### Q: 如何正确安装 Auto-Cesium？

A: 使用 pnpm（推荐）或 npm/yarn 安装：

```bash
pnpm add @auto-cesium/core @auto-cesium/shared @auto-cesium/plugins cesium
```

确保所有 `@auto-cesium/*` 包使用相同的版本。

### Q: Cesium 静态资源加载失败怎么办？

A: 需要正确配置构建工具：

**Vite**：

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  define: {
    CESIUM_BASE_URL: JSON.stringify('/cesium')
  }
})
```

然后使用插件复制 Cesium 静态资源。

**Webpack**：

```javascript
// webpack.config.js
new webpack.DefinePlugin({
  CESIUM_BASE_URL: JSON.stringify('/cesium')
})
```

### Q: TypeScript 类型错误怎么办？

A: 确保安装了 Cesium 类型定义：

```bash
pnpm add -D @types/cesium
```

## Viewer 使用

### Q: AutoViewer 和 Cesium.Viewer 有什么区别？

A: `AutoViewer` 是对 `Cesium.Viewer` 的包装，通过 Proxy 代理保留了所有 Cesium API，同时添加了插件系统。你可以像使用 `Cesium.Viewer` 一样使用 `AutoViewer`。

```typescript
// 这些都可以正常工作
viewer.scene.globe.enableLighting = true
viewer.entities.add({...})
viewer.camera.flyTo({...})

// 同时可以使用插件功能
viewer.use(Plugin)
```

### Q: 如何获取原始 Cesium.Viewer？

A: 使用 `cesiumViewer` 属性：

```typescript
const cesiumViewer = viewer.cesiumViewer
```

### Q: 如何正确销毁 Viewer？

A: 调用 `destroy()` 方法：

```typescript
viewer.destroy()
```

这会自动清理所有插件和资源。

## 插件使用

### Q: 插件如何安装？

A: 使用 `use()` 方法：

```typescript
const graphics = viewer.use(GraphicsPlugin)
```

### Q: 如何检查插件是否已安装？

A: 使用 `getPlugin()` 方法：

```typescript
const graphics = viewer.getPlugin('graphics')
if (graphics) {
  // 插件已安装
}
```

或者检查 `plugins` Map：

```typescript
if (viewer.plugins.has('graphics')) {
  // 插件已安装
}
```

### Q: 插件可以重复安装吗？

A: 不可以。如果插件已安装，`use()` 方法会返回已存在的实例并输出警告。

### Q: 如何传递配置选项给插件？

A: 在 `use()` 方法中传递：

```typescript
const graphics = viewer.use(GraphicsPlugin, {
  hasEdit: true,
  transform: {
    enabled: true
  }
})
```

## GraphicsPlugin

### Q: Entity 和 Primitive 模式有什么区别？

A:

- **Entity 模式**：高级 API，易于编辑和序列化，适合交互式场景
- **Primitive 模式**：低级 API，性能更高，适合大量数据

```typescript
// Entity 模式
graphics.startDraw({ type: 'point' })

// Primitive 模式
graphics.startDraw({ type: 'model-p' })
```

### Q: 如何重新编辑已绘制的图形？

A: 使用 `startEditing()` 方法：

```typescript
const entity = graphics.getEntityById('entity-id')
if (entity) {
  graphics.stopDraw() // 确保退出绘制状态
  graphics.startEditing(entity)
}
```

### Q: 如何导出图形为 GeoJSON？

A: 使用 `toGeoJSON()` 方法：

```typescript
const geojson = graphics.toGeoJSON(entity)
// 或导出所有
const allGeoJSON = graphics.toGeoJSON()
```

### Q: 如何加载 GeoJSON？

A: 使用 `loadJson()` 方法：

```typescript
graphics.loadJson('/data/features.geojson').then((entities) => {
  console.log('Loaded', entities.length, 'entities')
})
```

## AnalysisPlugin

### Q: 如何开始测量？

A: 使用 `startMeasure()` 方法：

```typescript
analysis.startMeasure({
  type: 'distance',
  onComplete: (result) => {
    console.log('距离:', result.value)
  }
})
```

### Q: 如何清除测量结果？

A: 使用 `clearMeasure()` 方法：

```typescript
// 清除所有
analysis.clearMeasure()

// 清除指定 ID
analysis.clearMeasure('measure-id')
```

### Q: 如何启用顶点吸附？

A: 在插件配置中启用：

```typescript
const analysis = viewer.use(AnalysisPlugin, {
  snap: {
    enabled: true,
    radius: 15
  }
})
```

## TransformPlugin

### Q: 如何附加变换控制器？

A: 使用 `attach()` 方法：

```typescript
transform.attach(entity)
```

### Q: 如何切换变换模式？

A: 使用 `setMode()` 方法：

```typescript
transform.setMode(TransformMode.TRANSLATE) // 平移
transform.setMode(TransformMode.ROTATE) // 旋转
transform.setMode(TransformMode.SCALE) // 缩放
```

### Q: Entity 和 Primitive 都支持吗？

A: 是的，TransformPlugin 同时支持 Entity 和 Primitive 模式。

## 坐标转换

### Q: 如何转换国内坐标系？

A: 使用 `coordinateTransform` 模块：

```typescript
import { wgs84ToGcj02, gcj02ToBd09 } from '@auto-cesium/shared'

// WGS84 转 GCJ-02
const [gcjLng, gcjLat] = wgs84ToGcj02(116.3974, 39.9093)

// GCJ-02 转 BD-09
const [bdLng, bdLat] = gcj02ToBd09(gcjLng, gcjLat)
```

### Q: 坐标转换精度如何？

A: GCJ-02 转 WGS84 使用粗略算法，精度有限（通常误差在 10-50 米）。如需高精度转换，建议使用专业坐标转换库。

## 性能优化

### Q: 如何优化大量数据的渲染？

A:

1. 使用 Primitive 模式
2. 启用聚合（Clustering）
3. 使用 LOD（细节层次）
4. 按需加载数据

```typescript
// 启用聚合
dataLayer.createLayer({
  type: 'entity',
  clustering: {
    enabled: true,
    pixelRange: 80,
    minimumClusterSize: 3
  }
})
```

### Q: 如何减少内存占用？

A:

1. 及时清理不需要的实体
2. 使用 `destroy()` 销毁 Viewer
3. 避免创建过多临时对象
4. 合理使用缓存

## 错误排查

### Q: 插件未找到错误？

A: 确保插件已正确安装：

```typescript
const plugin = viewer.getPlugin('plugin-name')
if (!plugin) {
  console.error('Plugin not found')
  viewer.use(PluginClass)
}
```

### Q: 事件监听不生效？

A: 确保 EventPlugin 已安装：

```typescript
const events = viewer.use(EventPlugin)
events.on('click', handler)
```

### Q: 图形不显示？

A: 检查以下几点：

1. 实体是否添加到场景中
2. `show` 属性是否为 `true`
3. 位置坐标是否正确
4. 相机视角是否能看到图形

## 框架集成

### Q: 如何在 Vue 3 中使用？

A: 参考 [快速开始](/guide/getting-started#vue-3) 中的 Vue 示例。

### Q: 如何在 React 中使用？

A: 参考 [快速开始](/guide/getting-started#react) 中的 React 示例。

### Q: 如何在组件间共享 Viewer？

A: 使用全局状态管理或 Context：

```typescript
// Vue 3 - Provide/Inject
provide('viewer', viewer)

// React - Context
const ViewerContext = createContext<AutoViewer | null>(null)
```

## 其他问题

### Q: 如何获取帮助？

A:

1. 查看 [API 文档](/packages/plugins/overview)
2. 查看 [示例代码](/guide/getting-started)
3. 提交 Issue 到 GitHub

### Q: 如何贡献代码？

A: 欢迎提交 Pull Request！请确保：

1. 代码符合项目规范
2. 添加必要的测试
3. 更新相关文档

### Q: 版本更新注意事项？

A:

1. 查看 [更新日志](CHANGELOG.md)
2. 注意破坏性变更
3. 测试现有功能
4. 更新依赖版本

如果这里没有找到你遇到的问题，欢迎提交 Issue 或 Pull Request！
