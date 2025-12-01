/**
 * 贴地面积测量
 * 测量贴合地形表面的多边形面积
 */

import * as Cesium from 'cesium'
import { MeasureBase } from '../MeasureBase'
import { MeasureResult } from '../types'
import type { DrawConfig } from '../../GraphicsPlugin/types'

/**
 * 贴地面积测量类
 */
export class MeasureSurfaceArea extends MeasureBase {
  measureType = 'surfaceArea' as const

  private polygonEntity: Cesium.Entity | null = null
  private pointEntities: Cesium.Entity[] = []
  private labelEntity: Cesium.Entity | null = null
  private positions: Cesium.Cartesian3[] = []

  constructor(opts: DrawConfig) {
    super(opts)
  }

  /**
   * 创建要素
   */
  protected override createFeature(_attribute: Record<string, unknown>): Cesium.Entity | null {
    // 贴地面积测量不需要预先创建实体
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
    // 贴地面积使用相同的计算方法，但显示会贴地
    const area = this.calculateArea(positions)
    const perimeter = this.calculateTotalDistance(positions)

    return {
      type: this.measureType,
      value: area,
      positions: [...positions],
      text: `贴地面积: ${this.formatArea(area)}\n周长: ${this.formatDistance(perimeter)}`
    }
  }

  /**
   * 更新显示
   */
  protected updateDisplay(positions: Cesium.Cartesian3[]): void {
    if (positions.length === 0) return

    // 创建/更新点实体
    positions.forEach((position, index) => {
      if (!this.pointEntities[index]) {
        this.pointEntities[index] = this.createPointEntity(position)
      }
    })

    // 创建/更新多边形实体（贴地）
    if (positions.length >= 3) {
      if (this.polygonEntity) {
        this.dataSource?.entities.remove(this.polygonEntity)
      }
      this.polygonEntity = this.dataSource!.entities.add({
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(positions),
          material: Cesium.Color.fromCssColorString(this.style.fillColor).withAlpha(this.style.fillOpacity),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString(this.style.lineColor),
          outlineWidth: this.style.lineWidth,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        }
      })
    }

    // 更新中间点
    this.updateMidpoints(positions)

    // 计算并更新结果
    if (positions.length >= 3) {
      this.result = this.calculateResult(positions)

      // 计算多边形中心点
      const center = this.calculatePolygonCenter(positions)

      // 创建/更新面积标签
      if (this.labelEntity) {
        this.dataSource?.entities.remove(this.labelEntity)
      }
      this.labelEntity = this.createLabelEntity(center, this.result.text!)
    }

    // 触发更新事件
    if (this.liveUpdate && positions.length >= 3) {
      this.fire('measure:update', { result: this.result })
    }
  }

  /**
   * 计算多边形中心点
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
   * 完成绘制
   */
  override disable(hasWB = true): this {
    if (this.positions.length >= 3) {
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
    if (this.positions.length >= 3) {
      this.disable()
    }
  }
}
