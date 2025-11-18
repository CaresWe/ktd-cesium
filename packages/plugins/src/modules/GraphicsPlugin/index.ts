import { BasePlugin } from '../../BasePlugin'
import type { KtdViewer } from '@ktd-cesium/core'
import type { Viewer as CesiumViewer, Entity, CustomDataSource, PrimitiveCollection } from 'cesium'
import * as Cesium from 'cesium'
import type {
  DrawType,
  DrawAttribute,
  LoadJsonOptions,
  EventType,
  EventCallback,
  GeoJSONFeature,
  GeoJSONFeatureCollection,
  DrawController,
  EntityExtension
} from './types'
import { EventType as EventTypeEnum } from './types'
import { TooltipCore } from '../TooltipPlugin/TooltipCore'
import type { EventPlugin, PickInfo } from '../EventPlugin'
import { DrawPoint } from './draw/DrawPoint'
import { DrawBillboard } from './draw/DrawBillboard'
import { DrawLabel } from './draw/DrawLabel'
import { DrawPolyline } from './draw/DrawPolyline'
import { DrawPolygon } from './draw/DrawPolygon'
import { DrawCircle } from './draw/DrawCircle'
import { DrawRectangle } from './draw/DrawRectangle'
import { DrawCorridor } from './draw/DrawCorridor'
import { DrawWall } from './draw/DrawWall'
import { DrawBox } from './draw/DrawBox'
import { DrawCylinder } from './draw/DrawCylinder'
import { DrawEllipsoid } from './draw/DrawEllipsoid'
import { DrawCurve } from './draw/DrawCurve'
import { DrawPlane } from './draw/DrawPlane'
import { DrawModel } from './draw/DrawModel'
import { DrawPolylineVolume } from './draw/DrawPolylineVolume'
import { DrawPolygonEx } from './draw/DrawPolygonEx'
import { DrawPModel } from './draw/DrawPModel'

/**
 * 绘制配置接口
 */
export interface DrawConfig {
  viewer: CesiumViewer
  dataSource: CustomDataSource
  primitives: PrimitiveCollection
}

/**
 * 外部扩展的绘制类
 */
const exDraw: Record<string, new (opts: DrawConfig) => DrawController> = {}

/**
 * 注册外部扩展的绘制类
 * @param type 类型名称
 * @param DrawClass 绘制类
 */
export function register(
  type: string,
  DrawClass: new (opts: DrawConfig) => DrawController
): void {
  exDraw[type] = DrawClass
}

/**
 * 插件选项接口
 */
export interface GraphicsPluginOptions {
  /** 是否可编辑 */
  hasEdit?: boolean
  /** 名称提示 */
  nameTooltip?: boolean
  /** 是否可删除的回调 */
  hasDel?: (entity: Entity) => boolean
  /** 是否移除默认的屏幕空间事件 */
  removeScreenSpaceEvent?: boolean
}

/**
 * 图形绘制插件
 *
 * 提供图形绘制、编辑和删除等核心功能
 *
 * @example
 * ```typescript
 * // 使用插件
 * const graphics = viewer.use('graphics')
 *
 * // 开始绘制面
 * graphics.startDraw({
 *   type: 'polygon',
 *   style: {
 *     color: '#ff0000',
 *     opacity: 0.6
 *   }
 * })
 *
 * // 加载 GeoJSON 数据
 * graphics.loadJson(geojsonData, { flyTo: true })
 * ```
 */
export class GraphicsPlugin extends BasePlugin {
  static readonly pluginName = 'graphics'
  readonly name = 'graphics'

  /** 插件选项 */
  private options: GraphicsPluginOptions = {}

  /** 数据源 */
  private dataSource: CustomDataSource | null = null

  /** 图元集合 */
  private primitives: PrimitiveCollection | null = null

  /** 绘制控制器 */
  private drawCtrl: Record<string, DrawController> = {}

  /** 当前编辑要素 */
  private currEditFeature: Entity | null = null

  /** 是否可编辑 */
  private _hasEdit = true

  /** 是否可见 */
  private _visible = true

