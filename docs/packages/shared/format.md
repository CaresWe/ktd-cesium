# 格式化

格式化模块提供了各种数据格式化工具，用于将坐标、距离、面积、高度等数据转换为易读的字符串格式。

## 导入

```typescript
import { formatCoordinate, formatDistance, formatArea, formatHeight, formatNumber } from '@auto-cesium/shared'
```

## API

### formatCoordinate

格式化经纬度坐标为易读的字符串。

**类型签名**

```typescript
function formatCoordinate(longitude: number, latitude: number, precision?: number): string
```

**参数**

- `longitude`: 经度（度数）
- `latitude`: 纬度（度数）
- `precision`: 小数位数，可选，默认为 4

**返回值**

- `string`: 格式化后的坐标字符串

**示例**

```typescript
import { formatCoordinate } from '@auto-cesium/shared'

formatCoordinate(116.4074, 39.9042)
// "39.9042°N, 116.4074°E"

formatCoordinate(-122.4194, 37.7749)
// "37.7749°N, 122.4194°W"

formatCoordinate(116.4074, -33.8688)
// "33.8688°S, 116.4074°E"

// 自定义精度
formatCoordinate(116.40742, 39.90419, 2)
// "39.90°N, 116.41°E"
```

### formatDistance

格式化距离为易读的字符串（自动选择单位）。

**类型签名**

```typescript
function formatDistance(distance: number, precision?: number): string
```

**参数**

- `distance`: 距离（米）
- `precision`: 小数位数，可选，默认为 2

**返回值**

- `string`: 格式化后的距离字符串

**示例**

```typescript
import { formatDistance } from '@auto-cesium/shared'

formatDistance(500)
// "500.00 m"

formatDistance(1500)
// "1.50 km"

formatDistance(50)
// "50.00 m"

formatDistance(1234.5678, 1)
// "1.2 km"

// 使用场景
const distance = calculateDistance(point1, point2)
console.log(`距离: ${formatDistance(distance)}`)
```

### formatArea

格式化面积为易读的字符串（自动选择单位）。

**类型签名**

```typescript
function formatArea(area: number, precision?: number): string
```

**参数**

- `area`: 面积（平方米）
- `precision`: 小数位数，可选，默认为 2

**返回值**

- `string`: 格式化后的面积字符串

**示例**

```typescript
import { formatArea } from '@auto-cesium/shared'

formatArea(500)
// "500.00 m²"

formatArea(10000)
// "1.00 ha"

formatArea(1500000)
// "1.50 km²"

formatArea(50000, 1)
// "5.0 ha"

// 单位说明：
// < 10000 m² -> 使用 m²
// >= 10000 m² 且 < 1000000 m² -> 使用 ha（公顷）
// >= 1000000 m² -> 使用 km²
```

### formatHeight

格式化高度为易读的字符串（自动选择单位）。

**类型签名**

```typescript
function formatHeight(height: number, precision?: number): string
```

**参数**

- `height`: 高度（米）
- `precision`: 小数位数，可选，默认为 2

**返回值**

- `string`: 格式化后的高度字符串

**示例**

```typescript
import { formatHeight } from '@auto-cesium/shared'

formatHeight(500)
// "500.00 m"

formatHeight(1500)
// "1.50 km"

formatHeight(8848.86)
// "8.85 km"

formatHeight(100, 0)
// "100 m"
```

### formatNumber

格式化数字为指定小数位数的字符串。

**类型签名**

```typescript
function formatNumber(value: number, precision?: number): string
```

**参数**

- `value`: 数值
- `precision`: 小数位数，可选，默认为 2

**返回值**

- `string`: 格式化后的数字字符串

**示例**

```typescript
import { formatNumber } from '@auto-cesium/shared'

formatNumber(123.456)
// "123.46"

formatNumber(123.456, 1)
// "123.5"

formatNumber(123.456, 4)
// "123.4560"

formatNumber(123)
// "123.00"
```

## 使用场景

### 场景 1：显示鼠标位置信息

```typescript
import { cartesianToDegrees, formatCoordinate, formatHeight } from '@auto-cesium/shared'

viewer.screenSpaceEventHandler.setInputAction((movement) => {
  const cartesian = viewer.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid)

  if (cartesian) {
    const { longitude, latitude, height } = cartesianToDegrees(cartesian)

    const coordText = formatCoordinate(longitude, latitude)
    const heightText = formatHeight(height)

    document.getElementById('info').innerHTML = `
      位置: ${coordText}<br>
      高度: ${heightText}
    `
  }
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
```

