/**
 * 缓冲区分析
 * 对点、线、面几何创建指定半径的缓冲区
 */

import * as Cesium from 'cesium'
import * as turf from '@turf/turf'
import { MeasureBase } from '../MeasureBase'
import type { MeasureResult, BufferOptions } from '../types'
import type { DrawConfig } from '../../GraphicsPlugin/types'

/**
 * 缓冲区分析类
 */
export class MeasureBuffer extends MeasureBase {
  measureType = 'buffer' as const

  private originalEntities: Cesium.Entity[] = []
  private bufferEntity: Cesium.Entity | null = null
  private labelEntity: Cesium.Entity | null = null
  private positions: Cesium.Cartesian3[] = []
  private bufferPositions: Cesium.Cartesian3[] = []

  /** 缓冲区配置 */
  private bufferOptions: Required<BufferOptions>

  constructor(opts: DrawConfig) {
    super(opts)

    // 默认配置
    this.bufferOptions = {
      radius: 100,
      steps: 64,
      bufferType: 'polygon',
      fillColor: '#0000ff',
      fillOpacity: 0.3,
      outlineColor: '#0000ff',
      outlineWidth: 2,
      showOriginal: true,
      originalColor: '#ff0000',
      originalWidth: 2
    }
  }

  /**
   * 设置缓冲区配置
   */
  setBufferOptions(options: Partial<BufferOptions>): this {
    this.bufferOptions = {
      ...this.bufferOptions,
      ...options
    }
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

    this.bindLongPressEvent(() => {
      this.onRightClick()
    })
  }

  /**
   * 计算量算结果
   */
  protected calculateResult(positions: Cesium.Cartesian3[]): MeasureResult {
    if (positions.length === 0) {
      return {
        type: this.measureType,
        value: {
          radius: 0,
          bufferArea: 0,
          originalArea: 0,
          originalLength: 0,
          bufferPositions: []
        },
        positions: [],
        text: ''
      }
    }

    // 根据点的数量确定几何类型
    let geometryType: 'point' | 'line' | 'polygon' = 'point'
    if (positions.length === 1) {
      geometryType = 'point'
    } else if (positions.length === 2) {
      geometryType = 'line'
    } else {
      geometryType = 'polygon'
    }

    // 计算缓冲区
    this.bufferPositions = this.calculateBuffer(positions, geometryType)

    // 计算统计信息
    const bufferArea = this.bufferPositions.length >= 3 ? this.calculateArea(this.bufferPositions) : 0

    let originalArea = 0
    let originalLength = 0

    if (geometryType === 'polygon' && positions.length >= 3) {
      originalArea = this.calculateArea(positions)
    }

    if (geometryType === 'line' && positions.length >= 2) {
      originalLength = this.calculateTotalDistance(positions)
    }

    return {
      type: this.measureType,
      value: {
        radius: this.bufferOptions.radius,
        bufferArea,
        originalArea,
        originalLength,
        geometryType,
        bufferPositions: this.bufferPositions
      },
      positions: [...positions],
      text: `缓冲半径: ${this.bufferOptions.radius}m\n缓冲区面积: ${this.formatArea(bufferArea)}${originalArea > 0 ? `\n原始面积: ${this.formatArea(originalArea)}` : ''}${originalLength > 0 ? `\n原始长度: ${this.formatDistance(originalLength)}` : ''}`
    }
  }

  /**
   * 计算缓冲区
   */
  private calculateBuffer(
    positions: Cesium.Cartesian3[],
    geometryType: 'point' | 'line' | 'polygon'
  ): Cesium.Cartesian3[] {
    // 转换为 GeoJSON 坐标
    const coordinates = positions.map((pos) => {
      const carto = Cesium.Cartographic.fromCartesian(pos)
      return [Cesium.Math.toDegrees(carto.longitude), Cesium.Math.toDegrees(carto.latitude)]
    })

    let geometry: ReturnType<typeof turf.point> | ReturnType<typeof turf.lineString> | ReturnType<typeof turf.polygon>

    // 创建 Turf.js 几何
    if (geometryType === 'point') {
      geometry = turf.point(coordinates[0])
    } else if (geometryType === 'line') {
      geometry = turf.lineString(coordinates)
    } else {
      // 确保多边形闭合
      const closedCoords = [...coordinates]
      if (
        closedCoords.length > 0 &&
        (closedCoords[0][0] !== closedCoords[closedCoords.length - 1][0] ||
          closedCoords[0][1] !== closedCoords[closedCoords.length - 1][1])
      ) {
        closedCoords.push(closedCoords[0])
      }
      geometry = turf.polygon([closedCoords])
    }

    // 计算缓冲区（单位：公里）
    const radiusKm = this.bufferOptions.radius / 1000
    const buffered = turf.buffer(geometry, radiusKm, {
      steps: this.bufferOptions.steps,
      units: 'kilometers'
    })

    if (!buffered || !buffered.geometry) {
      return []
    }

    // 提取缓冲区边界坐标
    let bufferCoords: number[][]

    if (buffered.geometry.type === 'Polygon') {
      bufferCoords = buffered.geometry.coordinates[0]
    } else if (buffered.geometry.type === 'MultiPolygon') {
      // 取第一个多边形
      bufferCoords = buffered.geometry.coordinates[0][0]
    } else {
      return []
    }

    // 转换回 Cesium Cartesian3
    const bufferPositions: Cesium.Cartesian3[] = []

    for (const coord of bufferCoords) {
      // 获取该点的地形高程
      const cartographic = Cesium.Cartographic.fromDegrees(coord[0], coord[1], 0)
      const position = Cesium.Ellipsoid.WGS84.cartographicToCartesian(cartographic)
      const carto = Cesium.Cartographic.fromCartesian(position)
      const elevatedPosition = Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, carto.height)
      bufferPositions.push(elevatedPosition)
    }

