import * as Cesium from 'cesium'
import { getCurrentMousePosition, formatNum as utilFormatNum } from '@ktd-cesium/shared'
import { GraphicsEventType } from '../../EventPlugin'
import * as draggerCtl from './Dragger'
import type {
  EnableablePlugin,
  EventPluginInterface,
  TooltipPluginInterface,
  ExtendedViewer,
  EditExtendedEntity,
  ExtendedScreenSpaceEventHandler
} from '../types/index'

// 使用 types 中定义的 EditExtendedEntity 作为 ExtendedEntity
export type ExtendedEntity = EditExtendedEntity

/**
 * Tooltip 消息
 */
const message = {
  edit: {
    end: '单击完成编辑，右键取消'
  },
  del: {
    def: '，右击删除点',
    min: '至少需要'
  }
}

/**
 * 编辑基类
 * 所有编辑类都应该继承此类
 */
export class EditBase {
  entity: ExtendedEntity
  viewer: Cesium.Viewer
  dataSource: Cesium.CustomDataSource
  tooltip: TooltipPluginInterface | null = null
  draggers: draggerCtl.DraggerEntity[] = []
  draggerHandler: ExtendedScreenSpaceEventHandler | null = null
  protected _enabled = false
  protected _positions_draw: Cesium.Cartesian3[] | null = null
  protected _minPointNum = 1
  protected _maxPointNum = 9999
  private eventPlugin: EventPluginInterface | null = null

  /**
   * 构造函数
   */
  constructor(entity: Cesium.Entity, viewer: Cesium.Viewer, dataSource: Cesium.CustomDataSource) {
    this.entity = entity as ExtendedEntity
    this.viewer = viewer
    this.dataSource = dataSource
    this.draggers = []

    // 获取插件
    const extViewer = this.viewer as ExtendedViewer
    if (extViewer.getPlugin) {
      this.eventPlugin = extViewer.getPlugin<EventPluginInterface>('EventPlugin') || null
      this.tooltip = extViewer.getPlugin<TooltipPluginInterface>('TooltipPlugin') || null
    }
  }

  /**
   * 触发事件
   */
  fire(type: string, data?: Record<string, unknown>, propagate?: boolean): this {
    if (this.eventPlugin) {
      this.eventPlugin.fire(type, data, propagate)
    }
    return this
  }

  /**
   * 监听事件
   */
  on(type: string, fn: (...args: unknown[]) => unknown, context?: unknown): this {
    if (this.eventPlugin) {
      this.eventPlugin.on(type, fn, context)
    }
    return this
  }

  /**
   * 移除事件监听
   */
  off(type?: string, fn?: (...args: unknown[]) => unknown, context?: unknown): this {
    if (this.eventPlugin) {
      this.eventPlugin.off(type, fn, context)
    }
    return this
  }

  /**
   * 格式化数字
   * @param num 数字
   * @param digits 小数位数
   * @returns 格式化后的数字
   */
  formatNum(num: number, digits?: number): number {
    return utilFormatNum(num, digits)
  }

  /**
   * 设置鼠标样式
   */
  protected setCursor(val: boolean): void {
    const container = this.viewer.container as HTMLElement
    container.style.cursor = val ? 'crosshair' : ''
  }

  /**
   * 激活编辑
   */
  activate(): this {
    if (this._enabled) {
      return this
    }
    this._enabled = true

    this.entity.inProgress = true
    this.changePositionsToCallback()
    this.bindDraggers()
    this.bindEvent()

    const attribute = this.entity.attribute || {}
    this.fire(GraphicsEventType.EDIT_START, {
      edittype: (attribute as Record<string, unknown>).type,
      entity: this.entity
    })

    return this
  }

  /**
   * 禁用编辑
   */
  disable(): this {
    if (!this._enabled) {
      return this
    }
    this._enabled = false

    this.destroyEvent()
    this.destroyDraggers()
    this.finish()

    this.entity.inProgress = false
    const attribute = this.entity.attribute || {}
    this.fire(GraphicsEventType.EDIT_STOP, {
      edittype: (attribute as Record<string, unknown>).type,
      entity: this.entity
    })
    this.tooltip?.setVisible(false)

    return this
  }

  /**
   * 将位置转换为回调函数 (子类可重写)
   */
  protected changePositionsToCallback(): void {
    // 子类实现
  }

  /**
   * 编辑结束后调用 (子类可重写)
   */
  protected finish(): void {
    // 子类实现
  }