  /** 事件监听器 */
  private listeners: Map<string, Set<EventCallback>> = new Map()

  /** 事件插件 */
  private eventPlugin: EventPlugin | null = null

  /** 选择事件监听器ID列表 */
  private selectEventIds: string[] = []

  /** 提示框 */
  private tooltip: TooltipCore | null = null

  /** 提示框定时器 */
  private tiptimeTik: ReturnType<typeof setTimeout> | null = null

  protected onInstall(viewer: KtdViewer, options?: GraphicsPluginOptions): void {
    this.options = options || {}

    // 获取事件插件
    this.eventPlugin = viewer.getPlugin<EventPlugin>('event') || null

    // 初始化数据源
    this.dataSource = new Cesium.CustomDataSource('GraphicsPlugin-DataSource')
    this.cesiumViewer.dataSources.add(this.dataSource)

    // 初始化图元集合
    this.primitives = this.cesiumViewer.scene.primitives.add(
      new Cesium.PrimitiveCollection()
    ) as PrimitiveCollection

    // 移除默认的双击事件
    if (this.options.removeScreenSpaceEvent !== false) {
      this.cesiumViewer.screenSpaceEventHandler.removeInputAction(
        Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
      )
      this.cesiumViewer.screenSpaceEventHandler.removeInputAction(
        Cesium.ScreenSpaceEventType.LEFT_CLICK
      )
    }

    // 初始化提示框
    this.tooltip = new TooltipCore({
      container: this.cesiumViewer.container as HTMLElement
    })

    // 初始化绘制控制器
    this._initDrawControllers()

    // 设置编辑模式
    this.hasEdit(this.options.hasEdit !== false)

    // 绑定创建完成后自动编辑
    this.on(EventTypeEnum.DrawCreated, (data) => {
      if (data.entity) {
        this.startEditing(data.entity as Entity)
      }
    })

    console.log('Graphics plugin installed')
  }

