# TransformPlugin

变换插件，支持 **Entity 和 Primitive** 的**平移（Translate）**、**旋转（Rotate）** 和**缩放（Scale）**操作，提供可视化辅助轴（Gizmo）和吸附功能，适用于 3D 场景中的交互式变换。

## 导入

```typescript
import { TransformPlugin, TransformMode, TransformSpace, Axis } from '@ktd-cesium/plugins'
import type { TransformPluginOptions, TransformData, TransformEventData } from '@ktd-cesium/plugins'
```

## 核心特性

- **三种变换模式**：平移、旋转、缩放
- **双模式支持**：Entity 和 Primitive 两种渲染模式
- **坐标空间**：世界坐标系和本地坐标系
- **可视化辅助轴**：3D Gizmo 控制手柄，支持颜色区分（X-红、Y-绿、Z-蓝）
- **吸附功能**：平移、旋转、缩放均可配置吸附值
- **事件系统**：变换开始、变化、结束事件
- **Primitive 重置**：支持将 Primitive 重置到初始状态

## 安装

```typescript
import { KtdViewer } from '@ktd-cesium/core'
import { TransformPlugin, TransformMode, TransformSpace } from '@ktd-cesium/plugins'

const viewer = new KtdViewer(cesiumViewer)

const transform = viewer.use(TransformPlugin, {
  mode: TransformMode.TRANSLATE, // 默认模式：平移
  space: TransformSpace.WORLD, // 默认空间：世界坐标系
  showGizmo: true, // 显示辅助轴
  gizmoSize: 1.0, // 辅助轴大小
  snap: false, // 禁用吸附
  translateSnap: 0.1, // 平移吸附值（米）
  rotateSnap: 5, // 旋转吸附值（度）
  scaleSnap: 0.1 // 缩放吸附值
} satisfies TransformPluginOptions)
```

## 配置选项

| 选项            | 类型             | 默认值      | 说明               |
| --------------- | ---------------- | ----------- | ------------------ |
| `mode`          | `TransformMode`  | `TRANSLATE` | 默认变换模式       |
| `space`         | `TransformSpace` | `WORLD`     | 默认坐标空间       |
| `showGizmo`     | `boolean`        | `true`      | 是否显示辅助轴     |
| `gizmoSize`     | `number`         | `1.0`       | 辅助轴大小（倍数） |
| `snap`          | `boolean`        | `false`     | 是否启用吸附       |
| `translateSnap` | `number`         | `0.1`       | 平移吸附值（米）   |
| `rotateSnap`    | `number`         | `5`         | 旋转吸附值（度）   |
| `scaleSnap`     | `number`         | `0.1`       | 缩放吸附值         |

## 基础使用

### Entity 模式

```typescript
// 创建一个模型实体
const entity = viewer.cesiumViewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(116.39, 39.9, 0),
  model: {
    uri: '/path/to/model.glb',
    scale: 1.0
  }
})

// 附加变换控制器到实体
transform.attach(entity)

// 切换变换模式
transform.setMode(TransformMode.TRANSLATE) // 平移
transform.setMode(TransformMode.ROTATE) // 旋转
transform.setMode(TransformMode.SCALE) // 缩放

// 切换坐标空间
transform.setSpace(TransformSpace.WORLD) // 世界坐标系
transform.setSpace(TransformSpace.LOCAL) // 本地坐标系

// 分离控制器
transform.detach()
```

### Primitive 模式

```typescript
// 创建一个 Primitive（例如模型）
const modelPrimitive = new Cesium.Model({
  url: '/path/to/model.glb',
  modelMatrix: Cesium.Matrix4.IDENTITY
})
viewer.cesiumViewer.scene.primitives.add(modelPrimitive)

// 附加到 Primitive
transform.attachPrimitive(modelPrimitive)
// 或
transform.attach(modelPrimitive)

// 检查是否为 Primitive 模式
if (transform.isPrimitive()) {
  const primitive = transform.getPrimitive()
  console.log('当前是 Primitive 模式', primitive)
}

// 重置 Primitive 到初始状态
transform.resetPrimitive()
```

