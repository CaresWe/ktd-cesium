# GraphicsPlugin

GraphicsPlugin 是 Ktd Cesium 的核心绘制插件，封装了自定义图形的**绘制、编辑、加载、聚合、导出**等一系列能力，覆盖点、线、面、体、模型在内的 20+ 几何类型，并可与 Event、Tooltip、Transform 等插件联动。

## 导入

```typescript
import { GraphicsPlugin } from '@auto-cesium/plugins'
import type { GraphicsPluginOptions, DrawAttribute, DrawType } from '@auto-cesium/plugins'
```

## 安装

```typescript
import { AutoViewer } from '@auto-cesium/core'
import { GraphicsPlugin } from '@auto-cesium/plugins'

const viewer = new AutoViewer(cesiumViewer)
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

| 选项                     | 说明                                                                |
| ------------------------ | ------------------------------------------------------------------- |
| `hasEdit`                | 是否启用编辑（默认 true）                                           |
| `nameTooltip`            | 是否显示名称提示                                                    |
| `hasDel(entity)`         | 控制右键菜单是否允许删除                                            |
| `removeScreenSpaceEvent` | 是否移除默认鼠标事件以避免冲突                                      |
| `clustering`             | `ClusterOptions`，配置 Entity/Primitive 聚合样式与行为              |
| `transform`              | 变换控制器配置：`enabled`、`mode`、`space`、`snap`、`rotateSnap` 等 |

## 可绘制类型

| 类型                | 说明                                             |
| ------------------- | ------------------------------------------------ |
| `point`             | Cesium 点图元，适合高性能散点                    |
| `billboard`         | 图片标注，支持聚合与 Tooltip                     |
| `label`             | 文本标注，可配合 `billboard` 显示                |
| `model`             | Entity 模式 3D 模型                              |
| `model-p`           | Primitive 模式模型，更贴近底层                   |
| `polyline`          | 折线/路径                                        |
| `curve`             | 平滑曲线，基于插值                               |
| `polylineVolume`    | 线挤出形成体（如管道）                           |
| `corridor`          | 走廊面，带宽度的路线                             |
| `polygon`           | 基础面                                           |
| `polygonEx`         | 扩展面，支持更多编辑点                           |
| `rectangle`         | 矩形面                                           |
| `circle`            | 圆形，半径快速设置                               |
| `ellipse`           | 椭圆，可设置长短轴                               |
| `box`               | 长方体                                           |
| `cylinder`          | 圆柱体                                           |
| `ellipsoid`         | 椭球体                                           |
| `wall`              | 立面墙体                                         |
| `plane`             | 平面，用于切面等                                 |
| `attackArrow`       | 军标：攻击箭头（双翼）                           |
| `attackArrowPW`     | 军标：平尾攻击箭头                               |
| `attackArrowYW`     | 军标：燕尾攻击箭头                               |
| `doubleArrow`       | 军标：双箭头                                     |
| `fineArrow`         | 军标：细长箭头                                   |
| `fineArrowYW`       | 军标：细长燕尾箭头                               |
| `closeCurve`        | 闭合曲线                                         |
| `lune`              | 弓形面                                           |
| `regular`           | 正多边形                                         |
| `sector`            | 扇形                                             |
| `isoscelesTriangle` | 等腰三角形                                       |
| `gatheringPlace`    | 集结地标记                                       |
| `water`             | 水体/湖泊/海面，基于 `WaterMaterial` 的动态波纹  |
| `flood`             | 洪水推进，支持水位动画与渐变效果                 |
| `river`             | 河流/河道，支持断面水位、流速动画                |
| `video-fusion`      | 视频融合/投影，可贴地、贴平面或贴 3D 模型        |
| `particle`          | 粒子系统，支持火焰、水枪、爆炸、喷雾、烟雾等特效 |

> 全部类型即 `DrawType` 联合类型，若需扩展，使用 `register('custom-type', CustomDraw)` 注入外部 DrawController。

## Entity/Primitive 支持矩阵

GraphicsPlugin 同时维护 `CustomDataSource` 与 `PrimitiveCollection`，不同类型会落到不同容器，以兼顾编辑能力与性能。

| 分类          | 默认载体                     | 说明                                                                                                                                   |
| ------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Entity**    | `Cesium.Entity`（数据源）    | 点、面、折线、体几何等默认落在 Entity，可直接被 EventPlugin 选中、被 EditController 编辑，也能通过 `loadJson`/`toGeoJSON` 流程序列化。 |
| **Primitive** | `Cesium.PrimitiveCollection` | `model-p`、部分高性能管线或自定义 Primitive 绘制会添加到 `PrimitiveCollection`，通过 `_primitives` 维护引用，用于批量渲染、聚合。      |

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

## 各类型 GeoJSON 加载示例

### 基础加载方法

```typescript
// 1. 从字符串加载
const geojsonString = `{
  "type": "FeatureCollection",
  "features": [...]
}`
const entities = graphics.loadJson(geojsonString, {
  clear: false,      // 是否清空现有数据
  flyTo: true,       // 是否飞行到加载的数据
  style: {           // 全局样式覆盖
    material: '#409eff',
    outlineColor: '#fff'
  },
  onEachFeature: (feature, type, index) => {
    // 每个 feature 加载前的回调
    console.log('准备加载', type, feature.properties)
  },
  onEachEntity: (feature, entity, index) => {
    // 每个 entity 加载后的回调
    console.log('已加载实体', entity.id)
  }
})

// 2. 从对象加载
const geojsonObject: GeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  features: [...]
}
graphics.loadJson(geojsonObject, { clear: true })

// 3. 从文件加载
async function loadFromFile(file: File) {
  const text = await file.text()
  const geojson = JSON.parse(text)
  return graphics.loadJson(geojson, { clear: true, flyTo: true })
}

// 4. 从 URL 加载
async function loadFromURL(url: string) {
  const response = await fetch(url)
  const geojson = await response.json()
  return graphics.loadJson(geojson, { clear: true, flyTo: true })
}
```

### 点类型加载

#### 1. 点 (point)

```typescript
const pointGeoJSON: GeoJSONFeature = {
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [116.4074, 39.9042, 0]
  },
  properties: {
    type: 'point',
    style: {
      pixelSize: 10,
      color: '#ff0000',
      outline: true,
      outlineColor: '#ffffff'
    },
    attr: {
      id: 'point-001',
      name: '标记点'
    }
  }
}

graphics.loadJson(pointGeoJSON, { clear: false })
```

#### 2. 图标标注 (billboard)

```typescript
const billboardGeoJSON: GeoJSONFeature = {
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [116.4074, 39.9042, 0]
  },
  properties: {
    type: 'billboard',
    style: {
      image: '/icons/marker.png',
      scale: 1.5,
      label: {
        text: '标注点',
        font: '16px sans-serif'
      }
    },
    attr: { id: 'billboard-001', name: '图标标注' }
  }
}

graphics.loadJson(billboardGeoJSON)
```

#### 3. 文字标注 (label)

```typescript
const labelGeoJSON: GeoJSONFeature = {
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [116.4074, 39.9042, 0]
  },
  properties: {
    type: 'label',
    style: {
      text: '文字标注',
      font: 'bold 20px sans-serif',
      fillColor: '#ffffff',
      background: true
    },
    attr: { id: 'label-001', name: '文字标注' }
  }
}

graphics.loadJson(labelGeoJSON)
```

### 线类型加载

#### 4. 折线 (polyline)

```typescript
const polylineGeoJSON: GeoJSONFeature = {
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: [
      [116.4074, 39.9042, 0],
      [116.4084, 39.9052, 0],
      [116.4094, 39.9062, 0]
    ]
  },
  properties: {
    type: 'polyline',
    style: {
      width: 3,
      color: '#00ff00',
      clampToGround: true,
      lineType: 'dash'
    },
    attr: { id: 'polyline-001', name: '路径线' }
  }
}

graphics.loadJson(polylineGeoJSON)
```

#### 5. 曲线 (curve)

```typescript
const curveGeoJSON: GeoJSONFeature = {
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: [
      [116.4074, 39.9042, 0],
      [116.4084, 39.9052, 0],
      [116.4094, 39.9062, 0]
    ]
  },
  properties: {
    type: 'curve',
    style: {
      width: 3,
      color: '#9b59b6'
    },
    attr: { id: 'curve-001', name: '平滑曲线' }
  }
}

graphics.loadJson(curveGeoJSON)
```

#### 6. 管道体 (polylineVolume)

```typescript
const polylineVolumeGeoJSON: GeoJSONFeature = {
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: [
      [116.4074, 39.9042, 0],
      [116.4084, 39.9052, 0]
    ]
  },
  properties: {
    type: 'polylineVolume',
    style: {
      material: '#27ae60'
    },
    attr: { id: 'polylineVolume-001', name: '管道体' }
  }
}

graphics.loadJson(polylineVolumeGeoJSON)
```

#### 7. 走廊 (corridor)

```typescript
const corridorGeoJSON: GeoJSONFeature = {
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: [
      [116.4074, 39.9042, 0],
      [116.4084, 39.9052, 0]
    ]
  },
  properties: {
    type: 'corridor',
    style: {
      width: 500,
      material: '#16a085',
      height: 0,
      extrudedHeight: 50
    },
    attr: { id: 'corridor-001', name: '走廊' }
  }
}

graphics.loadJson(corridorGeoJSON)
```

### 面类型加载

#### 8. 面 (polygon)

```typescript
const polygonGeoJSON: GeoJSONFeature = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [116.4074, 39.9042, 0],
        [116.4084, 39.9042, 0],
        [116.4084, 39.9052, 0],
        [116.4074, 39.9052, 0],
        [116.4074, 39.9042, 0]
      ]
    ]
  },
  properties: {
    type: 'polygon',
    style: {
      material: '#ff6b6b',
      opacity: 0.6,
      outline: true,
      outlineColor: '#ffffff',
      height: 0,
      extrudedHeight: 0
    },
    attr: { id: 'polygon-001', name: '区域面' }
  }
}

graphics.loadJson(polygonGeoJSON)
```

#### 9. 矩形 (rectangle)

```typescript
const rectangleGeoJSON: GeoJSONFeature = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [116.4074, 39.9042, 0],
        [116.4084, 39.9042, 0],
        [116.4084, 39.9052, 0],
        [116.4074, 39.9052, 0],
        [116.4074, 39.9042, 0]
      ]
    ]
  },
  properties: {
    type: 'rectangle',
    style: {
      material: '#e74c3c',
      height: 0,
      extrudedHeight: 50
    },
    attr: { id: 'rectangle-001', name: '矩形区域' }
  }
}

graphics.loadJson(rectangleGeoJSON)
```

#### 10. 圆形 (circle)

```typescript
const circleGeoJSON: GeoJSONFeature = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        // 圆形会被转换为多边形坐标
        [116.4074, 39.9042, 0],
        [116.4084, 39.9042, 0]
        // ... 更多点
      ]
    ]
  },
  properties: {
    type: 'circle',
    style: {
      radius: 1000, // 保留半径信息
      material: '#f39c12',
      height: 0,
      extrudedHeight: 0
    },
    attr: { id: 'circle-001', name: '圆形区域' }
  }
}

graphics.loadJson(circleGeoJSON)
```

#### 11. 椭圆 (ellipse)

```typescript
const ellipseGeoJSON: GeoJSONFeature = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        // 椭圆多边形坐标
        [116.4074, 39.9042, 0]
        // ... 更多点
      ]
    ]
  },
  properties: {
    type: 'ellipse',
    style: {
      semiMajorAxis: 2000,
      semiMinorAxis: 1000,
      rotation: 0,
      material: '#1abc9c'
    },
    attr: { id: 'ellipse-001', name: '椭圆区域' }
  }
}

graphics.loadJson(ellipseGeoJSON)
```

#### 12. 扇形 (sector)

```typescript
const sectorGeoJSON: GeoJSONFeature = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        // 扇形多边形坐标
        [116.4074, 39.9042, 0]
        // ... 更多点
      ]
    ]
  },
  properties: {
    type: 'sector',
    style: {
      radius: 2000,
      startAngle: 0,
      endAngle: Math.PI / 2,
      material: '#3498db'
    },
    attr: { id: 'sector-001', name: '扇形' }
  }
}

graphics.loadJson(sectorGeoJSON)
```

#### 13. 正多边形 (regular)

```typescript
const regularGeoJSON: GeoJSONFeature = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        // 正多边形坐标
        [116.4074, 39.9042, 0]
        // ... 更多点
      ]
    ]
  },
  properties: {
    type: 'regular',
    style: {
      sides: 6,
      radius: 1500,
      material: '#2ecc71'
    },
    attr: { id: 'regular-001', name: '正六边形' }
  }
}

graphics.loadJson(regularGeoJSON)
```

### 军标类型加载

#### 14. 攻击箭头 (attackArrow)

```typescript
const attackArrowGeoJSON: GeoJSONFeature = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        // 箭头形状的多边形坐标
        [116.4074, 39.9042, 0]
        // ... 更多点
      ]
    ]
  },
  properties: {
    type: 'attackArrow',
    style: {
      material: '#e74c3c',
      opacity: 0.7,
      outline: true
    },
    attr: { id: 'attackArrow-001', name: '攻击箭头' }
  }
}

graphics.loadJson(attackArrowGeoJSON)
```

#### 15. 双箭头 (doubleArrow)

```typescript
const doubleArrowGeoJSON: GeoJSONFeature = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        // 双箭头多边形坐标
        [116.4074, 39.9042, 0]
        // ... 更多点
      ]
    ]
  },
  properties: {
    type: 'doubleArrow',
    style: {
      material: '#8e44ad',
      opacity: 0.7
    },
    attr: { id: 'doubleArrow-001', name: '双箭头' }
  }
}

graphics.loadJson(doubleArrowGeoJSON)
```

### 三维几何体类型加载

#### 16. 立方体 (box)

```typescript
const boxGeoJSON: GeoJSONFeature = {
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [116.4074, 39.9042, 0] // 中心点
  },
  properties: {
    type: 'box',
    style: {
      dimensions: {
        x: 1000,
        y: 1000,
        z: 500
      },
      material: '#e67e22'
    },
    attr: { id: 'box-001', name: '立方体' }
  }
}

graphics.loadJson(boxGeoJSON)
```

#### 17. 圆柱体 (cylinder)

```typescript
const cylinderGeoJSON: GeoJSONFeature = {
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [116.4074, 39.9042, 0]
  },
  properties: {
    type: 'cylinder',
    style: {
      length: 2000,
      topRadius: 500,
      bottomRadius: 500,
      material: '#3498db'
    },
    attr: { id: 'cylinder-001', name: '圆柱体' }
  }
}

graphics.loadJson(cylinderGeoJSON)
```

#### 18. 墙体 (wall)

```typescript
const wallGeoJSON: GeoJSONFeature = {
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: [
      [116.4074, 39.9042, 0],
      [116.4084, 39.9052, 0],
      [116.4094, 39.9062, 0]
    ]
  },
  properties: {
    type: 'wall',
    style: {
      minimumHeights: [0, 0, 0],
      maximumHeights: [100, 100, 100],
      material: '#34495e'
    },
    attr: { id: 'wall-001', name: '墙体' }
  }
}

graphics.loadJson(wallGeoJSON)
```

### 模型类型加载

#### 19. Entity 模式模型 (model)

```typescript
const modelGeoJSON: GeoJSONFeature = {
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [116.4074, 39.9042, 0]
  },
  properties: {
    type: 'model',
    style: {
      url: '/models/vehicle.glb',
      scale: 1.0,
      minimumPixelSize: 128
    },
    attr: { id: 'model-001', name: '3D模型' }
  }
}

graphics.loadJson(modelGeoJSON)
```

### 水面类型加载（Primitive）

#### 20. 水面 (water)

```typescript
const waterGeoJSON: GeoJSONFeature = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [116.4074, 39.9042, 0],
        [116.4084, 39.9042, 0],
        [116.4084, 39.9052, 0],
        [116.4074, 39.9052, 0],
        [116.4074, 39.9042, 0]
      ]
    ]
  },
  properties: {
    type: 'water',
    style: {
      baseWaterColor: '#1e90ff',
      blendColor: '#00bfff',
      height: 100,
      extrudedHeight: 5,
      waveType: 'ripple',
      frequency: 8.0,
      amplitude: 0.01,
      animationSpeed: 0.005
    },
    attr: { id: 'water-001', name: '水面' }
  }
}

