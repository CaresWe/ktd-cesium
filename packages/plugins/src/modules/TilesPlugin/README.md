# TilesPlugin - 3D Tiles 插件

强大的 3D Tiles 管理插件，支持各类 3D 模型加载、单体化分层分户、样式自定义材质等功能。

## 功能特性

- ✅ **多种 3D 模型支持**：3D Tiles、glTF、BIM 等各类模型格式
- ✅ **单体化功能**：支持分层、分户、分楼栋等单体化管理
- ✅ **样式管理**：丰富的样式自定义和材质管理
- ✅ **交互功能**：点击选择、悬停高亮、属性查询
- ✅ **批量操作**：支持批量显示/隐藏、批量设置颜色
- ✅ **模型变换**：支持位置偏移、旋转、缩放

## 基础使用

### 1. 安装插件

```typescript
import { AutoViewer } from '@auto-cesium/core'
import { TilesPlugin } from '@auto-cesium/plugins'

const viewer = new AutoViewer(cesiumViewer)
viewer.use(TilesPlugin)

const tilesPlugin = viewer.getPlugin<TilesPlugin>('tiles')
```

### 2. 加载 3D Tiles 模型

```typescript
// 基础加载
const layerId = await tilesPlugin.createLayer({
  name: '建筑模型',
  url: 'https://example.com/tileset.json',
  show: true
})

// 高级配置
const layerId = await tilesPlugin.createLayer({
  name: '建筑模型',
  url: 'https://example.com/tileset.json',
  show: true,
  maximumScreenSpaceError: 16, // 屏幕空间误差
  maximumMemoryUsage: 512, // 最大内存使用（MB）
  skipLevelOfDetail: true, // 跳过细节层次
  shadows: true, // 投射阴影
  heightOffset: 10, // 高度偏移（米）
  offset: [100, 200, 0], // 位置偏移 [x, y, z]
  rotation: [0, 0, 45], // 旋转 [heading, pitch, roll] 度
  scale: 1.5, // 缩放比例
  onLoad: (tileset) => {
    console.log('模型加载完成', tileset)
  },
  onError: (error) => {
    console.error('模型加载失败', error)
  }
})
```

### 3. 模型操作

```typescript
const layer = tilesPlugin.getLayer(layerId)

// 显示/隐藏
layer.setShow(false)

// 飞行到模型
await layer.flyTo(2.0)

// 缩放到模型
await layer.zoomTo()

// 销毁图层
layer.destroy()
```

## 样式管理

### 1. 基础样式

```typescript
import { Color } from 'cesium'

// 创建时设置样式
const layerId = await tilesPlugin.createLayer({
  name: '建筑模型',
  url: 'https://example.com/tileset.json',
  style: {
    color: Color.RED,
    show: true
  }
})

// 动态修改样式
const layer = tilesPlugin.getLayer(layerId)
layer.setStyle({
  color: Color.BLUE.withAlpha(0.5)
})
```

### 2. 条件样式

```typescript
// 根据属性设置不同颜色
layer.setStyle({
  conditions: [
    ['${height} > 100', Color.RED],
    ['${height} > 50', Color.YELLOW],
    ['true', Color.GREEN]
  ]
})

// 根据类型显示/隐藏
layer.setStyle({
  show: '${type} === "residential"',
  color: Color.BLUE
})
```

### 3. 材质样式

```typescript
// 应用材质样式
tilesPlugin.applyMaterialStyle(layerId, {
  name: '玻璃材质',
  color: Color.CYAN,
  alpha: 0.6,
  metallic: 0.8,
  roughness: 0.2,
  emissive: Color.WHITE.withAlpha(0.1)
})
```

## 单体化功能

### 1. 分层（楼层单体化）

