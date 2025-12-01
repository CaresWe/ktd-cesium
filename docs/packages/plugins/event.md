# EventPlugin

事件处理插件，统一管理 Cesium 的各种事件监听，提供丰富的拾取信息和事件回调能力。

## 核心特性

- **完整的事件类型支持**：鼠标、触摸、键盘、相机、场景、图层等六大类事件
- **丰富的拾取信息**：自动提供屏幕坐标、世界坐标、经纬度、拾取对象等信息
- **灵活的事件管理**：支持按 ID、按类型移除，支持获取所有监听器
- **可配置的拾取行为**：可控制是否启用拾取、坐标计算等功能

## 导入与安装

```typescript
import { AutoViewer } from '@auto-cesium/core'
import { EventPlugin } from '@auto-cesium/plugins'

const viewer = new AutoViewer(cesiumViewer)
const events = viewer.use(EventPlugin)
```

## 事件配置

可以通过 `setConfig` 方法配置事件行为：

```typescript
events.setConfig({
  enablePicking: true, // 是否启用拾取（默认 true）
  enableCartesian: true, // 是否获取世界坐标（默认 true）
  enableCoordinates: true // 是否获取经纬度（默认 true）
})
```

## 鼠标事件

### 左键事件

```typescript
// 左键单击
const clickId = events.onLeftClick((info) => {
  console.log('点击位置:', info.position)
  console.log('拾取对象:', info.pickedObject)
  console.log('世界坐标:', info.cartesian)
  console.log('经纬度:', info.coordinates)
})

// 左键双击
const doubleClickId = events.onLeftDoubleClick((info) => {
  console.log('双击位置:', info.coordinates)
})

// 左键按下
const downId = events.onLeftDown((info) => {
  console.log('按下位置:', info.position)
})

// 左键抬起
const upId = events.onLeftUp((info) => {
  console.log('抬起位置:', info.position)
})
```

### 右键事件

```typescript
// 右键单击（常用于显示上下文菜单）
const rightClickId = events.onRightClick((info) => {
  if (info.pickedObject) {
    showContextMenu(info.position, info.pickedObject)
  }
})

// 右键按下/抬起
events.onRightDown((info) => {
  console.log('右键按下')
})

events.onRightUp((info) => {
  console.log('右键抬起')
})
```

### 中键事件

```typescript
// 中键单击
events.onMiddleClick((info) => {
  console.log('中键点击')
})

// 中键按下/抬起
events.onMiddleDown((info) => {})
events.onMiddleUp((info) => {})
```

### 鼠标移动与滚轮

```typescript
// 鼠标移动（高频事件，注意性能）
const moveId = events.onMouseMove((info) => {
  // 可以用于实时显示坐标、高亮对象等
  updateCursorInfo(info.coordinates)
})

// 鼠标滚轮
events.onWheel((info) => {
  console.log('滚轮事件:', info.position)
})
```

## 触摸事件

```typescript
// 触摸开始
events.onTouchStart((info) => {
  console.log('触摸开始:', info.position)
})

// 触摸移动
events.onTouchMove((info) => {
  console.log('触摸移动:', info.position)
})

// 触摸结束
events.onTouchEnd((info) => {
  console.log('触摸结束:', info.position)
})
```

## 键盘事件

```typescript
// 键盘按下
const keyDownId = events.onKeyDown((info) => {
  console.log('按键:', info.key)
  console.log('键码:', info.code)
  console.log('Ctrl:', info.ctrlKey)
  console.log('Shift:', info.shiftKey)
  console.log('Alt:', info.altKey)

  // 快捷键示例
  if (info.key === 'Escape') {
    closeAllPopups()
  }

  if (info.ctrlKey && info.key === 'z') {
    undo()
  }
})

// 键盘抬起
events.onKeyUp((info) => {
  console.log('按键抬起:', info.key)
})

// 键盘按压（已废弃，建议使用 keyDown）
events.onKeyPress((info) => {
  console.log('按键按压:', info.key)
})
```

## 相机事件

```typescript
// 相机移动开始
events.onCameraMoveStart(() => {
  console.log('相机开始移动')
  // 可以暂停某些更新操作以提升性能
  pauseUpdates()
})

// 相机移动结束
const moveEndId = events.onCameraMoveEnd(() => {
  console.log('相机移动结束')
  // 恢复更新操作
  resumeUpdates()
  // 可以触发数据重新加载、聚合更新等
  updateClustering()
})

// 相机变化（每次渲染都会触发，注意性能）
events.onCameraChanged(() => {
  // 可以用于实时更新某些依赖相机位置的元素
  updateWorldPopups()
})
```

