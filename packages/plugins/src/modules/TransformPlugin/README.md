# TransformPlugin 使用指南

TransformPlugin 提供了强大的 3D 实体变换功能，支持 **平移（Translate）**、**旋转（Rotate）** 和 **缩放（Scale）** 操作。

## 功能特性

- ✅ **平移控制**：沿 X、Y、Z 轴拖拽实体
- ✅ **旋转控制**：绕 X、Y、Z 轴旋转实体
- ✅ **缩放控制**：沿各轴向缩放实体
- ✅ **可视化辅助**：显示 3D Gizmo 控制手柄
- ✅ **坐标空间**：支持世界坐标系和本地坐标系
- ✅ **吸附功能**：支持网格吸附，精确定位
- ✅ **事件系统**：完整的变换事件回调

## 基本使用

### 1. 安装插件

```typescript
import { KtdViewer } from '@ktd-cesium/core'
import { TransformPlugin } from '@ktd-cesium/plugins'

const viewer = new KtdViewer(cesiumViewer)

// 安装 TransformPlugin
const transform = viewer.use(TransformPlugin, {
  mode: TransformMode.TRANSLATE,    // 默认模式：平移
  space: TransformSpace.WORLD,      // 默认空间：世界坐标系
  showGizmo: true,                  // 显示辅助轴
  gizmoSize: 1.0,                   // 辅助轴大小
  snap: false,                      // 禁用吸附
  translateSnap: 0.1,               // 平移吸附值（米）
  rotateSnap: 5,                    // 旋转吸附值（度）
  scaleSnap: 0.1                    // 缩放吸附值
})
```

### 2. 附加到实体

```typescript
// 创建一个模型实体
const entity = viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(116.39, 39.90, 0),
  model: {
    uri: '/path/to/model.glb',
    scale: 1.0
  }
})

// 附加变换控制器到实体
transform.attach(entity)
```

### 3. 切换变换模式

```typescript
// 切换到平移模式
transform.setMode(TransformMode.TRANSLATE)

// 切换到旋转模式
transform.setMode(TransformMode.ROTATE)

// 切换到缩放模式
transform.setMode(TransformMode.SCALE)
```

### 4. 切换坐标空间

```typescript
// 使用世界坐标系（默认）
transform.setSpace(TransformSpace.WORLD)

// 使用本地坐标系
transform.setSpace(TransformSpace.LOCAL)
```

### 5. 分离控制器

```typescript
// 分离控制器，停止变换
transform.detach()
```

## 进阶用法

### 启用吸附功能

吸附功能可以让变换操作更加精确：

```typescript
const transform = viewer.use(TransformPlugin, {
  snap: true,              // 启用吸附
  translateSnap: 0.5,      // 平移吸附到 0.5 米
  rotateSnap: 15,          // 旋转吸附到 15 度
  scaleSnap: 0.1           // 缩放吸附到 0.1 倍
})
```

### 编程式设置变换

```typescript
// 获取当前变换数据
const currentTransform = transform.getTransform()
console.log('Position:', currentTransform.position)
console.log('Rotation:', currentTransform.rotation)
console.log('Scale:', currentTransform.scale)

// 设置变换数据
transform.setTransform({
  position: Cesium.Cartesian3.fromDegrees(116.40, 39.91, 100),
  rotation: Cesium.Quaternion.fromAxisAngle(
    Cesium.Cartesian3.UNIT_Z,
    Cesium.Math.toRadians(45)
  ),
  scale: new Cesium.Cartesian3(2.0, 2.0, 2.0)
})
```

### 监听变换事件

```typescript
// 假设已安装 EventPlugin
const events = viewer.getPlugin('event')

// 监听变换开始
events.on('transform-start', (data) => {
  console.log('Transform started:', data.entity, data.mode)
})

// 监听变换变化
events.on('transform-change', (data) => {
  console.log('Transform changed:', data.transform)
})

// 监听变换结束
events.on('transform-end', (data) => {
  console.log('Transform ended:', data.entity)
})
```

### 自定义辅助轴大小