```typescript
const layer = tilesPlugin.getLayer(layerId)

// 创建楼层单体化
const monomerId = layer.createMonomer({
  name: '楼层单体化',
  type: 'floor',
  propertyName: 'floor', // 楼层属性字段名
  defaultColor: Color.GRAY,
  highlightColor: Color.YELLOW,
  selectedColor: Color.RED,
  enableClick: true,
  enableHover: true,
  onClick: (feature, floor) => {
    console.log(`点击了 ${floor} 楼`)
  },
  onHover: (feature, floor) => {
    if (feature) {
      console.log(`悬停在 ${floor} 楼`)
    }
  }
})

// 获取单体化实例
const monomer = layer.getMonomer(monomerId)

// 选中某一楼层
monomer.select(5) // 选中5楼

// 高亮某一楼层
monomer.highlight(3) // 高亮3楼

// 显示/隐藏楼层
monomer.show(5) // 只显示5楼
monomer.hide(3) // 隐藏3楼
monomer.showAll() // 显示所有楼层
monomer.hideAll() // 隐藏所有楼层

// 设置楼层颜色
monomer.setColor(5, Color.RED)

// 批量设置颜色
const colorMap = new Map([
  [1, Color.RED],
  [2, Color.ORANGE],
  [3, Color.YELLOW],
  [4, Color.GREEN],
  [5, Color.BLUE]
])
monomer.setColors(colorMap)

// 重置颜色
monomer.resetColors()

// 清除选中
monomer.clearSelection()

// 清除高亮
monomer.clearHighlight()
```

### 2. 分户（单元单体化）

```typescript
// 创建单元单体化
const monomerId = layer.createMonomer({
  name: '单元单体化',
  type: 'unit',
  propertyName: 'unit_id', // 单元ID属性字段名
  defaultColor: Color.WHITE,
  highlightColor: Color.YELLOW,
  selectedColor: Color.GREEN,
  enableClick: true,
  enableHover: true,
  // 预设单元颜色
  colorMap: new Map([
    ['A01', Color.RED],
    ['A02', Color.BLUE],
    ['B01', Color.GREEN],
    ['B02', Color.YELLOW]
  ]),
  onClick: (feature, unitId) => {
    console.log(`点击了单元：${unitId}`)
  }
})

const monomer = layer.getMonomer(monomerId)

// 选中某个单元
monomer.select('A01')

// 隐藏某些单元
monomer.hide('A02')
monomer.hide('B01')
```

### 3. 分楼栋

```typescript
// 创建楼栋单体化
const monomerId = layer.createMonomer({
  name: '楼栋单体化',
  type: 'building',
  propertyName: 'building_id',
  defaultColor: Color.GRAY,
  selectedColor: Color.ORANGE,
  enableClick: true
})

const monomer = layer.getMonomer(monomerId)

// 选中某栋楼
monomer.select('Building_1')
```

### 4. 自定义单体化

```typescript
// 根据任意属性进行单体化
const monomerId = layer.createMonomer({
  name: '按功能分类',
  type: 'custom',
  propertyName: 'function_type',
  colorMap: new Map([
    ['residential', Color.BLUE], // 住宅
    ['commercial', Color.RED], // 商业
    ['office', Color.GREEN], // 办公
    ['industrial', Color.GRAY] // 工业
  ]),
  enableClick: true,
  onClick: (feature, funcType) => {
    console.log(`功能类型：${funcType}`)
  }
})
```

## 高级功能

### 1. 要素拾取

```typescript
const layer = tilesPlugin.getLayer(layerId)

// 根据屏幕坐标拾取要素
const feature = layer.pick({ x: 100, y: 200 })

if (feature) {
  console.log('要素属性：', feature.getProperty('name'))
}

// 获取所有要素
const allFeatures = layer.getAllFeatures()

// 根据属性筛选要素
const features = layer.getFeaturesByProperty('floor', 5)
```

### 2. 批量操作