  /**
   * 初始化绘制控制器
   */
  private _initDrawControllers(): void {
    const opts = {
      viewer: this.cesiumViewer,
      dataSource: this.dataSource!,
      primitives: this.primitives!
    }

    // 绑定事件触发器
    const fire = (type: string, data?: Record<string, unknown>, _propagate?: boolean) => {
      this.fire(type as EventType, data || {})
    }

    // 点绘制
    const drawPoint = new DrawPoint(opts)
    drawPoint.setFireFunction(fire).setTooltip(this.tooltip)
    this.drawCtrl['point'] = drawPoint

    // Billboard 图标绘制
    const drawBillboard = new DrawBillboard(opts)
    drawBillboard.setFireFunction(fire).setTooltip(this.tooltip)
    this.drawCtrl['billboard'] = drawBillboard

    // Label 文字标注
    const drawLabel = new DrawLabel(opts)
    drawLabel.setFireFunction(fire).setTooltip(this.tooltip)
    this.drawCtrl['label'] = drawLabel

    // 线绘制
    const drawPolyline = new DrawPolyline(opts)
    drawPolyline.setFireFunction(fire).setTooltip(this.tooltip)
    this.drawCtrl['polyline'] = drawPolyline

    // 面绘制
    const drawPolygon = new DrawPolygon(opts)
    drawPolygon.setFireFunction(fire).setTooltip(this.tooltip)
    this.drawCtrl['polygon'] = drawPolygon

    // 圆形绘制
    const drawCircle = new DrawCircle(opts)
    drawCircle.setFireFunction(fire).setTooltip(this.tooltip)
    this.drawCtrl['circle'] = drawCircle
    this.drawCtrl['ellipse'] = drawCircle

    // 矩形绘制
    const drawRectangle = new DrawRectangle(opts)
    drawRectangle.setFireFunction(fire).setTooltip(this.tooltip)
    this.drawCtrl['rectangle'] = drawRectangle

    // 走廊绘制
    const drawCorridor = new DrawCorridor(opts)
    drawCorridor.setFireFunction(fire).setTooltip(this.tooltip)
    this.drawCtrl['corridor'] = drawCorridor

    // 墙体绘制
    const drawWall = new DrawWall(opts)
    drawWall.setFireFunction(fire).setTooltip(this.tooltip)
    this.drawCtrl['wall'] = drawWall

    // 立方体绘制
    const drawBox = new DrawBox(opts)
    drawBox.setFireFunction(fire).setTooltip(this.tooltip)
    this.drawCtrl['box'] = drawBox

    // 圆柱体绘制
    const drawCylinder = new DrawCylinder(opts)
    drawCylinder.setFireFunction(fire).setTooltip(this.tooltip)
    this.drawCtrl['cylinder'] = drawCylinder

    // 椭球体绘制
    const drawEllipsoid = new DrawEllipsoid(opts)
    drawEllipsoid.setFireFunction(fire).setTooltip(this.tooltip)
    this.drawCtrl['ellipsoid'] = drawEllipsoid

    // 曲线绘制
    const drawCurve = new DrawCurve(opts)
    drawCurve.setFireFunction(fire).setTooltip(this.tooltip)
    this.drawCtrl['curve'] = drawCurve

    // 平面绘制
    const drawPlane = new DrawPlane(opts)
    drawPlane.setFireFunction(fire).setTooltip(this.tooltip)
    this.drawCtrl['plane'] = drawPlane

    // 3D模型加载
    const drawModel = new DrawModel(opts)
    drawModel.setFireFunction(fire).setTooltip(this.tooltip)
    this.drawCtrl['model'] = drawModel

    // 管道体绘制
    const drawPolylineVolume = new DrawPolylineVolume(opts)
    drawPolylineVolume.setFireFunction(fire).setTooltip(this.tooltip)
    this.drawCtrl['polylineVolume'] = drawPolylineVolume

    // 高级面绘制
    const drawPolygonEx = new DrawPolygonEx(opts)
    drawPolygonEx.setFireFunction(fire).setTooltip(this.tooltip)
    this.drawCtrl['polygonEx'] = drawPolygonEx

    // Primitive 模型绘制
    const drawPModel = new DrawPModel(opts)
    drawPModel.setFireFunction(fire).setTooltip(this.tooltip)
    this.drawCtrl['model-p'] = drawPModel

    // 外部扩展的绘制类
    for (const type in exDraw) {
      const DrawClass = exDraw[type]
      const drawInstance = new DrawClass(opts)
      if ('setFireFunction' in drawInstance && typeof drawInstance.setFireFunction === 'function') {
        drawInstance.setFireFunction(fire)
      }
      if ('setTooltip' in drawInstance && typeof drawInstance.setTooltip === 'function') {
        drawInstance.setTooltip(this.tooltip)
      }
      this.drawCtrl[type] = drawInstance
    }
  }

  /**
   * 开始绘制
   * @param attribute 绘制属性
   */
  startDraw(attribute: DrawAttribute | DrawType): Entity | undefined {
    // 参数转换
    const attr = typeof attribute === 'string' ? { type: attribute } : attribute

    if (!attr.type) {
      console.error('缺少绘制类型 type 参数!')
      return
    }

    const type = attr.type
    if (!this.drawCtrl[type]) {
      console.error(`不支持 type:${type} 的绘制,请检查参数!`)
      return
    }

    this.stopDraw()

    // 启动绘制
    const drawCtrl = this.drawCtrl[type]
    const entity = drawCtrl.activate(attr, (entity: Entity) => {
      // 绘制完成回调
      this.fire(EventTypeEnum.DrawCreated, { drawtype: type, entity })

      if (attr.success && typeof attr.success === 'function') {
        attr.success(entity)
      }
    })

    this.fire(EventTypeEnum.DrawStart, { drawtype: type, entity })

    // 绑定右键删除菜单
    if (entity) {
      this.bindDeleteContextmenu(entity)
    }

    return entity
  }

  /**
   * 检查是否正在绘制
   */
  hasDrawing(): boolean {
    for (const type in this.drawCtrl) {
      const ctrl = this.drawCtrl[type] as unknown as { _enabled?: boolean }
      if (ctrl._enabled) {
        return true
      }
    }
    return false
  }

