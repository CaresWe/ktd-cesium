import * as Cesium from 'cesium'
import type {
  RoamingOptions,
  ModelRoamingOptions,
  CircleAroundPointOptions,
  RoamingData,
  ViewMode,
  CustomViewOptions
} from './types'

/**
 * 飞行漫游管理器
 * 管理相机和模型的漫游功能
 */
export class RoamingManager {
  private viewer: Cesium.Viewer
  private entity?: Cesium.Entity
  private polylineEntity?: Cesium.Entity
  private cylinderEntity?: Cesium.Entity
  private frustumEntities: Cesium.Entity[] = []
  private waypoints: Cesium.Cartesian3[] = []
  private startTime?: Cesium.JulianDate
  private stopTime?: Cesium.JulianDate
  private duration: number = 360
  private speedMultiplier: number = 1
  private isLooping: boolean = false
  private clampToTileset: boolean = false
  private preUpdateListener?: Cesium.Event.RemoveCallback
  private circleListener?: Cesium.Event.RemoveCallback
  private data: RoamingData = this.createEmptyData()
  private dataCallbacks: Array<(data: RoamingData) => void> = []

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer
  }

  /**
   * 相机漫游
   * @param options 漫游选项
   */
  startCameraRoaming(options: RoamingOptions): void {
    this.stopRoaming()

    const {
      waypoints,
      duration = 360,
      speedMultiplier = 1,
      loop = false,
      clampToTileset = false,
      interpolation = 'hermite',
      interpolationDegree = 100,
      cameraOffset,
      showPath = false,
      pathOptions,
      showFrustum = false,
      frustumOptions
    } = options

    this.waypoints = waypoints.map(([lon, lat, height]) => Cesium.Cartesian3.fromDegrees(lon, lat, height))
    this.duration = duration
    this.speedMultiplier = speedMultiplier
    this.isLooping = loop
    this.clampToTileset = clampToTileset

    // 创建路径属性
    const positionProperty = this.createPositionProperty(this.waypoints, duration, loop)

    // 创建漫游实体
    this.entity = this.viewer.entities.add({
      availability: new Cesium.TimeIntervalCollection([
        new Cesium.TimeInterval({
          start: this.startTime!,
          stop: this.stopTime!
        })
      ]),
      position: positionProperty,
      orientation: new Cesium.VelocityOrientationProperty(positionProperty),
      path: showPath
        ? {
            show: true,
            width: pathOptions?.width || 2,
            material: pathOptions?.material || Cesium.Color.YELLOW,
            resolution: pathOptions?.resolution || 1
          }
        : undefined
    })

    // 设置插值选项
    if (this.entity.position instanceof Cesium.SampledPositionProperty && interpolation === 'hermite') {
      this.entity.position.setInterpolationOptions({
        interpolationDegree: interpolationDegree,
        interpolationAlgorithm: Cesium.HermitePolynomialApproximation
      })
    } else if (this.entity.position instanceof Cesium.SampledPositionProperty && interpolation === 'lagrange') {
      this.entity.position.setInterpolationOptions({
        interpolationDegree: Math.min(interpolationDegree, 5),
        interpolationAlgorithm: Cesium.LagrangePolynomialApproximation
      })
    }

    // 显示视锥体
    if (showFrustum) {
      const pitch = cameraOffset?.pitch ?? 0
      this.createFrustums(frustumOptions, pitch)
    }

    // 跟踪实体
    this.viewer.trackedEntity = this.entity

    // 设置相机视角
    const camera = this.viewer.camera
    const heading = Cesium.Math.toRadians(cameraOffset?.heading ?? 0)
    const pitch = Cesium.Math.toRadians(cameraOffset?.pitch ?? 0)
    const range = cameraOffset?.range ?? 100

    // 实时更新相机位置和数据
    this.preUpdateListener = this.viewer.scene.preUpdate.addEventListener(() => {
      if (this.entity) {
        const center = this.entity.position!.getValue(this.viewer.clock.currentTime)
        if (center) {
          camera.lookAt(center, new Cesium.HeadingPitchRange(heading, pitch, range))
          if (this.viewer.clock.shouldAnimate) {
            this.updateRealTimeData(center)
          }
        }
      }
    })
  }

  /**
   * 模型漫游
   * @param options 模型漫游选项
   */
  startModelRoaming(options: ModelRoamingOptions): void {
    this.stopRoaming()

    const {
      waypoints,
      duration = 360,
      speedMultiplier = 1,
      loop = false,
      clampToGround = false,
      clampToTileset = false,
      interpolation = 'lagrange',
      model,
      showLabel = false,
      labelOptions,
      showCylinder = false,
      cylinderOptions,
      showPolyline = false,
      polylineOptions,
      showPath = false,
      pathOptions,
      showFrustum = false,
      frustumOptions
    } = options

    this.waypoints = waypoints.map(([lon, lat, height]) => Cesium.Cartesian3.fromDegrees(lon, lat, height))
    this.duration = duration
    this.speedMultiplier = speedMultiplier
    this.isLooping = loop
    this.clampToTileset = clampToTileset

    // 创建路径属性
    const positionProperty = this.createPositionProperty(this.waypoints, duration, loop)

    // 创建模型实体
    this.entity = this.viewer.entities.add({
      availability: new Cesium.TimeIntervalCollection([
        new Cesium.TimeInterval({
          start: this.startTime!,
          stop: this.stopTime!
        })
      ]),
      position: positionProperty,
      orientation: new Cesium.VelocityOrientationProperty(positionProperty),
      model: model
        ? {
            uri: model.uri || '',
            minimumPixelSize: model.minimumPixelSize || 64,
            maximumScale: model.maximumScale,
            ...model
          }
        : undefined,
      label: showLabel
        ? {
            text: labelOptions?.text || '',
            font: labelOptions?.font || '14pt sans-serif',
            fillColor: labelOptions?.fillColor || Cesium.Color.WHITE,
            outlineColor: labelOptions?.outlineColor || Cesium.Color.BLACK,
            outlineWidth: labelOptions?.outlineWidth || 2,
            pixelOffset: labelOptions?.pixelOffset || new Cesium.Cartesian2(0, -40),
            show: true
          }
        : undefined,
      path: showPath
        ? {
            show: true,
            width: pathOptions?.width || 2,
            material: pathOptions?.material || Cesium.Color.YELLOW,
            resolution: pathOptions?.resolution || 1
          }
        : undefined
    })

    // 设置插值选项
    if (
      this.entity.position instanceof Cesium.SampledPositionProperty &&
      !clampToGround &&
      interpolation === 'lagrange'
    ) {
      this.entity.position.setInterpolationOptions({
        interpolationDegree: 5,
        interpolationAlgorithm: Cesium.LagrangePolynomialApproximation
      })
    } else if (this.entity.position instanceof Cesium.SampledPositionProperty && interpolation === 'hermite') {
      this.entity.position.setInterpolationOptions({
        interpolationDegree: 100,
        interpolationAlgorithm: Cesium.HermitePolynomialApproximation
      })
    }

    // 添加轨迹折线
    if (showPolyline) {
      const positions: Cesium.Cartesian3[] = []
      this.polylineEntity = this.viewer.entities.add({
        polyline: {
          positions: new Cesium.CallbackProperty(() => positions, false),
          width: polylineOptions?.width || 2,
          material: polylineOptions?.material || Cesium.Color.RED,
          show: true
        }
      })

      this.preUpdateListener = this.viewer.scene.preUpdate.addEventListener(() => {
        if (this.entity && this.viewer.clock.shouldAnimate) {
          const center = this.entity.position!.getValue(this.viewer.clock.currentTime)
          if (center) {
            positions.push(center)
            if (clampToGround) {
              this.clampPositionToGround(center)
            }
            if (clampToTileset) {
              this.clampPositionToTileset(center)
            }
            this.updateRealTimeData(center)
          }
        }
      })
    }

    // 添加圆柱体
    if (showCylinder) {
      this.cylinderEntity = this.viewer.entities.add({
        position: positionProperty,
        orientation: new Cesium.VelocityOrientationProperty(positionProperty),
        cylinder: {
          topRadius: cylinderOptions?.topRadius || 0,
          bottomRadius: cylinderOptions?.bottomRadius || 100,
          length: new Cesium.CallbackProperty(() => {
            if (this.entity) {
              const center = this.entity.position!.getValue(this.viewer.clock.currentTime)
              if (center) {
                const cartographic = Cesium.Cartographic.fromCartesian(center)
                return cartographic.height
              }
            }
            return 0
          }, false),
          material: cylinderOptions?.material || Cesium.Color.RED.withAlpha(0.3),
          heightReference: cylinderOptions?.heightReference || Cesium.HeightReference.CLAMP_TO_GROUND,
          show: true
        }
      })
    }

    // 显示视锥体
    if (showFrustum) {
      this.createFrustums(frustumOptions, -45) // 模型漫游默认向下 45 度
    }

    // 切换到俯视视角
    this.changeView(2)
  }

  /**
   * 绕点飞行
   * @param options 绕点飞行选项
   */
  startCircleAroundPoint(options: CircleAroundPointOptions): void {
    this.stopRoaming()

    const {
      center,
      radius = 500000,
      pitch = -30,
      duration = 10,
      clockwise = true,
      loop = true,
      anglePerSecond
    } = options

    const position = Cesium.Cartesian3.fromDegrees(center[0], center[1], center[2])
    const angle = anglePerSecond || 360 / duration
    const pitchRadians = Cesium.Math.toRadians(pitch)

    // 设置时钟
    const startTime = Cesium.JulianDate.fromDate(new Date())
    const stopTime = Cesium.JulianDate.addSeconds(startTime, duration, new Cesium.JulianDate())

    this.viewer.clock.startTime = startTime.clone()
    this.viewer.clock.stopTime = stopTime.clone()
    this.viewer.clock.currentTime = startTime.clone()
    this.viewer.clock.clockRange = loop ? Cesium.ClockRange.LOOP_STOP : Cesium.ClockRange.CLAMPED
    this.viewer.clock.shouldAnimate = true

    // 获取初始航向角
    const initialHeading = this.viewer.camera.heading

    // 更新航向角
    this.circleListener = this.viewer.clock.onTick.addEventListener(() => {
      const delTime = Cesium.JulianDate.secondsDifference(this.viewer.clock.currentTime, startTime)
      const heading = Cesium.Math.toRadians(delTime * angle * (clockwise ? 1 : -1)) + initialHeading

      this.viewer.scene.camera.setView({
        destination: position,
        orientation: {
          heading: heading,
          pitch: pitchRadians,
          roll: 0
        }
      })
      this.viewer.scene.camera.moveBackward(radius)
    })
  }

  /**
   * 暂停或继续漫游
   * @param shouldAnimate true 继续，false 暂停
   */
  pauseOrContinue(shouldAnimate: boolean): void {
    this.viewer.clock.shouldAnimate = shouldAnimate
  }

  /**
   * 改变飞行速度
   * @param multiplier 速度倍率
   */
  changeSpeed(multiplier: number): void {
    this.viewer.clock.multiplier = multiplier
  }

  /**
   * 停止漫游
   */
  stopRoaming(): void {
    if (this.entity) {
      this.viewer.entities.remove(this.entity)
      this.entity = undefined
    }

    if (this.polylineEntity) {
      this.viewer.entities.remove(this.polylineEntity)
      this.polylineEntity = undefined
    }

    if (this.cylinderEntity) {
      this.viewer.entities.remove(this.cylinderEntity)
      this.cylinderEntity = undefined
    }

    // 移除视锥体实体
    this.frustumEntities.forEach((entity) => {
      this.viewer.entities.remove(entity)
    })
    this.frustumEntities = []

    if (this.preUpdateListener) {
      this.preUpdateListener()
      this.preUpdateListener = undefined
    }

    if (this.circleListener) {
      this.circleListener()
      this.circleListener = undefined
    }

    this.viewer.trackedEntity = undefined
    this.pauseOrContinue(false)
    this.data = this.createEmptyData()
  }

  /**
   * 切换视角
   * @param mode 视角模式
   * @param customOptions 自定义视角选项（仅在 mode = 4 时有效）
   */
  changeView(mode: ViewMode, customOptions?: CustomViewOptions): void {
    this.viewer.trackedEntity = undefined

    switch (mode) {
      case 1: // 跟随模式
        this.viewer.trackedEntity = this.entity
        break
      case 2: // 俯视模式
        this.viewer.zoomTo(this.viewer.entities, new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-90)))
        break
      case 3: // 侧视模式
        this.viewer.zoomTo(
          this.viewer.entities,
          new Cesium.HeadingPitchRange(Cesium.Math.toRadians(-90), Cesium.Math.toRadians(-15), 8000)
        )
        break
      case 4: // 自定义模式
        this.viewer.zoomTo(
          this.viewer.entities,
          new Cesium.HeadingPitchRange(
            Cesium.Math.toRadians(customOptions?.heading || 0),
            Cesium.Math.toRadians(customOptions?.pitch || 0),
            customOptions?.range || 0
          )
        )
        break
    }
  }

  /**
   * 监听实时数据
   * @param callback 数据回调函数
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
   * 创建位置属性
   */
  private createPositionProperty(
    positions: Cesium.Cartesian3[],
    duration: number,
    loop: boolean
  ): Cesium.SampledPositionProperty {
    const property = new Cesium.SampledPositionProperty()
    const lineLength = positions.length
    const start = Cesium.JulianDate.now()
    const stop = Cesium.JulianDate.addSeconds(start, duration, new Cesium.JulianDate())

    this.startTime = start
    this.stopTime = stop

    this.viewer.clock.startTime = start.clone()
    this.viewer.clock.stopTime = stop.clone()
    this.viewer.clock.currentTime = start.clone()
    this.viewer.clock.clockRange = loop ? Cesium.ClockRange.LOOP_STOP : Cesium.ClockRange.CLAMPED
    this.viewer.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK
    this.viewer.clock.shouldAnimate = true
    this.viewer.clock.multiplier = this.speedMultiplier

    for (let i = 0; i < lineLength; i++) {
      let time = Cesium.JulianDate.addSeconds(start, (i * duration) / lineLength, new Cesium.JulianDate())
      if (i === lineLength - 1) {
        time = stop
      }
      let position = positions[i]
      if (this.clampToTileset) {
        position = this.viewer.scene.clampToHeight(position) || position
      }
      property.addSample(time, position)
    }

    return property
  }

  /**
   * 贴地处理
   */
  private async clampPositionToGround(position: Cesium.Cartesian3): Promise<void> {
    const cartographic = Cesium.Cartographic.fromCartesian(position)
    const terrainProvider = this.viewer.terrainProvider.availability
      ? this.viewer.terrainProvider
      : await Cesium.createWorldTerrainAsync()

    const updatedPositions = await Cesium.sampleTerrainMostDetailed(terrainProvider, [
      Cesium.Cartographic.fromDegrees(
        Cesium.Math.toDegrees(cartographic.longitude),
        Cesium.Math.toDegrees(cartographic.latitude)
      )
    ])

    if (this.entity && this.entity.position instanceof Cesium.SampledPositionProperty) {
      this.entity.position.addSample(
        this.viewer.clock.currentTime,
        Cesium.Cartesian3.fromRadians(
          updatedPositions[0].longitude,
          updatedPositions[0].latitude,
          updatedPositions[0].height
        )
      )
    }
  }

  /**
   * 贴模型处理
   */
  private clampPositionToTileset(position: Cesium.Cartesian3): void {
    if (this.entity && this.entity.position instanceof Cesium.SampledPositionProperty) {
      const clampedPosition = this.viewer.scene.clampToHeight(position, [this.entity])
      if (clampedPosition) {
        this.entity.position.addSample(this.viewer.clock.currentTime, clampedPosition)
      }
    }
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
    this.data.totalDuration = this.duration
    this.data.elapsedDuration = parseFloat(elapsedTime.toFixed(2))
    this.data.totalDistance = parseFloat(totalDistance.toFixed(3))
    this.data.elapsedDistance = parseFloat(elapsedDistance.toFixed(3))
    this.data.progress = parseFloat(((elapsedDistance / totalDistance) * 100).toFixed(0))
    this.data.totalDurationFormatted = this.formatSeconds(this.duration)
    this.data.elapsedDurationFormatted = this.formatSeconds(elapsedTime)

    // 获取地形高度
    ;(async () => {
      const terrainProvider = this.viewer.terrainProvider.availability
        ? this.viewer.terrainProvider
        : await Cesium.createWorldTerrainAsync()

      const updatedPositions = await Cesium.sampleTerrainMostDetailed(terrainProvider, [
        Cesium.Cartographic.fromDegrees(this.data.longitude, this.data.latitude)
      ])

      this.data.elevation = parseFloat((updatedPositions[0].height + cartographic.height).toFixed(2))
      this.data.terrainHeight = parseFloat(updatedPositions[0].height.toFixed(2))
      this.data.heightAboveTerrain = parseFloat((this.data.elevation - this.data.terrainHeight).toFixed(2))

      // 触发数据回调
      this.dataCallbacks.forEach((callback) => callback(this.data))
    })()
  }

  /**
   * 计算路径总距离
   */
  private calculateDistance(positions: Cesium.Cartesian3[]): number {
    let distance = 0
    for (let i = 0; i < positions.length - 1; i++) {
      const point1 = Cesium.Cartographic.fromCartesian(positions[i])
      const point2 = Cesium.Cartographic.fromCartesian(positions[i + 1])

      const geodesic = new Cesium.EllipsoidGeodesic()
      geodesic.setEndPoints(point1, point2)
      const s = geodesic.surfaceDistance

      const heightDiff = point2.height - point1.height
      distance += Math.sqrt(Math.pow(s, 2) + Math.pow(heightDiff, 2))
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
   * 创建视锥体
   */
  private createFrustums(options?: RoamingOptions['frustumOptions'], defaultPitch: number = -30): void {
    const length = options?.length ?? 100
    const fov = options?.fov ?? 60
    const color = options?.color ?? Cesium.Color.BLUE.withAlpha(0.3)
    const outlineColor = options?.outlineColor ?? Cesium.Color.BLUE
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

      // 创建视锥体几何
      const frustumGeometry = this.createFrustumGeometry(currentPoint, direction, length, halfFov, defaultPitch)

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
    halfFov: number,
    pitchDegrees: number
  ): { positions: Cesium.Cartesian3[]; shape: Cesium.Cartesian2[] } | null {
    try {
      // 应用俯仰角旋转方向
      const pitchRadians = Cesium.Math.toRadians(pitchDegrees)

      // 计算上方向和右方向
      const up = Cesium.Cartesian3.UNIT_Z
      const right = Cesium.Cartesian3.cross(direction, up, new Cesium.Cartesian3())
      Cesium.Cartesian3.normalize(right, right)
      const actualUp = Cesium.Cartesian3.cross(right, direction, new Cesium.Cartesian3())
      Cesium.Cartesian3.normalize(actualUp, actualUp)

      // 应用俯仰角到方向向量
      const rotatedDirection = new Cesium.Cartesian3()
      const cosPitch = Math.cos(pitchRadians)
      const sinPitch = Math.sin(pitchRadians)

      Cesium.Cartesian3.multiplyByScalar(direction, cosPitch, rotatedDirection)
      const pitchOffset = Cesium.Cartesian3.multiplyByScalar(actualUp, sinPitch, new Cesium.Cartesian3())
      Cesium.Cartesian3.add(rotatedDirection, pitchOffset, rotatedDirection)
      Cesium.Cartesian3.normalize(rotatedDirection, rotatedDirection)

      // 计算视锥体终点
      const endPoint = Cesium.Cartesian3.add(
        cameraPosition,
        Cesium.Cartesian3.multiplyByScalar(rotatedDirection, length, new Cesium.Cartesian3()),
        new Cesium.Cartesian3()
      )

      // 计算视锥体宽度和高度（在终点处）
      const aspectRatio = 16 / 9 // 宽高比
      const endHeight = 2 * length * Math.tan(halfFov)
      const endWidth = endHeight * aspectRatio

      // 创建中心线路径
      const positions = [cameraPosition, endPoint]

      // 创建视锥体截面形状（矩形）
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
   * 销毁管理器
   */
  destroy(): void {
    this.stopRoaming()
    this.dataCallbacks = []
  }
}
