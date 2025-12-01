/**
 * 三角测量
 * 测量三角形的三边长度和面积
 */

import * as Cesium from 'cesium'
import { MeasureBase } from '../MeasureBase'
import { MeasureResult } from '../types'
import type { DrawConfig } from '../../GraphicsPlugin/types'

/**
 * 三角测量类
 */
export class MeasureTriangle extends MeasureBase {
  measureType = 'triangle' as const

  private polygonEntity: Cesium.Entity | null = null
  private pointEntities: Cesium.Entity[] = []
  private labelEntity: Cesium.Entity | null = null
  private edgeLabels: Cesium.Entity[] = []
  private positions: Cesium.Cartesian3[] = []

  constructor(opts: DrawConfig) {
    super(opts)
  }

  /**
   * 创建要素
   */
  protected override createFeature(_attribute: Record<string, unknown>): Cesium.Entity | null {
    // 三角测量不需要预先创建实体
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
        value: { edge1: 0, edge2: 0, edge3: 0, area: 0 },
        positions: [...positions],
        text: ''
      }
    }

    const edge1 = this.calculateDistance(positions[0], positions[1])
    const edge2 = this.calculateDistance(positions[1], positions[2])
    const edge3 = this.calculateDistance(positions[2], positions[0])
    const area = this.calculateArea(positions)

    return {
      type: this.measureType,
      value: { edge1, edge2, edge3, area },
      positions: [...positions],
      text: `边长:\n  AB: ${this.formatDistance(edge1)}\n  BC: ${this.formatDistance(edge2)}\n  CA: ${this.formatDistance(edge3)}\n面积: ${this.formatArea(area)}`
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

    // 创建/更新三角形多边形
    if (positions.length >= 3) {
      if (this.polygonEntity) {
        this.dataSource?.entities.remove(this.polygonEntity)
      }
      this.polygonEntity = this.createPolygonEntity(positions)

      // 清除旧的边长标签
      this.edgeLabels.forEach((label) => {
        if (this.dataSource?.entities.contains(label)) {
          this.dataSource.entities.remove(label)
        }
      })
      this.edgeLabels = []

      // 添加边长标签
      const edge1 = this.calculateDistance(positions[0], positions[1])
      const edge2 = this.calculateDistance(positions[1], positions[2])
      const edge3 = this.calculateDistance(positions[2], positions[0])

      const mid1 = Cesium.Cartesian3.midpoint(positions[0], positions[1], new Cesium.Cartesian3())
      const mid2 = Cesium.Cartesian3.midpoint(positions[1], positions[2], new Cesium.Cartesian3())
      const mid3 = Cesium.Cartesian3.midpoint(positions[2], positions[0], new Cesium.Cartesian3())

      this.edgeLabels.push(
        this.createLabelEntity(mid1, `AB: ${this.formatDistance(edge1)}`, new Cesium.Cartesian2(0, -10))
      )
      this.edgeLabels.push(
        this.createLabelEntity(mid2, `BC: ${this.formatDistance(edge2)}`, new Cesium.Cartesian2(0, -10))
      )
      this.edgeLabels.push(
        this.createLabelEntity(mid3, `CA: ${this.formatDistance(edge3)}`, new Cesium.Cartesian2(0, -10))
      )

      // 计算并更新结果
      this.result = this.calculateResult(positions)

      // 计算三角形中心点
      const center = this.calculatePolygonCenter(positions)

      // 创建/更新面积标签
      if (this.labelEntity) {
        this.dataSource?.entities.remove(this.labelEntity)
      }
      const area = this.calculateArea(positions)
      this.labelEntity = this.createLabelEntity(center, `面积: ${this.formatArea(area)}`)
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
   * 开始绘制
   */
  override enable(): this {
    super.enable()
    this.fire('measure:start', { type: this.measureType })
    return this
  }

  /**
   * 完成绘制并清理资源
   */
  override disable(hasWB = true): this {
    if (this.positions.length >= 3) {
      this.result = this.calculateResult(this.positions)
      this.fire('measure:complete', { result: this.result })
    }

    // 清理边长标签
    this.edgeLabels.forEach((label) => {
      if (this.dataSource?.entities.contains(label)) {
        this.dataSource.entities.remove(label)
      }
    })
    this.edgeLabels = []

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

    // 三角测量需要三个点，点击第三个点后自动完成
    if (this.positions.length >= 3) {
      this.disable()
    }
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
