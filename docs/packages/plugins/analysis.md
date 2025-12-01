# AnalysisPlugin

分析插件提供量算功能，支持空间距离、水平面积、高度差、坐标测量、贴地距离、贴地面积、三角测量、方位角等多种测量类型。

## 导入

```typescript
import { AnalysisPlugin, MeasureType } from '@ktd-cesium/plugins'
import type {
  AnalysisPluginOptions,
  MeasureOptions,
  MeasureResult,
  MeasureStyle,
  SnapConfig
} from '@ktd-cesium/plugins'
```

## 核心特性

- **多种测量类型**：空间距离、贴地距离、水平面积、贴地面积、高度差、坐标、三角测量、方位角
- **空间分析**：剖面分析、方量分析、通视分析、环视分析、最短路径、缓冲区、可视域、日照、叠面分析
- **顶点吸附**：支持吸附到已有实体的顶点
- **实时更新**：测量过程中实时显示测量值
- **GeoJSON 支持**：支持导入导出测量结果
- **样式自定义**：支持自定义测量线、点、标签样式
- **事件系统**：完整的测量事件回调
- **基于 Turf.js**：叠面分析使用 Turf.js 实现高性能空间计算

## 安装

```typescript
import { KtdViewer } from '@ktd-cesium/core'
import { AnalysisPlugin } from '@ktd-cesium/plugins'

const viewer = new KtdViewer(cesiumViewer)

const analysis = viewer.use(AnalysisPlugin, {
  style: {
    lineColor: '#ffff00',
    lineWidth: 2,
    pointColor: '#ff0000',
    pointSize: 8
  },
  snap: {
    enabled: true,
    radius: 10
  },
  showMidpoint: true,
  liveUpdate: true
} satisfies AnalysisPluginOptions)
```

## 配置选项

| 选项           | 类型                    | 默认值 | 说明               |
| -------------- | ----------------------- | ------ | ------------------ |
| `style`        | `Partial<MeasureStyle>` | -      | 默认样式配置       |
| `snap`         | `Partial<SnapConfig>`   | -      | 顶点吸附配置       |
| `showMidpoint` | `boolean`               | `true` | 是否显示中间点     |
| `liveUpdate`   | `boolean`               | `true` | 是否实时更新测量值 |

## 测量类型

### MeasureType 枚举

```typescript
enum MeasureType {
  // 基础量算
  DISTANCE = 'distance', // 空间距离测量
  SURFACE_DISTANCE = 'surfaceDistance', // 贴地距离测量
  AREA = 'area', // 水平面积测量
  SURFACE_AREA = 'surfaceArea', // 贴地面积测量
  HEIGHT = 'height', // 高度差测量
  COORDINATE = 'coordinate', // 坐标测量
  TRIANGLE = 'triangle', // 三角测量
  ANGLE = 'angle', // 方位角测量

  // 高级分析
  PROFILE = 'profile', // 剖面分析
  VOLUME = 'volume', // 方量分析
  VIEWSHED = 'viewshed', // 通视分析
  SKYLINE = 'skyline', // 环视分析（天际线）
  SHORTEST_PATH = 'shortestPath', // 最短路径分析
  BUFFER = 'buffer', // 缓冲区分析
  VIEWSHED_ANALYSIS = 'viewshedAnalysis', // 可视域分析
  SUNLIGHT = 'sunlight', // 日照分析
  OVERLAY = 'overlay' // 叠面分析
}
```

## API

### startMeasure(options)

开始量算。

**类型签名**

```typescript
startMeasure(options: MeasureOptions): this
```

**参数**

- `options.type`: 量算类型
- `options.style`: 样式覆盖（可选）
- `options.onComplete`: 完成回调（可选）
- `options.onUpdate`: 更新回调（可选）

**示例**

```typescript
// 空间距离测量
analysis.startMeasure({
  type: 'distance',
  onComplete: (result) => {
    console.log('测量完成:', result.value, '米')
  }
})

// 水平面积测量
analysis.startMeasure({
  type: 'area',
  style: {
    fillColor: '#00ff00',
    fillOpacity: 0.3
  },
  onComplete: (result) => {
    console.log('面积:', result.value, '平方米')
  }
})
```

### stopMeasure()

停止当前量算。

```typescript
analysis.stopMeasure()
```

### clearMeasure(id?)

清除量算结果。

```typescript
// 清除所有
analysis.clearMeasure()

// 清除指定 ID
analysis.clearMeasure('measure-id-1')
```