```typescript
// 创建较大的辅助轴（适合大型模型）
const transform = viewer.use(TransformPlugin, {
  gizmoSize: 2.0  // 2倍大小
})

// 创建较小的辅助轴（适合小型模型）
const transform = viewer.use(TransformPlugin, {
  gizmoSize: 0.5  // 0.5倍大小
})
```

### 隐藏辅助轴

如果只需要编程式控制变换，可以隐藏辅助轴：

```typescript
const transform = viewer.use(TransformPlugin, {
  showGizmo: false  // 不显示辅助轴
})

// 直接通过代码设置变换
transform.attach(entity)
transform.setTransform({
  position: newPosition
})
```

## 完整示例

### 示例 1：移动模型到指定位置

```typescript
import { KtdViewer } from '@ktd-cesium/core'
import { TransformPlugin, TransformMode, TransformSpace } from '@ktd-cesium/plugins'
import * as Cesium from 'cesium'

// 初始化 viewer
const viewer = new KtdViewer(cesiumViewer)

// 安装 TransformPlugin
const transform = viewer.use(TransformPlugin, {
  mode: TransformMode.TRANSLATE,
  snap: true,
  translateSnap: 1.0  // 1米网格吸附
})

// 添加模型
const model = viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(116.39, 39.90, 0),
  model: {
    uri: '/models/building.glb'
  }
})

// 附加控制器
transform.attach(model)

// 用户可以通过拖拽 X/Y/Z 轴来移动模型
// 移动会自动吸附到 1 米网格
```

### 示例 2：旋转飞机模型

```typescript
import { TransformPlugin, TransformMode } from '@ktd-cesium/plugins'

const transform = viewer.use(TransformPlugin, {
  mode: TransformMode.ROTATE,
  space: TransformSpace.LOCAL,  // 使用本地坐标系
  snap: true,
  rotateSnap: 15  // 每次旋转 15 度
})

const airplane = viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(116.39, 39.90, 1000),
  model: {
    uri: '/models/airplane.glb'
  },
  orientation: Cesium.Quaternion.IDENTITY
})

transform.attach(airplane)

// 用户可以拖拽旋转环来旋转飞机
// 旋转会自动吸附到 15 度增量
```

### 示例 3：缩放建筑物

```typescript
import { TransformPlugin, TransformMode } from '@ktd-cesium/plugins'

const transform = viewer.use(TransformPlugin, {
  mode: TransformMode.SCALE,
  snap: true,
  scaleSnap: 0.1  // 缩放吸附到 0.1 倍
})

const building = viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(116.39, 39.90, 0),
  model: {
    uri: '/models/building.glb',
    scale: 1.0
  }
})

transform.attach(building)

// 用户可以拖拽缩放手柄来缩放建筑
```

### 示例 4：动态切换模式

```typescript
const transform = viewer.use(TransformPlugin)
transform.attach(entity)

// 创建 UI 控制按钮
document.getElementById('translate-btn').addEventListener('click', () => {
  transform.setMode(TransformMode.TRANSLATE)
})

document.getElementById('rotate-btn').addEventListener('click', () => {
  transform.setMode(TransformMode.ROTATE)
})

document.getElementById('scale-btn').addEventListener('click', () => {
  transform.setMode(TransformMode.SCALE)
})

document.getElementById('world-space-btn').addEventListener('click', () => {
  transform.setSpace(TransformSpace.WORLD)
})

document.getElementById('local-space-btn').addEventListener('click', () => {
  transform.setSpace(TransformSpace.LOCAL)
})
```

### 示例 5：保存和恢复变换

```typescript
// 保存当前变换
const savedTransform = transform.getTransform()
localStorage.setItem('entity-transform', JSON.stringify({
  position: {
    x: savedTransform.position.x,
    y: savedTransform.position.y,
    z: savedTransform.position.z
  },
  rotation: {
    x: savedTransform.rotation.x,
    y: savedTransform.rotation.y,
    z: savedTransform.rotation.z,
    w: savedTransform.rotation.w
  },
  scale: {
    x: savedTransform.scale.x,
    y: savedTransform.scale.y,
    z: savedTransform.scale.z
  }
}))

// 恢复变换
const stored = JSON.parse(localStorage.getItem('entity-transform'))
transform.setTransform({
  position: new Cesium.Cartesian3(stored.position.x, stored.position.y, stored.position.z),
  rotation: new Cesium.Quaternion(stored.rotation.x, stored.rotation.y, stored.rotation.z, stored.rotation.w),
  scale: new Cesium.Cartesian3(stored.scale.x, stored.scale.y, stored.scale.z)
})
```

