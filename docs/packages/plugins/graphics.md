# GraphicsPlugin

GraphicsPlugin 是 Ktd Cesium 的核心绘制插件，封装了自定义图形的**绘制、编辑、加载、聚合、导出**等一系列能力，覆盖点、线、面、体、模型在内的 20+ 几何类型，并可与 Event、Tooltip、Transform 等插件联动。

## 导入

```typescript
import { GraphicsPlugin } from '@ktd-cesium/plugins'
import type { GraphicsPluginOptions, DrawAttribute, DrawType } from '@ktd-cesium/plugins'
```

## 安装

```typescript
import { KtdViewer } from '@ktd-cesium/core'
import { GraphicsPlugin } from '@ktd-cesium/plugins'

const viewer = new KtdViewer(cesiumViewer)
const graphics = viewer.use(GraphicsPlugin, {
  hasEdit: true,
  removeScreenSpaceEvent: true,
  transform: {
    enabled: true,
    mode: 'translate',
    space: 'world'
  }
} satisfies GraphicsPluginOptions)
```

## 核心特性

- **绘制体系**：内置 point、polyline、polygon、model 等 20+ `DrawType`，支持自定义 `register(type, DrawController)` 扩展。
- **编辑体验**：自动绑定 EventPlugin 进行点选编辑，支持右键菜单删除、Tooltip 引导、实体/Primitive 混合编辑。
- **数据链路**：`loadJson`/`toGeoJSON` 实现 GeoJSON 的导入导出，`updateAttribute` 可增量更新样式与业务属性。
- **聚合渲染**：同时支持 Entity clustering 与 Primitive 自实现聚合，可自定义颜色、字号、回调。
- **变换控制**：可选 TransformPlugin 以实现平移/旋转/缩放，多空间、多吸附配置。
- **事件系统**：内置 `draw-start`、`draw-created`、`edit-start` 等事件，与项目业务联动。

## 插件选项

| 选项 | 说明 |
| --- | --- |
| `hasEdit` | 是否启用编辑（默认 true） |
| `nameTooltip` | 是否显示名称提示 |
| `hasDel(entity)` | 控制右键菜单是否允许删除 |
| `removeScreenSpaceEvent` | 是否移除默认鼠标事件以避免冲突 |
| `clustering` | `ClusterOptions`，配置 Entity/Primitive 聚合样式与行为 |
| `transform` | 变换控制器配置：`enabled`、`mode`、`space`、`snap`、`rotateSnap` 等 |

## 可绘制类型

| 类型 | 说明 |
| --- | --- |
| `point` | Cesium 点图元，适合高性能散点 |
| `billboard` | 图片标注，支持聚合与 Tooltip |
| `label` | 文本标注，可配合 `billboard` 显示 |
| `model` | Entity 模式 3D 模型 |
| `model-p` | Primitive 模式模型，更贴近底层 |
| `polyline` | 折线/路径 |
| `curve` | 平滑曲线，基于插值 |
| `polylineVolume` | 线挤出形成体（如管道） |
| `corridor` | 走廊面，带宽度的路线 |
| `polygon` | 基础面 |
| `polygonEx` | 扩展面，支持更多编辑点 |
| `rectangle` | 矩形面 |
| `circle` | 圆形，半径快速设置 |
| `ellipse` | 椭圆，可设置长短轴 |
| `box` | 长方体 |
| `cylinder` | 圆柱体 |
| `ellipsoid` | 椭球体 |
| `wall` | 立面墙体 |
| `plane` | 平面，用于切面等 |
| `attackArrow` | 军标：攻击箭头（双翼） |
| `attackArrowPW` | 军标：平尾攻击箭头 |
| `attackArrowYW` | 军标：燕尾攻击箭头 |
| `doubleArrow` | 军标：双箭头 |
| `fineArrow` | 军标：细长箭头 |
| `fineArrowYW` | 军标：细长燕尾箭头 |
| `closeCurve` | 闭合曲线 |
| `lune` | 弓形面 |
| `regular` | 正多边形 |
| `sector` | 扇形 |
| `isoscelesTriangle` | 等腰三角形 |
| `gatheringPlace` | 集结地标记 |

> 全部类型即 `DrawType` 联合类型，若需扩展，使用 `register('custom-type', CustomDraw)` 注入外部 DrawController。

