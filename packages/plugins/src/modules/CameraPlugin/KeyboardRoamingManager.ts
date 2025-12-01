import * as Cesium from 'cesium'
import type { KeyboardRoamingOptions } from './types'
import type { EventPlugin } from '../EventPlugin'

/**
 * 键盘漫游管理器
 * 提供第一人称视角的键盘和鼠标控制
 * 使用 EventPlugin 进行统一的事件管理
 *
 * 键盘控制：
 * - W/↑: 前进
 * - S/↓: 后退
 * - A/←: 左移
 * - D/→: 右移
 * - Q: 上升
 * - E: 下降
 * - Shift: 加速
 *
 * 鼠标控制：
 * - 右键拖拽: 旋转视角
 * - 滚轮: 调整移动速度
 */
export class KeyboardRoamingManager {
  private viewer: Cesium.Viewer
  private scene: Cesium.Scene
  private camera: Cesium.Camera
  private canvas: HTMLCanvasElement
  private eventPlugin?: EventPlugin

  private enabled: boolean = false

  // 移动参数
  private moveSpeed: number = 10 // 米/秒
  private rotateSpeed: number = 0.002 // 弧度/像素
  private verticalSpeed: number = 5 // 米/秒
  private speedMultiplier: number = 3 // Shift 加速倍率

  // 键盘状态
  private keys: Map<string, boolean> = new Map()

  // 鼠标状态
  private mouseDown: boolean = false
  private lastMousePosition?: Cesium.Cartesian2

  // 相机姿态
  private heading: number = 0
  private pitch: number = 0

  // 事件监听器 ID（用于 EventPlugin）
  private eventListenerIds: string[] = []

  // Wheel 事件监听器（直接绑定）
  private wheelHandler?: (e: WheelEvent) => void

  // 时钟监听器
  private tickListener?: Cesium.Event.RemoveCallback

  // 碰撞检测
  private enableCollision: boolean = true
  private minHeight: number = 1.5 // 最小高度（米）

  // 直接绑定的事件处理器（降级方案）
  private directEventHandlers?: {
    keydownHandler: (e: KeyboardEvent) => void
    keyupHandler: (e: KeyboardEvent) => void
    mousedownHandler: (e: MouseEvent) => void
    mouseupHandler: (e: MouseEvent) => void
    mousemoveHandler: (e: MouseEvent) => void
  }

  constructor(viewer: Cesium.Viewer, eventPlugin?: EventPlugin) {
    this.viewer = viewer
    this.scene = viewer.scene
    this.camera = viewer.camera
    this.canvas = viewer.canvas
    this.eventPlugin = eventPlugin
  }

  /**
   * 设置 EventPlugin 实例
   */
  setEventPlugin(eventPlugin: EventPlugin): void {
    this.eventPlugin = eventPlugin
  }

  /**
   * 启动键盘漫游
   */
  start(options?: KeyboardRoamingOptions): void {
    if (this.enabled) {
      console.warn('Keyboard roaming is already enabled')
      return
    }

    // 应用配置
    if (options) {
      this.moveSpeed = options.moveSpeed ?? this.moveSpeed
      this.rotateSpeed = options.rotateSpeed ?? this.rotateSpeed
      this.verticalSpeed = options.verticalSpeed ?? this.verticalSpeed
      this.speedMultiplier = options.speedMultiplier ?? this.speedMultiplier
      this.enableCollision = options.enableCollision ?? this.enableCollision
      this.minHeight = options.minHeight ?? this.minHeight
    }

    // 禁用默认相机控制
    this.scene.screenSpaceCameraController.enableRotate = false
    this.scene.screenSpaceCameraController.enableTranslate = false
    this.scene.screenSpaceCameraController.enableZoom = false
    this.scene.screenSpaceCameraController.enableTilt = false
    this.scene.screenSpaceCameraController.enableLook = false

    // 获取当前相机姿态
    this.heading = this.camera.heading
    this.pitch = this.camera.pitch

    // 注册事件监听器
    this.registerEventListeners()

    this.enabled = true
  }