### getResult(id)

获取量算结果。

```typescript
const result = analysis.getResult('measure-id-1')
if (result) {
  console.log('测量值:', result.value)
  console.log('位置:', result.positions)
}
```

### getAllResults()

获取所有量算结果。

```typescript
const results = analysis.getAllResults()
results.forEach((result, id) => {
  console.log(`${id}: ${result.value}`)
})
```

### on(event, callback)

监听测量事件。

```typescript
analysis.on('measure:start', (result) => {
  console.log('开始测量')
})

analysis.on('measure:complete', (result) => {
  console.log('测量完成:', result)
})

analysis.on('measure:update', (result) => {
  console.log('测量更新:', result.value)
})
```

### off(event, callback)

移除事件监听。

```typescript
const handler = (result) => console.log(result)
analysis.on('measure:complete', handler)
analysis.off('measure:complete', handler)
```

## 使用场景

### 场景 1：空间距离测量

```typescript
analysis.startMeasure({
  type: 'distance',
  onComplete: (result) => {
    const distance = result.value as number
    console.log(`距离: ${distance.toFixed(2)} 米`)

    // 显示结果
    alert(`测量距离: ${(distance / 1000).toFixed(2)} 公里`)
  }
})

// 用户在地图上点击两个点
// 测量完成后会触发 onComplete 回调
```

### 场景 2：贴地距离测量

```typescript
analysis.startMeasure({
  type: 'surfaceDistance',
  style: {
    lineColor: '#00ff00',
    lineWidth: 3
  },
  onUpdate: (result) => {
    // 实时更新显示
    document.getElementById('distance-display')!.textContent = `${((result.value as number) / 1000).toFixed(2)} 公里`
  }
})
```

### 场景 3：水平面积测量

```typescript
analysis.startMeasure({
  type: 'area',
  style: {
    fillColor: '#3388ff',
    fillOpacity: 0.4,
    lineColor: '#ffffff',
    lineWidth: 2
  },
  onComplete: (result) => {
    const area = result.value as number
    console.log(`面积: ${(area / 1000000).toFixed(2)} 平方公里`)
  }
})

// 用户在地图上点击多个点形成多边形
// 双击完成测量
```

### 场景 4：贴地面积测量

```typescript
analysis.startMeasure({
  type: 'surfaceArea',
  onComplete: (result) => {
    const area = result.value as number
    // 考虑地形起伏的实际面积
    console.log(`贴地面积: ${area.toFixed(2)} 平方米`)
  }
})
```

### 场景 5：高度差测量

```typescript
analysis.startMeasure({
  type: 'height',
  onComplete: (result) => {
    const heightDiff = result.value as number
    console.log(`高度差: ${heightDiff.toFixed(2)} 米`)
  }
})

// 用户点击两个点，测量它们之间的高度差
```

### 场景 6：坐标测量

```typescript
analysis.startMeasure({
  type: 'coordinate',
  onComplete: (result) => {
    const coord = result.value as { longitude: number; latitude: number; height: number }
    console.log(`经度: ${coord.longitude}`)
    console.log(`纬度: ${coord.latitude}`)
    console.log(`高度: ${coord.height} 米`)
  }
})

// 用户点击一个点，获取该点的坐标
```

### 场景 7：三角测量

```typescript
analysis.startMeasure({
  type: 'triangle',
  onComplete: (result) => {
    const triangle = result.value as {
      area: number
      perimeter: number
      angles: number[]
      sides: number[]
    }
    console.log('面积:', triangle.area)
    console.log('周长:', triangle.perimeter)
    console.log('角度:', triangle.angles)
    console.log('边长:', triangle.sides)
  }
})

// 用户点击三个点形成三角形
```

### 场景 8：方位角测量

```typescript
analysis.startMeasure({
  type: 'angle',
  onComplete: (result) => {
    const angle = result.value as number
    console.log(`方位角: ${angle.toFixed(2)}°`)
  }
})

// 用户点击两个点，测量从第一点到第二点的方位角
```

### 场景 9：顶点吸附

```typescript
const analysis = viewer.use(AnalysisPlugin, {
  snap: {
    enabled: true,
    radius: 15, // 吸附半径（像素）
    entities: [entity1, entity2], // 指定要吸附的实体
    dataSources: [graphics.getDataSource()] // 或指定数据源
  }
})

// 测量时会自动吸附到附近实体的顶点
```

### 场景 10：事件监听