graphics.loadJson(waterGeoJSON)
```

#### 21. 洪水推进 (flood)

```typescript
const floodGeoJSON: GeoJSONFeature = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [116.4074, 39.9042, 0],
        [116.4084, 39.9042, 0],
        [116.4084, 39.9052, 0],
        [116.4074, 39.9052, 0],
        [116.4074, 39.9042, 0]
      ]
    ]
  },
  properties: {
    type: 'flood',
    style: {
      baseWaterColor: '#4169e1',
      startHeight: 50,
      targetHeight: 100,
      currentHeight: 50,
      riseSpeed: 0.5,
      duration: 10,
      autoStart: false
    },
    attr: { id: 'flood-001', name: '洪水推进' }
  }
}

graphics.loadJson(floodGeoJSON)
```

#### 22. 动态河流 (river)

```typescript
const riverGeoJSON: GeoJSONFeature = {
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: [
      [116.4074, 39.9042, 0],
      [116.4084, 39.9052, 0],
      [116.4094, 39.9062, 0]
    ]
  },
  properties: {
    type: 'river',
    style: {
      baseWaterColor: '#4682b4',
      width: 200,
      depth: 5,
      flowVelocity: 2.0,
      dynamicWaterLevel: true,
      waterLevelPeriod: 5,
      waterLevelAmplitude: 1
    },
    attr: { id: 'river-001', name: '动态河流' }
  }
}

graphics.loadJson(riverGeoJSON)
```

### 视频融合类型加载（Primitive）

#### 23. 视频融合 (video-fusion)

```typescript
const videoGeoJSON: GeoJSONFeature = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [116.4074, 39.9042, 0],
        [116.4084, 39.9042, 0],
        [116.4084, 39.9052, 0],
        [116.4074, 39.9052, 0],
        [116.4074, 39.9042, 0]
      ]
    ]
  },
  properties: {
    type: 'video-fusion',
    style: {
      videoUrl: '/videos/demo.mp4',
      sourceType: 'mp4',
      projectionMode: '2d',
      width: 1920,
      height: 1080,
      opacity: 1.0,
      autoPlay: false,
      loop: false
    },
    attr: {
      id: 'video-fusion-001',
      name: '视频融合',
      camera: {
        // 3D投射时的相机参数（可选）
        position: [116.4074, 39.9042, 100],
        orientation: {
          heading: 0,
          pitch: -Math.PI / 2,
          roll: 0
        },
        fov: Math.PI / 4,
        aspectRatio: 16 / 9
      }
    }
  }
}

graphics.loadJson(videoGeoJSON)
```

#### 24. 粒子系统 (particle)

```typescript
const particleGeoJSON: GeoJSONFeature = {
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [116.4074, 39.9042, 10] // 发射器位置
  },
  properties: {
    type: 'particle',
    style: {
      particleType: 'fire',
      emissionRate: 100,
      particleLife: 2.0,
      speed: 3.0,
      minimumSpeed: 2.5,
      maximumSpeed: 4.0,
      startScale: 1.0,
      endScale: 0.5,
      startColor: { red: 1.0, green: 0.5, blue: 0.0, alpha: 1.0 },
      endColor: { red: 1.0, green: 0.0, blue: 0.0, alpha: 0.0 },
      imageSize: { x: 20, y: 20 },
      lifetime: -1, // -1 表示 Infinity
      loop: true
    },
    attr: {
      id: 'particle-001',
      name: '火焰特效',
      emitterType: 'cone', // 发射器类型: 'cone' | 'sphere' | 'box' | 'circle'
      emitterConfig: {
        angle: 30 // 圆锥发射器角度(度)
      }
    }
  }
}

graphics.loadJson(particleGeoJSON)
```

### 批量加载示例

#### 1. 加载 FeatureCollection

```typescript
const featureCollection: GeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [116.4074, 39.9042, 0]
      },
      properties: {
        type: 'point',
        style: { pixelSize: 10, color: '#ff0000' },
        attr: { id: 'point-001' }
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [116.4074, 39.9042, 0],
            [116.4084, 39.9042, 0],
            [116.4084, 39.9052, 0],
            [116.4074, 39.9052, 0],
            [116.4074, 39.9042, 0]
          ]
        ]
      },
      properties: {
        type: 'polygon',
        style: { material: '#ff6b6b', opacity: 0.6 },
        attr: { id: 'polygon-001' }
      }
    }
  ]
}

const entities = graphics.loadJson(featureCollection, {
  clear: true,
  flyTo: true,
  onEachEntity: (feature, entity) => {
    console.log('已加载:', entity.id, feature.properties?.type)
  }
})
```

#### 2. 从外部 GeoJSON 自动识别类型

```typescript
// 如果 GeoJSON 中没有 type 属性，会根据 geometry.type 自动推断
const externalGeoJSON: GeoJSONFeature = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [116.4074, 39.9042, 0],
        [116.4084, 39.9042, 0],
        [116.4084, 39.9052, 0],
        [116.4074, 39.9052, 0],
        [116.4074, 39.9042, 0]
      ]
    ]
  },
  properties: {
    // 没有 type，会自动推断为 'polygon'
    name: '外部数据',
    description: '从其他系统导入的数据'
  }
}

graphics.loadJson(externalGeoJSON, {
  style: {
    // 全局样式覆盖
    material: '#409eff',
    outline: true
  },
  onEachFeature: (feature, type, index) => {
    // 自动推断的类型会在这里返回
    console.log('推断类型:', type) // 'polygon'

    // 可以手动设置类型
    if (!feature.properties.type) {
      feature.properties.type = type
    }
  }
})
```

#### 3. 加载时更新样式

```typescript
const geojson: GeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    // ... features
  ]
}

graphics.loadJson(geojson, {
  clear: true,
  // 全局样式覆盖
  style: {
    material: '#409eff',
    outlineColor: '#ffffff',
    outlineWidth: 2
  },
  onEachFeature: (feature, type, index) => {
    // 根据类型设置不同样式
    if (type === 'point') {
      feature.properties.style = {
        ...feature.properties.style,
        pixelSize: 15,
        color: '#ff0000'
      }
    } else if (type === 'polygon') {
      feature.properties.style = {
        ...feature.properties.style,
        opacity: 0.7,
        material: '#00ff00'
      }
    }
  }
})
```

#### 4. 加载时添加业务属性

```typescript
graphics.loadJson(geojson, {
  onEachFeature: (feature, type, index) => {
    // 确保有 attr 对象
    feature.properties.attr = feature.properties.attr || {}

    // 添加业务属性
    feature.properties.attr.id = feature.properties.attr.id || `entity-${index}`
    feature.properties.attr.name = feature.properties.attr.name || `实体${index + 1}`
    feature.properties.attr.createdAt = new Date().toISOString()
    feature.properties.attr.source = 'geojson-import'
  },
  onEachEntity: (feature, entity, index) => {
    // 加载后可以进一步处理
    const attr = (entity as EntityExtension).attribute?.attr
    console.log('加载完成:', attr?.id, attr?.name)
  }
})
```

#### 5. 增量加载（保留现有数据）

```typescript
// 第一次加载
graphics.loadJson(geojson1, { clear: true })

// 增量加载（不清空现有数据）
graphics.loadJson(geojson2, { clear: false })

// 检查是否有重复 ID，避免重复加载
graphics.loadJson(geojson3, {
  clear: false,
  onEachFeature: (feature, type, index) => {
    const id = feature.properties?.attr?.id
    if (id && graphics.getEntityById(id)) {
      console.warn('实体已存在，跳过:', id)
      // 可以设置一个标志，在 onEachEntity 中跳过
      feature.properties._skip = true
    }
  },
  onEachEntity: (feature, entity, index) => {
    if (feature.properties._skip) {
      graphics.deleteEntity(entity)
      return
    }
    console.log('新增实体:', entity.id)
  }
})
```

### 加载注意事项

1. **类型识别**：
   - GeoJSON 中必须包含 `properties.type` 字段，指定标绘类型
   - 如果没有 `type`，会根据 `geometry.type` 自动推断（Point → point, LineString → polyline, Polygon → polygon）

2. **样式恢复**：
   - `properties.style` 中的样式会完整恢复
   - 可以通过 `loadJson` 的 `style` 选项全局覆盖样式

3. **业务属性**：
   - `properties.attr` 中的业务属性会保存到 `entity.attribute.attr`
   - 建议在 `onEachFeature` 中确保 `attr.id` 存在，便于后续查询

4. **坐标系统**：
   - GeoJSON 使用 WGS84 坐标系（经纬度）
   - 高度值（z 坐标）单位为米

5. **特殊类型处理**：
   - 圆形、椭圆等类型需要保留特殊参数（radius、semiMajorAxis 等）在 `properties.style` 中
   - Primitive 类型（water、flood、river、video-fusion）同样支持加载

6. **性能优化**：
   - 大量数据建议使用 `clear: false` 增量加载
   - 使用 `flyTo: false` 避免频繁相机移动
   - 在 `onEachEntity` 中进行必要的后处理

## 各类型标绘示例

### 基础点线面类型

#### 1. 点 (point)

```typescript
// 简单点
graphics.startDraw({
  type: 'point',
  style: {
    pixelSize: 10,
    color: '#ff0000',
    outline: true,
    outlineColor: '#ffffff',
    outlineWidth: 2
  },
  attr: { id: 'point-001', name: '标记点' }
})

// 带缩放距离的点
graphics.startDraw({
  type: 'point',
  style: {
    pixelSize: 15,
    color: '#00ff00',
    scaleByDistance: true,
    scaleByDistance_near: 1000,
    scaleByDistance_nearValue: 2.0,
    scaleByDistance_far: 100000,
    scaleByDistance_farValue: 0.5
  }
})
```

#### 2. 图标标注 (billboard)

```typescript
graphics.startDraw({
  type: 'billboard',
  style: {
    image: '/icons/marker.png',
    scale: 1.5,
    rotation: 0,
    horizontalOrigin: 'CENTER',
    verticalOrigin: 'BOTTOM',
    // 可选：带文字标签
    label: {
      text: '标注点',
      font: '16px sans-serif',
      fillColor: '#ffffff',
      outlineColor: '#000000',
      outlineWidth: 2,
      pixelOffset: [0, -40]
    }
  },
  attr: { id: 'billboard-001', name: '图标标注' }
})
```

#### 3. 文字标注 (label)

```typescript
graphics.startDraw({
  type: 'label',
  style: {
    text: '文字标注',
    font: 'bold 20px sans-serif',
    fillColor: '#ffffff',
    outlineColor: '#000000',
    outlineWidth: 2,
    background: true,
    background_color: '#333333',
    background_opacity: 0.8,
    pixelOffset: [0, -20]
  },
  attr: { id: 'label-001', name: '文字标注' }
})
```

#### 4. 折线 (polyline)

```typescript
// 基础折线
graphics.startDraw({
  type: 'polyline',
  style: {
    width: 3,
    color: '#00ff00',
    clampToGround: true
  },
  attr: { id: 'polyline-001', name: '路径线' }
})

// 带样式的折线
graphics.startDraw({
  type: 'polyline',
  style: {
    width: 5,
    color: '#ff6b6b',
    lineType: 'dash', // 'solid' | 'dash' | 'glow' | 'arrow' | 'animation'
    dashLength: 16,
    clampToGround: false,
    height: 100
  }
})

// 流动动画线
graphics.startDraw({
  type: 'polyline',
  style: {
    width: 4,
    color: '#409eff',
    lineType: 'animation',
    animationDuration: 2000
  }
})
```

#### 5. 曲线 (curve)

```typescript
graphics.startDraw({
  type: 'curve',
  style: {
    width: 3,
    color: '#9b59b6',
    clampToGround: true
  },
  attr: { id: 'curve-001', name: '平滑曲线' }
})
```

#### 6. 面 (polygon)

```typescript
// 基础面
graphics.startDraw({
  type: 'polygon',
  style: {
    material: '#ff6b6b',
    opacity: 0.6,
    outline: true,
    outlineColor: '#ffffff',
    outlineWidth: 2,
    clampToGround: true
  },
  attr: { id: 'polygon-001', name: '区域面' }
})

// 带高度的面
graphics.startDraw({
  type: 'polygon',
  style: {
    material: '#3498db',
    opacity: 0.7,
    height: 0,
    extrudedHeight: 100,
    outline: true,
    outlineColor: '#ffffff'
  }
})