### 场景 2：测量工具

```typescript
import { calculateDistance, formatDistance, formatCoordinate } from '@auto-cesium/shared'

class MeasureTool {
  constructor(viewer) {
    this.viewer = viewer
    this.points = []
  }

  addPoint(cartesian) {
    const degrees = cartesianToDegrees(cartesian)
    this.points.push(degrees)

    if (this.points.length >= 2) {
      const lastTwo = this.points.slice(-2)
      const distance = calculateDistance(lastTwo[0], lastTwo[1])

      console.log(`
        起点: ${formatCoordinate(lastTwo[0].longitude, lastTwo[0].latitude)}
        终点: ${formatCoordinate(lastTwo[1].longitude, lastTwo[1].latitude)}
        距离: ${formatDistance(distance)}
      `)
    }
  }

  getTotalDistance() {
    let total = 0
    for (let i = 0; i < this.points.length - 1; i++) {
      total += calculateDistance(this.points[i], this.points[i + 1])
    }
    return formatDistance(total)
  }
}
```

### 场景 3：实体信息面板

```typescript
import { formatCoordinate, formatHeight, formatArea } from '@auto-cesium/shared'

function showEntityInfo(entity) {
  const position = entity.position.getValue(Cesium.JulianDate.now())
  const { longitude, latitude, height } = cartesianToDegrees(position)

  const info = `
    <div class="entity-info">
      <h3>${entity.name || '未命名'}</h3>
      <p>坐标: ${formatCoordinate(longitude, latitude)}</p>
      <p>高度: ${formatHeight(height)}</p>
      ${entity.polygon ? `<p>面积: ${formatArea(entity.polygon.area)}</p>` : ''}
    </div>
  `

  document.getElementById('infoPanel').innerHTML = info
}
```

### 场景 4：数据表格

```typescript
import { formatCoordinate, formatDistance, formatHeight } from '@auto-cesium/shared'

const locations = [
  { name: '北京', longitude: 116.4074, latitude: 39.9042, height: 43.5 },
  { name: '上海', longitude: 121.4737, latitude: 31.2304, height: 4 },
  { name: '广州', longitude: 113.2644, latitude: 23.1291, height: 21 }
]

function generateTable() {
  return locations.map((loc) => ({
    名称: loc.name,
    坐标: formatCoordinate(loc.longitude, loc.latitude),
    海拔: formatHeight(loc.height)
  }))
}

console.table(generateTable())
```

### 场景 5：统计信息显示

```typescript
import { formatDistance, formatArea, formatNumber } from '@auto-cesium/shared'

class StatisticsPanel {
  constructor() {
    this.totalDistance = 0
    this.totalArea = 0
    this.pointCount = 0
  }

  update(distance, area, points) {
    this.totalDistance = distance
    this.totalArea = area
    this.pointCount = points
  }

  render() {
    return `
      <div class="statistics">
        <div>总距离: ${formatDistance(this.totalDistance)}</div>
        <div>总面积: ${formatArea(this.totalArea)}</div>
        <div>点数量: ${formatNumber(this.pointCount, 0)}</div>
        <div>平均密度: ${formatNumber(this.pointCount / (this.totalArea / 1000000), 2)} 点/km²</div>
      </div>
    `
  }
}
```

## 格式化规则

### 距离单位

- `< 1000 m` -> 使用米（m）
- `>= 1000 m` -> 使用千米（km）

### 面积单位

- `< 10000 m²` -> 使用平方米（m²）
- `>= 10000 m² 且 < 1000000 m²` -> 使用公顷（ha）
- `>= 1000000 m²` -> 使用平方千米（km²）

### 高度单位

- `< 1000 m` -> 使用米（m）
- `>= 1000 m` -> 使用千米（km）

### 坐标格式

- 纬度：正值为北（N），负值为南（S）
- 经度：正值为东（E），负值为西（W）
- 格式：`纬度°方向, 经度°方向`

## 注意事项

1. 所有距离、高度输入单位都是**米**
2. 所有面积输入单位都是**平方米**
3. 所有经纬度使用**度数**，不是弧度
4. `precision` 参数控制小数位数，不影响单位选择
5. 格式化函数会自动四舍五入到指定精度
