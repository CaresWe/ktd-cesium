# Edit 模块

图形编辑模块，提供编辑状态管理、拖拽点管理和位置更新等功能。

## 文件说明

### Dragger.ts
拖拽点控制类，负责拖拽点的创建和管理。

**主要功能：**
- 定义拖拽点类型枚举（PointType）
- 定义拖拽点颜色配置（PointColor）
- 提供创建拖拽点的工具函数（createDragger）

**拖拽点类型：**
- `Control` - 位置控制点
- `MoveAll` - 整体平移点
- `AddMidPoint` - 辅助增加新点
- `MoveHeight` - 上下移动高度点
- `EditAttr` - 辅助修改属性点（如半径）
- `EditRotation` - 旋转角度修改点

**示例：**
```typescript
import { createDragger, PointType } from './edit'

const dragger = createDragger(dataSource, {
  position: Cesium.Cartesian3.fromDegrees(120, 30, 0),
  type: PointType.Control,
  tooltip: '拖动修改位置',
  onDrag: (dragger, position) => {
    console.log('拖拽中', position)
  }
})
```

### EditBase.ts
编辑基类，提供图形编辑的基础功能。

**主要功能：**
- 继承事件系统（Evented）
- 编辑状态管理（activate/disable）
- 拖拽点管理（bindDraggers/updateDraggers/destroyDraggers）
- 鼠标事件处理（bindEvent/destroyEvent）
- 位置更新逻辑（updateAttrForEditing）

**核心方法：**
- `activate()` - 激活编辑模式
- `disable()` - 禁用编辑模式
- `updateDraggers()` - 更新拖拽点
- `deletePointForDragger()` - 删除拖拽点

**子类需要实现的方法：**
- `changePositionsToCallback()` - 将位置转换为回调模式
- `bindDraggers()` - 绑定拖拽点
- `updateAttrForEditing()` - 更新编辑时的属性
- `finish()` - 编辑完成后的处理（可选）

**示例：**
```typescript
import { EditBase } from './edit'

class EditPolyline extends EditBase {
  protected changePositionsToCallback(): void {
    // 将 polyline.positions 转换为回调函数
  }

  protected bindDraggers(): void {
    // 为每个顶点创建拖拽点
  }

  protected updateAttrForEditing(): void {
    // 更新 polyline 的位置
  }
}

const editor = new EditPolyline({
  entity: polylineEntity,
  viewer: viewer,
  dataSource: dataSource,
  tooltip: tooltip,
  minPointNum: 2
})

editor.activate()
```

## 事件系统

EditBase 继承自 Evented，支持以下事件：

- `EditStart` - 开始编辑
- `EditStop` - 停止编辑
- `EditMovePoint` - 移动点
- `EditRemovePoint` - 删除点

**监听事件：**
```typescript
editor.on('edit-move-point', (event) => {
  console.log('点已移动', event.entity, event.position)
})
```

## 依赖关系

```
EditBase
  ├── Evented (from core/Events)
  ├── EventType (from core/EventType)
  ├── Util (from core/Util)
  ├── Tooltip (from core/Tooltip)
  └── Dragger (from ./Dragger)
```

## 迁移说明

从原 JavaScript 版本迁移到 TypeScript 版本：

### 主要改进
1. **类型安全**：添加了完整的类型定义和接口
2. **ES6 Class**：使用标准 ES6 类语法替代 MarsClass.extend
3. **模块化**：使用 ES6 模块导入导出
4. **代码组织**：更清晰的代码结构和注释

### API 兼容性
基本保持了原有的 API 接口，主要变化：
- 使用 TypeScript 类型系统
- 方法访问修饰符（protected/private）更明确
- 接口定义更严格

## 下一步

需要为具体的图形类型创建编辑类：
- EditPoint - 点编辑
- EditPolyline - 线编辑
- EditPolygon - 面编辑
- EditRectangle - 矩形编辑
- EditCircle - 圆编辑
- 等等...

每个编辑类都继承自 EditBase 并实现必要的方法。
