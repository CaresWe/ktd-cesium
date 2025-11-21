import * as Cesium from 'cesium'
import { DrawBase } from './DrawBase'
import type { AttrClass, PolylineDrawAttribute, PolylineExtendedEntity } from '../types'
import { getCurrentMousePosition, addPositionsHeight } from '@ktd-cesium/shared'
import { GraphicsEventType } from '../../EventPlugin'
import { defaultMessages } from '../../TooltipPlugin/messages'
import * as attr from '../attr/AttrPolyline'
import { EditPolyline } from '../edit/EditPolyline'
import type { EditClassConstructor } from '../types'

/**
 * 折线绘制类
 */
export class DrawPolyline extends DrawBase {
  type = 'polyline'
  // 坐标位置相关
  _minPointNum = 2 // 至少需要点的个数
  _maxPointNum = 9999 // 最多允许点的个数
  _minPointNum_def?: number
  _maxPointNum_def?: number

  editClass = EditPolyline as EditClassConstructor
  attrClass = attr as unknown as AttrClass

  /**
   * 根据 attribute 参数创建 Entity
   */
  createFeature(attribute: Record<string, unknown>): Cesium.Entity {
    this._positions_draw = []

    const polylineAttr = attribute as PolylineDrawAttribute

    if (!this._minPointNum_def) this._minPointNum_def = this._minPointNum
    if (!this._maxPointNum_def) this._maxPointNum_def = this._maxPointNum

    if (polylineAttr.config) {
      // 允许外部传入
      this._minPointNum = polylineAttr.config.minPointNum || this._minPointNum_def
      this._maxPointNum = polylineAttr.config.maxPointNum || this._maxPointNum_def
    } else {
      this._minPointNum = this._minPointNum_def
      this._maxPointNum = this._maxPointNum_def
    }

    const addattr: Cesium.Entity.ConstructorOptions & { attribute: Record<string, unknown> } = {
      polyline: attr.style2Entity(polylineAttr.style),
      attribute: attribute
    }
    addattr.polyline!.positions = new Cesium.CallbackProperty(() => {
      return this.getDrawPosition()
    }, false) as unknown as Cesium.PositionProperty

    this.entity = this.dataSource!.entities.add(addattr) // 创建要素对象
    const extEntity = this.entity as PolylineExtendedEntity
    extEntity._positions_draw = this._positions_draw as Cesium.Cartesian3[]
    return this.entity
  }

  /**
   * 样式转 entity
   */
  protected style2Entity(style: Record<string, unknown>, entity: Cesium.Entity): void {
    attr.style2Entity(style, entity.polyline as unknown as attr.PolylineEntityAttr)
  }

  /**
   * 绑定鼠标事件（支持PC端和移动端）
   */
  bindEvent(): void {
    let lastPointTemporary = false
    const positions = this._positions_draw as Cesium.Cartesian3[]

    // 左键点击或触摸添加点
    this.bindClickEvent((position: Cesium.Cartesian2) => {
      let point = getCurrentMousePosition(this.viewer!.scene, position, this.entity)
      if (!point && lastPointTemporary) {
        // 如果未拾取到点，并且存在 MOUSE_MOVE 时，取最后一个 move 的点
        point = positions[positions.length - 1]
      }

      if (point) {
        if (lastPointTemporary) {
          positions.pop()
        }
        lastPointTemporary = false

        // 在绘制点基础自动增加高度
        const extEntity = this.entity as PolylineExtendedEntity
        if (extEntity.attribute?.config?.addHeight) {
          point = addPositionsHeight(point, extEntity.attribute.config.addHeight) as Cesium.Cartesian3
        }

        positions.push(point)
        this.updateAttrForDrawing()

        this.fire(GraphicsEventType.DRAW_ADD_POINT, {
          drawtype: this.type,
          entity: this.entity,
          position: point,
          positions: positions
        })

        if (positions.length >= this._maxPointNum) {
          // 点数满足最大数量，自动结束
          this.disable()
        }
      }
    })

    // 右键删除上一个点（PC端专用）
    this.bindRightClickEvent((position: Cesium.Cartesian2) => {
      positions.pop() // 删除最后标的一个点

      const point = getCurrentMousePosition(this.viewer!.scene, position, this.entity)
      if (point) {
        if (lastPointTemporary) {
          positions.pop()
        }
        lastPointTemporary = true

        this.fire(GraphicsEventType.DRAW_REMOVE_POINT, {
          drawtype: this.type,
          entity: this.entity,
          position: point,
          positions: positions
        })

        positions.push(point)
        this.updateAttrForDrawing()
      }
    })

    // 鼠标移动或触摸移动
    this.bindMoveEvent((position: Cesium.Cartesian2) => {
      // 显示提示信息
      if (positions.length <= 1) {
        this.tooltip!.showAt(position, defaultMessages.draw.polyline.start)
      } else if (positions.length < this._minPointNum) {
        this.tooltip!.showAt(position, defaultMessages.draw.polyline.cont)
      } else if (positions.length >= this._maxPointNum) {
        this.tooltip!.showAt(position, defaultMessages.draw.polyline.end2)
      } else {
        this.tooltip!.showAt(position, defaultMessages.draw.polyline.end)
      }

      const point = getCurrentMousePosition(this.viewer!.scene, position, this.entity)
      if (point) {
        if (lastPointTemporary) {
          positions.pop()
        }
        lastPointTemporary = true

        positions.push(point)
        this.updateAttrForDrawing()

        this.fire(GraphicsEventType.DRAW_MOUSE_MOVE, {
          drawtype: this.type,
          entity: this.entity,
          position: point,
          positions: positions
        })
      }
    })

    // 双击结束标绘（PC端专用，移动端通过 endDraw 按钮结束）移动端也支持长按结束
    this.bindDoubleClickEvent(() => {
      // 必要代码 消除双击带来的多余经纬度
      if (positions.length > this._minPointNum) {
        const mpt1 = positions[positions.length - 1]
        const mpt2 = positions[positions.length - 2]

        if (
          Math.abs(mpt1.x - mpt2.x) < 1 &&
          Math.abs(mpt1.y - mpt2.y) < 1 &&
          Math.abs(mpt1.z - mpt2.z) < 1
        ) {
          positions.pop()
        }
      }
      this.endDraw()
    })
  }

  /**
   * 外部控制，完成绘制（支持双击、长按或手动调用结束）
   */
  endDraw(): this {
    if (!this._enabled) {
      return this
    }

    const positions = this._positions_draw as Cesium.Cartesian3[]
    if (positions.length < this._minPointNum) return this // 点数不够
    this.updateAttrForDrawing()
    this.disable()
    return this
  }

  /**
   * 更新绘制属性
   */
  updateAttrForDrawing(_isLoad?: boolean): void {
    // 子类可重写
  }

  /**
   * 图形绘制结束后调用
   */
  finish(): void {
    const entity = this.entity!
    const extEntity = entity as PolylineExtendedEntity

    extEntity.editing = this.getEditClass(entity) // 绑定编辑对象

    extEntity._positions_draw = this.getDrawPosition() as Cesium.Cartesian3[]

    // 显示 depthFailMaterial 时，不能使用 CallbackProperty 属性，否则 depthFailMaterial 不显示
    if (Cesium.defined(entity.polyline!.depthFailMaterial)) {
      entity.polyline!.positions = extEntity._positions_draw as unknown as Cesium.PositionProperty
    } else {
      entity.polyline!.positions = new Cesium.CallbackProperty(() => {
        return extEntity._positions_draw
      }, false) as unknown as Cesium.PositionProperty
    }
  }
}
