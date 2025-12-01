import * as Cesium from 'cesium'
import type { IndoorRoamingOptions, RoamingData } from './types'

/**
 * 室内漫游管理器
 * 提供室内场景的自动漫游功能，支持 Hermite 和 Lagrange 插值
 *
 * 特点：
 * - 第一人称视角
 * - 支持平滑插值（Hermite/Lagrange）
 * - 支持暂停/继续、速度调整
 * - 提供实时位置和进度数据
 */
export class IndoorRoamingManager {
  private viewer: Cesium.Viewer
  private scene: Cesium.Scene
  private camera: Cesium.Camera

  private waypoints: Cesium.Cartesian3[] = []
  private startTime?: Cesium.JulianDate
  private stopTime?: Cesium.JulianDate
  private duration: number = 60
  private speedMultiplier: number = 1
  private isLooping: boolean = false

  private positionProperty?: Cesium.SampledPositionProperty
  private tickListener?: Cesium.Event.RemoveCallback
  private pathEntity?: Cesium.Entity
  private frustumEntities: Cesium.Entity[] = []

  private data: RoamingData = this.createEmptyData()
  private dataCallbacks: Array<(data: RoamingData) => void> = []

  private isRoaming: boolean = false

  // 视角参数
  private lookAheadDistance: number = 10 // 向前看的距离（米）
  private cameraHeight: number = 1.7 // 相机高度（米，人眼高度）
  private pitchAngle: number = 0 // 俯仰角（度）

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer
    this.scene = viewer.scene
    this.camera = viewer.camera
  }

  /**
   * 开始室内漫游
   */
  start(options: IndoorRoamingOptions): void {
    this.stop()

    const {
      waypoints,
      duration = 60,
      speedMultiplier = 1,
      loop = false,
      interpolation = 'hermite',
      interpolationDegree,
      cameraHeight = 1.7,
      pitchAngle = 0,
      lookAheadDistance = 10,
      showPath = false,
      pathOptions,
      showFrustum = false,
      frustumOptions
    } = options

    // 保存配置
    this.waypoints = waypoints.map(([lon, lat, height]) => Cesium.Cartesian3.fromDegrees(lon, lat, height))
    this.duration = duration
    this.speedMultiplier = speedMultiplier
    this.isLooping = loop
    this.cameraHeight = cameraHeight
    this.pitchAngle = pitchAngle
    this.lookAheadDistance = lookAheadDistance

    // 创建位置属性
    this.positionProperty = this.createPositionProperty(this.waypoints, duration, loop)

    // 设置插值算法
    const degree = interpolationDegree ?? (interpolation === 'hermite' ? 100 : 5)
    const algorithm =
      interpolation === 'hermite' ? Cesium.HermitePolynomialApproximation : Cesium.LagrangePolynomialApproximation

    this.positionProperty.setInterpolationOptions({
      interpolationDegree: degree,
      interpolationAlgorithm: algorithm
    })

    // 显示路径
    if (showPath) {
      this.pathEntity = this.viewer.entities.add({
        polyline: {
          positions: this.waypoints,
          width: pathOptions?.width || 2,
          material: pathOptions?.material || Cesium.Color.CYAN,
          clampToGround: false
        }
      })
    }

    // 显示视锥体
    if (showFrustum) {
      this.createFrustums(frustumOptions)
    }

    // 设置时钟
    this.viewer.clock.startTime = this.startTime!.clone()
    this.viewer.clock.stopTime = this.stopTime!.clone()
    this.viewer.clock.currentTime = this.startTime!.clone()
    this.viewer.clock.clockRange = loop ? Cesium.ClockRange.LOOP_STOP : Cesium.ClockRange.CLAMPED
    this.viewer.clock.multiplier = speedMultiplier
    this.viewer.clock.shouldAnimate = true

    // 禁用默认相机控制
    this.scene.screenSpaceCameraController.enableRotate = false
    this.scene.screenSpaceCameraController.enableTranslate = false
    this.scene.screenSpaceCameraController.enableZoom = false
    this.scene.screenSpaceCameraController.enableTilt = false
    this.scene.screenSpaceCameraController.enableLook = false

    // 帧更新
    this.tickListener = this.viewer.clock.onTick.addEventListener(() => {
      this.updateCamera()
    })

    this.isRoaming = true
  }

  /**
   * 停止室内漫游
   */
  stop(): void {
    if (!this.isRoaming) {
      return
    }

    // 移除路径实体
    if (this.pathEntity) {
      this.viewer.entities.remove(this.pathEntity)
      this.pathEntity = undefined
    }

    // 移除视锥体实体
    this.frustumEntities.forEach((entity) => {
      this.viewer.entities.remove(entity)
    })
    this.frustumEntities = []

    // 移除帧监听器
    if (this.tickListener) {
      this.tickListener()
      this.tickListener = undefined
    }

    // 恢复默认相机控制
    this.scene.screenSpaceCameraController.enableRotate = true
    this.scene.screenSpaceCameraController.enableTranslate = true
    this.scene.screenSpaceCameraController.enableZoom = true
    this.scene.screenSpaceCameraController.enableTilt = true
    this.scene.screenSpaceCameraController.enableLook = true

    // 停止时钟
    this.viewer.clock.shouldAnimate = false

    this.positionProperty = undefined
    this.waypoints = []
    this.data = this.createEmptyData()
    this.isRoaming = false
  }

  /**
   * 暂停或继续漫游
   */
  pauseOrContinue(shouldAnimate: boolean): void {
    this.viewer.clock.shouldAnimate = shouldAnimate
  }

  /**
   * 改变漫游速度
   */
  changeSpeed(multiplier: number): void {
    this.viewer.clock.multiplier = multiplier
    this.speedMultiplier = multiplier
  }

  /**
   * 监听实时数据
   */
  onDataUpdate(callback: (data: RoamingData) => void): void {
    this.dataCallbacks.push(callback)
  }

  /**
   * 获取当前漫游数据
   */
  getRoamingData(): RoamingData {
    return { ...this.data }
  }

  /**
   * 是否正在漫游
   */
  isActive(): boolean {
    return this.isRoaming
  }

  /**
   * 创建位置属性
   */
  private createPositionProperty(
    positions: Cesium.Cartesian3[],
    duration: number,
    _loop: boolean
  ): Cesium.SampledPositionProperty {
    const property = new Cesium.SampledPositionProperty()
    const lineLength = positions.length
    const start = Cesium.JulianDate.now()
    const stop = Cesium.JulianDate.addSeconds(start, duration, new Cesium.JulianDate())

    this.startTime = start
    this.stopTime = stop

    for (let i = 0; i < lineLength; i++) {
      let time = Cesium.JulianDate.addSeconds(start, (i * duration) / lineLength, new Cesium.JulianDate())
      if (i === lineLength - 1) {
        time = stop
      }
      property.addSample(time, positions[i])
    }

    return property
  }

  /**
   * 更新相机位置和姿态
   */
  private updateCamera(): void {
    if (!this.positionProperty || !this.viewer.clock.shouldAnimate) {
      return
    }

    const currentTime = this.viewer.clock.currentTime
    const currentPosition = this.positionProperty.getValue(currentTime)

    if (!currentPosition) {
      return
    }

    // 调整相机高度
    const cartographic = Cesium.Cartographic.fromCartesian(currentPosition)
    cartographic.height += this.cameraHeight
    const cameraPosition = Cesium.Cartesian3.fromRadians(
      cartographic.longitude,
      cartographic.latitude,
      cartographic.height
    )

    // 计算前方位置（用于确定朝向）
    const futureTime = Cesium.JulianDate.addSeconds(currentTime, 0.1, new Cesium.JulianDate())
    const futurePosition = this.positionProperty.getValue(futureTime)

    if (futurePosition) {
      // 计算朝向
      const direction = Cesium.Cartesian3.subtract(futurePosition, currentPosition, new Cesium.Cartesian3())
      Cesium.Cartesian3.normalize(direction, direction)

      // 计算航向角
      const heading = Math.atan2(direction.y, direction.x) - Math.PI / 2

      // 设置相机位置和朝向
      this.camera.setView({
        destination: cameraPosition,
        orientation: {
          heading: heading,
          pitch: Cesium.Math.toRadians(this.pitchAngle),
          roll: 0
        }
      })
    }

    // 更新实时数据
    this.updateRealTimeData(currentPosition)
  }

  /**
   * 更新实时数据
   */
  private updateRealTimeData(position: Cesium.Cartesian3): void {
    const cartographic = Cesium.Cartographic.fromCartesian(position)
    const totalDistance = this.calculateDistance(this.waypoints)
    const elapsedTime = Cesium.JulianDate.secondsDifference(this.viewer.clock.currentTime, this.startTime!)
    const elapsedDistance = (totalDistance / this.duration) * elapsedTime

    this.data.isRoaming = this.viewer.clock.shouldAnimate
    this.data.longitude = parseFloat(Cesium.Math.toDegrees(cartographic.longitude).toFixed(6))
    this.data.latitude = parseFloat(Cesium.Math.toDegrees(cartographic.latitude).toFixed(6))
    this.data.elevation = parseFloat(cartographic.height.toFixed(2))
    this.data.totalDuration = this.duration
    this.data.elapsedDuration = parseFloat(elapsedTime.toFixed(2))
    this.data.totalDistance = parseFloat(totalDistance.toFixed(3))
    this.data.elapsedDistance = parseFloat(elapsedDistance.toFixed(3))
    this.data.progress = parseFloat(((elapsedDistance / totalDistance) * 100).toFixed(0))
    this.data.totalDurationFormatted = this.formatSeconds(this.duration)
    this.data.elapsedDurationFormatted = this.formatSeconds(elapsedTime)

    // 简化版：室内场景通常不需要地形高度
    this.data.terrainHeight = 0
    this.data.heightAboveTerrain = this.data.elevation

    // 触发数据回调
    this.dataCallbacks.forEach((callback) => callback(this.data))
  }

  /**
   * 计算路径总距离
   */
  private calculateDistance(positions: Cesium.Cartesian3[]): number {
    let distance = 0
    for (let i = 0; i < positions.length - 1; i++) {
      distance += Cesium.Cartesian3.distance(positions[i], positions[i + 1])
    }
    return distance
  }

  /**
   * 格式化秒数为时分秒
   */
  private formatSeconds(totalSeconds: number): string {
    const secondTime = parseInt(totalSeconds.toString())
    let min = 0
    let h = 0

    if (secondTime >= 60) {
      min = parseInt((secondTime / 60).toString())
      const remainingSeconds = parseInt((secondTime % 60).toString())

      if (min >= 60) {
        h = parseInt((min / 60).toString())
        min = parseInt((min % 60).toString())
      }

      const hStr = h === 0 ? '' : `${h}小时`
      const minStr = min === 0 ? '' : `${min}分钟`
      const secStr = remainingSeconds === 0 ? '' : `${remainingSeconds}秒`
      const result = `${hStr}${minStr}${secStr}`
      return result === '' ? '0秒' : result
    }

    return secondTime === 0 ? '0秒' : `${secondTime}秒`
  }

  /**
   * 创建视锥体
   */
  private createFrustums(options?: IndoorRoamingOptions['frustumOptions']): void {
    const length = options?.length ?? 50
    const fov = options?.fov ?? 60
    const color = options?.color ?? Cesium.Color.YELLOW.withAlpha(0.3)
    const outlineColor = options?.outlineColor ?? Cesium.Color.YELLOW
    const outlineWidth = options?.outlineWidth ?? 2
    const fill = options?.fill ?? true
    const outline = options?.outline ?? true

    // 计算视野角度（弧度）
    const fovRadians = Cesium.Math.toRadians(fov)
    const halfFov = fovRadians / 2

    // 为每个航点创建视锥体
    for (let i = 0; i < this.waypoints.length - 1; i++) {
      const currentPoint = this.waypoints[i]
      const nextPoint = this.waypoints[i + 1]

      // 计算前方方向
      const direction = Cesium.Cartesian3.subtract(nextPoint, currentPoint, new Cesium.Cartesian3())
      Cesium.Cartesian3.normalize(direction, direction)

      // 计算相机位置（加上人眼高度）
      const cartographic = Cesium.Cartographic.fromCartesian(currentPoint)
      cartographic.height += this.cameraHeight
      const cameraPosition = Cesium.Cartesian3.fromRadians(
        cartographic.longitude,
        cartographic.latitude,
        cartographic.height
      )

      // 创建视锥体几何
      const frustumGeometry = this.createFrustumGeometry(cameraPosition, direction, length, halfFov)

      if (frustumGeometry) {
        // 添加视锥体实体
        const frustumEntity = this.viewer.entities.add({
          polylineVolume: {
            positions: frustumGeometry.positions,
            shape: frustumGeometry.shape,
            fill: fill,
            material: color,
            outline: outline,
            outlineColor: outlineColor,
            outlineWidth: outlineWidth
          }
        })

        this.frustumEntities.push(frustumEntity)
      }
    }
  }

  /**
   * 创建视锥体几何数据
   */
  private createFrustumGeometry(
    cameraPosition: Cesium.Cartesian3,
    direction: Cesium.Cartesian3,
    length: number,
    halfFov: number
  ): { positions: Cesium.Cartesian3[]; shape: Cesium.Cartesian2[] } | null {
    try {
      // 计算视锥体终点
      const endPoint = Cesium.Cartesian3.add(
        cameraPosition,
        Cesium.Cartesian3.multiplyByScalar(direction, length, new Cesium.Cartesian3()),
        new Cesium.Cartesian3()
      )

      // 计算上方向和右方向
      const up = Cesium.Cartesian3.UNIT_Z
      const right = Cesium.Cartesian3.cross(direction, up, new Cesium.Cartesian3())
      Cesium.Cartesian3.normalize(right, right)
      const actualUp = Cesium.Cartesian3.cross(right, direction, new Cesium.Cartesian3())
      Cesium.Cartesian3.normalize(actualUp, actualUp)

      // 计算视锥体宽度和高度（在终点处）
      const aspectRatio = 16 / 9 // 宽高比
      const endHeight = 2 * length * Math.tan(halfFov)
      const endWidth = endHeight * aspectRatio

      // 创建中心线路径
      const positions = [cameraPosition, endPoint]

      // 创建视锥体截面形状（梯形）
      const shape = [
        new Cesium.Cartesian2(-endWidth / 2, -endHeight / 2), // 左下
        new Cesium.Cartesian2(endWidth / 2, -endHeight / 2), // 右下
        new Cesium.Cartesian2(endWidth / 2, endHeight / 2), // 右上
        new Cesium.Cartesian2(-endWidth / 2, endHeight / 2), // 左上
        new Cesium.Cartesian2(-endWidth / 2, -endHeight / 2) // 闭合
      ]

      return { positions, shape }
    } catch (e) {
      console.warn('Failed to create frustum geometry:', e)
      return null
    }
  }

  /**
   * 创建空数据对象
   */
  private createEmptyData(): RoamingData {
    return {
      isRoaming: false,
      longitude: 0,
      latitude: 0,
      elevation: 0,
      terrainHeight: 0,
      heightAboveTerrain: 0,
      totalDuration: 0,
      elapsedDuration: 0,
      totalDistance: 0,
      elapsedDistance: 0,
      progress: 0,
      totalDurationFormatted: '0秒',
      elapsedDurationFormatted: '0秒'
    }
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.stop()
    this.dataCallbacks = []
  }
}