## 变换模式

### 平移模式（TRANSLATE）

平移模式允许沿 X、Y、Z 轴拖拽实体或 Primitive。

```typescript
transform.setMode(TransformMode.TRANSLATE)

// 辅助轴显示：
// - X 轴：红色箭头（东）
// - Y 轴：绿色箭头（北）
// - Z 轴：蓝色箭头（上）
```

**特点**：

- 拖拽箭头端点可沿对应轴向移动
- 支持世界坐标系和本地坐标系
- 可配置平移吸附值

### 旋转模式（ROTATE）

旋转模式允许绕 X、Y、Z 轴旋转实体或 Primitive。

```typescript
transform.setMode(TransformMode.ROTATE)

// 辅助轴显示：
// - X 轴：红色旋转环
// - Y 轴：绿色旋转环
// - Z 轴：蓝色旋转环
```

**特点**：

- 拖拽旋转环可绕对应轴向旋转
- 使用四元数表示旋转，避免万向锁
- 可配置旋转吸附值（度）

### 缩放模式（SCALE）

缩放模式允许沿 X、Y、Z 轴缩放实体或 Primitive。

```typescript
transform.setMode(TransformMode.SCALE)

// 辅助轴显示：
// - X 轴：红色方块（东）
// - Y 轴：绿色方块（北）
// - Z 轴：蓝色方块（上）
```

**特点**：

- 拖拽方块可沿对应轴向缩放
- 支持非均匀缩放
- 可配置缩放吸附值

## 坐标空间

### 世界坐标系（WORLD）

世界坐标系中，变换轴向始终对齐世界坐标系：

- X 轴：东
- Y 轴：北
- Z 轴：上

```typescript
transform.setSpace(TransformSpace.WORLD)
```

**适用场景**：

- 需要相对于地球固定方向移动
- 建筑物、地标等需要保持朝向的场景

### 本地坐标系（LOCAL）

本地坐标系中，变换轴向跟随实体自身朝向。

```typescript
transform.setSpace(TransformSpace.LOCAL)
```

**适用场景**：

- 飞机、车辆等有自身朝向的对象
- 需要相对于对象自身方向变换的场景

## 吸附功能

吸附功能可以让变换操作更加精确，支持平移、旋转、缩放三种模式的吸附。

```typescript
const transform = viewer.use(TransformPlugin, {
  snap: true, // 启用吸附
  translateSnap: 0.5, // 平移吸附到 0.5 米
  rotateSnap: 15, // 旋转吸附到 15 度
  scaleSnap: 0.1 // 缩放吸附到 0.1 倍
})
```

**吸附值说明**：

- `translateSnap`：平移吸附值，单位为米
- `rotateSnap`：旋转吸附值，单位为度
- `scaleSnap`：缩放吸附值，为倍数增量

## API 概览

### attach(target)

附加控制器到实体或 Primitive。

```typescript
// Entity
transform.attach(entity: Cesium.Entity): void

// Primitive
transform.attach(primitive: PrimitiveWithTransform): void
transform.attachPrimitive(primitive: PrimitiveWithTransform): void
```

**参数**：

- `target` - Cesium Entity 或具有 `modelMatrix` 的 Primitive

**示例**：

```typescript
// Entity
const entity = viewer.cesiumViewer.entities.add({
  /* ... */
})
transform.attach(entity)

// Primitive
const primitive = new Cesium.Model({
  /* ... */
})
transform.attachPrimitive(primitive)
```

### detach()

分离控制器，停止变换操作。

```typescript
transform.detach(): void
```

### setMode(mode)

设置变换模式。

```typescript
transform.setMode(mode: TransformMode): void
```

**参数**：

- `mode` - `TransformMode.TRANSLATE` | `TransformMode.ROTATE` | `TransformMode.SCALE`

### setSpace(space)

设置坐标空间。

```typescript
transform.setSpace(space: TransformSpace): void
```

**参数**：

- `space` - `TransformSpace.WORLD` | `TransformSpace.LOCAL`