    return bufferPositions
  }

  /**
   * 更新显示
   */
  protected updateDisplay(positions: Cesium.Cartesian3[]): void {
    if (positions.length === 0) return

    // 清除之前的实体
    this.clearEntities()

    // 显示原始几何
    if (this.bufferOptions.showOriginal) {
      this.drawOriginalGeometry(positions)
    }

    // 计算并显示缓冲区
    if (positions.length >= 1) {
      this.result = this.calculateResult(positions)

      // 绘制缓冲区
      if (this.bufferPositions.length >= 3) {
        this.drawBuffer()
      }

      // 创建标签
      const labelPos = this.calculateLabelPosition(positions)
      this.labelEntity = this.createLabelEntity(labelPos, this.result.text || '')
    }

    // 触发更新事件
    if (this.liveUpdate && positions.length >= 1) {
      this.fire('measure:update', { result: this.result })
    }
  }

  /**
   * 绘制原始几何
   */
  private drawOriginalGeometry(positions: Cesium.Cartesian3[]): void {
    if (!this.dataSource) return

    const color = Cesium.Color.fromCssColorString(this.bufferOptions.originalColor)

    if (positions.length === 1) {
      // 点
      const pointEntity = this.dataSource.entities.add({
        position: positions[0],
        point: {
          pixelSize: 10,
          color,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        }
      })
      this.originalEntities.push(pointEntity)
    } else if (positions.length === 2) {
      // 线
      const lineEntity = this.dataSource.entities.add({
        polyline: {
          positions,
          width: this.bufferOptions.originalWidth,
          material: color,
          clampToGround: true
        }
      })
      this.originalEntities.push(lineEntity)

      // 起点和终点
      const startPoint = this.dataSource.entities.add({
        position: positions[0],
        point: {
          pixelSize: 8,
          color,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        }
      })
      const endPoint = this.dataSource.entities.add({
        position: positions[1],
        point: {
          pixelSize: 8,
          color,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        }
      })
      this.originalEntities.push(startPoint, endPoint)
    } else {
      // 多边形
      const polygonEntity = this.dataSource.entities.add({
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(positions),
          material: color.withAlpha(0.3),
          outline: true,
          outlineColor: color,
          outlineWidth: this.bufferOptions.originalWidth,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        }
      })
      this.originalEntities.push(polygonEntity)

      // 顶点
      positions.forEach((pos) => {
        const vertexPoint = this.dataSource!.entities.add({
          position: pos,
          point: {
            pixelSize: 6,
            color,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 1,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
          }
        })
        this.originalEntities.push(vertexPoint)
      })
    }
  }

  /**
   * 绘制缓冲区
   */
  private drawBuffer(): void {
    if (!this.dataSource || this.bufferPositions.length < 3) return

    const fillColor = Cesium.Color.fromCssColorString(this.bufferOptions.fillColor).withAlpha(
      this.bufferOptions.fillOpacity
    )
    const outlineColor = Cesium.Color.fromCssColorString(this.bufferOptions.outlineColor)

    this.bufferEntity = this.dataSource.entities.add({
      polygon: {
        hierarchy: new Cesium.PolygonHierarchy(this.bufferPositions),
        material: fillColor,
        outline: true,
        outlineColor: outlineColor,
        outlineWidth: this.bufferOptions.outlineWidth,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      }
    })
  }

  /**
   * 计算标签位置
   */
  private calculateLabelPosition(positions: Cesium.Cartesian3[]): Cesium.Cartesian3 {
    if (positions.length === 1) {
      const carto = Cesium.Cartographic.fromCartesian(positions[0])
      return Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, carto.height + 50)
    } else if (positions.length === 2) {
      return Cesium.Cartesian3.midpoint(positions[0], positions[1], new Cesium.Cartesian3())
    } else {
      // 计算多边形中心
      return this.calculatePolygonCenter(positions)
    }
  }

  /**
   * 计算多边形中心
   */
  private calculatePolygonCenter(positions: Cesium.Cartesian3[]): Cesium.Cartesian3 {
    const cartographics = positions.map((pos) => Cesium.Cartographic.fromCartesian(pos))

    let longitude = 0
    let latitude = 0
    let height = 0

    cartographics.forEach((carto) => {
      longitude += carto.longitude
      latitude += carto.latitude
      height += carto.height
    })

    const count = cartographics.length
    return Cesium.Cartesian3.fromRadians(longitude / count, latitude / count, height / count)
  }

  /**
   * 清除所有实体
   */
  private clearEntities(): void {
    this.originalEntities.forEach((entity) => this.dataSource?.entities.remove(entity))
    this.originalEntities = []

    if (this.bufferEntity) {
      this.dataSource?.entities.remove(this.bufferEntity)
      this.bufferEntity = null
    }

    if (this.labelEntity) {
      this.dataSource?.entities.remove(this.labelEntity)
      this.labelEntity = null
    }
  }

  /**
   * 开始绘制
   */
  override enable(): this {
    super.enable()
    this.fire('measure:start', { type: this.measureType })
    return this
  }

  /**
   * 完成绘制
   */
  override disable(hasWB = true): this {
    if (this.positions.length >= 1) {
      this.result = this.calculateResult(this.positions)
      this.fire('measure:complete', { result: this.result })
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
    if (this.positions.length >= 1) {
      this.disable()
    }
  }

  /**
   * 获取缓冲区位置
   */
  getBufferPositions(): Cesium.Cartesian3[] {
    return this.bufferPositions
  }

  /**
   * 获取缓冲区面积
   */
  getBufferArea(): number {
    if (!this.result) return 0
    const value = this.result.value as { bufferArea: number }
    return value.bufferArea
  }
}
