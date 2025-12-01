import * as Cesium from 'cesium'
import { EditBase } from './EditBase'
import type { EditController, VideoEditControlPoint, VideoEditPointEntity, VideoFusionEditPrimitive } from '../types'

/**
 * 视频融合编辑类
 * 支持：
 * - 角点拖拽调整投影区域
 * - 边中点拖拽调整边
 * - 中心点拖拽整体移动
 * - 旋转控制
 */
export class EditVideoFusion extends EditBase implements EditController {
  /** 编辑控制点实体 (角点) */
  private cornerDraggers: VideoEditPointEntity[] = []

  /** 边中点实体 */
  private edgeDraggers: VideoEditPointEntity[] = []

  /** 中心点实体 */
  private centerDragger: VideoEditPointEntity | null = null

  /** 旋转控制点实体 */
  private rotationDragger: VideoEditPointEntity | null = null

  /** 当前拖拽的控制点 */
  private activeDragger: VideoEditPointEntity | null = null

  /** 拖拽处理器 */
  private dragHandler: Cesium.ScreenSpaceEventHandler | null = null

  /** 原始位置（用于撤销） */
  private originalPositions: Cesium.Cartesian3[] = []

  /** 控制点配置 */
  private controlPointSize = 12
  private controlPointColor = Cesium.Color.YELLOW
  private edgePointColor = Cesium.Color.CYAN
  private centerPointColor = Cesium.Color.GREEN

  /**
   * 激活编辑
   */
  activate(): this {
    if (this._enabled) return this

    // 获取 Primitive 的位置
    const primitive = this.entity as unknown as VideoFusionEditPrimitive
    const positions = primitive?._positions_draw

    if (!positions || positions.length < 3) return this

    this._enabled = true
    this.originalPositions = positions.map((p) => p.clone())

    // 读取配置
    const config = primitive._videoAttribute?.config
    if (config) {
      if (config.controlPointSize) this.controlPointSize = config.controlPointSize
      if (config.controlPointColor) {
        this.controlPointColor = Cesium.Color.fromCssColorString(config.controlPointColor)
      }
    }

    // 创建编辑控制点
    this.createDraggers(positions)
    this.createEdgeDraggers(positions)
    this.createCenterDragger(positions)

    // 绑定拖拽事件
    this.bindDragEvents()

    // 触发编辑开始事件
    this.fire('edit-start', { entity: this.entity })

    return this
  }

  /**
   * 禁用编辑
   */
  disable(): this {
    if (!this._enabled) return this

    // 移除拖拽处理器
    if (this.dragHandler) {
      this.dragHandler.destroy()
      this.dragHandler = null
    }

    // 移除所有控制点
    this.removeDraggers()

    this._enabled = false
    this.activeDragger = null

    // 触发编辑结束事件
    this.fire('edit-stop', { entity: this.entity })

    return this
  }