  /**
   * 停止键盘漫游
   */
  stop(): void {
    if (!this.enabled) {
      return
    }

    // 移除事件监听器
    this.unregisterEventListeners()

    // 恢复默认相机控制
    this.scene.screenSpaceCameraController.enableRotate = true
    this.scene.screenSpaceCameraController.enableTranslate = true
    this.scene.screenSpaceCameraController.enableZoom = true
    this.scene.screenSpaceCameraController.enableTilt = true
    this.scene.screenSpaceCameraController.enableLook = true

    // 清空键盘状态
    this.keys.clear()
    this.mouseDown = false
    this.lastMousePosition = undefined

    this.enabled = false
  }

  /**
   * 是否已启用
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * 设置移动速度
   */
  setMoveSpeed(speed: number): void {
    this.moveSpeed = speed
  }

  /**
   * 获取移动速度
   */
  getMoveSpeed(): number {
    return this.moveSpeed
  }

  /**
   * 注册事件监听器
   */
  private registerEventListeners(): void {
    if (this.eventPlugin) {
      // 使用 EventPlugin 管理键盘和鼠标事件
      this.registerEventsWithPlugin()
    } else {
      // 降级到直接 DOM 事件绑定
      this.registerEventsDirectly()
    }

    // 帧更新
    this.tickListener = this.viewer.clock.onTick.addEventListener(() => {
      this.updateCamera()
    })
  }

  /**
   * 使用 EventPlugin 注册事件
   */
  private registerEventsWithPlugin(): void {
    if (!this.eventPlugin) return

    // 键盘按下
    const keyDownId = this.eventPlugin.onKeyDown((info) => {
      this.keys.set(info.key.toLowerCase(), true)
    })
    this.eventListenerIds.push(keyDownId)

    // 键盘抬起
    const keyUpId = this.eventPlugin.onKeyUp((info) => {
      this.keys.set(info.key.toLowerCase(), false)
    })
    this.eventListenerIds.push(keyUpId)

    // 右键按下
    const rightDownId = this.eventPlugin.onRightDown((info) => {
      this.mouseDown = true
      this.lastMousePosition = new Cesium.Cartesian2(info.position.x, info.position.y)
    })
    this.eventListenerIds.push(rightDownId)

    // 右键抬起
    const rightUpId = this.eventPlugin.onRightUp(() => {
      this.mouseDown = false
      this.lastMousePosition = undefined
    })
    this.eventListenerIds.push(rightUpId)

    // 鼠标移动
    const mouseMoveId = this.eventPlugin.onMouseMove((info) => {
      if (this.mouseDown && this.lastMousePosition) {
        const deltaX = info.position.x - this.lastMousePosition.x
        const deltaY = info.position.y - this.lastMousePosition.y

        // 更新航向和俯仰
        this.heading -= deltaX * this.rotateSpeed
        this.pitch -= deltaY * this.rotateSpeed

        // 限制俯仰角范围 [-89°, 89°]
        const maxPitch = Cesium.Math.toRadians(89)
        this.pitch = Cesium.Math.clamp(this.pitch, -maxPitch, maxPitch)

        this.lastMousePosition = new Cesium.Cartesian2(info.position.x, info.position.y)
      }
    })
    this.eventListenerIds.push(mouseMoveId)

    // 滚轮事件（EventPlugin 不支持原生滚轮事件，需要直接绑定）
    this.wheelHandler = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      this.moveSpeed = Math.max(0.1, Math.min(1000, this.moveSpeed * delta))
    }
    this.canvas.addEventListener('wheel', this.wheelHandler, { passive: false })