```typescript
// 监听所有测量事件
analysis.on('measure:start', (result) => {
  console.log('开始测量:', result.type)
})

analysis.on('measure:pointAdd', (result) => {
  console.log('添加点:', result.positions.length)
})

analysis.on('measure:update', (result) => {
  console.log('测量值更新:', result.value)
})

analysis.on('measure:complete', (result) => {
  console.log('测量完成:', result)
  // 保存结果
  saveMeasureResult(result)
})

analysis.on('measure:snap', (result) => {
  console.log('吸附到顶点')
})
```

### 场景 11：批量测量管理

```typescript
// 开始多个测量
const measure1 = analysis.startMeasure({ type: 'distance' })
const measure2 = analysis.startMeasure({ type: 'area' })

// 获取所有结果
const allResults = analysis.getAllResults()
console.log(`共 ${allResults.size} 个测量结果`)

// 清除所有
analysis.clearMeasure()

// 清除指定测量
analysis.clearMeasure('measure-id-1')
```

### 场景 12：自定义样式

```typescript
analysis.startMeasure({
  type: 'distance',
  style: {
    lineColor: '#ff0000',
    lineWidth: 3,
    pointColor: '#00ff00',
    pointSize: 10,
    labelFont: '16px Arial',
    labelColor: '#ffffff',
    labelBackgroundColor: '#000000',
    labelBackgroundOpacity: 0.8,
    labelPixelOffset: { x: 0, y: -30 }
  }
})
```

## 样式配置

### MeasureStyle

```typescript
interface MeasureStyle {
  lineColor?: string // 线颜色（默认 '#ffff00'）
  lineWidth?: number // 线宽（默认 2）
  pointColor?: string // 点颜色（默认 '#ff0000'）
  pointSize?: number // 点大小（默认 8）
  fillColor?: string // 填充颜色（默认 '#00ff00'）
  fillOpacity?: number // 填充透明度（默认 0.3）
  labelFont?: string // 标签字体（默认 '14px sans-serif'）
  labelColor?: string // 标签颜色（默认 '#ffffff'）
  labelBackgroundColor?: string // 标签背景色（默认 '#000000'）
  labelBackgroundOpacity?: number // 标签背景透明度（默认 0.7）
  labelPixelOffset?: { x: number; y: number } // 标签偏移（默认 { x: 0, y: -20 }）
  auxiliaryLineColor?: string // 辅助线颜色（默认 '#ffffff'）
  auxiliaryLineWidth?: number // 辅助线宽度（默认 1）
  auxiliaryLineDashLength?: number // 辅助线虚线长度（默认 10）
}
```

## 测量结果

### MeasureResult

```typescript
interface MeasureResult {
  type: MeasureTypeString // 测量类型
  value: number | string | Record<string, unknown> // 测量值
  positions: Cesium.Cartesian3[] // 位置数组
  entity?: Cesium.Entity // 关联的实体
  text?: string // 格式化的文本
}
```

**测量值类型**：

- `distance` / `surfaceDistance`: `number`（米）
- `area` / `surfaceArea`: `number`（平方米）
- `height`: `number`（米）
- `coordinate`: `{ longitude: number; latitude: number; height: number }`
- `triangle`: `{ area: number; perimeter: number; angles: number[]; sides: number[] }`
- `angle`: `number`（度）

## 注意事项

1. **依赖 GraphicsPlugin**：
   - AnalysisPlugin 需要 GraphicsPlugin 支持
   - 如果 GraphicsPlugin 存在，会共享数据源

2. **测量操作**：
   - 空间距离：点击两个点
   - 面积测量：点击多个点，双击完成
   - 坐标测量：点击一个点
   - 三角测量：点击三个点
   - 方位角：点击两个点

3. **顶点吸附**：
   - 需要在配置中启用 `snap.enabled: true`
   - 可以指定要吸附的实体或数据源
   - 吸附半径单位为像素

4. **实时更新**：
   - `liveUpdate: true` 时，测量过程中会实时更新显示
   - 可能会影响性能，大量测量时建议关闭

5. **事件清理**：
   - 使用 `off` 方法移除事件监听，避免内存泄漏
   - 插件销毁时会自动清理所有监听器

6. **结果管理**：
   - 测量结果会保存在插件内部
   - 使用 `getResult` 或 `getAllResults` 获取结果
   - 使用 `clearMeasure` 清除结果

## 叠面分析 (Overlay Analysis)

叠面分析基于 Turf.js 实现，提供强大的多边形空间分析功能。

