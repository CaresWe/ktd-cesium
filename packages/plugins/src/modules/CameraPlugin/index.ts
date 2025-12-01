import * as Cesium from 'cesium'
import { BasePlugin } from '../../BasePlugin'
import type { KtdViewer } from '@ktd-cesium/core'
import { RoamingManager } from './RoamingManager'
import { KeyboardRoamingManager } from './KeyboardRoamingManager'
import { IndoorRoamingManager } from './IndoorRoamingManager'
import type {
  CameraFlyToOptions,
  CameraSetViewOptions,
  CameraLookAtOptions,
  RoamingOptions,
  ModelRoamingOptions,
  CircleAroundPointOptions,
  RoamingData,
  ViewMode,
  CustomViewOptions,
  CameraPosition,
  KeyboardRoamingOptions,
  IndoorRoamingOptions
} from './types'

/**
 * 相机控制插件
 *
 * 提供相机控制、飞行漫游、绕点飞行等功能
 *
 * @example
 * ```typescript
 * // 使用插件
 * const camera = viewer.use(CameraPlugin)
 *
 * // 飞行到指定位置
 * await camera.flyTo({
 *   destination: [116.4, 39.9, 10000],
 *   duration: 3
 * })
 *
 * // 相机漫游
 * camera.roaming.startCameraRoaming({
 *   waypoints: [
 *     [114.35, 30.54, 1000],
 *     [114.41, 30.51, 100]
 *   ],
 *   duration: 10
 * })
 *
 * // 绕点飞行
 * camera.roaming.startCircleAroundPoint({
 *   center: [120, 30, 0],
 *   radius: 500000,
 *   duration: 10
 * })
 * ```
 */
export class CameraPlugin extends BasePlugin {
  static readonly pluginName = 'camera'
  readonly name = 'camera'

  /** 漫游管理器 */
  public roaming!: RoamingManager

  /** 键盘漫游管理器 */
  public keyboardRoaming!: KeyboardRoamingManager

  /** 室内漫游管理器 */
  public indoorRoaming!: IndoorRoamingManager

  protected onInstall(viewer: KtdViewer): void {
    this.roaming = new RoamingManager(this.cesiumViewer)
    this.indoorRoaming = new IndoorRoamingManager(this.cesiumViewer)

    // 初始化键盘漫游管理器
    this.keyboardRoaming = new KeyboardRoamingManager(this.cesiumViewer)

    // 尝试获取 EventPlugin 并设置到 KeyboardRoamingManager
    try {
      const eventPlugin = viewer.getPlugin('event')
      if (eventPlugin) {
        // EventPlugin 类型将在运行时验证
        this.keyboardRoaming.setEventPlugin(eventPlugin as unknown as import('../EventPlugin').EventPlugin)
      }
    } catch (e) {
      // EventPlugin 未安装，使用降级方案（直接 DOM 事件）
      // 这是预期行为，不需要警告
    }
  }

