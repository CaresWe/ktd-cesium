import { BasePlugin } from '../../BasePlugin'
import type { KtdViewer } from '@ktd-cesium/core'
import type { Viewer as CesiumViewer, Entity, CustomDataSource, PrimitiveCollection } from 'cesium'
import * as Cesium from 'cesium'
import type {
  DrawType,
  DrawAttribute,
  DrawOptions,
  LoadJsonOptions,
  EventType,
  EventCallback,
  GeoJSONFeature,
  GeoJSONFeatureCollection,
  DrawController,
  EditController,
  EntityExtension
} from './types'
import { EventType as EventTypeEnum } from './types'
import { Tooltip } from './core/Tooltip'
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

  /** 事件监听器 */
  private listeners: Map<string, Set<EventCallback>> = new Map()

  /** 选择处理器 */
  private selectHandler: Cesium.ScreenSpaceEventHandler | null = null

  /** 提示框 */
  private tooltip: Tooltip | null = null

  protected onInstall(viewer: KtdViewer): void {
    // 初始化数据源
    this.dataSource = new Cesium.CustomDataSource('GraphicsPlugin-DataSource')
    this.cesiumViewer.dataSources.add(this.dataSource)

    // 初始化图元集合
    this.primitives = this.cesiumViewer.scene.primitives.add(
      new Cesium.PrimitiveCollection()
    ) as PrimitiveCollection

    // 初始化提示框
    this.tooltip = new Tooltip(this.cesiumViewer.container)

    // 初始化绘制控制器
    this._initDrawControllers()

    console.log('Graphics plugin installed')
  }

  /**
   * 初始化绘制控制器
   */
  private _initDrawControllers(): void {
    const viewer = this.cesiumViewer
    const dataSource = this.dataSource!
    const primitives = this.primitives!

    // 绑定事件触发器
    const fire = (type: string, data: Record<string, unknown>) => {
      this.fire(type as EventType, data)
    }

    // 点绘制
    const drawPoint = new DrawPoint(viewer, dataSource, primitives)
    drawPoint._fire = fire
    drawPoint.tooltip = this.tooltip
    this.drawCtrl['point'] = drawPoint

    // Billboard 图标绘制
    const drawBillboard = new DrawBillboard(viewer, dataSource, primitives)
    drawBillboard._fire = fire
    drawBillboard.tooltip = this.tooltip
    this.drawCtrl['billboard'] = drawBillboard

    // Label 文字标注
    const drawLabel = new DrawLabel(viewer, dataSource, primitives)
    drawLabel._fire = fire
    drawLabel.tooltip = this.tooltip
    this.drawCtrl['label'] = drawLabel

    // 线绘制
    const drawPolyline = new DrawPolyline(viewer, dataSource, primitives)
    drawPolyline._fire = fire
    drawPolyline.tooltip = this.tooltip
    this.drawCtrl['polyline'] = drawPolyline

    // 面绘制
    const drawPolygon = new DrawPolygon(viewer, dataSource, primitives)
    drawPolygon._fire = fire
    drawPolygon.tooltip = this.tooltip
    this.drawCtrl['polygon'] = drawPolygon

    // 圆形绘制
    const drawCircle = new DrawCircle(viewer, dataSource, primitives)
    drawCircle._fire = fire
    drawCircle.tooltip = this.tooltip
    this.drawCtrl['circle'] = drawCircle
    this.drawCtrl['ellipse'] = drawCircle

    // 矩形绘制
    const drawRectangle = new DrawRectangle(viewer, dataSource, primitives)
    drawRectangle._fire = fire
    drawRectangle.tooltip = this.tooltip
    this.drawCtrl['rectangle'] = drawRectangle

    // 走廊绘制
    const drawCorridor = new DrawCorridor(viewer, dataSource, primitives)
    drawCorridor._fire = fire
    drawCorridor.tooltip = this.tooltip
    this.drawCtrl['corridor'] = drawCorridor

    // 墙体绘制
    const drawWall = new DrawWall(viewer, dataSource, primitives)
    drawWall._fire = fire
    drawWall.tooltip = this.tooltip
    this.drawCtrl['wall'] = drawWall

    // 立方体绘制
    const drawBox = new DrawBox(viewer, dataSource, primitives)
    drawBox._fire = fire
    drawBox.tooltip = this.tooltip
    this.drawCtrl['box'] = drawBox

    // 圆柱体绘制
    const drawCylinder = new DrawCylinder(viewer, dataSource, primitives)
    drawCylinder._fire = fire
    drawCylinder.tooltip = this.tooltip
    this.drawCtrl['cylinder'] = drawCylinder

    // 椭球体绘制
    const drawEllipsoid = new DrawEllipsoid(viewer, dataSource, primitives)
    drawEllipsoid._fire = fire
    drawEllipsoid.tooltip = this.tooltip
    this.drawCtrl['ellipsoid'] = drawEllipsoid

    // 曲线绘制
    const drawCurve = new DrawCurve(viewer, dataSource, primitives)
    drawCurve._fire = fire
    drawCurve.tooltip = this.tooltip
    this.drawCtrl['curve'] = drawCurve

    // 平面绘制
    const drawPlane = new DrawPlane(viewer, dataSource, primitives)
    drawPlane._fire = fire
    drawPlane.tooltip = this.tooltip
    this.drawCtrl['plane'] = drawPlane

    // 3D模型加载
    const drawModel = new DrawModel(viewer, dataSource, primitives)
    drawModel._fire = fire
    drawModel.tooltip = this.tooltip
    this.drawCtrl['model'] = drawModel

    // 管道体绘制
    const drawPolylineVolume = new DrawPolylineVolume(viewer, dataSource, primitives)
    drawPolylineVolume._fire = fire
    drawPolylineVolume.tooltip = this.tooltip
    this.drawCtrl['polylineVolume'] = drawPolylineVolume
  }

  /**
   * 开始绘制
   * @param attribute 绘制属性
   */
  startDraw(attribute: DrawAttribute | DrawType): Entity | undefined {
    // 参数转换
    const attr = typeof attribute === 'string'
      ? { type: attribute }
      : attribute

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

    return entity
  }

  /**
   * 停止绘制
   */
  stopDraw(): this {
    this.stopEditing()

    for (const type in this.drawCtrl) {
      if (this.drawCtrl[type]?.disable) {
        this.drawCtrl[type].disable(true)
      }
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
   * 加载 GeoJSON 数据
   * @param json GeoJSON 数据
   * @param options 加载选项
   */
  loadJson(json: string | GeoJSONFeatureCollection | GeoJSONFeature, options?: LoadJsonOptions): Entity[] {
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
      feature.properties.style = opts.style || feature.properties.style || {}
      feature.properties.attr = feature.properties.attr || {}

      if (opts.onEachFeature) {
        // 添加到地图前回调方法
        opts.onEachFeature(feature, feature.properties.type, i)
      }

      const type = feature.properties.type
      if (!this.drawCtrl[type]) {
        console.log(`数据无法识别或者数据的[${type}]类型参数有误`)
        continue
      }

      let entity: Entity | undefined
      const existEntity = this.getEntityById(feature.properties.attr.id)
      if (existEntity) {
        this.updateAttribute({ style: feature.properties.style }, existEntity)
        entity = existEntity
      } else {
        entity = this.drawCtrl[type].jsonToEntity ? this.drawCtrl[type].jsonToEntity(feature) : undefined
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
      console.log('飞行到实体')
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
          if (geojson) {
            features.push(geojson)
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
        return controller.attrClass.toGeoJSON(entity)
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
    const controller = this.drawCtrl[type]
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
    const oldStyle = entityAttr.style || {}

    for (const key in style) {
      oldStyle[key] = style[key]
    }

    const controller = this.drawCtrl[type]
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
    return arr
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
   * 设置可见性
   * @param visible 是否可见
   */
  setVisible(visible: boolean): void {
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
      callbacks.forEach(callback => callback(data))
    }
  }

  protected onDestroy(): void {
    this.clearDraw()

    if (this.selectHandler) {
      this.selectHandler.destroy()
      this.selectHandler = null
    }

    if (this.tooltip) {
      this.tooltip.destroy()
      this.tooltip = null
    }

    if (this.dataSource && this.cesiumViewer.dataSources.contains(this.dataSource)) {
      this.cesiumViewer.dataSources.remove(this.dataSource, true)
    }

    this.dataSource = null
    this.primitives = null
    this.listeners.clear()

    console.log('Graphics plugin destroyed')
  }
}

// 导出类型
export * from './types'