## 场景事件

```typescript
// 场景更新前
events.onPreUpdate((scene, time) => {
  // 在场景更新前执行逻辑
  updateCustomEntities(time)
})

// 场景更新后
events.onPostUpdate((scene, time) => {
  // 在场景更新后执行逻辑
  validateEntityPositions()
})

// 场景渲染前
events.onPreRender((scene, time) => {
  // 在渲染前执行逻辑，如更新材质、着色器等
  updateCustomShaders(time)
})

// 场景渲染后
events.onPostRender((scene, time) => {
  // 在渲染后执行逻辑，如绘制自定义内容
  drawCustomOverlay()
})

// 场景模式变换完成（2D/3D/CV 切换）
events.onMorphComplete(() => {
  console.log('场景模式变换完成')
  // 可以重新计算某些依赖场景模式的内容
  updateProjections()
})

// 渲染错误
events.onRenderError((scene, error) => {
  console.error('渲染错误:', error)
  // 可以记录错误、显示提示等
  reportError(error)
})
```

## 图层事件

```typescript
// 图层添加
events.onLayerAdded((info) => {
  console.log('图层已添加:', info.layer)
  console.log('图层索引:', info.index)
  // 可以更新图层列表 UI
  updateLayerList()
})

// 图层移除
events.onLayerRemoved((info) => {
  console.log('图层已移除:', info.layer)
  // 清理相关资源
  cleanupLayerResources(info.layer)
})

// 图层移动（改变顺序）
events.onLayerMoved((info) => {
  console.log('图层已移动:', info.layer)
  console.log('新索引:', info.index)
  // 更新图层顺序 UI
  updateLayerOrder()
})

// 图层显示/隐藏
events.onLayerShown((info) => {
  console.log('图层显示状态变化:', info.layer)
  // 更新图层控制 UI
  updateLayerVisibility()
})
```

## 事件管理

### 移除事件监听

```typescript
// 按 ID 移除（推荐方式）
const clickId = events.onLeftClick((info) => {
  console.log('点击')
})

// 移除指定监听
events.off(clickId)

// 按类型移除所有监听
events.offType('leftClick') // 移除所有左键点击监听

// 移除所有事件监听
events.offAll()
```

### 查询事件监听

```typescript
// 获取所有监听器
const allListeners = events.getListeners()
console.log('当前监听器数量:', allListeners.length)

// 获取指定类型的监听器
const clickListeners = events.getListenersByType('leftClick')
console.log('左键点击监听器数量:', clickListeners.length)
```

## PickInfo 拾取信息

所有鼠标和触摸事件回调都会收到 `PickInfo` 对象，包含以下信息：

```typescript
interface PickInfo {
  /** 屏幕坐标（像素） */
  position: Cartesian2
  /** 拾取到的对象（Entity、Primitive 等） */
  pickedObject?: any
  /** 拾取到的特征（3D Tiles 等） */
  pickedFeature?: any
  /** 世界坐标（Cartesian3） */
  cartesian?: Cartesian3
  /** 经纬度高度 */
  coordinates?: {
    longitude: number // 经度（度）
    latitude: number // 纬度（度）
    height: number // 高度（米）
  }
  /** 射线（用于射线检测） */
  ray?: Ray
}
```

## 使用场景

### 场景 1：点击获取坐标并显示弹窗

```typescript
import { PopupPlugin } from '@auto-cesium/plugins'

const popup = viewer.use(PopupPlugin)

events.onLeftClick((info) => {
  if (info.coordinates) {
    const { longitude, latitude } = info.coordinates

    popup.createHTML(
      `<div>
        <h3>点击位置</h3>
        <p>经度: ${longitude.toFixed(6)}°</p>
        <p>纬度: ${latitude.toFixed(6)}°</p>
        <p>高度: ${info.coordinates.height.toFixed(2)}m</p>
      </div>`,
      [longitude, latitude, info.coordinates.height]
    )
  }
})
```

### 场景 2：点击实体显示详情

```typescript
events.onLeftClick((info) => {
  if (info.pickedObject && info.pickedObject.id) {
    const entity = info.pickedObject.id

    // 显示实体信息
    showEntityInfo(entity)

    // 或者使用弹窗插件
    if (entity.properties) {
      const content = Object.entries(entity.properties)
        .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
        .join('')

      popup.createHTML(content, info.cartesian!)
    }
  }
})
```

### 场景 3：键盘快捷键控制

