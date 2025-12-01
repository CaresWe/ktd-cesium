# 军标图形

军标图形模块提供了多种军事标绘图形的计算功能，包括攻击箭头、双箭头、细箭头、弓形面、正多边形、扇形、等腰三角形、闭合曲线、集结地等。

## 导入

```typescript
import {
  // 弓形面
  computeLunePositions,
  getLuneArcParams,
  // 正多边形
  computeRegularPositions,
  // 扇形
  computeSectorPositions,
  // 等腰三角形
  computeIsoscelesTrianglePositions,
  // 攻击箭头
  computeAttackArrowPositions,
  // 闭合曲线
  computeCloseCurvePositions,
  // 双箭头
  computeDoubleArrowPositions,
  // 细箭头
  computeFineArrowPositions,
  // 集结地
  computeGatheringPlacePositions
} from '@auto-cesium/shared'
```

## API

### computeLunePositions

计算弓形面的显示点（通过 3 个点确定一个弓形面）。

**类型签名**

```typescript
function computeLunePositions(positions: Cesium.Cartesian3[], segments?: number): Cesium.Cartesian3[]
```

**参数**

- `positions`: 原始 3 个绘制点（Cesium.Cartesian3 数组）
- `segments`: 圆弧分段数（可选，默认 100）

**返回值**

- `Cesium.Cartesian3[]`: 弓形面的边界点

**示例**

```typescript
import { computeLunePositions } from '@auto-cesium/shared'

const positions = [
  Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0),
  Cesium.Cartesian3.fromDegrees(116.5, 39.9, 0),
  Cesium.Cartesian3.fromDegrees(116.45, 40.0, 0)
]

const lunePositions = computeLunePositions(positions, 100)

viewer.entities.add({
  polygon: {
    hierarchy: new Cesium.PolygonHierarchy(lunePositions),
    material: Cesium.Color.BLUE.withAlpha(0.5)
  }
})
```

### getLuneArcParams

计算弓形面的圆弧参数。

**类型签名**

```typescript
function getLuneArcParams(positions: Cesium.Cartesian3[]): {
  center: number[]
  radius: number
  startAngle: number
  endAngle: number
} | null
```

**返回值**

- 圆弧参数对象，包含圆心、半径、起始角度、结束角度

**示例**

```typescript
import { getLuneArcParams } from '@auto-cesium/shared'

const params = getLuneArcParams(positions)
if (params) {
  console.log('圆心:', params.center)
  console.log('半径:', params.radius)
  console.log('起始角度:', params.startAngle)
  console.log('结束角度:', params.endAngle)
}
```

### computeRegularPositions

计算正多边形的显示点。

**类型签名**

```typescript
function computeRegularPositions(positions: Cesium.Cartesian3[], edgeCount?: number): Cesium.Cartesian3[]
```

**参数**

- `positions`: 控制点（通常为 2 个点：中心点和边界点）
- `edgeCount`: 边数（可选，默认根据控制点数量计算）

**示例**

```typescript
import { computeRegularPositions } from '@auto-cesium/shared'

// 正六边形
const positions = [
  Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0), // 中心
  Cesium.Cartesian3.fromDegrees(116.41, 39.9, 0) // 边界点
]

const regularPositions = computeRegularPositions(positions, 6)

viewer.entities.add({
  polygon: {
    hierarchy: new Cesium.PolygonHierarchy(regularPositions),
    material: Cesium.Color.RED.withAlpha(0.5)
  }
})
```

### computeSectorPositions

计算扇形的显示点。

**类型签名**

```typescript
function computeSectorPositions(positions: Cesium.Cartesian3[], segments?: number): Cesium.Cartesian3[]
```

**参数**

- `positions`: 控制点（通常为 3 个点：中心点、起始方向点、结束方向点）
- `segments`: 圆弧分段数（可选，默认 100）

**示例**

```typescript
import { computeSectorPositions } from '@auto-cesium/shared'

const positions = [
  Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0), // 中心
  Cesium.Cartesian3.fromDegrees(116.41, 39.9, 0), // 起始方向
  Cesium.Cartesian3.fromDegrees(116.4, 39.91, 0) // 结束方向
]

const sectorPositions = computeSectorPositions(positions)

viewer.entities.add({
  polygon: {
    hierarchy: new Cesium.PolygonHierarchy(sectorPositions),
    material: Cesium.Color.YELLOW.withAlpha(0.5)
  }
})
```