### getTransform()

获取当前变换数据。

```typescript
const transformData: TransformData | null = transform.getTransform()
```

**返回值**：

```typescript
interface TransformData {
  position: Cesium.Cartesian3 // 位置
  rotation: Cesium.Quaternion // 旋转（四元数）
  scale: Cesium.Cartesian3 // 缩放
}
```

**示例**：

```typescript
const data = transform.getTransform()
if (data) {
  console.log('位置:', data.position)
  console.log('旋转:', data.rotation)
  console.log('缩放:', data.scale)
}
```

### setTransform(transform)

设置变换数据。

```typescript
transform.setTransform(transform: Partial<TransformData>): void
```

**参数**：

- `transform` - 部分或完整的变换数据

**示例**：

```typescript
// 只设置位置
transform.setTransform({
  position: Cesium.Cartesian3.fromDegrees(116.4, 39.91, 100)
})

// 设置完整变换
transform.setTransform({
  position: Cesium.Cartesian3.fromDegrees(116.4, 39.91, 100),
  rotation: Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_Z, Cesium.Math.toRadians(45)),
  scale: new Cesium.Cartesian3(2.0, 2.0, 2.0)
})
```

### getPrimitive()

获取当前附加的 Primitive（仅 Primitive 模式）。

```typescript
const primitive: PrimitiveWithTransform | null = transform.getPrimitive()
```

### isPrimitive()

检查是否为 Primitive 模式。

```typescript
const isPrimitive: boolean = transform.isPrimitive()
```

### resetPrimitive()

重置 Primitive 到初始状态（仅 Primitive 模式）。

```typescript
transform.resetPrimitive(): void
```

## 事件系统

TransformPlugin 会触发以下事件（需要配合 EventPlugin 使用）：

| 事件名             | 触发时机                  | 事件数据             |
| ------------------ | ------------------------- | -------------------- |
| `transform-start`  | 附加到实体或 Primitive 时 | `TransformEventData` |
| `transform-change` | 变换数据变化时            | `TransformEventData` |
| `transform-end`    | 分离实体或 Primitive 时   | `TransformEventData` |

### 监听事件

```typescript
// 假设已安装 EventPlugin
const events = viewer.getPlugin('event')

// 监听变换开始
events.on('transform-start', (data: TransformEventData) => {
  console.log('变换开始:', data.entity, data.mode)
  console.log('变换数据:', data.transform)
})

// 监听变换变化
events.on('transform-change', (data: TransformEventData) => {
  console.log('变换变化:', data.transform)
  // 可以在这里保存历史记录、更新 UI 等
})

// 监听变换结束
events.on('transform-end', (data: TransformEventData) => {
  console.log('变换结束:', data.entity)
})
```

### 事件数据

```typescript
interface TransformEventData {
  entity: Cesium.Entity | null // 实体（Primitive 模式时为 null）
  mode: TransformMode // 变换模式
  transform: TransformData // 变换数据
}
```

## 使用场景

### 场景 1：Entity 模型变换

```typescript
import { TransformPlugin, TransformMode } from '@ktd-cesium/plugins'

const transform = viewer.use(TransformPlugin, {
  mode: TransformMode.TRANSLATE,
  snap: true,
  translateSnap: 1.0 // 1米网格吸附
})

// 添加模型
const model = viewer.cesiumViewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(116.39, 39.9, 0),
  model: {
    uri: '/models/building.glb'
  }
})

// 附加控制器
transform.attach(model)

// 用户可以通过拖拽 X/Y/Z 轴来移动模型
// 移动会自动吸附到 1 米网格
```

### 场景 2：Primitive 模型变换