// 扩展面（更多编辑点）
graphics.startDraw({
  type: 'polygonEx',
  style: {
    material: '#2ecc71',
    opacity: 0.5,
    outline: true
  }
})
```

#### 7. 矩形 (rectangle)

```typescript
graphics.startDraw({
  type: 'rectangle',
  style: {
    material: '#e74c3c',
    opacity: 0.6,
    outline: true,
    outlineColor: '#ffffff',
    height: 0,
    extrudedHeight: 50
  },
  attr: { id: 'rectangle-001', name: '矩形区域' }
})
```

#### 8. 圆形 (circle)

```typescript
graphics.startDraw({
  type: 'circle',
  style: {
    material: '#f39c12',
    opacity: 0.6,
    outline: true,
    outlineColor: '#ffffff',
    radius: 1000, // 米
    height: 0,
    extrudedHeight: 20
  },
  attr: { id: 'circle-001', name: '圆形区域' }
})
```

#### 9. 椭圆 (ellipse)

```typescript
graphics.startDraw({
  type: 'ellipse',
  style: {
    material: '#1abc9c',
    opacity: 0.6,
    outline: true,
    semiMajorAxis: 2000, // 长半轴（米）
    semiMinorAxis: 1000, // 短半轴（米）
    rotation: 0, // 旋转角度（弧度）
    height: 0,
    extrudedHeight: 30
  },
  attr: { id: 'ellipse-001', name: '椭圆区域' }
})
```

### 三维几何体类型

#### 10. 立方体 (box)

```typescript
graphics.startDraw({
  type: 'box',
  style: {
    material: '#e67e22',
    dimensions: {
      x: 1000, // 长度（米）
      y: 1000, // 宽度（米）
      z: 500 // 高度（米）
    },
    outline: true,
    outlineColor: '#ffffff'
  },
  attr: { id: 'box-001', name: '立方体' }
})
```

#### 11. 圆柱体 (cylinder)

```typescript
graphics.startDraw({
  type: 'cylinder',
  style: {
    material: '#3498db',
    length: 2000, // 长度（米）
    topRadius: 500, // 顶部半径（米）
    bottomRadius: 500, // 底部半径（米）
    outline: true,
    outlineColor: '#ffffff'
  },
  attr: { id: 'cylinder-001', name: '圆柱体' }
})
```

#### 12. 椭球体 (ellipsoid)

```typescript
graphics.startDraw({
  type: 'ellipsoid',
  style: {
    material: '#9b59b6',
    radii: {
      x: 1000, // X轴半径（米）
      y: 1000, // Y轴半径（米）
      z: 500 // Z轴半径（米）
    },
    outline: true,
    outlineColor: '#ffffff'
  },
  attr: { id: 'ellipsoid-001', name: '椭球体' }
})
```

#### 13. 墙体 (wall)

```typescript
graphics.startDraw({
  type: 'wall',
  style: {
    material: '#34495e',
    minimumHeights: [0, 0, 0, 0], // 底部高度数组
    maximumHeights: [100, 100, 100, 100], // 顶部高度数组
    outline: true,
    outlineColor: '#ffffff'
  },
  attr: { id: 'wall-001', name: '墙体' }
})
```

#### 14. 平面 (plane)

```typescript
graphics.startDraw({
  type: 'plane',
  style: {
    material: '#95a5a6',
    plane: new Cesium.Plane(Cesium.Cartesian3.UNIT_Z, 0), // 平面定义
    dimensions: {
      x: 2000, // X方向尺寸
      y: 2000 // Y方向尺寸
    }
  },
  attr: { id: 'plane-001', name: '平面' }
})
```

#### 15. 走廊 (corridor)

```typescript
graphics.startDraw({
  type: 'corridor',
  style: {
    material: '#16a085',
    width: 500, // 宽度（米）
    height: 0,
    extrudedHeight: 50,
    outline: true,
    outlineColor: '#ffffff'
  },
  attr: { id: 'corridor-001', name: '走廊' }
})
```

#### 16. 管道体 (polylineVolume)

```typescript
graphics.startDraw({
  type: 'polylineVolume',
  style: {
    material: '#27ae60',
    shape: [
      new Cesium.Cartesian2(-500, -500),
      new Cesium.Cartesian2(500, -500),
      new Cesium.Cartesian2(500, 500),
      new Cesium.Cartesian2(-500, 500)
    ], // 横截面形状
    outline: true,
    outlineColor: '#ffffff'
  },
  attr: { id: 'polylineVolume-001', name: '管道体' }
})
```

### 军标类型

#### 17. 攻击箭头 (attackArrow)

```typescript
graphics.startDraw({
  type: 'attackArrow',
  style: {
    material: '#e74c3c',
    opacity: 0.7,
    outline: true,
    outlineColor: '#ffffff',
    outlineWidth: 2
  },
  attr: { id: 'attackArrow-001', name: '攻击箭头' }
})
```

#### 18. 平尾攻击箭头 (attackArrowPW)

```typescript
graphics.startDraw({
  type: 'attackArrowPW',
  style: {
    material: '#c0392b',
    opacity: 0.7,
    outline: true
  },
  attr: { id: 'attackArrowPW-001', name: '平尾攻击箭头' }
})
```

#### 19. 燕尾攻击箭头 (attackArrowYW)

```typescript
graphics.startDraw({
  type: 'attackArrowYW',
  style: {
    material: '#a93226',
    opacity: 0.7,
    outline: true
  },
  attr: { id: 'attackArrowYW-001', name: '燕尾攻击箭头' }
})
```

#### 20. 双箭头 (doubleArrow)

```typescript
graphics.startDraw({
  type: 'doubleArrow',
  style: {
    material: '#8e44ad',
    opacity: 0.7,
    outline: true
  },
  attr: { id: 'doubleArrow-001', name: '双箭头' }
})
```

#### 21. 细长箭头 (fineArrow)

```typescript
graphics.startDraw({
  type: 'fineArrow',
  style: {
    material: '#7d3c98',
    opacity: 0.7,
    outline: true
  },
  attr: { id: 'fineArrow-001', name: '细长箭头' }
})
```

#### 22. 细长燕尾箭头 (fineArrowYW)

```typescript
graphics.startDraw({
  type: 'fineArrowYW',
  style: {
    material: '#6c3483',
    opacity: 0.7,
    outline: true
  },
  attr: { id: 'fineArrowYW-001', name: '细长燕尾箭头' }
})
```

#### 23. 集结地 (gatheringPlace)

```typescript
graphics.startDraw({
  type: 'gatheringPlace',
  style: {
    material: '#f39c12',
    opacity: 0.6,
    outline: true,
    outlineColor: '#ffffff'
  },
  attr: { id: 'gatheringPlace-001', name: '集结地' }
})
```

### 特殊形状类型

#### 24. 扇形 (sector)

```typescript
graphics.startDraw({
  type: 'sector',
  style: {
    material: '#3498db',
    opacity: 0.6,
    outline: true,
    startAngle: 0, // 起始角度（弧度）
    endAngle: Math.PI / 2, // 结束角度（弧度）
    radius: 2000 // 半径（米）
  },
  attr: { id: 'sector-001', name: '扇形' }
})
```

#### 25. 弓形 (lune)

```typescript
graphics.startDraw({
  type: 'lune',
  style: {
    material: '#1abc9c',
    opacity: 0.6,
    outline: true
  },
  attr: { id: 'lune-001', name: '弓形' }
})
```

#### 26. 正多边形 (regular)

```typescript
graphics.startDraw({
  type: 'regular',
  style: {
    material: '#2ecc71',
    opacity: 0.6,
    outline: true,
    sides: 6, // 边数
    radius: 1500 // 半径（米）
  },
  attr: { id: 'regular-001', name: '正六边形' }
})
```

#### 27. 等腰三角形 (isoscelesTriangle)

```typescript
graphics.startDraw({
  type: 'isoscelesTriangle',
  style: {
    material: '#e67e22',
    opacity: 0.6,
    outline: true
  },
  attr: { id: 'isoscelesTriangle-001', name: '等腰三角形' }
})
```

#### 28. 闭合曲线 (closeCurve)

```typescript
graphics.startDraw({
  type: 'closeCurve',
  style: {
    material: '#9b59b6',
    opacity: 0.6,
    outline: true
  },
  attr: { id: 'closeCurve-001', name: '闭合曲线' }
})
```

### 模型类型

#### 29. Entity 模式模型 (model)

```typescript
graphics.startDraw({
  type: 'model',
  style: {
    url: '/models/vehicle.glb',
    scale: 1.0,
    minimumPixelSize: 128,
    maximumScale: 20000,
    runAnimations: true
  },
  attr: { id: 'model-001', name: '3D模型' }
})
```

#### 30. Primitive 模式模型 (model-p)

```typescript
graphics.startDraw({
  type: 'model-p',
  style: {
    url: '/models/building.glb',
    scale: 1.5,
    minimumPixelSize: 128
  },
  attr: { id: 'model-p-001', name: 'Primitive模型' }
})
```

### 水面类型（Primitive）

#### 31. 水面 (water)

```typescript
graphics.startDraw({
  type: 'water',
  style: {
    baseWaterColor: '#1e90ff',
    blendColor: '#00bfff',
    height: 100,
    extrudedHeight: 5,
    waveType: 'ripple', // 'calm' | 'ripple' | 'wave' | 'turbulent'
    frequency: 8.0,
    amplitude: 0.01,
    animationSpeed: 0.005,
    specularIntensity: 0.5,
    opacity: 0.8
  },
  attr: { id: 'water-001', name: '水面' }
})
```

#### 32. 洪水推进 (flood)

```typescript
graphics.startDraw({
  type: 'flood',
  style: {
    baseWaterColor: '#4169e1',
    height: 50,
    extrudedHeight: 10,
    startHeight: 50,
    targetHeight: 100,
    riseSpeed: 0.5, // 米/秒
    duration: 10, // 秒
    autoStart: true,
    floodGradient: true,
    deepWaterColor: '#000080',
    shallowWaterColor: '#87ceeb'
  },
  attr: { id: 'flood-001', name: '洪水推进' }
})
```

#### 33. 动态河流 (river)

```typescript
graphics.startDraw({
  type: 'river',
  style: {
    baseWaterColor: '#4682b4',
    width: 200, // 河流宽度（米）
    depth: 5, // 河流深度（米）
    flowVelocity: 2.0, // 流速（米/秒）
    dynamicWaterLevel: true,
    waterLevelPeriod: 5, // 水位变化周期（秒）
    waterLevelAmplitude: 1, // 水位变化幅度（米）
    showRiverbed: true,
    riverbedColor: '#8b7355'
  },
  attr: { id: 'river-001', name: '动态河流' }
})
```

### 视频融合类型（Primitive）

#### 34. 视频融合 (video-fusion)

```typescript
// 2D 平面投射
graphics.startDraw({
  type: 'video-fusion',
  style: {
    videoUrl: '/videos/demo.mp4',
    sourceType: 'mp4', // 'mp4' | 'webm' | 'flv' | 'hls' | 'm3u8' | 'rtmp' | 'webrtc'
    projectionMode: '2d', // '2d' | '3d' | 'ground'
    width: 1920,
    height: 1080,
    opacity: 1.0,
    autoPlay: true,
    loop: false,
    muted: true,
    playbackRate: 1.0
  },
  attr: { id: 'video-fusion-001', name: '视频融合' }
})

// 3D 贴物投射（需要相机参数）
graphics.startDraw({
  type: 'video-fusion',
  style: {
    videoUrl: '/videos/stream.m3u8',
    sourceType: 'hls',
    projectionMode: '3d',
    showFrustum: true,      // 显示视锥体
    frustumColor: '#ffff00',
    frustumLineWidth: 2,
    opacity: 0.9
  },
  attr: {
    id: 'video-fusion-002',
    name: '3D视频投射',
    camera: {
      position: new Cesium.Cartesian3(...),
      orientation: {
        heading: 0,
        pitch: -Math.PI / 2,
        roll: 0
      },
      fov: Math.PI / 4,
      aspectRatio: 16 / 9,
      near: 0.1,
      far: 10000
    }
  }
})

// 贴地投射
graphics.startDraw({
  type: 'video-fusion',
  style: {
    videoUrl: '/videos/ground.mp4',
    projectionMode: 'ground',
    groundHeight: 0,
    opacity: 0.8
  },
  attr: { id: 'video-fusion-003', name: '贴地视频' }
})
```

### 粒子特效类型（Primitive）

#### 35. 粒子系统 (particle)

粒子系统支持火焰、水枪、爆炸、喷雾、烟雾等多种视觉特效,适用于消防演练、工业模拟、环境效果等场景。

**火焰特效 (fire)**

```typescript
graphics.startDraw({
  type: 'particle',
  style: {
    particleType: 'fire', // 粒子类型
    emissionRate: 100, // 发射速率(粒子/秒)
    particleLife: 2.0, // 粒子生命周期(秒)
    speed: 3.0, // 粒子速度(米/秒)
    minimumSpeed: 2.5, // 最小速度
    maximumSpeed: 4.0, // 最大速度
    startScale: 1.0, // 起始缩放
    endScale: 0.5, // 结束缩放
    startColor: new Cesium.Color(1.0, 0.5, 0.0, 1.0), // 起始颜色(橙色)
    endColor: new Cesium.Color(1.0, 0.0, 0.0, 0.0), // 结束颜色(红色透明)
    imageSize: new Cesium.Cartesian2(20, 20), // 粒子图片尺寸
    emitterModelMatrix: Cesium.Matrix4.fromTranslation(Cesium.Cartesian3.fromDegrees(116.4074, 39.9042, 10)), // 发射器位置矩阵
    lifetime: Infinity, // 粒子系统生命周期(Infinity为永久)
    loop: true // 是否循环
  },
  attr: { id: 'fire-001', name: '火焰特效' }
})
```

**水枪/喷泉特效 (water)**

```typescript
graphics.startDraw({
  type: 'particle',
  style: {
    particleType: 'water',
    emissionRate: 200,
    particleLife: 3.0,
    speed: 8.0,
    minimumSpeed: 6.0,
    maximumSpeed: 10.0,
    startScale: 1.5,
    endScale: 2.0,
    startColor: new Cesium.Color(0.0, 0.5, 1.0, 0.8), // 水蓝色
    endColor: new Cesium.Color(0.0, 0.3, 0.8, 0.0),
    imageSize: new Cesium.Cartesian2(15, 15),
    gravity: new Cesium.Cartesian3(0, 0, -9.8), // 重力加速度
    emitterModelMatrix: Cesium.Matrix4.fromTranslation(Cesium.Cartesian3.fromDegrees(116.4074, 39.9042, 5)),
    lifetime: Infinity,
    loop: true,
    // 喷射方向(圆锥形发射器)
    emitter: new Cesium.ConeEmitter(Cesium.Math.toRadians(30)) // 30度圆锥
  },
  attr: { id: 'water-001', name: '水枪特效' }
})
```

**爆炸特效 (explosion)**

```typescript
graphics.startDraw({
  type: 'particle',
  style: {
    particleType: 'explosion',
    emissionRate: 500, // 高发射率
    burst: [
      {
        time: 0.0,
        minimum: 300,
        maximum: 500
      }
    ], // 爆发式粒子
    particleLife: 1.5,
    speed: 15.0,
    minimumSpeed: 10.0,
    maximumSpeed: 20.0,
    startScale: 2.0,
    endScale: 8.0, // 快速扩散
    startColor: new Cesium.Color(1.0, 1.0, 0.0, 1.0), // 黄色
    endColor: new Cesium.Color(0.5, 0.0, 0.0, 0.0), // 暗红色透明
    imageSize: new Cesium.Cartesian2(30, 30),
    emitterModelMatrix: Cesium.Matrix4.fromTranslation(Cesium.Cartesian3.fromDegrees(116.4074, 39.9042, 20)),
    lifetime: 2.0, // 爆炸持续2秒
    loop: false, // 不循环
    emitter: new Cesium.SphereEmitter(5.0) // 球形发射器
  },
  attr: { id: 'explosion-001', name: '爆炸特效' }
})
```

**烟雾特效 (smoke)**

```typescript
graphics.startDraw({
  type: 'particle',
  style: {
    particleType: 'smoke',
    emissionRate: 50,
    particleLife: 4.0,
    speed: 1.0,
    minimumSpeed: 0.5,
    maximumSpeed: 1.5,
    startScale: 1.0,
    endScale: 5.0, // 烟雾逐渐扩散
    startColor: new Cesium.Color(0.3, 0.3, 0.3, 0.8), // 灰色
    endColor: new Cesium.Color(0.5, 0.5, 0.5, 0.0), // 浅灰透明
    imageSize: new Cesium.Cartesian2(25, 25),
    emitterModelMatrix: Cesium.Matrix4.fromTranslation(Cesium.Cartesian3.fromDegrees(116.4074, 39.9042, 2)),
    lifetime: Infinity,
    loop: true,
    // 向上漂浮
    forces: [
      (particle) => {
        const windVector = new Cesium.Cartesian3(1, 0, 2) // 向上和侧风
        Cesium.Cartesian3.multiplyByScalar(windVector, 0.5, windVector)
        return windVector
      }
    ]
  },
  attr: { id: 'smoke-001', name: '烟雾特效' }
})
```

**喷雾特效 (spray)**

```typescript
graphics.startDraw({
  type: 'particle',
  style: {
    particleType: 'spray',
    emissionRate: 150,
    particleLife: 2.5,
    speed: 5.0,
    minimumSpeed: 4.0,
    maximumSpeed: 6.0,
    startScale: 0.8,
    endScale: 1.5,
    startColor: new Cesium.Color(1.0, 1.0, 1.0, 0.6), // 白色半透明
    endColor: new Cesium.Color(0.8, 0.8, 1.0, 0.0),
    imageSize: new Cesium.Cartesian2(10, 10),
    emitterModelMatrix: Cesium.Matrix4.fromTranslation(Cesium.Cartesian3.fromDegrees(116.4074, 39.9042, 8)),
    lifetime: Infinity,
    loop: true,
    gravity: new Cesium.Cartesian3(0, 0, -5.0), // 轻微重力
    emitter: new Cesium.ConeEmitter(Cesium.Math.toRadians(45))
  },
  attr: { id: 'spray-001', name: '喷雾特效' }
})
```

**雨雪特效 (rain/snow)**

```typescript
// 雨
graphics.startDraw({
  type: 'particle',
  style: {
    particleType: 'rain',
    emissionRate: 1000,
    particleLife: 3.0,
    speed: 15.0,
    startScale: 0.3,
    endScale: 0.3,
    startColor: new Cesium.Color(0.6, 0.6, 0.8, 0.5),
    endColor: new Cesium.Color(0.6, 0.6, 0.8, 0.0),
    imageSize: new Cesium.Cartesian2(5, 20), // 长条形
    emitterModelMatrix: Cesium.Matrix4.fromTranslation(Cesium.Cartesian3.fromDegrees(116.4074, 39.9042, 100)),
    lifetime: Infinity,
    loop: true,
    gravity: new Cesium.Cartesian3(0, 0, -20), // 快速下落
    emitter: new Cesium.BoxEmitter(new Cesium.Cartesian3(500, 500, 10))
  },
  attr: { id: 'rain-001', name: '雨特效' }
})