### 支持的分析类型

```typescript
enum OverlayType {
  INTERSECT = 'intersect', // 相交（求交集）
  UNION = 'union', // 合并（求并集）
  DIFFERENCE = 'difference', // 差集（A - B）
  XOR = 'xor', // 对称差（互斥部分）
  CONTAINS = 'contains', // 包含判断
  WITHIN = 'within', // 被包含判断
  OVERLAPS = 'overlaps', // 重叠判断
  TOUCHES = 'touches' // 相邻判断
}
```

### 基本用法

```typescript
import { AnalysisPlugin, OverlayType } from '@ktd-cesium/plugins'

// 1. 相交分析（求两个多边形的交集）
analysis.startMeasure({
  type: 'overlay',
  overlayOptions: {
    overlayType: OverlayType.INTERSECT,
    resultFillColor: '#ff0000',
    resultFillOpacity: 0.5,
    showAreaLabel: true,
    showOverlapRatio: true
  },
  onComplete: (result) => {
    const overlayResult = result.value as OverlayResult
    console.log('交集面积:', overlayResult.resultArea)
    console.log('重叠率:', overlayResult.overlapRatio)
  }
})

// 用户绘制第一个多边形（至少3个点，右键完成）
// 然后绘制第二个多边形
// 分析结果会自动显示
```

### 使用已有多边形进行分析

```typescript
// 方式1：使用坐标数组
const polygon1 = [
  Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0),
  Cesium.Cartesian3.fromDegrees(116.5, 39.9, 0),
  Cesium.Cartesian3.fromDegrees(116.5, 40.0, 0),
  Cesium.Cartesian3.fromDegrees(116.4, 40.0, 0)
]

analysis.startMeasure({
  type: 'overlay',
  overlayOptions: {
    overlayType: 'union',
    secondPolygon: polygon1
  }
})
// 只需绘制第一个多边形，第二个多边形已提供

// 方式2：使用已有实体
const existingEntity = viewer.entities.getById('polygon-entity-id')
analysis.startMeasure({
  type: 'overlay',
  overlayOptions: {
    overlayType: 'difference',
    secondPolygonEntity: existingEntity
  }
})
```

### 分析类型详解

#### 1. 相交分析 (Intersect)

求两个多边形的交集区域。

```typescript
analysis.startMeasure({
  type: 'overlay',
  overlayOptions: {
    overlayType: OverlayType.INTERSECT,
    showOverlapRatio: true
  },
  onComplete: (result) => {
    const { resultArea, overlapRatio } = result.value as OverlayResult
    console.log(`交集面积: ${resultArea.toFixed(2)} m²`)
    console.log(`重叠率: ${(overlapRatio! * 100).toFixed(2)}%`)
  }
})
```

**应用场景**：

- 计算两个地块的重叠区域
- 分析建筑物与规划区域的交集
- 确定影响范围的重叠部分

#### 2. 合并分析 (Union)

求两个多边形的并集区域。

```typescript
analysis.startMeasure({
  type: 'overlay',
  overlayOptions: {
    overlayType: OverlayType.UNION,
    resultFillColor: '#00ff00',
    showOriginalPolygons: false
  },
  onComplete: (result) => {
    const { resultArea } = result.value as OverlayResult
    console.log(`合并后总面积: ${resultArea.toFixed(2)} m²`)
  }
})
```

**应用场景**：

- 合并多个相邻地块
- 计算覆盖范围的总面积
- 规划区域整合

#### 3. 差集分析 (Difference)

从第一个多边形中减去第二个多边形。

```typescript
analysis.startMeasure({
  type: 'overlay',
  overlayOptions: {
    overlayType: OverlayType.DIFFERENCE,
    resultFillColor: '#0000ff'
  },
  onComplete: (result) => {
    const { firstArea, secondArea, resultArea } = result.value as OverlayResult
    console.log(`原面积: ${firstArea.toFixed(2)} m²`)
    console.log(`减去面积: ${secondArea.toFixed(2)} m²`)
    console.log(`剩余面积: ${resultArea.toFixed(2)} m²`)
  }
})
```

**应用场景**：

- 计算去除某区域后的剩余面积
- 土地扣除计算
- 规划区域调整

#### 4. 对称差分析 (XOR)

求两个多边形互相排斥的部分（不包括交集）。

