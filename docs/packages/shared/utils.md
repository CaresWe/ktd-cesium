# 工具函数

工具函数模块提供了常用的通用工具函数，包括对象操作、函数操作、字符串处理、数组处理等。

## 导入

```typescript
import {
  extend,
  create,
  setOptions,
  bind,
  throttle,
  falseFn,
  stamp,
  resetLastId,
  isNumber,
  wrapNum,
  trim,
  splitWords,
  getParamString,
  template,
  indexOf,
  requestAnimFrame,
  cancelAnimFrame,
  emptyImageUrl,
  clone
} from '@auto-cesium/shared'
```

## API

### extend

合并对象属性。

**类型签名**

```typescript
function extend<T extends Record<string, unknown>>(dest: T, ...sources: Partial<T>[]): T
```

**参数**

- `dest`: 目标对象
- `sources`: 源对象数组

**返回值**

- `T`: 合并后的对象

**示例**

```typescript
import { extend } from '@auto-cesium/shared'

const obj1 = { a: 1, b: 2 }
const obj2 = { b: 3, c: 4 }
const result = extend(obj1, obj2)
// { a: 1, b: 3, c: 4 }
```

### clone

深拷贝对象。

**类型签名**

```typescript
function clone<T>(obj: T): T
```

**参数**

- `obj`: 要拷贝的对象

**返回值**

- `T`: 拷贝后的对象

**示例**

```typescript
import { clone } from '@auto-cesium/shared'

const original = { a: 1, b: { c: 2 } }
const copied = clone(original)
copied.b.c = 3
console.log(original.b.c) // 2（未改变）
```

### throttle

节流函数，限制函数执行频率。

**类型签名**

```typescript
function throttle<T extends (...args: any[]) => any>(
  fn: T,
  time: number,
  context?: unknown
): (...args: unknown[]) => void
```

**参数**

- `fn`: 要执行的函数
- `time`: 时间间隔（毫秒）
- `context`: 上下文对象（可选）

**返回值**

- 节流后的函数

**示例**

```typescript
import { throttle } from '@auto-cesium/shared'

function handleMouseMove(event: MouseEvent) {
  console.log('鼠标移动:', event.clientX, event.clientY)
}

// 限制为每 100ms 执行一次
const throttledHandler = throttle(handleMouseMove, 100)
window.addEventListener('mousemove', throttledHandler)
```

### bind

绑定函数上下文。

**类型签名**

```typescript
function bind<T extends (...args: any[]) => any>(fn: T, obj: unknown, ...boundArgs: unknown[]): T
```

**示例**

```typescript
import { bind } from '@auto-cesium/shared'

const obj = {
  value: 10,
  getValue() {
    return this.value
  }
}

const boundFn = bind(obj.getValue, obj)
console.log(boundFn()) // 10
```

### stamp

获取对象唯一标识。

**类型签名**

```typescript
function stamp(obj: Record<string, unknown>): number
```

**示例**

```typescript
import { stamp } from '@auto-cesium/shared'

const obj1 = {}
const obj2 = {}
console.log(stamp(obj1)) // 1
console.log(stamp(obj2)) // 2
console.log(stamp(obj1)) // 1（相同对象返回相同 ID）
```

### template

模板字符串替换。

**类型签名**

```typescript
function template(
  str: string,
  data: Record<string, string | number | ((data: Record<string, unknown>) => string | number)>
): string
```

**示例**

```typescript
import { template } from '@auto-cesium/shared'

const url = template('https://api.example.com/{x}/{y}/{z}', {
  x: 10,
  y: 20,
  z: 5
})
// 'https://api.example.com/10/20/5'

// 支持函数
const result = template('Value: {value}', {
  value: (data) => data.value * 2
})
```

### getParamString

获取参数字符串。

**类型签名**

```typescript
function getParamString(obj: Record<string, string | number>, existingUrl?: string, uppercase?: boolean): string
```

**示例**

```typescript
import { getParamString } from '@auto-cesium/shared'

const params = getParamString({ x: 10, y: 20, z: 5 })
// '?x=10&y=20&z=5'

const url = getParamString({ x: 10 }, 'https://api.example.com/tiles')
// 'https://api.example.com/tiles?x=10'
```

### requestAnimFrame / cancelAnimFrame

请求/取消动画帧。

**类型签名**

```typescript
function requestAnimFrame(fn: (time: number) => void, context?: unknown, immediate?: boolean): number | void

function cancelAnimFrame(id?: number): void
```

**示例**

```typescript
import { requestAnimFrame, cancelAnimFrame } from '@auto-cesium/shared'

let animationId: number | undefined

function animate(time: number) {
  // 动画逻辑
  console.log('动画时间:', time)
  animationId = requestAnimFrame(animate) as number
}

animationId = requestAnimFrame(animate) as number

// 取消动画
if (animationId) {
  cancelAnimFrame(animationId)
}
```

## 使用场景

### 场景 1：对象配置合并

```typescript
import { extend } from '@auto-cesium/shared'

interface Config {
  width: number
  height: number
  color: string
}

const defaultConfig: Config = {
  width: 100,
  height: 100,
  color: '#000000'
}

function createEntity(config: Partial<Config>) {
  const finalConfig = extend({}, defaultConfig, config)
  // 使用 finalConfig 创建实体
}
```

### 场景 2：节流鼠标事件

```typescript
import { throttle } from '@auto-cesium/shared'

// 限制相机更新频率
const updateCamera = throttle((position: Cesium.Cartesian3) => {
  viewer.camera.setView({
    destination: position
  })
}, 100) // 每 100ms 最多执行一次

viewer.screenSpaceEventHandler.setInputAction((movement) => {
  const cartesian = viewer.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid)
  if (cartesian) {
    updateCamera(cartesian)
  }
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
```

### 场景 3：深拷贝配置

```typescript
import { clone } from '@auto-cesium/shared'

// 保存配置快照
function saveConfig(config: EntityConfig) {
  const snapshot = clone(config)
  localStorage.setItem('config', JSON.stringify(snapshot))
}

// 恢复配置
function restoreConfig(): EntityConfig | null {
  const saved = localStorage.getItem('config')
  if (saved) {
    return JSON.parse(saved)
  }
  return null
}
```

### 场景 4：模板 URL 生成

```typescript
import { template } from '@auto-cesium/shared'

// 生成瓦片 URL
function getTileUrl(x: number, y: number, z: number) {
  return template('https://tile.example.com/{z}/{x}/{y}.png', {
    x,
    y,
    z
  })
}

// 使用
const url = getTileUrl(10, 20, 5)
// 'https://tile.example.com/5/10/20.png'
```

### 场景 5：对象唯一标识

```typescript
import { stamp } from '@auto-cesium/shared'

// 为实体添加唯一 ID
function addEntityId(entity: Cesium.Entity) {
  const id = stamp(entity as unknown as Record<string, unknown>)
  entity.id = `entity_${id}`
  return entity
}
```

## 注意事项

1. **深拷贝限制**：
   - `clone` 函数不支持函数、Symbol、Map、Set 等特殊类型
   - 循环引用会导致栈溢出

2. **节流函数**：
   - 节流函数会保留最后一次调用的参数
   - 时间间隔内多次调用，只执行最后一次

3. **模板字符串**：
   - 模板格式：`{变量名}`
   - 变量名必须是有效的标识符
   - 未提供的变量会抛出错误

4. **动画帧**：
   - `requestAnimFrame` 会自动降级到 `setTimeout`
   - 返回的 ID 可用于取消动画