// 雪
graphics.startDraw({
  type: 'particle',
  style: {
    particleType: 'snow',
    emissionRate: 500,
    particleLife: 8.0,
    speed: 2.0,
    startScale: 1.0,
    endScale: 1.0,
    startColor: new Cesium.Color(1.0, 1.0, 1.0, 0.9),
    endColor: new Cesium.Color(1.0, 1.0, 1.0, 0.0),
    imageSize: new Cesium.Cartesian2(8, 8),
    emitterModelMatrix: Cesium.Matrix4.fromTranslation(Cesium.Cartesian3.fromDegrees(116.4074, 39.9042, 100)),
    lifetime: Infinity,
    loop: true,
    gravity: new Cesium.Cartesian3(0, 0, -1.5), // 缓慢飘落
    emitter: new Cesium.BoxEmitter(new Cesium.Cartesian3(500, 500, 10)),
    // 随机飘动
    forces: [
      (particle) => {
        return new Cesium.Cartesian3(Math.random() - 0.5, Math.random() - 0.5, 0)
      }
    ]
  },
  attr: { id: 'snow-001', name: '雪特效' }
})
```

**完整配置选项**

```typescript
interface ParticleSystemStyle {
  // 基础配置
  particleType: 'fire' | 'water' | 'explosion' | 'smoke' | 'spray' | 'rain' | 'snow' | 'custom'
  image?: string // 自定义粒子图片URL
  imageSize?: Cesium.Cartesian2 // 粒子图片尺寸

  // 发射器配置
  emitter?: Cesium.ParticleEmitter // 发射器类型(圆锥、球形、盒形、圆形)
  emitterModelMatrix?: Cesium.Matrix4 // 发射器位置和方向矩阵
  emissionRate?: number // 粒子发射率(个/秒)
  burst?: Array<{
    // 爆发式粒子
    time: number // 发射时间点
    minimum: number // 最小粒子数
    maximum: number // 最大粒子数
  }>

  // 粒子生命周期
  particleLife?: number // 粒子生命周期(秒)
  minimumParticleLife?: number // 最小生命周期
  maximumParticleLife?: number // 最大生命周期
  lifetime?: number // 粒子系统总生命周期(Infinity为永久)
  loop?: boolean // 是否循环

  // 粒子运动
  speed?: number // 粒子速度(米/秒)
  minimumSpeed?: number // 最小速度
  maximumSpeed?: number // 最大速度
  gravity?: Cesium.Cartesian3 // 重力加速度
  forces?: Array<(particle: Cesium.Particle) => Cesium.Cartesian3> // 自定义力场

  // 粒子缩放
  startScale?: number // 起始缩放
  endScale?: number // 结束缩放
  minimumImageSize?: Cesium.Cartesian2 // 最小图片尺寸
  maximumImageSize?: Cesium.Cartesian2 // 最大图片尺寸

  // 粒子颜色
  startColor?: Cesium.Color // 起始颜色
  endColor?: Cesium.Color // 结束颜色

  // 显示控制
  show?: boolean // 是否显示
  sizeInMeters?: boolean // 尺寸是否以米为单位
}
```

### 使用技巧

1. **样式继承**：所有类型都支持 `material`、`opacity`、`outline` 等通用样式属性。
2. **高度设置**：面类型支持 `height`（底部高度）和 `extrudedHeight`（拉伸高度）。
3. **贴地模式**：设置 `clampToGround: true` 可以让图形贴合地形。
4. **业务属性**：通过 `attr` 字段存储业务相关的 ID、名称等信息，便于后续查询和管理。
5. **回调函数**：使用 `success` 回调在绘制完成后执行自定义逻辑。

## 各类型 GeoJSON 导出示例

### 基础导出方法

```typescript
// 导出单个实体
const entity = graphics.getEntityById('point-001')
const singleGeoJSON = graphics.toGeoJSON(entity)
// 返回: GeoJSONFeature | null

// 导出所有实体
const allGeoJSON = graphics.toGeoJSON()
// 返回: GeoJSONFeatureCollection | null

// 导出后保存
function saveGeoJSON(geojson: GeoJSONFeature | GeoJSONFeatureCollection) {
  const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'graphics.geojson'
  a.click()
  URL.revokeObjectURL(url)
}
```

### 点类型导出

#### 1. 点 (point)

```typescript
const pointEntity = graphics.startDraw({
  type: 'point',
  style: { pixelSize: 10, color: '#ff0000' },
  attr: { id: 'point-001', name: '标记点' }
})

// 导出
const pointGeoJSON = graphics.toGeoJSON(pointEntity)
// 结果示例:
// {
//   type: 'Feature',
//   geometry: {
//     type: 'Point',
//     coordinates: [116.4074, 39.9042, 0]
//   },
//   properties: {
//     type: 'point',
//     style: { pixelSize: 10, color: '#ff0000' },
//     attr: { id: 'point-001', name: '标记点' }
//   }
// }
```

#### 2. 图标标注 (billboard)

```typescript
const billboardEntity = graphics.startDraw({
  type: 'billboard',
  style: { image: '/icons/marker.png', scale: 1.5 },
  attr: { id: 'billboard-001', name: '图标标注' }
})

const billboardGeoJSON = graphics.toGeoJSON(billboardEntity)
// geometry.type: 'Point'
// properties.type: 'billboard'
```

#### 3. 文字标注 (label)

```typescript
const labelEntity = graphics.startDraw({
  type: 'label',
  style: { text: '文字标注', font: '16px sans-serif' },
  attr: { id: 'label-001', name: '文字标注' }
})

const labelGeoJSON = graphics.toGeoJSON(labelEntity)
// geometry.type: 'Point'
// properties.type: 'label'
```

### 线类型导出

#### 4. 折线 (polyline)

```typescript
const polylineEntity = graphics.startDraw({
  type: 'polyline',
  style: { width: 3, color: '#00ff00' },
  attr: { id: 'polyline-001', name: '路径线' }
})

const polylineGeoJSON = graphics.toGeoJSON(polylineEntity)
// 结果示例:
// {
//   type: 'Feature',
//   geometry: {
//     type: 'LineString',
//     coordinates: [
//       [116.4074, 39.9042, 0],
//       [116.4084, 39.9052, 0],
//       [116.4094, 39.9062, 0]
//     ]
//   },
//   properties: {
//     type: 'polyline',
//     style: { width: 3, color: '#00ff00' },
//     attr: { id: 'polyline-001', name: '路径线' }
//   }
// }
```

#### 5. 曲线 (curve)

```typescript
const curveEntity = graphics.startDraw({
  type: 'curve',
  style: { width: 3, color: '#9b59b6' },
  attr: { id: 'curve-001', name: '平滑曲线' }
})

const curveGeoJSON = graphics.toGeoJSON(curveEntity)
// geometry.type: 'LineString' (平滑后的坐标点)
// properties.type: 'curve'
```

#### 6. 管道体 (polylineVolume)

```typescript
const polylineVolumeEntity = graphics.startDraw({
  type: 'polylineVolume',
  style: { material: '#27ae60' },
  attr: { id: 'polylineVolume-001', name: '管道体' }
})

const polylineVolumeGeoJSON = graphics.toGeoJSON(polylineVolumeEntity)
// geometry.type: 'LineString'
// properties.type: 'polylineVolume'
```

#### 7. 走廊 (corridor)

```typescript
const corridorEntity = graphics.startDraw({
  type: 'corridor',
  style: { width: 500, material: '#16a085' },
  attr: { id: 'corridor-001', name: '走廊' }
})

const corridorGeoJSON = graphics.toGeoJSON(corridorEntity)
// geometry.type: 'LineString'
// properties.type: 'corridor'
```

### 面类型导出

#### 8. 面 (polygon)

```typescript
const polygonEntity = graphics.startDraw({
  type: 'polygon',
  style: { material: '#ff6b6b', opacity: 0.6 },
  attr: { id: 'polygon-001', name: '区域面' }
})

const polygonGeoJSON = graphics.toGeoJSON(polygonEntity)
// 结果示例:
// {
//   type: 'Feature',
//   geometry: {
//     type: 'Polygon',
//     coordinates: [[
//       [116.4074, 39.9042, 0],
//       [116.4084, 39.9042, 0],
//       [116.4084, 39.9052, 0],
//       [116.4074, 39.9052, 0],
//       [116.4074, 39.9042, 0]
//     ]]
//   },
//   properties: {
//     type: 'polygon',
//     style: { material: '#ff6b6b', opacity: 0.6, height: 0, extrudedHeight: 0 },
//     attr: { id: 'polygon-001', name: '区域面' }
//   }
// }
```

#### 9. 矩形 (rectangle)

```typescript
const rectangleEntity = graphics.startDraw({
  type: 'rectangle',
  style: { material: '#e74c3c', height: 0, extrudedHeight: 50 },
  attr: { id: 'rectangle-001', name: '矩形区域' }
})

const rectangleGeoJSON = graphics.toGeoJSON(rectangleEntity)
// geometry.type: 'Polygon'
// properties.type: 'rectangle'
```

#### 10. 圆形 (circle)

```typescript
const circleEntity = graphics.startDraw({
  type: 'circle',
  style: { radius: 1000, material: '#f39c12' },
  attr: { id: 'circle-001', name: '圆形区域' }
})

const circleGeoJSON = graphics.toGeoJSON(circleEntity)
// geometry.type: 'Polygon' (转换为多边形坐标)
// properties.type: 'circle'
// properties.style.radius: 1000 (保留半径信息)
```

#### 11. 椭圆 (ellipse)

```typescript
const ellipseEntity = graphics.startDraw({
  type: 'ellipse',
  style: {
    semiMajorAxis: 2000,
    semiMinorAxis: 1000,
    rotation: 0
  },
  attr: { id: 'ellipse-001', name: '椭圆区域' }
})

const ellipseGeoJSON = graphics.toGeoJSON(ellipseEntity)
// geometry.type: 'Polygon'
// properties.type: 'ellipse'
// properties.style.semiMajorAxis: 2000
// properties.style.semiMinorAxis: 1000
```

#### 12. 扇形 (sector)

```typescript
const sectorEntity = graphics.startDraw({
  type: 'sector',
  style: {
    radius: 2000,
    startAngle: 0,
    endAngle: Math.PI / 2
  },
  attr: { id: 'sector-001', name: '扇形' }
})

const sectorGeoJSON = graphics.toGeoJSON(sectorEntity)
// geometry.type: 'Polygon'
// properties.type: 'sector'
```

#### 13. 弓形 (lune)

```typescript
const luneEntity = graphics.startDraw({
  type: 'lune',
  style: { material: '#1abc9c' },
  attr: { id: 'lune-001', name: '弓形' }
})

const luneGeoJSON = graphics.toGeoJSON(luneEntity)
// geometry.type: 'Polygon'
// properties.type: 'lune'
```

#### 14. 正多边形 (regular)

```typescript
const regularEntity = graphics.startDraw({
  type: 'regular',
  style: { sides: 6, radius: 1500 },
  attr: { id: 'regular-001', name: '正六边形' }
})

const regularGeoJSON = graphics.toGeoJSON(regularEntity)
// geometry.type: 'Polygon'
// properties.type: 'regular'
// properties.style.sides: 6
// properties.style.radius: 1500
```

#### 15. 等腰三角形 (isoscelesTriangle)

```typescript
const triangleEntity = graphics.startDraw({
  type: 'isoscelesTriangle',
  style: { material: '#e67e22' },
  attr: { id: 'isoscelesTriangle-001', name: '等腰三角形' }
})

const triangleGeoJSON = graphics.toGeoJSON(triangleEntity)
// geometry.type: 'Polygon'
// properties.type: 'isoscelesTriangle'
```

#### 16. 闭合曲线 (closeCurve)

```typescript
const closeCurveEntity = graphics.startDraw({
  type: 'closeCurve',
  style: { material: '#9b59b6' },
  attr: { id: 'closeCurve-001', name: '闭合曲线' }
})

const closeCurveGeoJSON = graphics.toGeoJSON(closeCurveEntity)
// geometry.type: 'Polygon'
// properties.type: 'closeCurve'
```

#### 17. 扩展面 (polygonEx)

```typescript
const polygonExEntity = graphics.startDraw({
  type: 'polygonEx',
  style: { material: '#2ecc71' },
  attr: { id: 'polygonEx-001', name: '扩展面' }
})

const polygonExGeoJSON = graphics.toGeoJSON(polygonExEntity)
// geometry.type: 'Polygon'
// properties.type: 'polygonEx'
```

### 军标类型导出

#### 18. 攻击箭头 (attackArrow)

```typescript
const attackArrowEntity = graphics.startDraw({
  type: 'attackArrow',
  style: { material: '#e74c3c' },
  attr: { id: 'attackArrow-001', name: '攻击箭头' }
})

const attackArrowGeoJSON = graphics.toGeoJSON(attackArrowEntity)
// geometry.type: 'Polygon' (箭头形状的多边形)
// properties.type: 'attackArrow'
```

#### 19. 平尾攻击箭头 (attackArrowPW)

```typescript
const attackArrowPWEntity = graphics.startDraw({
  type: 'attackArrowPW',
  style: { material: '#c0392b' },
  attr: { id: 'attackArrowPW-001', name: '平尾攻击箭头' }
})

const attackArrowPWGeoJSON = graphics.toGeoJSON(attackArrowPWEntity)
// geometry.type: 'Polygon'
// properties.type: 'attackArrowPW'
```

#### 20. 燕尾攻击箭头 (attackArrowYW)

```typescript
const attackArrowYWEntity = graphics.startDraw({
  type: 'attackArrowYW',
  style: { material: '#a93226' },
  attr: { id: 'attackArrowYW-001', name: '燕尾攻击箭头' }
})

const attackArrowYWGeoJSON = graphics.toGeoJSON(attackArrowYWEntity)
// geometry.type: 'Polygon'
// properties.type: 'attackArrowYW'
```

#### 21. 双箭头 (doubleArrow)

```typescript
const doubleArrowEntity = graphics.startDraw({
  type: 'doubleArrow',
  style: { material: '#8e44ad' },
  attr: { id: 'doubleArrow-001', name: '双箭头' }
})

const doubleArrowGeoJSON = graphics.toGeoJSON(doubleArrowEntity)
// geometry.type: 'Polygon'
// properties.type: 'doubleArrow'
```

#### 22. 细长箭头 (fineArrow)

```typescript
const fineArrowEntity = graphics.startDraw({
  type: 'fineArrow',
  style: { material: '#7d3c98' },
  attr: { id: 'fineArrow-001', name: '细长箭头' }
})

const fineArrowGeoJSON = graphics.toGeoJSON(fineArrowEntity)
// geometry.type: 'Polygon'
// properties.type: 'fineArrow'
```

#### 23. 细长燕尾箭头 (fineArrowYW)

```typescript
const fineArrowYWEntity = graphics.startDraw({
  type: 'fineArrowYW',
  style: { material: '#6c3483' },
  attr: { id: 'fineArrowYW-001', name: '细长燕尾箭头' }
})

const fineArrowYWGeoJSON = graphics.toGeoJSON(fineArrowYWEntity)
// geometry.type: 'Polygon'
// properties.type: 'fineArrowYW'
```

#### 24. 集结地 (gatheringPlace)

```typescript
const gatheringPlaceEntity = graphics.startDraw({
  type: 'gatheringPlace',
  style: { material: '#f39c12' },
  attr: { id: 'gatheringPlace-001', name: '集结地' }
})

const gatheringPlaceGeoJSON = graphics.toGeoJSON(gatheringPlaceEntity)
// geometry.type: 'Polygon'
// properties.type: 'gatheringPlace'
```

### 三维几何体类型导出

#### 25. 立方体 (box)

```typescript
const boxEntity = graphics.startDraw({
  type: 'box',
  style: {
    dimensions: { x: 1000, y: 1000, z: 500 }
  },
  attr: { id: 'box-001', name: '立方体' }
})

const boxGeoJSON = graphics.toGeoJSON(boxEntity)
// geometry.type: 'Point' (中心点)
// properties.type: 'box'
// properties.style.dimensions: { x: 1000, y: 1000, z: 500 }
```

#### 26. 圆柱体 (cylinder)

```typescript
const cylinderEntity = graphics.startDraw({
  type: 'cylinder',
  style: {
    length: 2000,
    topRadius: 500,
    bottomRadius: 500
  },
  attr: { id: 'cylinder-001', name: '圆柱体' }
})

const cylinderGeoJSON = graphics.toGeoJSON(cylinderEntity)
// geometry.type: 'Point'
// properties.type: 'cylinder'
// properties.style.length: 2000
// properties.style.topRadius: 500
// properties.style.bottomRadius: 500
```

#### 27. 椭球体 (ellipsoid)

```typescript
const ellipsoidEntity = graphics.startDraw({
  type: 'ellipsoid',
  style: {
    radii: { x: 1000, y: 1000, z: 500 }
  },
  attr: { id: 'ellipsoid-001', name: '椭球体' }
})

