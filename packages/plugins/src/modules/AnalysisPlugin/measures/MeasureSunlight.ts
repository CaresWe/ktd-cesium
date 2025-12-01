/**
 * 日照分析
 * 分析指定区域在特定时间段内的日照情况
 * 通过射线检测模拟太阳光线，计算每个采样点在不同时刻的光照状态
 */

import * as Cesium from 'cesium'
import { MeasureBase } from '../MeasureBase'
import { MeasureResult } from '../types'
import type { DrawConfig } from '../../GraphicsPlugin/types'
import type { SunlightOptions, SunlightDataPoint } from '../types'

/**
 * 默认日照分析配置
 */
const DEFAULT_SUNLIGHT_OPTIONS: Required<Omit<SunlightOptions, 'tileset' | 'entities' | 'heatmapGradient'>> & {
  heatmapGradient: SunlightOptions['heatmapGradient']
} = {
  startDate: new Date(),
  endDate: new Date(),
  timeInterval: 60,
  startHour: 6,
  endHour: 18,
  gridSize: 10,
  sunlightColor: '#ffff00',
  shadowColor: '#0000ff',
  sunlightThreshold: 2,
  showTimeline: false,
  showGridPoints: false,
  gridPointColor: '#ffffff',
  gridPointSize: 4,
  showDurationLabel: true,
  useHeatmap: true,
  heatmapGradient: [
    { position: 0.0, color: '#0000ff' }, // 蓝色 - 无光照
    { position: 0.3, color: '#00ffff' }, // 青色
    { position: 0.5, color: '#00ff00' }, // 绿色
    { position: 0.7, color: '#ffff00' }, // 黄色
    { position: 1.0, color: '#ff0000' } // 红色 - 充足光照
  ]
}

/**
 * 日照分析类
 */
export class MeasureSunlight extends MeasureBase {
  measureType = 'sunlight' as const

  /** 日照分析配置 */
  private sunlightOptions: Required<Omit<SunlightOptions, 'tileset' | 'entities' | 'heatmapGradient'>> & {
    tileset?: Cesium.Cesium3DTileset
    entities?: Cesium.Entity[]
    heatmapGradient: SunlightOptions['heatmapGradient']
  } = { ...DEFAULT_SUNLIGHT_OPTIONS }

  /** 区域边界实体 */
  private boundaryEntity: Cesium.Entity | null = null

  /** 热力图/网格点实体 */
  private heatmapEntity: Cesium.Entity | null = null

  /** 网格点实体列表 */
  private gridPointEntities: Cesium.Entity[] = []

  /** 标签实体列表 */
  private labelEntities: Cesium.Entity[] = []

  /** 区域顶点位置 */
  private positions: Cesium.Cartesian3[] = []

  /** 分析结果数据 */
  private sunlightData: SunlightDataPoint[] = []

  /** 是否正在分析中 */
  private isAnalyzing = false

  constructor(opts: DrawConfig) {
    super(opts)
  }

  /**
   * 设置日照分析配置
   */
  setSunlightOptions(options: Partial<SunlightOptions>): this {
    this.sunlightOptions = { ...this.sunlightOptions, ...options }
    return this
  }

  /**
   * 创建要素
   */
  protected override createFeature(_attribute: Record<string, unknown>): Cesium.Entity | null {
    return null
  }

  /**
   * 绑定事件
   */
  protected override bindEvent(): void {
    this.bindMoveEvent((screenPosition) => {
      const worldPosition = this.getWorldPosition(screenPosition)
      if (worldPosition) {
        this.onMouseMove(worldPosition)
      }
    })

    this.bindClickEvent((screenPosition) => {
      const worldPosition = this.getWorldPosition(screenPosition)
      if (worldPosition) {
        this.onLeftClick(worldPosition)
      }
    })

    this.bindRightClickEvent(() => {
      this.onRightClick()
    })

    this.bindDoubleClickEvent(() => {
      this.onRightClick()
    })

    // 绑定移动端长按事件
    this.bindLongPressEvent(() => {
      this.onRightClick()
    })
  }

