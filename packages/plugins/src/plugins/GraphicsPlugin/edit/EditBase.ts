import * as Cesium from 'cesium'
import { MarsClass } from '../core/MarsClass'
import * as EventType from '../core/EventType'
import * as draggerCtl from './Dragger'
import { message, Tooltip } from '../core/Tooltip'
import * as Util from '../core/Util'

/**
 * 编辑基类
 * 所有编辑类都应该继承此类
 */
export const EditBase = MarsClass.extend({
  entity: null as Cesium.Entity | null,
  viewer: null as any,
  dataSource: null as Cesium.CustomDataSource | null,
  tooltip: null as Tooltip | null,
  draggers: [] as draggerCtl.DraggerEntity[],
  draggerHandler: null as Cesium.ScreenSpaceEventHandler | null,
  _enabled: false,
  _positions_draw: null as Cesium.Cartesian3[] | null,
  _minPointNum: 1,
  _maxPointNum: 9999,
  _fire: null as ((type: string, data: any, propagate?: boolean) => void) | null,

  /**
   * 初始化
   */
  initialize(this: any, entity: Cesium.Entity, viewer: any, dataSource: Cesium.CustomDataSource) {
    this.entity = entity
    this.viewer = viewer
    this.dataSource = dataSource
    this.draggers = []
  },

  /**
   * 触发事件
   */
  fire(this: any, type: string, data: any, propagate?: boolean) {
    if (this._fire) {
      this._fire(type, data, propagate)
    }
  },

  /**
   * 格式化数字
   */
  formatNum(this: any, num: number, digits?: number): number {
    return Util.formatNum(num, digits)
  },

  /**
   * 设置鼠标样式
   */
  setCursor(this: any, val: boolean) {
    this.viewer._container.style.cursor = val ? 'crosshair' : ''
  },

  /**
   * 激活编辑
   */
  activate(this: any): any {
    if (this._enabled) {
      return this
    }
    this._enabled = true

    this.entity.inProgress = true
    this.changePositionsToCallback()
    this.bindDraggers()
    this.bindEvent()

    this.fire(EventType.EditStart, { edittype: this.entity.attribute.type, entity: this.entity })

    return this
  },

  /**
   * 禁用编辑
   */
  disable(this: any): any {
    if (!this._enabled) {
      return this
    }
    this._enabled = false

    this.destroyEvent()
    this.destroyDraggers()
    this.finish()

    this.entity.inProgress = false
    this.fire(EventType.EditStop, { edittype: this.entity.attribute.type, entity: this.entity })
    this.tooltip?.setVisible(false)

    return this
  },

  /**
   * 将位置转换为回调函数 (子类可重写)
   */
  changePositionsToCallback(this: any) {
    // 子类实现
  },

  /**
   * 编辑结束后调用 (子类可重写)
   */
  finish(this: any) {
    // 子类实现
  },

  /**
   * 绑定拖拽点事件
   */
  bindEvent(this: any) {
    const scratchBoundingSphere = new Cesium.BoundingSphere()
    const zOffset = new Cesium.Cartesian3()

    const draggerHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas) as any
    draggerHandler.dragger = null

    // 鼠标按下选中拖拽点
    draggerHandler.setInputAction((event: any) => {
      const pickedObject = this.viewer.scene.pick(event.position)
      if (Cesium.defined(pickedObject)) {
        const entity = pickedObject.id || pickedObject.primitive?.id || pickedObject.primitive
        if (entity && Cesium.defaultValue(entity._isDragger, false)) {
          this.viewer.scene.screenSpaceCameraController.enableRotate = false
          this.viewer.scene.screenSpaceCameraController.enableTilt = false
          this.viewer.scene.screenSpaceCameraController.enableTranslate = false
          this.viewer.scene.screenSpaceCameraController.enableInputs = false

          // 关闭 popup (如果存在)
          if (this.viewer.ktd?.popup) {
            this.viewer.ktd.popup.close(entity)
          }

          draggerHandler.dragger = entity

          if (draggerHandler.dragger.point) {
            draggerHandler.dragger.show = false
          }
          this.setCursor(true)

          if (draggerHandler.dragger.onDragStart) {
            let position = draggerHandler.dragger.position
            if (position && position.getValue) {
              position = position.getValue(this.viewer.clock.currentTime)
            }
            draggerHandler.dragger.onDragStart(draggerHandler.dragger, position)
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN)

    // 鼠标移动拖拽
    draggerHandler.setInputAction((event: any) => {
      const dragger = draggerHandler.dragger
      if (dragger) {
        switch (dragger._pointType) {
          case draggerCtl.PointType.MoveHeight: {
            // 改变高度垂直拖动
            const dy = event.endPosition.y - event.startPosition.y

            let position = dragger.position
            if (position && position.getValue) {
              position = position.getValue(this.viewer.clock.currentTime)
            }

            const tangentPlane = new Cesium.EllipsoidTangentPlane(position)

            scratchBoundingSphere.center = position
            scratchBoundingSphere.radius = 1

            const metersPerPixel =
              this.viewer.scene.frameState.camera.getPixelSize(
                scratchBoundingSphere,
                this.viewer.scene.frameState.context.drawingBufferWidth,
                this.viewer.scene.frameState.context.drawingBufferHeight
              ) * 1.5

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
            this.tooltip.showAt(event.endPosition, message.edit.end)

            const point = Util.getCurrentMousePosition(this.viewer.scene, event.endPosition, this.entity)

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
        this.tooltip.setVisible(false)

        const pickedObject = this.viewer.scene.pick(event.endPosition)
        if (Cesium.defined(pickedObject)) {
          const entity = pickedObject.id
          if (entity && Cesium.defaultValue(entity._isDragger, false) && entity.draw_tooltip) {
            let draw_tooltip = entity.draw_tooltip

            // 可删除时，提示右击删除
            if (
              draggerCtl.PointType.Control === entity._pointType &&
              this._positions_draw &&
              this._positions_draw.length > this._minPointNum
            ) {
              draw_tooltip += message.del.def
            }

            this.tooltip.showAt(event.endPosition, draw_tooltip)
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    // 鼠标抬起结束拖拽
    draggerHandler.setInputAction((event: any) => {
      const dragger = draggerHandler.dragger
      if (dragger) {
        this.setCursor(false)
        dragger.show = true

        let position = dragger.position
        if (position && position.getValue) {
          position = position.getValue(this.viewer.clock.currentTime)
        }

        if (dragger.onDragEnd) {
          dragger.onDragEnd(dragger, position)
        }
        this.fire(EventType.EditMovePoint, {
          edittype: this.entity.attribute.type,
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
    draggerHandler.setInputAction((event: any) => {
      const pickedObject = this.viewer.scene.pick(event.position)
      if (Cesium.defined(pickedObject)) {
        const entity = pickedObject.id
        if (
          entity &&
          Cesium.defaultValue(entity._isDragger, false) &&
          draggerCtl.PointType.Control === entity._pointType
        ) {
          const isDelOk = this.deletePointForDragger(entity, event.position)

          if (isDelOk) {
            this.fire(EventType.EditRemovePoint, {
              edittype: this.entity.attribute.type,
              entity: this.entity
            })
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)

    this.draggerHandler = draggerHandler
  },

  /**
   * 销毁事件
   */
  destroyEvent(this: any) {
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
  },

  /**
   * 绑定拖拽点 (子类需要重写)
   */
  bindDraggers(this: any) {
    // 子类实现
  },

  /**
   * 更新拖拽点
   */
  updateDraggers(this: any): any {
    if (!this._enabled) {
      return this
    }

    this.destroyDraggers()
    this.bindDraggers()
    return this
  },

  /**
   * 销毁所有拖拽点
   */
  destroyDraggers(this: any) {
    for (let i = 0, len = this.draggers.length; i < len; i++) {
      this.dataSource.entities.remove(this.draggers[i])
    }
    this.draggers = []
  },

  /**
   * 删除拖拽点对应的位置
   */
  deletePointForDragger(this: any, dragger: any, position: any): boolean {
    if (!this._positions_draw) return false

    if (this._positions_draw.length - 1 < this._minPointNum) {
      this.tooltip.showAt(position, message.del.min + this._minPointNum)
      return false
    }

    const index = dragger.index
    if (index >= 0 && index < this._positions_draw.length) {
      this._positions_draw.splice(index, 1)
      this.updateDraggers()
      this.updateAttrForEditing()
      return true
    }

    return false
  },

  /**
   * 更新编辑属性 (子类需要重写)
   */
  updateAttrForEditing(this: any) {
    // 子类实现
  },

  /**
   * 设置位置 (子类可重写)
   */
  setPositions(this: any, positions: Cesium.Cartesian3[]) {
    this._positions_draw = positions
  }
})