const ellipsoidGeoJSON = graphics.toGeoJSON(ellipsoidEntity)
// geometry.type: 'Point'
// properties.type: 'ellipsoid'
// properties.style.radii: { x: 1000, y: 1000, z: 500 }
```

#### 28. 墙体 (wall)

```typescript
const wallEntity = graphics.startDraw({
  type: 'wall',
  style: {
    minimumHeights: [0, 0, 0, 0],
    maximumHeights: [100, 100, 100, 100]
  },
  attr: { id: 'wall-001', name: '墙体' }
})

const wallGeoJSON = graphics.toGeoJSON(wallEntity)
// geometry.type: 'LineString' (墙体路径)
// properties.type: 'wall'
// properties.style.minimumHeights: [0, 0, 0, 0]
// properties.style.maximumHeights: [100, 100, 100, 100]
```

#### 29. 平面 (plane)

```typescript
const planeEntity = graphics.startDraw({
  type: 'plane',
  style: {
    dimensions: { x: 2000, y: 2000 }
  },
  attr: { id: 'plane-001', name: '平面' }
})

const planeGeoJSON = graphics.toGeoJSON(planeEntity)
// geometry.type: 'Polygon'
// properties.type: 'plane'
```

### 模型类型导出

#### 30. Entity 模式模型 (model)

```typescript
const modelEntity = graphics.startDraw({
  type: 'model',
  style: {
    url: '/models/vehicle.glb',
    scale: 1.0
  },
  attr: { id: 'model-001', name: '3D模型' }
})

const modelGeoJSON = graphics.toGeoJSON(modelEntity)
// geometry.type: 'Point' (模型位置)
// properties.type: 'model'
// properties.style.url: '/models/vehicle.glb'
// properties.style.scale: 1.0
```

#### 31. Primitive 模式模型 (model-p)

```typescript
const modelPEntity = graphics.startDraw({
  type: 'model-p',
  style: {
    url: '/models/building.glb',
    scale: 1.5
  },
  attr: { id: 'model-p-001', name: 'Primitive模型' }
})

const modelPGeoJSON = graphics.toGeoJSON(modelPEntity)
// geometry.type: 'Point'
// properties.type: 'model-p'
// properties.style.url: '/models/building.glb'
```

### 水面类型导出（Primitive）

#### 32. 水面 (water)

```typescript
const waterEntity = graphics.startDraw({
  type: 'water',
  style: {
    baseWaterColor: '#1e90ff',
    height: 100,
    extrudedHeight: 5,
    waveType: 'ripple'
  },
  attr: { id: 'water-001', name: '水面' }
})

const waterGeoJSON = graphics.toGeoJSON(waterEntity)
// geometry.type: 'Polygon' (水面边界)
// properties.type: 'water'
// properties.style.baseWaterColor: '#1e90ff'
// properties.style.height: 100
// properties.style.extrudedHeight: 5
// properties.style.waveType: 'ripple'
```

#### 33. 洪水推进 (flood)

```typescript
const floodEntity = graphics.startDraw({
  type: 'flood',
  style: {
    startHeight: 50,
    targetHeight: 100,
    riseSpeed: 0.5
  },
  attr: { id: 'flood-001', name: '洪水推进' }
})

const floodGeoJSON = graphics.toGeoJSON(floodEntity)
// geometry.type: 'Polygon'
// properties.type: 'flood'
// properties.style.startHeight: 50
// properties.style.targetHeight: 100
// properties.style.riseSpeed: 0.5
```

#### 34. 动态河流 (river)

```typescript
const riverEntity = graphics.startDraw({
  type: 'river',
  style: {
    width: 200,
    depth: 5,
    flowVelocity: 2.0
  },
  attr: { id: 'river-001', name: '动态河流' }
})

const riverGeoJSON = graphics.toGeoJSON(riverEntity)
// geometry.type: 'LineString' (河流中心线)
// properties.type: 'river'
// properties.style.width: 200
// properties.style.depth: 5
// properties.style.flowVelocity: 2.0
```

### 视频融合类型导出（Primitive）

#### 35. 视频融合 (video-fusion)

```typescript
const videoEntity = graphics.startDraw({
  type: 'video-fusion',
  style: {
    videoUrl: '/videos/demo.mp4',
    projectionMode: '2d',
    width: 1920,
    height: 1080
  },
  attr: {
    id: 'video-fusion-001',
    name: '视频融合',
    camera: {
      position: new Cesium.Cartesian3(...),
      orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 },
      fov: Math.PI / 4
    }
  }
})

const videoGeoJSON = graphics.toGeoJSON(videoEntity)
// geometry.type: 'Polygon' (视频投射区域)
// properties.type: 'video-fusion'
// properties.style.videoUrl: '/videos/demo.mp4'
// properties.style.projectionMode: '2d'
// properties.attr.camera: { ... } (3D投射时的相机参数)
```

#### 36. 粒子系统 (particle)

```typescript
const particleEntity = graphics.startDraw({
  type: 'particle',
  style: {
    particleType: 'fire',
    emissionRate: 100,
    particleLife: 2.0,
    speed: 3.0,
    startScale: 1.0,
    endScale: 0.5,
    startColor: new Cesium.Color(1.0, 0.5, 0.0, 1.0),
    endColor: new Cesium.Color(1.0, 0.0, 0.0, 0.0),
    imageSize: new Cesium.Cartesian2(20, 20),
    emitterModelMatrix: Cesium.Matrix4.fromTranslation(Cesium.Cartesian3.fromDegrees(116.4074, 39.9042, 10)),
    lifetime: Infinity,
    loop: true
  },
  attr: { id: 'particle-001', name: '火焰特效' }
})

const particleGeoJSON = graphics.toGeoJSON(particleEntity)
// 结果示例:
// {
//   type: 'Feature',
//   geometry: {
//     type: 'Point',
//     coordinates: [116.4074, 39.9042, 10]
//   },
//   properties: {
//     type: 'particle',
//     style: {
//       particleType: 'fire',
//       emissionRate: 100,
//       particleLife: 2.0,
//       speed: 3.0,
//       startScale: 1.0,
//       endScale: 0.5,
//       startColor: { red: 1.0, green: 0.5, blue: 0.0, alpha: 1.0 },
//       endColor: { red: 1.0, green: 0.0, blue: 0.0, alpha: 0.0 },
//       imageSize: { x: 20, y: 20 },
//       lifetime: -1, // Infinity 转换为 -1
//       loop: true
//     },
//     attr: { id: 'particle-001', name: '火焰特效' }
//   }
// }
```

### 批量导出示例

```typescript
// 1. 导出所有实体
const allGeoJSON = graphics.toGeoJSON()
if (allGeoJSON && 'features' in allGeoJSON) {
  console.log(`共导出 ${allGeoJSON.features.length} 个实体`)
  saveGeoJSON(allGeoJSON)
}

// 2. 按类型分组导出
function exportByType(type: string): GeoJSONFeatureCollection | null {
  const entities = graphics.getEntitys().filter((entity) => {
    const attr = (entity as EntityExtension).attribute
    return attr?.type === type
  })

  const features: GeoJSONFeature[] = []
  entities.forEach((entity) => {
    const geojson = graphics.toGeoJSON(entity)
    if (geojson && 'type' in geojson && geojson.type === 'Feature') {
      features.push(geojson as GeoJSONFeature)
    }
  })

  return features.length > 0 ? { type: 'FeatureCollection', features } : null
}

// 使用示例
const polygonCollection = exportByType('polygon')
if (polygonCollection) {
  saveGeoJSON(polygonCollection)
}

// 3. 导出指定业务属性的实体
function exportByAttr(key: string, value: unknown): GeoJSONFeatureCollection | null {
  const entities = graphics.getEntitys().filter((entity) => {
    const attr = (entity as EntityExtension).attribute?.attr
    return attr && attr[key] === value
  })

  const features: GeoJSONFeature[] = []
  entities.forEach((entity) => {
    const geojson = graphics.toGeoJSON(entity)
    if (geojson && 'type' in geojson && geojson.type === 'Feature') {
      features.push(geojson as GeoJSONFeature)
    }
  })

  return features.length > 0 ? { type: 'FeatureCollection', features } : null
}

// 导出所有告警级别的实体
const warningCollection = exportByAttr('level', 'warning')
if (warningCollection) {
  saveGeoJSON(warningCollection)
}

// 4. 导出并格式化（美化JSON）
function exportFormatted(entity?: Entity): string {
  const geojson = graphics.toGeoJSON(entity)
  return JSON.stringify(geojson, null, 2)
}

// 5. 导出并压缩（去除空格）
function exportMinified(entity?: Entity): string {
  const geojson = graphics.toGeoJSON(entity)
  return JSON.stringify(geojson)
}
```

### 导出注意事项

1. **几何类型映射**：
   - 点类型（point、billboard、label）→ `Point`
   - 线类型（polyline、curve、corridor、wall、river）→ `LineString`
   - 面类型（polygon、rectangle、circle、ellipse等）→ `Polygon`
   - 三维体（box、cylinder、ellipsoid）→ `Point`（中心点）+ 样式参数

2. **样式保留**：所有样式信息都会保存在 `properties.style` 中，包括颜色、透明度、尺寸等。

3. **业务属性**：`properties.attr` 中保存的业务属性（如 id、name）会完整保留。

4. **高度信息**：对于有高度的实体，`properties.style.height` 和 `properties.style.extrudedHeight` 会保留。

5. **特殊参数**：某些类型的特殊参数（如圆的 radius、椭圆的 semiMajorAxis 等）会保留在 `properties.style` 中，便于重新加载时恢复。

6. **Primitive 类型**：Primitive 类型（water、flood、river、video-fusion、model-p）同样支持导出，会转换为对应的 GeoJSON 格式。

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

### 场景 3.1：Primitive 标绘完成后的编辑流程

```typescript
import { EventType, TransformMode, TransformSpace } from '@auto-cesium/plugins'

// 1. 绘制 Primitive 类型（如水面、洪水、河流、视频融合等）
let currentPrimitive: Entity | Cesium.Primitive | null = null

graphics.startDraw({
  type: 'water', // 或 'flood', 'river', 'video-fusion' 等
  style: {
    baseWaterColor: '#1e90ff',
    height: 100,
    extrudedHeight: 5,
    waveType: 'ripple',
    frequency: 8.0,
    amplitude: 0.01
  },
  attr: {
    id: 'water-001',
    name: '水库区域'
  },
  success: (entity) => {
    currentPrimitive = entity
    console.log('Primitive 标绘完成', entity)

    // 标绘完成后自动进入编辑模式
    graphics.startEditing(entity)
  }
})

// 2. 监听绘制完成事件，自动进入编辑
graphics.on(EventType.DrawCreated, ({ entity }) => {
  if (entity) {
    // 检查是否为 Primitive 类型
    const attr = (entity as EntityExtension).attribute
    const isPrimitive = ['water', 'flood', 'river', 'video-fusion', 'model-p'].includes(attr?.type as string)

    if (isPrimitive) {
      // 启用编辑模式
      graphics.hasEdit(true)

      // 启动编辑
      graphics.startEditing(entity)

      // 如果支持变换，启用 TransformPlugin
      if (graphics.getTransformPlugin()) {
        graphics.enableTransform()
        graphics.setTransformMode(TransformMode.TRANSLATE)
        graphics.setTransformSpace(TransformSpace.WORLD)
      }
    }
  }
})

// 3. 通过点击选择已绘制的 Primitive 进行编辑
const eventPlugin = viewer.getPlugin('event')
eventPlugin?.onLeftClick((pickInfo) => {
  const picked = pickInfo?.pickedObject

  if (picked) {
    // 检查是否为 Primitive（通过 id 或 primitive 属性）
    const primitive = (picked as any).primitive || picked
    const entity = (picked as any).id || primitive

    // 判断是否属于 GraphicsPlugin 管理的 Primitive
    if (graphics.isMyEntity(entity)) {
      const attr = (entity as EntityExtension).attribute
      const isPrimitive = ['water', 'flood', 'river', 'video-fusion', 'model-p'].includes(attr?.type as string)

      if (isPrimitive) {
        // 停止当前编辑
        graphics.stopEditing()

        // 开始编辑选中的 Primitive
        graphics.startEditing(entity)

        // 启用变换控制器
        if (graphics.getTransformPlugin()) {
          graphics.enableTransform()
        }
      }
    }
  } else {
    // 点击空白处，停止编辑
    graphics.stopEditing()
  }
})

// 4. 编辑 Primitive 的属性（位置、样式等）
function editPrimitivePosition(entityId: string, newPositions: Cesium.Cartesian3[]) {
  const entity = graphics.getEntityById(entityId)
  if (!entity) return

  // 更新位置
  graphics.setPositions(newPositions, entity)

  // 如果是水面类型，可以更新水位高度
  const attr = (entity as EntityExtension).attribute
  if (attr?.type === 'water' || attr?.type === 'flood') {
    // 通过 updateAttribute 更新样式中的高度
    graphics.updateAttribute(
      {
        style: {
          height: newPositions[0]?.z || 100,
          extrudedHeight: 5
        }
      },
      entity
    )
  }
}

// 5. 编辑 Primitive 的样式
function editPrimitiveStyle(entityId: string, styleUpdates: Record<string, unknown>) {
  const entity = graphics.getEntityById(entityId)
  if (!entity) return

  // 更新样式
  graphics.updateStyle(styleUpdates, entity)

  // 对于特定类型，可能需要特殊处理
  const attr = (entity as EntityExtension).attribute
  if (attr?.type === 'water') {
    // 水面样式更新示例
    graphics.updateAttribute(
      {
        style: {
          ...attr.style,
          ...styleUpdates,
          baseWaterColor: styleUpdates.baseWaterColor || attr.style?.baseWaterColor,
          waveType: styleUpdates.waveType || attr.style?.waveType
        }
      },
      entity
    )
  } else if (attr?.type === 'video-fusion') {
    // 视频融合样式更新示例
    graphics.updateAttribute(
      {
        style: {
          ...attr.style,
          ...styleUpdates,
          opacity: styleUpdates.opacity ?? attr.style?.opacity,
          brightness: styleUpdates.brightness ?? attr.style?.brightness
        }
      },
      entity
    )
  }
}

// 6. 使用 TransformPlugin 进行交互式编辑
function enablePrimitiveTransform(entityId: string) {
  const entity = graphics.getEntityById(entityId)
  if (!entity) return

  // 确保编辑模式已启用
  graphics.hasEdit(true)
  graphics.startEditing(entity)

  // 启用变换控制器
  graphics.enableTransform()
  graphics.setTransformMode(TransformMode.TRANSLATE) // 或 ROTATE, SCALE

  // 监听变换完成事件（通过 TransformPlugin）
  const transformPlugin = graphics.getTransformPlugin()
  if (transformPlugin) {
    // TransformPlugin 通常会在变换时触发事件
    // 这里需要根据实际的 TransformPlugin API 来监听
  }
}

// 7. 完整示例：绘制水面并编辑
async function drawAndEditWater() {
  // 步骤1：绘制水面
  const waterEntity = graphics.startDraw({
    type: 'water',
    style: {
      baseWaterColor: '#4169e1',
      height: 50,
      extrudedHeight: 10,
      waveType: 'wave',
      frequency: 15.0,
      amplitude: 0.02
    },
    attr: {
      id: 'water-' + Date.now(),
      name: '新建水面'
    }
  })

  // 步骤2：等待绘制完成（通过事件或 Promise）
  return new Promise<void>((resolve) => {
    graphics.on(EventType.DrawCreated, ({ entity }) => {
      if (entity === waterEntity) {
        // 步骤3：进入编辑模式
        graphics.hasEdit(true)
        graphics.startEditing(entity)

        // 步骤4：启用变换控制器
        graphics.enableTransform()
        graphics.setTransformMode(TransformMode.TRANSLATE)

        resolve()
      }
    })
  })
}

