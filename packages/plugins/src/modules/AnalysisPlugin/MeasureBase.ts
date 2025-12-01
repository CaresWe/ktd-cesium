/**
 * 量算基础类
 * 提供通用的量算功能和方法
 */

import * as Cesium from 'cesium'
import { DrawBase } from '../GraphicsPlugin/draw/DrawBase'
import type { DrawConfig } from '../GraphicsPlugin/types'
import type {
  MeasureTypeString,
  MeasureStyle,
  MeasureResult,
  SnapConfig,
  UnitConfig,
  MobileConfig,
  DistanceUnit,
  AreaUnit,
  CoordinateSystem
} from './types'
import type { EventPlugin } from '../EventPlugin'
import type { PickInfo } from '../EventPlugin/types'
import { formatAngle } from '@auto-cesium/shared'

/**
 * 默认量算样式
 */
export const DEFAULT_MEASURE_STYLE: Required<MeasureStyle> = {
  lineColor: '#ffff00',
  lineWidth: 2,
  pointColor: '#ff0000',
  pointSize: 8,
  fillColor: '#00ff00',
  fillOpacity: 0.3,
  labelFont: '14px sans-serif',
  labelColor: '#ffffff',
  labelBackgroundColor: '#000000',
  labelBackgroundOpacity: 0.7,
  labelPixelOffset: { x: 0, y: -20 },
  auxiliaryLineColor: '#ffffff',
  auxiliaryLineWidth: 1,
  auxiliaryLineDashLength: 10
}

/**
 * 量算基础类
 */
export abstract class MeasureBase extends DrawBase {
  /** 量算类型 */
  abstract measureType: MeasureTypeString

  /** 量算样式 */
  protected style: Required<MeasureStyle> = DEFAULT_MEASURE_STYLE

  /** 顶点吸附配置 */
  protected snapConfig: SnapConfig = {
    enabled: false,
    radius: 10,
    entities: [],
    dataSources: []
  }

  /** 单位配置 */
  protected unitConfig: Required<UnitConfig> = {
    distance: 'meter',
    area: 'squareMeter',
    coordinateSystem: 'WGS84'
  }

  /** 移动端配置 */
  protected mobileConfig: Required<MobileConfig> = {
    enableLongPress: true,
    longPressDelay: 800,
    longPressMoveThreshold: 10
  }

  /** 是否显示中间点 */
  protected showMidpoint = true

  /** 是否实时更新 */
  protected liveUpdate = true

  /** 量算结果 */
  protected result: MeasureResult | null = null

  /** 中间点实体列表 */
  protected midpointEntities: Cesium.Entity[] = []

  /** 辅助线实体列表 */
  protected auxiliaryEntities: Cesium.Entity[] = []

  constructor(opts: DrawConfig) {
    super(opts)
  }

  /**
   * 设置样式
   */
  setStyle(style: Partial<MeasureStyle>): this {
    this.style = { ...this.style, ...style }
    return this
  }

  /**
   * 设置顶点吸附配置
   */
  setSnapConfig(config: Partial<SnapConfig>): this {
    this.snapConfig = { ...this.snapConfig, ...config }
    return this
  }

  /**
   * 设置单位配置
   */
  setUnitConfig(config: Partial<UnitConfig>): this {
    this.unitConfig = { ...this.unitConfig, ...config }
    return this
  }

  /**
   * 设置移动端配置
   */
  setMobileConfig(config: Partial<MobileConfig>): this {
    this.mobileConfig = { ...this.mobileConfig, ...config }
    return this
  }

  /**
   * 顶点吸附检测
   */
  protected snapToVertex(screenPosition: Cesium.Cartesian2): Cesium.Cartesian3 | null {
    if (!this.snapConfig.enabled) {
      return null
    }

    const scene = this.viewer.scene
    const radius = this.snapConfig.radius

    // 检查数据源中的实体
    const dataSources = this.snapConfig.dataSources || []
    for (const dataSource of dataSources) {
      const entities = dataSource.entities.values
      for (const entity of entities) {
        const positions = this._getEntityPositions(entity)
        if (!positions) continue

        for (const position of positions) {
          const screenPos = Cesium.SceneTransforms.worldToWindowCoordinates(scene, position)
          if (!screenPos) continue

          const distance = Cesium.Cartesian2.distance(screenPosition, screenPos)
          if (distance <= radius) {
            // 触发吸附事件
            this.fire('measure:snap', { position })
            return position
          }
        }
      }
    }

    // 检查指定的实体列表
    const entities = this.snapConfig.entities || []
    for (const entity of entities) {
      const positions = this._getEntityPositions(entity)
      if (!positions) continue

      for (const position of positions) {
        const screenPos = Cesium.SceneTransforms.worldToWindowCoordinates(scene, position)
        if (!screenPos) continue

        const distance = Cesium.Cartesian2.distance(screenPosition, screenPos)
        if (distance <= radius) {
          this.fire('measure:snap', { position })
          return position
        }
      }
    }

    return null
  }

