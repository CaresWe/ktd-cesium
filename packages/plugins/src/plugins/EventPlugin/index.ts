import {
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Cartographic,
  Math as CesiumMath,
  defined
} from 'cesium'
import { BasePlugin } from '../../BasePlugin'
import type { KtdViewer } from '@ktd-cesium/core'
import type {
  MouseEventCallback,
  TouchEventCallback,
  CameraEventCallback,
  KeyboardEventCallback,
  SceneEventCallback,
  LayerEventCallback,
  EventListener,
  EventConfig,
  PickInfo,
  KeyboardEventInfo
} from './types'

/**
 * 事件管理插件
 * 统一管理 Cesium 的各种事件监听
 */
export class EventPlugin extends BasePlugin {
  static readonly pluginName = 'event'
  readonly name = 'event'

  /** 屏幕空间事件处理器 */
  private handler: ScreenSpaceEventHandler | null = null

  /** 事件监听器集合 */
  private listeners: Map<string, EventListener> = new Map()

  /** 事件ID计数器 */
  private eventIdCounter = 0

  /** 事件配置 */
  private config: EventConfig = {
    enablePicking: true,
    enableCartesian: true,
    enableCoordinates: true
  }

  protected onInstall(viewer: KtdViewer): void {
    // 使用 cesiumViewer 属性访问原始 Cesium Viewer
    this.handler = new ScreenSpaceEventHandler(viewer.cesiumViewer.canvas)
    console.log('Event plugin installed')
  }

