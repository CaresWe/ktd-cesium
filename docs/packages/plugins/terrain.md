# 地形插件 (TerrainPlugin)

地形插件提供了完整的地形服务管理、水效果渲染和地形淹没分析功能，支持多种地形服务提供商。

## 功能特性

### 1. 多种地形服务支持

- **Cesium World Terrain** - Cesium 官方全球地形
- **Cesium Ion** - Cesium Ion 资产地形
- **ArcGIS Terrain** - ArcGIS 地形服务
- **Google Terrain** - Google 地形服务
- **Mapbox Terrain** - Mapbox 地形服务
- **自定义地形服务** - 支持任意标准地形服务
- **椭球体地形** - 无地形数据的平滑椭球体

### 2. 地形配置

- 地形夸张倍数设置
- 地形光照效果
- 相对高度夸张
- 地形可见性控制
- 地形高程采样

### 3. 水效果

- 静态水面渲染
- 自定义水面颜色和透明度
- 水面高度设置
- 多个水域管理

### 4. 地形淹没分析

- 动画淹没模拟
- 水位实时更新
- 淹没速度控制
- 循环播放支持
- 淹没事件回调

## 快速开始

### 基础用法

```ts
import { AutoViewer } from '@auto-cesium/core'
import { TerrainPlugin, TerrainServiceType } from '@auto-cesium/plugins'

// 创建地图实例
const viewer = new AutoViewer({
  container: 'cesiumContainer'
})

// 安装地形插件
viewer.use(TerrainPlugin)
const terrain = viewer.getPlugin<TerrainPlugin>('terrain')

// 设置 Cesium World Terrain
await terrain.setTerrain({
  type: TerrainServiceType.CESIUM_WORLD,
  requestWaterMask: true,
  requestVertexNormals: true,
  enableLighting: true
})
```

## API 文档

### 核心方法

#### setTerrain(options: TerrainOptions)

设置地形服务。

**参数:**

- `options.type` - 地形服务类型
- `options.enableLighting` - 是否启用光照
- `options.exaggeration` - 地形夸张倍数
- `options.show` - 是否显示地形

**返回:** `Promise<void>`

#### removeTerrain()

移除当前地形，恢复为椭球体。

#### setExaggeration(exaggeration: number)

设置地形夸张倍数。

**参数:**

- `exaggeration` - 夸张倍数(默认 1.0)

#### enableLighting(enabled: boolean)

启用或禁用地形光照。

**参数:**

- `enabled` - 是否启用

#### sampleTerrain(positions: Cartesian3[], options?: TerrainSampleOptions)

采样地形高程数据。

**参数:**

- `positions` - 采样位置数组
- `options.level` - 采样精度等级(可选)

**返回:** `Promise<TerrainElevationData[]>`

### 水效果方法

#### addWaterEffect(id: string, options: WaterEffectOptions)

添加水面效果。

**参数:**

- `id` - 水效果唯一标识
- `options.positions` - 水域边界坐标点数组
- `options.height` - 水面高度(米)
- `options.color` - 水面颜色(CSS颜色字符串)
- `options.alpha` - 水面透明度(0-1)
- `options.show` - 是否显示

**返回:** `Cesium.Entity` - 水面实体

#### removeWaterEffect(id: string)

移除水面效果。

**参数:**

- `id` - 水效果标识

**返回:** `boolean` - 是否成功移除

### 淹没分析方法

#### createFloodAnalysis(id: string, entity: Cesium.Entity, options: Omit<FloodAnalysisOptions, 'positions'>)

创建地形淹没分析(基于 GraphicsPlugin 绘制的面要素)。

**参数:**

- `id` - 分析唯一标识
- `entity` - GraphicsPlugin 绘制的面要素(polygon)
- `options.startHeight` - 起始水位高度(米)
- `options.targetHeight` - 目标水位高度(米)
- `options.duration` - 动画持续时间(秒，默认5)
- `options.waterColor` - 水面颜色(默认'#0088ff')
- `options.alpha` - 水面透明度(默认0.6)
- `options.autoStart` - 是否自动开始(默认false)
- `options.loop` - 是否循环播放(默认false)
- `options.onHeightChange` - 水位变化回调
- `options.onComplete` - 完成回调

