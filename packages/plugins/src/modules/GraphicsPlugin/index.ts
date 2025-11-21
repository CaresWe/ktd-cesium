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
import { TransformPlugin, TransformMode, TransformSpace } from '../TransformPlugin'

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
  /** 聚合配置 */
  clustering?: import('./types').ClusterOptions
  /** 变换控制器配置 */
  transform?: {
    /** 是否启用变换控制器 */
    enabled?: boolean
    /** 默认变换模式 */
    mode?: TransformMode
    /** 默认坐标空间 */
    space?: TransformSpace
    /** 是否显示辅助轴 */
    showGizmo?: boolean
    /** 辅助轴大小 */
    gizmoSize?: number
    /** 是否启用吸附 */
    snap?: boolean
    /** 平移吸附值 */
    translateSnap?: number
    /** 旋转吸附值（度） */
    rotateSnap?: number
    /** 缩放吸附值 */
    scaleSnap?: number
  }
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

  /** 聚合配置 */
  private clusterOptions: import('./types').ClusterOptions | null = null

  /** Primitive聚合数据源（用于billboard聚合显示） */
  private clusterDataSource: CustomDataSource | null = null

  /** 变换控制器插件 */
  private transformPlugin: TransformPlugin | null = null

  /** 变换控制器是否启用 */
  private transformEnabled = false

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

    // 初始化聚合数据源（用于Primitive聚合显示）
    this.clusterDataSource = new Cesium.CustomDataSource('GraphicsPlugin-ClusterDataSource')
    this.cesiumViewer.dataSources.add(this.clusterDataSource)

    // 设置聚合配置
    if (options?.clustering) {
      this.setClusterOptions(options.clustering)
    }

    // 初始化变换控制器
    if (options?.transform?.enabled !== false) {
      const transformPlugin = new TransformPlugin({
        mode: options?.transform?.mode || TransformMode.TRANSLATE,
        space: options?.transform?.space || TransformSpace.WORLD,
        showGizmo: options?.transform?.showGizmo !== false,
        gizmoSize: options?.transform?.gizmoSize || 1.0,
        snap: options?.transform?.snap || false,
        translateSnap: options?.transform?.translateSnap || 0.1,
        rotateSnap: options?.transform?.rotateSnap || 5,
        scaleSnap: options?.transform?.scaleSnap || 0.1
      })
      transformPlugin.install(viewer as unknown as Parameters<TransformPlugin['install']>[0])
      this.transformPlugin = transformPlugin
      this.transformEnabled = true
    }

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
    const handleEntityPick = (pickInfo: PickInfo): Entity | Cesium.Primitive | null => {
      if (!pickInfo.pickedObject) return null

      const picked = pickInfo.pickedObject as Cesium.Cesium3DTileFeature & {
        id?: Entity
        primitive?: { id?: Entity } & Cesium.Primitive
      }

      // 优先返回 Entity
      if (picked.id) return picked.id
      if (picked.primitive?.id) return picked.primitive.id

      // 返回 Primitive（用于 Primitive 模式的变换支持）
      if (picked.primitive) return picked.primitive

      return null
    }

    // 左键点击选中（PC端）
    const leftClickId = this.eventPlugin.onLeftClick((info: PickInfo) => {
      const target = handleEntityPick(info)

      if (target && this.isMyEntity(target)) {
        if (this.hasDrawing()) return // 还在绘制中时，跳出
        if (this.currEditFeature && this.currEditFeature === target) return // 重复单击了跳出

        // 对于 Entity，检查编辑标志
        if (target instanceof Cesium.Entity) {
          const entityExt = target as Entity & { hasEdit?: boolean; inProgress?: boolean }
          if (entityExt.hasEdit === false) return // 如果设置了不可编辑跳出
          if (entityExt.inProgress === true) return // 正在绘制中跳出
        }

        this.startEditing(target)
        return
      }
      this.stopEditing()
    })
    this.selectEventIds.push(leftClickId)

    // 触摸开始（移动端）
    const touchStartId = this.eventPlugin.onTouchStart((info: PickInfo) => {
      const target = handleEntityPick(info)

      if (target && this.isMyEntity(target)) {
        if (this.hasDrawing()) return
        if (this.currEditFeature && this.currEditFeature === target) return

        // 对于 Entity，检查编辑标志
        if (target instanceof Cesium.Entity) {
          const entityExt = target as Entity & { hasEdit?: boolean; inProgress?: boolean }
          if (entityExt.hasEdit === false) return
          if (entityExt.inProgress === true) return
        }

        this.startEditing(target)
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
   * @param entity 实体对象或 Primitive
   */
  private isMyEntity(entity: Entity | Cesium.Primitive): boolean {
    if (entity instanceof Cesium.Entity) {
      if (this.dataSource?.entities.contains(entity)) return true
    }
    if (this.primitives?.contains(entity as Cesium.Primitive)) return true
    return false
  }

  /**
   * 开始编辑
   * @param entity 要素对象或 Primitive
   */
  startEditing(entity: Entity | Cesium.Primitive): void {
    this.stopEditing()

    if (!entity || !this._hasEdit) return

    // 检查是否是 Primitive
    const isPrimitive = !(entity instanceof Cesium.Entity)

    if (!isPrimitive) {
      const entityExt = entity as Entity & EntityExtension
      const editing = entityExt.editing
      if (editing?.activate) {
        editing.activate()
      }
    }

    this.currEditFeature = entity as Entity

    // 如果启用了变换控制器，且目标支持变换
    if (this.transformEnabled && this.transformPlugin && this._canTransform(entity)) {
      // 延迟附加，避免与编辑控制器冲突
      setTimeout(() => {
        if (this.transformPlugin && this.currEditFeature === entity) {
          this.transformPlugin.attach(entity as Cesium.Entity)
        }
      }, 100)
    }
  }

  /**
   * 判断实体是否可以进行变换
   */
  private _canTransform(entity: Entity | Cesium.Primitive): boolean {
    // Entity: 所有具有 position 属性的实体都支持变换
    if ('position' in entity && entity.position) {
      return true
    }

    // Primitive: 检查是否有 modelMatrix 或自定义的 position 属性
    const primitive = entity as unknown as Record<string, unknown>
    if (primitive.modelMatrix || primitive._positions_draw || primitive.position) {
      return true
    }

    return false
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

    // 分离变换控制器
    if (this.transformPlugin) {
      this.transformPlugin.detach()
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

    if (this.clusterDataSource) {
      this.clusterDataSource.show = visible
    }
  }

  /**
   * 启用变换控制器
   */
  enableTransform(): void {
    if (!this.transformPlugin) {
      console.warn('Transform plugin is not initialized')
      return
    }
    this.transformEnabled = true

    // 如果当前有选中的实体，自动附加
    if (this.currEditFeature && this._canTransform(this.currEditFeature)) {
      this.transformPlugin.attach(this.currEditFeature)
    }
  }

  /**
   * 禁用变换控制器
   */
  disableTransform(): void {
    this.transformEnabled = false
    if (this.transformPlugin) {
      this.transformPlugin.detach()
    }
  }

  /**
   * 设置变换模式
   * @param mode 变换模式
   */
  setTransformMode(mode: TransformMode): void {
    if (!this.transformPlugin) {
      console.warn('Transform plugin is not initialized')
      return
    }
    this.transformPlugin.setMode(mode)
  }

  /**
   * 设置变换坐标空间
   * @param space 坐标空间
   */
  setTransformSpace(space: TransformSpace): void {
    if (!this.transformPlugin) {
      console.warn('Transform plugin is not initialized')
      return
    }
    this.transformPlugin.setSpace(space)
  }

  /**
   * 获取变换控制器实例
   */
  getTransformPlugin(): TransformPlugin | null {
    return this.transformPlugin
  }

  /**
   * 设置聚合配置
   * @param options 聚合配置选项
   */
  setClusterOptions(options: import('./types').ClusterOptions): void {
    this.clusterOptions = {
      enabled: options.enabled !== false,
      pixelRange: options.pixelRange || 80,
      minimumClusterSize: options.minimumClusterSize || 2,
      showLabel: options.showLabel !== false,
      clusterStyle: {
        color: options.clusterStyle?.color || '#ff6b6b',
        pixelSize: options.clusterStyle?.pixelSize || 40,
        outlineColor: options.clusterStyle?.outlineColor || '#ffffff',
        outlineWidth: options.clusterStyle?.outlineWidth || 2,
        font: options.clusterStyle?.font || 'bold 16px sans-serif',
        labelColor: options.clusterStyle?.labelColor || '#ffffff',
        labelOutlineColor: options.clusterStyle?.labelOutlineColor || '#000000',
        labelOutlineWidth: options.clusterStyle?.labelOutlineWidth || 2
      },
      clusterEvent: options.clusterEvent
    }

    this._applyEntityClustering()
    this._applyPrimitiveClustering()
  }

  /**
   * 启用聚合
   */
  enableClustering(): void {
    if (!this.clusterOptions) {
      this.setClusterOptions({ enabled: true })
    } else {
      this.clusterOptions.enabled = true
      this._applyEntityClustering()
      this._applyPrimitiveClustering()
    }
  }

  /**
   * 禁用聚合
   */
  disableClustering(): void {
    if (this.clusterOptions) {
      this.clusterOptions.enabled = false
    }

    // 禁用Entity聚合
    if (this.dataSource?.clustering) {
      this.dataSource.clustering.enabled = false
    }

    // 清理Primitive聚合显示
    if (this.clusterDataSource) {
      this.clusterDataSource.entities.removeAll()
    }
  }

  /**
   * 应用Entity聚合
   */
  private _applyEntityClustering(): void {
    if (!this.dataSource || !this.clusterOptions) return

    const clustering = this.dataSource.clustering
    const opts = this.clusterOptions

    clustering.enabled = opts.enabled || false
    clustering.pixelRange = opts.pixelRange || 80
    clustering.minimumClusterSize = opts.minimumClusterSize || 2

    if (opts.enabled) {
      // 自定义聚合样式
      clustering.clusterEvent.addEventListener((clusteredEntities: Entity[], cluster: { billboard: Cesium.Billboard; label: Cesium.Label }) => {
        cluster.billboard.show = true
        cluster.label.show = opts.showLabel !== false

        const count = clusteredEntities.length
        const style = opts.clusterStyle || {}

        // 设置聚合billboard样式
        cluster.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM
        cluster.billboard.scale = 1.0

        // 根据数量调整大小和颜色
        let size = style.pixelSize || 40
        let color = Cesium.Color.fromCssColorString(style.color || '#ff6b6b')

        if (count >= 100) {
          size = 60
          color = Cesium.Color.RED
        } else if (count >= 50) {
          size = 50
          color = Cesium.Color.ORANGE
        } else if (count >= 10) {
          size = 45
          color = Cesium.Color.YELLOW
        }

        // 创建聚合图标
        cluster.billboard.image = this._createClusterIcon(count, size, color, style)

        // 设置聚合标签
        if (opts.showLabel !== false) {
          cluster.label.text = count.toString()
          cluster.label.font = style.font || 'bold 16px sans-serif'
          cluster.label.fillColor = Cesium.Color.fromCssColorString(style.labelColor || '#ffffff')
          cluster.label.outlineColor = Cesium.Color.fromCssColorString(style.labelOutlineColor || '#000000')
          cluster.label.outlineWidth = style.labelOutlineWidth || 2
          cluster.label.pixelOffset = new Cesium.Cartesian2(0, -size / 2)
        }

        // 调用自定义聚合事件
        if (opts.clusterEvent) {
          opts.clusterEvent(clusteredEntities, cluster)
        }
      })
    }
  }

  /**
   * 应用Primitive聚合
   * Primitive不支持原生聚合，需要手动实现
   */
  private _applyPrimitiveClustering(): void {
    if (!this.primitives || !this.clusterDataSource || !this.clusterOptions) return

    const opts = this.clusterOptions

    if (!opts.enabled) {
      this.clusterDataSource.entities.removeAll()
      return
    }

    // 监听场景渲染后事件，动态聚合Primitive
    this.cesiumViewer.scene.postRender.addEventListener(this._clusterPrimitives.bind(this))
  }

  /**
   * 聚合Primitive对象
   */
  private _clusterPrimitives(): void {
    if (!this.primitives || !this.clusterDataSource || !this.clusterOptions?.enabled) return

    // 清空聚合数据源
    this.clusterDataSource.entities.removeAll()

    // 收集所有可聚合的Primitive（Billboard, Point, Label）
    const clusterableItems: Array<{
      position: Cesium.Cartesian3
      primitive: unknown
    }> = []

    // 遍历primitives收集位置
    const primitivesList = (this.primitives as PrimitiveCollection & { _primitives?: unknown[] })?._primitives || []
    for (const primitive of primitivesList) {
      const primitiveCast = primitive as {
        _billboards?: Cesium.BillboardCollection
        _points?: Cesium.PointPrimitiveCollection
        _labels?: Cesium.LabelCollection
      } & { position?: Cesium.Cartesian3 }

      // Billboard Collection
      if (primitiveCast._billboards) {
        const billboards = primitiveCast._billboards
        for (let i = 0; i < billboards.length; i++) {
          const billboard = billboards.get(i)
          if (billboard.show && billboard.position) {
            clusterableItems.push({ position: billboard.position, primitive: billboard })
          }
        }
      }

      // Point Collection
      if (primitiveCast._points) {
        const points = primitiveCast._points
        for (let i = 0; i < points.length; i++) {
          const point = points.get(i)
          if (point.show && point.position) {
            clusterableItems.push({ position: point.position, primitive: point })
          }
        }
      }

      // Label Collection
      if (primitiveCast._labels) {
        const labels = primitiveCast._labels
        for (let i = 0; i < labels.length; i++) {
          const label = labels.get(i)
          if (label.show && label.position) {
            clusterableItems.push({ position: label.position, primitive: label })
          }
        }
      }
    }

    // 执行聚合算法
    const clusters = this._performClustering(clusterableItems)

    // 创建聚合显示
    const style = this.clusterOptions.clusterStyle || {}
    for (const cluster of clusters) {
      if (cluster.items.length >= (this.clusterOptions.minimumClusterSize || 2)) {
        // 创建聚合点
        const count = cluster.items.length
        let size = style.pixelSize || 40
        let color = Cesium.Color.fromCssColorString(style.color || '#ff6b6b')

        if (count >= 100) {
          size = 60
          color = Cesium.Color.RED
        } else if (count >= 50) {
          size = 50
          color = Cesium.Color.ORANGE
        } else if (count >= 10) {
          size = 45
          color = Cesium.Color.YELLOW
        }

        this.clusterDataSource.entities.add({
          position: cluster.center,
          billboard: {
            image: this._createClusterIcon(count, size, color, style),
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            scale: 1.0
          },
          label: this.clusterOptions.showLabel !== false
            ? {
                text: count.toString(),
                font: style.font || 'bold 16px sans-serif',
                fillColor: Cesium.Color.fromCssColorString(style.labelColor || '#ffffff'),
                outlineColor: Cesium.Color.fromCssColorString(style.labelOutlineColor || '#000000'),
                outlineWidth: style.labelOutlineWidth || 2,
                pixelOffset: new Cesium.Cartesian2(0, -size / 2)
              }
            : undefined
        })

        // 隐藏被聚合的原始对象
        for (const item of cluster.items) {
          const prim = item.primitive as { show?: boolean }
          if (prim.show !== undefined) {
            prim.show = false
          }
        }
      }
    }
  }

  /**
   * 执行聚合算法
   */
  private _performClustering(
    items: Array<{ position: Cesium.Cartesian3; primitive: unknown }>
  ): Array<{ center: Cesium.Cartesian3; items: typeof items }> {
    const pixelRange = this.clusterOptions?.pixelRange || 80
    const clusters: Array<{ center: Cesium.Cartesian3; items: typeof items }> = []
    const processed = new Set<number>()

    for (let i = 0; i < items.length; i++) {
      if (processed.has(i)) continue

      const item = items[i]
      const screenPos = Cesium.SceneTransforms.worldToWindowCoordinates(
        this.cesiumViewer.scene,
        item.position
      )

      if (!screenPos) continue

      const cluster: { center: Cesium.Cartesian3; items: typeof items } = {
        center: item.position,
        items: [item]
      }

      processed.add(i)

      // 查找附近的点
      for (let j = i + 1; j < items.length; j++) {
        if (processed.has(j)) continue

        const otherItem = items[j]
        const otherScreenPos = Cesium.SceneTransforms.worldToWindowCoordinates(
          this.cesiumViewer.scene,
          otherItem.position
        )

        if (!otherScreenPos) continue

        const distance = Cesium.Cartesian2.distance(screenPos, otherScreenPos)
        if (distance <= pixelRange) {
          cluster.items.push(otherItem)
          processed.add(j)
        }
      }

      // 计算聚合中心
      if (cluster.items.length > 1) {
        const positions = cluster.items.map((item) => item.position)
        cluster.center = Cesium.BoundingSphere.fromPoints(positions).center
      }

      clusters.push(cluster)
    }

    return clusters
  }

  /**
   * 创建聚合图标
   */
  private _createClusterIcon(
    count: number,
    size: number,
    color: Cesium.Color,
    style: Record<string, unknown>
  ): string {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas.toDataURL()

    // 绘制圆形背景
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${color.red * 255}, ${color.green * 255}, ${color.blue * 255}, ${color.alpha})`
    ctx.fill()

    // 绘制轮廓
    const outlineWidth = (style.outlineWidth as number) || 2
    const outlineColor = (style.outlineColor as string) || '#ffffff'
    ctx.strokeStyle = outlineColor
    ctx.lineWidth = outlineWidth
    ctx.stroke()

    // 绘制数字
    ctx.fillStyle = (style.labelColor as string) || '#ffffff'
    ctx.font = `bold ${size / 2}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(count.toString(), size / 2, size / 2)

    // 返回DataURL格式的图片
    return canvas.toDataURL()
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

    // 禁用聚合
    this.disableClustering()

    // 销毁变换控制器
    if (this.transformPlugin) {
      this.transformPlugin.destroy()
      this.transformPlugin = null
    }

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

    if (this.clusterDataSource && this.cesiumViewer.dataSources.contains(this.clusterDataSource)) {
      this.cesiumViewer.dataSources.remove(this.clusterDataSource, true)
    }

    if (this.primitives && this.cesiumViewer.scene.primitives.contains(this.primitives)) {
      this.cesiumViewer.scene.primitives.remove(this.primitives)
    }

    // 移除场景渲染事件监听
    this.cesiumViewer.scene.postRender.removeEventListener(this._clusterPrimitives.bind(this))

    this.dataSource = null
    this.clusterDataSource = null
    this.primitives = null
    this.eventPlugin = null
    this.clusterOptions = null
    this.listeners.clear()

    console.log('Graphics plugin destroyed')
  }
}

// 导出类型
export * from './types'
export { TransformMode, TransformSpace } from '../TransformPlugin'
