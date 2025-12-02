# AnalysisPlugin - 空间分析插件

AnalysisPlugin 提供强大的空间测量和分析功能，支持多种量算类型和高级空间分析。

## 特性

### 基础测量

- **空间距离** - 测量两点间的三维直线距离
- **贴地距离** - 测量贴合地形的实际距离
- **水平面积** - 测量多边形的水平投影面积
- **贴地面积** - 测量贴合地形的表面积
- **高度差** - 测量两点间的高程差
- **坐标测量** - 获取点的经纬度和高程
- **三角测量** - 三点构成的三角形面积和周长
- **方位角** - 测量两点间的方位角

### 高级分析

- **剖面分析** - 生成地形剖面图
- **方量分析** - 计算挖填方量
- **通视分析** - 分析两点间的可视性
- **环视分析** - 天际线和全景可视性分析
- **最短路径** - 基于地形坡度的最优路径
- **缓冲区分析** - 生成几何缓冲区
- **可视域分析** - 指定视角的可视范围分析
- **日照分析** - 建筑日照时长分析
- **叠面分析** - 多边形的交并差分析

### 增强功能

- **顶点吸附** - 自动吸附到已有图形顶点
- **实时更新** - 绘制过程中实时显示测量结果
- **GeoJSON 导入导出** - 支持标准 GeoJSON 格式
- **样式自定义** - 完全自定义测量样式
- **移动端支持** - 支持触摸操作和长按结束

## 使用场景

### 城市规划

- **土地测量** - 使用面积测量工具计算地块面积
- **建筑布局** - 通过距离和角度测量优化建筑间距
- **日照分析** - 评估建筑物对周边的日照影响
- **方量计算** - 计算土方工程的挖填方量

### 地理信息系统

- **地形分析** - 使用剖面分析查看地形起伏
- **通视分析** - 评估观测点之间的可视性
- **缓冲区分析** - 生成兴趣点周边的影响范围
- **叠面分析** - 分析不同区域的交集和差集

### 工程建设

- **路径规划** - 基于地形坡度计算最优施工路径
- **场地平整** - 通过方量分析优化场地平整方案
- **可视域分析** - 评估建筑物的视野范围
- **高程测量** - 测量关键点位的高程信息

### 环境监测

- **区域测量** - 测量监测区域的面积和边界
- **坐标定位** - 记录监测点的精确坐标
- **环视分析** - 分析监测点的360°可视范围
- **数据导出** - 将测量结果导出为GeoJSON格式

### 应急救援

- **距离测算** - 快速测量救援距离
- **区域划分** - 使用缓冲区划定警戒范围
- **路径分析** - 计算最短救援路径
- **可视性评估** - 评估指挥位置的视野覆盖

## 快速开始

```typescript
import { AutoViewer } from '@auto-cesium/core'
import { AnalysisPlugin } from '@auto-cesium/plugins'

const viewer = new AutoViewer(cesiumViewer)
const analysis = viewer.use(AnalysisPlugin, {
  showMidpoint: true,
  liveUpdate: true,
  style: {
    lineColor: '#ffff00',
    pointColor: '#ff0000',
    fillColor: '#00ff00'
  }
})

// 开始距离测量
analysis.startMeasure({
  type: 'distance',
  onComplete: (result) => {
    console.log('测量完成:', result.text)
  }
})
```

## 使用示例

### 基础测量

#### 距离测量

```typescript
// 空间距离
analysis.startMeasure({
  type: 'distance',
  onComplete: (result) => {
    console.log('距离:', result.value, '米')
  }
})

// 贴地距离
analysis.startMeasure({
  type: 'surfaceDistance',
  onComplete: (result) => {
    console.log('贴地距离:', result.value, '米')
  }
})
```

#### 面积测量

```typescript
// 水平面积
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

// 贴地面积
analysis.startMeasure({
  type: 'surfaceArea',
  onComplete: (result) => {
    console.log('贴地面积:', result.value, '平方米')
  }
})
```

#### 高度和坐标

```typescript
// 高度差
analysis.startMeasure({
  type: 'height',
  onComplete: (result) => {
    console.log('高度差:', result.value, '米')
  }
})

// 坐标测量
analysis.startMeasure({
  type: 'coordinate',
  onComplete: (result) => {
    const coord = result.value as { lng: number; lat: number; height: number }
    console.log(\`经度: \${coord.lng}°, 纬度: \${coord.lat}°, 高程: \${coord.height}m\`)
  }
})
```

### 高级分析