## Entity/Primitive 支持矩阵

GraphicsPlugin 同时维护 `CustomDataSource` 与 `PrimitiveCollection`，不同类型会落到不同容器，以兼顾编辑能力与性能。

| 分类 | 默认载体 | 说明 |
| --- | --- | --- |
| **Entity** | `Cesium.Entity`（数据源） | 点、面、折线、体几何等默认落在 Entity，可直接被 EventPlugin 选中、被 EditController 编辑，也能通过 `loadJson`/`toGeoJSON` 流程序列化。 |
| **Primitive** | `Cesium.PrimitiveCollection` | `model-p`、部分高性能管线或自定义 Primitive 绘制会添加到 `PrimitiveCollection`，通过 `_primitives` 维护引用，用于批量渲染、聚合。 |

### Entity 支持特性

- 自动绑定右键删除菜单、Tooltip 提示。
- 可被 `startEditing`/`hasEdit` 管理，若 `entity.attribute.hasEdit` 为 `false` 则跳过编辑。
- 可与 TransformPlugin 联动，只要 Entity 拥有 `position` 或姿态属性即可。
- `loadJson`/`toGeoJSON` 全量支持，依赖 AttrClass 提供的转换方法。

### Primitive 支持特性

- 仍可被 `startEditing` 选中，但需在 DrawController 内为 Primitive 设置 `id` 或自定义编辑器，确保 `isMyEntity` 能识别。
- 通过 `bindDeleteContextmenu` 的 Entity 菜单不会自动添加到 Primitive，需要在自定义控制器内覆盖。
- 聚合依赖 `_clusterPrimitives`，支持 Billboard、Point、Label 等常见 Primitive 类型。
- TransformPlugin 通过 `_canTransform` 判断 `modelMatrix`/`position` 字段，支持移动/旋转/缩放。

> 如需确保 Primitive 拥有和 Entity 相同的编辑体验，可在 DrawController 中混合使用 Entity 包裹 Primitive，或为 Primitive 填充 `editing`、`attribute` 等扩展字段，让 GraphicsPlugin 的统一逻辑生效。

## 快速上手

```typescript
const entity = graphics.startDraw({
  type: 'polygon',
  style: {
    material: '#ff6b6b',
    outline: true,
    outlineColor: '#ffffff'
  },
  attr: {
    id: 'plot-001',
    name: '施工红线'
  },
  success: (ent) => {
    console.log('绘制完成', ent.id)
  }
})

graphics.on('draw-created', ({ entity }) => {
  graphics.flyTo(entity!)
})
```

### 加载 GeoJSON

```typescript
const entities = graphics.loadJson(geojson, {
  clear: true,
  flyTo: true,
  style: { material: '#409eff', outlineColor: '#fff' },
  onEachFeature: (feature, type, index) => {
    feature.properties!.attr = { id: `json-${index}` }
    console.log('准备加载', type)
  },
  onEachEntity: (feature, entity) => {
    console.log('已加载实体', entity.id)
  }
})
```

### 导出 GeoJSON

```typescript
const geojson = graphics.toGeoJSON()
if (geojson) {
  download('graphics.geojson', JSON.stringify(geojson))
}
```

## 使用场景

### 场景 1：作业标绘与编辑

```typescript
const taskEntity = graphics.startDraw({
  type: 'regular',
  style: {
    sides: 6,
    material: '#2ecc71',
    outline: true,
    outlineColor: '#ffffff'
  },
  attr: {
    id: 'task-202401',
    level: 'warning'
  }
})

graphics.on('edit-stop', ({ entity }) => {
  const geojson = graphics.toGeoJSON(entity)
  submitTask(entity?.attribute?.attr?.id, geojson)
})
```

- 通过 `regular` 快速绘制定形区域，编辑停止后导出 GeoJSON 与业务系统同步。

### 场景 2：GeoJSON 批量加载 + 聚合

```typescript
graphics.setClusterOptions({
  enabled: true,
  pixelRange: 60,
  clusterStyle: {
    color: '#409eff',
    pixelSize: 36
  }
})

graphics.loadJson('/assets/poi.geojson', {
  clear: true,
  flyTo: true,
  onEachEntity: (feature, entity, index) => {
    entity.attribute!.attr = {
      id: `poi-${index}`,
      name: feature.properties?.name
    }
  }
})
```