### computeIsoscelesTrianglePositions

计算等腰三角形的显示点。

**类型签名**

```typescript
function computeIsoscelesTrianglePositions(positions: Cesium.Cartesian3[]): Cesium.Cartesian3[]
```

**参数**

- `positions`: 控制点（通常为 3 个点：顶点、底边中点、底边端点）

**示例**

```typescript
import { computeIsoscelesTrianglePositions } from '@auto-cesium/shared'

const positions = [
  Cesium.Cartesian3.fromDegrees(116.4, 40.0, 0), // 顶点
  Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0), // 底边中点
  Cesium.Cartesian3.fromDegrees(116.41, 39.9, 0) // 底边端点
]

const trianglePositions = computeIsoscelesTrianglePositions(positions)
```

### computeAttackArrowPositions

计算攻击箭头的显示点。

**类型签名**

```typescript
function computeAttackArrowPositions(positions: Cesium.Cartesian3[]): Cesium.Cartesian3[]
```

**参数**

- `positions`: 控制点（通常为多个点定义箭头路径）

**示例**

```typescript
import { computeAttackArrowPositions } from '@auto-cesium/shared'

const positions = [
  Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0),
  Cesium.Cartesian3.fromDegrees(116.5, 39.9, 0),
  Cesium.Cartesian3.fromDegrees(116.6, 39.95, 0)
]

const arrowPositions = computeAttackArrowPositions(positions)

viewer.entities.add({
  polygon: {
    hierarchy: new Cesium.PolygonHierarchy(arrowPositions),
    material: Cesium.Color.RED.withAlpha(0.6)
  }
})
```

### computeDoubleArrowPositions

计算双箭头的显示点。

**类型签名**

```typescript
function computeDoubleArrowPositions(positions: Cesium.Cartesian3[]): Cesium.Cartesian3[]
```

**示例**

```typescript
import { computeDoubleArrowPositions } from '@auto-cesium/shared'

const positions = [Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0), Cesium.Cartesian3.fromDegrees(116.5, 39.9, 0)]

const doubleArrowPositions = computeDoubleArrowPositions(positions)
```

### computeFineArrowPositions

计算细箭头的显示点。

**类型签名**

```typescript
function computeFineArrowPositions(positions: Cesium.Cartesian3[]): Cesium.Cartesian3[]
```

**示例**

```typescript
import { computeFineArrowPositions } from '@auto-cesium/shared'

const positions = [Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0), Cesium.Cartesian3.fromDegrees(116.5, 39.9, 0)]

const fineArrowPositions = computeFineArrowPositions(positions)
```

### computeCloseCurvePositions

计算闭合曲线的显示点。

**类型签名**

```typescript
function computeCloseCurvePositions(positions: Cesium.Cartesian3[], segments?: number): Cesium.Cartesian3[]
```

**参数**

- `positions`: 控制点数组
- `segments`: 曲线分段数（可选）

**示例**

```typescript
import { computeCloseCurvePositions } from '@auto-cesium/shared'

const positions = [
  Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0),
  Cesium.Cartesian3.fromDegrees(116.5, 39.9, 0),
  Cesium.Cartesian3.fromDegrees(116.5, 40.0, 0),
  Cesium.Cartesian3.fromDegrees(116.4, 40.0, 0)
]

const curvePositions = computeCloseCurvePositions(positions)
```

### computeGatheringPlacePositions

计算集结地的显示点。

**类型签名**

```typescript
function computeGatheringPlacePositions(positions: Cesium.Cartesian3[]): Cesium.Cartesian3[]
```

**示例**

```typescript
import { computeGatheringPlacePositions } from '@auto-cesium/shared'

const positions = [Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0), Cesium.Cartesian3.fromDegrees(116.5, 39.9, 0)]

const gatheringPositions = computeGatheringPlacePositions(positions)
```

## 使用场景

### 场景 1：绘制攻击箭头