  /**
   * 强制结束绘制（用于移动端无法双击的情况）
   */
  endDraw(): this {
    for (const type in this.drawCtrl) {
      const ctrl = this.drawCtrl[type]
      if (ctrl.endDraw && typeof ctrl.endDraw === 'function') {
        ctrl.endDraw()
      }
    }
    return this
  }

  /**
   * 停止绘制
   */
  stopDraw(): this {
    this.stopEditing()

    for (const type in this.drawCtrl) {
      this.drawCtrl[type].disable(true)
    }

    return this
  }

  /**
   * 清除所有绘制
   */
  clearDraw(): this {
    this.stopDraw()

    if (this.dataSource) {
      this.dataSource.entities.removeAll()
    }

    if (this.primitives) {
      this.primitives.removeAll()
    }

    return this
  }

  /**
   * 设置或获取编辑模式
   * @param val 是否可编辑
   */
  hasEdit(val?: boolean): boolean | this {
    if (val === undefined) {
      return this._hasEdit
    }

    if (this._hasEdit === val) return this

    this._hasEdit = val
    if (val) {
      this.bindSelectEvent()
    } else {
      this.stopEditing()
      this.destroySelectEvent()
    }

    return this
  }

  /**
   * 绑定鼠标选中事件（使用 EventPlugin）
   */
  private bindSelectEvent(): void {
    if (this.selectEventIds.length > 0) return
    if (!this.eventPlugin) return

    // 处理实体选择的通用逻辑
    const handleEntityPick = (pickInfo: PickInfo): Entity | null => {
      if (!pickInfo.pickedObject) return null

      const picked = pickInfo.pickedObject as Cesium.Cesium3DTileFeature & {
        id?: Entity
        primitive?: { id?: Entity } & Cesium.Primitive
      }
      return picked.id || picked.primitive?.id || (picked.primitive as unknown as Entity)
    }

    // 左键点击选中（PC端）
    const leftClickId = this.eventPlugin.onLeftClick((info: PickInfo) => {
      const entity = handleEntityPick(info)

      if (entity && this.isMyEntity(entity)) {
        if (this.hasDrawing()) return // 还在绘制中时，跳出
        if (this.currEditFeature && this.currEditFeature === entity) return // 重复单击了跳出

        const entityExt = entity as Entity & { hasEdit?: boolean; inProgress?: boolean }
        if (entityExt.hasEdit === false) return // 如果设置了不可编辑跳出
        if (entityExt.inProgress === true) return // 正在绘制中跳出

        this.startEditing(entity)
        return
      }
      this.stopEditing()
    })
    this.selectEventIds.push(leftClickId)

    // 触摸开始（移动端）
    const touchStartId = this.eventPlugin.onTouchStart((info: PickInfo) => {
      const entity = handleEntityPick(info)

      if (entity && this.isMyEntity(entity)) {
        if (this.hasDrawing()) return
        if (this.currEditFeature && this.currEditFeature === entity) return

        const entityExt = entity as Entity & { hasEdit?: boolean; inProgress?: boolean }
        if (entityExt.hasEdit === false) return
        if (entityExt.inProgress === true) return

        this.startEditing(entity)
        return
      }
      this.stopEditing()
    })
    this.selectEventIds.push(touchStartId)

    // 鼠标移动提示（PC端）
    const mouseMoveId = this.eventPlugin.onMouseMove((info: PickInfo) => {
      if (!this._hasEdit || !this.tooltip) return

      this.tooltip.setVisible(false)

      const entity = handleEntityPick(info)
      if (entity) {
        const entityExt = entity as Entity & EntityExtension & { inProgress?: boolean }
        if (
          entityExt.editing &&
          entityExt.inProgress !== true &&
          this.isMyEntity(entity)
        ) {
          const tooltip = this.tooltip
          if (this.tiptimeTik) {
            clearTimeout(this.tiptimeTik)
          }
          this.tiptimeTik = setTimeout(() => {
            // edit中的MOUSE_MOVE会关闭提示，延迟执行
            if (info.position) {
              tooltip.showAt(
                { x: info.position.x, y: info.position.y },
                '单击选择对象进行编辑'
              )
            }
          }, 100)
        }
      }
    })
    this.selectEventIds.push(mouseMoveId)
  }