#### 剖面分析

```typescript
analysis.startMeasure({
  type: 'profile',
  profileOptions: {
    sampleCount: 100,
    clampToGround: true
  },
  onComplete: (result) => {
    const data = result.value as ProfileDataPoint[]
    // 使用图表库绘制剖面图
    drawChart(data)
  }
})
```

#### 方量分析

```typescript
analysis.startMeasure({
  type: 'volume',
  volumeOptions: {
    baseElevation: 100,
    gridSize: 10
  },
  onComplete: (result) => {
    const volume = result.value as {
      cutVolume: number
      fillVolume: number
    }
    console.log('挖方:', volume.cutVolume, '立方米')
    console.log('填方:', volume.fillVolume, '立方米')
  }
})
```

#### 通视分析

```typescript
analysis.startMeasure({
  type: 'viewshed',
  viewshedOptions: {
    observerHeight: 1.6,
    visibleColor: '#00ff00',
    invisibleColor: '#ff0000'
  },
  onComplete: (result) => {
    const data = result.value as { visible: boolean }
    console.log('是否可见:', data.visible)
  }
})
```

### 样式自定义

```typescript
// 全局样式
const analysis = viewer.use(AnalysisPlugin, {
  style: {
    lineColor: '#ffff00',
    lineWidth: 2,
    pointColor: '#ff0000',
    pointSize: 8
  }
})

// 单次测量样式覆盖
analysis.startMeasure({
  type: 'distance',
  style: {
    lineColor: '#00ffff',
    lineWidth: 3
  }
})
```

### 顶点吸附

```typescript
// 启用吸附
analysis.setSnapConfig({
  enabled: true,
  radius: 15
})

// 监听吸附事件
analysis.on('measure:snap', (data) => {
  console.log('吸附到顶点:', data.position)
})
```

### GeoJSON 导入导出

```typescript
// 导出
const features = analysis.exportGeoJSON()
const geojson = {
  type: 'FeatureCollection',
  features
}
console.log(JSON.stringify(geojson))

// 导入
analysis.importGeoJSON(features)
```

### 完整应用示例

```typescript
// 初始化
const analysis = viewer.use(AnalysisPlugin, {
  showMidpoint: true,
  liveUpdate: true
})

// 工具切换函数
function startMeasure(type: string) {
  analysis.stopMeasure()

  analysis.startMeasure({
    type: type as any,
    onComplete: (result) => {
      alert(\`测量完成: \${result.text}\`)
    },
    onUpdate: (result) => {
      document.getElementById('value').textContent = result.text
    }
  })
}

// UI 绑定
document.getElementById('btn-distance').onclick = () => startMeasure('distance')
document.getElementById('btn-area').onclick = () => startMeasure('area')
document.getElementById('btn-clear').onclick = () => analysis.clearAll()
```

## 场景应用示例

### 场景1：土地规划测量

在城市规划中测量地块面积并生成报告：

```typescript
import { AnalysisPlugin } from '@auto-cesium/plugins'

class LandPlanningTool {
  private analysis: AnalysisPlugin

  constructor(viewer: AutoViewer) {
    this.analysis = viewer.use(AnalysisPlugin, {
      showMidpoint: true,
      liveUpdate: true,
      style: {
        fillColor: '#4CAF50',
        fillOpacity: 0.4,
        lineColor: '#2E7D32',
        lineWidth: 3
      }
    })
  }

  // 测量地块面积
  measureLandArea(plotName: string) {
    this.analysis.startMeasure({
      type: 'area',
      onComplete: (result) => {
        const areaM2 = result.value as number
        const areaAcres = (areaM2 * 0.000247105).toFixed(2) // 转换为英亩
        const areaMu = (areaM2 * 0.0015).toFixed(2) // 转换为亩

        const report = {
          plotName,
          area: {
            squareMeters: areaM2.toFixed(2),
            acres: areaAcres,
            mu: areaMu
          },
          timestamp: new Date().toISOString(),
          coordinates: result.positions
        }

        console.log('地块测量报告:', report)
        this.exportReport(report)
      }
    })
  }

  // 导出报告为 GeoJSON
  exportReport(report: any) {
    const features = this.analysis.exportGeoJSON()
    const geojson = {
      type: 'FeatureCollection',
      features: features.map((f) => ({
        ...f,
        properties: {
          ...f.properties,
          ...report
        }
      }))
    }

    // 下载 GeoJSON 文件
    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `land-report-${Date.now()}.geojson`
    a.click()
  }
}

// 使用
const landTool = new LandPlanningTool(viewer)
landTool.measureLandArea('A区地块')
```