**返回:** `FloodAnalysis` - 淹没分析实例

#### removeFloodAnalysis(id: string)

移除淹没分析。

**参数:**

- `id` - 分析标识

**返回:** `boolean` - 是否成功移除

#### getFloodAnalysis(id: string)

获取淹没分析实例。

**参数:**

- `id` - 分析标识

**返回:** `FloodAnalysis | undefined`

### FloodAnalysis 类方法

#### start()

开始淹没动画。

#### pause()

暂停淹没动画。

#### reset()

重置淹没分析到初始状态。

#### setHeight(height: number)

直接设置当前水位高度。

**参数:**

- `height` - 水位高度(米)

#### getCurrentHeight()

获取当前水位高度。

**返回:** `number` - 当前水位(米)

#### setVisible(visible: boolean)

设置淹没区域可见性。

**参数:**

- `visible` - 是否可见

## 代码示例

### 1. 使用不同地形服务

#### Cesium World Terrain

```ts
await terrain.setTerrain({
  type: TerrainServiceType.CESIUM_WORLD,
  requestWaterMask: true, // 请求水面掩膜
  requestVertexNormals: true, // 请求顶点法线
  enableLighting: true, // 启用光照
  exaggeration: 1.5 // 地形夸张1.5倍
})
```

#### ArcGIS World Terrain

```ts
await terrain.setTerrain({
  type: TerrainServiceType.ARCGIS,
  url: 'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer',
  enableLighting: true
})
```

#### 自定义地形服务

```ts
await terrain.setTerrain({
  type: TerrainServiceType.CUSTOM,
  url: 'https://example.com/terrain',
  requestVertexNormals: true,
  enableLighting: true,
  minimumLevel: 0,
  maximumLevel: 18,
  rectangle: [73.0, 3.0, 135.0, 54.0], // 限制区域范围
  credit: 'Custom Terrain Data'
})
```

#### 使用预设配置

```ts
import { createChinaTerrainConfig, createArcGISWorldTerrainConfig } from '@auto-cesium/plugins'

// 中国地形服务
await terrain.setTerrain(
  createChinaTerrainConfig({
    enableLighting: true,
    exaggeration: 2.0
  })
)

// ArcGIS 世界地形
await terrain.setTerrain(createArcGISWorldTerrainConfig())
```

### 2. 地形配置调整

```ts
// 设置地形夸张倍数
terrain.setExaggeration(2.0)

// 启用地形光照
terrain.enableLighting(true)

// 设置相对高度夸张
terrain.setExaggerationRelativeHeight(100)

// 移除地形
terrain.removeTerrain()
```

### 3. 地形高程采样

```ts
// 采样单个点的高程
const positions = [
  Cesium.Cartesian3.fromDegrees(116.391, 39.907) // 北京天安门
]

const elevations = await terrain.sampleTerrain(positions)
console.log(`海拔高度: ${elevations[0].elevation.toFixed(2)} 米`)
console.log(`经度: ${elevations[0].longitude.toFixed(6)}°`)
console.log(`纬度: ${elevations[0].latitude.toFixed(6)}°`)

// 采样多个点
const multiPositions = [
  Cesium.Cartesian3.fromDegrees(116.391, 39.907), // 北京
  Cesium.Cartesian3.fromDegrees(121.473, 31.23), // 上海
  Cesium.Cartesian3.fromDegrees(113.264, 23.129) // 广州
]

const multiElevations = await terrain.sampleTerrain(multiPositions, { level: 11 })
multiElevations.forEach((data, index) => {
  console.log(`位置 ${index + 1}: 海拔 ${data.elevation.toFixed(2)} 米`)
})
```

### 4. 添加水效果