```typescript
import { TransformPlugin, TransformMode } from '@ktd-cesium/plugins'

const transform = viewer.use(TransformPlugin, {
  mode: TransformMode.ROTATE,
  space: TransformSpace.LOCAL, // 使用本地坐标系
  snap: true,
  rotateSnap: 15 // 每次旋转 15 度
})

// 创建 Primitive 模型
const modelPrimitive = new Cesium.Model({
  url: '/models/airplane.glb',
  modelMatrix: Cesium.Matrix4.fromTranslation(Cesium.Cartesian3.fromDegrees(116.39, 39.9, 1000))
})
viewer.cesiumViewer.scene.primitives.add(modelPrimitive)

// 附加控制器
transform.attachPrimitive(modelPrimitive)

// 用户可以拖拽旋转环来旋转飞机
// 旋转会自动吸附到 15 度增量

// 重置到初始状态
function resetModel() {
  transform.resetPrimitive()
}
```

### 场景 3：动态切换模式

```typescript
const transform = viewer.use(TransformPlugin)
transform.attach(entity)

// 创建 UI 控制按钮
document.getElementById('translate-btn')?.addEventListener('click', () => {
  transform.setMode(TransformMode.TRANSLATE)
})

document.getElementById('rotate-btn')?.addEventListener('click', () => {
  transform.setMode(TransformMode.ROTATE)
})

document.getElementById('scale-btn')?.addEventListener('click', () => {
  transform.setMode(TransformMode.SCALE)
})

document.getElementById('world-space-btn')?.addEventListener('click', () => {
  transform.setSpace(TransformSpace.WORLD)
})

document.getElementById('local-space-btn')?.addEventListener('click', () => {
  transform.setSpace(TransformSpace.LOCAL)
})
```

### 场景 4：保存和恢复变换

```typescript
// 保存当前变换
function saveTransform() {
  const transformData = transform.getTransform()
  if (!transformData) return

  const saved = {
    position: {
      x: transformData.position.x,
      y: transformData.position.y,
      z: transformData.position.z
    },
    rotation: {
      x: transformData.rotation.x,
      y: transformData.rotation.y,
      z: transformData.rotation.z,
      w: transformData.rotation.w
    },
    scale: {
      x: transformData.scale.x,
      y: transformData.scale.y,
      z: transformData.scale.z
    }
  }

  localStorage.setItem('entity-transform', JSON.stringify(saved))
}

// 恢复变换
function restoreTransform() {
  const stored = localStorage.getItem('entity-transform')
  if (!stored) return

  const data = JSON.parse(stored)
  transform.setTransform({
    position: new Cesium.Cartesian3(data.position.x, data.position.y, data.position.z),
    rotation: new Cesium.Quaternion(data.rotation.x, data.rotation.y, data.rotation.z, data.rotation.w),
    scale: new Cesium.Cartesian3(data.scale.x, data.scale.y, data.scale.z)
  })
}
```

### 场景 5：与 GraphicsPlugin 集成

```typescript
import { GraphicsPlugin, TransformPlugin, TransformMode } from '@ktd-cesium/plugins'

const graphics = viewer.use(GraphicsPlugin, {
  transform: {
    enabled: true,
    mode: TransformMode.TRANSLATE,
    space: TransformSpace.WORLD
  }
})

const transform = viewer.getPlugin('transform') as TransformPlugin

// 绘制完成后自动启用变换
graphics.on('draw-created', (entity) => {
  transform.attach(entity)
  transform.setMode(TransformMode.TRANSLATE)
})

// 编辑时启用变换
graphics.on('edit-start', (entity) => {
  transform.attach(entity)
  transform.setMode(TransformMode.TRANSLATE)
})

// 编辑结束时分离
graphics.on('edit-end', () => {
  transform.detach()
})
```

### 场景 6：撤销/重做功能