  /**
   * 设置事件配置
   */
  setConfig(config: Partial<EventConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 生成唯一的事件ID
   */
  private generateEventId(type: string): string {
    return `${type}_${this.eventIdCounter++}`
  }

  /**
   * 获取拾取信息
   */
  private getPickInfo(movement: any): PickInfo {
    this.ensureInstalled()

    const position = movement.position || movement.endPosition
    const info: PickInfo = { position }

    // 拾取对象
    if (this.config.enablePicking) {
      try {
        const pickedObject = this.cesiumViewer.scene.pick(position)
        if (defined(pickedObject)) {
          info.pickedObject = pickedObject
        }

        // 拾取特征（用于3D Tiles等）
        const pickedFeature = this.cesiumViewer.scene.pick(position)
        if (defined(pickedFeature) && defined(pickedFeature.primitive)) {
          info.pickedFeature = pickedFeature
        }
      } catch (e) {
        console.warn('Pick failed:', e)
      }
    }

    // 获取世界坐标
    if (this.config.enableCartesian) {
      try {
        const ray = this.cesiumViewer.camera.getPickRay(position)
        if (ray) {
          info.ray = ray
          const cartesian = this.cesiumViewer.scene.globe.pick(ray, this.cesiumViewer.scene)
          if (cartesian) {
            info.cartesian = cartesian
          }
        }
      } catch (e) {
        console.warn('Get cartesian failed:', e)
      }
    }

    // 获取经纬度
    if (this.config.enableCoordinates && info.cartesian) {
      try {
        const cartographic = Cartographic.fromCartesian(info.cartesian)
        info.coordinates = {
          longitude: CesiumMath.toDegrees(cartographic.longitude),
          latitude: CesiumMath.toDegrees(cartographic.latitude),
          height: cartographic.height
        }
      } catch (e) {
        console.warn('Get coordinates failed:', e)
      }
    }

    return info
  }

  // ==================== 鼠标事件 ====================

  /**
   * 监听鼠标左键单击
   */
  onLeftClick(callback: MouseEventCallback): string {
    return this.addMouseEvent(ScreenSpaceEventType.LEFT_CLICK, 'leftClick', callback)
  }

  /**
   * 监听鼠标左键双击
   */
  onLeftDoubleClick(callback: MouseEventCallback): string {
    return this.addMouseEvent(ScreenSpaceEventType.LEFT_DOUBLE_CLICK, 'leftDoubleClick', callback)
  }

  /**
   * 监听鼠标左键按下
   */
  onLeftDown(callback: MouseEventCallback): string {
    return this.addMouseEvent(ScreenSpaceEventType.LEFT_DOWN, 'leftDown', callback)
  }

  /**
   * 监听鼠标左键抬起
   */
  onLeftUp(callback: MouseEventCallback): string {
    return this.addMouseEvent(ScreenSpaceEventType.LEFT_UP, 'leftUp', callback)
  }

  /**
   * 监听鼠标右键单击
   */
  onRightClick(callback: MouseEventCallback): string {
    return this.addMouseEvent(ScreenSpaceEventType.RIGHT_CLICK, 'rightClick', callback)
  }

  /**
   * 监听鼠标右键按下
   */
  onRightDown(callback: MouseEventCallback): string {
    return this.addMouseEvent(ScreenSpaceEventType.RIGHT_DOWN, 'rightDown', callback)
  }

  /**
   * 监听鼠标右键抬起
   */
  onRightUp(callback: MouseEventCallback): string {
    return this.addMouseEvent(ScreenSpaceEventType.RIGHT_UP, 'rightUp', callback)
  }

  /**
   * 监听鼠标中键单击
   */
  onMiddleClick(callback: MouseEventCallback): string {
    return this.addMouseEvent(ScreenSpaceEventType.MIDDLE_CLICK, 'middleClick', callback)
  }

  /**
   * 监听鼠标中键按下
   */
  onMiddleDown(callback: MouseEventCallback): string {
    return this.addMouseEvent(ScreenSpaceEventType.MIDDLE_DOWN, 'middleDown', callback)
  }

  /**
   * 监听鼠标中键抬起
   */
  onMiddleUp(callback: MouseEventCallback): string {
    return this.addMouseEvent(ScreenSpaceEventType.MIDDLE_UP, 'middleUp', callback)
  }

  /**
   * 监听鼠标移动
   */
  onMouseMove(callback: MouseEventCallback): string {
    return this.addMouseEvent(ScreenSpaceEventType.MOUSE_MOVE, 'mouseMove', callback)
  }

  /**
   * 监听鼠标滚轮
   */
  onWheel(callback: MouseEventCallback): string {
    return this.addMouseEvent(ScreenSpaceEventType.WHEEL, 'wheel', callback)
  }

  /**
   * 添加鼠标事件
   */
  private addMouseEvent(
    eventType: ScreenSpaceEventType,
    type: string,
    callback: MouseEventCallback
  ): string {
    this.ensureInstalled()

    const id = this.generateEventId(type)
    const wrappedCallback = (movement: any) => {
      const info = this.getPickInfo(movement)
      callback(info)
    }

    this.handler!.setInputAction(wrappedCallback, eventType)

    this.listeners.set(id, {
      id,
      type,
      callback,
      handler: this.handler!
    })

    return id
  }

  // ==================== 触摸事件 ====================

  /**
   * 监听触摸开始
   */
  onTouchStart(callback: TouchEventCallback): string {
    return this.addTouchEvent(ScreenSpaceEventType.PINCH_START, 'touchStart', callback)
  }

  /**
   * 监听触摸结束
   */
  onTouchEnd(callback: TouchEventCallback): string {
    return this.addTouchEvent(ScreenSpaceEventType.PINCH_END, 'touchEnd', callback)
  }

  /**
   * 监听触摸移动
   */
  onTouchMove(callback: TouchEventCallback): string {
    return this.addTouchEvent(ScreenSpaceEventType.PINCH_MOVE, 'touchMove', callback)
  }

  /**
   * 添加触摸事件
   */
  private addTouchEvent(
    eventType: ScreenSpaceEventType,
    type: string,
    callback: TouchEventCallback
  ): string {
    this.ensureInstalled()

    const id = this.generateEventId(type)
    const wrappedCallback = (movement: any) => {
      const info = this.getPickInfo(movement)
      callback(info)
    }

    this.handler!.setInputAction(wrappedCallback, eventType)

    this.listeners.set(id, {
      id,
      type,
      callback,
      handler: this.handler!
    })

    return id
  }

  // ==================== 相机事件 ====================

  /**
   * 监听相机移动开始
   */
  onCameraMoveStart(callback: CameraEventCallback): string {
    this.ensureInstalled()

    const id = this.generateEventId('cameraMoveStart')
    const removeListener = this.cesiumViewer.camera.moveStart.addEventListener(callback)

    this.listeners.set(id, {
      id,
      type: 'cameraMoveStart',
      callback,
      handler: removeListener
    })

    return id
  }

  /**
   * 监听相机移动结束
   */
  onCameraMoveEnd(callback: CameraEventCallback): string {
    this.ensureInstalled()

    const id = this.generateEventId('cameraMoveEnd')
    const removeListener = this.cesiumViewer.camera.moveEnd.addEventListener(callback)

    this.listeners.set(id, {
      id,
      type: 'cameraMoveEnd',
      callback,
      handler: removeListener
    })

    return id
  }

  /**
   * 监听相机变化
   */
  onCameraChanged(callback: CameraEventCallback): string {
    this.ensureInstalled()

    const id = this.generateEventId('cameraChanged')
    const removeListener = this.cesiumViewer.camera.changed.addEventListener(callback)

    this.listeners.set(id, {
      id,
      type: 'cameraChanged',
      callback,
      handler: removeListener
    })

    return id
  }

  // ==================== 键盘事件 ====================

  /**
   * 监听键盘按下
   */
  onKeyDown(callback: KeyboardEventCallback): string {
    return this.addKeyboardEvent('keydown', 'keyDown', callback)
  }

  /**
   * 监听键盘抬起
   */
  onKeyUp(callback: KeyboardEventCallback): string {
    return this.addKeyboardEvent('keyup', 'keyUp', callback)
  }

  /**
   * 监听键盘按压
   */
  onKeyPress(callback: KeyboardEventCallback): string {
    return this.addKeyboardEvent('keypress', 'keyPress', callback)
  }

  /**
   * 添加键盘事件
   */
  private addKeyboardEvent(
    eventType: string,
    type: string,
    callback: KeyboardEventCallback
  ): string {
    this.ensureInstalled()

    const id = this.generateEventId(type)
    const wrappedCallback = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent
      const info: KeyboardEventInfo = {
        key: keyboardEvent.key,
        code: keyboardEvent.code,
        ctrlKey: keyboardEvent.ctrlKey,
        shiftKey: keyboardEvent.shiftKey,
        altKey: keyboardEvent.altKey,
        metaKey: keyboardEvent.metaKey
      }
      callback(info)
    }

    document.addEventListener(eventType, wrappedCallback)

    this.listeners.set(id, {
      id,
      type,
      callback: wrappedCallback,
      handler: () => document.removeEventListener(eventType, wrappedCallback)
    })

    return id
  }