  /**
   * 销毁选择事件
   */
  private destroySelectEvent(): void {
    if (this.eventPlugin) {
      for (const id of this.selectEventIds) {
        this.eventPlugin.off(id)
      }
    }
    this.selectEventIds = []
  }

  /**
   * 绑定右键删除菜单
   * @param entity 要素对象
   */
  private bindDeleteContextmenu(entity: Entity): void {
    const entityExt = entity as Entity & {
      contextmenuItems?: Array<{
        text: string
        iconCls: string
        visible: (e: { target: Entity }) => boolean
        callback: (e: { target: Entity }) => void
      }>
    }

    entityExt.contextmenuItems = entityExt.contextmenuItems || []
    entityExt.contextmenuItems.push({
      text: '删除对象',
      iconCls: 'fa fa-trash-o',
      visible: (e) => {
        if (this.tooltip) {
          this.tooltip.setVisible(false)
        }
        if (this.tiptimeTik) {
          clearTimeout(this.tiptimeTik)
        }

        if (this.options.hasDel) {
          return this._hasEdit && this.options.hasDel(e.target)
        }
        return this._hasEdit
      },
      callback: (e) => {
        const target = e.target
        const targetExt = target as Entity & EntityExtension
        if (targetExt.editing?.disable) {
          targetExt.editing.disable()
        }
        this.deleteEntity(target)
      }
    })
  }

  /**
   * 判断实体是否属于本插件
   * @param entity 实体对象
   */
  private isMyEntity(entity: Entity): boolean {
    if (this.dataSource?.entities.contains(entity)) return true
    if (this.primitives?.contains(entity as unknown as Cesium.Primitive)) return true
    return false
  }

  /**
   * 开始编辑
   * @param entity 要素对象
   */
  startEditing(entity: Entity): void {
    this.stopEditing()

    if (!entity || !this._hasEdit) return

    const entityExt = entity as Entity & EntityExtension
    const editing = entityExt.editing
    if (editing?.activate) {
      editing.activate()
    }

    this.currEditFeature = entity
  }

  /**
   * 停止编辑
   */
  stopEditing(): void {
    if (this.tooltip) {
      this.tooltip.setVisible(false)
    }

    if (this.currEditFeature) {
      const entityExt = this.currEditFeature as Entity & EntityExtension
      const editing = entityExt.editing
      if (editing?.disable) {
        editing.disable()
      }
    }

    this.currEditFeature = null
  }

  /**
   * 获取当前编辑要素
   */
  getCurrentEntity(): Entity | null {
    return this.currEditFeature
  }

  /**
   * 删除要素
   * @param entity 要素对象
   */
  deleteEntity(entity?: Entity): void {
    const targetEntity = entity || this.currEditFeature
    if (!targetEntity) return

    const entityExt = targetEntity as Entity & EntityExtension
    const editing = entityExt.editing
    if (editing?.disable) {
      editing.disable()
    }

    if (this.dataSource?.entities.contains(targetEntity)) {
      this.dataSource.entities.remove(targetEntity)
    }

    if (this.primitives?.contains(targetEntity as unknown as Cesium.Primitive)) {
      this.primitives.remove(targetEntity as unknown as Cesium.Primitive)
    }

    this.fire(EventTypeEnum.Delete, { entity: targetEntity })
  }

  /**
   * 删除要素（别名方法）
   * @param entity 要素对象
   */
  remove(entity?: Entity): void {
    this.deleteEntity(entity)
  }

  /**
   * 删除所有要素（别名方法）
   */
  deleteAll(): this {
    return this.clearDraw()
  }

  /**
   * 删除所有要素（别名方法）
   */
  removeAll(): this {
    return this.clearDraw()
  }