  /**
   * 计算量算结果
   */
  protected calculateResult(positions: Cesium.Cartesian3[]): MeasureResult {
    if (positions.length < 3) {
      return {
        type: this.measureType,
        value: 0,
        positions: [...positions],
        text: '请绘制区域（至少3个点）'
      }
    }

    // 计算区域面积
    const area = this.calculateArea(positions)

    return {
      type: this.measureType,
      value: {
        area,
        dataPoints: this.sunlightData.length,
        averageDuration:
          this.sunlightData.length > 0
            ? this.sunlightData.reduce((sum, p) => sum + p.sunlightDuration, 0) / this.sunlightData.length
            : 0
      },
      positions: [...positions],
      text: `区域面积: ${this.formatArea(area)}\n采样点: ${this.sunlightData.length}个`
    }
  }

  /**
   * 更新显示
   */
  protected updateDisplay(positions: Cesium.Cartesian3[]): void {
    if (positions.length === 0) return

    // 清除旧的实体
    this.clearEntities()

    // 创建区域边界
    if (positions.length >= 2) {
      const displayPositions = positions.length >= 3 ? [...positions, positions[0]] : positions

      this.boundaryEntity = this.dataSource!.entities.add({
        polyline: {
          positions: displayPositions,
          width: this.style.lineWidth,
          material: Cesium.Color.fromCssColorString(this.style.lineColor),
          clampToGround: true
        }
      })
    }

    // 创建顶点
    positions.forEach((position) => {
      this.createPointEntity(position)
    })

    // 计算结果
    this.result = this.calculateResult(positions)

    // 触发更新事件
    if (this.liveUpdate) {
      this.fire('measure:update', { result: this.result })
    }
  }

  /**
   * 执行日照分析
   */
  private async performSunlightAnalysis(): Promise<void> {
    if (this.positions.length < 3) {
      return
    }

    this.isAnalyzing = true
    this.sunlightData = []

    try {
      // 生成网格采样点
      const gridPoints = this.generateGridPoints(this.positions)

      // 生成时间序列
      const timePoints = this.generateTimePoints()

      // 对每个网格点进行光照分析
      for (const point of gridPoints) {
        const sunlightStatus: boolean[] = []

        for (const time of timePoints) {
          // 计算该时刻太阳位置
          const sunPosition = this.calculateSunPosition(point.position, time)

          // 射线检测判断是否有遮挡
          const hasObstacle = this.checkObstacle(point.position, sunPosition)

          // true 表示有光照，false 表示有阴影
          sunlightStatus.push(!hasObstacle)
        }

        // 计算日照时长
        const sunlightCount = sunlightStatus.filter((status) => status).length
        const sunlightDuration = (sunlightCount * this.sunlightOptions.timeInterval) / 60 // 转换为小时
        const totalHours = (timePoints.length * this.sunlightOptions.timeInterval) / 60
        const sunlightPercentage = totalHours > 0 ? sunlightDuration / totalHours : 0

        this.sunlightData.push({
          position: point.position,
          longitude: point.longitude,
          latitude: point.latitude,
          elevation: point.elevation,
          sunlightDuration,
          sunlightPercentage,
          sunlightStatus
        })
      }

      // 可视化结果
      this.visualizeResults()

      // 更新结果
      this.result = this.calculateResult(this.positions)
      this.fire('measure:update', { result: this.result })
    } catch (_error) {
      // 日照分析失败，静默处理
    } finally {
      this.isAnalyzing = false
    }
  }