```typescript
class TransformHistory {
  private history: TransformData[] = []
  private currentIndex = -1

  constructor(private transform: TransformPlugin) {
    // 监听变换变化
    const events = viewer.getPlugin('event')
    events?.on('transform-change', (data: TransformEventData) => {
      this.addToHistory(data.transform)
    })
  }

  addToHistory(transformData: TransformData): void {
    // 清除后续历史
    this.history = this.history.slice(0, this.currentIndex + 1)
    // 添加新历史
    this.history.push(this.cloneTransform(transformData))
    this.currentIndex++
  }

  undo(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--
      this.transform.setTransform(this.history[this.currentIndex])
    }
  }

  redo(): void {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++
      this.transform.setTransform(this.history[this.currentIndex])
    }
  }

  private cloneTransform(transform: TransformData): TransformData {
    return {
      position: Cesium.Cartesian3.clone(transform.position),
      rotation: Cesium.Quaternion.clone(transform.rotation),
      scale: Cesium.Cartesian3.clone(transform.scale)
    }
  }
}

// 使用
const transform = viewer.use(TransformPlugin)
const history = new TransformHistory(transform)

// UI 按钮
document.getElementById('undo-btn')?.addEventListener('click', () => {
  history.undo()
})

document.getElementById('redo-btn')?.addEventListener('click', () => {
  history.redo()
})
```

### 场景 7：多选变换（自定义实现）

```typescript
class MultiSelectTransform {
  private selectedEntities: Cesium.Entity[] = []
  private centerEntity: Cesium.Entity | null = null

  constructor(
    private viewer: KtdViewer,
    private transform: TransformPlugin
  ) {}

  selectEntities(entities: Cesium.Entity[]): void {
    this.selectedEntities = entities
    this.updateCenter()
  }

  private updateCenter(): void {
    if (this.selectedEntities.length === 0) {
      if (this.centerEntity) {
        this.viewer.cesiumViewer.entities.remove(this.centerEntity)
        this.centerEntity = null
      }
      this.transform.detach()
      return
    }

    // 计算中心点
    const positions = this.selectedEntities
      .map((entity) => {
        return entity.position?.getValue(Cesium.JulianDate.now())
      })
      .filter(Boolean) as Cesium.Cartesian3[]

    if (positions.length === 0) return

    const center = this.computeCenter(positions)

    // 创建或更新中心实体
    if (!this.centerEntity) {
      this.centerEntity = this.viewer.cesiumViewer.entities.add({
        position: center,
        point: { pixelSize: 0 } // 不可见
      })
    } else {
      this.centerEntity.position = new Cesium.ConstantPositionProperty(center)
    }

    // 附加变换控制器
    this.transform.attach(this.centerEntity)

    // 监听变换，同步应用到所有选中实体
    const events = this.viewer.getPlugin('event')
    events?.on('transform-change', (data: TransformEventData) => {
      if (data.entity === this.centerEntity) {
        this.syncTransform(data.transform)
      }
    })
  }

  private syncTransform(transform: TransformData): void {
    const oldCenter = this.centerEntity!.position!.getValue(Cesium.JulianDate.now())
    const offset = Cesium.Cartesian3.subtract(transform.position, oldCenter, new Cesium.Cartesian3())

    this.selectedEntities.forEach((entity) => {
      const currentPos = entity.position?.getValue(Cesium.JulianDate.now())
      if (currentPos) {
        const newPos = Cesium.Cartesian3.add(currentPos, offset, new Cesium.Cartesian3())
        entity.position = new Cesium.ConstantPositionProperty(newPos)
      }
    })
  }

  private computeCenter(positions: Cesium.Cartesian3[]): Cesium.Cartesian3 {
    const sum = positions.reduce((acc, pos) => {
      return Cesium.Cartesian3.add(acc, pos, acc)
    }, new Cesium.Cartesian3())
    return Cesium.Cartesian3.divideByScalar(sum, positions.length, new Cesium.Cartesian3())
  }
}

// 使用
const transform = viewer.use(TransformPlugin)
const multiSelect = new MultiSelectTransform(viewer, transform)

// 选择多个实体
multiSelect.selectEntities([entity1, entity2, entity3])
```

### 场景 8：锁定轴向