  // ==================== 场景事件 ====================

  /**
   * 监听场景更新前
   */
  onPreUpdate(callback: SceneEventCallback): string {
    this.ensureInstalled()

    const id = this.generateEventId('preUpdate')
    const removeListener = this.cesiumViewer.scene.preUpdate.addEventListener(callback)

    this.listeners.set(id, {
      id,
      type: 'preUpdate',
      callback,
      handler: removeListener
    })

    return id
  }

  /**
   * 监听场景更新后
   */
  onPostUpdate(callback: SceneEventCallback): string {
    this.ensureInstalled()

    const id = this.generateEventId('postUpdate')
    const removeListener = this.cesiumViewer.scene.postUpdate.addEventListener(callback)

    this.listeners.set(id, {
      id,
      type: 'postUpdate',
      callback,
      handler: removeListener
    })

    return id
  }

  /**
   * 监听场景渲染前
   */
  onPreRender(callback: SceneEventCallback): string {
    this.ensureInstalled()

    const id = this.generateEventId('preRender')
    const removeListener = this.cesiumViewer.scene.preRender.addEventListener(callback)

    this.listeners.set(id, {
      id,
      type: 'preRender',
      callback,
      handler: removeListener
    })

    return id
  }

  /**
   * 监听场景渲染后
   */
  onPostRender(callback: SceneEventCallback): string {
    this.ensureInstalled()

    const id = this.generateEventId('postRender')
    const removeListener = this.cesiumViewer.scene.postRender.addEventListener(callback)

    this.listeners.set(id, {
      id,
      type: 'postRender',
      callback,
      handler: removeListener
    })

    return id
  }