## API 参考

### TransformPlugin 类

#### 属性

- `entity: Entity | null` - 当前附加的实体
- `mode: TransformMode` - 当前变换模式
- `space: TransformSpace` - 当前坐标空间
- `active: boolean` - 是否激活

#### 方法

##### `attach(entity: Entity): void`

附加控制器到实体。

**参数：**
- `entity` - 要控制的 Cesium 实体

**示例：**
```typescript
transform.attach(myEntity)
```

##### `detach(): void`

分离控制器，停止变换操作。

**示例：**
```typescript
transform.detach()
```

##### `setMode(mode: TransformMode): void`

设置变换模式。

**参数：**
- `mode` - 变换模式（TRANSLATE、ROTATE、SCALE）

**示例：**
```typescript
transform.setMode(TransformMode.ROTATE)
```

##### `setSpace(space: TransformSpace): void`

设置坐标空间。

**参数：**
- `space` - 坐标空间（WORLD、LOCAL）

**示例：**
```typescript
transform.setSpace(TransformSpace.LOCAL)
```

##### `getTransform(): TransformData | null`

获取当前变换数据。

**返回值：**
- `TransformData` - 包含 position、rotation、scale 的对象

**示例：**
```typescript
const transform = transform.getTransform()
```

##### `setTransform(transform: Partial<TransformData>): void`

设置变换数据。

**参数：**
- `transform` - 部分或完整的变换数据

**示例：**
```typescript
transform.setTransform({
  position: Cesium.Cartesian3.fromDegrees(116.39, 39.90, 100)
})
```

### 枚举和类型

#### TransformMode

变换模式枚举：

```typescript
enum TransformMode {
  TRANSLATE = 'translate',  // 平移
  ROTATE = 'rotate',        // 旋转
  SCALE = 'scale'           // 缩放
}
```

#### TransformSpace

坐标空间枚举：

```typescript
enum TransformSpace {
  WORLD = 'world',  // 世界坐标系
  LOCAL = 'local'   // 本地坐标系
}
```

#### Axis

轴向枚举：

```typescript
enum Axis {
  X = 'x',      // X 轴
  Y = 'y',      // Y 轴
  Z = 'z',      // Z 轴
  XY = 'xy',    // XY 平面
  YZ = 'yz',    // YZ 平面
  XZ = 'xz',    // XZ 平面
  XYZ = 'xyz'   // 全方向
}
```

#### TransformData

变换数据接口：

```typescript
interface TransformData {
  position: Cartesian3    // 位置
  rotation: Quaternion    // 旋转（四元数）
  scale: Cartesian3       // 缩放
}
```

#### TransformPluginOptions

插件配置选项：

```typescript
interface TransformPluginOptions {
  mode?: TransformMode           // 默认变换模式
  space?: TransformSpace         // 默认坐标空间
  showGizmo?: boolean            // 是否显示辅助轴
  gizmoSize?: number             // 辅助轴大小
  snap?: boolean                 // 是否启用吸附
  translateSnap?: number         // 平移吸附值（米）
  rotateSnap?: number            // 旋转吸附值（度）
  scaleSnap?: number             // 缩放吸附值
}
```

#### TransformEventData

变换事件数据：

```typescript
interface TransformEventData {
  entity: Entity           // 实体
  mode: TransformMode      // 变换模式
  transform: TransformData // 变换数据
}
```

## 事件列表

TransformPlugin 会触发以下事件（需要配合 EventPlugin 使用）：

| 事件名 | 触发时机 | 事件数据 |
|--------|---------|---------|
| `transform-start` | 附加到实体时 | `TransformEventData` |
| `transform-change` | 变换数据变化时 | `TransformEventData` |
| `transform-end` | 分离实体时 | `TransformEventData` |

## 支持的实体类型

TransformPlugin 支持所有具有 `position` 属性的 Cesium 实体：