- 启用聚合后加载海量点位，自动根据 feature 填充业务属性，保持场景流畅。

### 场景 3：Primitive 模型布设与变换

```typescript
graphics.startDraw({
  type: 'model-p',
  style: {
    url: '/models/vehicle.glb',
    scale: 1.5
  },
  success: (entity) => {
    graphics.enableTransform()
    graphics.setTransformMode(TransformMode.TRANSLATE)
    graphics.startEditing(entity)
  }
})
```

- 使用 Primitive 模式模型并立即开启 TransformPlugin，实现装备拖拽摆放的交互体验。

## API 概览

### 绘制控制

- `startDraw(attribute: DrawAttribute | DrawType)`：激活指定类型绘制，绘制完成会触发 `draw-created` 并调用 `attribute.success`。
- `stopDraw()`：终止当前绘制并退出编辑。
- `endDraw()`：强制结束所有控制器（适配移动端无双击）。
- `clearDraw()`/`deleteAll()`/`removeAll()`：清空 DataSource 与 PrimitiveCollection。
- `hasDrawing()` / `hasDraw()`：检测当前是否正在绘制/是否有已绘制实体。

### 数据操作

- `loadJson(json, options?: LoadJsonOptions)`：加载 GeoJSON，支持逐 feature/实体钩子、覆盖样式、自动飞行。
- `toGeoJSON(entity?)`：导出单个或全部实体。
- `getEntitys()` / `getEntityById(id)`：读取当前实体集合及按业务 id 检索。
- `updateAttribute(attribute, entity?)`：同步 DrawAttribute 中的 style/attr，自动刷新编辑拖拽器。
- `updateStyle(style, entity?)`：快捷方式，仅更新 style。
- `setPositions(positions, entity?)`：更新实体坐标及拖拽器。
- `getCoordinates(entity)` / `getPositions(entity)`：通过 AttrClass 提供的几何方法获取经纬度或 Cartesian3。

### 编辑 & 变换

- `hasEdit(enabled?)`：开启/关闭编辑模式，同时注册/移除 EventPlugin 选择事件。
- `startEditing(entity)` / `stopEditing()` / `getCurrentEntity()`：手动控制编辑状态。
- `enableTransform()` / `disableTransform()`：启用/禁用 TransformPlugin，对当前实体自动附着。
- `setTransformMode(mode)` / `setTransformSpace(space)` / `getTransformPlugin()`：调整变换行为。

### 可见性 & 视角

- `setVisible(visible)`：控制 DataSource、Primitive 集合与聚合层显隐。
- `flyTo(entity | entity[], cameraOptions?)`：根据实体位置计算包围球并飞行。

### 聚合

- `setClusterOptions(options)`：配置聚合开关、像素范围、最小数量、样式、回调。
- `enableClustering()` / `disableClustering()`：快捷开启或关闭。
- 内部 `_applyEntityClustering` 使用 Cesium 原生 `DataSource.clustering`，`_applyPrimitiveClustering` 自行维护 `clusterDataSource` 以显示聚合点并隐藏被聚合 Primitive。

### 事件

```typescript
graphics.on('draw-start', ({ drawtype }) => console.log(drawtype))
graphics.on('draw-created', ({ entity }) => { /* ... */ })
graphics.on('edit-start', ({ entity }) => { /* ... */ })
graphics.on('edit-stop', () => console.log('编辑结束'))
graphics.on('delete', ({ entity }) => console.log('删除', entity?.id))

// 取消监听
graphics.off('draw-created')
```

事件枚举来自 `EventType`，包括 `draw-start`、`draw-mouse-move`、`draw-add-point`、`draw-created`、`edit-start`、`edit-move-point`、`edit-stop`、`delete`。

## 自定义绘制

```typescript
import type { DrawController, DrawConfig, DrawAttribute } from '@ktd-cesium/plugins'
import { register } from '@ktd-cesium/plugins/dist/modules/GraphicsPlugin'

class DrawHeatmap implements DrawController {
  constructor(private config: DrawConfig) {}
  activate(attribute: DrawAttribute) {
    // 创建实体或 Primitive
    return this.config.dataSource!.entities.add({
      rectangle: {
        material: Cesium.Color.RED.withAlpha(attribute.style?.intensity ?? 0.8)
      }
    })
  }
  disable() {/* ... */}
}

register('heatmap', DrawHeatmap)
```