  /**
   * 监听场景模式变换完成
   */
  onMorphComplete(callback: SceneEventCallback): string {
    this.ensureInstalled()

    const id = this.generateEventId('morphComplete')
    const removeListener = this.cesiumViewer.scene.morphComplete.addEventListener(callback)

    this.listeners.set(id, {
      id,
      type: 'morphComplete',
      callback,
      handler: removeListener
    })

    return id
  }

  /**
   * 监听渲染错误
   */
  onRenderError(callback: SceneEventCallback): string {
    this.ensureInstalled()

    const id = this.generateEventId('renderError')
    const removeListener = this.cesiumViewer.scene.renderError.addEventListener(callback)

    this.listeners.set(id, {
      id,
      type: 'renderError',
      callback,
      handler: removeListener
    })

    return id
  }

  // ==================== 图层事件 ====================

  /**
   * 监听图层添加
   */
  onLayerAdded(callback: LayerEventCallback): string {
    this.ensureInstalled()

    const id = this.generateEventId('layerAdded')
    const wrappedCallback = (layer: any, index: number) => {
      callback({ layer, index })
    }
    const removeListener = this.cesiumViewer.imageryLayers.layerAdded.addEventListener(wrappedCallback)

    this.listeners.set(id, {
      id,
      type: 'layerAdded',
      callback: wrappedCallback,
      handler: removeListener
    })

    return id
  }

  /**
   * 监听图层移除
   */
  onLayerRemoved(callback: LayerEventCallback): string {
    this.ensureInstalled()

    const id = this.generateEventId('layerRemoved')
    const wrappedCallback = (layer: any, index: number) => {
      callback({ layer, index })
    }
    const removeListener = this.cesiumViewer.imageryLayers.layerRemoved.addEventListener(wrappedCallback)

    this.listeners.set(id, {
      id,
      type: 'layerRemoved',
      callback: wrappedCallback,
      handler: removeListener
    })

    return id
  }

  /**
   * 监听图层移动
   */
  onLayerMoved(callback: LayerEventCallback): string {
    this.ensureInstalled()

    const id = this.generateEventId('layerMoved')
    const wrappedCallback = (layer: any, newIndex: number, _oldIndex: number) => {
      callback({ layer, index: newIndex })
    }
    const removeListener = this.cesiumViewer.imageryLayers.layerMoved.addEventListener(wrappedCallback)

    this.listeners.set(id, {
      id,
      type: 'layerMoved',
      callback: wrappedCallback,
      handler: removeListener
    })

    return id
  }

  /**
   * 监听图层显示
   */
  onLayerShown(callback: LayerEventCallback): string {
    this.ensureInstalled()

    const id = this.generateEventId('layerShown')
    const wrappedCallback = (layer: any, index: number) => {
      callback({ layer, index })
    }
    const removeListener = this.cesiumViewer.imageryLayers.layerShownOrHidden.addEventListener(
      wrappedCallback
    )

    this.listeners.set(id, {
      id,
      type: 'layerShown',
      callback: wrappedCallback,
      handler: removeListener
    })

    return id
  }