  /**
   * 生成网格采样点
   */
  private generateGridPoints(positions: Cesium.Cartesian3[]): {
    position: Cesium.Cartesian3
    longitude: number
    latitude: number
    elevation: number
  }[] {
    const points: {
      position: Cesium.Cartesian3
      longitude: number
      latitude: number
      elevation: number
    }[] = []

    // 计算区域边界框
    const cartographics = positions.map((pos) => Cesium.Cartographic.fromCartesian(pos))
    const minLon = Math.min(...cartographics.map((c) => c.longitude))
    const maxLon = Math.max(...cartographics.map((c) => c.longitude))
    const minLat = Math.min(...cartographics.map((c) => c.latitude))
    const maxLat = Math.max(...cartographics.map((c) => c.latitude))

    // 计算网格步长（经纬度）
    const earthRadius = Cesium.Ellipsoid.WGS84.maximumRadius
    const gridSizeRad = this.sunlightOptions.gridSize / earthRadius

    // 生成网格点
    for (let lon = minLon; lon <= maxLon; lon += gridSizeRad) {
      for (let lat = minLat; lat <= maxLat; lat += gridSizeRad) {
        const position = Cesium.Cartesian3.fromRadians(lon, lat, 0)

        // 检查点是否在多边形内
        if (this.isPointInPolygon(position, positions)) {
          // 采样地形高度
          const carto = Cesium.Cartographic.fromCartesian(position)
          const terrainProvider = this.viewer.terrainProvider
          const height = terrainProvider ? 0 : carto.height // 简化处理，实际应异步采样地形

          const finalPosition = Cesium.Cartesian3.fromRadians(lon, lat, height)

          points.push({
            position: finalPosition,
            longitude: Cesium.Math.toDegrees(lon),
            latitude: Cesium.Math.toDegrees(lat),
            elevation: height
          })
        }
      }
    }

    return points
  }

  /**
   * 判断点是否在多边形内（射线法）
   */
  private isPointInPolygon(point: Cesium.Cartesian3, polygon: Cesium.Cartesian3[]): boolean {
    const pointCarto = Cesium.Cartographic.fromCartesian(point)
    const polygonCarto = polygon.map((p) => Cesium.Cartographic.fromCartesian(p))

    let inside = false
    for (let i = 0, j = polygonCarto.length - 1; i < polygonCarto.length; j = i++) {
      const xi = polygonCarto[i].longitude
      const yi = polygonCarto[i].latitude
      const xj = polygonCarto[j].longitude
      const yj = polygonCarto[j].latitude

      const intersect =
        yi > pointCarto.latitude !== yj > pointCarto.latitude &&
        pointCarto.longitude < ((xj - xi) * (pointCarto.latitude - yi)) / (yj - yi) + xi

      if (intersect) inside = !inside
    }

    return inside
  }

  /**
   * 生成时间点序列
   */
  private generateTimePoints(): Date[] {
    const timePoints: Date[] = []
    const startDate = new Date(this.sunlightOptions.startDate)
    const endDate = new Date(this.sunlightOptions.endDate)

    // 遍历每一天
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      // 遍历每一天的时间段
      for (let hour = this.sunlightOptions.startHour; hour <= this.sunlightOptions.endHour; hour++) {
        for (let minute = 0; minute < 60; minute += this.sunlightOptions.timeInterval) {
          const time = new Date(date)
          time.setHours(hour, minute, 0, 0)
          timePoints.push(time)
        }
      }
    }