```ts
// 创建湖泊水面
const lakePositions = [
  Cesium.Cartesian3.fromDegrees(116.4, 39.9),
  Cesium.Cartesian3.fromDegrees(116.5, 39.9),
  Cesium.Cartesian3.fromDegrees(116.5, 40.0),
  Cesium.Cartesian3.fromDegrees(116.4, 40.0)
]

terrain.addWaterEffect('lake-1', {
  positions: lakePositions,
  height: 100, // 水面高度 100米
  color: '#0088ff', // 蓝色水面
  alpha: 0.6, // 60% 透明度
  show: true
})

// 创建河流水面
const riverPositions = [
  Cesium.Cartesian3.fromDegrees(116.3, 39.8),
  Cesium.Cartesian3.fromDegrees(116.35, 39.85),
  Cesium.Cartesian3.fromDegrees(116.4, 39.9),
  Cesium.Cartesian3.fromDegrees(116.45, 39.95)
]

terrain.addWaterEffect('river-1', {
  positions: riverPositions,
  height: 50,
  color: '#00aaff',
  alpha: 0.7
})

// 移除水面
terrain.removeWaterEffect('lake-1')
```

### 5. 地形淹没分析

**重要**: 地形淹没分析需要先使用 GraphicsPlugin 绘制淹没区域，然后基于绘制的面进行分析。

#### 基础淹没动画

```ts
// 步骤1: 获取插件实例
const graphics = viewer.getPlugin<GraphicsPlugin>('graphics')
const terrain = viewer.getPlugin<TerrainPlugin>('terrain')

// 步骤2: 使用 GraphicsPlugin 绘制淹没区域边界
graphics.startDraw({
  type: 'polygon',
  style: {
    color: '#00ff00',
    opacity: 0.3,
    outline: true,
    outlineColor: '#00ff00'
  },
  success: (entity) => {
    // 步骤3: 绘制完成后，基于绘制的面创建淹没分析
    const analysis = terrain.createFloodAnalysis('flood-1', entity, {
      startHeight: 0, // 起始水位 0米
      targetHeight: 50, // 目标水位 50米
      duration: 10, // 持续 10秒
      waterColor: '#0088ff',
      alpha: 0.6,
      autoStart: true, // 自动开始
      onHeightChange: (height) => {
        console.log(`当前水位: ${height.toFixed(2)} 米`)
      },
      onComplete: () => {
        console.log('淹没分析完成')
      }
    })

    // 步骤4: 手动控制淹没动画
    // analysis.pause()        // 暂停
    // analysis.start()        // 继续
    // analysis.reset()        // 重置
    // analysis.setHeight(25)  // 直接设置水位到 25米
  }
})
```

#### 循环淹没动画

```ts
graphics.startDraw({
  type: 'polygon',
  style: { color: '#00ff00', opacity: 0.3 },
  success: (entity) => {
    const analysis = terrain.createFloodAnalysis('flood-loop', entity, {
      startHeight: 0,
      targetHeight: 100,
      duration: 15,
      loop: true, // 循环播放
      autoStart: true
    })
  }
})
```

#### 实时水位显示

```ts
graphics.startDraw({
  type: 'polygon',
  style: { color: '#ffff00', opacity: 0.3 },
  success: (entity) => {
    const analysis = terrain.createFloodAnalysis('flood-monitor', entity, {
      startHeight: 0,
      targetHeight: 80,
      duration: 20,
      showHeightLabel: true,
      onHeightChange: (height) => {
        // 更新UI显示当前水位
        document.getElementById('water-level').textContent = `${height.toFixed(2)}m`

        // 根据水位触发预警
        if (height > 60) {
          console.warn('洪水水位超过警戒线!')
        }
      }
    })

    // 开始淹没分析
    analysis.start()
  }
})
```

## 使用场景

### 场景1: 地质勘探高程分析

