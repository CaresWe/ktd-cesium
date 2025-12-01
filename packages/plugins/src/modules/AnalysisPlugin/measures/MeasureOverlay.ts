/**
 * 叠面分析
 * 基于 Turf.js 实现多边形叠加分析
 * 支持相交、合并、差集、对称差、包含判断等多种空间分析操作
 */

import * as Cesium from 'cesium'
import * as turf from '@turf/turf'
import type { Feature, Polygon, MultiPolygon } from 'geojson'
import { MeasureBase } from '../MeasureBase'
import { MeasureResult, OverlayType, OverlayOptions, OverlayResult } from '../types'
import type { DrawConfig } from '../../GraphicsPlugin/types'

/**
 * 默认叠面分析配置
 */
const DEFAULT_OVERLAY_OPTIONS: Required<Omit<OverlayOptions, 'secondPolygon' | 'secondPolygonEntity'>> = {
  overlayType: OverlayType.INTERSECT,
  resultFillColor: '#ff0000',
  resultFillOpacity: 0.5,
  resultOutlineColor: '#ff0000',
  resultOutlineWidth: 3,
  showOriginalPolygons: true,
  firstPolygonColor: '#0000ff',
  secondPolygonColor: '#00ff00',
  showAreaLabel: true,
  showOverlapRatio: true,
  tolerance: 0.001
}

/**
 * 叠面分析类
 */
export class MeasureOverlay extends MeasureBase {
  measureType = 'overlay' as const

  /** 叠面分析配置 */
  private overlayOptions: Required<Omit<OverlayOptions, 'secondPolygon' | 'secondPolygonEntity'>> & {
    secondPolygon?: Cesium.Cartesian3[]
    secondPolygonEntity?: Cesium.Entity
  } = { ...DEFAULT_OVERLAY_OPTIONS }

  /** 第一个多边形位置 */
  private firstPolygon: Cesium.Cartesian3[] = []

  /** 第二个多边形位置 */
  private secondPolygon: Cesium.Cartesian3[] = []

  /** 当前绘制阶段（1: 第一个多边形, 2: 第二个多边形） */
  private drawingPhase: 1 | 2 = 1

  /** 第一个多边形实体 */
  private firstPolygonEntity: Cesium.Entity | null = null

  /** 第二个多边形实体 */
  private secondPolygonEntity: Cesium.Entity | null = null

  /** 结果多边形实体列表 */
  private resultEntities: Cesium.Entity[] = []

  /** 标签实体列表 */
  private labelEntities: Cesium.Entity[] = []

  /** 临时点实体列表 */
  private tempPointEntities: Cesium.Entity[] = []

  /** 分析结果 */
  private overlayResult: OverlayResult | null = null

  constructor(opts: DrawConfig) {
    super(opts)
  }

  /**
   * 设置叠面分析配置
   */
  setOverlayOptions(options: Partial<OverlayOptions>): this {
    this.overlayOptions = { ...this.overlayOptions, ...options }

    // 如果提供了第二个多边形，直接使用
    if (options.secondPolygon) {
      this.secondPolygon = options.secondPolygon
      this.drawingPhase = 1 // 只需绘制第一个多边形
    }

    // 如果提供了第二个多边形实体，从实体获取多边形
    if (options.secondPolygonEntity) {
      const entity = options.secondPolygonEntity
      if (entity.polygon && entity.polygon.hierarchy) {
        const hierarchy = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now())
        if (hierarchy && hierarchy.positions) {
          this.secondPolygon = hierarchy.positions
          this.drawingPhase = 1
        }
      }
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

    // 绑定移动端长按事件
    this.bindLongPressEvent(() => {
      this.onRightClick()
    })
  }

  /**
   * 计算量算结果
   */
  protected calculateResult(positions: Cesium.Cartesian3[]): MeasureResult {
    const currentPolygon = this.drawingPhase === 1 ? this.firstPolygon : this.secondPolygon

    if (currentPolygon.length < 3) {
      return {
        type: this.measureType,
        value: 0,
        positions: [...positions],
        text: `绘制多边形 ${this.drawingPhase}（至少3个点）`
      }
    }

    const area = this.calculateArea(currentPolygon)

    return {
      type: this.measureType,
      value: area,
      positions: [...positions],
      text: `多边形 ${this.drawingPhase} 面积: ${this.formatArea(area)}`
    }
  }