```typescript
// 批量显示符合条件的要素
tilesPlugin.batchOperation(layerId, {
  filters: [
    { propertyName: 'floor', operator: '>=', value: 5 },
    { propertyName: 'floor', operator: '<=', value: 10 }
  ],
  operation: 'show',
  value: true
})

// 批量隐藏
tilesPlugin.batchOperation(layerId, {
  filters: [{ propertyName: 'type', operator: '=', value: 'garage' }],
  operation: 'hide'
})

// 批量设置颜色
tilesPlugin.batchOperation(layerId, {
  filters: [{ propertyName: 'status', operator: 'in', value: ['sold', 'reserved'] }],
  operation: 'color',
  value: Color.RED
})
```

### 3. 多单体化组合使用

```typescript
const layer = tilesPlugin.getLayer(layerId)

// 同时创建楼层和单元单体化
const floorMonomerId = layer.createMonomer({
  name: '楼层',
  type: 'floor',
  propertyName: 'floor',
  defaultColor: Color.GRAY
})

const unitMonomerId = layer.createMonomer({
  name: '单元',
  type: 'unit',
  propertyName: 'unit_id',
  enableClick: true
})

// 先按楼层筛选，再按单元选择
const floorMonomer = layer.getMonomer(floorMonomerId)
const unitMonomer = layer.getMonomer(unitMonomerId)

// 只显示5楼
floorMonomer.hideAll()
floorMonomer.show(5)

// 在5楼中选择某个单元
unitMonomer.select('A01')
```

## 完整示例

```typescript
import { AutoViewer } from '@auto-cesium/core'
import { TilesPlugin, EventPlugin } from '@auto-cesium/plugins'
import { Color } from 'cesium'

// 初始化
const viewer = new AutoViewer(cesiumViewer)
viewer.use(EventPlugin)
viewer.use(TilesPlugin)

const tilesPlugin = viewer.getPlugin<TilesPlugin>('tiles')

// 加载建筑模型
const layerId = await tilesPlugin.createLayer({
  name: '住宅楼',
  url: 'https://example.com/building.json',
  heightOffset: 0,
  style: {
    color: Color.WHITE
  },
  onLoad: async (tileset) => {
    console.log('模型加载完成')

    // 飞到模型
    const layer = tilesPlugin.getLayer(layerId)
    await layer.flyTo(2.0)

    // 创建楼层单体化
    const floorMonomerId = layer.createMonomer({
      name: '楼层分层',
      type: 'floor',
      propertyName: 'floor',
      defaultColor: Color.fromCssColorString('#cccccc'),
      highlightColor: Color.YELLOW,
      selectedColor: Color.fromCssColorString('#ff6b6b'),
      enableClick: true,
      enableHover: true,
      // 设置楼层颜色映射
      colorMap: new Map([
        [1, Color.fromCssColorString('#e74c3c')],
        [2, Color.fromCssColorString('#e67e22')],
        [3, Color.fromCssColorString('#f39c12')],
        [4, Color.fromCssColorString('#2ecc71')],
        [5, Color.fromCssColorString('#3498db')]
      ]),
      onClick: (feature, floor) => {
        console.log(`选中了 ${floor} 楼`)
        // 显示楼层信息弹窗
        showFloorInfo(floor, feature)
      },
      onHover: (feature, floor) => {
        if (feature) {
          console.log(`悬停在 ${floor} 楼`)
        }
      }
    })

    // 创建单元单体化
    const unitMonomerId = layer.createMonomer({
      name: '单元分户',
      type: 'unit',
      propertyName: 'unit_id',
      enableClick: true,
      selectedColor: Color.fromCssColorString('#9b59b6'),
      onClick: (feature, unitId) => {
        console.log(`选中了单元：${unitId}`)
        // 显示单元详细信息
        showUnitDetails(unitId, feature)
      }
    })

    // 获取单体化实例
    const floorMonomer = layer.getMonomer(floorMonomerId)
    const unitMonomer = layer.getMonomer(unitMonomerId)

    // 默认显示所有楼层
    floorMonomer.showAll()
  },
  onError: (error) => {
    console.error('模型加载失败:', error)
  }
})

// 辅助函数：显示楼层信息
function showFloorInfo(floor: number, feature: any) {
  const properties = {
    floor,
    area: feature.getProperty('area'),
    units: feature.getProperty('unit_count'),
    type: feature.getProperty('type')
  }

  console.log('楼层信息:', properties)
  // 这里可以调用 PopupPlugin 显示弹窗
}

// 辅助函数：显示单元详情
function showUnitDetails(unitId: string, feature: any) {
  const details = {
    unitId,
    area: feature.getProperty('area'),
    rooms: feature.getProperty('rooms'),
    status: feature.getProperty('status'),
    price: feature.getProperty('price')
  }

  console.log('单元详情:', details)
  // 这里可以调用 PopupPlugin 显示弹窗
}
```

