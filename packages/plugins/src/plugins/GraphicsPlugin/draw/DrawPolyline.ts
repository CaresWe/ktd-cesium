import * as Cesium from 'cesium'
import { DrawBase } from './DrawBase'
import { getCurrentMousePosition } from '../core/Util'
import * as EventType from '../core/EventType'
import { message } from '../core/Tooltip'
import * as attr from '../attr/AttrPolyline'
import { EditPolyline } from '../edit/EditPolyline'

/**
 * 添加位置高度的辅助函数
 */
function addPositionsHeight(position: Cesium.Cartesian3, addHeight: number): Cesium.Cartesian3 {
  const cartographic = Cesium.Cartographic.fromCartesian(position)
  return Cesium.Cartesian3.fromRadians(
    cartographic.longitude,
    cartographic.latitude,
    cartographic.height + addHeight
  )
}

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

  editClass = EditPolyline
  attrClass = attr

  /**
   * 根据 attribute 参数创建 Entity
   */
  createFeature(attribute: any): Cesium.Entity {
    this._positions_draw = []

    if (!this._minPointNum_def) this._minPointNum_def = this._minPointNum
    if (!this._maxPointNum_def) this._maxPointNum_def = this._maxPointNum

    if (attribute.config) {
      // 允许外部传入
      this._minPointNum = attribute.config.minPointNum || this._minPointNum_def
      this._maxPointNum = attribute.config.maxPointNum || this._maxPointNum_def
    } else {
      this._minPointNum = this._minPointNum_def
      this._maxPointNum = this._maxPointNum_def
    }

    const addattr: any = {
      polyline: attr.style2Entity(attribute.style),
      attribute: attribute
    }
    addattr.polyline.positions = new Cesium.CallbackProperty(() => {
      return this.getDrawPosition()
    }, false)

    this.entity = this.dataSource!.entities.add(addattr) // 创建要素对象
    ;(this.entity as any)._positions_draw = this._positions_draw
    return this.entity
  }

  /**
   * 样式转 entity
   */
  style2Entity(style: any, entity: Cesium.Entity): any {
    return attr.style2Entity(style, entity.polyline)
  }

  /**
   * 绑定鼠标事件
   */
  bindEvent(): void {
    let lastPointTemporary = false

    this.getHandler().setInputAction((event: any) => {
      // 单击添加点
      let point = getCurrentMousePosition(this.viewer!.scene, event.position, this.entity)
      if (!point && lastPointTemporary) {
        // 如果未拾取到点，并且存在 MOUSE_MOVE 时，取最后一个 move 的点
        point = this._positions_draw[this._positions_draw.length - 1]
      }

      if (point) {
        if (lastPointTemporary) {
          this._positions_draw.pop()
        }
        lastPointTemporary = false

        // 在绘制点基础自动增加高度
        if (
          this.entity!.attribute &&
          this.entity!.attribute.config &&
          this.entity!.attribute.config.addHeight
        ) {
          point = addPositionsHeight(point, this.entity!.attribute.config.addHeight)
        }

        this._positions_draw.push(point)
        this.updateAttrForDrawing()

        this.fire(EventType.DrawAddPoint, {
          drawtype: this.type,
          entity: this.entity,
          position: point,
          positions: this._positions_draw
        })

        if (this._positions_draw.length >= this._maxPointNum) {
          // 点数满足最大数量，自动结束
          this.disable()
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    this.getHandler().setInputAction((event: any) => {
      // 右击删除上一个点
      this._positions_draw.pop() // 删除最后标的一个点

      const point = getCurrentMousePosition(this.viewer!.scene, event.position, this.entity)
      if (point) {
        if (lastPointTemporary) {
          this._positions_draw.pop()
        }
        lastPointTemporary = true

        this.fire(EventType.DrawRemovePoint, {
          drawtype: this.type,
          entity: this.entity,
          position: point,
          positions: this._positions_draw
        })

        this._positions_draw.push(point)
        this.updateAttrForDrawing()
      }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)

    this.getHandler().setInputAction((event: any) => {
      // 鼠标移动
      if (this._positions_draw.length <= 1) {
        this.tooltip!.showAt(event.endPosition, message.draw.polyline.start)
      } else if (this._positions_draw.length < this._minPointNum) {
        // 点数不满足最少数量
        this.tooltip!.showAt(event.endPosition, message.draw.polyline.cont)
      } else if (this._positions_draw.length >= this._maxPointNum) {
        // 点数满足最大数量
        this.tooltip!.showAt(event.endPosition, message.draw.polyline.end2)
      } else {
        this.tooltip!.showAt(event.endPosition, message.draw.polyline.end)
      }

      const point = getCurrentMousePosition(this.viewer!.scene, event.endPosition, this.entity)
      if (point) {
        if (lastPointTemporary) {
          this._positions_draw.pop()
        }
        lastPointTemporary = true

        this._positions_draw.push(point)
        this.updateAttrForDrawing()

        this.fire(EventType.DrawMouseMove, {
          drawtype: this.type,
          entity: this.entity,
          position: point,
          positions: this._positions_draw
        })
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    this.getHandler().setInputAction((event: any) => {
      // 双击结束标绘
      // 必要代码 消除双击带来的多余经纬度
      if (this._positions_draw.length > this._minPointNum) {
        const mpt1 = this._positions_draw[this._positions_draw.length - 1]
        const mpt2 = this._positions_draw[this._positions_draw.length - 2]

        if (
          Math.abs(mpt1.x - mpt2.x) < 1 &&
          Math.abs(mpt1.y - mpt2.y) < 1 &&
          Math.abs(mpt1.z - mpt2.z) < 1
        ) {
          this._positions_draw.pop()
        }
      }
      this.endDraw()
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
  }

  /**
   * 外部控制，完成绘制，比如手机端无法双击结束
   */
  endDraw(): this {
    if (!this._enabled) {
      return this
    }

    if (this._positions_draw.length < this._minPointNum) return this // 点数不够
    this.updateAttrForDrawing()
    this.disable()
    return this
  }

  /**
   * 更新绘制属性
   */
  updateAttrForDrawing(isLoad?: boolean): void {
    // 子类可重写
  }

  /**
   * 图形绘制结束后调用
   */
  finish(): void {
    const entity = this.entity!

    entity.editing = this.getEditClass(entity) // 绑定编辑对象

    ;(entity as any)._positions_draw = this.getDrawPosition()

    // 显示 depthFailMaterial 时，不能使用 CallbackProperty 属性，否则 depthFailMaterial 不显示
    if (Cesium.defined(entity.polyline!.depthFailMaterial)) {
      entity.polyline!.positions = (entity as any)._positions_draw
    } else {
      entity.polyline!.positions = new Cesium.CallbackProperty(() => {
        return (entity as any)._positions_draw
      }, false)
    }
  }
}
