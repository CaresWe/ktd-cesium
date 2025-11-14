# GraphicsPlugin - 图形绘制与编辑插件

从 `ktd-sdk-js` 的 `mars/draw` 模块迁移而来的图形绘制和编辑功能插件。

## 当前进度

### ✅ 已完成

1. **核心架构** (`types.ts`, `index.ts`)
   - ✅ TypeScript 类型定义
   - ✅ 插件主类框架
   - ✅ 事件系统集成

2. **Core 模块** (`core/`)
   - ✅ `MarsClass.ts` - 类继承系统
   - ✅ `Events.ts` - 事件系统
   - ✅ `Util.ts` - 工具函数集合 (含坐标转换)
   - ✅ `EventType.ts` - 事件类型常量
   - ✅ `Tooltip.ts` - 提示框组件

3. **Attr 模块** (`attr/`) - 属性配置
   - ✅ `AttrPoint.ts` - 点属性
   - ✅ `AttrLabel.ts` - 文字标注属性
   - ✅ `AttrPolyline.ts` - 线属性
   - ✅ `AttrPolygon.ts` - 面属性
   - ✅ `index.ts` - 模块导出

4. **Draw 模块** (`draw/`) - 绘制功能
   - ✅ `DrawBase.ts` - 绘制基类
   - ✅ `DrawPoint.ts` - 点绘制
   - ✅ `DrawPolyline.ts` - 线绘制
   - ✅ `DrawPolygon.ts` - 面绘制
   - ✅ `index.ts` - 模块导出

5. **Edit 模块** (`edit/`) - 编辑功能
   - ✅ `Dragger.ts` - 拖拽点管理
   - ⏳ `EditBase.ts` - 编辑基类 (需完成)
   - ⏳ `EditPoint.ts` - 点编辑 (需完成)
   - ⏳ `EditPolyline.ts` - 线编辑 (需完成)
   - ⏳ `EditPolygon.ts` - 面编辑 (需完成)

### 🚧 待完成

6. **Edit 模块完善** - 剩余编辑类
7. **插件集成** - 将所有模块集成到主插件类
8. **其他图形类型** - Circle, Rectangle, Billboard 等

## 目录结构

```
GraphicsPlugin/
├── index.ts              # 主插件类
├── types.ts              # TypeScript 类型定义
├── README.md             # 本文档
├── core/                 # ✅ 核心模块 (已完成)
│   ├── index.ts
│   ├── MarsClass.ts      # 类继承系统
│   ├── Events.ts         # 事件系统
│   ├── Util.ts           # 工具函数
│   ├── EventType.ts      # 事件类型
│   └── Tooltip.ts        # 提示框
├── attr/                 # ⏳ 属性配置模块 (待迁移)
│   ├── index.ts
│   ├── Attr.Point.ts
│   ├── Attr.Polyline.ts
│   └── ...
├── draw/                 # ⏳ 绘制模块 (待迁移)
│   ├── index.ts
│   ├── Draw.Base.ts
│   ├── Draw.Point.ts
│   ├── Draw.Polyline.ts
│   └── ...
└── edit/                 # ⏳ 编辑模块 (待迁移)
    ├── index.ts
    ├── Edit.Base.ts
    ├── Dragger.ts
    └── ...
```

## 使用示例

```typescript
import { createViewer } from '@ktd-cesium/core'
import { GraphicsPlugin } from '@ktd-cesium/plugins'

// 创建 viewer 并安装插件
const viewer = createViewer('cesiumContainer')
viewer.use(GraphicsPlugin)

// 获取插件实例
const graphics = viewer.graphics

// 开始绘制多边形
graphics.startDraw({
  type: 'polygon',
  style: {
    color: '#ff0000',
    opacity: 0.6,
    outline: true,
    outlineColor: '#ffffff'
  }
})

// 监听绘制完成事件
graphics.on('draw-created', (data) => {
  console.log('绘制完成:', data.entity)
})

// 加载 GeoJSON 数据
const geojson = {
  type: 'FeatureCollection',
  features: [...]
}
graphics.loadJson(geojson, { flyTo: true })

// 导出为 GeoJSON
const exported = graphics.toGeoJSON()
```

## 迁移指南

### 如何继续迁移剩余模块

1. **迁移 Attr 模块**
   ```bash
   # 参考 ktd-sdk-js/src/mars/draw/attr/
   # 将每个 Attr.*.js 转换为 TypeScript
   # 示例: Attr.Point.js -> Attr.Point.ts
   ```

2. **迁移 Draw 模块**
   ```bash
   # 参考 ktd-sdk-js/src/mars/draw/draw/
   # 先迁移 Draw.Base.js 作为基类
   # 然后依次迁移各个绘制类
   ```

3. **迁移 Edit 模块**
   ```bash
   # 参考 ktd-sdk-js/src/mars/draw/edit/
   # 先迁移 Edit.Base.js 和 Dragger.js
   # 然后依次迁移各个编辑类
   ```

### 迁移要点

1. **JavaScript → TypeScript**
   - 添加类型定义
   - 使用 interface/type 定义数据结构
   - 为函数参数和返回值添加类型

2. **MarsClass.extend → ES6 Class**
   ```typescript
   // 旧写法
   export var DrawPoint = DrawBase.extend({
     type: 'point',
     createFeature: function() { }
   })

   // 新写法
   export class DrawPoint extends DrawBase {
     type = 'point'
     createFeature() { }
   }
   ```

3. **兼容 ktd-cesium 写法**
   - 使用插件系统
   - 通过 `viewer.graphics` 访问
   - 保持 API 一致性

4. **依赖处理**
   - 移除对 ktd-sdk-js 内部模块的依赖
   - 使用本地实现或 Cesium 原生 API
   - 工具函数统一放在 `core/Util.ts`

## 关键改进

相比原 mars/draw 模块，本插件做了以下改进:

1. **TypeScript 支持** - 完整的类型定义,更好的 IDE 支持
2. **模块化架构** - 清晰的模块划分,易于维护
3. **插件化集成** - 无缝集成到 ktd-cesium 架构
4. **现代化语法** - 使用 ES6+ 特性,代码更简洁
5. **更好的事件系统** - 类型安全的事件监听和触发

## 注意事项

1. **坐标转换函数** - `core/Util.ts` 中的坐标转换函数为简化实现,可能需要进一步优化
2. **样式兼容性** - 需要确保 CSS 样式文件 (`ktd3d-draw-tooltip` 等) 已正确引入
3. **依赖项** - 某些功能依赖 Cesium 特定版本,请确认兼容性

## 下一步计划

1. 完成 `Draw.Base.ts` 基类迁移
2. 实现 1-2 个示例绘制类 (Point, Polyline)
3. 测试基础绘制功能
4. 逐步迁移其余绘制类和编辑类
5. 完善文档和示例

## 贡献

如需继续完成迁移工作,请参考上述迁移指南,保持代码风格一致。