  /**
   * 获取实体的位置数组
   */
  private _getEntityPositions(entity: Cesium.Entity): Cesium.Cartesian3[] | null {
    if (entity.position) {
      const pos = entity.position.getValue(Cesium.JulianDate.now())
      return pos ? [pos] : null
    }

    if (entity.polyline?.positions) {
      const positions = entity.polyline.positions.getValue(Cesium.JulianDate.now())
      return positions || null
    }

    if (entity.polygon?.hierarchy) {
      const hierarchy = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now())
      return hierarchy?.positions || null
    }

    return null
  }

  /**
   * 获取鼠标位置的世界坐标（支持吸附）
   */
  protected getWorldPosition(screenPosition: Cesium.Cartesian2): Cesium.Cartesian3 | null {
    // 先尝试吸附
    const snappedPosition = this.snapToVertex(screenPosition)
    if (snappedPosition) {
      return snappedPosition
    }

    // 尝试场景拾取
    const ray = this.viewer.camera.getPickRay(screenPosition)
    if (!ray) return null

    const position = this.viewer.scene.globe.pick(ray, this.viewer.scene)
    return position || null
  }

  /**
   * 计算两点之间的空间距离
   */
  protected calculateDistance(pos1: Cesium.Cartesian3, pos2: Cesium.Cartesian3): number {
    return Cesium.Cartesian3.distance(pos1, pos2)
  }

  /**
   * 计算多点之间的总距离
   */
  protected calculateTotalDistance(positions: Cesium.Cartesian3[]): number {
    if (positions.length < 2) return 0

    let totalDistance = 0
    for (let i = 0; i < positions.length - 1; i++) {
      totalDistance += this.calculateDistance(positions[i], positions[i + 1])
    }
    return totalDistance
  }

  /**
   * 计算多边形面积
   */
  protected calculateArea(positions: Cesium.Cartesian3[]): number {
    if (positions.length < 3) return 0

    // 将Cartesian3坐标转换为经纬度
    const cartographics = positions.map((pos) => Cesium.Cartographic.fromCartesian(pos))

    // 使用球面多边形面积计算公式
    let area = 0
    for (let i = 0; i < cartographics.length; i++) {
      const j = (i + 1) % cartographics.length
      const xi = cartographics[i].longitude
      const yi = cartographics[i].latitude
      const xj = cartographics[j].longitude
      const yj = cartographics[j].latitude
      area += xi * yj - xj * yi
    }

    area = Math.abs(area) / 2.0
    const radiusSquared = Cesium.Ellipsoid.WGS84.maximumRadius * Cesium.Ellipsoid.WGS84.maximumRadius
    return area * radiusSquared
  }

  /**
   * 计算高度差
   */
  protected calculateHeightDiff(pos1: Cesium.Cartesian3, pos2: Cesium.Cartesian3): number {
    const carto1 = Cesium.Cartographic.fromCartesian(pos1)
    const carto2 = Cesium.Cartographic.fromCartesian(pos2)
    return Math.abs(carto2.height - carto1.height)
  }

  /**
   * 计算方位角（北向为0度，顺时针）
   */
  protected calculateAngle(pos1: Cesium.Cartesian3, pos2: Cesium.Cartesian3): number {
    const carto1 = Cesium.Cartographic.fromCartesian(pos1)
    const carto2 = Cesium.Cartographic.fromCartesian(pos2)

    const dLon = carto2.longitude - carto1.longitude
    const dLat = carto2.latitude - carto1.latitude

    let angle = Math.atan2(dLon, dLat) * (180 / Math.PI)
    if (angle < 0) angle += 360
    return angle
  }

  /**
   * 距离单位换算
   */
  protected convertDistance(distanceInMeters: number, unit?: DistanceUnit): number {
    const targetUnit = unit || this.unitConfig.distance
    switch (targetUnit) {
      case 'meter':
        return distanceInMeters
      case 'kilometer':
        return distanceInMeters / 1000
      case 'mile':
        return distanceInMeters / 1609.344
      case 'foot':
        return distanceInMeters * 3.28084
      default:
        return distanceInMeters
    }
  }

  /**
   * 面积单位换算
   */
  protected convertArea(areaInSquareMeters: number, unit?: AreaUnit): number {
    const targetUnit = unit || this.unitConfig.area
    switch (targetUnit) {
      case 'squareMeter':
        return areaInSquareMeters
      case 'squareKilometer':
        return areaInSquareMeters / 1000000
      case 'hectare':
        return areaInSquareMeters / 10000
      case 'acre':
        return areaInSquareMeters / 4046.8564224
      case 'squareMile':
        return areaInSquareMeters / 2589988.110336
      default:
        return areaInSquareMeters
    }
  }

  /**
   * WGS84 转 GCJ02 (火星坐标系)
   */
  private wgs84ToGcj02(lng: number, lat: number): { lng: number; lat: number } {
    const a = 6378245.0
    // WGS84椭球偏心率平方
    const ee = 0.006693421622965943

    if (this.outOfChina(lng, lat)) {
      return { lng, lat }
    }

    let dLat = this.transformLat(lng - 105.0, lat - 35.0)
    let dLng = this.transformLng(lng - 105.0, lat - 35.0)
    const radLat = (lat / 180.0) * Math.PI
    let magic = Math.sin(radLat)
    magic = 1 - ee * magic * magic
    const sqrtMagic = Math.sqrt(magic)
    dLat = (dLat * 180.0) / (((a * (1 - ee)) / (magic * sqrtMagic)) * Math.PI)
    dLng = (dLng * 180.0) / ((a / sqrtMagic) * Math.cos(radLat) * Math.PI)

    return {
      lng: lng + dLng,
      lat: lat + dLat
    }
  }

  /**
   * GCJ02 转 BD09 (百度坐标系)
   */
  private gcj02ToBd09(lng: number, lat: number): { lng: number; lat: number } {
    const x = lng
    const y = lat
    const z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin((y * Math.PI * 3000.0) / 180.0)
    const theta = Math.atan2(y, x) + 0.000003 * Math.cos((x * Math.PI * 3000.0) / 180.0)

    return {
      lng: z * Math.cos(theta) + 0.0065,
      lat: z * Math.sin(theta) + 0.006
    }
  }

  /**
   * 判断是否在中国境外
   */
  private outOfChina(lng: number, lat: number): boolean {
    return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271
  }

  /**
   * 纬度转换
   */
  private transformLat(lng: number, lat: number): number {
    let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng))
    ret += ((20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0) / 3.0
    ret += ((20.0 * Math.sin(lat * Math.PI) + 40.0 * Math.sin((lat / 3.0) * Math.PI)) * 2.0) / 3.0
    ret += ((160.0 * Math.sin((lat / 12.0) * Math.PI) + 320 * Math.sin((lat * Math.PI) / 30.0)) * 2.0) / 3.0
    return ret
  }

  /**
   * 经度转换
   */
  private transformLng(lng: number, lat: number): number {
    let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng))
    ret += ((20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0) / 3.0
    ret += ((20.0 * Math.sin(lng * Math.PI) + 40.0 * Math.sin((lng / 3.0) * Math.PI)) * 2.0) / 3.0
    ret += ((150.0 * Math.sin((lng / 12.0) * Math.PI) + 300.0 * Math.sin((lng / 30.0) * Math.PI)) * 2.0) / 3.0
    return ret
  }

  /**
   * 坐标系转换
   */
  protected convertCoordinateSystem(
    lng: number,
    lat: number,
    targetSystem?: CoordinateSystem
  ): { lng: number; lat: number } {
    const system = targetSystem || this.unitConfig.coordinateSystem

    // WGS84 是基准坐标系，CGCS2000与WGS84基本一致
    if (system === 'WGS84' || system === 'CGCS2000') {
      return { lng, lat }
    }

    // WGS84 -> GCJ02
    if (system === 'GCJ02') {
      return this.wgs84ToGcj02(lng, lat)
    }

    // WGS84 -> BD09
    if (system === 'BD09') {
      const gcj02 = this.wgs84ToGcj02(lng, lat)
      return this.gcj02ToBd09(gcj02.lng, gcj02.lat)
    }

    return { lng, lat }
  }

  /**
   * 格式化距离（带单位换算）
   */
  protected formatDistance(distance: number): string {
    const converted = this.convertDistance(distance)
    const unit = this.unitConfig.distance

    let unitText = 'm'
    switch (unit) {
      case 'kilometer':
        unitText = 'km'
        break
      case 'mile':
        unitText = 'mi'
        break
      case 'foot':
        unitText = 'ft'
        break
    }

    if (converted >= 1000 && unit === 'meter') {
      return `${(converted / 1000).toFixed(2)} km`
    }

    return `${converted.toFixed(2)} ${unitText}`
  }

  /**
   * 格式化面积（带单位换算）
   */
  protected formatArea(area: number): string {
    const converted = this.convertArea(area)
    const unit = this.unitConfig.area

    let unitText = 'm²'
    switch (unit) {
      case 'squareKilometer':
        unitText = 'km²'
        break
      case 'hectare':
        unitText = 'ha'
        break
      case 'acre':
        unitText = 'ac'
        break
      case 'squareMile':
        unitText = 'mi²'
        break
    }

    if (converted >= 1000000 && unit === 'squareMeter') {
      return `${(converted / 1000000).toFixed(2)} km²`
    }

    return `${converted.toFixed(2)} ${unitText}`
  }

  /**
   * 格式化角度
   */
  protected formatAngle(angle: number): string {
    return formatAngle(angle)
  }

  /**
   * 格式化坐标（带坐标系转换）
   */
  protected formatCoordinate(position: Cesium.Cartesian3): { lng: number; lat: number; height: number } {
    const carto = Cesium.Cartographic.fromCartesian(position)
    const lng = Cesium.Math.toDegrees(carto.longitude)
    const lat = Cesium.Math.toDegrees(carto.latitude)

    // 应用坐标系转换
    const converted = this.convertCoordinateSystem(lng, lat)

    return {
      lng: converted.lng,
      lat: converted.lat,
      height: carto.height
    }
  }

  /**
   * 创建点实体
   */
  protected createPointEntity(position: Cesium.Cartesian3, isMidpoint = false): Cesium.Entity {
    const entity = this.dataSource!.entities.add({
      position,
      point: {
        pixelSize: isMidpoint ? this.style.pointSize * 0.6 : this.style.pointSize,
        color: Cesium.Color.fromCssColorString(this.style.pointColor),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 1,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      }
    })

    if (isMidpoint) {
      this.midpointEntities.push(entity)
    }

    return entity
  }

  /**
   * 创建线实体
   */
  protected createLineEntity(positions: Cesium.Cartesian3[], isAuxiliary = false): Cesium.Entity {
    const entity = this.dataSource!.entities.add({
      polyline: {
        positions,
        width: isAuxiliary ? this.style.auxiliaryLineWidth : this.style.lineWidth,
        material: isAuxiliary
          ? new Cesium.PolylineDashMaterialProperty({
              color: Cesium.Color.fromCssColorString(this.style.auxiliaryLineColor),
              dashLength: this.style.auxiliaryLineDashLength
            })
          : Cesium.Color.fromCssColorString(this.style.lineColor),
        clampToGround: false
      }
    })

    if (isAuxiliary) {
      this.auxiliaryEntities.push(entity)
    }

    return entity
  }

  /**
   * 创建标签实体
   */
  protected createLabelEntity(
    position: Cesium.Cartesian3,
    text: string,
    pixelOffset?: Cesium.Cartesian2
  ): Cesium.Entity {
    return this.dataSource!.entities.add({
      position,
      label: {
        text,
        font: this.style.labelFont,
        fillColor: Cesium.Color.fromCssColorString(this.style.labelColor),
        backgroundColor: Cesium.Color.fromCssColorString(this.style.labelBackgroundColor).withAlpha(
          this.style.labelBackgroundOpacity
        ),
        showBackground: true,
        pixelOffset: pixelOffset || new Cesium.Cartesian2(this.style.labelPixelOffset.x, this.style.labelPixelOffset.y),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      }
    })
  }

  /**
   * 创建面实体
   */
  protected createPolygonEntity(positions: Cesium.Cartesian3[]): Cesium.Entity {
    return this.dataSource!.entities.add({
      polygon: {
        hierarchy: new Cesium.PolygonHierarchy(positions),
        material: Cesium.Color.fromCssColorString(this.style.fillColor).withAlpha(this.style.fillOpacity),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString(this.style.lineColor),
        outlineWidth: this.style.lineWidth
      }
    })
  }

  /**
   * 更新中间点
   */
  protected updateMidpoints(positions: Cesium.Cartesian3[]): void {
    // 清除旧的中间点
    this.midpointEntities.forEach((entity) => {
      if (this.dataSource?.entities.contains(entity)) {
        this.dataSource.entities.remove(entity)
      }
    })
    this.midpointEntities = []

    if (!this.showMidpoint || positions.length < 2) return

    // 创建新的中间点
    for (let i = 0; i < positions.length - 1; i++) {
      const midpoint = Cesium.Cartesian3.midpoint(positions[i], positions[i + 1], new Cesium.Cartesian3())
      this.createPointEntity(midpoint, true)
    }
  }

  /**
   * 清除辅助实体
   */
  protected clearAuxiliaryEntities(): void {
    this.auxiliaryEntities.forEach((entity) => {
      if (this.dataSource?.entities.contains(entity)) {
        this.dataSource.entities.remove(entity)
      }
    })
    this.auxiliaryEntities = []
  }

  /**
   * 抽象方法：计算量算结果
   */
  protected abstract calculateResult(positions: Cesium.Cartesian3[]): MeasureResult

  /**
   * 抽象方法：更新显示
   */
  protected abstract updateDisplay(positions: Cesium.Cartesian3[]): void

  /**
   * 获取量算结果
   */
  getResult(): MeasureResult | null {
    return this.result
  }

  /**
   * 绑定长按事件（移动端长按结束测量）
   * 内部维护长按定时器和状态
   * @param callback 长按触发时的回调函数
   */
  protected bindLongPressEvent(callback: () => void): void {
    if (!this.mobileConfig.enableLongPress) {
      return
    }

    // 获取EventPlugin实例，需要从viewer上获取
    const viewerWithPlugin = this.viewer as Cesium.Viewer & {
      getPlugin?: <T>(name: string) => T | undefined
    }
    const eventPluginInstance = viewerWithPlugin.getPlugin?.('event') as EventPlugin | undefined
    if (!eventPluginInstance) {
      return
    }

    // 移动端：长按事件实现
    let longPressTimer: ReturnType<typeof setTimeout> | null = null
    let longPressTriggered = false
    let touchStartPosition: Cesium.Cartesian2 | null = null

    // 触摸开始 - 启动长按定时器
    eventPluginInstance.onTouchStart((info: PickInfo) => {
      longPressTriggered = false
      touchStartPosition = info.position || null
      longPressTimer = setTimeout(() => {
        longPressTriggered = true
        callback()
      }, this.mobileConfig.longPressDelay)
    })

    // 触摸结束 - 清除定时器
    eventPluginInstance.onTouchEnd((_info: PickInfo) => {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
        longPressTimer = null
      }
      touchStartPosition = null
    })

    // 触摸移动 - 如果移动距离超过阈值，取消长按
    eventPluginInstance.onTouchMove((info: PickInfo) => {
      if (longPressTimer && !longPressTriggered && touchStartPosition && info.position) {
        // 计算移动距离，超过阈值则取消长按
        const dx = info.position.x - touchStartPosition.x
        const dy = info.position.y - touchStartPosition.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance > this.mobileConfig.longPressMoveThreshold) {
          clearTimeout(longPressTimer)
          longPressTimer = null
        }
      }
    })

    // 注意：这些事件监听器会在基类的 destroyHandler 方法中自动清理
    // 因为 MeasureBase 继承自 DrawBase
  }

  /**
   * 启用量算工具
   */
  enable(): this {
    // 调用父类的 activate 方法启动绘制
    super.activate({}, () => {
      // 绘制完成回调
    })
    return this
  }

  /**
   * 重写disable方法，清理中间点和辅助实体
   */
  override disable(hasWB?: boolean): this {
    // 清理中间点
    this.midpointEntities.forEach((entity) => {
      if (this.dataSource?.entities.contains(entity)) {
        this.dataSource.entities.remove(entity)
      }
    })
    this.midpointEntities = []

    // 清理辅助实体
    this.clearAuxiliaryEntities()

    return super.disable(hasWB)
  }
}