### 场景2：建筑日照分析

评估建筑物对周边的日照影响：

```typescript
class SunlightAnalysisTool {
  private analysis: AnalysisPlugin
  private results: Array<{ building: string; shadowArea: number; affectedTime: number }>

  constructor(viewer: AutoViewer) {
    this.analysis = viewer.use(AnalysisPlugin, {
      style: {
        fillColor: '#FFC107',
        fillOpacity: 0.6
      }
    })
    this.results = []
  }

  // 分析建筑阴影覆盖面积
  analyzeShadowCoverage(buildingName: string) {
    console.log(`开始分析 ${buildingName} 的日照影响...`)

    this.analysis.startMeasure({
      type: 'surfaceArea', // 使用贴地面积测量阴影
      onComplete: (result) => {
        const shadowArea = result.value as number

        // 计算日照影响时长（简化计算）
        const affectedTime = this.calculateAffectedTime(shadowArea)

        this.results.push({
          building: buildingName,
          shadowArea,
          affectedTime
        })

        this.generateReport()
      }
    })
  }

  // 计算受影响时长（小时）
  private calculateAffectedTime(shadowArea: number): number {
    // 简化算法：假设阴影面积与影响时长成正比
    const baseHours = 8 // 基准日照时长
    const shadowFactor = shadowArea / 10000 // 每10000平方米影响1小时
    return Math.min(baseHours, shadowFactor * 2)
  }

  // 生成日照分析报告
  generateReport() {
    const totalAffectedArea = this.results.reduce((sum, r) => sum + r.shadowArea, 0)
    const avgAffectedTime = this.results.reduce((sum, r) => sum + r.affectedTime, 0) / this.results.length

    const report = {
      analysisDate: new Date().toLocaleDateString(),
      buildings: this.results,
      summary: {
        totalAffectedArea: totalAffectedArea.toFixed(2) + ' m²',
        averageAffectedTime: avgAffectedTime.toFixed(1) + ' 小时',
        compliance: avgAffectedTime < 2 ? '符合规范' : '需要调整'
      }
    }

    console.log('日照分析报告:', report)
    return report
  }

  // 清除所有分析结果
  reset() {
    this.results = []
    this.analysis.clearAll()
  }
}

// 使用
const sunlightTool = new SunlightAnalysisTool(viewer)
sunlightTool.analyzeShadowCoverage('A栋住宅楼')
sunlightTool.analyzeShadowCoverage('B栋商业楼')
```

### 场景3：道路规划地形剖面

分析道路沿线的地形起伏，优化路线设计：

```typescript
class RoadPlanningTool {
  private analysis: AnalysisPlugin

  constructor(viewer: AutoViewer) {
    this.analysis = viewer.use(AnalysisPlugin, {
      style: {
        lineColor: '#2196F3',
        lineWidth: 4
      }
    })
  }

  // 分析道路剖面
  analyzeRoadProfile(roadName: string) {
    this.analysis.startMeasure({
      type: 'profile',
      profileOptions: {
        sampleCount: 200,
        clampToGround: true
      },
      onComplete: (result) => {
        const profileData = result.value as Array<{
          distance: number
          elevation: number
          position: Cesium.Cartesian3
        }>

        const analysis = this.analyzeTerrainProfile(profileData)

        console.log(`${roadName} 地形分析:`, analysis)
        this.visualizeProfile(roadName, profileData, analysis)
      }
    })
  }

  // 分析地形剖面数据
  private analyzeTerrainProfile(data: any[]) {
    let maxElevation = -Infinity
    let minElevation = Infinity
    let totalClimb = 0
    let totalDescent = 0
    let maxSlope = 0

    for (let i = 0; i < data.length; i++) {
      const current = data[i].elevation
      maxElevation = Math.max(maxElevation, current)
      minElevation = Math.min(minElevation, current)

      if (i > 0) {
        const prev = data[i - 1].elevation
        const elevDiff = current - prev
        const distDiff = data[i].distance - data[i - 1].distance
        const slope = Math.abs(elevDiff / distDiff) * 100

        maxSlope = Math.max(maxSlope, slope)

        if (elevDiff > 0) {
          totalClimb += elevDiff
        } else {
          totalDescent += Math.abs(elevDiff)
        }
      }
    }

    const totalDistance = data[data.length - 1].distance

    return {
      distance: totalDistance.toFixed(2) + ' m',
      elevationRange: {
        min: minElevation.toFixed(2) + ' m',
        max: maxElevation.toFixed(2) + ' m',
        difference: (maxElevation - minElevation).toFixed(2) + ' m'
      },
      climb: totalClimb.toFixed(2) + ' m',
      descent: totalDescent.toFixed(2) + ' m',
      maxSlope: maxSlope.toFixed(2) + '%',
      slopeCompliance: maxSlope < 8 ? '符合标准' : '超出限制'
    }
  }

  // 可视化剖面图（使用图表库）
  private visualizeProfile(roadName: string, data: any[], analysis: any) {
    // 这里可以使用 ECharts 或 Chart.js 等图表库
    const chartData = {
      title: `${roadName} - 地形剖面图`,
      xAxis: data.map((d) => d.distance.toFixed(0)),
      yAxis: data.map((d) => d.elevation.toFixed(2)),
      analysis
    }

    console.log('剖面图数据:', chartData)
    // 实际项目中这里会调用图表库进行渲染
  }
}

// 使用
const roadTool = new RoadPlanningTool(viewer)
roadTool.analyzeRoadProfile('市政路-东段')
```