  /**
   * 加载 GeoJSON 数据
   * @param json GeoJSON 数据
   * @param options 加载选项
   */
  loadJson(
    json: string | GeoJSONFeatureCollection | GeoJSONFeature,
    options?: LoadJsonOptions
  ): Entity[] {
    const opts = options || {}

    let jsonObjs: GeoJSONFeatureCollection | GeoJSONFeature
    try {
      if (typeof json === 'string') {
        jsonObjs = JSON.parse(json) as GeoJSONFeatureCollection | GeoJSONFeature
      } else {
        jsonObjs = json
      }
    } catch (e) {
      const error = e as Error
      console.error(`${error.name}: ${error.message} \n请确认json文件格式正确!!!`)
      return []
    }

    if (opts.clear) {
      this.clearDraw()
    }

    const arrEntities: Entity[] = []
    const jsonFeatures = 'features' in jsonObjs ? jsonObjs.features : [jsonObjs]

    for (let i = 0, len = jsonFeatures.length; i < len; i++) {
      const feature = jsonFeatures[i]

      if (!feature.properties || !feature.properties.type) {
        // 非本身保存的外部其他 geojson 数据
        feature.properties = feature.properties || {}
        if (feature.geometry) {
          switch (feature.geometry.type) {
            case 'MultiPolygon':
            case 'Polygon':
              feature.properties.type = 'polygon'
              break
            case 'MultiLineString':
            case 'LineString':
              feature.properties.type = 'polyline'
              break
            case 'MultiPoint':
            case 'Point':
              feature.properties.type = 'point'
              break
          }
        }
      }
      feature.properties.style = (opts.style || feature.properties.style || {})
      feature.properties.attr = (feature.properties.attr || {})

      const type = feature.properties.type
      if (!type) {
        console.log(`数据缺少 type 参数，跳过该 feature`)
        continue
      }

      if (opts.onEachFeature) {
        // 添加到地图前回调方法
        opts.onEachFeature(feature, type, i)
      }

      if (!this.drawCtrl[type]) {
        console.log(`数据无法识别或者数据的[${type}]类型参数有误`)
        continue
      }

      let entity: Entity | null | undefined
      const attr = feature.properties.attr as Record<string, unknown> | undefined
      const existEntity = attr && typeof attr === 'object' && 'id' in attr && typeof attr.id === 'string'
        ? this.getEntityById(attr.id)
        : null
      if (existEntity) {
        this.updateAttribute({ style: feature.properties.style }, existEntity)
        entity = existEntity
      } else {
        entity = this.drawCtrl[type].jsonToEntity
          ? this.drawCtrl[type].jsonToEntity(feature)
          : undefined
        if (entity) {
          this.bindDeleteContextmenu(entity)
        }
      }

      if (entity) {
        if (opts.onEachEntity) {
          // 添加到地图后回调方法
          opts.onEachEntity(feature, entity, i)
        }
        arrEntities.push(entity)
      }
    }

    if (opts.flyTo && arrEntities.length > 0) {
      // TODO: 实现飞行到实体
      this.flyTo(arrEntities)
    }

    return arrEntities
  }

  /**
   * 转换为 GeoJSON
   * @param entity 要素对象, 转换单个
   */
  toGeoJSON(entity?: Entity): GeoJSONFeature | GeoJSONFeatureCollection | null {
    this.stopDraw()

    if (entity == null) {
      // 全部数据
      const arrEntity = this.getEntitys()
      if (arrEntity.length === 0) return null

      const features: GeoJSONFeature[] = []
      for (let i = 0, len = arrEntity.length; i < len; i++) {
        const ent = arrEntity[i]
        const entityExt = ent as Entity & EntityExtension
        const attr = entityExt.attribute
        if (attr == null || attr.type == null) continue

        const type = attr.type
        const controller = this.drawCtrl[type]
        if (controller?.attrClass?.toGeoJSON) {
          const geojson = controller.attrClass.toGeoJSON(ent)
          if (geojson && 'type' in geojson && geojson.type === 'Feature') {
            features.push(geojson as GeoJSONFeature)
          }
        }
      }

      if (features.length > 0) {
        return { type: 'FeatureCollection', features: features }
      } else {
        return null
      }
    } else {
      const entityExt = entity as Entity & EntityExtension
      const attr = entityExt.attribute
      if (!attr || !attr.type) return null

      const type = attr.type
      const controller = this.drawCtrl[type]
      if (controller?.attrClass?.toGeoJSON) {
        const geojson = controller.attrClass.toGeoJSON(entity)
        if (geojson && 'type' in geojson && geojson.type === 'Feature') {
          return geojson as GeoJSONFeature
        }
      }
      return null
    }
  }