// 使用示例
drawAndEditWater().then(() => {
  console.log('水面绘制完成，已进入编辑模式')

  // 后续可以通过 UI 控件调用 editPrimitiveStyle 来修改样式
  // 或通过 TransformPlugin 拖拽来调整位置
})
```

**关键要点：**

- **Primitive 类型识别**：通过 `entity.attribute.type` 判断是否为 Primitive 类型（`water`、`flood`、`river`、`video-fusion`、`model-p` 等）。
- **编辑入口**：使用 `graphics.startEditing(entity)` 启动编辑，支持 Entity 和 Primitive 对象。
- **位置编辑**：通过 `graphics.setPositions()` 更新坐标，会自动刷新编辑器的拖拽点。
- **样式编辑**：使用 `graphics.updateStyle()` 或 `graphics.updateAttribute()` 更新样式，某些类型（如水面、视频）可能需要特殊处理。
- **TransformPlugin 配合**：对于支持变换的 Primitive（有 `position` 或 `modelMatrix`），可启用 `TransformPlugin` 进行交互式移动/旋转/缩放。
- **事件监听**：通过 `EventType.DrawCreated`、`EventType.EditStart` 等事件监听编辑状态变化。

### 场景 4：事件联动与属性面板

```typescript
import { useState } from 'react'
import { EventType } from '@auto-cesium/plugins'

const [selectedId, setSelectedId] = useState<string>()
const [styleForm, setStyleForm] = useState({ material: '#ff6b6b', outlineWidth: 2 })

graphics.on(EventType.EditStart, ({ entity }) => {
  const attr = entity?.attribute
  setSelectedId(attr?.attr?.id)
  setStyleForm({
    material: String(attr?.style?.material || '#ff6b6b'),
    outlineWidth: Number(attr?.style?.outlineWidth || 1)
  })
})

function applyStyle() {
  if (selectedId) {
    const entity = graphics.getEntityById(selectedId)
    graphics.updateStyle(
      {
        material: styleForm.material,
        outlineWidth: styleForm.outlineWidth
      },
      entity || undefined
    )
  }
}
```

- 监听 `edit-start` 事件后，将当前实体属性同步到表单，并允许用户实时修改样式。

### 场景 5：聚合点击联动弹窗

```typescript
graphics.setClusterOptions({
  enabled: true,
  clusterStyle: {
    color: '#ffaf40',
    pixelSize: 32,
    labelColor: '#fff'
  },
  clusterEvent: (clusteredEntities, cluster) => {
    cluster.billboard.scale = 1.2
    cluster.billboard.color = Cesium.Color.ORANGE
    cluster.label.text = `${clusteredEntities.length} 个告警`
    cluster.billboard.id = { type: 'cluster', members: clusteredEntities }
  }
})

const event = viewer.getPlugin('event')
event?.onLeftClick((pickInfo) => {
  const id = pickInfo?.pickedObject?.id
  if (id?.type === 'cluster') {
    popup.createHTML(
      `<div>共 ${id.members.length} 个告警点</div>`,
      pickInfo.position ? [pickInfo.position.x, pickInfo.position.y] : undefined,
      { positionType: 'screen' }
    )
  }
})
```

- 自定义聚合图标后，通过 EventPlugin 捕获聚合点点击，展示聚合详情。

### 场景 6：自定义绘制 + 编辑

```typescript
class DrawFence extends DrawPolygon {
  constructor(config: DrawConfig) {
    super(config)
    this.attrClass = {
      ...this.attrClass,
      getCoordinates: (entity) => super.attrClass?.getCoordinates?.(entity) || null
    }
  }

  override activate(attribute: DrawAttribute, cb?: (entity: Entity) => void) {
    attribute.style = {
      clampToGround: true,
      material: Cesium.Color.fromCssColorString((attribute.style?.material as string) || '#3498db'),
      outline: true,
      outlineColor: '#ffffff',
      ...attribute.style
    }
    return super.activate(attribute, (entity) => {
      entity.attribute = {
        ...(entity.attribute || {}),
        attr: { type: 'fence', ...attribute.attr }
      }
      entity.editing = new EditPolygon(entity, this.viewer, this.dataSource!)
      cb?.(entity)
    })
  }
}

register('fence', DrawFence)

// 启动
graphics.startDraw({
  type: 'fence',
  style: { material: '#1abc9c', extrudedHeight: 20 },
  attr: { id: 'fence-01' }
})
```

- 继承 `DrawPolygon` 定制样式、属性及编辑器，让新类型完整接入 `loadJson`、编辑、事件等能力。

### 场景 7：湖泊/水库模拟（`water`）

```typescript
import { WaveType } from '@auto-cesium/plugins'

const lake = graphics.startDraw({
  type: 'water',
  style: {
    baseWaterColor: 'rgba(0,132,255,0.65)',
    blendColor: '#4dd2ff',
    waveType: 'ripple' satisfies WaveType,
    normalMap: '/textures/water-normal.png',
    flowDirection: Cesium.Math.toRadians(45),
    flowSpeed: 0.8,
    extrudedHeight: 3,
    fadeFactor: 0.4
  },
  attr: {
    id: 'lake-01',
    waterType: 'lake'
  }
})

graphics.startEditing(lake!)
```

- `water` 类型基于 `WaterMaterial`，可通过 `waveType`、`frequency`、`amplitude`、`flowSpeed` 等参数控制波纹与流向，支持 `normalMap` 自定义法线。
- `attr.waterType` 可用于区分 `lake`、`ocean` 等业务语义；编辑模式下可拖拽控制水域范围。

### 场景 8：洪水推进/淹没演练（`flood`）

```typescript
const flood = graphics.startDraw({
  type: 'flood',
  style: {
    startHeight: 1.5,
    targetHeight: 8,
    duration: 90,
    loop: false,
    baseWaterColor: 'rgba(64,158,255,0.85)',
    shallowWaterColor: '#b3e5fc',
    deepWaterColor: '#01579b'
  },
  attr: { id: 'flood-demo' }
})

// 触发二次抬升
setTimeout(() => {
  graphics.updateAttribute(
    {
      style: {
        targetHeight: 12,
        duration: 45
      }
    },
    flood || undefined
  )
}, 8000)
```

- `flood` 在 `startHeight → targetHeight` 间插值动画，可通过 `duration`、`riseSpeed`、`loop` 控制推进过程，并支持浅水/深水渐变。
- 调用 `graphics.updateAttribute` 即可在运行时修改水位或颜色，动画会自动过渡到新的目标高度。

### 场景 9：河流断面 + 水位动画（`river`）

```typescript
const river = graphics.startDraw({
  type: 'river',
  style: {
    baseWaterColor: '#1abc9c',
    width: 45,
    depth: 6,
    dynamicWaterLevel: true,
    waterLevelPeriod: 30,
    waterLevelAmplitude: 2,
    flowVelocity: 3,
    crossSections: [
      { position: Cesium.Cartesian3.fromDegrees(120.1, 30.2), width: 30, depth: 5, waterLevel: 1 },
      { position: Cesium.Cartesian3.fromDegrees(120.3, 30.25), width: 40, depth: 6, waterLevel: 1.2 }
    ]
  },
  attr: { id: 'river-main' }
})
```

- `river` 支持设置多段 `crossSections` 来模拟河床宽度/深度，并内置 `dynamicWaterLevel` 水位震荡动画。
- `flowVelocity`、`flowDirection`（通过 `style.flowDirection`）可营造流动感，适合洪水演练、泄洪可视化等场景。

### 场景 10：视频融合投射（`video-fusion`）

```typescript
import type { VideoProjectionCamera } from '@auto-cesium/plugins'

const camera: VideoProjectionCamera = {
  position: Cesium.Cartesian3.fromDegrees(116.391, 39.907, 80),
  orientation: {
    heading: Cesium.Math.toRadians(180),
    pitch: Cesium.Math.toRadians(-12),
    roll: 0
  },
  fov: Cesium.Math.toRadians(60),
  aspectRatio: 16 / 9,
  near: 0.1,
  far: 500
}

const video = graphics.startDraw({
  type: 'video-fusion',
  style: {
    videoUrl: 'https://media.example.com/stream/site01.m3u8',
    sourceType: 'hls',
    projectionMode: 'ground',
    width: 80,
    height: 45,
    opacity: 0.95,
    autoPlay: true,
    loop: true,
    showFrustum: true,
    frustumColor: '#ffaf40'
  },
  config: {
    editable: true,
    controlPointSize: 14
  },
  camera
})

// 控制播放
const videoPrimitive = video as unknown as { play?: () => Promise<void>; pause?: () => void }
videoPrimitive?.play?.()

// 支持自定义 HLS/FLV：确保在入口文件引入 hls.js / flv.js，全局挂载 Hls / flvjs
```

- `video-fusion` 会自动创建隐藏的 `<video>` 元素并生成 `VideoMaterial`，支持 MP4/WebM/FLV/HLS/RTMP/WEBRTC，`projectionMode` 可在 `2d`/`3d`/`ground` 间切换。
- `camera` 参数可指定投射相机，启用 `showFrustum` 可实时查看视锥体，便于标定；可通过返回对象上的 `play/pause/stop/setVolume` 等方法控制播放。
- 若使用 HLS/FLV 流，请在业务入口引入对应播放器库（`hls.js`、`flv.js`）并挂载到全局，GraphicsPlugin 会自动调用。

### 场景 10.1：消防演练粒子特效（`particle`）

```typescript
import type { ParticleSystemStyle } from '@auto-cesium/plugins'

// 消防演练场景管理器
class FireDrillManager {
  private particles: Map<string, Entity | Cesium.Primitive> = new Map()

  constructor(private graphics: GraphicsPlugin) {}

  // 创建火源
  createFireSource(buildingId: string, position: Cesium.Cartesian3) {
    const fire = this.graphics.startDraw({
      type: 'particle',
      style: {
        particleType: 'fire',
        emissionRate: 150,
        particleLife: 2.5,
        speed: 4.0,
        minimumSpeed: 3.0,
        maximumSpeed: 5.0,
        startScale: 1.5,
        endScale: 0.3,
        startColor: new Cesium.Color(1.0, 0.6, 0.0, 1.0), // 橙黄色火焰
        endColor: new Cesium.Color(0.8, 0.0, 0.0, 0.0), // 红色透明
        imageSize: new Cesium.Cartesian2(25, 25),
        emitterModelMatrix: Cesium.Matrix4.fromTranslation(position),
        lifetime: Infinity,
        loop: true
      },
      attr: {
        id: `fire-${buildingId}`,
        name: `建筑${buildingId}火源`,
        buildingId,
        hazardType: 'fire'
      }
    })

    this.particles.set(`fire-${buildingId}`, fire!)

    // 同时添加烟雾效果
    this.createSmoke(buildingId, position)
  }

  // 创建烟雾
  createSmoke(buildingId: string, position: Cesium.Cartesian3) {
    const smokePosition = Cesium.Matrix4.clone(Cesium.Matrix4.fromTranslation(position), new Cesium.Matrix4())
    Cesium.Matrix4.multiplyByTranslation(
      smokePosition,
      new Cesium.Cartesian3(0, 0, 5), // 烟雾在火焰上方
      smokePosition
    )

    const smoke = this.graphics.startDraw({
      type: 'particle',
      style: {
        particleType: 'smoke',
        emissionRate: 80,
        particleLife: 5.0,
        speed: 1.5,
        minimumSpeed: 1.0,
        maximumSpeed: 2.0,
        startScale: 1.0,
        endScale: 6.0, // 烟雾逐渐扩散
        startColor: new Cesium.Color(0.2, 0.2, 0.2, 0.9), // 深灰色
        endColor: new Cesium.Color(0.6, 0.6, 0.6, 0.0), // 浅灰透明
        imageSize: new Cesium.Cartesian2(30, 30),
        emitterModelMatrix: smokePosition,
        lifetime: Infinity,
        loop: true,
        forces: [
          (particle) => {
            // 风向影响
            const windVector = new Cesium.Cartesian3(0.5, 0.3, 1.5)
            return Cesium.Cartesian3.multiplyByScalar(windVector, 0.8, new Cesium.Cartesian3())
          }
        ]
      },
      attr: {
        id: `smoke-${buildingId}`,
        name: `建筑${buildingId}烟雾`,
        buildingId
      }
    })

    this.particles.set(`smoke-${buildingId}`, smoke!)
  }

  // 启动水枪灭火
  startWaterSpray(truckId: string, position: Cesium.Cartesian3, targetDirection: Cesium.Cartesian3) {
    const angle = Cesium.Math.toRadians(25) // 水枪喷射角度

    const water = this.graphics.startDraw({
      type: 'particle',
      style: {
        particleType: 'water',
        emissionRate: 300,
        particleLife: 2.0,
        speed: 12.0,
        minimumSpeed: 10.0,
        maximumSpeed: 15.0,
        startScale: 1.0,
        endScale: 2.0,
        startColor: new Cesium.Color(0.2, 0.5, 1.0, 0.7), // 水蓝色
        endColor: new Cesium.Color(0.1, 0.4, 0.9, 0.0),
        imageSize: new Cesium.Cartesian2(12, 12),
        emitterModelMatrix: Cesium.Matrix4.fromTranslation(position),
        gravity: new Cesium.Cartesian3(0, 0, -9.8),
        lifetime: Infinity,
        loop: true,
        emitter: new Cesium.ConeEmitter(angle)
      },
      attr: {
        id: `water-${truckId}`,
        name: `消防车${truckId}水枪`,
        truckId,
        targetDirection
      }
    })

    this.particles.set(`water-${truckId}`, water!)
  }

  // 停止水枪
  stopWaterSpray(truckId: string) {
    const waterId = `water-${truckId}`
    const water = this.particles.get(waterId)
    if (water) {
      this.graphics.deleteEntity(water as Entity)
      this.particles.delete(waterId)
    }
  }

  // 火源扑灭
  extinguishFire(buildingId: string) {
    // 移除火焰
    const fireId = `fire-${buildingId}`
    const fire = this.particles.get(fireId)
    if (fire) {
      this.graphics.deleteEntity(fire as Entity)
      this.particles.delete(fireId)
    }

    // 保留烟雾一段时间后逐渐消散
    const smokeId = `smoke-${buildingId}`
    const smoke = this.particles.get(smokeId)
    if (smoke) {
      setTimeout(() => {
        this.graphics.deleteEntity(smoke as Entity)
        this.particles.delete(smokeId)
      }, 10000) // 10秒后烟雾消失
    }
  }

  // 清理所有特效
  clearAll() {
    this.particles.forEach((particle) => {
      this.graphics.deleteEntity(particle as Entity)
    })
    this.particles.clear()
  }
}

// 使用示例
const fireDrill = new FireDrillManager(graphics)

// 创建火源点
const firePosition = Cesium.Cartesian3.fromDegrees(116.4074, 39.9042, 15)
fireDrill.createFireSource('building-A', firePosition)

// 消防车到达，启动水枪
const truckPosition = Cesium.Cartesian3.fromDegrees(116.4064, 39.904, 2)
const targetDirection = Cesium.Cartesian3.subtract(firePosition, truckPosition, new Cesium.Cartesian3())
fireDrill.startWaterSpray('truck-01', truckPosition, targetDirection)

// 5分钟后火灾扑灭
setTimeout(() => {
  fireDrill.extinguishFire('building-A')
  fireDrill.stopWaterSpray('truck-01')
}, 300000)
```

**应用要点：**

- **火焰与烟雾叠加**：通过组合 `fire` 和 `smoke` 粒子系统模拟真实火灾场景
- **水枪喷射**：使用 `ConeEmitter` 和重力模拟水枪轨迹，`emitterModelMatrix` 控制喷射方向
- **动态控制**：通过 `deleteEntity` 动态添加/移除粒子效果，配合业务逻辑实现交互式演练
- **性能优化**：合理控制 `emissionRate` 和 `particleLife`，避免大量粒子导致性能下降

### 场景 10.2：工业爆炸模拟（`particle`）

```typescript
// 爆炸效果管理器
class ExplosionSimulator {
  constructor(private graphics: GraphicsPlugin) {}

