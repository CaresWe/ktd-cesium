# TilesPlugin 高级分析功能文档

本文档详细介绍 TilesPlugin 的所有高级分析功能及其使用方法。

## 目录

1. [平面剖切](#1-平面剖切)
2. [盒子裁剪](#2-盒子裁剪)
3. [模型裁剪](#3-模型裁剪)
4. [淹没分析](#4-淹没分析)
5. [模型压平](#5-模型压平)
6. [限高分析](#6-限高分析)
7. [热力图](#7-热力图)
8. [颜色校正](#8-颜色校正)
9. [地震分析](#9-地震分析)

---

## 1. 平面剖切

平面剖切功能支持对 BIM 模型和倾斜摄影模型进行多平面剖切。

### 基本用法

```typescript
// 获取图层
const layer = tilesPlugin.getLayer(layerId)

// 启用剖切
layer.enableClipping({
  planes: [
    {
      normal: [1, 0, 0],  // X轴正方向
      distance: 100,       // 距离原点100米
      enabled: true
    },
    {
      normal: [0, 1, 0],  // Y轴正方向
      distance: 50
    }
  ],
  enabled: true,
  unionClippingRegions: false,  // false: 相交模式, true: 联合模式
  edgeColor: Color.RED,
  edgeWidth: 2.0
})

// 更新剖切配置
layer.updateClipping({
  edgeColor: Color.BLUE,
  edgeWidth: 3.0
})

// 添加单个剖切平面
layer.addClippingPlane({
  normal: [0, 0, 1],  // Z轴正方向
  distance: 200
})

// 移除剖切平面（按索引）
layer.removeClippingPlane(0)

// 禁用剖切
layer.disableClipping()
```

### 配置参数

- `planes`: 剖切平面数组
  - `normal`: 平面法向量 [x, y, z]
  - `distance`: 平面到原点的距离
  - `enabled`: 是否启用该平面
- `enabled`: 是否启用整个剖切功能
- `unionClippingRegions`: 剖切模式
  - `false`: 所有平面相交（显示所有平面内部的共同区域）
  - `true`: 所有平面联合（显示任意平面内部的区域）
- `edgeColor`: 剖切边缘颜色
- `edgeWidth`: 剖切边缘宽度（像素）

---

## 2. 盒子裁剪

使用矩形盒子对模型进行裁剪。

### 基本用法

```typescript
// 启用盒子裁剪
layer.enableBoxClip({
  center: [116.4074, 39.9042, 100],  // [经度, 纬度, 高度]
  dimensions: [500, 500, 200],        // [宽度, 长度, 高度] 单位：米
  rotation: [0, 0, 0],                // [heading, pitch, roll] 单位：度
  mode: 'inside',                     // 'inside': 保留内部, 'outside': 保留外部
  showBox: true,                      // 是否显示盒子边框
  boxColor: Color.YELLOW
})

// 更新盒子裁剪
layer.updateBoxClip({
  dimensions: [600, 600, 300],
  rotation: [45, 0, 0]
})

// 禁用盒子裁剪
layer.disableBoxClip()
```

### 使用场景

- BIM 模型的楼层剖切
- 倾斜摄影的区域裁剪
- 建筑物内部结构展示

---

## 3. 模型裁剪

使用 GraphicsPlugin 绘制的几何体对模型进行裁剪。

### 基本用法

```typescript
// 1. 使用 GraphicsPlugin 绘制裁剪区域
const graphicsPlugin = viewer.getPlugin('graphics')
const entityId = graphicsPlugin.drawPolygon({
  positions: [
    [116.40, 39.90, 0],
    [116.41, 39.90, 0],
    [116.41, 39.91, 0],
    [116.40, 39.91, 0]
  ]
})

// 2. 应用模型裁剪
layer.enableModelClip({
  entityId: entityId,
  mode: 'inside',      // 'inside': 保留内部, 'outside': 保留外部
  showModel: true      // 是否显示裁剪模型
})

// 禁用模型裁剪
layer.disableModelClip()
```

### 支持的几何类型

- **多边形（Polygon）**: 根据多边形边界创建垂直剖切平面
- **矩形（Rectangle）**: 根据矩形四条边创建剖切平面
- **圆形（Ellipse）**: 用32边正多边形近似，创建剖切平面

---

## 4. 淹没分析

模拟水位上涨过程，分析淹没区域。

### 基本用法

```typescript
// 启用淹没分析
layer.enableFloodAnalysis({
  minHeight: 0,          // 最小水位（米）
  maxHeight: 100,        // 最大水位（米）
  currentHeight: 50,     // 当前水位（米）
  waterColor: Color.fromCssColorString('rgba(0, 150, 255, 0.6)'),
  waterAlpha: 0.6,
  showWaterSurface: true,
  floodSpeed: 2,         // 淹没速度（米/秒）
  onHeightChange: (height) => {
    console.log('当前水位:', height)
  }
})

// 更新水位高度
layer.updateFloodHeight(75)

// 开始淹没动画
layer.startFloodAnimation()

// 停止淹没动画
layer.stopFloodAnimation()

// 禁用淹没分析
layer.disableFloodAnalysis()
```

### 应用场景

- 洪水淹没模拟
- 水库蓄水分析
- 海平面上升影响评估

---

## 5. 模型压平

在指定区域对模型进行压平处理。

### 基本用法

```typescript
// 启用压平
layer.enableFlatten({
  positions: [
    [116.40, 39.90, 0],
    [116.41, 39.90, 0],
    [116.41, 39.91, 0],
    [116.40, 39.91, 0]
  ],
  height: 50,              // 压平高度（米）
  showBoundary: true,      // 是否显示边界
  boundaryColor: Color.RED
})

// 更新压平高度
layer.updateFlattenHeight(60)

// 禁用压平
layer.disableFlatten()
```

### 使用场景

- 地形平整模拟
- 建筑基础开挖分析
- 场地平整规划

---

## 6. 限高分析

分析超过限定高度的建筑或区域。

### 基本用法

```typescript
// 启用限高分析
layer.enableHeightLimit({
  limitHeight: 100,        // 限制高度（米）
  exceedColor: Color.fromCssColorString('rgba(255, 0, 0, 0.8)'),
  normalColor: Color.fromCssColorString('rgba(255, 255, 255, 1.0)'),
  showOnlyExceeded: false, // false: 显示所有, true: 仅显示超高部分
  heightProperty: 'Height' // 高度属性名称
})

// 更新限制高度
layer.updateHeightLimit(120)

// 禁用限高分析
layer.disableHeightLimit()
```

### 应用场景

- 建筑限高规划
- 机场净空分析
- 城市天际线控制

---

## 7. 热力图

根据属性值或数据点生成热力图效果。

### 基于属性的热力图

```typescript
// 启用热力图
layer.enableHeatmap({
  propertyName: 'Temperature',  // 属性名称
  minValue: 0,                  // 最小值
  maxValue: 100,                // 最大值
  gradient: [
    { stop: 0.0, color: Color.BLUE },   // 蓝色（低值）
    { stop: 0.33, color: Color.GREEN },
    { stop: 0.66, color: Color.YELLOW },
    { stop: 1.0, color: Color.RED }     // 红色（高值）
  ]
})

// 禁用热力图
layer.disableHeatmap()
```

### 基于数据点的热力图

```typescript
// 使用数据点
layer.enableHeatmap({
  dataPoints: [
    { position: [116.40, 39.90, 50], value: 80 },
    { position: [116.41, 39.91, 60], value: 65 },
    { position: [116.42, 39.92, 45], value: 90 }
  ],
  minValue: 0,
  maxValue: 100,
  radius: 50,      // 半径（像素）
  blur: 15         // 模糊度
})

// 更新热力图数据
layer.updateHeatmapData([
  { position: [116.40, 39.90, 50], value: 85 },
  { position: [116.41, 39.91, 60], value: 70 }
])
```

### 应用场景

- 温度分布分析
- 人口密度展示
- 污染浓度可视化
- 建筑能耗分析

---

## 8. 颜色校正

调整模型的颜色属性（亮度、对比度、饱和度等）。

### 基本用法

```typescript
// 启用颜色校正
layer.enableColorCorrection({
  brightness: 0.2,    // 亮度 [-1, 1]
  contrast: 0.1,      // 对比度 [-1, 1]
  saturation: 0.5,    // 饱和度 [-1, 1]
  hue: 10,            // 色相偏移 [-180, 180] 度
  gamma: 1.2,         // Gamma 值 [0.1, 3.0]
  temperature: 0.1,   // 色温 [-1, 1]
  tint: -0.1          // 色调 [-1, 1]
})

// 更新颜色校正
layer.updateColorCorrection({
  brightness: 0.3,
  contrast: 0.2
})

// 禁用颜色校正
layer.disableColorCorrection()
```

### 参数说明

- `brightness`: 亮度调整，正值变亮，负值变暗
- `contrast`: 对比度调整，正值增强，负值减弱
- `saturation`: 饱和度调整，正值更鲜艳，负值更灰
- `hue`: 色相旋转，改变整体色调
- `gamma`: Gamma 校正，影响中间调
- `temperature`: 色温调整，正值偏暖色，负值偏冷色
- `tint`: 色调调整，正值偏品红，负值偏绿色

### 使用场景

- 倾斜摄影色彩统一
- BIM 模型视觉优化
- 不同光照条件下的模型展示

---

## 9. 地震分析

模拟地震波传播效果，显示受影响区域。

### 基本用法

```typescript
// 启用地震分析
layer.enableSeismicAnalysis({
  epicenter: [116.4074, 39.9042],  // 震中位置 [经度, 纬度]
  magnitude: 7.0,                   // 震级
  depth: 10,                        // 震源深度（千米）
  waveSpeed: 3000,                  // 地震波速度（米/秒）
  enableAnimation: true,            // 是否启用动画
  animationDuration: 10000,         // 动画持续时间（毫秒）
  amplitudeFactor: 1.0,             // 振幅系数
  frequencyFactor: 1.0,             // 频率系数
  effectRadius: 50000,              // 影响半径（米）
  gradient: [
    { stop: 0.0, color: Color.WHITE },   // 白色（无影响）
    { stop: 0.33, color: Color.YELLOW }, // 黄色
    { stop: 0.66, color: Color.ORANGE }, // 橙色
    { stop: 1.0, color: Color.RED }      // 红色（最强）
  ],
  onAnimationStart: () => {
    console.log('地震动画开始')
  },
  onAnimationUpdate: (progress) => {
    console.log('动画进度:', progress)
  },
  onAnimationEnd: () => {
    console.log('地震动画结束')
  }
})

// 开始地震动画
layer.startSeismicAnimation()

// 停止地震动画
layer.stopSeismicAnimation()

// 禁用地震分析
layer.disableSeismicAnalysis()
```

### 应用场景

- 地震影响模拟
- 建筑抗震分析
- 应急预案演练
- 科普教育展示

---

## 综合示例

### 组合使用多个功能

```typescript
// 1. 创建图层
const layerId = await tilesPlugin.createLayer({
  name: 'Building Model',
  url: 'path/to/tileset.json'
})

const layer = tilesPlugin.getLayer(layerId)!

// 2. 应用颜色校正优化模型外观
layer.enableColorCorrection({
  brightness: 0.1,
  contrast: 0.15,
  saturation: 0.2
})

// 3. 使用盒子裁剪展示内部结构
layer.enableBoxClip({
  center: [116.4074, 39.9042, 50],
  dimensions: [300, 300, 100],
  mode: 'inside',
  showBox: true
})

// 4. 应用限高分析
layer.enableHeightLimit({
  limitHeight: 80,
  exceedColor: Color.RED,
  showOnlyExceeded: false
})

// 5. 淹没分析
layer.enableFloodAnalysis({
  minHeight: 0,
  maxHeight: 50,
  currentHeight: 0,
  floodSpeed: 1
})

// 6. 开始淹没动画
setTimeout(() => {
  layer.startFloodAnimation()
}, 2000)
```

### 清理和销毁

```typescript
// 禁用所有分析功能
layer.disableClipping()
layer.disableBoxClip()
layer.disableModelClip()
layer.disableFloodAnalysis()
layer.disableFlatten()
layer.disableHeightLimit()
layer.disableHeatmap()
layer.disableColorCorrection()
layer.disableSeismicAnalysis()

// 销毁图层（会自动清理所有功能）
layer.destroy()
```

---

## 注意事项

1. **性能考虑**
   - 剖切平面数量不宜过多（建议 ≤ 8 个）
   - 热力图数据点不宜过密
   - 动画功能会持续占用 CPU 资源

2. **兼容性**
   - 部分功能需要 Cesium 特定版本支持
   - 颜色校正需要 Cesium 1.97+ 的 CustomShader API
   - 建议使用最新版本的 Cesium

3. **坐标系统**
   - 所有位置坐标使用 WGS84 经纬度
   - 高度为相对于 WGS84 椭球的高度
   - 距离和尺寸单位为米

4. **资源管理**
   - 使用完毕后及时禁用不需要的功能
   - 避免同时启用过多分析功能
   - 定期清理不再使用的图层

---

## API 参考

完整的类型定义请参考：
- `packages/plugins/src/modules/TilesPlugin/types/index.ts`

主要接口：
- `TilesLayerInstance` - 图层实例接口
- `ClippingPlanesConfig` - 剖切配置
- `BoxClipConfig` - 盒子裁剪配置
- `ModelClipConfig` - 模型裁剪配置
- `FloodAnalysisConfig` - 淹没分析配置
- `FlattenConfig` - 压平配置
- `HeightLimitConfig` - 限高分析配置
- `HeatmapConfig` - 热力图配置
- `ColorCorrectionConfig` - 颜色校正配置
- `SeismicAnalysisConfig` - 地震分析配置