  /**
   * 创建角点控制点
   */
  private createDraggers(positions: Cesium.Cartesian3[]): void {
    positions.forEach((pos, index) => {
      const dragger = this.dataSource.entities.add({
        position: pos,
        point: {
          pixelSize: this.controlPointSize,
          color: this.controlPointColor,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      }) as VideoEditPointEntity

      dragger._editIndex = index
      dragger._editType = 'corner'
      this.cornerDraggers.push(dragger)
    })
  }

  /**
   * 创建边中点控制点
   */
  private createEdgeDraggers(positions: Cesium.Cartesian3[]): void {
    for (let i = 0; i < positions.length; i++) {
      const nextIndex = (i + 1) % positions.length
      const midPoint = Cesium.Cartesian3.midpoint(positions[i], positions[nextIndex], new Cesium.Cartesian3())

      const dragger = this.dataSource.entities.add({
        position: midPoint,
        point: {
          pixelSize: this.controlPointSize - 2,
          color: this.edgePointColor,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      }) as VideoEditPointEntity

      dragger._editIndex = i
      dragger._editType = 'edge'
      this.edgeDraggers.push(dragger)
    }
  }

  /**
   * 创建中心点控制点
   */
  private createCenterDragger(positions: Cesium.Cartesian3[]): void {
    const center = this.calculateCenter(positions)

    this.centerDragger = this.dataSource.entities.add({
      position: center,
      point: {
        pixelSize: this.controlPointSize + 2,
        color: this.centerPointColor,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    }) as VideoEditPointEntity

    this.centerDragger._editType = 'center'
  }

  /**
   * 计算多边形中心点
   */
  private calculateCenter(positions: Cesium.Cartesian3[]): Cesium.Cartesian3 {
    const center = new Cesium.Cartesian3()
    positions.forEach((pos) => {
      Cesium.Cartesian3.add(center, pos, center)
    })
    Cesium.Cartesian3.divideByScalar(center, positions.length, center)
    return center
  }

  /**
   * 绑定拖拽事件
   */
  private bindDragEvents(): void {
    this.dragHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas)

    // 左键按下
    this.dragHandler.setInputAction((event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const picked = this.viewer.scene.pick(event.position)
      if (picked && picked.id) {
        const entity = picked.id as VideoEditPointEntity
        if (entity._editType) {
          this.activeDragger = entity
          this.viewer.scene.screenSpaceCameraController.enableRotate = false
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN)

    // 鼠标移动
    this.dragHandler.setInputAction((event: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      if (!this.activeDragger) return

      const ray = this.viewer.camera.getPickRay(event.endPosition)
      if (!ray) return

      const newPosition = this.viewer.scene.globe.pick(ray, this.viewer.scene)
      if (!newPosition) return

      this.handleDrag(this.activeDragger, newPosition)
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    // 左键抬起
    this.dragHandler.setInputAction(() => {
      if (this.activeDragger) {
        this.activeDragger = null
        this.viewer.scene.screenSpaceCameraController.enableRotate = true

        // 触发编辑完成事件
        this.fire('edit-move-point', {
          entity: this.entity,
          positions: this.getPositions()
        })
      }
    }, Cesium.ScreenSpaceEventType.LEFT_UP)
  }

  /**
   * 处理拖拽
   */
  private handleDrag(dragger: VideoEditPointEntity, newPosition: Cesium.Cartesian3): void {
    const primitive = this.entity as unknown as VideoFusionEditPrimitive
    const positions = primitive._positions_draw
    if (!positions) return

    switch (dragger._editType) {
      case 'corner':
        this.handleCornerDrag(dragger, newPosition, positions)
        break
      case 'edge':
        this.handleEdgeDrag(dragger, newPosition, positions)
        break
      case 'center':
        this.handleCenterDrag(newPosition, positions)
        break
    }

    // 更新控制点位置
    this.updateDraggers()
  }

  /**
   * 处理角点拖拽
   */
  private handleCornerDrag(
    dragger: VideoEditPointEntity,
    newPosition: Cesium.Cartesian3,
    positions: Cesium.Cartesian3[]
  ): void {
    const index = dragger._editIndex!
    positions[index] = newPosition
    dragger.position = new Cesium.ConstantPositionProperty(newPosition)
  }

  /**
   * 处理边中点拖拽
   */
  private handleEdgeDrag(
    dragger: VideoEditPointEntity,
    newPosition: Cesium.Cartesian3,
    positions: Cesium.Cartesian3[]
  ): void {
    const index = dragger._editIndex!
    const nextIndex = (index + 1) % positions.length

    // 计算位移
    const currentMidPoint = Cesium.Cartesian3.midpoint(positions[index], positions[nextIndex], new Cesium.Cartesian3())
    const offset = Cesium.Cartesian3.subtract(newPosition, currentMidPoint, new Cesium.Cartesian3())

    // 移动相邻两个角点
    Cesium.Cartesian3.add(positions[index], offset, positions[index])
    Cesium.Cartesian3.add(positions[nextIndex], offset, positions[nextIndex])
  }

  /**
   * 处理中心点拖拽（整体移动）
   */
  private handleCenterDrag(newPosition: Cesium.Cartesian3, positions: Cesium.Cartesian3[]): void {
    const currentCenter = this.calculateCenter(positions)
    const offset = Cesium.Cartesian3.subtract(newPosition, currentCenter, new Cesium.Cartesian3())

    // 移动所有角点
    positions.forEach((pos, i) => {
      Cesium.Cartesian3.add(pos, offset, positions[i])
    })
  }

  /**
   * 更新编辑属性
   * 实现 EditController 接口
   */
  updateAttrForEditing(): void {
    // 视频融合编辑不需要更新属性
    // 此方法为 EditController 接口要求
  }

  /**
   * 更新所有控制点位置
   */
  updateDraggers(): this {
    const primitive = this.entity as unknown as VideoFusionEditPrimitive
    const positions = primitive._positions_draw
    if (!positions) return this

    // 更新角点
    this.cornerDraggers.forEach((dragger, index) => {
      dragger.position = new Cesium.ConstantPositionProperty(positions[index])
    })

    // 更新边中点
    this.edgeDraggers.forEach((dragger, index) => {
      const nextIndex = (index + 1) % positions.length
      const midPoint = Cesium.Cartesian3.midpoint(positions[index], positions[nextIndex], new Cesium.Cartesian3())
      dragger.position = new Cesium.ConstantPositionProperty(midPoint)
    })

    // 更新中心点
    if (this.centerDragger) {
      const center = this.calculateCenter(positions)
      this.centerDragger.position = new Cesium.ConstantPositionProperty(center)
    }

    return this
  }

  /**
   * 移除所有控制点
   */
  private removeDraggers(): void {
    // 移除角点
    this.cornerDraggers.forEach((dragger) => {
      this.dataSource.entities.remove(dragger)
    })
    this.cornerDraggers = []

    // 移除边中点
    this.edgeDraggers.forEach((dragger) => {
      this.dataSource.entities.remove(dragger)
    })
    this.edgeDraggers = []

    // 移除中心点
    if (this.centerDragger) {
      this.dataSource.entities.remove(this.centerDragger)
      this.centerDragger = null
    }

    // 移除旋转控制点
    if (this.rotationDragger) {
      this.dataSource.entities.remove(this.rotationDragger)
      this.rotationDragger = null
    }
  }

  /**
   * 设置位置
   */
  setPositions(positions: Cesium.Cartesian3[]): void {
    const primitive = this.entity as unknown as VideoFusionEditPrimitive
    if (primitive._positions_draw && positions.length === primitive._positions_draw.length) {
      positions.forEach((pos, i) => {
        primitive._positions_draw![i] = pos.clone()
      })
      this.updateDraggers()
    }
  }

  /**
   * 获取位置
   */
  getPositions(): Cesium.Cartesian3[] {
    const primitive = this.entity as unknown as VideoFusionEditPrimitive
    return primitive._positions_draw?.map((p) => p.clone()) || []
  }

  /**
   * 获取控制点信息
   */
  getControlPoints(): VideoEditControlPoint[] {
    const points: VideoEditControlPoint[] = []

    this.cornerDraggers.forEach((dragger, index) => {
      const pos = dragger.position?.getValue(Cesium.JulianDate.now())
      if (pos) {
        points.push({
          type: 'corner',
          position: pos,
          index,
          visible: true
        })
      }
    })

    this.edgeDraggers.forEach((dragger, index) => {
      const pos = dragger.position?.getValue(Cesium.JulianDate.now())
      if (pos) {
        points.push({
          type: 'edge',
          position: pos,
          index,
          visible: true
        })
      }
    })

    if (this.centerDragger) {
      const pos = this.centerDragger.position?.getValue(Cesium.JulianDate.now())
      if (pos) {
        points.push({
          type: 'center',
          position: pos,
          index: -1,
          visible: true
        })
      }
    }

    return points
  }

  /**
   * 撤销到原始位置
   */
  reset(): void {
    const primitive = this.entity as unknown as VideoFusionEditPrimitive
    if (primitive._positions_draw && this.originalPositions.length === primitive._positions_draw.length) {
      this.originalPositions.forEach((pos, i) => {
        primitive._positions_draw![i] = pos.clone()
      })
      this.updateDraggers()
    }
  }
}