  // ==================== 事件管理 ====================

  /**
   * 移除指定ID的事件监听
   */
  off(id: string): boolean {
    const listener = this.listeners.get(id)
    if (!listener) {
      return false
    }

    // 移除事件监听
    if (typeof listener.handler === 'function') {
      listener.handler()
    }

    this.listeners.delete(id)
    return true
  }

  /**
   * 移除指定类型的所有事件监听
   */
  offType(type: string): number {
    let count = 0
    for (const [id, listener] of this.listeners) {
      if (listener.type === type) {
        this.off(id)
        count++
      }
    }
    return count
  }

  /**
   * 移除所有事件监听
   */
  offAll(): void {
    for (const id of this.listeners.keys()) {
      this.off(id)
    }
    this.listeners.clear()
  }

  /**
   * 获取所有事件监听器
   */
  getListeners(): EventListener[] {
    return Array.from(this.listeners.values())
  }

  /**
   * 获取指定类型的事件监听器
   */
  getListenersByType(type: string): EventListener[] {
    return Array.from(this.listeners.values()).filter(listener => listener.type === type)
  }

  protected onDestroy(): void {
    // 移除所有事件监听
    this.offAll()

    // 销毁屏幕空间事件处理器
    if (this.handler) {
      this.handler.destroy()
      this.handler = null
    }

    console.log('Event plugin destroyed')
  }
}

// 导出类型（包含 GraphicsPlugin 事件类型常量）
export * from './types'

// ==================== 通用事件系统 ====================

/**
 * 事件监听器接口
 */
interface GraphicsEventListener {
  fn: Function
  ctx?: any
}

/**
 * 分割空格分隔的字符串
 */
function splitWords(str: string): string[] {
  return str.trim().split(/\s+/)
}

/**
 * 空函数
 */
function falseFn(): boolean {
  return false
}

/**
 * 绑定函数上下文
 */
function bind(fn: Function, obj: any): any {
  const slice = Array.prototype.slice
  return fn.bind ? fn.bind(obj) : function() {
    return fn.apply(obj, slice.call(arguments))
  }
}

/**
 * 获取对象唯一标识
 */
let lastId = 0
const objIdKey = '_ktd_id'
function stamp(obj: any): number {
  if (!obj[objIdKey]) {
    obj[objIdKey] = ++lastId
  }
  return obj[objIdKey]
}

/**
 * 通用事件系统
 * 提供事件监听、触发和管理功能
 */
export class EventEmitter {
  private _events: Record<string, GraphicsEventListener[]> = {}
  private _eventParents: Record<number, EventEmitter> = {}
  private _firingCount = 0

  /**
   * 添加事件监听
   * @param types 事件类型(可以是多个空格分隔的类型)
   * @param fn 监听函数
   * @param context 上下文对象
   */
  on(types: string | Record<string, Function>, fn?: Function, context?: any): this {
    // types 可以是类型/处理器对的映射
    if (typeof types === 'object') {
      for (const type in types) {
        this._on(type, types[type], fn)
      }
    } else {
      // types 可以是空格分隔的字符串
      const typesList = splitWords(types)
      for (let i = 0, len = typesList.length; i < len; i++) {
        this._on(typesList[i], fn!, context)
      }
    }

    return this
  }

  /**
   * 移除事件监听
   * @param types 事件类型
   * @param fn 监听函数
   * @param context 上下文对象
   */
  off(types?: string | Record<string, Function>, fn?: Function, context?: any): this {
    if (!types) {
      // 如果没有参数则清除所有监听器
      this._events = {}
    } else if (typeof types === 'object') {
      for (const type in types) {
        this._off(type, types[type], fn)
      }
    } else {
      const typesList = splitWords(types)
      for (let i = 0, len = typesList.length; i < len; i++) {
        this._off(typesList[i], fn, context)
      }
    }

    return this
  }

