import * as Cesium from 'cesium'
import { getPositionByGeoJSON, type GeoJSONFeature, type GeoJSONGeometry } from '@ktd-cesium/shared'
import { GraphicsEventType, type EventEmitter } from '../../EventPlugin'

/**
 * Plugin 接口
 */
interface EnableablePlugin {
  enable: boolean
}

/**
 * EventPlugin 接口
 */
interface EventPluginInterface extends EventEmitter {
  // EventEmitter 的方法
}

/**
 * 扩展的 Viewer 类型（支持 KtdViewer 的插件系统）
 */
interface ExtendedViewer extends Cesium.Viewer {
  getPlugin?: <T = unknown>(name: string) => T | undefined
}

/**
 * TooltipPlugin 接口
 */
interface TooltipPluginInterface {
  showAt: (position: { x: number; y: number } | Cesium.Cartesian2 | null, content?: string) => void
  setVisible: (visible: boolean) => void
  enable: boolean
}

/**
 * 绘制配置
 */
export interface DrawConfig {
  viewer: Cesium.Viewer
  dataSource?: Cesium.CustomDataSource
  primitives?: Cesium.PrimitiveCollection
}

/**
 * 扩展的 Entity 类型
 */
interface ExtendedEntity extends Cesium.Entity {
  attribute?: Record<string, unknown>
  inProgress?: boolean
  editing?: unknown
}

/**
 * 绘制基类
 * 所有绘制类都应该继承此类
 */
export class DrawBase {
  type: string | null = null
  dataSource: Cesium.CustomDataSource | null = null
  primitives: Cesium.PrimitiveCollection | null = null
  viewer: Cesium.Viewer
  tooltip: TooltipPluginInterface | null = null
  entity: ExtendedEntity | null = null
  protected _enabled = false
  protected _positions_draw: Cesium.Cartesian3[] | Cesium.Cartesian3 | null = null
  protected drawOkCallback: ((entity: Cesium.Entity) => void) | null = null
  protected handler: Cesium.ScreenSpaceEventHandler | null = null
  protected editClass: unknown = null
  protected attrClass: unknown = null
  protected _minPointNum: number | null = null
  protected _maxPointNum: number | null = null
  private eventPlugin: EventPluginInterface | null = null
  protected _fire: ((type: string, data?: Record<string, unknown>, propagate?: boolean) => void) | null = null