  /**
   * 更新属性
   * @param attribute 属性
   * @param entity 要素对象
   */
  updateAttribute(attribute: Partial<DrawAttribute>, entity?: Entity): Entity | null {
    const targetEntity = entity || this.currEditFeature
    if (!targetEntity || !attribute) return null

    const entityExt = targetEntity as Entity & EntityExtension
    const entityAttr = entityExt.attribute
    if (!entityAttr) return null

    attribute.style = attribute.style || {}
    attribute.attr = attribute.attr || {}

    // 更新属性
    const type = entityAttr.type
    if (!type) return null

    const controller = this.drawCtrl[type] as unknown as {
      style2Entity?: (style: Record<string, unknown>, entity: Entity) => void
    }
    if (controller?.style2Entity) {
      controller.style2Entity(attribute.style || {}, targetEntity)
      entityExt.attribute = {
        ...entityAttr,
        ...attribute,
        style: { ...entityAttr.style, ...attribute.style },
        attr: { ...entityAttr.attr, ...attribute.attr }
      }
    }

    // 如果在编辑状态，更新绑定的拖拽点
    const editing = entityExt.editing
    if (editing) {
      if (editing.updateAttrForEditing) editing.updateAttrForEditing()
      if (editing.updateDraggers) editing.updateDraggers()
    }

    return targetEntity
  }

  /**
   * 更新样式
   * @param style 样式
   * @param entity 要素对象
   */
  updateStyle(style: Record<string, unknown>, entity?: Entity): Entity | null {
    const targetEntity = entity || this.currEditFeature
    if (!targetEntity) return null

    const entityExt = targetEntity as Entity & EntityExtension
    const entityAttr = entityExt.attribute
    if (!entityAttr) return null

    const type = entityAttr.type
    if (!type) return null
    const oldStyle = entityAttr.style || {}

    for (const key in style) {
      oldStyle[key] = style[key]
    }

    const controller = this.drawCtrl[type] as unknown as {
      style2Entity?: (style: Record<string, unknown>, entity: Entity) => void
    }
    if (controller?.style2Entity) {
      controller.style2Entity(oldStyle, targetEntity)
    }

    return targetEntity
  }

  /**
   * 修改坐标、高程
   * @param positions 坐标数组
   * @param entity 要素对象
   */
  setPositions(positions: Cesium.Cartesian3[], entity?: Entity): Entity | null {
    const targetEntity = entity || this.currEditFeature
    if (!targetEntity || !positions) return null

    // 如果在编辑状态，更新绑定的拖拽点
    const entityExt = targetEntity as Entity & EntityExtension
    const editing = entityExt.editing
    if (editing) {
      if (editing.setPositions) editing.setPositions(positions)
      if (editing.updateDraggers) editing.updateDraggers()
    }

    return targetEntity
  }

  /**
   * 获取所有要素
   */
  getEntitys(): Entity[] {
    this.stopDraw()

    const arr = this.dataSource?.entities.values || []
    const primitiveArr = (this.primitives as PrimitiveCollection & { _primitives?: Entity[] })?._primitives || []
    return arr.concat(primitiveArr)
  }

  /**
   * 根据 ID 查找要素
   * @param id 要素 ID
   */
  getEntityById(id: string): Entity | null {
    if (!id) return null

    const entities = this.getEntitys()
    for (const entity of entities) {
      const entityExt = entity as Entity & EntityExtension
      const attr = entityExt.attribute?.attr
      if (attr && 'id' in attr && attr.id === id) {
        return entity
      }
    }

    return null
  }

  /**
   * 获取实体的经纬度坐标数组
   * @param entity 实体对象
   */
  getCoordinates(entity: Entity): number[][] | null {
    const entityExt = entity as Entity & EntityExtension
    const type = entityExt.attribute?.type
    if (!type) return null

    const controller = this.drawCtrl[type]
    if (controller?.attrClass?.getCoordinates) {
      return controller.attrClass.getCoordinates(entity)
    }
    return null
  }