### 场景4：工程方量计算

计算土方工程的挖填方量和成本：

```typescript
class EarthworkCalculator {
  private analysis: AnalysisPlugin
  private costPerCubicMeter = {
    cut: 25, // 挖方单价 25元/m³
    fill: 18 // 填方单价 18元/m³
  }

  constructor(viewer: AutoViewer) {
    this.analysis = viewer.use(AnalysisPlugin, {
      style: {
        fillColor: '#795548',
        fillOpacity: 0.5
      }
    })
  }

  // 计算场地方量
  calculateEarthwork(siteName: string, baseElevation: number) {
    this.analysis.startMeasure({
      type: 'volume',
      volumeOptions: {
        baseElevation,
        gridSize: 5 // 5米网格精度
      },
      onComplete: (result) => {
        const volume = result.value as {
          cutVolume: number
          fillVolume: number
        }

        const report = this.generateCostReport(siteName, volume)
        console.log('土方工程报告:', report)
      }
    })
  }

  // 生成成本报告
  private generateCostReport(siteName: string, volume: any) {
    const cutCost = volume.cutVolume * this.costPerCubicMeter.cut
    const fillCost = volume.fillVolume * this.costPerCubicMeter.fill
    const totalCost = cutCost + fillCost

    // 计算土方平衡率
    const balanceRate =
      (Math.min(volume.cutVolume, volume.fillVolume) / Math.max(volume.cutVolume, volume.fillVolume)) * 100

    return {
      site: siteName,
      volume: {
        cut: `${volume.cutVolume.toFixed(2)} m³`,
        fill: `${volume.fillVolume.toFixed(2)} m³`,
        balance: `${(volume.cutVolume - volume.fillVolume).toFixed(2)} m³`
      },
      cost: {
        cut: `¥${cutCost.toFixed(2)}`,
        fill: `¥${fillCost.toFixed(2)}`,
        total: `¥${totalCost.toFixed(2)}`
      },
      balanceRate: `${balanceRate.toFixed(1)}%`,
      recommendation: balanceRate > 85 ? '土方平衡良好' : '建议调整设计高程'
    }
  }

  // 更新单价
  updateCost(cutPrice: number, fillPrice: number) {
    this.costPerCubicMeter.cut = cutPrice
    this.costPerCubicMeter.fill = fillPrice
  }
}

// 使用
const earthworkCalc = new EarthworkCalculator(viewer)
earthworkCalc.calculateEarthwork('A区建设用地', 125.5)
```

### 场景5：应急救援指挥

快速评估救援距离和路径：

```typescript
class EmergencyRescueTool {
  private analysis: AnalysisPlugin
  private rescuePoints: Array<{ id: string; position: Cesium.Cartesian3 }>

  constructor(viewer: AutoViewer) {
    this.analysis = viewer.use(AnalysisPlugin, {
      showMidpoint: false,
      liveUpdate: true,
      style: {
        lineColor: '#F44336',
        lineWidth: 4,
        pointColor: '#D32F2F',
        pointSize: 12
      }
    })
    this.rescuePoints = []
  }

  // 测量救援距离
  measureRescueDistance(fromName: string, toName: string) {
    console.log(`测量从 ${fromName} 到 ${toName} 的距离...`)

    this.analysis.startMeasure({
      type: 'distance',
      onComplete: (result) => {
        const distanceKm = (result.value as number) / 1000
        const estimatedTime = this.estimateRescueTime(distanceKm)

        console.log(`