| 实体类型 | 支持说明 |
|---------|---------|
| Model | 完整支持平移、旋转、缩放 |
| Point | 平移改变位置，旋转/缩放影响点属性 |
| Billboard | 平移改变位置，缩放改变大小 |
| Label | 平移改变位置，缩放改变大小 |
| Polyline | 整体平移、旋转、缩放线段 |
| Polygon | 整体平移、旋转、缩放多边形 |
| Rectangle | 整体平移、旋转、缩放矩形 |
| Ellipse/Circle | 整体平移、旋转、缩放椭圆/圆形 |
| Corridor | 整体平移、旋转、缩放走廊 |
| Wall | 整体平移、旋转、缩放墙体 |
| Box | 整体平移、旋转、缩放立方体 |
| Cylinder | 整体平移、旋转、缩放圆柱 |
| Ellipsoid | 整体平移、旋转、缩放椭球 |
| Plane | 整体平移、旋转、缩放平面 |

## 注意事项

1. **实体要求**：
   - 实体必须有 `position` 属性（所有实体类型都有）
   - 旋转功能：如果实体没有 `orientation` 属性，会自动创建
   - 缩放功能：对于 model 修改 `scale` 属性，对于其他类型会尝试修改相应的大小属性

2. **性能考虑**：
   - 辅助轴使用 CallbackProperty 实时更新，大量使用可能影响性能
   - 如果不需要可视化辅助轴，可以设置 `showGizmo: false`

3. **坐标空间**：
   - 世界坐标系：变换轴向始终对齐世界坐标系（X-东、Y-北、Z-上）
   - 本地坐标系：变换轴向跟随实体自身朝向

4. **吸附精度**：
   - 吸附值越小，操作越精确，但可能不易对齐
   - 吸附值越大，对齐越容易，但精度降低

5. **四元数旋转**：
   - 插件使用四元数表示旋转，避免万向锁问题
   - 如需欧拉角，可使用 Cesium 的转换函数

## 常见问题

### Q: 如何禁用某个轴向的变换？

A: 目前插件不直接支持禁用单个轴向，但可以通过事件监听并过滤来实现：

```typescript
events.on('transform-change', (data) => {
  // 锁定 Z 轴位置
  const transform = data.transform
  transform.position.z = 0
  transformPlugin.setTransform({ position: transform.position })
})
```

### Q: 如何实现撤销/重做功能？

A: 可以监听变换事件并维护历史记录：

```typescript
const history: TransformData[] = []
let currentIndex = -1

events.on('transform-change', (data) => {
  const transform = data.transform
  history.splice(currentIndex + 1)  // 清除后续历史
  history.push(JSON.parse(JSON.stringify(transform)))
  currentIndex++
})

function undo() {
  if (currentIndex > 0) {
    currentIndex--
    transformPlugin.setTransform(history[currentIndex])
  }
}

function redo() {
  if (currentIndex < history.length - 1) {
    currentIndex++
    transformPlugin.setTransform(history[currentIndex])
  }
}
```

### Q: 如何实现多选变换？

A: 插件目前只支持单个实体变换。多选变换需要自行实现：

```typescript
// 计算多个实体的中心点
const center = computeCenter(selectedEntities)

// 创建临时中心实体
const centerEntity = viewer.entities.add({
  position: center,
  point: { pixelSize: 0 }
})

// 附加变换控制器
transform.attach(centerEntity)

// 监听变换，同步应用到所有选中实体
events.on('transform-change', (data) => {
  const offset = Cesium.Cartesian3.subtract(
    data.transform.position,
    center,
    new Cesium.Cartesian3()
  )

  selectedEntities.forEach(entity => {
    const newPos = Cesium.Cartesian3.add(
      entity.position.getValue(now),
      offset,
      new Cesium.Cartesian3()
    )
    entity.position = new Cesium.ConstantPositionProperty(newPos)
  })
})
```

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 相关插件

- **EventPlugin** - 提供事件系统支持
- **GraphicsPlugin** - 提供图形绘制和编辑功能

## 更新日志

### v1.0.0
- 首次发布
- 支持平移、旋转、缩放三种模式
- 支持世界坐标系和本地坐标系
- 支持网格吸附
- 可视化 3D Gizmo 控制手柄