```ts
class GeologicalSurvey {
  constructor(private viewer: AutoViewer) {}

  async analyzeTerrain(surveyPoints: { lng: number; lat: number; name: string }[]) {
    const terrain = this.viewer.getPlugin<TerrainPlugin>('terrain')

    // 设置高精度地形
    await terrain.setTerrain({
      type: TerrainServiceType.CESIUM_WORLD,
      requestVertexNormals: true,
      enableLighting: true,
      exaggeration: 1.0 // 真实高程
    })

    // 采样勘探点高程
    const positions = surveyPoints.map((p) => Cesium.Cartesian3.fromDegrees(p.lng, p.lat))

    const elevations = await terrain.sampleTerrain(positions)

    // 生成勘探报告
    const report = surveyPoints.map((point, index) => ({
      name: point.name,
      longitude: point.lng,
      latitude: point.lat,
      elevation: elevations[index].elevation,
      elevationFormatted: `${elevations[index].elevation.toFixed(2)}m`
    }))

    console.table(report)
    return report
  }

  // 分析区域最高点和最低点
  async analyzeElevationRange(area: Cesium.Cartesian3[]) {
    const terrain = this.viewer.getPlugin<TerrainPlugin>('terrain')
    const elevations = await terrain.sampleTerrain(area)

    const heights = elevations.map((e) => e.elevation)
    const maxHeight = Math.max(...heights)
    const minHeight = Math.min(...heights)
    const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length

    return {
      max: maxHeight,
      min: minHeight,
      average: avgHeight,
      range: maxHeight - minHeight
    }
  }
}

// 使用示例
const survey = new GeologicalSurvey(viewer)

const points = [
  { lng: 116.391, lat: 39.907, name: '北京天安门' },
  { lng: 116.57, lat: 40.372, name: '慕田峪长城' },
  { lng: 116.237, lat: 40.013, name: '十三陵水库' }
]

const report = await survey.analyzeTerrain(points)
```

### 场景2: 水库库容分析

```ts
class ReservoirCapacityAnalysis {
  private viewer: AutoViewer
  private terrain: TerrainPlugin
  private floodAnalysis: FloodAnalysis | null = null

  constructor(viewer: AutoViewer) {
    this.viewer = viewer
    this.terrain = viewer.getPlugin<TerrainPlugin>('terrain')
  }

  // 创建水库淹没分析
  async createReservoir(
    name: string,
    boundary: Cesium.Cartesian3[],
    normalWaterLevel: number,
    deadWaterLevel: number,
    floodControlLevel: number
  ) {
    // 设置地形
    await this.terrain.setTerrain({
      type: TerrainServiceType.CESIUM_WORLD,
      requestVertexNormals: true,
      enableLighting: true
    })

    // 创建淹没分析
    this.floodAnalysis = this.terrain.createFloodAnalysis(`reservoir-${name}`, {
      positions: boundary,
      startHeight: deadWaterLevel,
      targetHeight: floodControlLevel,
      currentHeight: normalWaterLevel,
      duration: 0, // 不使用动画
      waterColor: '#0066cc',
      alpha: 0.7,
      showHeightLabel: true
    })

    // 设置到正常水位
    this.floodAnalysis.setHeight(normalWaterLevel)
  }

  // 模拟水位变化
  simulateWaterLevelChange(targetLevel: number, duration: number = 5) {
    if (!this.floodAnalysis) return

    const startHeight = this.floodAnalysis.getCurrentHeight()
    const startTime = Date.now()

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000
      const progress = Math.min(elapsed / duration, 1)

      const currentHeight = startHeight + (targetLevel - startHeight) * progress
      this.floodAnalysis!.setHeight(currentHeight)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    animate()
  }

  // 计算库容（简化版，实际需要更复杂的体积计算）
  async calculateCapacity(boundary: Cesium.Cartesian3[], waterLevel: number) {
    // 采样边界点的地形高程
    const elevations = await this.terrain.sampleTerrain(boundary)

    // 计算平均地面高程
    const avgGroundHeight = elevations.reduce((sum, e) => sum + e.elevation, 0) / elevations.length

    // 简化计算：假设水库近似为规则形状
    const area = this.calculatePolygonArea(boundary)
    const depth = waterLevel - avgGroundHeight
    const capacity = area * depth // 立方米

    return {
      area, // 水面面积(平方米)
      depth, // 平均水深(米)
      capacity, // 库容(立方米)
      capacityInMillionCubicMeters: capacity / 1000000 // 万立方米
    }
  }

  private calculatePolygonArea(positions: Cesium.Cartesian3[]): number {
    // 简化计算：将三维坐标投影到平面计算面积
    const cartographics = positions.map((p) => Cesium.Cartographic.fromCartesian(p))

    let area = 0
    for (let i = 0; i < cartographics.length; i++) {
      const j = (i + 1) % cartographics.length
      const xi = Cesium.Math.toDegrees(cartographics[i].longitude)
      const yi = Cesium.Math.toDegrees(cartographics[i].latitude)
      const xj = Cesium.Math.toDegrees(cartographics[j].longitude)
      const yj = Cesium.Math.toDegrees(cartographics[j].latitude)
      area += xi * yj - xj * yi
    }

    // 转换为平方米（粗略估算）
    return (Math.abs(area) * 111000 * 111000) / 2
  }
}

// 使用示例
const reservoirAnalysis = new ReservoirCapacityAnalysis(viewer)

// 水库边界
const reservoirBoundary = [
  Cesium.Cartesian3.fromDegrees(116.2, 40.0),
  Cesium.Cartesian3.fromDegrees(116.3, 40.0),
  Cesium.Cartesian3.fromDegrees(116.3, 40.1),
  Cesium.Cartesian3.fromDegrees(116.2, 40.1)
]

// 创建水库
await reservoirAnalysis.createReservoir(
  '十三陵水库',
  reservoirBoundary,
  150, // 正常水位 150m
  120, // 死水位 120m
  180 // 汛限水位 180m
)

// 模拟水位上升
reservoirAnalysis.simulateWaterLevelChange(170, 10)

// 计算库容
const capacity = await reservoirAnalysis.calculateCapacity(reservoirBoundary, 150)
console.log(`水面面积: ${(capacity.area / 1000000).toFixed(2)} 平方公里`)
console.log(`平均水深: ${capacity.depth.toFixed(2)} 米`)
console.log(`库容: ${capacity.capacityInMillionCubicMeters.toFixed(2)} 万立方米`)
```