  /**
   * 飞行到指定位置
   * @param options 飞行选项
   * @returns Promise，飞行完成时 resolve
   *
   * @example
   * ```typescript
   * // 基础用法
   * await camera.flyTo({
   *   destination: [116.4, 39.9, 10000],
   *   duration: 3
   * })
   *
   * // 带视角控制
   * await camera.flyTo({
   *   destination: [116.4, 39.9, 10000],
   *   duration: 3,
   *   heading: 0,
   *   pitch: -45,
   *   roll: 0,
   *   complete: () => console.log('Flight completed')
   * })
   * ```
   */
  flyTo(options: CameraFlyToOptions): Promise<void> {
    this.ensureInstalled()

    const {
      destination,
      duration = 3,
      heading = 0,
      pitch = -90,
      roll = 0,
      easingFunction = Cesium.EasingFunction.LINEAR_NONE,
      complete,
      cancel
    } = options

    return new Promise((resolve, reject) => {
      this.cesiumViewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(...destination),
        orientation: {
          heading: Cesium.Math.toRadians(heading),
          pitch: Cesium.Math.toRadians(pitch),
          roll: Cesium.Math.toRadians(roll)
        },
        duration,
        easingFunction,
        complete: () => {
          complete?.()
          resolve()
        },
        cancel: () => {
          cancel?.()
          reject(new Error('Flight cancelled'))
        }
      })
    })
  }

  /**
   * 直接设置相机视角（无动画）
   * @param options 视图选项
   *
   * @example
   * ```typescript
   * camera.setView({
   *   destination: [116.4, 39.9, 10000],
   *   heading: 0,
   *   pitch: -45,
   *   roll: 0
   * })
   * ```
   */
  setView(options: CameraSetViewOptions): void {
    this.ensureInstalled()

    const { destination, heading = 0, pitch = -90, roll = 0 } = options

    this.cesiumViewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(...destination),
      orientation: {
        heading: Cesium.Math.toRadians(heading),
        pitch: Cesium.Math.toRadians(pitch),
        roll: Cesium.Math.toRadians(roll)
      }
    })
  }

  /**
   * 环绕指定点查看
   * @param options 环绕查看选项
   *
   * @example
   * ```typescript
   * camera.lookAt({
   *   target: [116.4, 39.9, 0],
   *   heading: 0,
   *   pitch: -45,
   *   range: 10000
   * })
   * ```
   */
  lookAt(options: CameraLookAtOptions): void {
    this.ensureInstalled()

    const { target, heading = 0, pitch = -45, range = 10000 } = options

    const center = Cesium.Cartesian3.fromDegrees(...target)
    const headingPitchRange = new Cesium.HeadingPitchRange(
      Cesium.Math.toRadians(heading),
      Cesium.Math.toRadians(pitch),
      range
    )

    this.cesiumViewer.camera.lookAt(center, headingPitchRange)
  }

  /**
   * 获取当前相机位置信息
   * @returns 相机位置信息
   *
   * @example
   * ```typescript
   * const position = camera.getCurrentPosition()
   * console.log(`经度: ${position.longitude}, 纬度: ${position.latitude}`)
   * ```
   */
  getCurrentPosition(): CameraPosition {
    this.ensureInstalled()

    const camera = this.cesiumViewer.camera
    const cartesian = camera.position
    const cartographic = Cesium.Cartographic.fromCartesian(cartesian)

    return {
      longitude: Cesium.Math.toDegrees(cartographic.longitude),
      latitude: Cesium.Math.toDegrees(cartographic.latitude),
      height: cartographic.height,
      heading: Cesium.Math.toDegrees(camera.heading),
      pitch: Cesium.Math.toDegrees(camera.pitch),
      roll: Cesium.Math.toDegrees(camera.roll)
    }
  }

  /**
   * 缩放到实体
   * @param entity 实体对象
   * @param offset 可选的视角偏移
   *
   * @example
   * ```typescript
   * camera.zoomToEntity(entity)
   *
   * // 带偏移
   * camera.zoomToEntity(entity, new Cesium.HeadingPitchRange(0, -45, 1000))
   * ```
   */
  zoomToEntity(entity: Cesium.Entity, offset?: Cesium.HeadingPitchRange): void {
    this.ensureInstalled()
    this.cesiumViewer.zoomTo(entity, offset)
  }

  /**
   * 飞行到实体
   * @param entity 实体对象
   * @param options 飞行选项
   *
   * @example
   * ```typescript
   * await camera.flyToEntity(entity, {
   *   duration: 2,
   *   offset: new Cesium.HeadingPitchRange(0, -45, 1000)
   * })
   * ```
   */
  flyToEntity(
    entity: Cesium.Entity,
    options?: {
      duration?: number
      offset?: Cesium.HeadingPitchRange
    }
  ): Promise<void> {
    this.ensureInstalled()

    return new Promise((resolve) => {
      this.cesiumViewer
        .flyTo(entity, {
          duration: options?.duration || 3,
          offset: options?.offset
        })
        .then(() => resolve())
    })
  }

  /**
   * 飞行到矩形区域
   * @param rectangle 矩形区域 [west, south, east, north]
   * @param duration 飞行时长（秒）
   *
   * @example
   * ```typescript
   * await camera.flyToRectangle([110, 30, 120, 40], 3)
   * ```
   */
  flyToRectangle(rectangle: [number, number, number, number], duration: number = 3): Promise<void> {
    this.ensureInstalled()

    const [west, south, east, north] = rectangle

    return new Promise((resolve) => {
      this.cesiumViewer.camera.flyTo({
        destination: Cesium.Rectangle.fromDegrees(west, south, east, north),
        duration,
        complete: () => resolve()
      })
    })
  }

  /**
   * 相机漫游（快捷方法）
   * @param options 漫游选项
   *
   * @example
   * ```typescript
   * camera.startCameraRoaming({
   *   waypoints: [
   *     [114.35, 30.54, 1000],
   *     [114.41, 30.51, 100]
   *   ],
   *   duration: 10,
   *   cameraOffset: { heading: 0, pitch: -30, range: 200 }
   * })
   * ```
   */
  startCameraRoaming(options: RoamingOptions): void {
    this.ensureInstalled()
    this.roaming.startCameraRoaming(options)
  }

  /**
   * 模型漫游（快捷方法）
   * @param options 模型漫游选项
   *
   * @example
   * ```typescript
   * camera.startModelRoaming({
   *   waypoints: [[114.35, 30.54, 1000], [114.41, 30.51, 100]],
   *   duration: 10,
   *   model: {
   *     uri: '/path/to/model.glb',
   *     minimumPixelSize: 64
   *   },
   *   showPath: true,
   *   showPolyline: true
   * })
   * ```
   */
  startModelRoaming(options: ModelRoamingOptions): void {
    this.ensureInstalled()
    this.roaming.startModelRoaming(options)
  }

  /**
   * 绕点飞行（快捷方法）
   * @param options 绕点飞行选项
   *
   * @example
   * ```typescript
   * camera.startCircleAroundPoint({
   *   center: [120, 30, 0],
   *   radius: 500000,
   *   pitch: -30,
   *   duration: 10,
   *   loop: true
   * })
   * ```
   */
  startCircleAroundPoint(options: CircleAroundPointOptions): void {
    this.ensureInstalled()
    this.roaming.startCircleAroundPoint(options)
  }

  /**
   * 暂停或继续漫游（快捷方法）
   * @param shouldAnimate true 继续，false 暂停
   */
  pauseOrContinueRoaming(shouldAnimate: boolean): void {
    this.ensureInstalled()
    this.roaming.pauseOrContinue(shouldAnimate)
  }

  /**
   * 改变漫游速度（快捷方法）
   * @param multiplier 速度倍率
   */
  changeRoamingSpeed(multiplier: number): void {
    this.ensureInstalled()
    this.roaming.changeSpeed(multiplier)
  }

  /**
   * 停止漫游（快捷方法）
   */
  stopRoaming(): void {
    this.ensureInstalled()
    this.roaming.stopRoaming()
  }

  /**
   * 切换漫游视角（快捷方法）
   * @param mode 视角模式
   * @param customOptions 自定义视角选项
   */
  changeRoamingView(mode: ViewMode, customOptions?: CustomViewOptions): void {
    this.ensureInstalled()
    this.roaming.changeView(mode, customOptions)
  }

  /**
   * 监听漫游实时数据（快捷方法）
   * @param callback 数据回调函数
   */
  onRoamingDataUpdate(callback: (data: RoamingData) => void): void {
    this.ensureInstalled()
    this.roaming.onDataUpdate(callback)
  }

  /**
   * 获取漫游数据（快捷方法）
   */
  getRoamingData(): RoamingData {
    this.ensureInstalled()
    return this.roaming.getRoamingData()
  }

  /**
   * 启动键盘漫游
   * @param options 键盘漫游选项
   *
   * @example
   * ```typescript
   * // 启动键盘漫游
   * camera.startKeyboardRoaming({
   *   moveSpeed: 10,
   *   rotateSpeed: 0.002,
   *   enableCollision: true
   * })
   *
   * // 停止键盘漫游
   * camera.stopKeyboardRoaming()
   * ```
   */
  startKeyboardRoaming(options?: KeyboardRoamingOptions): void {
    this.ensureInstalled()
    this.keyboardRoaming.start(options)
  }

  /**
   * 停止键盘漫游
   */
  stopKeyboardRoaming(): void {
    this.ensureInstalled()
    this.keyboardRoaming.stop()
  }

  /**
   * 设置键盘漫游移动速度
   * @param speed 移动速度（米/秒）
   */
  setKeyboardRoamingSpeed(speed: number): void {
    this.ensureInstalled()
    this.keyboardRoaming.setMoveSpeed(speed)
  }

  /**
   * 获取键盘漫游移动速度
   */
  getKeyboardRoamingSpeed(): number {
    this.ensureInstalled()
    return this.keyboardRoaming.getMoveSpeed()
  }

  /**
   * 检查键盘漫游是否已启用
   */
  isKeyboardRoamingEnabled(): boolean {
    this.ensureInstalled()
    return this.keyboardRoaming.isEnabled()
  }

  /**
   * 启动室内漫游
   * @param options 室内漫游选项
   *
   * @example
   * ```typescript
   * camera.startIndoorRoaming({
   *   waypoints: [
   *     [116.4, 39.9, 10],
   *     [116.41, 39.91, 10],
   *     [116.42, 39.92, 10]
   *   ],
   *   duration: 30,
   *   interpolation: 'hermite',
   *   cameraHeight: 1.7,
   *   showPath: true
   * })
   * ```
   */
  startIndoorRoaming(options: IndoorRoamingOptions): void {
    this.ensureInstalled()
    this.indoorRoaming.start(options)
  }

  /**
   * 停止室内漫游
   */
  stopIndoorRoaming(): void {
    this.ensureInstalled()
    this.indoorRoaming.stop()
  }

  /**
   * 暂停或继续室内漫游
   * @param shouldAnimate true 继续，false 暂停
   */
  pauseOrContinueIndoorRoaming(shouldAnimate: boolean): void {
    this.ensureInstalled()
    this.indoorRoaming.pauseOrContinue(shouldAnimate)
  }

  /**
   * 改变室内漫游速度
   * @param multiplier 速度倍率
   */
  changeIndoorRoamingSpeed(multiplier: number): void {
    this.ensureInstalled()
    this.indoorRoaming.changeSpeed(multiplier)
  }

  /**
   * 监听室内漫游实时数据
   * @param callback 数据回调函数
   */
  onIndoorRoamingDataUpdate(callback: (data: RoamingData) => void): void {
    this.ensureInstalled()
    this.indoorRoaming.onDataUpdate(callback)
  }

  /**
   * 获取室内漫游数据
   */
  getIndoorRoamingData(): RoamingData {
    this.ensureInstalled()
    return this.indoorRoaming.getRoamingData()
  }

  protected onDestroy(): void {
    this.roaming?.destroy()
    this.keyboardRoaming?.destroy()
    this.indoorRoaming?.destroy()
  }
}

// 导出类型
export * from './types'
export { RoamingManager } from './RoamingManager'
export { KeyboardRoamingManager } from './KeyboardRoamingManager'
export { IndoorRoamingManager } from './IndoorRoamingManager'