## API 参考

### TilesPlugin

#### 方法

- `createLayer(config: TilesLayerConfig): Promise<string>` - 创建图层
- `getLayer(id: string): TilesLayerInstance | undefined` - 获取图层
- `getLayerByName(name: string): TilesLayerInstance | undefined` - 根据名称获取图层
- `removeLayer(id: string): boolean` - 移除图层
- `removeAllLayers(): void` - 移除所有图层
- `batchOperation(layerId: string, operation: BatchOperationConfig): void` - 批量操作
- `applyMaterialStyle(layerId: string, config: MaterialStyleConfig): void` - 应用材质样式
- `getAllLayerIds(): string[]` - 获取所有图层ID
- `getLayerCount(): number` - 获取图层数量

### TilesLayerInstance

#### 属性

- `id: string` - 图层ID
- `name: string` - 图层名称
- `tileset: Cesium3DTileset` - Cesium 瓦片集对象
- `show: boolean` - 是否显示
- `monomers: Map<string, MonomerInstance>` - 单体化实例集合

#### 方法

- `setShow(show: boolean): void` - 设置显示状态
- `setStyle(style: Cesium3DTileStyle | TilesStyleOptions): void` - 设置样式
- `resetStyle(): void` - 重置样式
- `flyTo(duration?: number): Promise<void>` - 飞行到图层
- `zoomTo(duration?: number): Promise<void>` - 缩放到图层
- `createMonomer(config: MonomerConfig): string` - 创建单体化
- `getMonomer(id: string): MonomerInstance | undefined` - 获取单体化实例
- `removeMonomer(id: string): boolean` - 移除单体化
- `pick(windowPosition: {x, y}): Cesium3DTileFeature | undefined` - 拾取要素
- `getAllFeatures(): Cesium3DTileFeature[]` - 获取所有要素
- `getFeaturesByProperty(name, value): Cesium3DTileFeature[]` - 根据属性筛选要素

### MonomerInstance

#### 方法

- `select(propertyValue: string | number): void` - 选中
- `clearSelection(): void` - 清除选中
- `highlight(propertyValue: string | number): void` - 高亮
- `clearHighlight(): void` - 清除高亮
- `setColor(propertyValue, color): void` - 设置颜色
- `setColors(colorMap): void` - 批量设置颜色
- `resetColors(): void` - 重置颜色
- `show(propertyValue): void` - 显示
- `hide(propertyValue): void` - 隐藏
- `showAll(): void` - 显示所有
- `hideAll(): void` - 隐藏所有

## 最佳实践

1. **性能优化**
   - 使用合适的 `maximumScreenSpaceError` 值（默认16）
   - 限制 `maximumMemoryUsage`（默认512MB）
   - 启用 `skipLevelOfDetail` 跳过细节层次

2. **单体化使用**
   - 为不同目的创建多个单体化实例
   - 使用颜色映射预设常用颜色
   - 合理使用点击和悬停回调

3. **样式管理**
   - 使用条件表达式实现动态样式
   - 批量操作优于逐个操作
   - 及时重置不需要的样式

4. **内存管理**
   - 不使用的图层及时销毁
   - 清理不需要的单体化实例
   - 监控瓦片集内存使用