  /**
   * 添加监听器(内部方法)
   */
  private _on(type: string, fn: Function, context?: any): void {
    const typeListeners = this._events[type] || []
    if (!this._events[type]) {
      this._events[type] = typeListeners
    }

    if (context === this) {
      context = undefined
    }

    const newListener: GraphicsEventListener = { fn, ctx: context }

    // 检查 fn 是否已经存在
    for (let i = 0, len = typeListeners.length; i < len; i++) {
      if (typeListeners[i].fn === fn && typeListeners[i].ctx === context) {
        return
      }
    }

    typeListeners.push(newListener)
  }

  /**
   * 移除监听器(内部方法)
   */
  private _off(type: string, fn?: Function, context?: any): void {
    const listeners = this._events[type]
    if (!listeners) return

    if (!fn) {
      // 将所有移除的监听器设置为 noop
      for (let i = 0, len = listeners.length; i < len; i++) {
        listeners[i].fn = falseFn
      }
      delete this._events[type]
      return
    }

    if (context === this) {
      context = undefined
    }

    // 查找并移除
    for (let i = 0, len = listeners.length; i < len; i++) {
      const l = listeners[i]
      if (l.ctx !== context) continue
      if (l.fn === fn) {
        l.fn = falseFn

        if (this._firingCount) {
          this._events[type] = listeners.slice()
        }
        listeners.splice(i, 1)
        return
      }
    }
  }

  /**
   * 触发事件
   * @param type 事件类型
   * @param data 数据对象
   * @param propagate 是否传播
   */
  fire(type: string, data?: any, propagate?: boolean): this {
    if (!this.listens(type, propagate)) return this

    const event = {
      ...data,
      type,
      target: this,
      sourceTarget: data?.sourceTarget || this
    }

    const listeners = this._events[type]

    if (listeners) {
      this._firingCount = (this._firingCount + 1) || 1
      for (let i = 0, len = listeners.length; i < len; i++) {
        const l = listeners[i]
        l.fn.call(l.ctx || this, event)
      }
      this._firingCount--
    }

    if (propagate) {
      this._propagateEvent(event)
    }

    return this
  }

  /**
   * 检查是否有监听器
   * @param type 事件类型
   * @param propagate 是否检查父级
   */
  listens(type: string, propagate?: boolean): boolean {
    const listeners = this._events?.[type]
    if (listeners && listeners.length) return true

    if (propagate) {
      for (const id in this._eventParents) {
        if (this._eventParents[id].listens(type, propagate)) {
          return true
        }
      }
    }

    return false
  }

  /**
   * 添加一次性监听器
   * @param types 事件类型
   * @param fn 监听函数
   * @param context 上下文
   */
  once(types: string | Record<string, Function>, fn?: Function, context?: any): this {
    if (typeof types === 'object') {
      for (const type in types) {
        this.once(type, types[type], fn)
      }
      return this
    }

    const handler = bind(() => {
      this.off(types, fn, context).off(types, handler, context)
    }, this)

    return this.on(types, fn, context).on(types, handler, context)
  }

  /**
   * 添加事件父级
   * @param obj EventEmitter 对象
   */
  addEventParent(obj: EventEmitter): this {
    this._eventParents[stamp(obj)] = obj
    return this
  }

  /**
   * 移除事件父级
   * @param obj EventEmitter 对象
   */
  removeEventParent(obj: EventEmitter): this {
    delete this._eventParents[stamp(obj)]
    return this
  }

  /**
   * 传播事件
   */
  private _propagateEvent(e: any): void {
    for (const id in this._eventParents) {
      this._eventParents[id].fire(
        e.type,
        { ...e, layer: e.target, propagatedFrom: e.target },
        true
      )
    }
  }

  // 别名方法
  addEventListener = this.on
  removeEventListener = this.off
  clearAllEventListeners = this.off
  addOneTimeEventListener = this.once
  fireEvent = this.fire
  hasEventListeners = this.listens
}