救援距离评估:
- 起点: ${fromName}
- 终点: ${toName}
- 直线距离: ${distanceKm.toFixed(2)} km
- 预计耗时: ${estimatedTime} 分钟
        `)
      }
    })
  }

  // 设置警戒范围
  setWarningZone(centerName: string, radiusKm: number) {
    this.analysis.startMeasure({
      type: 'buffer',
      bufferOptions: {
        radius: radiusKm * 1000 // 转换为米
      },
      style: {
        fillColor: '#FF9800',
        fillOpacity: 0.3,
        lineColor: '#F57C00'
      },
      onComplete: (result) => {
        console.log(`已设置 ${centerName} 周边 ${radiusKm}km 警戒区域`)
      }
    })
  }

  // 分析最短路径
  findShortestPath(start: string, end: string) {
    this.analysis.startMeasure({
      type: 'shortestPath',
      pathOptions: {
        algorithm: 'terrain-aware', // 考虑地形
        maxSlope: 30 // 最大坡度限制
      },
      onComplete: (result) => {
        const pathData = result.value as {
          distance: number
          elevationGain: number
          difficulty: number
        }

        console.log(`最短救援路径: ${start} → ${end}`)
        console.log(`- 路径长度: ${(pathData.distance / 1000).toFixed(2)} km`)
        console.log(`- 爬升高度: ${pathData.elevationGain.toFixed(0)} m`)
        console.log(`- 难度评级: ${this.getDifficultyLevel(pathData.difficulty)}`)
      }
    })
  }

  // 评估指挥位置可视域
  evaluateCommandViewshed(commandPostName: string) {
    this.analysis.startMeasure({
      type: 'viewshed',
      viewshedOptions: {
        observerHeight: 2.0, // 观察者高度
        viewDistance: 5000, // 视野距离 5km
        horizontalAngle: 360,
        verticalAngle: 90,
        visibleColor: '#4CAF50',
        invisibleColor: '#F44336'
      },
      onComplete: (result) => {
        const viewshedData = result.value as {
          visibleArea: number
          coverage: number
        }

        console.log(`指挥位置可视性评估: ${commandPostName}`)
        console.log(`- 可视区域: ${(viewshedData.visibleArea / 1000000).toFixed(2)} km²`)
        console.log(`- 覆盖率: ${(viewshedData.coverage * 100).toFixed(1)}%`)
      }
    })
  }

  // 估算救援时间
  private estimateRescueTime(distanceKm: number): number {
    const avgSpeed = 60 // 平均速度 60km/h
    return Math.ceil((distanceKm / avgSpeed) * 60)
  }

  // 获取难度等级
  private getDifficultyLevel(difficulty: number): string {
    if (difficulty < 0.3) return '低'
    if (difficulty < 0.6) return '中'
    return '高'
  }
}

// 使用示例
const rescueTool = new EmergencyRescueTool(viewer)

// 测量救援距离
rescueTool.measureRescueDistance('消防站A', '事故现场')

// 设置警戒区域
rescueTool.setWarningZone('爆炸中心', 2)

// 寻找最短路径
rescueTool.findShortestPath('救援队驻地', '被困人员位置')

// 评估指挥位置
rescueTool.evaluateCommandViewshed('临时指挥中心')
```

## API 文档

### AnalysisPlugin

#### 配置选项

```typescript
interface AnalysisPluginOptions {
  style?: Partial<MeasureStyle>
  snap?: Partial<SnapConfig>
  showMidpoint?: boolean
  liveUpdate?: boolean
}
```

#### 方法

**startMeasure(options: MeasureOptions): this**

开始量算。

**stopMeasure(): this**

停止当前量算。

**clearAll(): this**

清除所有量算结果。

**remove(entityId: string): this**

移除指定的量算结果。

**getResults(): MeasureResult[]**

获取所有量算结果。

**getResult(entityId: string): MeasureResult | null**

获取指定的量算结果。

**exportGeoJSON(): GeoJSONFeature[]**

导出为 GeoJSON 格式。

**importGeoJSON(features: GeoJSONFeature[]): this**

从 GeoJSON 导入。

## 参考文档

- [GraphicsPlugin 图形插件](/packages/plugins/graphics)
- [Cesium 测量示例](https://sandcastle.cesium.com/?src=Measurement.html)

## 版本历史

- v1.0.0 - 初始版本，支持基础测量和高级分析功能

## 许可

MIT License
