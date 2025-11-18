import type { Entity, CustomDataSource, PrimitiveCollection } from 'cesium'
import type { GeoJSONFeature as SharedGeoJSONFeature } from '@ktd-cesium/shared'

/**
 * 绘制类型
 */
export type DrawType =
  | 'point'
  | 'billboard'
  | 'label'
  | 'model'
  | 'polyline'
  | 'curve'
  | 'polylineVolume'
  | 'corridor'
  | 'polygon'
  | 'rectangle'
  | 'ellipse'
  | 'circle'
  | 'cylinder'
  | 'ellipsoid'
  | 'wall'
  | 'box'
  | 'plane'
  | 'model-p'

/**
 * 绘制属性
 */
export interface DrawAttribute {
  type: DrawType
  style?: Record<string, unknown>
  attr?: Record<string, unknown>
  success?: (entity: Entity) => void
  [key: string]: unknown
}

/**
 * 绘制选项
 */
export interface DrawOptions {
  /** 是否可编辑 */
  hasEdit?: boolean
  /** 是否移除默认的屏幕空间事件 */
  removeScreenSpaceEvent?: boolean
  /** 名称提示 */
  nameTooltip?: boolean
  /** 是否可删除 */
  hasDel?: (entity: Entity) => boolean
}

/**
 * 加载 GeoJSON 选项
 */
export interface LoadJsonOptions {
  /** 是否清空现有数据 */
  clear?: boolean
  /** 是否飞行到加载的数据 */
  flyTo?: boolean
  /** 样式 */
  style?: Record<string, unknown>
  /** 每个 feature 添加到地图前的回调 */
  onEachFeature?: (feature: GeoJSONFeature, type: string, index: number) => void
  /** 每个 entity 添加到地图后的回调 */
  onEachEntity?: (feature: GeoJSONFeature, entity: Entity, index: number) => void
}

/**
 * 事件类型
 */
export enum EventType {
  /** 开始绘制 */
  DrawStart = 'draw-start',
  /** 绘制鼠标移动 */
  DrawMouseMove = 'draw-mouse-move',
  /** 绘制添加点 */
  DrawAddPoint = 'draw-add-point',
  /** 绘制创建完成 */
  DrawCreated = 'draw-created',
  /** 开始编辑 */
  EditStart = 'edit-start',
  /** 编辑鼠标移动 */
  EditMouseMove = 'edit-mouse-move',
  /** 编辑移动点 */
  EditMovePoint = 'edit-move-point',
  /** 编辑结束 */
  EditStop = 'edit-stop',
  /** 删除 */
  Delete = 'delete'
}

/**
 * 事件数据
 */
export interface DrawEventData {
  drawtype?: DrawType
  entity?: Entity
  [key: string]: unknown
}

/**
 * 事件回调
 */
export type EventCallback = (data: DrawEventData) => void

/**
 * 坐标
 */
export interface Coordinates {
  longitude: number
  latitude: number
  height?: number
}

/**
 * GeoJSON Feature (重新导出 shared 包中的类型)
 */
export type GeoJSONFeature = SharedGeoJSONFeature

/**
 * GeoJSON FeatureCollection
 */
export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

/**
 * Attr 类接口
 */
export interface AttrClass {
  toGeoJSON?: (entity: Entity) => GeoJSONFeature | Record<string, unknown>
  getCoordinates?: (entity: Entity) => number[][] | null
  getPositions?: (entity: Entity) => import('cesium').Cartesian3[] | null
}

/**
 * 绘制控制器
 */
export interface DrawController {
  type?: string
  activate(attribute: DrawAttribute, callback?: (entity: Entity) => void): Entity
  disable(hasWB?: boolean): void
  endDraw?(): void
  setFireFunction?(fn: (type: string, data?: Record<string, unknown>, propagate?: boolean) => void): DrawController
  setTooltip?(tooltip: unknown): DrawController
  jsonToEntity?(geojson: unknown): Entity | null | undefined
  attrClass?: AttrClass | null
}

/**
 * 编辑控制器
 */
export interface EditController {
  activate(): void
  disable(): void
  updateAttrForEditing?(): void
  updateDraggers?(): void
  setPositions?(positions: import('cesium').Cartesian3[]): void
}

/**
 * Entity 扩展
 */
export interface EntityExtension {
  attribute?: {
    type?: string
    style?: Record<string, unknown>
    attr?: Record<string, unknown>
    [key: string]: unknown
  }
  editing?: EditController
  _positions_draw?: import('cesium').Cartesian3[]
  _draw_positions?: import('cesium').Cartesian3[]
  _minimumHeights?: number[]
  _maximumHeights?: number[]
  contextmenuItems?: Array<{
    text: string
    iconCls: string
    visible: (e: { target: Entity }) => boolean
    callback: (e: { target: Entity }) => void
  }>
  hasEdit?: boolean
  inProgress?: boolean
}

/**
 * Draw 实例配置
 */
export interface DrawConfig {
  dataSource: CustomDataSource
  primitives: PrimitiveCollection
  tooltip: unknown
  viewer: unknown
}