```typescript
events.onKeyDown((info) => {
  // 空格键：暂停/恢复动画
  if (info.key === ' ') {
    viewer.clock.shouldAnimate = !viewer.clock.shouldAnimate
  }

  // Ctrl + S：保存当前视图
  if (info.ctrlKey && info.key === 's') {
    const position = camera.getCurrentPosition()
    saveViewState(position)
  }

  // 方向键：移动相机
  if (info.key === 'ArrowUp') {
    camera.flyTo(currentLon, currentLat + 0.1, currentHeight)
  }
})
```

### 场景 4：相机移动时更新聚合

```typescript
let updateTimer: number | null = null

events.onCameraMoveStart(() => {
  // 移动开始时暂停聚合更新
  if (updateTimer) {
    clearTimeout(updateTimer)
  }
})

events.onCameraMoveEnd(() => {
  // 移动结束后延迟更新聚合（避免频繁更新）
  if (updateTimer) {
    clearTimeout(updateTimer)
  }
  updateTimer = window.setTimeout(() => {
    dataLayer.updateAllClustering()
  }, 300)
})
```

### 场景 5：在 Vue 中使用

```vue
<template>
  <div>
    <div ref="containerRef" class="map-container"></div>
    <div v-if="clickInfo" class="info-panel">
      <h3>点击信息</h3>
      <p>位置: {{ clickInfo.position }}</p>
      <p v-if="clickInfo.coordinates">
        坐标: {{ clickInfo.coordinates.longitude }}, {{ clickInfo.coordinates.latitude }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { AutoViewer } from '@auto-cesium/core'
import { EventPlugin } from '@auto-cesium/plugins'
import * as Cesium from 'cesium'

const containerRef = ref<HTMLElement>()
const clickInfo = ref<any>(null)

let viewer: AutoViewer
let events: EventPlugin
let clickListenerId: string

onMounted(() => {
  if (containerRef.value) {
    const cesiumViewer = new Cesium.Viewer(containerRef.value)
    viewer = new AutoViewer(cesiumViewer)
    events = viewer.use(EventPlugin)

    clickListenerId = events.onLeftClick((info) => {
      clickInfo.value = {
        position: `(${info.position.x}, ${info.position.y})`,
        coordinates: info.coordinates
      }
    })
  }
})

onBeforeUnmount(() => {
  if (clickListenerId) {
    events.off(clickListenerId)
  }
  viewer?.destroy()
})
</script>
```

### 场景 6：在 React 中使用

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { AutoViewer } from '@auto-cesium/core'
import { EventPlugin } from '@auto-cesium/plugins'
import * as Cesium from 'cesium'

export function MapWithEvents() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [clickPosition, setClickPosition] = useState<string>('')

  useEffect(() => {
    if (!containerRef.current) return

    const cesiumViewer = new Cesium.Viewer(containerRef.current)
    const viewer = new AutoViewer(cesiumViewer)
    const events = viewer.use(EventPlugin)

    const clickId = events.onLeftClick((info) => {
      if (info.coordinates) {
        const { longitude, latitude } = info.coordinates
        setClickPosition(`${longitude.toFixed(6)}, ${latitude.toFixed(6)}`)
      }
    })

    return () => {
      events.off(clickId)
      viewer.destroy()
    }
  }, [])

  return (
    <div>
      <div ref={containerRef} className="map-container" />
      {clickPosition && (
        <div className="info-panel">
          <p>点击位置: {clickPosition}</p>
        </div>
      )}
    </div>
  )
}
```

## 注意事项

1. **性能考虑**：
   - `onMouseMove`、`onCameraChanged` 等高频事件要注意性能，避免在回调中执行耗时操作
   - 可以使用节流（throttle）或防抖（debounce）优化

2. **事件清理**：
   - 组件卸载时务必调用 `events.off(id)` 移除监听，避免内存泄漏
   - 可以使用 `events.offAll()` 一次性清理所有监听

3. **拾取信息**：
   - `cartesian` 和 `coordinates` 可能为 `undefined`（如点击天空）
   - 使用前请检查 `info.coordinates` 或 `info.cartesian` 是否存在

4. **事件配置**：
   - 如果不需要拾取信息，可以关闭相关配置以提升性能：
     ```typescript
     events.setConfig({
       enablePicking: false,
       enableCartesian: false,
       enableCoordinates: false
     })
     ```

5. **键盘事件**：
   - 键盘事件是全局的（document 级别），不是 Cesium 画布级别
   - 确保在不需要时及时移除，避免影响其他页面元素

6. **场景事件**：
   - `onPreRender`、`onPostRender` 等场景事件在每帧都会触发
   - 避免在这些回调中执行复杂计算，可能影响渲染性能