```typescript
analysis.startMeasure({
  type: 'overlay',
  overlayOptions: {
    overlayType: OverlayType.XOR,
    resultFillColor: '#ff00ff'
  },
  onComplete: (result) => {
    const { resultArea } = result.value as OverlayResult
    console.log(`独占区域面积: ${resultArea.toFixed(2)} m²`)
  }
})
```

**应用场景**：

- 找出两个区域的差异部分
- 对比分析
- 冲突区域检测

#### 5. 包含判断 (Contains)

判断第一个多边形是否完全包含第二个多边形。

```typescript
analysis.startMeasure({
  type: 'overlay',
  overlayOptions: {
    overlayType: OverlayType.CONTAINS
  },
  onComplete: (result) => {
    const { booleanResult } = result.value as OverlayResult
    console.log(`是否包含: ${booleanResult ? '是' : '否'}`)
  }
})
```

**应用场景**：

- 检查建筑物是否在地块内
- 验证规划范围
- 空间包含关系检测

#### 6. 被包含判断 (Within)

判断第一个多边形是否被第二个多边形完全包含。

```typescript
analysis.startMeasure({
  type: 'overlay',
  overlayOptions: {
    overlayType: OverlayType.WITHIN
  },
  onComplete: (result) => {
    const { booleanResult } = result.value as OverlayResult
    console.log(`是否被包含: ${booleanResult ? '是' : '否'}`)
  }
})
```

#### 7. 重叠判断 (Overlaps)

判断两个多边形是否有重叠（不是完全包含）。

```typescript
analysis.startMeasure({
  type: 'overlay',
  overlayOptions: {
    overlayType: OverlayType.OVERLAPS
  },
  onComplete: (result) => {
    const { booleanResult } = result.value as OverlayResult
    console.log(`是否重叠: ${booleanResult ? '是' : '否'}`)
  }
})
```

**应用场景**：

- 检测区域冲突
- 重叠检测
- 碰撞检测

#### 8. 相邻判断 (Touches)

判断两个多边形是否相邻（有共同边界但不重叠）。

```typescript
analysis.startMeasure({
  type: 'overlay',
  overlayOptions: {
    overlayType: OverlayType.TOUCHES
  },
  onComplete: (result) => {
    const { booleanResult } = result.value as OverlayResult
    console.log(`是否相邻: ${booleanResult ? '是' : '否'}`)
  }
})
```

**应用场景**：

- 检查相邻地块
- 边界检测
- 邻接关系分析

### 样式配置

```typescript
interface OverlayOptions {
  overlayType?: OverlayType // 分析类型（默认 'intersect'）
  secondPolygon?: Cesium.Cartesian3[] // 第二个多边形坐标
  secondPolygonEntity?: Cesium.Entity // 第二个多边形实体

  // 结果样式
  resultFillColor?: string // 结果填充色（默认 '#ff0000'）
  resultFillOpacity?: number // 结果透明度（默认 0.5）
  resultOutlineColor?: string // 结果边框色（默认 '#ff0000'）
  resultOutlineWidth?: number // 结果边框宽（默认 3）

  // 原始多边形样式
  showOriginalPolygons?: boolean // 显示原始多边形（默认 true）
  firstPolygonColor?: string // 第一个多边形色（默认 '#0000ff'）
  secondPolygonColor?: string // 第二个多边形色（默认 '#00ff00'）

  // 标签配置
  showAreaLabel?: boolean // 显示面积标签（默认 true）
  showOverlapRatio?: boolean // 显示重叠率（默认 true）

  tolerance?: number // 容差（默认 0.001 米）
}
```

### 分析结果

```typescript
interface OverlayResult {
  type: OverlayType // 分析类型
  firstPolygon: Cesium.Cartesian3[] // 第一个多边形
  secondPolygon: Cesium.Cartesian3[] // 第二个多边形
  resultPolygon?: Cesium.Cartesian3[] // 结果多边形
  booleanResult?: boolean // 布尔判断结果
  firstArea: number // 第一个多边形面积（m²）
  secondArea: number // 第二个多边形面积（m²）
  resultArea: number // 结果面积（m²）
  overlapRatio?: number // 重叠率（0-1）
  geoJSON?: {
    // GeoJSON 格式结果
    first: GeoJSON.Feature<GeoJSON.Polygon>
    second: GeoJSON.Feature<GeoJSON.Polygon>
    result?: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>
  }
}
```

### 完整示例