  /**
   * 构造函数
   */
  constructor(opts: DrawConfig) {
    this.viewer = opts.viewer
    this.dataSource = opts.dataSource || null
    this.primitives = opts.primitives || null

    if (!this.dataSource) {
      this.dataSource = new Cesium.CustomDataSource()
      this.viewer.dataSources.add(this.dataSource)
    }

    // 获取插件
    const extViewer = this.viewer as ExtendedViewer
    if (extViewer.getPlugin) {
      // 获取 EventPlugin
      this.eventPlugin = extViewer.getPlugin<EventPluginInterface>('EventPlugin') || null

      // 获取 TooltipPlugin
      this.tooltip = extViewer.getPlugin<TooltipPluginInterface>('TooltipPlugin') || null
    }

    // 绑定 _fire 方法
    if (this.eventPlugin) {
      this._fire = this.eventPlugin.fire.bind(this.eventPlugin)
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
  on(type: string, fn: Function, context?: unknown): this {
    if (this.eventPlugin) {
      this.eventPlugin.on(type, fn, context)
    }
    return this
  }

  /**
   * 移除事件监听
   */
  off(type?: string, fn?: Function, context?: unknown): this {
    if (this.eventPlugin) {
      this.eventPlugin.off(type, fn, context)
    }
    return this
  }

  /**
   * 格式化数字
   */
  formatNum(num: number, digits = 0): number {
    const pow = Math.pow(10, digits)
    return Math.round(num * pow) / pow
  }

  /**
   * 启用/禁用控制
   * 控制 PopupPlugin 和 TooltipPlugin 的启用状态
   */
  enableControl(value: boolean): void {
    const extViewer = this.viewer as ExtendedViewer

    // 控制 PopupPlugin
    if (extViewer.getPlugin) {
      const popupPlugin = extViewer.getPlugin<EnableablePlugin>('PopupPlugin')
      if (popupPlugin && 'enable' in popupPlugin) {
        popupPlugin.enable = value
      }

      // 控制 TooltipPlugin
      const tooltipPlugin = extViewer.getPlugin<EnableablePlugin>('TooltipPlugin')
      if (tooltipPlugin && 'enable' in tooltipPlugin) {
        tooltipPlugin.enable = value
      }
    }
  }

  /**
   * 激活绘制
   */
  activate(attribute: Record<string, unknown>, drawOkCallback?: (entity: Cesium.Entity) => void): Cesium.Entity {
    if (this._enabled && this.entity) {
      return this.entity
    }

    this._enabled = true
    this.drawOkCallback = drawOkCallback || null

    this.createFeature(attribute)
    if (this.entity) {
      this.entity.inProgress = true
    }

    this.setCursor(true)
    this.enableControl(false)
    this.bindEvent()

    this.fire(GraphicsEventType.DRAW_START, { drawtype: this.type, entity: this.entity })

    return this.entity!
  }

  /**
   * 释放绘制
   */
  disable(hasWB?: boolean): this {
    if (!this._enabled) {
      return this
    }

    this._enabled = false

    this.setCursor(false)
    this.enableControl(true)

    if (hasWB && this.entity?.inProgress) {
      // 外部释放时，尚未结束的标绘移除
      if (this.dataSource && this.dataSource.entities.contains(this.entity)) {
        this.dataSource.entities.remove(this.entity)
      }

      if (this.primitives && this.entity && this.primitives.contains(this.entity as unknown as Cesium.Primitive)) {
        this.primitives.remove(this.entity as unknown as Cesium.Primitive)
      }
    } else if (this.entity) {
      this.entity.inProgress = false
      this.finish()

      if (this.drawOkCallback) {
        this.drawOkCallback(this.entity)
        this.drawOkCallback = null
      }

      this.fire(GraphicsEventType.DRAW_CREATED, { drawtype: this.type, entity: this.entity })
    }

    this.destroyHandler()
    this._positions_draw = null
    this.entity = null
    this.tooltip?.setVisible(false)

    return this
  }

  /**
   * 创建要素 (子类需要重写)
   */
  protected createFeature(_attribute: Record<string, unknown>): Cesium.Entity | null {
    // 子类实现
    return null
  }

  /**
   * 获取事件处理器
   */
  protected getHandler(): Cesium.ScreenSpaceEventHandler {
    if (!this.handler || this.handler.isDestroyed()) {
      this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas)
    }
    return this.handler
  }

  /**
   * 销毁事件处理器
   */
  protected destroyHandler(): void {
    if (this.handler) {
      this.handler.destroy()
      this.handler = null
    }
  }

  /**
   * 设置鼠标样式
   */
  protected setCursor(val: boolean): void {
    const container = this.viewer.container as HTMLElement
    container.style.cursor = val ? 'crosshair' : ''
  }

  /**
   * 绑定鼠标事件 (子类需要重写)
   */
  protected bindEvent(): void {
    // 子类实现
  }

  /**
   * 获取绘制位置
   */
  getDrawPosition(): Cesium.Cartesian3[] | Cesium.Cartesian3 | null {
    return this._positions_draw
  }

  /**
   * 获取编辑类
   */
  getEditClass(entity: Cesium.Entity): unknown {
    if (this.editClass == null) return null

    const EditClassConstructor = this.editClass as new (
      entity: Cesium.Entity,
      viewer: Cesium.Viewer,
      dataSource: Cesium.CustomDataSource
    ) => {
      _minPointNum?: number | null
      _maxPointNum?: number | null
      _fire?: ((type: string, data?: Record<string, unknown>, propagate?: boolean) => void) | null
      tooltip?: TooltipPluginInterface | null
    }

    const _edit = new EditClassConstructor(entity, this.viewer, this.dataSource!)
    if (this._minPointNum != null) _edit._minPointNum = this._minPointNum
    if (this._maxPointNum != null) _edit._maxPointNum = this._maxPointNum

    // 传递 _fire 方法
    _edit._fire = this._fire
    _edit.tooltip = this.tooltip

    return _edit
  }

  /**
   * 更新绘制属性 (子类可重写)
   */
  protected updateAttrForDrawing(_isLoad?: boolean): void {
    // 子类实现
  }

  /**
   * 图形绘制结束后调用 (子类需要重写)
   */
  protected finish(): void {
    // 子类实现
  }

  /**
   * 获取坐标数组
   */
  getCoordinates(entity: Cesium.Entity): number[][] | null {
    const attrModule = this.attrClass as { getCoordinates?: (entity: Cesium.Entity) => number[][] | null }
    return attrModule.getCoordinates?.(entity) || null
  }

  /**
   * 获取位置数组
   */
  getPositions(entity: Cesium.Entity): Cesium.Cartesian3[] | null {
    const attrModule = this.attrClass as { getPositions?: (entity: Cesium.Entity) => Cesium.Cartesian3[] | null }
    return attrModule.getPositions?.(entity) || null
  }

  /**
   * 转换为 GeoJSON
   */
  toGeoJSON(entity: Cesium.Entity): Record<string, unknown> {
    const attrModule = this.attrClass as { toGeoJSON?: (entity: Cesium.Entity) => Record<string, unknown> }
    return attrModule.toGeoJSON?.(entity) || {}
  }

  /**
   * 属性转 entity
   */
  attributeToEntity(attribute: Record<string, unknown>, positions: Cesium.Cartesian3[]): Cesium.Entity | null {
    const entity = this.createFeature(attribute)
    this._positions_draw = positions
    this.updateAttrForDrawing(true)
    this.finish()
    return entity || this.entity
  }

  /**
   * GeoJSON 转 entity
   */
  jsonToEntity(geojson: GeoJSONFeature | GeoJSONGeometry): Cesium.Entity | null {
    // 提取 properties（仅 Feature 类型有 properties）
    const attribute = ('properties' in geojson ? geojson.properties : {}) as Record<string, unknown>
    const positionResult = getPositionByGeoJSON(geojson)

    // 将结果转换为数组
    let positions: Cesium.Cartesian3[] = []
    if (positionResult) {
      if (Array.isArray(positionResult)) {
        positions = positionResult
      } else {
        positions = [positionResult]
      }
    }

    return this.attributeToEntity(attribute, positions)
  }

  /**
   * 设置绘制位置
   */
  setDrawPositionByEntity(entity: Cesium.Entity): void {
    const positions = this.getPositions(entity)
    this._positions_draw = positions
  }

  /**
   * 绑定外部 entity 到标绘
   */
  bindExtraEntity(entity: Cesium.Entity, attribute: Record<string, unknown>): Cesium.Entity {
    this.entity = entity as ExtendedEntity
    this.entity.attribute = attribute

    if (attribute.style) {
      this.style2Entity(attribute.style as Record<string, unknown>, entity)
    }

    this.setDrawPositionByEntity(entity)
    this.updateAttrForDrawing(true)
    this.finish()

    return entity
  }

  /**
   * 样式转 entity (子类需要重写)
   */
  protected style2Entity(_style: Record<string, unknown>, _entity: Cesium.Entity): void {
    // 子类实现
  }
}