  /**
   * 更新显示
   */
  protected updateDisplay(positions: Cesium.Cartesian3[]): void {
    if (positions.length === 0) return

    // 清除临时点
    this.clearTempPoints()

    // 创建临时点
    positions.forEach((position) => {
      const entity = this.createPointEntity(position)
      this.tempPointEntities.push(entity)
    })

    // 绘制多边形
    if (positions.length >= 3) {
      const color =
        this.drawingPhase === 1 ? this.overlayOptions.firstPolygonColor : this.overlayOptions.secondPolygonColor

      const polygonEntity = this.dataSource!.entities.add({
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(positions),
          material: Cesium.Color.fromCssColorString(color).withAlpha(0.3),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString(color),
          outlineWidth: 2
        }
      })

      if (this.drawingPhase === 1) {
        if (this.firstPolygonEntity) {
          this.dataSource?.entities.remove(this.firstPolygonEntity)
        }
        this.firstPolygonEntity = polygonEntity
      } else {
        if (this.secondPolygonEntity) {
          this.dataSource?.entities.remove(this.secondPolygonEntity)
        }
        this.secondPolygonEntity = polygonEntity
      }
    }

    // 计算结果
    this.result = this.calculateResult(positions)

    // 触发更新事件
    if (this.liveUpdate) {
      this.fire('measure:update', { result: this.result })
    }
  }

  /**
   * 执行叠面分析
   */
  private performOverlayAnalysis(): void {
    if (this.firstPolygon.length < 3 || this.secondPolygon.length < 3) {
      return
    }

    try {
      // 转换为 GeoJSON
      const geojson1 = this.cartesianArrayToGeoJSON(this.firstPolygon)
      const geojson2 = this.cartesianArrayToGeoJSON(this.secondPolygon)

      // 计算面积
      const firstArea = turf.area(geojson1)
      const secondArea = turf.area(geojson2)

      let resultGeoJSON: Feature<Polygon | MultiPolygon> | null = null
      let booleanResult: boolean | undefined

      const overlayType = this.overlayOptions.overlayType

      // 根据类型执行不同的分析
      switch (overlayType) {
        case OverlayType.INTERSECT:
        case 'intersect':
          resultGeoJSON = turf.intersect(turf.featureCollection([geojson1, geojson2])) as Feature<
            Polygon | MultiPolygon
          > | null
          break

        case OverlayType.UNION:
        case 'union':
          resultGeoJSON = turf.union(turf.featureCollection([geojson1, geojson2])) as Feature<
            Polygon | MultiPolygon
          > | null
          break

        case OverlayType.DIFFERENCE:
        case 'difference':
          resultGeoJSON = turf.difference(turf.featureCollection([geojson1, geojson2])) as Feature<
            Polygon | MultiPolygon
          > | null
          break

        case OverlayType.XOR:
        case 'xor': {
          // 对称差 = (A ∪ B) - (A ∩ B)
          const unionResult = turf.union(turf.featureCollection([geojson1, geojson2]))
          const intersectResult = turf.intersect(turf.featureCollection([geojson1, geojson2]))
          if (unionResult && intersectResult) {
            resultGeoJSON = turf.difference(turf.featureCollection([unionResult, intersectResult])) as Feature<
              Polygon | MultiPolygon
            > | null
          }
          break
        }

        case OverlayType.CONTAINS:
        case 'contains':
          booleanResult = turf.booleanContains(geojson1, geojson2)
          break

        case OverlayType.WITHIN:
        case 'within':
          booleanResult = turf.booleanWithin(geojson1, geojson2)
          break

        case OverlayType.OVERLAPS:
        case 'overlaps':
          booleanResult = turf.booleanOverlap(geojson1, geojson2)
          break

        case OverlayType.TOUCHES:
        case 'touches':
          // Turf.js 没有直接的 touches 方法，使用自定义实现
          booleanResult = this.checkTouches(geojson1, geojson2)
          break
      }

      // 计算结果面积
      let resultArea = 0
      let resultPolygon: Cesium.Cartesian3[] | undefined

      if (resultGeoJSON) {
        resultArea = turf.area(resultGeoJSON)
        resultPolygon = this.geoJSONToCartesianArray(resultGeoJSON)
      }

      // 计算重叠率
      let overlapRatio: number | undefined
      if (resultArea > 0 && firstArea > 0) {
        overlapRatio = resultArea / firstArea
      }

      // 存储结果
      this.overlayResult = {
        type: overlayType,
        firstPolygon: this.firstPolygon,
        secondPolygon: this.secondPolygon,
        resultPolygon,
        booleanResult,
        firstArea,
        secondArea,
        resultArea,
        overlapRatio,
        geoJSON: {
          first: geojson1,
          second: geojson2,
          result: resultGeoJSON || undefined
        }
      }

      // 可视化结果
      this.visualizeResult()

      // 触发完成事件
      this.result = {
        type: this.measureType,
        value: this.overlayResult as unknown as number,
        positions: [...this.firstPolygon, ...this.secondPolygon],
        text: this.formatOverlayResult()
      }

      this.fire('measure:complete', { result: this.result })
    } catch (error) {
      // 分析失败，可能是多边形不合法
      console.error('叠面分析失败:', error)

      // 触发错误事件
      this.result = {
        type: this.measureType,
        value: {
          error: error instanceof Error ? error.message : '分析失败，请检查多边形是否合法'
        },
        positions: [...this.firstPolygon, ...this.secondPolygon],
        text: '叠面分析失败'
      }

      this.fire('measure:complete', { result: this.result, error })
    }
  }

  /**
   * 检查两个多边形是否相邻
   */
  private checkTouches(polygon1: Feature<Polygon>, polygon2: Feature<Polygon>): boolean {
    // 获取边界线
    const line1 = turf.polygonToLine(polygon1)
    const line2 = turf.polygonToLine(polygon2)

    if (!line1 || !line2) return false

    // 检查边界线是否相交但内部不重叠
    const intersects = turf.lineIntersect(line1, line2)
    const overlaps = turf.booleanOverlap(polygon1, polygon2)

    return intersects.features.length > 0 && !overlaps
  }

  /**
   * 将 Cartesian3 数组转换为 GeoJSON Polygon
   */
  private cartesianArrayToGeoJSON(positions: Cesium.Cartesian3[]): Feature<Polygon> {
    const coordinates = positions.map((pos) => {
      const carto = Cesium.Cartographic.fromCartesian(pos)
      return [Cesium.Math.toDegrees(carto.longitude), Cesium.Math.toDegrees(carto.latitude)]
    })

    // 闭合多边形
    if (coordinates.length > 0) {
      coordinates.push(coordinates[0])
    }

    return turf.polygon([coordinates])
  }

  /**
   * 将 GeoJSON Polygon/MultiPolygon 转换为 Cartesian3 数组
   * 对于 MultiPolygon，返回所有多边形坐标的嵌套数组
   */
  private geoJSONToCartesianArray(geojson: Feature<Polygon | MultiPolygon>): Cesium.Cartesian3[] {
    const positions: Cesium.Cartesian3[] = []

    if (geojson.geometry.type === 'Polygon') {
      // 只取外环
      const ring = geojson.geometry.coordinates[0]
      ring.forEach((coord: number[]) => {
        positions.push(Cesium.Cartesian3.fromDegrees(coord[0], coord[1], 0))
      })
    } else if (geojson.geometry.type === 'MultiPolygon') {
      // 取第一个多边形的外环（主要部分）
      const ring = geojson.geometry.coordinates[0][0]
      ring.forEach((coord: number[]) => {
        positions.push(Cesium.Cartesian3.fromDegrees(coord[0], coord[1], 0))
      })
    }

    // 移除闭合点
    if (positions.length > 0) {
      positions.pop()
    }

    return positions
  }

  /**
   * 将 GeoJSON MultiPolygon 转换为多个 Cartesian3 数组
   */
  private geoJSONToCartesianArrays(geojson: Feature<Polygon | MultiPolygon>): Cesium.Cartesian3[][] {
    const allPositions: Cesium.Cartesian3[][] = []

    if (geojson.geometry.type === 'Polygon') {
      const positions: Cesium.Cartesian3[] = []
      const ring = geojson.geometry.coordinates[0]
      ring.forEach((coord: number[]) => {
        positions.push(Cesium.Cartesian3.fromDegrees(coord[0], coord[1], 0))
      })
      if (positions.length > 0) {
        positions.pop() // 移除闭合点
      }
      allPositions.push(positions)
    } else if (geojson.geometry.type === 'MultiPolygon') {
      geojson.geometry.coordinates.forEach((polygonCoords: number[][][]) => {
        const positions: Cesium.Cartesian3[] = []
        const ring = polygonCoords[0] // 只取外环
        ring.forEach((coord: number[]) => {
          positions.push(Cesium.Cartesian3.fromDegrees(coord[0], coord[1], 0))
        })
        if (positions.length > 0) {
          positions.pop() // 移除闭合点
        }
        if (positions.length >= 3) {
          allPositions.push(positions)
        }
      })
    }

    return allPositions
  }

  /**
   * 可视化结果
   */
  private visualizeResult(): void {
    if (!this.overlayResult) return

    // 清除旧的结果
    this.clearResults()

    // 显示原始多边形
    if (this.overlayOptions.showOriginalPolygons) {
      // 第一个多边形已经在绘制过程中创建
      // 确保颜色和样式正确
      if (this.firstPolygonEntity) {
        this.updatePolygonStyle(
          this.firstPolygonEntity,
          this.overlayOptions.firstPolygonColor,
          0.3,
          this.overlayOptions.firstPolygonColor,
          2
        )
      }

      if (this.secondPolygonEntity) {
        this.updatePolygonStyle(
          this.secondPolygonEntity,
          this.overlayOptions.secondPolygonColor,
          0.3,
          this.overlayOptions.secondPolygonColor,
          2
        )
      }
    } else {
      // 隐藏原始多边形
      if (this.firstPolygonEntity) {
        this.firstPolygonEntity.show = false
      }
      if (this.secondPolygonEntity) {
        this.secondPolygonEntity.show = false
      }
    }

    // 显示结果多边形（支持 MultiPolygon）
    if (this.overlayResult.resultPolygon && this.overlayResult.resultPolygon.length >= 3) {
      const resultEntity = this.dataSource!.entities.add({
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(this.overlayResult.resultPolygon),
          material: Cesium.Color.fromCssColorString(this.overlayOptions.resultFillColor).withAlpha(
            this.overlayOptions.resultFillOpacity
          ),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString(this.overlayOptions.resultOutlineColor),
          outlineWidth: this.overlayOptions.resultOutlineWidth
        }
      })
      this.resultEntities.push(resultEntity)
    } else if (this.overlayResult.geoJSON?.result) {
      // 处理 MultiPolygon 结果，显示所有部分
      const allPolygons = this.geoJSONToCartesianArrays(this.overlayResult.geoJSON.result)
      allPolygons.forEach((positions) => {
        if (positions.length >= 3) {
          const resultEntity = this.dataSource!.entities.add({
            polygon: {
              hierarchy: new Cesium.PolygonHierarchy(positions),
              material: Cesium.Color.fromCssColorString(this.overlayOptions.resultFillColor).withAlpha(
                this.overlayOptions.resultFillOpacity
              ),
              outline: true,
              outlineColor: Cesium.Color.fromCssColorString(this.overlayOptions.resultOutlineColor),
              outlineWidth: this.overlayOptions.resultOutlineWidth
            }
          })
          this.resultEntities.push(resultEntity)
        }
      })
    }

    // 显示标签
    if (this.overlayOptions.showAreaLabel) {
      this.createAreaLabels()
    }
  }

  /**
   * 更新多边形样式
   */
  private updatePolygonStyle(
    entity: Cesium.Entity,
    fillColor: string,
    fillAlpha: number,
    outlineColor: string,
    outlineWidth: number
  ): void {
    if (entity.polygon) {
      entity.polygon.material = new Cesium.ColorMaterialProperty(
        Cesium.Color.fromCssColorString(fillColor).withAlpha(fillAlpha)
      )
      entity.polygon.outlineColor = new Cesium.ConstantProperty(Cesium.Color.fromCssColorString(outlineColor))
      entity.polygon.outlineWidth = new Cesium.ConstantProperty(outlineWidth)
    }
  }

  /**
   * 创建面积标签
   */
  private createAreaLabels(): void {
    if (!this.overlayResult) return

    // 第一个多边形的中心点标签
    if (this.firstPolygon.length >= 3) {
      const center = this.calculatePolygonCenter(this.firstPolygon)
      const label = this.createLabelEntity(center, `多边形1\n面积: ${this.formatArea(this.overlayResult.firstArea)}`)
      this.labelEntities.push(label)
    }

    // 第二个多边形的中心点标签
    if (this.secondPolygon.length >= 3) {
      const center = this.calculatePolygonCenter(this.secondPolygon)
      const label = this.createLabelEntity(center, `多边形2\n面积: ${this.formatArea(this.overlayResult.secondArea)}`)
      this.labelEntities.push(label)
    }

    // 结果多边形的中心点标签
    if (this.overlayResult.resultPolygon && this.overlayResult.resultPolygon.length >= 3) {
      const center = this.calculatePolygonCenter(this.overlayResult.resultPolygon)
      let text = `结果\n面积: ${this.formatArea(this.overlayResult.resultArea)}`

      if (this.overlayOptions.showOverlapRatio && this.overlayResult.overlapRatio !== undefined) {
        text += `\n重叠率: ${(this.overlayResult.overlapRatio * 100).toFixed(2)}%`
      }

      const label = this.createLabelEntity(center, text)
      this.labelEntities.push(label)
    }

    // 布尔判断结果标签
    if (this.overlayResult.booleanResult !== undefined) {
      const center = this.calculatePolygonCenter(this.firstPolygon)
      const resultText = this.overlayResult.booleanResult ? '是' : '否'
      const label = this.createLabelEntity(center, `判断结果: ${resultText}`)
      this.labelEntities.push(label)
    }
  }

  /**
   * 计算多边形中心点
   */
  private calculatePolygonCenter(positions: Cesium.Cartesian3[]): Cesium.Cartesian3 {
    const geojson = this.cartesianArrayToGeoJSON(positions)
    const center = turf.center(geojson)
    const [lon, lat] = center.geometry.coordinates
    return Cesium.Cartesian3.fromDegrees(lon, lat, 0)
  }

  /**
   * 格式化叠面分析结果
   */
  private formatOverlayResult(): string {
    if (!this.overlayResult) return ''

    const typeNames: Record<string, string> = {
      intersect: '相交',
      union: '合并',
      difference: '差集',
      xor: '对称差',
      contains: '包含',
      within: '被包含',
      overlaps: '重叠',
      touches: '相邻'
    }

    const typeName = typeNames[this.overlayResult.type as string] || this.overlayResult.type

    if (this.overlayResult.booleanResult !== undefined) {
      return `${typeName}判断: ${this.overlayResult.booleanResult ? '是' : '否'}`
    }

    let text = `${typeName}分析\n`
    text += `多边形1面积: ${this.formatArea(this.overlayResult.firstArea)}\n`
    text += `多边形2面积: ${this.formatArea(this.overlayResult.secondArea)}\n`
    text += `结果面积: ${this.formatArea(this.overlayResult.resultArea)}`

    if (this.overlayResult.overlapRatio !== undefined) {
      text += `\n重叠率: ${(this.overlayResult.overlapRatio * 100).toFixed(2)}%`
    }

    return text
  }

  /**
   * 清除结果
   */
  private clearResults(): void {
    this.resultEntities.forEach((entity) => {
      if (this.dataSource?.entities.contains(entity)) {
        this.dataSource.entities.remove(entity)
      }
    })
    this.resultEntities = []

    this.labelEntities.forEach((entity) => {
      if (this.dataSource?.entities.contains(entity)) {
        this.dataSource.entities.remove(entity)
      }
    })
    this.labelEntities = []
  }

  /**
   * 清除临时点
   */
  private clearTempPoints(): void {
    this.tempPointEntities.forEach((entity) => {
      if (this.dataSource?.entities.contains(entity)) {
        this.dataSource.entities.remove(entity)
      }
    })
    this.tempPointEntities = []
  }

  /**
   * 完成绘制
   */
  override disable(hasWB = true): this {
    if (this.drawingPhase === 1 && this.firstPolygon.length >= 3) {
      // 第一个多边形绘制完成，开始绘制第二个
      if (this.secondPolygon.length === 0) {
        this.drawingPhase = 2
        this.clearTempPoints()
        // 继续绘制，不调用 super.disable
        return this
      }
    }

    if (this.drawingPhase === 2 && this.secondPolygon.length >= 3) {
      // 两个多边形都绘制完成，执行分析
      this.performOverlayAnalysis()
    }

    return super.disable(hasWB)
  }

  /**
   * 鼠标移动事件
   */
  protected onMouseMove(position: Cesium.Cartesian3): void {
    const currentPolygon = this.drawingPhase === 1 ? this.firstPolygon : this.secondPolygon

    if (currentPolygon.length === 0) return

    const tempPositions = [...currentPolygon, position]
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

    if (this.drawingPhase === 1) {
      this.firstPolygon.push(position)
      this.updateDisplay(this.firstPolygon)
    } else {
      this.secondPolygon.push(position)
      this.updateDisplay(this.secondPolygon)
    }

    this.fire('measure:pointAdd', { position, phase: this.drawingPhase })
  }

  /**
   * 右键点击事件 - 完成当前多边形绘制
   */
  protected onRightClick(): void {
    const currentPolygon = this.drawingPhase === 1 ? this.firstPolygon : this.secondPolygon

    if (currentPolygon.length >= 3) {
      this.disable()
    }
  }

  /**
   * 获取叠面分析结果
   */
  getOverlayResult(): OverlayResult | null {
    return this.overlayResult
  }
}