    return timePoints
  }

  /**
   * 计算太阳位置
   * 使用 Cesium 内置的太阳位置计算
   */
  private calculateSunPosition(observerPosition: Cesium.Cartesian3, time: Date): Cesium.Cartesian3 {
    const julianDate = Cesium.JulianDate.fromDate(time)
    const sunPosition = Cesium.Simon1994PlanetaryPositions.computeSunPositionInEarthInertialFrame(julianDate)

    if (!sunPosition) {
      // 如果计算失败，返回一个默认位置（正上方）
      return Cesium.Cartesian3.add(observerPosition, new Cesium.Cartesian3(0, 0, 1000000), new Cesium.Cartesian3())
    }

    return sunPosition
  }

  /**
   * 检测是否有遮挡物
   */
  private checkObstacle(observerPosition: Cesium.Cartesian3, sunPosition: Cesium.Cartesian3): boolean {
    // 计算从观察点到太阳方向的射线
    const direction = Cesium.Cartesian3.subtract(sunPosition, observerPosition, new Cesium.Cartesian3())
    Cesium.Cartesian3.normalize(direction, direction)

    const ray = new Cesium.Ray(observerPosition, direction)
    const scene = this.viewer.scene

    // 1. 检测地形遮挡
    const terrainIntersection = scene.globe.pick(ray, scene)
    if (terrainIntersection) {
      const distanceToTerrain = Cesium.Cartesian3.distance(observerPosition, terrainIntersection)
      const distanceToSun = Cesium.Cartesian3.distance(observerPosition, sunPosition)

      if (distanceToTerrain < distanceToSun) {
        return true
      }
    }

    // 2. 检测 3D Tiles 遮挡
    if (this.sunlightOptions.tileset) {
      if (this.checkTilesetObstacle(ray, observerPosition, sunPosition)) {
        return true
      }
    }

    // 3. 检测实体遮挡
    if (this.sunlightOptions.entities && this.sunlightOptions.entities.length > 0) {
      if (this.checkEntitiesObstacle(ray, observerPosition, sunPosition)) {
        return true
      }
    }

    return false
  }

  /**
   * 检测 3D Tiles 遮挡
   */
  private checkTilesetObstacle(
    ray: Cesium.Ray,
    observerPosition: Cesium.Cartesian3,
    sunPosition: Cesium.Cartesian3
  ): boolean {
    if (!this.sunlightOptions.tileset) {
      return false
    }

    const tileset = this.sunlightOptions.tileset
    const scene = this.viewer.scene

    // 使用射线与 tileset 的包围球进行粗略检测
    const boundingSphere = tileset.boundingSphere
    if (!boundingSphere) {
      return false
    }

    // 检测射线是否与包围球相交
    const intersection = Cesium.IntersectionTests.raySphere(ray, boundingSphere)
    if (!intersection) {
      return false
    }

    // 计算射线步进点进行采样检测
    const distanceToSun = Cesium.Cartesian3.distance(observerPosition, sunPosition)
    const stepSize = 10 // 步进距离（米）
    const maxSteps = Math.floor(distanceToSun / stepSize)

    for (let i = 1; i < maxSteps; i++) {
      const distance = i * stepSize
      const testPoint = Cesium.Cartesian3.add(
        observerPosition,
        Cesium.Cartesian3.multiplyByScalar(ray.direction, distance, new Cesium.Cartesian3()),
        new Cesium.Cartesian3()
      )

      // 将世界坐标转换为屏幕坐标进行拾取
      const screenPosition = Cesium.SceneTransforms.worldToWindowCoordinates(scene, testPoint)
      if (!screenPosition) continue

      // 使用 pick 检测该点是否在 3D Tiles 内部
      const pickedObject = scene.pick(screenPosition)
      if (
        pickedObject &&
        pickedObject.primitive instanceof Cesium.Cesium3DTileset &&
        pickedObject.primitive === tileset
      ) {
        return true
      }
    }

    return false
  }

  /**
   * 检测实体遮挡
   */
  private checkEntitiesObstacle(
    ray: Cesium.Ray,
    observerPosition: Cesium.Cartesian3,
    sunPosition: Cesium.Cartesian3
  ): boolean {
    if (!this.sunlightOptions.entities || this.sunlightOptions.entities.length === 0) {
      return false
    }

    const distanceToSun = Cesium.Cartesian3.distance(observerPosition, sunPosition)

    // 对每个实体进行遮挡检测
    for (const entity of this.sunlightOptions.entities) {
      // 检测多边形实体
      if (entity.polygon && entity.polygon.hierarchy) {
        const hierarchy = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now())
        if (hierarchy && hierarchy.positions) {
          if (this.checkPolygonIntersection(ray, hierarchy.positions, observerPosition, distanceToSun)) {
            return true
          }
        }
      }

      // 检测墙体实体
      if (entity.wall && entity.wall.positions) {
        const positions = entity.wall.positions.getValue(Cesium.JulianDate.now())
        if (positions && positions.length >= 2) {
          if (this.checkWallIntersection(ray, positions, observerPosition, distanceToSun)) {
            return true
          }
        }
      }

      // 检测盒子实体
      if (entity.box && entity.position) {
        const position = entity.position.getValue(Cesium.JulianDate.now())
        const dimensions = entity.box.dimensions?.getValue(Cesium.JulianDate.now())
        if (position && dimensions) {
          if (this.checkBoxIntersection(ray, position, dimensions, observerPosition, distanceToSun)) {
            return true
          }
        }
      }

      // 检测椭球体实体
      if (entity.ellipsoid && entity.position) {
        const position = entity.position.getValue(Cesium.JulianDate.now())
        const radii = entity.ellipsoid.radii?.getValue(Cesium.JulianDate.now())
        if (position && radii) {
          if (this.checkEllipsoidIntersection(ray, position, radii, observerPosition, distanceToSun)) {
            return true
          }
        }
      }
    }

    return false
  }

  /**
   * 检测射线与多边形的相交
   */
  private checkPolygonIntersection(
    ray: Cesium.Ray,
    positions: Cesium.Cartesian3[],
    observerPosition: Cesium.Cartesian3,
    maxDistance: number
  ): boolean {
    if (positions.length < 3) return false

    // 将多边形分解为三角形进行检测
    for (let i = 1; i < positions.length - 1; i++) {
      const p0 = positions[0]
      const p1 = positions[i]
      const p2 = positions[i + 1]

      const intersection = Cesium.IntersectionTests.rayTriangle(ray, p0, p1, p2)
      if (intersection) {
        const distance = Cesium.Cartesian3.distance(observerPosition, intersection)
        if (distance < maxDistance) {
          return true
        }
      }
    }

    return false
  }

  /**
   * 检测射线与墙体的相交
   */
  private checkWallIntersection(
    ray: Cesium.Ray,
    positions: Cesium.Cartesian3[],
    observerPosition: Cesium.Cartesian3,
    maxDistance: number
  ): boolean {
    // 简化处理：将墙体视为一系列垂直平面
    for (let i = 0; i < positions.length - 1; i++) {
      const p1 = positions[i]
      const p2 = positions[i + 1]

      // 获取地形高度（简化处理，实际应异步采样）
      const carto1 = Cesium.Cartographic.fromCartesian(p1)
      const carto2 = Cesium.Cartographic.fromCartesian(p2)

      // 创建墙面的四个顶点（底部和顶部）
      const bottomLeft = p1
      const bottomRight = p2
      const topLeft = Cesium.Cartesian3.fromRadians(carto1.longitude, carto1.latitude, carto1.height + 100) // 假设墙高100米
      const topRight = Cesium.Cartesian3.fromRadians(carto2.longitude, carto2.latitude, carto2.height + 100)

      // 将墙面分解为两个三角形
      let intersection = Cesium.IntersectionTests.rayTriangle(ray, bottomLeft, bottomRight, topLeft)
      if (intersection) {
        const distance = Cesium.Cartesian3.distance(observerPosition, intersection)
        if (distance < maxDistance) return true
      }

      intersection = Cesium.IntersectionTests.rayTriangle(ray, bottomRight, topRight, topLeft)
      if (intersection) {
        const distance = Cesium.Cartesian3.distance(observerPosition, intersection)
        if (distance < maxDistance) return true
      }
    }

    return false
  }

  /**
   * 检测射线与盒子的相交
   */
  private checkBoxIntersection(
    ray: Cesium.Ray,
    position: Cesium.Cartesian3,
    dimensions: Cesium.Cartesian3,
    observerPosition: Cesium.Cartesian3,
    maxDistance: number
  ): boolean {
    // 简化实现：将盒子视为球体进行检测
    const radius = Math.max(dimensions.x, dimensions.y, dimensions.z) / 2
    const sphere = new Cesium.BoundingSphere(position, radius)

    // 检测射线与球体的相交
    const intersection = Cesium.IntersectionTests.raySphere(ray, sphere)
    if (intersection) {
      const intersectionPoint = Cesium.Ray.getPoint(ray, intersection.start)
      const distance = Cesium.Cartesian3.distance(observerPosition, intersectionPoint)
      return distance < maxDistance
    }

    return false
  }

  /**
   * 检测射线与椭球体的相交
   */
  private checkEllipsoidIntersection(
    ray: Cesium.Ray,
    position: Cesium.Cartesian3,
    radii: Cesium.Cartesian3,
    observerPosition: Cesium.Cartesian3,
    maxDistance: number
  ): boolean {
    // 创建椭球体
    const ellipsoid = new Cesium.Ellipsoid(radii.x, radii.y, radii.z)

    // 将射线转换到椭球体局部坐标系
    const transform = Cesium.Transforms.eastNorthUpToFixedFrame(position)
    const inverseTransform = Cesium.Matrix4.inverse(transform, new Cesium.Matrix4())

    const localOrigin = Cesium.Matrix4.multiplyByPoint(inverseTransform, ray.origin, new Cesium.Cartesian3())
    const localDirection = Cesium.Matrix4.multiplyByPointAsVector(
      inverseTransform,
      ray.direction,
      new Cesium.Cartesian3()
    )
    const localRay = new Cesium.Ray(localOrigin, localDirection)

    // 检测射线与椭球体的相交
    const intersection = Cesium.IntersectionTests.rayEllipsoid(localRay, ellipsoid)
    if (intersection) {
      // 将交点转换回世界坐标系
      const worldIntersection = Cesium.Matrix4.multiplyByPoint(
        transform,
        Cesium.Ray.getPoint(localRay, intersection.start),
        new Cesium.Cartesian3()
      )
      const distance = Cesium.Cartesian3.distance(observerPosition, worldIntersection)
      return distance < maxDistance
    }

    return false
  }

  /**
   * 可视化分析结果
   */
  private visualizeResults(): void {
    // 清除旧的可视化
    this.clearVisualization()

    if (this.sunlightOptions.useHeatmap) {
      // 使用热力图渲染
      this.createHeatmap()
    } else {
      // 使用网格点渲染
      this.createGridPoints()
    }

    // 显示标签
    if (this.sunlightOptions.showDurationLabel) {
      this.createDurationLabels()
    }
  }

  /**
   * 创建热力图
   */
  private createHeatmap(): void {
    if (this.sunlightData.length === 0) return

    // 创建基于日照百分比的热力图多边形
    const positions: Cesium.Cartesian3[] = []
    const colors: Cesium.Color[] = []

    this.sunlightData.forEach((point) => {
      positions.push(point.position)

      // 根据日照百分比映射颜色
      const color = this.getColorFromGradient(point.sunlightPercentage)
      colors.push(color)
    })

    // 注意：Cesium 原生不直接支持点云热力图，这里简化处理
    // 实际应用中可使用 PointPrimitiveCollection 或自定义着色器
    if (this.sunlightOptions.showGridPoints) {
      this.sunlightData.forEach((point) => {
        const color = this.getColorFromGradient(point.sunlightPercentage)
        const entity = this.dataSource!.entities.add({
          position: point.position,
          point: {
            pixelSize: this.sunlightOptions.gridPointSize,
            color: color,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
          }
        })
        this.gridPointEntities.push(entity)
      })
    }
  }

  /**
   * 根据渐变配置获取颜色
   */
  private getColorFromGradient(value: number): Cesium.Color {
    const gradient = this.sunlightOptions.heatmapGradient || DEFAULT_SUNLIGHT_OPTIONS.heatmapGradient!

    // 限制 value 在 0-1 范围内
    const clampedValue = Math.max(0, Math.min(1, value))

    // 找到对应的渐变区间
    for (let i = 0; i < gradient.length - 1; i++) {
      const current = gradient[i]
      const next = gradient[i + 1]

      if (clampedValue >= current.position && clampedValue <= next.position) {
        // 线性插值
        const t = (clampedValue - current.position) / (next.position - current.position)
        const color1 = Cesium.Color.fromCssColorString(current.color)
        const color2 = Cesium.Color.fromCssColorString(next.color)
        return Cesium.Color.lerp(color1, color2, t, new Cesium.Color())
      }
    }

    // 默认返回最后一个颜色
    return Cesium.Color.fromCssColorString(gradient[gradient.length - 1].color)
  }

  /**
   * 创建网格点
   */
  private createGridPoints(): void {
    this.sunlightData.forEach((point) => {
      const color =
        point.sunlightDuration >= this.sunlightOptions.sunlightThreshold
          ? Cesium.Color.fromCssColorString(this.sunlightOptions.sunlightColor)
          : Cesium.Color.fromCssColorString(this.sunlightOptions.shadowColor)

      const entity = this.dataSource!.entities.add({
        position: point.position,
        point: {
          pixelSize: this.sunlightOptions.gridPointSize,
          color: color,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        }
      })
      this.gridPointEntities.push(entity)
    })
  }

  /**
   * 创建日照时长标签
   */
  private createDurationLabels(): void {
    // 只显示部分代表性点的标签，避免过于密集
    const step = Math.max(1, Math.floor(this.sunlightData.length / 20))

    this.sunlightData.forEach((point, index) => {
      if (index % step === 0) {
        const text = `${point.sunlightDuration.toFixed(1)}h`
        const entity = this.createLabelEntity(point.position, text)
        this.labelEntities.push(entity)
      }
    })
  }

  /**
   * 清除实体
   */
  private clearEntities(): void {
    if (this.boundaryEntity && this.dataSource?.entities.contains(this.boundaryEntity)) {
      this.dataSource.entities.remove(this.boundaryEntity)
      this.boundaryEntity = null
    }
  }

  /**
   * 清除可视化
   */
  private clearVisualization(): void {
    // 清除网格点
    this.gridPointEntities.forEach((entity) => {
      if (this.dataSource?.entities.contains(entity)) {
        this.dataSource.entities.remove(entity)
      }
    })
    this.gridPointEntities = []

    // 清除标签
    this.labelEntities.forEach((entity) => {
      if (this.dataSource?.entities.contains(entity)) {
        this.dataSource.entities.remove(entity)
      }
    })
    this.labelEntities = []

    // 清除热力图
    if (this.heatmapEntity && this.dataSource?.entities.contains(this.heatmapEntity)) {
      this.dataSource.entities.remove(this.heatmapEntity)
      this.heatmapEntity = null
    }
  }

  /**
   * 完成绘制
   */
  override disable(hasWB = true): this {
    if (this.positions.length >= 3 && !this.isAnalyzing) {
      // 执行日照分析
      this.performSunlightAnalysis().then(() => {
        this.result = this.calculateResult(this.positions)
        this.fire('measure:complete', { result: this.result })
      })
    }
    return super.disable(hasWB)
  }

  /**
   * 鼠标移动事件
   */
  protected onMouseMove(position: Cesium.Cartesian3): void {
    if (this.positions.length === 0) return

    const tempPositions = [...this.positions, position]
    this.updateDisplay(tempPositions)
  }

  /**
   * 左键点击事件
   */
  protected onLeftClick(position: Cesium.Cartesian3): void {
    // 检查顶点吸附
    const screenPos = Cesium.SceneTransforms.worldToWindowCoordinates(this.viewer.scene, position)
    if (screenPos) {
      const snappedPos = this.snapToVertex(screenPos)
      if (snappedPos) {
        position = snappedPos
      }
    }

    this.positions.push(position)
    this.updateDisplay(this.positions)
    this.fire('measure:pointAdd', { position, positions: [...this.positions] })
  }

  /**
   * 右键点击事件 - 完成测量
   */
  protected onRightClick(): void {
    this.disable()
  }

  /**
   * 获取分析结果数据
   */
  getSunlightData(): SunlightDataPoint[] {
    return this.sunlightData
  }
}