    // 禁用右键菜单
    const contextMenuHandler = (e: Event) => e.preventDefault()
    this.canvas.addEventListener('contextmenu', contextMenuHandler)
  }

  /**
   * 直接使用 DOM 事件注册（降级方案）
   */
  private registerEventsDirectly(): void {
    const keydownHandler = (e: KeyboardEvent) => {
      this.keys.set(e.key.toLowerCase(), true)
    }
    const keyupHandler = (e: KeyboardEvent) => {
      this.keys.set(e.key.toLowerCase(), false)
    }

    const mousedownHandler = (e: MouseEvent) => {
      if (e.button === 2) {
        // 右键
        this.mouseDown = true
        this.lastMousePosition = new Cesium.Cartesian2(e.clientX, e.clientY)
        e.preventDefault()
      }
    }

    const mouseupHandler = (e: MouseEvent) => {
      if (e.button === 2) {
        this.mouseDown = false
        this.lastMousePosition = undefined
      }
    }

    const mousemoveHandler = (e: MouseEvent) => {
      if (this.mouseDown && this.lastMousePosition) {
        const deltaX = e.clientX - this.lastMousePosition.x
        const deltaY = e.clientY - this.lastMousePosition.y

        this.heading -= deltaX * this.rotateSpeed
        this.pitch -= deltaY * this.rotateSpeed

        const maxPitch = Cesium.Math.toRadians(89)
        this.pitch = Cesium.Math.clamp(this.pitch, -maxPitch, maxPitch)

        this.lastMousePosition = new Cesium.Cartesian2(e.clientX, e.clientY)
      }
    }

    this.wheelHandler = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      this.moveSpeed = Math.max(0.1, Math.min(1000, this.moveSpeed * delta))
    }

    document.addEventListener('keydown', keydownHandler)
    document.addEventListener('keyup', keyupHandler)
    this.canvas.addEventListener('mousedown', mousedownHandler)
    this.canvas.addEventListener('mouseup', mouseupHandler)
    this.canvas.addEventListener('mousemove', mousemoveHandler)
    this.canvas.addEventListener('wheel', this.wheelHandler, { passive: false })
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault())

    // 保存到事件列表（用于清理）
    this.directEventHandlers = {
      keydownHandler,
      keyupHandler,
      mousedownHandler,
      mouseupHandler,
      mousemoveHandler
    }
  }

  /**
   * 移除事件监听器
   */
  private unregisterEventListeners(): void {
    if (this.eventPlugin) {
      // 使用 EventPlugin 移除事件
      this.eventListenerIds.forEach((id) => {
        this.eventPlugin!.off(id)
      })
      this.eventListenerIds = []
    } else {
      // 直接移除 DOM 事件
      if (this.directEventHandlers) {
        document.removeEventListener('keydown', this.directEventHandlers.keydownHandler)
        document.removeEventListener('keyup', this.directEventHandlers.keyupHandler)
        this.canvas.removeEventListener('mousedown', this.directEventHandlers.mousedownHandler)
        this.canvas.removeEventListener('mouseup', this.directEventHandlers.mouseupHandler)
        this.canvas.removeEventListener('mousemove', this.directEventHandlers.mousemoveHandler)
        this.directEventHandlers = undefined
      }
    }

    // 移除滚轮事件
    if (this.wheelHandler) {
      this.canvas.removeEventListener('wheel', this.wheelHandler)
      this.wheelHandler = undefined
    }

    // 移除时钟监听器
    if (this.tickListener) {
      this.tickListener()
      this.tickListener = undefined
    }
  }

  /**
   * 更新相机位置和姿态
   */
  private updateCamera(): void {
    // 计算移动速度（考虑 Shift 加速）
    const isShiftPressed = this.keys.get('shift') || false
    const currentSpeed = this.moveSpeed * (isShiftPressed ? this.speedMultiplier : 1)

    // 获取当前位置
    const position = this.camera.position.clone()

    // 计算移动向量
    const moveVector = new Cesium.Cartesian3(0, 0, 0)

    // 前后移动（W/S 或 ↑/↓）
    if (this.keys.get('w') || this.keys.get('arrowup')) {
      const forward = this.getForwardVector()
      Cesium.Cartesian3.multiplyByScalar(forward, currentSpeed, forward)
      Cesium.Cartesian3.add(moveVector, forward, moveVector)
    }
    if (this.keys.get('s') || this.keys.get('arrowdown')) {
      const forward = this.getForwardVector()
      Cesium.Cartesian3.multiplyByScalar(forward, -currentSpeed, forward)
      Cesium.Cartesian3.add(moveVector, forward, moveVector)
    }

    // 左右移动（A/D 或 ←/→）
    if (this.keys.get('a') || this.keys.get('arrowleft')) {
      const right = this.getRightVector()
      Cesium.Cartesian3.multiplyByScalar(right, -currentSpeed, right)
      Cesium.Cartesian3.add(moveVector, right, moveVector)
    }
    if (this.keys.get('d') || this.keys.get('arrowright')) {
      const right = this.getRightVector()
      Cesium.Cartesian3.multiplyByScalar(right, currentSpeed, right)
      Cesium.Cartesian3.add(moveVector, right, moveVector)
    }

    // 上下移动（Q/E）
    if (this.keys.get('q')) {
      const up = this.getUpVector()
      Cesium.Cartesian3.multiplyByScalar(up, this.verticalSpeed, up)
      Cesium.Cartesian3.add(moveVector, up, moveVector)
    }
    if (this.keys.get('e')) {
      const up = this.getUpVector()
      Cesium.Cartesian3.multiplyByScalar(up, -this.verticalSpeed, up)
      Cesium.Cartesian3.add(moveVector, up, moveVector)
    }

    // 应用移动
    if (!Cesium.Cartesian3.equals(moveVector, Cesium.Cartesian3.ZERO)) {
      const newPosition = Cesium.Cartesian3.add(position, moveVector, new Cesium.Cartesian3())
      const newCartographic = Cesium.Cartographic.fromCartesian(newPosition)

      // 碰撞检测
      if (this.enableCollision) {
        const terrainHeight = this.getTerrainHeight(newCartographic)
        const minAllowedHeight = terrainHeight + this.minHeight

        if (newCartographic.height < minAllowedHeight) {
          newCartographic.height = minAllowedHeight
        }
      }

      // 更新相机位置
      this.camera.position = Cesium.Cartesian3.fromRadians(
        newCartographic.longitude,
        newCartographic.latitude,
        newCartographic.height
      )
    }

    // 更新相机方向
    this.camera.setView({
      orientation: {
        heading: this.heading,
        pitch: this.pitch,
        roll: 0
      }
    })
  }

  /**
   * 获取前进方向向量（水平）
   */
  private getForwardVector(): Cesium.Cartesian3 {
    const direction = new Cesium.Cartesian3()
    const heading = this.heading

    direction.x = Math.sin(heading)
    direction.y = Math.cos(heading)
    direction.z = 0

    return Cesium.Cartesian3.normalize(direction, direction)
  }

  /**
   * 获取右侧方向向量
   */
  private getRightVector(): Cesium.Cartesian3 {
    const forward = this.getForwardVector()
    const up = Cesium.Cartesian3.UNIT_Z
    return Cesium.Cartesian3.cross(forward, up, new Cesium.Cartesian3())
  }

  /**
   * 获取上方向向量
   */
  private getUpVector(): Cesium.Cartesian3 {
    return Cesium.Cartesian3.UNIT_Z.clone()
  }

  /**
   * 获取地形高度（简化版，实际应用中需要异步获取）
   */
  private getTerrainHeight(cartographic: Cesium.Cartographic): number {
    // 使用场景的 clampToHeight 获取高度
    const position = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0)

    const clampedPosition = this.scene.clampToHeight(position)
    if (clampedPosition) {
      const clampedCartographic = Cesium.Cartographic.fromCartesian(clampedPosition)
      return clampedCartographic.height
    }

    return 0
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.stop()
  }
}