```typescript
// 锁定 Z 轴位置（例如：只允许在地面上移动）
const events = viewer.getPlugin('event')
events?.on('transform-change', (data: TransformEventData) => {
  if (data.mode === TransformMode.TRANSLATE) {
    // 锁定 Z 轴为 0（地面）
    const lockedPosition = Cesium.Cartesian3.clone(data.transform.position)
    lockedPosition.z = 0
    transform.setTransform({ position: lockedPosition })
  }
})

// 锁定 XY 平面旋转（例如：只允许绕 Z 轴旋转）
events?.on('transform-change', (data: TransformEventData) => {
  if (data.mode === TransformMode.ROTATE) {
    // 提取 Z 轴旋转
    const euler = Cesium.Matrix3.getEuler(Cesium.Matrix3.fromQuaternion(data.transform.rotation))
    const zRotation = Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_Z, euler.z)
    transform.setTransform({ rotation: zRotation })
  }
})
```

## 枚举和类型

### TransformMode

变换模式枚举：

```typescript
enum TransformMode {
  TRANSLATE = 'translate', // 平移
  ROTATE = 'rotate', // 旋转
  SCALE = 'scale' // 缩放
}
```

### TransformSpace

坐标空间枚举：

```typescript
enum TransformSpace {
  WORLD = 'world', // 世界坐标系
  LOCAL = 'local' // 本地坐标系
}
```

### Axis

轴向枚举：

```typescript
enum Axis {
  X = 'x', // X 轴
  Y = 'y', // Y 轴
  Z = 'z', // Z 轴
  XY = 'xy', // XY 平面
  YZ = 'yz', // YZ 平面
  XZ = 'xz', // XZ 平面
  XYZ = 'xyz' // 全方向
}
```

### TransformData

变换数据接口：

```typescript
interface TransformData {
  position: Cesium.Cartesian3 // 位置
  rotation: Cesium.Quaternion // 旋转（四元数）
  scale: Cesium.Cartesian3 // 缩放
}
```

### TransformPluginOptions

插件配置选项：

```typescript
interface TransformPluginOptions {
  mode?: TransformMode // 默认变换模式
  space?: TransformSpace // 默认坐标空间
  showGizmo?: boolean // 是否显示辅助轴
  gizmoSize?: number // 辅助轴大小
  snap?: boolean // 是否启用吸附
  translateSnap?: number // 平移吸附值（米）
  rotateSnap?: number // 旋转吸附值（度）
  scaleSnap?: number // 缩放吸附值
}
```

### TransformEventData

变换事件数据：

```typescript
interface TransformEventData {
  entity: Cesium.Entity | null // 实体（Primitive 模式时为 null）
  mode: TransformMode // 变换模式
  transform: TransformData // 变换数据
}
```

## 支持的实体和 Primitive 类型

### Entity 类型

TransformPlugin 支持所有具有 `position` 属性的 Cesium 实体：

| 实体类型       | 支持说明                          |
| -------------- | --------------------------------- |
| Model          | 完整支持平移、旋转、缩放          |
| Point          | 平移改变位置，旋转/缩放影响点属性 |
| Billboard      | 平移改变位置，缩放改变大小        |
| Label          | 平移改变位置，缩放改变大小        |
| Polyline       | 整体平移、旋转、缩放线段          |
| Polygon        | 整体平移、旋转、缩放多边形        |
| Rectangle      | 整体平移、旋转、缩放矩形          |
| Ellipse/Circle | 整体平移、旋转、缩放椭圆/圆形     |
| Corridor       | 整体平移、旋转、缩放走廊          |
| Wall           | 整体平移、旋转、缩放墙体          |
| Box            | 整体平移、旋转、缩放立方体        |
| Cylinder       | 整体平移、旋转、缩放圆柱          |
| Ellipsoid      | 整体平移、旋转、缩放椭球          |
| Plane          | 整体平移、旋转、缩放平面          |

### Primitive 类型

支持具有 `modelMatrix` 属性的 Primitive：

| Primitive 类型      | 支持说明                    |
| ------------------- | --------------------------- |
| Model               | 通过 `modelMatrix` 控制变换 |
| Primitive（自定义） | 需要具有 `modelMatrix` 属性 |

**Primitive 要求**：

- 必须具有 `modelMatrix` 属性（`Cesium.Matrix4`）
- 或具有 `geometryInstances.modelMatrix` 属性

## 注意事项