```typescript
import { KtdViewer } from '@ktd-cesium/core'
import { AnalysisPlugin, OverlayType } from '@ktd-cesium/plugins'
import type { OverlayResult } from '@ktd-cesium/plugins'

const viewer = new KtdViewer(cesiumViewer)
const analysis = viewer.use(AnalysisPlugin)

// 场景1：计算两个地块的重叠区域
function analyzeOverlap() {
  analysis.startMeasure({
    type: 'overlay',
    overlayOptions: {
      overlayType: OverlayType.INTERSECT,
      resultFillColor: '#ff0000',
      resultFillOpacity: 0.6,
      showAreaLabel: true,
      showOverlapRatio: true,
      firstPolygonColor: '#0000ff',
      secondPolygonColor: '#00ff00'
    },
    onComplete: (result) => {
      const overlayResult = result.value as OverlayResult

      console.log('=== 叠面分析结果 ===')
      console.log(`多边形1面积: ${overlayResult.firstArea.toFixed(2)} m²`)
      console.log(`多边形2面积: ${overlayResult.secondArea.toFixed(2)} m²`)
      console.log(`交集面积: ${overlayResult.resultArea.toFixed(2)} m²`)

      if (overlayResult.overlapRatio) {
        console.log(`重叠率: ${(overlayResult.overlapRatio * 100).toFixed(2)}%`)
      }

      // 导出 GeoJSON
      if (overlayResult.geoJSON) {
        console.log('GeoJSON:', JSON.stringify(overlayResult.geoJSON.result))
      }
    }
  })
}

// 场景2：使用已有多边形进行差集分析
function analyzeDifference(existingPolygon: Cesium.Cartesian3[]) {
  analysis.startMeasure({
    type: 'overlay',
    overlayOptions: {
      overlayType: OverlayType.DIFFERENCE,
      secondPolygon: existingPolygon,
      resultFillColor: '#0000ff',
      showOriginalPolygons: true
    },
    onComplete: (result) => {
      const overlayResult = result.value as OverlayResult
      console.log(`原始面积: ${overlayResult.firstArea.toFixed(2)} m²`)
      console.log(`扣除面积: ${overlayResult.secondArea.toFixed(2)} m²`)
      console.log(`剩余面积: ${overlayResult.resultArea.toFixed(2)} m²`)
    }
  })
}

// 场景3：检查建筑物是否在地块内
function checkContainment(buildingEntity: Cesium.Entity) {
  analysis.startMeasure({
    type: 'overlay',
    overlayOptions: {
      overlayType: OverlayType.CONTAINS,
      secondPolygonEntity: buildingEntity
    },
    onComplete: (result) => {
      const overlayResult = result.value as OverlayResult
      if (overlayResult.booleanResult) {
        console.log('✓ 建筑物在地块内')
      } else {
        console.log('✗ 建筑物超出地块范围')
      }
    }
  })
}

// 场景4：批量分析多个区域
async function batchAnalysis(polygons: Cesium.Cartesian3[][]) {
  const results: OverlayResult[] = []

  for (let i = 0; i < polygons.length - 1; i++) {
    const result = await new Promise<OverlayResult>((resolve) => {
      analysis.startMeasure({
        type: 'overlay',
        overlayOptions: {
          overlayType: OverlayType.INTERSECT,
          secondPolygon: polygons[i + 1]
        },
        onComplete: (result) => {
          resolve(result.value as OverlayResult)
        }
      })

      // 模拟绘制第一个多边形
      // 实际使用中这里应该是用户交互
    })

    results.push(result)
  }

  console.log(`完成 ${results.length} 个分析`)
  return results
}
```

### 注意事项

1. **绘制流程**：
   - 先绘制第一个多边形（至少3个点）
   - 右键或双击完成第一个多边形
   - 继续绘制第二个多边形
   - 右键或双击完成，自动执行分析

2. **预定义多边形**：
   - 使用 `secondPolygon` 或 `secondPolygonEntity` 时只需绘制第一个多边形

3. **MultiPolygon 支持**：
   - 对称差和某些复杂操作可能产生 MultiPolygon 结果
   - 系统会自动显示所有部分

4. **性能考虑**：
   - 复杂多边形（上千个顶点）可能影响性能
   - 建议使用合理的采样精度

5. **坐标系统**：
   - 所有计算基于 WGS84 坐标系
   - 使用 Turf.js 进行高精度球面计算

6. **错误处理**：
   - 自相交多边形可能导致分析失败
   - 监听 `onComplete` 事件中的 `error` 参数

AnalysisPlugin 提供了完整的量算和空间分析功能，支持多种测量类型和丰富的自定义选项，适用于各种测量和分析场景。