  // 触发爆炸
  triggerExplosion(position: Cesium.Cartesian3, intensity: 'small' | 'medium' | 'large' = 'medium') {
    const config = this.getExplosionConfig(intensity)

    // 第一阶段：爆炸闪光
    const flash = this.graphics.startDraw({
      type: 'particle',
      style: {
        particleType: 'explosion',
        emissionRate: 0,
        burst: [
          {
            time: 0.0,
            minimum: config.flashParticles,
            maximum: config.flashParticles
          }
        ],
        particleLife: 0.5,
        speed: 5.0,
        startScale: 3.0,
        endScale: 15.0,
        startColor: new Cesium.Color(1.0, 1.0, 0.8, 1.0), // 明黄色
        endColor: new Cesium.Color(1.0, 0.5, 0.0, 0.0),
        imageSize: new Cesium.Cartesian2(40, 40),
        emitterModelMatrix: Cesium.Matrix4.fromTranslation(position),
        lifetime: 0.5,
        loop: false,
        emitter: new Cesium.SphereEmitter(2.0)
      },
      attr: { id: `explosion-flash-${Date.now()}` }
    })

    // 第二阶段：火球扩散
    setTimeout(() => {
      const fireball = this.graphics.startDraw({
        type: 'particle',
        style: {
          particleType: 'explosion',
          emissionRate: 0,
          burst: [
            {
              time: 0.0,
              minimum: config.fireballParticles,
              maximum: config.fireballParticles
            }
          ],
          particleLife: 1.5,
          speed: config.fireballSpeed,
          minimumSpeed: config.fireballSpeed * 0.8,
          maximumSpeed: config.fireballSpeed * 1.2,
          startScale: 2.0,
          endScale: 10.0,
          startColor: new Cesium.Color(1.0, 0.4, 0.0, 1.0), // 橙红色
          endColor: new Cesium.Color(0.3, 0.0, 0.0, 0.0),
          imageSize: new Cesium.Cartesian2(35, 35),
          emitterModelMatrix: Cesium.Matrix4.fromTranslation(position),
          lifetime: 1.5,
          loop: false,
          emitter: new Cesium.SphereEmitter(config.radius)
        },
        attr: { id: `explosion-fireball-${Date.now()}` }
      })
    }, 200)

    // 第三阶段：烟雾蘑菇云
    setTimeout(() => {
      const smokeCloud = this.graphics.startDraw({
        type: 'particle',
        style: {
          particleType: 'smoke',
          emissionRate: config.smokeRate,
          particleLife: 8.0,
          speed: 2.0,
          minimumSpeed: 1.5,
          maximumSpeed: 3.0,
          startScale: 2.0,
          endScale: 12.0,
          startColor: new Cesium.Color(0.1, 0.1, 0.1, 0.9), // 深黑色
          endColor: new Cesium.Color(0.5, 0.5, 0.5, 0.0),
          imageSize: new Cesium.Cartesian2(40, 40),
          emitterModelMatrix: Cesium.Matrix4.fromTranslation(position),
          lifetime: 5.0,
          loop: false,
          emitter: new Cesium.SphereEmitter(config.radius * 0.5),
          forces: [
            (particle) => {
              // 向上升腾
              return new Cesium.Cartesian3((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, 2.0)
            }
          ]
        },
        attr: { id: `explosion-smoke-${Date.now()}` }
      })
    }, 800)
  }

  // 根据强度获取配置
  private getExplosionConfig(intensity: 'small' | 'medium' | 'large') {
    const configs = {
      small: {
        flashParticles: 100,
        fireballParticles: 150,
        fireballSpeed: 8.0,
        radius: 3.0,
        smokeRate: 30
      },
      medium: {
        flashParticles: 300,
        fireballParticles: 400,
        fireballSpeed: 12.0,
        radius: 6.0,
        smokeRate: 60
      },
      large: {
        flashParticles: 600,
        fireballParticles: 800,
        fireballSpeed: 20.0,
        radius: 10.0,
        smokeRate: 100
      }
    }
    return configs[intensity]
  }
}

// 使用示例
const explosionSim = new ExplosionSimulator(graphics)

// 触发中等强度爆炸
const explosionPosition = Cesium.Cartesian3.fromDegrees(116.408, 39.9045, 5)
explosionSim.triggerExplosion(explosionPosition, 'medium')
```

**应用要点：**

- **分阶段渲染**：通过 `setTimeout` 分阶段触发闪光、火球、烟雾,模拟真实爆炸过程
- **爆发式粒子**：使用 `burst` 配置在瞬间释放大量粒子，配合 `loop: false` 实现一次性效果
- **球形发射器**：`SphereEmitter` 实现向四周扩散的爆炸效果
- **自定义力场**：通过 `forces` 控制烟雾向上升腾，形成蘑菇云效果

### 场景 11：重新编辑历史标绘

```typescript
import { EventType } from '@auto-cesium/plugins'

// 1. 加载历史结果（geojson 来自后端）
const list = graphics.loadJson(savedGeoJSON, {
  clear: true,
  onEachEntity: (feature, entity) => {
    entity.attribute!.attr = {
      ...feature.properties?.attr,
      id: feature.properties?.attr?.id ?? crypto.randomUUID()
    }
  }
})

// 2. 启用编辑模式
graphics.hasEdit(true)

// 3. 监听 draw-created，自动进入编辑
graphics.on(EventType.DrawCreated, ({ entity }) => {
  if (entity) {
    graphics.startEditing(entity)
  }
})

// 4. 手动指定某个业务 ID 重新编辑
function reopen(entityId: string) {
  const entity = graphics.getEntityById(entityId)
  if (!entity) return

  graphics.stopDraw() // 确保退出绘制状态
  graphics.startEditing(entity)
  graphics.enableTransform()
}

// 5. 在编辑面板修改后刷写属性
function saveStyle(entityId: string, nextStyle: Record<string, unknown>) {
  const entity = graphics.getEntityById(entityId)
  if (!entity) return
  graphics.updateAttribute({ style: nextStyle }, entity)
}
```

- `graphics.getEntityById` 通过 `attribute.attr.id` 查找实体，方便与业务 ID 对齐。
- `graphics.startEditing(entity)` 支持 Entity 与 Primitive（如 `model-p`），配合 `enableTransform` 可与 TransformPlugin 联动。
- `graphics.updateAttribute` / `setPositions` 可在编辑过程中与自定义表单或吸附逻辑同步，实现“再次编辑→保存”的完整闭环。

### 场景 12：批量操作与筛选

```typescript
// 1. 按类型筛选实体
function getEntitiesByType(type: string): Entity[] {
  return graphics.getEntitys().filter((entity) => {
    const attr = (entity as EntityExtension).attribute
    return attr?.type === type
  })
}

// 2. 批量更新样式
function updateEntitiesStyle(entities: Entity[], style: Record<string, unknown>) {
  entities.forEach((entity) => {
    graphics.updateStyle(style, entity)
  })
}

// 3. 批量删除
function deleteEntities(entities: Entity[]) {
  entities.forEach((entity) => {
    graphics.deleteEntity(entity)
  })
}

// 4. 按业务属性筛选
function getEntitiesByAttr(key: string, value: unknown): Entity[] {
  return graphics.getEntitys().filter((entity) => {
    const attr = (entity as EntityExtension).attribute?.attr
    return attr && attr[key] === value
  })
}

// 5. 批量导出
function exportByType(type: string): GeoJSONFeatureCollection | null {
  const entities = getEntitiesByType(type)
  const features: GeoJSONFeature[] = []

  entities.forEach((entity) => {
    const geojson = graphics.toGeoJSON(entity)
    if (geojson && 'type' in geojson && geojson.type === 'Feature') {
      features.push(geojson as GeoJSONFeature)
    }
  })

  return features.length > 0 ? { type: 'FeatureCollection', features } : null
}

// 使用示例
const warningZones = getEntitiesByAttr('level', 'warning')
updateEntitiesStyle(warningZones, { material: '#ff6b6b', outlineWidth: 3 })
```

- 通过 `graphics.getEntitys()` 获取全部实体后，可按 `attribute.type`、`attribute.attr` 等字段进行筛选。
- 批量操作时建议先收集目标实体数组，再统一调用 `updateStyle`/`deleteEntity`，避免在遍历过程中修改集合。

### 场景 13：图层分组与可见性管理

```typescript
class LayerGroupManager {
  private groups: Map<string, Set<Entity>> = new Map()

  constructor(private graphics: GraphicsPlugin) {}

  // 创建分组
  createGroup(groupId: string, entities: Entity[]) {
    this.groups.set(groupId, new Set(entities))
  }

  // 添加实体到分组
  addToGroup(groupId: string, entity: Entity) {
    const group = this.groups.get(groupId)
    if (group) {
      group.add(entity)
    } else {
      this.groups.set(groupId, new Set([entity]))
    }
  }

  // 显示/隐藏分组
  setGroupVisible(groupId: string, visible: boolean) {
    const group = this.groups.get(groupId)
    if (!group) return

    group.forEach((entity) => {
      if (entity instanceof Cesium.Entity) {
        entity.show = visible
      }
    })
  }

  // 切换分组显示
  toggleGroup(groupId: string) {
    const group = this.groups.get(groupId)
    if (!group || group.size === 0) return

    const firstEntity = Array.from(group)[0]
    const currentVisible = firstEntity.show !== false
    this.setGroupVisible(groupId, !currentVisible)
  }

  // 获取分组实体
  getGroupEntities(groupId: string): Entity[] {
    return Array.from(this.groups.get(groupId) || [])
  }

  // 删除分组
  removeGroup(groupId: string) {
    this.groups.delete(groupId)
  }
}

// 使用示例
const layerManager = new LayerGroupManager(graphics)

// 创建分组
const buildings = graphics.getEntitys().filter((e) => (e as EntityExtension).attribute?.type === 'box')
layerManager.createGroup('buildings', buildings)

const roads = graphics.getEntitys().filter((e) => (e as EntityExtension).attribute?.type === 'polyline')
layerManager.createGroup('roads', roads)

// 控制显示
layerManager.setGroupVisible('buildings', true)
layerManager.setGroupVisible('roads', false)
layerManager.toggleGroup('buildings')
```

- 通过 `Set<Entity>` 维护分组，利用 `entity.show` 控制可见性，实现图层管理面板的开关功能。

### 场景 14：动画效果与闪烁提示

```typescript
// 1. 闪烁动画（通过定时器更新透明度）
function startBlinkAnimation(entity: Entity, duration = 2000) {
  let startTime = Date.now()
  const interval = setInterval(() => {
    const elapsed = Date.now() - startTime
    const progress = (elapsed % duration) / duration
    const alpha = Math.abs(Math.sin(progress * Math.PI))

    const attr = (entity as EntityExtension).attribute
    if (attr) {
      graphics.updateStyle({ opacity: alpha }, entity)
    }

    if (elapsed >= duration * 5) {
      // 闪烁5次后停止
      clearInterval(interval)
      graphics.updateStyle({ opacity: 1 }, entity)
    }
  }, 16) // 约60fps

  return () => clearInterval(interval)
}

// 2. 脉冲效果（缩放变化）
function startPulseAnimation(entity: Entity, scaleRange = [1, 1.2]) {
  let direction = 1
  let currentScale = scaleRange[0]

  const interval = setInterval(() => {
    currentScale += direction * 0.02
    if (currentScale >= scaleRange[1] || currentScale <= scaleRange[0]) {
      direction *= -1
    }

    const attr = (entity as EntityExtension).attribute
    if (attr?.type === 'billboard' && attr.style) {
      graphics.updateStyle({ scale: currentScale }, entity)
    }
  }, 16)

  return () => clearInterval(interval)
}

// 3. 颜色渐变
function startColorTransition(entity: Entity, fromColor: string, toColor: string, duration = 1000) {
  const from = Cesium.Color.fromCssColorString(fromColor)
  const to = Cesium.Color.fromCssColorString(toColor)
  let startTime = Date.now()

  const interval = setInterval(() => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)

    const color = Cesium.Color.lerp(from, to, progress, new Cesium.Color())
    graphics.updateStyle({ material: color.toCssColorString() }, entity)

    if (progress >= 1) {
      clearInterval(interval)
    }
  }, 16)

  return () => clearInterval(interval)
}

// 使用示例
const alertEntity = graphics.getEntityById('alert-001')
if (alertEntity) {
  const stopBlink = startBlinkAnimation(alertEntity, 1000)
  // 5秒后停止
  setTimeout(stopBlink, 5000)
}
```

- 通过 `setInterval` 结合 `graphics.updateStyle` 实现动画，注意在组件卸载时清理定时器。

### 场景 15：与 PopupPlugin 联动

```typescript
import { PopupPlugin } from '@auto-cesium/plugins'

const popup = viewer.use(PopupPlugin)

// 1. 点击实体显示弹窗
graphics.on(EventType.EditStart, ({ entity }) => {
  if (!entity) return

  const attr = (entity as EntityExtension).attribute
  const positions = graphics.getPositions(entity)

  if (positions && positions.length > 0) {
    const firstPos = positions[0]
    const cartographic = Cesium.Cartographic.fromCartesian(firstPos)
    const lon = Cesium.Math.toDegrees(cartographic.longitude)
    const lat = Cesium.Math.toDegrees(cartographic.latitude)

    popup.createHTML(
      `
      <div style="padding: 15px; min-width: 200px;">
        <h3 style="margin: 0 0 10px 0;">${attr?.attr?.name || '未命名'}</h3>
        <p><strong>类型:</strong> ${attr?.type || '未知'}</p>
        <p><strong>ID:</strong> ${attr?.attr?.id || 'N/A'}</p>
        <button onclick="graphics.deleteEntity(entity)">删除</button>
      </div>
      `,
      [lon, lat, 0],
      {
        closeOnClickOutside: true,
        draggable: true
      }
    )
  }
})

// 2. 鼠标悬停显示简要信息
const eventPlugin = viewer.getPlugin('event')
eventPlugin?.onMouseMove((pickInfo) => {
  const entity = pickInfo?.pickedObject?.id as Entity | undefined
  if (entity && graphics.isMyEntity(entity)) {
    const attr = (entity as EntityExtension).attribute
    const tooltip = viewer.getPlugin('tooltip')
    if (tooltip && pickInfo.position) {
      tooltip.showAt({ x: pickInfo.position.x, y: pickInfo.position.y }, attr?.attr?.name || `类型: ${attr?.type}`)
    }
  }
})
```

- PopupPlugin 与 GraphicsPlugin 配合，实现点击详情弹窗、悬停提示等交互。

### 场景 16：性能优化 - 按需加载与 LOD

```typescript
// 1. 根据相机高度动态显示/隐藏
function setupLOD(viewer: AutoViewer, graphics: GraphicsPlugin) {
  const camera = viewer.cesiumViewer.camera

  const updateVisibility = () => {
    const height = camera.positionCartographic.height
    const entities = graphics.getEntitys()

    entities.forEach((entity) => {
      const attr = (entity as EntityExtension).attribute
      const lodLevel = attr?.attr?.lodLevel as number | undefined

      if (lodLevel !== undefined) {
        // 根据高度阈值控制显示
        const threshold = lodLevel * 1000 // 每级1000米
        entity.show = height <= threshold
      }
    })
  }

  // 监听相机变化
  camera.changed.addEventListener(updateVisibility)
  updateVisibility()

  return () => {
    camera.changed.removeEventListener(updateVisibility)
  }
}

// 2. 分页加载大量数据
async function loadLargeDataset(graphics: GraphicsPlugin, geojsonUrl: string, pageSize = 100) {
  const response = await fetch(geojsonUrl)
  const geojson: GeoJSONFeatureCollection = await response.json()
  const features = geojson.features

  for (let i = 0; i < features.length; i += pageSize) {
    const page = features.slice(i, i + pageSize)
    const pageGeoJSON: GeoJSONFeatureCollection = {
      type: 'FeatureCollection',
      features: page
    }

    graphics.loadJson(pageGeoJSON, { clear: i === 0 })

    // 等待下一帧，避免阻塞
    await new Promise((resolve) => requestAnimationFrame(resolve))
  }
}