  /**
   * 获取实体的 Cartesian3 坐标数组
   * @param entity 实体对象
   */
  getPositions(entity: Entity): Cesium.Cartesian3[] | null {
    const entityExt = entity as Entity & EntityExtension
    const type = entityExt.attribute?.type
    if (!type) return null

    const controller = this.drawCtrl[type]
    if (controller?.attrClass?.getPositions) {
      return controller.attrClass.getPositions(entity)
    }
    return null
  }

  /**
   * 获取数据源
   */
  getDataSource(): CustomDataSource | null {
    return this.dataSource
  }

  /**
   * 获取图元集合
   */
  getPrimitives(): PrimitiveCollection | null {
    return this.primitives
  }

  /**
   * 检查是否有绘制内容
   */
  hasDraw(): boolean {
    return this.getEntitys().length > 0
  }

  /**
   * 飞行到实体
   * @param entity 实体对象或实体数组
   * @param options 飞行选项
   */
  flyTo(entity: Entity | Entity[], options?: Record<string, unknown>): void {
    if (!entity) return

    const entities = Array.isArray(entity) ? entity : [entity]
    if (entities.length === 0) return

    // 计算所有实体的边界球
    const instances: Cesium.BoundingSphere[] = []
    for (const ent of entities) {
      try {
        const boundingSphere = Cesium.BoundingSphere.fromPoints(
          this.getPositions(ent) || []
        )
        if (boundingSphere) {
          instances.push(boundingSphere)
        }
      } catch (e) {
        console.warn('Failed to compute bounding sphere for entity', e)
      }
    }

    if (instances.length > 0) {
      const boundingSphere = Cesium.BoundingSphere.fromBoundingSpheres(instances)
      this.cesiumViewer.camera.flyToBoundingSphere(boundingSphere, {
        duration: 2.0,
        ...options
      })
    }
  }

  /**
   * 设置可见性
   * @param visible 是否可见
   */
  setVisible(visible: boolean): void {
    this._visible = visible

    if (!visible) {
      this.stopDraw()
    }

    if (this.dataSource) {
      this.dataSource.show = visible
    }

    if (this.primitives) {
      this.primitives.show = visible
    }
  }

  /**
   * 监听事件
   * @param type 事件类型
   * @param callback 回调函数
   */
  on(type: EventType | string, callback: EventCallback): this {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }

    this.listeners.get(type)!.add(callback)
    return this
  }

  /**
   * 移除事件监听
   * @param type 事件类型
   * @param callback 回调函数
   */
  off(type: EventType | string, callback?: EventCallback): this {
    if (!callback) {
      this.listeners.delete(type)
      return this
    }

    const callbacks = this.listeners.get(type)
    if (callbacks) {
      callbacks.delete(callback)
    }

    return this
  }

  /**
   * 触发事件
   * @param type 事件类型
   * @param data 事件数据
   */
  private fire(type: EventType | string, data: Record<string, unknown>): void {
    const callbacks = this.listeners.get(type)
    if (callbacks) {
      callbacks.forEach((callback) => callback(data))
    }
  }

  protected onDestroy(): void {
    this.clearDraw()

    // 销毁选择事件
    this.destroySelectEvent()

    if (this.tooltip) {
      this.tooltip.destroy()
      this.tooltip = null
    }

    if (this.tiptimeTik) {
      clearTimeout(this.tiptimeTik)
      this.tiptimeTik = null
    }

    if (this.dataSource && this.cesiumViewer.dataSources.contains(this.dataSource)) {
      this.cesiumViewer.dataSources.remove(this.dataSource, true)
    }

    if (this.primitives && this.cesiumViewer.scene.primitives.contains(this.primitives)) {
      this.cesiumViewer.scene.primitives.remove(this.primitives)
    }

    this.dataSource = null
    this.primitives = null
    this.eventPlugin = null
    this.listeners.clear()

    console.log('Graphics plugin destroyed')
  }
}

// 导出类型
export * from './types'