### 场景3: 洪水淹没风险评估

```ts
class FloodRiskAssessment {
  private viewer: AutoViewer
  private terrain: TerrainPlugin
  private floodLevels: Map<string, FloodAnalysis> = new Map()

  constructor(viewer: AutoViewer) {
    this.viewer = viewer
    this.terrain = viewer.getPlugin<TerrainPlugin>('terrain')
  }

  // 创建多级洪水风险区
  async createFloodRiskZones(
    area: Cesium.Cartesian3[],
    baseHeight: number,
    riskLevels: { level: string; height: number; color: string }[]
  ) {
    await this.terrain.setTerrain({
      type: TerrainServiceType.ARCGIS,
      url: 'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer',
      enableLighting: true
    })

    // 为每个风险等级创建淹没分析
    riskLevels.forEach((risk) => {
      const analysis = this.terrain.createFloodAnalysis(`flood-risk-${risk.level}`, {
        positions: area,
        startHeight: baseHeight,
        targetHeight: risk.height,
        currentHeight: baseHeight,
        duration: 0,
        waterColor: risk.color,
        alpha: 0.5,
        showHeightLabel: true
      })

      this.floodLevels.set(risk.level, analysis)
    })
  }

  // 切换显示风险等级
  showRiskLevel(level: string) {
    // 隐藏所有
    this.floodLevels.forEach((analysis) => analysis.setVisible(false))

    // 显示指定等级
    const analysis = this.floodLevels.get(level)
    if (analysis) {
      analysis.setVisible(true)
    }
  }

  // 模拟洪水演进
  async simulateFloodEvolution(levels: string[], intervalSeconds: number = 5) {
    for (const level of levels) {
      const analysis = this.floodLevels.get(level)
      if (analysis) {
        // 隐藏之前的等级
        this.floodLevels.forEach((a) => a.setVisible(false))

        // 显示当前等级
        analysis.setVisible(true)
        analysis.start()

        // 等待动画完成
        await new Promise((resolve) => setTimeout(resolve, intervalSeconds * 1000))
      }
    }
  }

  // 评估受影响建筑（需要结合建筑数据）
  async assessAffectedBuildings(buildings: Array<{ id: string; position: Cesium.Cartesian3 }>, waterLevel: number) {
    // 采样建筑位置的地形高程
    const positions = buildings.map((b) => b.position)
    const elevations = await this.terrain.sampleTerrain(positions)

    // 判断哪些建筑会被淹没
    const affected = buildings.filter((building, index) => {
      return elevations[index].elevation < waterLevel
    })

    return {
      total: buildings.length,
      affected: affected.length,
      affectedList: affected,
      affectedRate: ((affected.length / buildings.length) * 100).toFixed(2) + '%'
    }
  }
}

// 使用示例
const floodRisk = new FloodRiskAssessment(viewer)

// 评估区域
const assessmentArea = [
  Cesium.Cartesian3.fromDegrees(116.3, 39.8),
  Cesium.Cartesian3.fromDegrees(116.5, 39.8),
  Cesium.Cartesian3.fromDegrees(116.5, 40.0),
  Cesium.Cartesian3.fromDegrees(116.3, 40.0)
]

// 创建洪水风险等级
await floodRisk.createFloodRiskZones(assessmentArea, 30, [
  { level: 'low', height: 35, color: '#ffff00' }, // 低风险 - 黄色
  { level: 'medium', height: 40, color: '#ff9900' }, // 中风险 - 橙色
  { level: 'high', height: 45, color: '#ff0000' } // 高风险 - 红色
])

// 显示中风险区域
floodRisk.showRiskLevel('medium')

// 模拟洪水演进过程
await floodRisk.simulateFloodEvolution(['low', 'medium', 'high'], 8)

// 评估受影响建筑
const buildings = [
  { id: 'building-1', position: Cesium.Cartesian3.fromDegrees(116.35, 39.85) },
  { id: 'building-2', position: Cesium.Cartesian3.fromDegrees(116.4, 39.9) },
  { id: 'building-3', position: Cesium.Cartesian3.fromDegrees(116.45, 39.95) }
]

const assessment = await floodRisk.assessAffectedBuildings(buildings, 40)
console.log(`受影响建筑: ${assessment.affected}/${assessment.total} (${assessment.affectedRate})`)
```