  /**
   * 绑定拖拽点事件
   */
  protected bindEvent(): void {
    const scratchBoundingSphere = new Cesium.BoundingSphere()
    const zOffset = new Cesium.Cartesian3()

    const draggerHandler = new Cesium.ScreenSpaceEventHandler(
      this.viewer.scene.canvas
    ) as ExtendedScreenSpaceEventHandler
    draggerHandler.dragger = null

    // 鼠标按下选中拖拽点
    draggerHandler.setInputAction((event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const pickedObject = this.viewer.scene.pick(event.position)
      if (Cesium.defined(pickedObject)) {
        const entity = (pickedObject.id || pickedObject.primitive?.id || pickedObject.primitive) as ExtendedEntity
        if (entity && (entity._isDragger ?? false)) {
          this.viewer.scene.screenSpaceCameraController.enableRotate = false
          this.viewer.scene.screenSpaceCameraController.enableTilt = false
          this.viewer.scene.screenSpaceCameraController.enableTranslate = false
          this.viewer.scene.screenSpaceCameraController.enableInputs = false

          // 关闭 popup (如果存在)
          const extViewer = this.viewer as ExtendedViewer
          if (extViewer.getPlugin) {
            const popupPlugin = extViewer.getPlugin<EnableablePlugin & { close: (entity: Cesium.Entity) => void }>(
              'PopupPlugin'
            )
            if (popupPlugin && 'close' in popupPlugin) {
              popupPlugin.close(entity as Cesium.Entity)
            }
          }

          draggerHandler.dragger = entity

          if (draggerHandler.dragger.point) {
            draggerHandler.dragger.show = false
          }
          this.setCursor(true)

          if (draggerHandler.dragger.onDragStart) {
            let position: Cesium.Cartesian3 | undefined
            const positionProp = draggerHandler.dragger.position
            if (positionProp && typeof positionProp === 'object' && 'getValue' in positionProp) {
              position = (positionProp as Cesium.Property).getValue(this.viewer.clock.currentTime) as Cesium.Cartesian3
            } else if (positionProp) {
              // 如果是直接的 Cartesian3 对象
              position = positionProp as unknown as Cesium.Cartesian3
            }
            if (position) {
              draggerHandler.dragger.onDragStart(draggerHandler.dragger, position)
            }
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN)

    // 鼠标移动拖拽
    draggerHandler.setInputAction((event: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      const dragger = draggerHandler.dragger
      if (dragger) {
        switch (dragger._pointType) {
          case draggerCtl.PointType.MoveHeight: {
            // 改变高度垂直拖动
            const dy = event.endPosition.y - event.startPosition.y

            let position: Cesium.Cartesian3 | undefined
            const positionProp = dragger.position
            if (positionProp && typeof positionProp === 'object' && 'getValue' in positionProp) {
              position = (positionProp as Cesium.Property).getValue(this.viewer.clock.currentTime) as Cesium.Cartesian3
            } else if (positionProp) {
              // 如果是直接的 Cartesian3 对象
              position = positionProp as unknown as Cesium.Cartesian3
            }

            if (!position) break

            const tangentPlane = new Cesium.EllipsoidTangentPlane(position)

            scratchBoundingSphere.center = position
            scratchBoundingSphere.radius = 1

            // 使用 camera 的 getPixelSize 方法
            const canvas = this.viewer.scene.canvas
            const metersPerPixel =
              this.viewer.camera.getPixelSize(scratchBoundingSphere, canvas.clientWidth, canvas.clientHeight) * 1.5

            Cesium.Cartesian3.multiplyByScalar(tangentPlane.zAxis, -dy * metersPerPixel, zOffset)
            const newPosition = Cesium.Cartesian3.clone(position)
            Cesium.Cartesian3.add(position, zOffset, newPosition)

            dragger.position = newPosition
            if (dragger.onDrag) {
              dragger.onDrag(dragger, newPosition, position)
            }
            this.updateAttrForEditing()
            break
          }
          default: {
            // 默认修改位置
            this.tooltip?.showAt(event.endPosition, message.edit.end)

            const point = getCurrentMousePosition(this.viewer.scene, event.endPosition, this.entity)

            if (point) {
              dragger.position = point
              if (dragger.onDrag) {
                dragger.onDrag(dragger, point)
              }
              this.updateAttrForEditing()
            }
            break
          }
        }
      } else {
        this.tooltip?.setVisible(false)

        const pickedObject = this.viewer.scene.pick(event.endPosition)
        if (Cesium.defined(pickedObject)) {
          const entity = pickedObject.id as ExtendedEntity
          if (entity && (entity._isDragger ?? false) && entity.draw_tooltip) {
            let draw_tooltip = entity.draw_tooltip

            // 可删除时，提示右击删除
            if (
              draggerCtl.PointType.Control === entity._pointType &&
              this._positions_draw &&
              this._positions_draw.length > this._minPointNum
            ) {
              draw_tooltip += message.del.def
            }

            this.tooltip?.showAt(event.endPosition, draw_tooltip)
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    // 鼠标抬起结束拖拽
    draggerHandler.setInputAction(() => {
      const dragger = draggerHandler.dragger
      if (dragger) {
        this.setCursor(false)
        dragger.show = true

        let position: Cesium.Cartesian3 | undefined
        const positionProp = dragger.position
        if (positionProp && typeof positionProp === 'object' && 'getValue' in positionProp) {
          position = (positionProp as Cesium.Property).getValue(this.viewer.clock.currentTime) as Cesium.Cartesian3
        } else if (positionProp) {
          // 如果是直接的 Cartesian3 对象
          position = positionProp as unknown as Cesium.Cartesian3
        }

        if (dragger.onDragEnd && position) {
          dragger.onDragEnd(dragger, position)
        }

        const attribute = this.entity.attribute || {}
        this.fire(GraphicsEventType.EDIT_MOVE_POINT, {
          edittype: (attribute as Record<string, unknown>).type,
          entity: this.entity,
          position: position
        })

        draggerHandler.dragger = null

        this.viewer.scene.screenSpaceCameraController.enableRotate = true
        this.viewer.scene.screenSpaceCameraController.enableTilt = true
        this.viewer.scene.screenSpaceCameraController.enableTranslate = true
        this.viewer.scene.screenSpaceCameraController.enableInputs = true
      }
    }, Cesium.ScreenSpaceEventType.LEFT_UP)

    // 右击删除点
    draggerHandler.setInputAction((event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const pickedObject = this.viewer.scene.pick(event.position)
      if (Cesium.defined(pickedObject)) {
        const entity = pickedObject.id as ExtendedEntity
        if (entity && (entity._isDragger ?? false) && draggerCtl.PointType.Control === entity._pointType) {
          const isDelOk = this.deletePointForDragger(entity, event.position)

          if (isDelOk) {
            const attribute = this.entity.attribute || {}
            this.fire(GraphicsEventType.EDIT_REMOVE_POINT, {
              edittype: (attribute as Record<string, unknown>).type,
              entity: this.entity
            })
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)

    this.draggerHandler = draggerHandler
  }

  /**
   * 销毁事件
   */
  protected destroyEvent(): void {
    this.viewer.scene.screenSpaceCameraController.enableRotate = true
    this.viewer.scene.screenSpaceCameraController.enableTilt = true
    this.viewer.scene.screenSpaceCameraController.enableTranslate = true
    this.viewer.scene.screenSpaceCameraController.enableInputs = true

    this.setCursor(false)

    if (this.draggerHandler) {
      if (this.draggerHandler.dragger) {
        this.draggerHandler.dragger.show = true
      }

      this.draggerHandler.destroy()
      this.draggerHandler = null
    }
  }

  /**
   * 绑定拖拽点 (子类需要重写)
   */
  protected bindDraggers(): void {
    // 子类实现
  }

  /**
   * 更新拖拽点
   */
  updateDraggers(): this {
    if (!this._enabled) {
      return this
    }

    this.destroyDraggers()
    this.bindDraggers()
    return this
  }

  /**
   * 销毁所有拖拽点
   */
  destroyDraggers(): void {
    for (let i = 0, len = this.draggers.length; i < len; i++) {
      this.dataSource.entities.remove(this.draggers[i] as Cesium.Entity)
    }
    this.draggers = []
  }

  /**
   * 删除拖拽点对应的位置
   */
  protected deletePointForDragger(dragger: ExtendedEntity, position: Cesium.Cartesian2): boolean {
    if (!this._positions_draw) return false

    if (this._positions_draw.length - 1 < this._minPointNum) {
      this.tooltip?.showAt(position, message.del.min + this._minPointNum)
      return false
    }

    const index = dragger.index
    if (index !== undefined && index >= 0 && index < this._positions_draw.length) {
      this._positions_draw.splice(index, 1)
      this.updateDraggers()
      this.updateAttrForEditing()
      return true
    }

    return false
  }

  /**
   * 更新编辑属性 (子类需要重写)
   */
  updateAttrForEditing(): void {
    // 子类实现
  }

  /**
   * 设置位置 (子类可重写)
   */
  setPositions(positions: Cesium.Cartesian3[]): void {
    this._positions_draw = positions
  }
}
