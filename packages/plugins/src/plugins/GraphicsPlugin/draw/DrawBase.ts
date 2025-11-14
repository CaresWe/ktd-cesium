import * as Cesium from 'cesium'
import { MarsClass } from '../core/MarsClass'
import * as Util from '../core/Util'
import * as EventType from '../core/EventType'
import { Tooltip } from '../core/Tooltip'

/**
 * 绘制配置
 */
export interface DrawConfig {
  viewer: any
  dataSource: Cesium.CustomDataSource
  primitives: Cesium.PrimitiveCollection
  tooltip: Tooltip
}

/**
 * 绘制基类
 * 所有绘制类都应该继承此类
 */
export const DrawBase = MarsClass.extend({
  type: null as string | null,
  dataSource: null as Cesium.CustomDataSource | null,
  primitives: null as Cesium.PrimitiveCollection | null,
  viewer: null as any,
  tooltip: null as Tooltip | null,
  entity: null as Cesium.Entity | null,
  _enabled: false,
  _positions_draw: null as any,
  drawOkCalback: null as ((entity: Cesium.Entity) => void) | null,
  handler: null as Cesium.ScreenSpaceEventHandler | null,
  _fire: null as ((type: string, data: any, propagate?: boolean) => void) | null,
  editClass: null as any,
  attrClass: null as any,
  _minPointNum: null as number | null,
  _maxPointNum: null as number | null,

  /**
   * 初始化
   */
  initialize(this: any, opts: DrawConfig) {
    this.viewer = opts.viewer
    this.dataSource = opts.dataSource
    this.primitives = opts.primitives

    if (!this.dataSource) {
      this.dataSource = new Cesium.CustomDataSource()
      this.viewer.dataSources.add(this.dataSource)
    }

    this.tooltip = opts.tooltip || new Tooltip(this.viewer.container)
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
   * 启用/禁用控制
   */
  enableControl(this: any, value: boolean) {
    // TODO: 集成 popup 和 tooltip 控制
    // if (this.viewer.ktd.popup) this.viewer.ktd.popup.enable = value
    // if (this.viewer.ktd.tooltip) this.viewer.ktd.tooltip.enable = value
  },

  /**
   * 激活绘制
   */
  activate(this: any, attribute: any, drawOkCalback?: (entity: Cesium.Entity) => void): Cesium.Entity {
    if (this._enabled) {
      return this.entity
    }

    this._enabled = true
    this.drawOkCalback = drawOkCalback || null

    this.createFeature(attribute)
    this.entity.inProgress = true

    this.setCursor(true)
    this.enableControl(false)
    this.bindEvent()

    this.fire(EventType.DrawStart, { drawtype: this.type, entity: this.entity })

    return this.entity
  },

  /**
   * 释放绘制
   */
  disable(this: any, hasWB?: boolean): any {
    if (!this._enabled) {
      return this
    }

    this._enabled = false

    this.setCursor(false)
    this.enableControl(true)

    if (hasWB && this.entity.inProgress) {
      // 外部释放时，尚未结束的标绘移除
      if (this.dataSource && this.dataSource.entities.contains(this.entity)) {
        this.dataSource.entities.remove(this.entity)
      }

      if (this.primitives && this.primitives.contains(this.entity)) {
        this.primitives.remove(this.entity)
      }
    } else {
      this.entity.inProgress = false
      this.finish()

      if (this.drawOkCalback) {
        this.drawOkCalback(this.entity)
        this.drawOkCalback = null
      }

      this.fire(EventType.DrawCreated, { drawtype: this.type, entity: this.entity })
    }

    this.destroyHandler()
    this._positions_draw = null
    this.entity = null
    this.tooltip?.setVisible(false)

    return this
  },

  /**
   * 创建要素 (子类需要重写)
   */
  createFeature(this: any, attribute: any) {
    // 子类实现
  },

  /**
   * 获取事件处理器
   */
  getHandler(this: any): Cesium.ScreenSpaceEventHandler {
    if (!this.handler || this.handler.isDestroyed()) {
      this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas)
    }
    return this.handler
  },

  /**
   * 销毁事件处理器
   */
  destroyHandler(this: any) {
    if (this.handler) {
      this.handler.destroy()
      this.handler = null
    }
  },

  /**
   * 设置鼠标样式
   */
  setCursor(this: any, val: boolean) {
    this.viewer._container.style.cursor = val ? 'crosshair' : ''
  },

  /**
   * 绑定鼠标事件 (子类需要重写)
   */
  bindEvent(this: any) {
    // 子类实现
  },

  /**
   * 获取绘制位置
   */
  getDrawPosition(this: any) {
    return this._positions_draw
  },

  /**
   * 获取编辑类
   */
  getEditClass(this: any, entity: Cesium.Entity) {
    if (this.editClass == null) return null

    const _edit = new this.editClass(entity, this.viewer, this.dataSource)
    if (this._minPointNum != null) _edit._minPointNum = this._minPointNum
    if (this._maxPointNum != null) _edit._maxPointNum = this._maxPointNum

    _edit._fire = this._fire
    _edit.tooltip = this.tooltip

    return _edit
  },

  /**
   * 更新绘制属性 (子类可重写)
   */
  updateAttrForDrawing(this: any, isLoad?: boolean) {
    // 子类实现
  },

  /**
   * 图形绘制结束后调用 (子类需要重写)
   */
  finish(this: any) {
    // 子类实现
  },

  /**
   * 获取坐标数组
   */
  getCoordinates(this: any, entity: Cesium.Entity) {
    return this.attrClass.getCoordinates(entity)
  },

  /**
   * 获取位置数组
   */
  getPositions(this: any, entity: Cesium.Entity) {
    return this.attrClass.getPositions(entity)
  },

  /**
   * 转换为 GeoJSON
   */
  toGeoJSON(this: any, entity: Cesium.Entity) {
    return this.attrClass.toGeoJSON(entity)
  },

  /**
   * 属性转 entity
   */
  attributeToEntity(this: any, attribute: any, positions: any) {
    const entity = this.createFeature(attribute)
    this._positions_draw = positions
    this.updateAttrForDrawing(true)
    this.finish()
    return entity
  },

  /**
   * GeoJSON 转 entity
   */
  jsonToEntity(this: any, geojson: any) {
    const attribute = geojson.properties
    const positions = Util.getPositionByGeoJSON(geojson)
    return this.attributeToEntity(attribute, positions)
  },

  /**
   * 设置绘制位置
   */
  setDrawPositionByEntity(this: any, entity: Cesium.Entity) {
    const positions = this.getPositions(entity)
    this._positions_draw = positions
  },

  /**
   * 绑定外部 entity 到标绘
   */
  bindExtraEntity(this: any, entity: Cesium.Entity, attribute: any) {
    this.entity = entity
    entity.attribute = attribute

    if (attribute.style) {
      this.style2Entity(attribute.style, entity)
    }

    this.setDrawPositionByEntity(entity)
    this.updateAttrForDrawing(true)
    this.finish()

    return entity
  },

  /**
   * 样式转 entity (子类需要重写)
   */
  style2Entity(this: any, style: any, entity: Cesium.Entity) {
    // 子类实现
  }
})
