# DataLayerPlugin 聚合功能说明

## 概述

DataLayerPlugin 提供了两种模式的数据聚合功能:

- **Entity 模式聚合**: 使用 Cesium 原生的聚合引擎
- **Primitive 模式聚合**: 自定义实现的聚合算法

## Entity 模式聚合

### 支持的几何类型

Entity 模式使用 Cesium 的 `CustomDataSource.clustering`,原生支持:

- ✅ **Point** (点)
- ✅ **Billboard** (图标)

**注意**: Cesium 原生聚合**不支持**线(polyline)和面(polygon)的直接聚合。

### 线和面的聚合方案

对于线和面几何,建议采用以下策略:

#### 方案 1: 转换为点表示(推荐)

将线和面的中心点添加为 billboard 或 point,参与聚合:

```typescript
const items: DataItem[] = polylines.map((line) => ({
  id: line.id,
  geometryType: 'point', // 使用点类型
  position: calculateCenter(line.positions), // 计算中心点
  data: {
    ...line.data,
    originalType: 'polyline', // 保存原始类型
    positions: line.positions // 保存原始坐标
  },
  style: {
    icon: {
      image: '/icons/polyline-cluster.png',
      scale: 1.0
    }
  }
}))
```

#### 方案 2: 混合模式

- 小规模: 直接显示线/面
- 大规模: 切换到点聚合模式

```typescript
const config: DataLayerConfig = {
  name: 'hybrid-layer',
  type: 'entity',
  clustering: {
    enabled: data.length > 100, // 数据量大时启用聚合
    pixelRange: 80,
    minimumClusterSize: 3
  }
}
```

### 基本配置

```typescript
const layerConfig: DataLayerConfig = {
  name: 'points-layer',
  type: 'entity',
  clustering: {
    // 启用聚合
    enabled: true,

    // 聚合像素范围(默认: 80)
    pixelRange: 80,

    // 最小聚合数量(默认: 3)
    minimumClusterSize: 3,

    // 是否显示标签(默认: true)
    showLabels: true,

    // 自定义聚合样式
    clusterStyle: (clusteredEntities, cluster) => {
      const count = clusteredEntities.length
      return {
        image: count > 50 ? '/icons/cluster-large.png' : '/icons/cluster.png',
        label: `${count}`,
        scale: 1.0 + Math.min(count / 100, 1.0)
      }
    }
  }
}
```

### 聚合样式自定义

```typescript
clusterStyle: (clusteredEntities, cluster) => {
  const count = clusteredEntities.length

  // 根据数量分级
  if (count > 100) {
    return {
      image: '/icons/cluster-xl.png',
      label: `${count}+`,
      scale: 2.0
    }
  } else if (count > 50) {
    return {
      image: '/icons/cluster-large.png',
      label: `${count}`,
      scale: 1.5
    }
  } else {
    return {
      image: '/icons/cluster.png',
      label: `${count}`,
      scale: 1.0
    }
  }
}
```

## Primitive 模式聚合

### 支持的几何类型

Primitive 模式目前支持:

- ✅ **Point** (点) - PointPrimitiveCollection

**注意**: Primitive 模式的线和面聚合需要自定义实现 PolylineCollection 和自定义几何的聚合逻辑。

### 基本配置

```typescript
const layerConfig: DataLayerConfig = {
  name: 'primitive-points',
  type: 'primitive',
  clustering: {
    enabled: true,
    pixelRange: 80,
    minimumClusterSize: 3,
    showLabels: true,
    clusterStyle: (clusteredEntities, cluster) => ({
      label: `${clusteredEntities.length}`
    })
  }
}
```

### Primitive 聚合特点

- **性能优势**: 对于大量点数据(10万+),性能优于 Entity 模式
- **实时更新**: 相机移动时自动重新计算聚合
- **自定义算法**: 使用屏幕空间距离的聚合算法

## 配置参数说明

### pixelRange

聚合像素范围,表示在屏幕空间中多少像素内的点会被聚合在一起。

- **较小值** (40-60): 更精细的聚合,簇数量较多
- **中等值** (60-100): 平衡的聚合效果(推荐)
- **较大值** (100+): 更激进的聚合,簇数量较少

### minimumClusterSize

最小聚合数量,少于此数量的点不会被聚合,而是直接显示。

- **2**: 最小聚合,两个点即可形成簇
- **3**: 推荐值,平衡显示效果
- **5+**: 只有较密集的区域才聚合

### showLabels

是否在聚合点上显示数量标签。

## 最佳实践

### 1. 数据量分级处理

```typescript
function getClusterConfig(dataCount: number): ClusterConfig {
  if (dataCount < 100) {
    // 小数据量: 不启用聚合
    return { enabled: false }
  } else if (dataCount < 1000) {
    // 中等数据量: 温和聚合
    return {
      enabled: true,
      pixelRange: 60,
      minimumClusterSize: 5
    }
  } else {
    // 大数据量: 激进聚合
    return {
      enabled: true,
      pixelRange: 100,
      minimumClusterSize: 3
    }
  }
}
```

### 2. 动态切换聚合

```typescript
const layer = plugin.getLayer(layerId)

// 根据缩放级别动态开关聚合
viewer.camera.changed.addEventListener(() => {
  const height = viewer.camera.positionCartographic.height
  const shouldCluster = height > 10000 // 高度>10km时启用聚合

  if (layer) {
    layer.dataSource.clustering.enabled = shouldCluster
  }
})
```

### 3. 线和面的处理示例

```typescript
// 将 polyline 转换为聚合友好的格式
function convertPolylinesToClusterable(polylines: Polyline[]): DataItem[] {
  return polylines.map((line) => {
    // 计算线的中心点
    const center = calculatePolylineCenter(line.positions)

    return {
      id: line.id,
      geometryType: 'point',
      position: center,
      data: {
        type: 'polyline',
        length: calculateLength(line.positions),
        ...line.properties
      },
      style: {
        icon: {
          image: '/icons/route-marker.png',
          scale: 1.0
        }
      }
    }
  })
}

function calculatePolylineCenter(positions: Cartesian3[]): Cartesian3 {
  const boundingSphere = Cesium.BoundingSphere.fromPoints(positions)
  return boundingSphere.center
}
```

## 性能建议

1. **Entity vs Primitive**
   - < 1000 点: Entity 模式更简单
   - 1000-10000 点: 两者性能接近
   - > 10000 点: Primitive 模式性能更好

2. **聚合配置**
   - 数据量越大,`pixelRange` 应该越大
   - `minimumClusterSize` 不要设置太小(最小建议3)

3. **更新频率**
   - Primitive 聚合在相机移动时会重新计算
   - 对于静态数据,Entity 模式更高效
   - 对于动态数据,考虑节流更新

## 限制和注意事项

1. **Entity 模式**
   - ❌ 不支持 polyline 和 polygon 的原生聚合
   - ✅ 可通过转换为点的方式间接支持
   - ✅ 由 Cesium 引擎自动管理,性能稳定

2. **Primitive 模式**
   - ❌ 当前只实现了 Point 聚合
   - ❌ Polyline 和 Polygon 聚合需要自定义实现
   - ✅ 完全控制聚合算法,可深度定制

3. **通用限制**
   - 聚合后无法直接访问被聚合的单个实体
   - 点击聚合点时获取的是聚合对象,不是原始数据
   - 建议在 `clusterStyle` 中存储聚合信息供后续使用

## 示例代码

完整示例请参考 `examples/data-layer-clustering.ts`