```typescript
import { computeAttackArrowPositions } from '@auto-cesium/shared'

function drawAttackArrow(waypoints: Cesium.Cartesian3[]) {
  const arrowPositions = computeAttackArrowPositions(waypoints)

  viewer.entities.add({
    name: '攻击箭头',
    polygon: {
      hierarchy: new Cesium.PolygonHierarchy(arrowPositions),
      material: Cesium.Color.RED.withAlpha(0.6),
      outline: true,
      outlineColor: Cesium.Color.RED,
      outlineWidth: 2
    }
  })
}

// 使用
const waypoints = [
  Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0),
  Cesium.Cartesian3.fromDegrees(116.5, 39.9, 0),
  Cesium.Cartesian3.fromDegrees(116.6, 39.95, 0)
]
drawAttackArrow(waypoints)
```

### 场景 2：绘制扇形区域

```typescript
import { computeSectorPositions } from '@auto-cesium/shared'

function drawSector(center: Cesium.Cartesian3, startDir: Cesium.Cartesian3, endDir: Cesium.Cartesian3) {
  const positions = [center, startDir, endDir]
  const sectorPositions = computeSectorPositions(positions, 50)

  viewer.entities.add({
    name: '扇形区域',
    polygon: {
      hierarchy: new Cesium.PolygonHierarchy(sectorPositions),
      material: Cesium.Color.YELLOW.withAlpha(0.4),
      outline: true,
      outlineColor: Cesium.Color.YELLOW
    }
  })
}
```

### 场景 3：绘制正多边形

```typescript
import { computeRegularPositions } from '@auto-cesium/shared'

function drawRegularPolygon(center: Cesium.Cartesian3, radius: number, sides: number) {
  // 计算边界点
  const boundary = Cesium.Cartesian3.add(
    center,
    Cesium.Cartesian3.multiplyByScalar(Cesium.Cartesian3.UNIT_X, radius, new Cesium.Cartesian3()),
    new Cesium.Cartesian3()
  )

  const positions = [center, boundary]
  const regularPositions = computeRegularPositions(positions, sides)

  viewer.entities.add({
    name: `正${sides}边形`,
    polygon: {
      hierarchy: new Cesium.PolygonHierarchy(regularPositions),
      material: Cesium.Color.BLUE.withAlpha(0.5)
    }
  })
}
```

### 场景 4：绘制弓形面

```typescript
import { computeLunePositions, getLuneArcParams } from '@auto-cesium/shared'

function drawLune(p1: Cesium.Cartesian3, p2: Cesium.Cartesian3, p3: Cesium.Cartesian3) {
  const positions = [p1, p2, p3]
  const lunePositions = computeLunePositions(positions)

  // 获取圆弧参数
  const arcParams = getLuneArcParams(positions)
  if (arcParams) {
    console.log('圆弧半径:', arcParams.radius)
    console.log('圆弧角度范围:', arcParams.startAngle, '到', arcParams.endAngle)
  }

  viewer.entities.add({
    name: '弓形面',
    polygon: {
      hierarchy: new Cesium.PolygonHierarchy(lunePositions),
      material: Cesium.Color.GREEN.withAlpha(0.5)
    }
  })
}
```

## 注意事项

1. **控制点数量**：
   - 不同图形类型需要不同数量的控制点
   - 弓形面需要 3 个点
   - 正多边形通常需要 2 个点（中心点和边界点）
   - 攻击箭头需要多个点定义路径

2. **坐标系统**：
   - 所有函数内部使用 Web Mercator 投影进行计算
   - 输入输出都是 Cesium.Cartesian3 坐标

3. **分段数**：
   - 圆弧类图形（弓形面、扇形）支持自定义分段数
   - 分段数越大，曲线越平滑，但计算量也越大
   - 建议值：50-100

4. **性能考虑**：
   - 军标图形计算涉及复杂的几何运算
   - 大量图形时注意性能优化
   - 可以考虑使用 Primitive 模式提高性能

5. **图形闭合**：
   - 所有函数返回的边界点数组都是闭合的
   - 可以直接用于创建 Polygon 实体

6. **应用场景**：
   - 主要用于军事标绘、态势图绘制
   - 也可以用于一般的地图标注和区域标记