### 场景4: 海平面上升模拟

```ts
class SeaLevelRiseSimulator {
  private viewer: AutoViewer
  private terrain: TerrainPlugin
  private seaLevelAnalysis: FloodAnalysis | null = null

  constructor(viewer: AutoViewer) {
    this.viewer = viewer
    this.terrain = viewer.getPlugin<TerrainPlugin>('terrain')
  }

  // 创建海平面上升模拟
  async createSimulation(coastalArea: Cesium.Cartesian3[], currentSeaLevel: number = 0) {
    await this.terrain.setTerrain({
      type: TerrainServiceType.CESIUM_WORLD,
      requestVertexNormals: true,
      requestWaterMask: true, // 显示水面
      enableLighting: true
    })

    this.seaLevelAnalysis = this.terrain.createFloodAnalysis('sea-level-rise', {
      positions: coastalArea,
      startHeight: currentSeaLevel,
      targetHeight: currentSeaLevel + 10, // 模拟上升10米
      duration: 30, // 30秒动画
      waterColor: '#0066aa',
      alpha: 0.7,
      loop: false,
      showHeightLabel: true,
      onHeightChange: (height) => {
        const rise = height - currentSeaLevel
        console.log(`海平面上升: +${rise.toFixed(2)}m`)

        // 更新UI
        this.updateUI(rise)
      },
      onComplete: () => {
        console.log('海平面上升模拟完成')
      }
    })
  }

  // 模拟不同年份的海平面
  simulateYear(year: number, risePerYear: number = 0.032) {
    if (!this.seaLevelAnalysis) return

    const yearsElapsed = year - 2024
    const totalRise = yearsElapsed * risePerYear // 每年上升约3.2mm

    this.seaLevelAnalysis.setHeight(totalRise)
  }

  // 快速预览未来场景
  async previewFutureScenarios(scenarios: Array<{ year: number; rise: number }>) {
    for (const scenario of scenarios) {
      console.log(`预览 ${scenario.year}年场景: 海平面上升 ${scenario.rise}米`)

      if (this.seaLevelAnalysis) {
        this.seaLevelAnalysis.setHeight(scenario.rise)
      }

      // 停留3秒
      await new Promise((resolve) => setTimeout(resolve, 3000))
    }
  }

  private updateUI(rise: number) {
    // 更新页面UI显示
    const uiElement = document.getElementById('sea-level-rise')
    if (uiElement) {
      uiElement.textContent = `+${rise.toFixed(3)}m`
    }
  }
}

// 使用示例
const seaLevelSim = new SeaLevelRiseSimulator(viewer)

// 上海沿海区域
const shanghaiCoastal = [
  Cesium.Cartesian3.fromDegrees(121.3, 31.1),
  Cesium.Cartesian3.fromDegrees(121.7, 31.1),
  Cesium.Cartesian3.fromDegrees(121.7, 31.4),
  Cesium.Cartesian3.fromDegrees(121.3, 31.4)
]

// 创建模拟
await seaLevelSim.createSimulation(shanghaiCoastal, 0)

// 预览未来不同时期场景
await seaLevelSim.previewFutureScenarios([
  { year: 2030, rise: 0.19 }, // 2030年预计上升19cm
  { year: 2050, rise: 0.83 }, // 2050年预计上升83cm
  { year: 2100, rise: 2.4 } // 2100年预计上升2.4m
])
```