1. **实体要求**：
   - Entity 必须有 `position` 属性（所有实体类型都有）
   - 旋转功能：如果实体没有 `orientation` 属性，会自动创建
   - 缩放功能：对于 model 修改 `scale` 属性，对于其他类型会尝试修改相应的大小属性

2. **Primitive 要求**：
   - 必须具有 `modelMatrix` 属性
   - 初始 `modelMatrix` 会被保存，用于 `resetPrimitive()` 重置

3. **性能考虑**：
   - 辅助轴使用 `CallbackProperty` 实时更新，大量使用可能影响性能
   - 如果不需要可视化辅助轴，可以设置 `showGizmo: false`
   - Primitive 模式通过直接修改 `modelMatrix`，性能优于 Entity 模式

4. **坐标空间**：
   - 世界坐标系：变换轴向始终对齐世界坐标系（X-东、Y-北、Z-上）
   - 本地坐标系：变换轴向跟随实体自身朝向

5. **吸附精度**：
   - 吸附值越小，操作越精确，但可能不易对齐
   - 吸附值越大，对齐越容易，但精度降低

6. **四元数旋转**：
   - 插件使用四元数表示旋转，避免万向锁问题
   - 如需欧拉角，可使用 Cesium 的转换函数

7. **事件系统**：
   - 需要配合 EventPlugin 使用才能触发事件
   - Primitive 模式下，`entity` 字段为 `null`

8. **辅助轴颜色**：
   - X 轴：红色
   - Y 轴：绿色
   - Z 轴：蓝色

## 常见问题

### Q: 如何禁用某个轴向的变换？

A: 目前插件不直接支持禁用单个轴向，但可以通过事件监听并过滤来实现：

```typescript
const transform = viewer.getPlugin('transform') as TransformPlugin
const events = viewer.getPlugin('event')
events?.on('transform-change', (data: TransformEventData) => {
  // 锁定 Z 轴位置
  const lockedPosition = Cesium.Cartesian3.clone(data.transform.position)
  lockedPosition.z = 0
  transform.setTransform({ position: lockedPosition })
})
```

### Q: 如何实现撤销/重做功能？

A: 可以监听变换事件并维护历史记录（参考"场景 6：撤销/重做功能"）。

### Q: 如何实现多选变换？

A: 插件目前只支持单个实体变换。多选变换需要自行实现（参考"场景 7：多选变换"）。

### Q: Primitive 模式和 Entity 模式有什么区别？

A:

- **Entity 模式**：通过修改 Entity 的属性（`position`、`orientation`、`scale`），更易编辑和序列化
- **Primitive 模式**：通过直接修改 `modelMatrix`，性能更高，适合大量对象

### Q: 如何判断当前是 Entity 还是 Primitive 模式？

A: 使用 `transform.isPrimitive()` 方法：

```typescript
if (transform.isPrimitive()) {
  console.log('当前是 Primitive 模式')
  const primitive = transform.getPrimitive()
} else {
  console.log('当前是 Entity 模式')
  const entity = transform.entity
}
```

### Q: 如何自定义辅助轴样式？

A: 辅助轴通过 Entity 创建，可以通过修改 `gizmoDataSource` 中的实体来改变样式：

```typescript
// 注意：这是内部实现，不建议直接修改
// 如果需要自定义，建议隐藏辅助轴并自行实现
const transform = viewer.use(TransformPlugin, {
  showGizmo: false // 隐藏默认辅助轴
})

// 自行创建自定义辅助轴
```

## 相关插件

- **EventPlugin** - 提供事件系统支持
- **GraphicsPlugin** - 提供图形绘制和编辑功能，可集成 TransformPlugin
- **TooltipPlugin** - 提供提示框功能，可用于显示变换信息

## 更新日志

### v1.0.0

- 首次发布
- 支持平移、旋转、缩放三种模式
- 支持世界坐标系和本地坐标系
- 支持 Entity 和 Primitive 两种模式
- 支持网格吸附
- 可视化 3D Gizmo 控制手柄
- 支持 Primitive 重置功能