注册后即可 `graphics.startDraw('heatmap')`，并自动拥有 Tooltip、事件、右键菜单等基础功能。整套扩展建议遵循以下约定：

- **Controller 链路**：自定义类可直接继承内置 `DrawBase`，复用鼠标监听、拾取、结果回调；也可完全自实现，但必须实现 `activate` / `disable`。
- **AttrClass 配置**：若需要支持 `toGeoJSON`、`getPositions` 等方法，在自定义 Controller 上挂载 `attrClass`，实现 `toGeoJSON/getPositions/getCoordinates`。
- **事件透传**：通过 `setFireFunction` 获取 `fire(type, data)`，在绘制过程内触发 `draw-mouse-move` 等事件，保证行为一致。
- **Tooltip 支持**：调用 `setTooltip` 后，在 Controller 中随时 `tooltip?.showAt(...)` 提示用户。

> 通过 `register('custom-type', CustomDraw)` 注入的类型同样支持 `loadJson`（实现 `jsonToEntity`）、右键菜单、编辑开关等高级特性。

## 编辑算法扩展

GraphicsPlugin 的编辑能力由 `packages/plugins/src/modules/GraphicsPlugin/edit` 下的 Edit 系列控制器提供。若需要新增或改写编辑算法，可按以下步骤实现：

1. **实现 EditController 接口**  
   ```typescript
   import type { EditController } from '@ktd-cesium/plugins'

   class EditHeatmap implements EditController {
     constructor(private entity: Entity, private viewer: Cesium.Viewer) {}
     activate() {
       // 创建拖拽点、绑定事件
     }
     disable() {
       // 销毁拖拽点、解绑监听
     }
     updateDraggers() {
       // 可选：在属性更新后刷新拖拽状态
     }
     setPositions(positions: Cesium.Cartesian3[]) {
       // 可选：响应外部 setPositions 调用
     }
   }
   ```

2. **绑定到 DrawController**  
   在自定义 DrawController 中，将 edit 类实例挂到实体：`entity.editing = new EditHeatmap(entity, viewer, dataSource)`，并在 `activate`/`disable` 时调用其生命周期方法。

3. **复用 EditBase**（可选）  
   如果编辑流程与内置逻辑类似，可继承 `EditBase`（位于 edit 目录），复用拖拽器、拾取等公共逻辑，仅实现差异化方法，如 `_updatePositions`、`_createDraggers`。

4. **结合 AttrClass**  
   编辑器通常依赖 AttrClass 中的 `_positions_draw`、`style2Entity` 等数据。确保在更新几何时同步 `entity.attribute`，便于 `updateAttribute`、`loadJson` 等 API 正常工作。

> 扩展后的 EditController 会自动被 `startEditing` 使用：当实体被选中时，GraphicsPlugin 检查 `entity.editing.activate()`，因此只要在绘制后赋值即可享受原有编辑开关、事件、Tooltip、TransformPlugin 联动等能力。

## 实战建议

- **配合 EventPlugin**：GraphicsPlugin 默认尝试获取 `viewer.getPlugin('event')`，请确保项目已安装 EventPlugin，否则无法启用点击编辑。
- **清理资源**：在页面卸载时调用 `viewer.destroy()` 或手动 `graphics.destroy()`，以释放 DataSource、Primitive、Tooltip、TransformPlugin。
- **批量更新**：对大批量实体更新样式时，优先使用 `updateAttribute`，保证 AttrClass 的 `style2Entity` 得到调用。
- **聚合性能**：同时开启 Entity 与 Primitive 聚合时，注意避免过多 postRender 计算，可根据缩放级别动态 `enableClustering/disableClustering`。
- **变换控制**：仅 position/primitive 拥有 `modelMatrix` 的对象才可绑定 TransformPlugin，可通过 `graphics.hasEdit()` 控制编辑入口。

利用 GraphicsPlugin，可以快速构建完整的二维/三维标绘、批量数据渲染与交互编辑能力，为 Cesium 项目提供完善的矢量图形工作流。