## 最佳实践

### 1. 地形服务选择

- **全球应用**: 使用 Cesium World Terrain 或 ArcGIS Terrain
- **中国区域**: 使用中国地形服务预设配置
- **局部高精度**: 使用自定义地形服务配合区域限制
- **性能优先**: 使用椭球体地形或降低地形精度

### 2. 性能优化

```ts
// 限制地形加载范围
await terrain.setTerrain({
  type: TerrainServiceType.CUSTOM,
  url: 'https://example.com/terrain',
  rectangle: [110, 30, 120, 40], // 只加载指定区域
  minimumLevel: 0,
  maximumLevel: 15 // 限制最大层级
})

// 适当使用地形夸张
terrain.setExaggeration(1.0) // 生产环境使用真实高程

// 按需启用光照
terrain.enableLighting(true) // 展示时启用
```

### 3. 淹没分析优化

```ts
// 避免创建过多淹没分析实例
const maxFloodAnalyses = 5
if (floodAnalyses.size >= maxFloodAnalyses) {
  // 移除最旧的分析
  const oldestId = Array.from(floodAnalyses.keys())[0]
  terrain.removeFloodAnalysis(oldestId)
}

// 使用合适的动画时长
const analysis = terrain.createFloodAnalysis('flood', {
  positions: area,
  startHeight: 0,
  targetHeight: 50,
  duration: 5, // 5秒足够展示效果,避免过长
  loop: false // 非演示场景不要循环
})
```

### 4. 错误处理

```ts
try {
  await terrain.setTerrain({
    type: TerrainServiceType.CUSTOM,
    url: 'https://example.com/terrain'
  })
} catch (error) {
  console.error('地形加载失败:', error)

  // 降级到椭球体地形
  await terrain.setTerrain({
    type: TerrainServiceType.ELLIPSOID
  })
}
```

## 注意事项

1. **地形服务访问**
   - Cesium Ion 服务需要有效的 Access Token
   - 部分服务可能需要配置跨域访问
   - 注意服务的使用配额和限制

2. **性能考虑**
   - 地形数据加载会影响初始化时间
   - 高精度地形会增加渲染负担
   - 淹没分析动画会占用CPU资源

3. **精度问题**
   - 地形高程精度取决于数据源
   - 采样精度受地形瓦片层级影响
   - 水面高度需要与实际高程数据匹配

4. **坐标系统**
   - 确保地形数据与底图坐标系一致
   - 注意高程基准面的差异
   - 区域范围使用WGS84经纬度

## 相关插件

- **GraphicsPlugin** - 可配合绘制淹没区域边界
- **AnalysisPlugin** - 提供地形剖面和坡度分析
- **BaseLayerPlugin** - 配合设置底图图层