// 3. 视锥剔除（仅显示视野内的实体）
function setupFrustumCulling(viewer: AutoViewer, graphics: GraphicsPlugin) {
  const scene = viewer.cesiumViewer.scene

  scene.postRender.addEventListener(() => {
    const camera = scene.camera
    const frustum = camera.frustum
    const entities = graphics.getEntitys()

    entities.forEach((entity) => {
      const positions = graphics.getPositions(entity)
      if (!positions || positions.length === 0) return

      // 检查实体是否在视锥内
      const inFrustum = positions.some((pos) => {
        if (frustum instanceof Cesium.PerspectiveFrustum) {
          return (
            frustum
              .computeCullingVolume(camera.position, camera.direction, camera.up)
              .computeVisibility(new Cesium.BoundingSphere(pos, 100)) !== Cesium.Intersect.OUTSIDE
          )
        }
        return true
      })

      entity.show = inFrustum
    })
  })
}
```

- 通过相机高度、分页加载、视锥剔除等方式优化大量实体渲染性能。

### 场景 17：围栏告警与空间分析

```typescript
// 1. 检查点是否在围栏内
function isPointInFence(point: Cesium.Cartesian3, fenceEntity: Entity): boolean {
  const positions = graphics.getPositions(fenceEntity)
  if (!positions || positions.length < 3) return false

  const cartographic = Cesium.Cartographic.fromCartesian(point)
  const lon = Cesium.Math.toDegrees(cartographic.longitude)
  const lat = Cesium.Math.toDegrees(cartographic.latitude)

  // 射线法判断点是否在多边形内
  let inside = false
  for (let i = 0, j = positions.length - 1; i < positions.length; j = i++) {
    const pi = Cesium.Cartographic.fromCartesian(positions[i])
    const pj = Cesium.Cartographic.fromCartesian(positions[j])
    const xi = Cesium.Math.toDegrees(pi.longitude)
    const yi = Cesium.Math.toDegrees(pi.latitude)
    const xj = Cesium.Math.toDegrees(pj.longitude)
    const yj = Cesium.Math.toDegrees(pj.latitude)

    const intersect = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }

  return inside
}

// 2. 围栏告警检测
function setupFenceAlarm(graphics: GraphicsPlugin, targetEntity: Entity, fenceEntities: Entity[]) {
  const checkAlarm = () => {
    const targetPos = targetEntity.position?.getValue(viewer.cesiumViewer.clock.currentTime) as
      | Cesium.Cartesian3
      | undefined

    if (!targetPos) return

    fenceEntities.forEach((fence) => {
      const isInside = isPointInFence(targetPos, fence)
      const attr = (fence as EntityExtension).attribute
      const alarmEnabled = attr?.attr?.alarmEnabled !== false

      if (alarmEnabled) {
        if (isInside) {
          // 触发告警
          graphics.updateStyle({ material: '#ff0000', outlineWidth: 3 }, fence)
          console.warn(`目标进入围栏: ${attr?.attr?.name}`)
        } else {
          // 恢复正常
          graphics.updateStyle({ material: '#00ff00', outlineWidth: 1 }, fence)
        }
      }
    })
  }

  // 定期检查
  const interval = setInterval(checkAlarm, 1000)
  return () => clearInterval(interval)
}

// 3. 计算围栏面积
function calculateFenceArea(fenceEntity: Entity): number {
  const positions = graphics.getPositions(fenceEntity)
  if (!positions || positions.length < 3) return 0

  // 使用球面多边形面积计算
  const cartographics = positions.map((pos) => Cesium.Cartographic.fromCartesian(pos))

  let area = 0
  for (let i = 0; i < cartographics.length; i++) {
    const j = (i + 1) % cartographics.length
    const lon1 = cartographics[i].longitude
    const lat1 = cartographics[i].latitude
    const lon2 = cartographics[j].longitude
    const lat2 = cartographics[j].latitude

    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2))
  }

  const radius = Cesium.Ellipsoid.WGS84.maximumRadius
  return Math.abs((area * radius * radius) / 2)
}
```

- 通过空间计算实现围栏告警、面积统计等功能。

### 场景 18：数据同步与版本控制

```typescript
// 1. 增量同步（仅同步变更）
class GraphicsSync {
  private lastSyncTime = Date.now()
  private localChanges: Map<string, Entity> = new Map()

  constructor(private graphics: GraphicsPlugin) {
    // 监听变更
    graphics.on(EventType.EditStop, ({ entity }) => {
      if (entity) {
        const attr = (entity as EntityExtension).attribute
        const id = attr?.attr?.id as string
        if (id) {
          this.localChanges.set(id, entity)
        }
      }
    })

    graphics.on(EventType.Delete, ({ entity }) => {
      if (entity) {
        const attr = (entity as EntityExtension).attribute
        const id = attr?.attr?.id as string
        if (id) {
          this.localChanges.set(id, null as unknown as Entity)
        }
      }
    })
  }

  // 获取变更
  getChanges(): Array<{ id: string; action: 'create' | 'update' | 'delete'; data?: GeoJSONFeature }> {
    const changes: Array<{ id: string; action: 'create' | 'update' | 'delete'; data?: GeoJSONFeature }> = []

    this.localChanges.forEach((entity, id) => {
      if (entity === null) {
        changes.push({ id, action: 'delete' })
      } else {
        const geojson = graphics.toGeoJSON(entity)
        if (geojson && 'type' in geojson) {
          changes.push({
            id,
            action: 'update',
            data: geojson as GeoJSONFeature
          })
        }
      }
    })

    return changes
  }

  // 同步到服务器
  async syncToServer() {
    const changes = this.getChanges()
    if (changes.length === 0) return

    try {
      await fetch('/api/graphics/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: this.lastSyncTime,
          changes
        })
      })

      this.localChanges.clear()
      this.lastSyncTime = Date.now()
    } catch (error) {
      console.error('同步失败', error)
    }
  }

  // 从服务器拉取更新
  async syncFromServer() {
    try {
      const response = await fetch(`/api/graphics/sync?since=${this.lastSyncTime}`)
      const { updates } = await response.json()

      updates.forEach((update: { id: string; data: GeoJSONFeature }) => {
        const existing = graphics.getEntityById(update.id)
        if (existing) {
          graphics.updateAttribute({ style: update.data.properties?.style }, existing)
        } else {
          graphics.loadJson(update.data)
        }
      })

      this.lastSyncTime = Date.now()
    } catch (error) {
      console.error('拉取更新失败', error)
    }
  }
}

// 使用示例
const sync = new GraphicsSync(graphics)

// 定期同步
setInterval(() => sync.syncToServer(), 5000)
setInterval(() => sync.syncFromServer(), 10000)
```

- 通过监听事件记录变更，实现增量同步与版本控制。

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

GraphicsPlugin 提供了强大的聚合功能，支持 Entity 和 Primitive 两种模式，可以有效优化大量数据的显示性能。

#### API 方法

- `setClusterOptions(options)`：配置聚合开关、像素范围、最小数量、样式、回调。
- `enableClustering()` / `disableClustering()`：快捷开启或关闭聚合。
- 内部 `_applyEntityClustering` 使用 Cesium 原生 `DataSource.clustering`，`_applyPrimitiveClustering` 自行维护 `clusterDataSource` 以显示聚合点并隐藏被聚合 Primitive。

#### 聚合配置选项

```typescript
interface ClusterOptions {
  enabled: boolean // 是否启用聚合
  pixelRange?: number // 聚合像素范围（默认 80）
  minimumClusterSize?: number // 最小聚合数量（默认 2）
  showLabels?: boolean // 是否显示聚合标签（默认 true）
  clusterStyle?: {
    color?: string // 聚合点颜色
    pixelSize?: number // 聚合点大小
    outlineColor?: string // 轮廓颜色
    outlineWidth?: number // 轮廓宽度
    font?: string // 标签字体
    labelColor?: string // 标签颜色
    labelOutlineColor?: string // 标签轮廓颜色
    labelOutlineWidth?: number // 标签轮廓宽度
  }
  clusterEvent?: (clusteredEntities: Entity[], cluster: ClusterObject) => void // 自定义聚合回调
}
```

#### 支持的几何类型

GraphicsPlugin 的聚合功能支持所有 20+ 种几何类型，分为两类：

✅ **直接支持聚合**（点类型）：

- `point` - 点
- `billboard` - 图标标注
- `label` - 文字标注

⚠️ **通过中心点参与聚合**（非点类型）：

- **线类型**：`polyline`、`curve`、`polylineVolume`、`corridor`
- **面类型**：`polygon`、`polygonEx`、`rectangle`、`circle`、`ellipse`、`sector`、`lune`、`regular`、`isoscelesTriangle`、`closeCurve`
- **三维类型**：`box`、`cylinder`、`ellipsoid`、`wall`、`plane`
- **军标类型**：`attackArrow`、`attackArrowPW`、`attackArrowYW`、`doubleArrow`、`fineArrow`、`fineArrowYW`、`gatheringPlace`
- **模型类型**：`model`、`model-p`
- **水面类型**：`water`、`flood`、`river`（Primitive）
- **特效类型**：`video-fusion`、`particle`（Primitive）

**原理**：对于非点类型的几何体，插件会自动计算其中心点位置，并使用该中心点参与聚合显示。当聚合时，原始几何体会被隐藏；当缩放接近时，聚合解散，显示原始几何体。

#### 基础聚合示例

```typescript
// 初始化时启用聚合
const graphics = viewer.use(GraphicsPlugin, {
  clustering: {
    enabled: true,
    pixelRange: 80,
    minimumClusterSize: 3,
    showLabels: true,
    clusterStyle: {
      color: '#ff6b6b',
      pixelSize: 40,
      outlineColor: '#ffffff',
      outlineWidth: 2,
      font: 'bold 16px sans-serif',
      labelColor: '#ffffff',
      labelOutlineColor: '#000000',
      labelOutlineWidth: 2
    }
  }
})

// 运行时控制聚合
graphics.enableClustering()
graphics.disableClustering()

// 更新聚合配置
graphics.setClusterOptions({
  enabled: true,
  pixelRange: 100,
  minimumClusterSize: 5
})
```

#### 自定义聚合样式

```typescript
graphics.setClusterOptions({
  enabled: true,
  pixelRange: 80,
  minimumClusterSize: 3,
  clusterEvent: (clusteredEntities, cluster) => {
    const count = clusteredEntities.length

    // 根据数量自定义样式
    if (count > 100) {
      cluster.billboard.image = '/icons/cluster-xl.png'
      cluster.billboard.scale = 2.0
      cluster.label.fillColor = Cesium.Color.RED
    } else if (count > 50) {
      cluster.billboard.image = '/icons/cluster-large.png'
      cluster.billboard.scale = 1.5
      cluster.label.fillColor = Cesium.Color.ORANGE
    } else {
      cluster.billboard.image = '/icons/cluster.png'
      cluster.billboard.scale = 1.0
      cluster.label.fillColor = Cesium.Color.YELLOW
    }

    cluster.label.text = `${count} 个对象`
    cluster.label.font = 'bold 18px sans-serif'
  }
})
```

#### 使用 Canvas 动态生成聚合图标

```typescript
graphics.setClusterOptions({
  clusterEvent: (entities, cluster) => {
    // 使用 Canvas 动态生成聚合图标
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')!

    // 绘制渐变圆形
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, '#ff6b6b')
    gradient.addColorStop(1, '#cc0000')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(32, 32, 30, 0, Math.PI * 2)
    ctx.fill()

    // 绘制数量
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 20px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(entities.length.toString(), 32, 32)

    cluster.billboard.image = canvas
  }
})
```

#### 动态聚合策略

根据缩放级别自动调整聚合：

```typescript
viewer.camera.changed.addEventListener(() => {
  const height = viewer.camera.positionCartographic.height

  if (height > 100000) {
    // 高空视角：启用聚合
    graphics.enableClustering()
    graphics.setClusterOptions({
      pixelRange: 100,
      minimumClusterSize: 3
    })
  } else if (height > 10000) {
    // 中等高度：温和聚合
    graphics.setClusterOptions({
      pixelRange: 60,
      minimumClusterSize: 5
    })
  } else {
    // 近距离：禁用聚合，显示所有细节
    graphics.disableClustering()
  }
})
```

根据数据量自动调整：

```typescript
function updateClusteringBasedOnData() {
  const entityCount = graphics.getEntitys().length

  if (entityCount < 50) {
    // 少量数据：不聚合
    graphics.disableClustering()
  } else if (entityCount < 500) {
    // 中等数据：温和聚合
    graphics.setClusterOptions({
      enabled: true,
      pixelRange: 60,
      minimumClusterSize: 5
    })
  } else {
    // 大量数据：激进聚合
    graphics.setClusterOptions({
      enabled: true,
      pixelRange: 120,
      minimumClusterSize: 3
    })
  }
}
```

#### 混合几何类型聚合示例

```typescript
// 绘制不同类型的几何体
graphics.startDraw({ type: 'point' }) // 点
graphics.startDraw({ type: 'billboard' }) // 图标
graphics.startDraw({ type: 'polygon' }) // 面
graphics.startDraw({ type: 'box' }) // 立方体
graphics.startDraw({ type: 'model' }) // 模型
graphics.startDraw({ type: 'attackArrow' }) // 军标

// 所有类型会统一参与聚合（通过中心点）
graphics.enableClustering()
```

#### 加载 GeoJSON 时启用聚合

```typescript
// 加载大量 GeoJSON 数据
const entities = graphics.loadJson(geojsonData, {
  flyTo: true,
  onEachFeature: (feature, type, index) => {
    // 可以在这里自定义每个要素的样式
    feature.properties.style = {
      color: getColorByType(type)
    }
  }
})

// 如果数据量大，启用聚合
if (entities.length > 100) {
  graphics.enableClustering()
}
```

#### 性能优化建议

**数据量级与聚合配置**：

| 数据量     | 是否聚合 | pixelRange | minimumClusterSize |
| ---------- | -------- | ---------- | ------------------ |
| < 100      | 否       | -          | -                  |
| 100-1000   | 是       | 60-80      | 3-5                |
| 1000-10000 | 是       | 80-120     | 5-10               |
| > 10000    | 是       | 50-150     | 10+                |

**优化技巧**：

1. **使用合适的聚合范围**：大数据量使用更大的 pixelRange
2. **设置合理的最小聚合数**：避免过度聚合导致丢失细节
3. **按需启用聚合**：根据视野范围和数据量动态控制
4. **禁用编辑模式**：聚合时禁用编辑提高性能 `graphics.hasEdit(false)`
5. **Primitive 模式优化**：Primitive 聚合在相机移动时更新，可通过防抖优化

#### 注意事项

**Entity 模式**：

1. 使用 Cesium 原生聚合引擎，性能较好
2. 仅 Billboard 和 Point 直接支持聚合
3. 其他几何体通过中心点间接参与聚合
4. 被聚合的原始几何体会自动隐藏

**Primitive 模式**：

1. 使用自定义聚合算法，在 postRender 时执行
2. 相机移动时会频繁重新计算聚合
3. 支持 BillboardCollection、PointPrimitiveCollection、LabelCollection、model-p、particle 等
4. 大量 Primitive（> 10000）可能影响帧率

**通用建议**：

1. 聚合最适合 100+ 对象的场景
2. 点类型聚合效果最好，其他类型作为辅助
3. 聚合后的对象不支持单独编辑，需要先解散聚合
4. 聚合样式会覆盖原始样式
5. 混合 Entity 和 Primitive 时，两种模式的聚合是独立的

### 事件

```typescript
graphics.on('draw-start', ({ drawtype }) => console.log(drawtype))
graphics.on('draw-created', ({ entity }) => {
  /* ... */
})
graphics.on('edit-start', ({ entity }) => {
  /* ... */
})
graphics.on('edit-stop', () => console.log('编辑结束'))
graphics.on('delete', ({ entity }) => console.log('删除', entity?.id))

// 取消监听
graphics.off('draw-created')
```

事件枚举来自 `EventType`，包括 `draw-start`、`draw-mouse-move`、`draw-add-point`、`draw-created`、`edit-start`、`edit-move-point`、`edit-stop`、`delete`。

## 自定义绘制

```typescript
import type { DrawController, DrawConfig, DrawAttribute } from '@auto-cesium/plugins'
import { register } from '@auto-cesium/plugins/dist/modules/GraphicsPlugin'

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
  disable() {
    /* ... */
  }
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
   import type { EditController } from '@auto-cesium/plugins'

   class EditHeatmap implements EditController {
     constructor(
       private entity: Entity,
       private viewer: Cesium.Viewer
     ) {}
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
