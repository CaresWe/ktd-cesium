/**
 * GraphicsPlugin 类型定义
 */

import * as Cesium from 'cesium'
import type { WaveType } from '../../MaterialPlugin'

// ============================================
// 基础插件接口定义
// ============================================

/**
 * 可启用的插件接口
 */
export interface EnableablePlugin {
  enable: boolean
}

/**
 * EventPlugin 接口
 */
export interface EventPluginInterface {
  on: (
    types: string | Record<string, (...args: unknown[]) => unknown>,
    fn?: (...args: unknown[]) => unknown,
    context?: unknown
  ) => unknown
  off: (
    types?: string | Record<string, (...args: unknown[]) => unknown>,
    fn?: (...args: unknown[]) => unknown,
    context?: unknown
  ) => unknown
  fire: (type: string, data?: Record<string, unknown>, propagate?: boolean) => unknown
}

/**
 * TooltipPlugin 接口
 */
export interface TooltipPluginInterface {
  showAt: (position: { x: number; y: number } | Cesium.Cartesian2 | null, content?: string) => void
  setVisible: (visible: boolean) => void
  enable?: boolean
}

/**
 * 扩展的 Viewer 类型（支持 AutoViewer 的插件系统）
 */
export interface ExtendedViewer {
  getPlugin?: <T = unknown>(name: string) => T | undefined
}

/**
 * 扩展的 Entity 类型（用于 DrawBase 内部）
 */
export interface ExtendedEntity {
  attribute?: Record<string, unknown>
  inProgress?: boolean
  editing?: unknown
}

/**
 * 编辑类构造函数类型
 * 用于将编辑类作为类型传递给绘制类
 */
export type EditClassConstructor = new (
  entity: Cesium.Entity,
  viewer: Cesium.Viewer,
  dataSource: Cesium.CustomDataSource
) => EditController

// ============================================
// 基础类型定义
// ============================================

/**
 * 绘制类型
 */
export type DrawType =
  | 'point'
  | 'billboard'
  | 'label'
  | 'polyline'
  | 'polygon'
  | 'circle'
  | 'ellipse'
  | 'rectangle'
  | 'corridor'
  | 'wall'
  | 'box'
  | 'cylinder'
  | 'ellipsoid'
  | 'curve'
  | 'plane'
  | 'model'
  | 'polylineVolume'

/**
 * 事件类型
 */
export enum EventType {
  DrawStart = 'drawStart',
  DrawCreated = 'drawCreated',
  DrawMouseMove = 'drawMouseMove',
  DrawMouseDown = 'drawMouseDown',
  EditStart = 'editStart',
  EditMove = 'editMove',
  EditStop = 'editStop',
  Delete = 'delete'
}

/**
 * 事件回调函数
 */
export type EventCallback = (data: EventData) => void

/**
 * 事件数据
 */
export interface EventData {
  drawtype?: DrawType
  entity?: Cesium.Entity
  position?: Cesium.Cartesian3
  positions?: Cesium.Cartesian3[]
  [key: string]: unknown
}

// ============================================
// 样式配置类型
// ============================================

/**
 * 基础样式配置
 */
export interface BaseStyle {
  color?: string
  opacity?: number
  outline?: boolean
  outlineColor?: string
  outlineOpacity?: number
  outlineWidth?: number
  clampToGround?: boolean
  heightReference?: string | Cesium.HeightReference
  distanceDisplayCondition?: boolean
  distanceDisplayCondition_near?: number
  distanceDisplayCondition_far?: number
  [key: string]: unknown
}

/**
 * 点样式
 */
export interface PointStyle extends BaseStyle {
  pixelSize?: number
  scaleByDistance?: boolean
  scaleByDistance_near?: number
  scaleByDistance_nearValue?: number
  scaleByDistance_far?: number
  scaleByDistance_farValue?: number
  visibleDepth?: boolean
}

/**
 * 图标样式
 */
export interface BillboardStyle extends BaseStyle {
  image?: string
  scale?: number
  rotation?: number
  horizontalOrigin?: string
  verticalOrigin?: string
  label?: LabelStyle
}

/**
 * 文字样式
 */
export interface LabelStyle extends BaseStyle {
  text?: string
  font_family?: string
  font_size?: number
  font_weight?: string
  font_style?: string
  background?: boolean
  background_color?: string
  background_opacity?: number
  border?: boolean
  border_color?: string
  border_width?: number
  scaleByDistance?: boolean
  scaleByDistance_near?: number
  scaleByDistance_nearValue?: number
  scaleByDistance_far?: number
  scaleByDistance_farValue?: number
}

/**
 * 线样式
 */
export interface PolylineStyle extends BaseStyle {
  width?: number
  lineType?: 'solid' | 'dash' | 'glow' | 'arrow' | 'animation'
  dashLength?: number
  glowPower?: number
  material?: Cesium.MaterialProperty
  depthFail?: boolean
  depthFailColor?: string
  depthFailOpacity?: number
  animationDuration?: number
  animationImage?: string
  animationRepeatX?: number
  animationRepeatY?: number
}

/**
 * 面样式
 */
export interface PolygonStyle extends BaseStyle {
  fill?: boolean
  fillType?: 'color' | 'image' | 'grid' | 'checkerboard' | 'stripe'
  image?: string
  grid_lineCount?: number
  grid_lineThickness?: number
  grid_cellAlpha?: number
  checkerboard_repeat?: number
  checkerboard_oddcolor?: string
  stripe_repeat?: number
  stripe_oddcolor?: string
  height?: number
  extrudedHeight?: number
  perPositionHeight?: boolean
  stRotation?: number
}

/**
 * 圆形样式
 */
export interface CircleStyle extends PolygonStyle {
  radius?: number
  semiMinorAxis?: number
  semiMajorAxis?: number
  rotation?: number
}

/**
 * 矩形样式
 */
export interface RectangleStyle extends PolygonStyle {
  rotation?: number
}

/**
 * 走廊样式
 */
export interface CorridorStyle extends PolygonStyle {
  width?: number
  cornerType?: 'ROUNDED' | 'BEVELED' | 'MITERED'
}

/**
 * 墙体样式
 */
export interface WallStyle extends BaseStyle {
  extrudedHeight?: number
  fillType?: 'color' | 'image' | 'animation'
  animationDuration?: number
  animationImage?: string
  animationRepeatX?: number
  animationAxisY?: boolean
}

/**
 * 3D图形样式
 */
export interface Shape3DStyle extends BaseStyle {
  fill?: boolean
  fillType?: 'color' | 'image' | 'grid' | 'checkerboard' | 'stripe'
}

/**
 * 立方体样式
 */
export interface BoxStyle extends Shape3DStyle {
  dimensionsX?: number
  dimensionsY?: number
  dimensionsZ?: number
}

/**
 * 圆柱体样式
 */
export interface CylinderStyle extends Shape3DStyle {
  radius?: number
  topRadius?: number
  bottomRadius?: number
  length?: number
}

/**
 * 椭球体样式
 */
export interface EllipsoidStyle extends Shape3DStyle {
  extentRadii?: number
  widthRadii?: number
  heightRadii?: number
}

/**
 * 平面样式
 */
export interface PlaneStyle extends Shape3DStyle {
  dimensionsX?: number
  dimensionsY?: number
  plane_normal?: 'x' | 'y' | 'z'
  plane_distance?: number
}

/**
 * 模型样式
 */
export interface ModelStyle extends BaseStyle {
  modelUrl?: string
  scale?: number
  heading?: number
  pitch?: number
  roll?: number
  fill?: boolean
  silhouette?: boolean
  silhouetteColor?: string
  silhouetteSize?: number
  silhouetteAlpha?: number
  label?: LabelStyle
}

/**
 * 管道体样式
 */
export interface PolylineVolumeStyle extends BaseStyle {
  radius?: number
  shape?: 'pipeline' | 'circle' | 'star'
}

/**
 * 曲线样式
 */
export interface CurveStyle extends PolylineStyle {
  closure?: boolean
}

// ============================================
// 绘制配置类型
// ============================================

/**
 * 绘制属性
 */
export interface DrawAttribute {
  type: DrawType
  style?: DrawStyle
  attr?: Record<string, unknown>
  config?: DrawConfig
  success?: (entity: Cesium.Entity) => void
  [key: string]: unknown
}

/**
 * 样式联合类型
 */
export type DrawStyle =
  | PointStyle
  | BillboardStyle
  | LabelStyle
  | PolylineStyle
  | PolygonStyle
  | CircleStyle
  | RectangleStyle
  | CorridorStyle
  | WallStyle
  | BoxStyle
  | CylinderStyle
  | EllipsoidStyle
  | PlaneStyle
  | ModelStyle
  | PolylineVolumeStyle
  | CurveStyle

/**
 * 绘制配置
 */
export interface DrawConfig {
  viewer: Cesium.Viewer
  dataSource?: Cesium.CustomDataSource
  primitives?: Cesium.PrimitiveCollection
  minPointNum?: number
  maxPointNum?: number
}

/**
 * 绘制选项
 */
export interface DrawOptions extends DrawAttribute {
  // 可以扩展更多选项
}

/**
 * 加载 JSON 选项
 */
export interface LoadJsonOptions {
  clear?: boolean
  flyTo?: boolean
  style?: DrawStyle
  onEachFeature?: (feature: GeoJSONFeature, type: string, index: number) => void
  onEachEntity?: (feature: GeoJSONFeature, entity: Cesium.Entity, index: number) => void
}

// ============================================
// GeoJSON 类型定义
// ============================================

/**
 * GeoJSON 几何类型
 */
export interface GeoJSONGeometry {
  type: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon'
  coordinates: number[] | number[][] | number[][][]
}

/**
 * GeoJSON Feature
 */
export interface GeoJSONFeature {
  type: 'Feature'
  geometry: GeoJSONGeometry
  properties?: {
    type?: string
    edittype?: string
    style?: DrawStyle
    attr?: Record<string, unknown>
    [key: string]: unknown
  }
}

/**
 * GeoJSON FeatureCollection
 */
export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

// ============================================
// 内部类型定义
// ============================================

/**
 * 绘制控制器接口
 */
export interface DrawController {
  type: string
  attrClass?: AttrClass
  editClass?: unknown
  activate: (attribute: DrawAttribute, callback: (entity: Cesium.Entity) => void) => Cesium.Entity
  disable: (isDelete?: boolean) => void
  endDraw?: () => void
  jsonToEntity?: (feature: GeoJSONFeature) => Cesium.Entity | null | undefined
  style2Entity?: (style: DrawStyle, entity: Cesium.Entity) => unknown
}

/**
 * 属性类接口
 */
export interface AttrClass {
  style2Entity: (style: DrawStyle, entityattr?: unknown) => unknown
  getPositions: (entity: Cesium.Entity) => Cesium.Cartesian3[]
  getCoordinates: (entity: Cesium.Entity) => number[][]
  toGeoJSON: (entity: Cesium.Entity, noClose?: boolean) => GeoJSONFeature
  getOutlinePositions?: (entity: Cesium.Entity, noAdd?: boolean) => Cesium.Cartesian3[] | null
  getEllipseOuterPositions?: (options: EllipseOptions) => Cesium.Cartesian3[]
}

/**
 * 椭圆选项
 */
export interface EllipseOptions {
  position: Cesium.Cartesian3
  semiMinorAxis: number
  semiMajorAxis: number
  rotation: number
  height: number
  [key: string]: unknown
}

/**
 * 实体扩展属性
 */
export interface EntityExtension {
  attribute?: DrawAttribute
  editing?: EditController
  _positions_draw?: Cesium.Cartesian3[]
  _positions_show?: Cesium.Cartesian3[]
  [key: string]: unknown
}

/**
 * 编辑控制器接口
 */
export interface EditController {
  activate: () => void
  disable: () => void
  updateAttrForEditing?: () => void
  updateDraggers?: () => void
  setPositions?: (positions: Cesium.Cartesian3[]) => void
}

/**
 * 提示框选项
 */
export interface TooltipOptions {
  offsetX?: number
  offsetY?: number
}

/**
 * 聚合样式配置
 */
export interface ClusterStyle {
  /** 聚合点颜色 */
  color?: string
  /** 聚合点大小 */
  pixelSize?: number
  /** 轮廓颜色 */
  outlineColor?: string
  /** 轮廓宽度 */
  outlineWidth?: number
  /** 字体样式 */
  font?: string
  /** 标签颜色 */
  labelColor?: string
  /** 标签轮廓颜色 */
  labelOutlineColor?: string
  /** 标签轮廓宽度 */
  labelOutlineWidth?: number
  [key: string]: unknown
}

/**
 * 聚合配置选项
 */
export interface ClusterOptions {
  /** 是否启用聚合 */
  enabled?: boolean
  /** 聚合像素范围 */
  pixelRange?: number
  /** 最小聚合数量 */
  minimumClusterSize?: number
  /** 是否显示标签 */
  showLabel?: boolean
  /** 聚合样式 */
  clusterStyle?: ClusterStyle
  /** 聚合事件回调 */
  clusterEvent?: (
    clusteredEntities: Cesium.Entity[],
    cluster: { billboard: Cesium.Billboard; label: Cesium.Label }
  ) => void
}

/**
 * Dragger 类型
 */
export enum DraggerType {
  Control = 1,
  MoveAll = 2,
  EditAttr = 3
}

/**
 * Dragger 选项
 */
export interface DraggerOptions {
  position: Cesium.Cartesian3
  type?: DraggerType
  tooltip?: string
  onDrag?: (dragger: Dragger, position: Cesium.Cartesian3) => void
  [key: string]: unknown
}

/**
 * Dragger 接口
 */
export interface Dragger {
  position: Cesium.Cartesian3
  type: DraggerType
  tooltip?: string
  entity?: Cesium.Entity
  destroy: () => void
  [key: string]: unknown
}

// ============================================
// Edit 编辑相关类型定义
// ============================================

/**
 * 拖拽点类型 (用于编辑)
 */
export enum PointType {
  /** 位置控制 */
  Control = 1,
  /** 整体平移(如线面) */
  MoveAll = 2,
  /** 辅助增加新点 */
  AddMidPoint = 3,
  /** 上下移动高度 */
  MoveHeight = 4,
  /** 辅助修改属性（如半径） */
  EditAttr = 5,
  /** 旋转角度修改 */
  EditRotation = 6
}

/**
 * 拖拽点颜色配置
 */
export const PointColor = {
  Control: Cesium.Color.fromCssColorString('#1c197d'),
  MoveAll: Cesium.Color.fromCssColorString('#8c003a'),
  MoveHeight: Cesium.Color.fromCssColorString('#9500eb'),
  EditAttr: Cesium.Color.fromCssColorString('#f531e8'),
  AddMidPoint: Cesium.Color.fromCssColorString('#04c2c9').withAlpha(0.3)
}

/**
 * 编辑点的像素大小
 */
export const PixelSize = 12

/**
 * 创建拖拽点选项 (用于编辑)
 */
export interface CreateDraggerOptions {
  /** 拖拽点类型 */
  type?: PointType
  /** 位置 */
  position?: Cesium.Cartesian3
  /** 提示信息 */
  tooltip?: string
  /** 已存在的拖拽点实体 */
  dragger?: Cesium.Entity
  /** 拖拽开始回调 */
  onDragStart?: (dragger: Cesium.Entity, position: Cesium.Cartesian3) => void
  /** 拖拽中回调 */
  onDrag?: (dragger: Cesium.Entity, position: Cesium.Cartesian3) => void
  /** 拖拽结束回调 */
  onDragEnd?: (dragger: Cesium.Entity, position: Cesium.Cartesian3) => void
}

/**
 * 扩展的 Entity 类型,包含拖拽相关属性 (用于编辑)
 */
export interface DraggerEntity extends Omit<Cesium.Entity, 'position'> {
  position?: Cesium.PositionProperty | Cesium.Cartesian3
  _isDragger: boolean
  _noMousePosition: boolean
  _pointType: PointType
  draw_tooltip?: string
  contextmenuItems?: boolean | unknown[]
  index?: number
  onDragStart?: ((dragger: Cesium.Entity, position: Cesium.Cartesian3) => void) | null
  onDrag?: ((dragger: Cesium.Entity, position: Cesium.Cartesian3) => void) | null
  onDragEnd?: ((dragger: Cesium.Entity, position: Cesium.Cartesian3) => void) | null
}

/**
 * 编辑用的扩展 Entity 类型 (用于 EditBase)
 */
export interface EditExtendedEntity extends Omit<Cesium.Entity, 'position'> {
  position?: Cesium.PositionProperty | Cesium.Cartesian3
  attribute?: Record<string, unknown>
  inProgress?: boolean
  _isDragger?: boolean
  _pointType?: PointType
  draw_tooltip?: string
  index?: number
  onDragStart?: (dragger: EditExtendedEntity, position: Cesium.Cartesian3) => void
  onDrag?: (dragger: EditExtendedEntity, position: Cesium.Cartesian3, oldPosition?: Cesium.Cartesian3) => void
  onDragEnd?: (dragger: EditExtendedEntity, position: Cesium.Cartesian3) => void
}

/**
 * 攻击箭头编辑的扩展 Entity 接口 (用于 EditAttackArrow)
 */
export interface AttackArrowEditEntity {
  _positions_draw?: Cesium.Cartesian3[]
  _positions_show?: Cesium.Cartesian3[]
  attribute?: Record<string, unknown>
}

/**
 * Billboard 编辑的扩展 Entity 接口 (用于 EditBillboard)
 */
export interface BillboardEditEntity {
  billboard?: Cesium.BillboardGraphics
  label?: Cesium.LabelGraphics
  attribute?: Record<string, unknown>
}

/**
 * Label 编辑的扩展 Entity 接口 (用于 EditLabel)
 */
export interface LabelEditEntity {
  label?: Cesium.LabelGraphics
  attribute?: Record<string, unknown>
}

/**
 * Model 编辑的扩展 Entity 接口 (用于 EditModel)
 */
export interface ModelEditEntity {
  model?: Cesium.ModelGraphics
  orientation?: Cesium.Property
  attribute?: {
    style?: {
      heading?: number
      pitch?: number
      roll?: number
      scale?: number
      [key: string]: unknown
    }
    [key: string]: unknown
  }
}

/**
 * 攻击箭头PW编辑的扩展 Entity 接口 (用于 EditAttackArrowPW)
 */
export interface AttackArrowPWEditEntity {
  _positions_draw?: Cesium.Cartesian3[]
  _positions_show?: Cesium.Cartesian3[]
  attribute?: Record<string, unknown>
}

/**
 * 攻击箭头YW编辑的扩展 Entity 接口 (用于 EditAttackArrowYW)
 */
export interface AttackArrowYWEditEntity {
  _positions_draw?: Cesium.Cartesian3[]
  _positions_show?: Cesium.Cartesian3[]
  attribute?: Record<string, unknown>
}

/**
 * 扩展的 ScreenSpaceEventHandler 类型 (用于 EditBase)
 */
export interface ExtendedScreenSpaceEventHandler extends Cesium.ScreenSpaceEventHandler {
  dragger?: EditExtendedEntity | null
}

/**
 * Box 编辑样式接口 (用于 EditBox)
 */
export interface BoxEditStyle {
  dimensionsX?: number
  dimensionsY?: number
  dimensionsZ?: number
  [key: string]: unknown
}

/**
 * Box 编辑的扩展 Entity 接口 (用于 EditBox)
 */
export interface BoxEditEntity {
  _positions_draw?: Cesium.Cartesian3
  attribute?: {
    style: BoxEditStyle
    [key: string]: unknown
  }
  box?: Cesium.BoxGraphics & {
    dimensions: Cesium.ConstantProperty
  }
}

/**
 * Circle 编辑的扩展 Entity 接口 (用于 EditCircle)
 */
export interface CircleEditEntity {
  _positions_draw?: Cesium.Cartesian3[]
  attribute?: {
    style?: {
      clampToGround?: boolean
      height?: number
      extrudedHeight?: number
      radius?: number
      semiMajorAxis?: number
      semiMinorAxis?: number
      rotation?: number
      [key: string]: unknown
    }
    [key: string]: unknown
  }
  ellipse?: Cesium.EllipseGraphics & {
    height?: Cesium.Property
    extrudedHeight?: Cesium.Property
    semiMajorAxis?: Cesium.Property
    semiMinorAxis?: Cesium.Property
  }
}

/**
 * Circle 编辑拖拽点接口 (用于 EditCircle)
 */
export interface CircleDragger extends DraggerEntity {
  index?: number
  majorDragger?: DraggerEntity
  minorDragger?: DraggerEntity
}

/**
 * CloseCurve 编辑的扩展 Entity 接口 (用于 EditCloseCurve)
 */
export interface CloseCurveEditEntity {
  _positions_draw?: Cesium.Cartesian3[]
  _positions_show?: Cesium.Cartesian3[]
  attribute?: Record<string, unknown>
}

/**
 * Corridor 编辑的扩展 Entity 接口 (用于 EditCorridor)
 */
export interface CorridorEditEntity {
  _positions_draw?: Cesium.Cartesian3[]
  attribute?: {
    type?: string
    [key: string]: unknown
  }
  corridor?: Cesium.CorridorGraphics & {
    positions?: Cesium.Property
    height?: Cesium.Property
  }
}

/**
 * Curve 编辑的扩展 Entity 接口 (用于 EditCurve)
 */
export interface CurveEditEntity {
  _positions_draw?: Cesium.Cartesian3[]
  _positions_show?: Cesium.Cartesian3[]
  attribute?: {
    type?: string
    style?: {
      closure?: boolean
      [key: string]: unknown
    }
    [key: string]: unknown
  }
  polyline?: Cesium.PolylineGraphics & {
    positions?: Cesium.Property
  }
}

/**
 * Cylinder 编辑样式接口 (用于 EditCylinder)
 */
export interface CylinderEditStyle {
  topRadius?: number
  bottomRadius?: number
  length?: number
  rotation?: number
  [key: string]: unknown
}

/**
 * Cylinder 编辑的扩展 Entity 接口 (用于 EditCylinder)
 */
export interface CylinderEditEntity {
  _positions_draw?: Cesium.Cartesian3[]
  attribute?: {
    style: CylinderEditStyle
    [key: string]: unknown
  }
  cylinder?: Cesium.CylinderGraphics & {
    topRadius?: Cesium.Property
    bottomRadius?: Cesium.Property
    length?: Cesium.Property
  }
}

/**
 * DoubleArrow 编辑的扩展 Entity 接口 (用于 EditDoubleArrow)
 */
export interface DoubleArrowEditEntity {
  _positions_draw?: Cesium.Cartesian3[]
  _positions_show?: Cesium.Cartesian3[]
  attribute?: Record<string, unknown>
}

/**
 * Ellipsoid 编辑样式接口 (用于 EditEllipsoid)
 */
export interface EllipsoidEditStyle {
  extentRadii?: number
  widthRadii?: number
  heightRadii?: number
  rotation?: number
  [key: string]: unknown
}

/**
 * Ellipsoid 编辑的扩展 Entity 接口 (用于 EditEllipsoid)
 */
export interface EllipsoidEditEntity {
  _positions_draw?: Cesium.Cartesian3[]
  position?: Cesium.PositionProperty | Cesium.Cartesian3
  attribute?: {
    style: EllipsoidEditStyle
    [key: string]: unknown
  }
  ellipsoid?: Cesium.EllipsoidGraphics & {
    radii?: Cesium.ConstantProperty
  }
}

/**
 * Ellipsoid 编辑拖拽点接口 (用于 EditEllipsoid)
 */
export interface EllipsoidDragger extends DraggerEntity {
  majorDragger?: DraggerEntity
  minorDragger?: DraggerEntity
}

/**
 * FineArrow 编辑的扩展 Entity 接口 (用于 EditFineArrow)
 */
export interface FineArrowEditEntity {
  _positions_draw?: Cesium.Cartesian3[]
  _positions_show?: Cesium.Cartesian3[]
  attribute?: Record<string, unknown>
}

/**
 * FineArrowYW 编辑的扩展 Entity 接口 (用于 EditFineArrowYW)
 */
export interface FineArrowYWEditEntity {
  _positions_draw?: Cesium.Cartesian3[]
  _positions_show?: Cesium.Cartesian3[]
  attribute?: Record<string, unknown>
}

/**
 * GatheringPlace 编辑的扩展 Entity 接口 (用于 EditGatheringPlace)
 */
export interface GatheringPlaceEditEntity {
  _positions_draw?: Cesium.Cartesian3[]
  _positions_show?: Cesium.Cartesian3[]
  attribute?: Record<string, unknown>
}

/**
 * IsoscelesTriangle 编辑的扩展 Entity 接口 (用于 EditIsoscelesTriangle)
 */
export interface IsoscelesTriangleEditEntity {
  _positions_draw?: Cesium.Cartesian3[]
  _positions_show?: Cesium.Cartesian3[]
  attribute?: Record<string, unknown>
}

/**
 * Lune 编辑的扩展 Entity 接口 (用于 EditLune)
 */
export interface LuneEditEntity {
  _positions_draw?: Cesium.Cartesian3[]
  _positions_show?: Cesium.Cartesian3[]
  attribute?: Record<string, unknown>
}

/**
 * Plane 编辑样式接口 (用于 EditPlane)
 */
export interface PlaneEditStyle {
  dimensionsX?: number
  dimensionsY?: number
  plane_normal?: string
  plane_distance?: number
  [key: string]: unknown
}

/**
 * Plane 编辑的扩展 Entity 接口 (用于 EditPlane)
 */
export interface PlaneEditEntity {
  _positions_draw?: Cesium.Cartesian3
  attribute?: {
    style: PlaneEditStyle
    [key: string]: unknown
  }
  plane?: Cesium.PlaneGraphics & {
    dimensions?: Cesium.ConstantProperty
  }
}

/**
 * PModel 编辑样式接口 (用于 EditPModel)
 */
export interface PModelEditStyle {
  heading?: number
  pitch?: number
  roll?: number
  scale?: number
  [key: string]: unknown
}

/**
 * PModel 编辑的扩展 Entity 接口 (用于 EditPModel)
 */
export interface PModelEditEntity {
  modelMatrix?: Cesium.Matrix4
  scale?: number
  ready?: boolean
  readyPromise?: Promise<unknown>
  boundingSphere?: Cesium.BoundingSphere
  attribute?: {
    style: PModelEditStyle
    [key: string]: unknown
  }
}

/**
 * PModel 缩放拖拽点接口 (用于 EditPModel)
 */
export interface ScaleDragger extends DraggerEntity {
  radius?: number
}

/**
 * Polygon 编辑的扩展 Entity 接口 (用于 EditPolygon)
 */
export interface PolygonEditEntity {
  _positions_draw?: Cesium.Cartesian3[]
  attribute?: {
    type?: string
    [key: string]: unknown
  }
  polygon?: Cesium.PolygonGraphics & {
    hierarchy?: Cesium.Property | Cesium.PolygonHierarchy
  }
}

/**
 * PolygonEx 编辑的扩展 Entity 接口 (用于 EditPolygonEx)
 */
export interface PolygonExEditEntity {
  _positions_draw?: Cesium.Cartesian3[]
  _positions_show?: Cesium.Cartesian3[]
  attribute?: Record<string, unknown>
}

/**
 * Polyline 编辑的扩展 Entity 接口 (用于 EditPolyline)
 */
export interface PolylineEditEntity {
  _positions_draw?: Cesium.Cartesian3[]
  attribute?: {
    type?: string
    style?: {
      clampToGround?: boolean
      [key: string]: unknown
    }
    [key: string]: unknown
  }
  polyline?: Cesium.PolylineGraphics
}

/**
 * PolylineVolume 编辑的扩展 Entity 接口 (用于 EditPolylineVolume)
 */
export interface PolylineVolumeEditEntity {
  _positions_draw?: Cesium.Cartesian3[]
  polylineVolume?: Cesium.PolylineVolumeGraphics
}

/**
 * PolylineVolume 扩展的 Entity 接口，包含 PolylineVolume 特有属性
 * @deprecated 使用 PolylineVolumeEditEntity 代替
 */
export interface PolylineVolumeEntity {
  _positions_draw?: Cesium.Cartesian3[]
  polylineVolume?: Cesium.PolylineVolumeGraphics
}

/**
 * Rectangle 编辑的扩展 Entity 接口 (用于 EditRectangle)
 */
export interface RectangleEditEntity {
  _positions_draw?: Cesium.Cartesian3[]
  rectangle?: Cesium.RectangleGraphics
  attribute?: {
    style?: {
      clampToGround?: boolean
      [key: string]: unknown
    }
    [key: string]: unknown
  }
}

/**
 * Regular 编辑的扩展 Entity 接口 (用于 EditRegular)
 */
export interface RegularEditEntity {
  _positions_draw?: Cesium.Cartesian3[]
  _positions_show?: Cesium.Cartesian3[]
  attribute?: Record<string, unknown>
}

/**
 * Sector 编辑的扩展 Entity 接口 (用于 EditSector)
 */
export interface SectorEditEntity {
  _positions_draw?: Cesium.Cartesian3[]
  _positions_show?: Cesium.Cartesian3[]
  attribute?: Record<string, unknown>
}

/**
 * VideoFusion 编辑点Entity接口 (用于 EditVideoFusion)
 */
export interface VideoEditPointEntity extends Cesium.Entity {
  _editIndex?: number
  _editType?: VideoEditPointType
}

/**
 * VideoFusion Primitive 接口 (用于 EditVideoFusion)
 */
export interface VideoFusionEditPrimitive {
  _positions_draw?: Cesium.Cartesian3[]
  _videoAttribute?: {
    style?: Record<string, unknown>
    config?: {
      editable?: boolean
      controlPointSize?: number
      controlPointColor?: string
    }
  }
  show?: boolean
}

/**
 * Wall 编辑的扩展 Entity 接口 (用于 EditWall)
 */
export interface WallEditEntity {
  wall?: Cesium.WallGraphics
}

/**
 * Water Primitive 接口 (用于 EditWater)
 */
export interface WaterEditPrimitive {
  _positions_draw?: Cesium.Cartesian3[]
  _waterAttribute?: {
    style?: Record<string, unknown>
    config?: Record<string, unknown>
  }
  show?: boolean
}

/**
 * Water 编辑的扩展 Entity 接口 (用于 EditWater)
 */
export interface WaterEditEntity extends EditExtendedEntity {
  _bindedPrimitive?: WaterEditPrimitive
}

/**
 * River Primitive 接口 (用于 EditRiver)
 */
export interface RiverEditPrimitive extends WaterEditPrimitive {
  _riverAttribute?: RiverPrimitiveAttribute
}

/**
 * Flood Primitive 接口 (用于 EditFlood)
 */
export interface FloodEditPrimitive extends WaterEditPrimitive {
  _floodAttribute?: FloodPrimitiveAttribute
}

// ============================================
// Entity 绘制类型扩展 (Draw* 类使用)
// ============================================

/**
 * Billboard 样式配置接口
 */
export interface BillboardStyleConfig {
  opacity?: number
  rotation?: number
  scaleByDistance?: boolean
  scaleByDistance_near?: number
  scaleByDistance_nearValue?: number
  scaleByDistance_far?: number
  scaleByDistance_farValue?: number
  distanceDisplayCondition?: boolean
  distanceDisplayCondition_near?: number
  distanceDisplayCondition_far?: number
  clampToGround?: boolean
  heightReference?: string | Cesium.HeightReference
  horizontalOrigin?: string | Cesium.HorizontalOrigin
  verticalOrigin?: string | Cesium.VerticalOrigin
  visibleDepth?: boolean
  [key: string]: unknown
}

/**
 * Billboard 属性接口 (用于 DrawBillboard)
 */
export interface BillboardDrawAttribute {
  style: BillboardStyleConfig & {
    label?: Record<string, unknown>
  }
  [key: string]: unknown
}

/**
 * Billboard 扩展的 Entity 接口
 */
export interface BillboardExtendedEntity {
  billboard?: Cesium.BillboardGraphics
  label?: Cesium.LabelGraphics
  attribute?: BillboardDrawAttribute
  editing?: unknown
  show?: boolean
  position?: Cesium.PositionProperty | Cesium.Cartesian3 | null
}

/**
 * Box 样式配置接口
 */
export interface BoxStyleConfig {
  opacity?: number
  outlineOpacity?: number
  outlineColor?: string
  color?: string
  dimensionsX?: number
  dimensionsY?: number
  dimensionsZ?: number
  distanceDisplayCondition?: boolean
  distanceDisplayCondition_near?: number
  distanceDisplayCondition_far?: number
  clampToGround?: boolean
  heightReference?: string | Cesium.HeightReference
  [key: string]: unknown
}

/**
 * Box 属性接口 (用于 DrawBox)
 */
export interface BoxDrawAttribute {
  style: BoxStyleConfig
  [key: string]: unknown
}

/**
 * Box 扩展的 Entity 接口
 */
export interface BoxExtendedEntity {
  box?: Cesium.BoxGraphics
  _positions_draw?: Cesium.Cartesian3 | Cesium.Cartesian3[] | null
  attribute?: BoxDrawAttribute
  editing?: unknown
  position?: Cesium.PositionProperty | Cesium.Cartesian3
}

/**
 * Circle 样式配置接口 (用于 DrawCircle)
 */
export interface CircleStyleConfig {
  clampToGround?: boolean
  height?: number
  extrudedHeight?: number
  radius?: number
  semiMinorAxis?: number
  semiMajorAxis?: number
  rotation?: number
  [key: string]: unknown
}

/**
 * Circle 属性接口 (用于 DrawCircle)
 */
export interface CircleDrawAttribute {
  type?: string
  style: CircleStyleConfig
  [key: string]: unknown
}

/**
 * Circle 扩展的 Entity 接口
 */
export interface CircleExtendedEntity extends Omit<Cesium.Entity, 'ellipse' | 'polyline'> {
  ellipse?: Cesium.EllipseGraphics
  polyline?: Cesium.PolylineGraphics
  attribute?: CircleDrawAttribute
  editing?: EditController | unknown
  _positions_draw?: Cesium.Cartesian3[]
}

/**
 * Corridor 样式配置接口 (用于 DrawCorridor)
 */
export interface CorridorStyleConfig {
  clampToGround?: boolean
  height?: number
  extrudedHeight?: number
  [key: string]: unknown
}

/**
 * Corridor 配置接口 (用于 DrawCorridor)
 */
export interface CorridorConfig {
  minPointNum?: number
  maxPointNum?: number
  [key: string]: unknown
}

/**
 * Corridor 属性接口 (用于 DrawCorridor)
 */
export interface CorridorDrawAttribute {
  style: CorridorStyleConfig
  config?: CorridorConfig
  [key: string]: unknown
}

/**
 * Corridor 扩展的 Entity 接口
 */
export interface CorridorExtendedEntity extends Omit<Cesium.Entity, 'corridor'> {
  corridor?: Cesium.CorridorGraphics
  attribute?: CorridorDrawAttribute
  editing?: EditController | unknown
  _positions_draw?: Cesium.Cartesian3[]
}

/**
 * Curve 样式配置接口 (用于 DrawCurve)
 */
export interface CurveStyleConfig {
  closure?: boolean
  [key: string]: unknown
}

/**
 * Curve 属性接口 (用于 DrawCurve)
 */
export interface CurveDrawAttribute {
  style?: CurveStyleConfig
  [key: string]: unknown
}

/**
 * Curve 扩展的 Entity 接口
 */
export interface CurveExtendedEntity extends Omit<Cesium.Entity, 'polyline'> {
  polyline?: Cesium.PolylineGraphics
  attribute?: CurveDrawAttribute
  editing?: EditController | unknown
  _positions_draw?: Cesium.Cartesian3[]
  _positions_show?: Cesium.Cartesian3[] | null
}

/**
 * Cylinder 样式配置接口 (用于 DrawCylinder)
 */
export interface CylinderStyleConfig {
  topRadius?: number
  bottomRadius?: number
  length?: number
  [key: string]: unknown
}

/**
 * Cylinder 属性接口 (用于 DrawCylinder)
 */
export interface CylinderDrawAttribute {
  style: CylinderStyleConfig
  [key: string]: unknown
}

/**
 * Cylinder 扩展的 Entity 接口
 */
export interface CylinderExtendedEntity extends Omit<Cesium.Entity, 'cylinder'> {
  cylinder?: Cesium.CylinderGraphics
  attribute?: CylinderDrawAttribute
  editing?: EditController | unknown
  _positions_draw?: Cesium.Cartesian3[]
}

/**
 * Ellipsoid 样式配置接口 (用于 DrawEllipsoid)
 */
export interface EllipsoidStyleConfig {
  extentRadii?: number
  widthRadii?: number
  heightRadii?: number
  rotation?: number
  [key: string]: unknown
}

/**
 * Ellipsoid 属性接口 (用于 DrawEllipsoid)
 */
export interface EllipsoidDrawAttribute {
  style?: EllipsoidStyleConfig
  [key: string]: unknown
}

/**
 * Ellipsoid 扩展的 Entity 接口
 */
export interface EllipsoidExtendedEntity extends Omit<Cesium.Entity, 'ellipsoid'> {
  ellipsoid?: Cesium.EllipsoidGraphics
  attribute?: EllipsoidDrawAttribute
  editing?: unknown
  _positions_draw?: Cesium.Cartesian3 | Cesium.Cartesian3[] | null
}

/**
 * Label 样式配置接口 (用于 DrawLabel)
 */
export interface LabelStyleConfig {
  font_style?: string
  font_weight?: string
  font_size?: number | string
  font_family?: string
  scaleByDistance_near?: number
  scaleByDistance_nearValue?: number
  scaleByDistance_far?: number
  scaleByDistance_farValue?: number
  distanceDisplayCondition_far?: number
  distanceDisplayCondition_near?: number
  background_opacity?: number
  pixelOffsetY?: number
  text?: string
  color?: string
  opacity?: number
  border?: boolean
  border_color?: string
  border_width?: number
  background?: boolean
  background_color?: string
  pixelOffset?: number[]
  pixelOffsetX?: number
  hasPixelOffset?: boolean
  scaleByDistance?: boolean
  distanceDisplayCondition?: boolean
  clampToGround?: boolean
  heightReference?: string | Cesium.HeightReference
  visibleDepth?: boolean
  [key: string]: unknown
}

/**
 * Label 属性接口 (用于 DrawLabel)
 */
export interface LabelDrawAttribute {
  style: LabelStyleConfig
  [key: string]: unknown
}

/**
 * Label 扩展的 Entity 接口
 */
export interface LabelExtendedEntity {
  label?: Cesium.LabelGraphics
  attribute?: LabelDrawAttribute
  show?: boolean
}

/**
 * Model 样式配置接口 (用于 DrawModel)
 */
export interface ModelStyleConfig {
  label?: Record<string, unknown>
  heading?: number
  pitch?: number
  roll?: number
  [key: string]: unknown
}

/**
 * Model 属性接口 (用于 DrawModel)
 */
export interface ModelDrawAttribute {
  style?: ModelStyleConfig
  [key: string]: unknown
}

/**
 * Model 扩展的 Entity 接口
 */
export interface ModelExtendedEntity extends Omit<Cesium.Entity, 'model'> {
  model?: Cesium.ModelGraphics
  attribute?: ModelDrawAttribute
  editing?: unknown
}

/**
 * Plane 样式配置接口 (用于 DrawPlane)
 */
export interface PlaneStyleConfig {
  [key: string]: unknown
}

/**
 * Plane 属性接口 (用于 DrawPlane)
 */
export interface PlaneDrawAttribute {
  style?: PlaneStyleConfig
  [key: string]: unknown
}

/**
 * Plane 扩展的 Entity 接口
 */
export interface PlaneExtendedEntity extends Omit<Cesium.Entity, 'plane'> {
  plane?: Cesium.PlaneGraphics
  attribute?: PlaneDrawAttribute
  editing?: unknown
  _positions_draw?: Cesium.Cartesian3 | Cesium.Cartesian3[] | null
}

/**
 * Point 样式配置接口 (用于 DrawPoint)
 */
export interface PointStyleConfig {
  label?: Record<string, unknown>
  [key: string]: unknown
}

/**
 * Point 属性接口 (用于 DrawPoint)
 */
export interface PointDrawAttribute {
  style?: PointStyleConfig
  [key: string]: unknown
}

/**
 * Point 扩展的 Entity 接口
 */
export interface PointExtendedEntity extends Omit<Cesium.Entity, 'point'> {
  point?: Cesium.PointGraphics
  attribute?: PointDrawAttribute
  editing?: unknown
}

/**
 * Polyline 样式配置接口 (用于 DrawPolyline)
 */
export interface PolylineStyleConfig {
  [key: string]: unknown
}

/**
 * Polyline 配置接口 (用于 DrawPolyline)
 */
export interface PolylineConfig {
  minPointNum?: number
  maxPointNum?: number
  addHeight?: number
}

/**
 * Polyline 属性接口 (用于 DrawPolyline)
 */
export interface PolylineDrawAttribute {
  style?: PolylineStyleConfig
  config?: PolylineConfig
  [key: string]: unknown
}

/**
 * Polyline 扩展的 Entity 接口
 */
export interface PolylineExtendedEntity extends Omit<Cesium.Entity, 'polyline'> {
  polyline?: Cesium.PolylineGraphics
  attribute?: PolylineDrawAttribute
  editing?: unknown
  _positions_draw?: Cesium.Cartesian3[]
}

/**
 * Polygon 样式配置接口 (用于 DrawPolygon)
 */
export interface PolygonStyleConfig {
  clampToGround?: boolean
  extrudedHeight?: number | Cesium.Property
  outline?: boolean
  outlineWidth?: number
  outlineColor?: string
  color?: string
  opacity?: number
  outlineOpacity?: number
  fillType?: 'color' | 'image' | 'grid' | 'checkerboard' | 'stripe' | 'animationLine' | 'animationCircle'
  material?: Cesium.MaterialProperty | Cesium.Color
  // Grid 相关属性
  grid_lineCount?: number
  grid_lineThickness?: number
  grid_cellAlpha?: number
  // Checkerboard 相关属性
  checkerboard_repeat?: number
  checkerboard_oddcolor?: string
  // Stripe 相关属性
  stripe_oddcolor?: string
  stripe_repeat?: number
  // Animation 相关属性
  animationDuration?: number
  animationImage?: string
  animationRepeatX?: number
  animationRepeatY?: number
  animationAxisY?: boolean
  animationGradient?: number
  animationCount?: number
  // 其他属性
  randomColor?: boolean
  image?: string
  bgUrl?: string
  bgColor?: string
  minimumRed?: number
  maximumRed?: number
  minimumGreen?: number
  maximumGreen?: number
  minimumBlue?: number
  maximumBlue?: number
  stRotation?: number
  readonly [key: string]: unknown
}

/**
 * Polygon 配置接口 (用于 DrawPolygon)
 */
export interface PolygonConfig {
  minPointNum?: number
  maxPointNum?: number
  addHeight?: number
}

/**
 * Polygon 属性接口 (用于 DrawPolygon)
 */
export interface PolygonDrawAttribute {
  style: PolygonStyleConfig
  config?: PolygonConfig
  readonly [key: string]: unknown
}

/**
 * Polygon 扩展的 Entity 接口
 */
export interface PolygonExtendedEntity extends Omit<Cesium.Entity, 'polygon'> {
  polygon?: Cesium.PolygonGraphics
  attribute?: PolygonDrawAttribute
  editing?: EditController | unknown
  _positions_draw?: Cesium.Cartesian3[]
}

/**
 * Polygon Ex 扩展的 Entity 接口
 * 用于 DrawPolygonEx，支持绘制点与显示点分离
 */
export interface PolygonExExtendedEntity extends Omit<Cesium.Entity, 'polygon'> {
  polygon?: Cesium.PolygonGraphics
  attribute?: Record<string, unknown>
  editing?: unknown
  _positions_draw?: Cesium.Cartesian3[]
  _positions_show?: Cesium.Cartesian3[] | null
}

/**
 * PolylineVolume 配置接口 (用于 DrawPolylineVolume)
 */
export interface PolylineVolumeConfig {
  minPointNum?: number
  maxPointNum?: number
}

/**
 * PolylineVolume 属性接口 (用于 DrawPolylineVolume)
 */
export interface PolylineVolumeDrawAttribute {
  style?: Record<string, unknown>
  config?: PolylineVolumeConfig
  [key: string]: unknown
}

/**
 * PolylineVolume 扩展的 Entity 接口
 */
export interface PolylineVolumeExtendedEntity extends Omit<Cesium.Entity, 'polylineVolume'> {
  polylineVolume?: Cesium.PolylineVolumeGraphics
  attribute?: PolylineVolumeDrawAttribute
  editing?: unknown
  _positions_draw?: Cesium.Cartesian3[]
}

/**
 * Rectangle 样式配置接口 (用于 DrawRectangle)
 */
export interface RectangleStyleConfig {
  clampToGround?: boolean
  height?: number
  extrudedHeight?: number | string
  [key: string]: unknown
}

/**
 * Rectangle 属性接口 (用于 DrawRectangle)
 */
export interface RectangleDrawAttribute {
  style?: RectangleStyleConfig
  [key: string]: unknown
}

/**
 * Rectangle 扩展的 Entity 接口
 */
export interface RectangleExtendedEntity extends Omit<Cesium.Entity, 'rectangle' | 'polyline'> {
  rectangle?: Cesium.RectangleGraphics
  polyline?: Cesium.PolylineGraphics
  attribute?: RectangleDrawAttribute
  editing?: EditController | unknown
  _draw_positions?: Cesium.Cartesian3[]
}

/**
 * Wall 样式配置接口 (用于 DrawWall)
 */
export interface WallStyleConfig {
  extrudedHeight?: number
  [key: string]: unknown
}

/**
 * Wall 配置接口 (用于 DrawWall)
 */
export interface WallConfig {
  minPointNum?: number
  maxPointNum?: number
}

/**
 * Wall 属性接口 (用于 DrawWall)
 */
export interface WallDrawAttribute {
  style?: WallStyleConfig
  config?: WallConfig
  [key: string]: unknown
}

/**
 * Wall 扩展的 Entity 接口
 */
export interface WallExtendedEntity extends Omit<Cesium.Entity, 'wall'> {
  wall?: Cesium.WallGraphics
  attribute?: WallDrawAttribute
  editing?: EditController | unknown
  _positions_draw?: Cesium.Cartesian3[]
  _minimumHeights?: number[]
  _maximumHeights?: number[]
}

// ============================================
// Primitive 绘制类型定义
// ============================================

/**
 * Primitive 绘制配置 (用于 DrawPrimitiveBase)
 */
export interface DrawPrimitiveConfig {
  viewer: Cesium.Viewer
  dataSource?: Cesium.CustomDataSource
  primitives: Cesium.PrimitiveCollection
}

/**
 * Primitive 对象基础接口
 */
export interface PrimitiveObject {
  _positions_draw?: Cesium.Cartesian3 | Cesium.Cartesian3[] | null
  attribute?: Record<string, unknown>
  editing?: unknown
  inProgress?: boolean
}

/**
 * Billboard Primitive 样式接口 (用于 DrawPBillboard)
 */
export interface BillboardPrimitiveStyle {
  image?: string
  scale?: number
  pixelOffset?: Cesium.Cartesian2
  eyeOffset?: Cesium.Cartesian3
  horizontalOrigin?: Cesium.HorizontalOrigin
  verticalOrigin?: Cesium.VerticalOrigin
  color?: string | Cesium.Color
  rotation?: number
  alignedAxis?: Cesium.Cartesian3
  width?: number
  height?: number
  show?: boolean
  disableDepthTestDistance?: number
  [key: string]: unknown
}

/**
 * Billboard Primitive 属性接口 (用于 DrawPBillboard)
 */
export interface BillboardPrimitiveAttribute {
  style: BillboardPrimitiveStyle
  [key: string]: unknown
}

/**
 * 扩展的 Billboard Primitive 接口 (用于 DrawPBillboard)
 */
export interface ExtendedBillboard extends Cesium.Billboard {
  _positions_draw?: Cesium.Cartesian3 | Cesium.Cartesian3[] | null
  attribute?: BillboardPrimitiveAttribute
  editing?: unknown
  inProgress?: boolean
}

/**
 * Box Primitive 样式接口 (用于 DrawPBox)
 */
export interface BoxPrimitiveStyle {
  dimensions?: Cesium.Cartesian3
  color?: string | Cesium.Color
  show?: boolean
  [key: string]: unknown
}

/**
 * Box Primitive 属性接口 (用于 DrawPBox)
 */
export interface BoxPrimitiveAttribute {
  style: BoxPrimitiveStyle
  [key: string]: unknown
}

/**
 * Circle Primitive 样式接口 (用于 DrawPCircle)
 */
export interface CirclePrimitiveStyle {
  color?: string | Cesium.Color
  show?: boolean
  classificationType?: Cesium.ClassificationType
  [key: string]: unknown
}

/**
 * Circle Primitive 配置接口 (用于 DrawPCircle)
 */
export interface CirclePrimitiveConfig {
  /** 圆形细分粒度，默认 64 */
  granularity?: number
}

/**
 * Circle Primitive 属性接口 (用于 DrawPCircle)
 */
export interface CirclePrimitiveAttribute {
  style: CirclePrimitiveStyle
  config?: CirclePrimitiveConfig
  [key: string]: unknown
}

/**
 * Corridor Primitive 样式接口 (用于 DrawPCorridor)
 */
export interface CorridorPrimitiveStyle {
  color?: string | Cesium.Color
  width?: number
  show?: boolean
  [key: string]: unknown
}

/**
 * Corridor Primitive 配置接口 (用于 DrawPCorridor)
 */
export interface CorridorPrimitiveConfig {
  minPointNum?: number
  maxPointNum?: number
  [key: string]: unknown
}

/**
 * Corridor Primitive 属性接口 (用于 DrawPCorridor)
 */
export interface CorridorPrimitiveAttribute {
  style: CorridorPrimitiveStyle
  config?: CorridorPrimitiveConfig
  [key: string]: unknown
}

/**
 * Curve Primitive 样式接口 (用于 DrawPCurve)
 */
export interface CurvePrimitiveStyle {
  width?: number
  color?: string | Cesium.Color
  show?: boolean
  closure?: boolean
  [key: string]: unknown
}

/**
 * Curve Primitive 配置接口 (用于 DrawPCurve)
 */
export interface CurvePrimitiveConfig {
  minPointNum?: number
  maxPointNum?: number
  [key: string]: unknown
}

/**
 * Curve Primitive 属性接口 (用于 DrawPCurve)
 */
export interface CurvePrimitiveAttribute {
  style: CurvePrimitiveStyle
  config?: CurvePrimitiveConfig
  [key: string]: unknown
}

/**
 * Cylinder Primitive 样式接口 (用于 DrawPCylinder)
 */
export interface CylinderPrimitiveStyle {
  length?: number
  topRadius?: number
  bottomRadius?: number
  color?: string | Cesium.Color
  show?: boolean
  [key: string]: unknown
}

/**
 * Cylinder Primitive 属性接口 (用于 DrawPCylinder)
 */
export interface CylinderPrimitiveAttribute {
  style: CylinderPrimitiveStyle
  [key: string]: unknown
}

/**
 * Ellipsoid Primitive 样式接口 (用于 DrawPEllipsoid)
 */
export interface EllipsoidPrimitiveStyle {
  radii?: Cesium.Cartesian3
  color?: string | Cesium.Color
  show?: boolean
  [key: string]: unknown
}

/**
 * Ellipsoid Primitive 属性接口 (用于 DrawPEllipsoid)
 */
export interface EllipsoidPrimitiveAttribute {
  style: EllipsoidPrimitiveStyle
  [key: string]: unknown
}

/**
 * Label Primitive 样式接口 (用于 DrawPLabel)
 */
export interface LabelPrimitiveStyle {
  text?: string
  font?: string
  fillColor?: string | Cesium.Color
  outlineColor?: string | Cesium.Color
  outlineWidth?: number
  style?: Cesium.LabelStyle
  pixelOffset?: Cesium.Cartesian2
  eyeOffset?: Cesium.Cartesian3
  horizontalOrigin?: Cesium.HorizontalOrigin
  verticalOrigin?: Cesium.VerticalOrigin
  scale?: number
  show?: boolean
  disableDepthTestDistance?: number
  backgroundColor?: string | Cesium.Color
  backgroundPadding?: Cesium.Cartesian2
  showBackground?: boolean
  [key: string]: unknown
}

/**
 * Label Primitive 属性接口 (用于 DrawPLabel)
 */
export interface LabelPrimitiveAttribute {
  style: LabelPrimitiveStyle
  [key: string]: unknown
}

/**
 * 扩展的 Label Primitive 接口 (用于 DrawPLabel)
 */
export interface ExtendedLabel extends Cesium.Label {
  _positions_draw?: Cesium.Cartesian3 | Cesium.Cartesian3[] | null
  attribute?: LabelPrimitiveAttribute
  editing?: unknown
  inProgress?: boolean
}

/**
 * Model Primitive 配置接口 (用于 DrawPModel)
 */
export interface ModelPrimitiveConfig {
  modelUrl?: string
  heading?: number
  pitch?: number
  roll?: number
  scale?: number
  minimumPixelSize?: number
}

/**
 * Model Primitive 样式接口 (用于 DrawPModel)
 */
export interface ModelPrimitiveStyle extends ModelPrimitiveConfig {
  [key: string]: unknown
}

/**
 * Model Primitive 属性接口 (用于 DrawPModel)
 */
export interface ModelPrimitiveAttribute {
  style: ModelPrimitiveStyle
  [key: string]: unknown
}

/**
 * 扩展的 Model Primitive 类型 (用于 DrawPModel)
 */
export type ExtendedModelPrimitive = Cesium.Model & {
  _positions_draw?: Cesium.Cartesian3 | Cesium.Cartesian3[] | null
  attribute?: ModelPrimitiveAttribute
  editing?: unknown
  inProgress?: boolean
  position?: Cesium.Cartesian3
}

/**
 * Plane Primitive 样式接口 (用于 DrawPPlane)
 */
export interface PlanePrimitiveStyle {
  dimensions?: Cesium.Cartesian2
  color?: string | Cesium.Color
  show?: boolean
  [key: string]: unknown
}

/**
 * Plane Primitive 属性接口 (用于 DrawPPlane)
 */
export interface PlanePrimitiveAttribute {
  style: PlanePrimitiveStyle
  [key: string]: unknown
}

/**
 * Point Primitive 样式接口 (用于 DrawPPoint)
 */
export interface PointPrimitiveStyle {
  pixelSize?: number
  color?: string | Cesium.Color
  outlineColor?: string | Cesium.Color
  outlineWidth?: number
  show?: boolean
  disableDepthTestDistance?: number
  [key: string]: unknown
}

/**
 * Point Primitive 属性接口 (用于 DrawPPoint)
 */
export interface PointPrimitiveAttribute {
  style: PointPrimitiveStyle
  [key: string]: unknown
}

/**
 * 扩展的 PointPrimitive 类型 (用于 DrawPPoint)
 */
export type ExtendedPointPrimitive = Cesium.PointPrimitive &
  PrimitiveObject & {
    attribute?: PointPrimitiveAttribute
  }

/**
 * Polygon Primitive 样式接口 (用于 DrawPPolygon)
 */
export interface PolygonPrimitiveStyle {
  color?: string | Cesium.Color
  show?: boolean
  classificationType?: Cesium.ClassificationType
  [key: string]: unknown
}

/**
 * Polygon Primitive 配置接口 (用于 DrawPPolygon)
 */
export interface PolygonPrimitiveConfig {
  minPointNum?: number
  maxPointNum?: number
  addHeight?: number
}

/**
 * Polygon Primitive 属性接口 (用于 DrawPPolygon)
 */
export interface PolygonPrimitiveAttribute {
  style: PolygonPrimitiveStyle
  config?: PolygonPrimitiveConfig
  [key: string]: unknown
}

/**
 * Polyline Primitive 样式接口 (用于 DrawPPolyline)
 */
export interface PolylinePrimitiveStyle {
  width?: number
  color?: string | Cesium.Color
  show?: boolean
  [key: string]: unknown
}

/**
 * Polyline Primitive 配置接口 (用于 DrawPPolyline)
 */
export interface PolylinePrimitiveConfig {
  minPointNum?: number
  maxPointNum?: number
  addHeight?: number
}

/**
 * Polyline Primitive 属性接口 (用于 DrawPPolyline)
 */
export interface PolylinePrimitiveAttribute {
  style: PolylinePrimitiveStyle
  config?: PolylinePrimitiveConfig
  [key: string]: unknown
}

/**
 * 扩展的 Polyline 类型 (用于 DrawPPolyline)
 */
export type ExtendedPolyline = Cesium.Polyline &
  PrimitiveObject & {
    attribute?: PolylinePrimitiveAttribute
  }

/**
 * PolylineVolume Primitive 样式接口 (用于 DrawPPolylineVolume)
 */
export interface PolylineVolumePrimitiveStyle {
  shape?: Cesium.Cartesian2[]
  color?: string | Cesium.Color
  show?: boolean
  [key: string]: unknown
}

/**
 * PolylineVolume Primitive 配置接口 (用于 DrawPPolylineVolume)
 */
export interface PolylineVolumePrimitiveConfig {
  minPointNum?: number
  maxPointNum?: number
  [key: string]: unknown
}

/**
 * PolylineVolume Primitive 属性接口 (用于 DrawPPolylineVolume)
 */
export interface PolylineVolumePrimitiveAttribute {
  style: PolylineVolumePrimitiveStyle
  config?: PolylineVolumePrimitiveConfig
  [key: string]: unknown
}

/**
 * Rectangle Primitive 样式接口 (用于 DrawPRectangle)
 */
export interface RectanglePrimitiveStyle {
  color?: string | Cesium.Color
  show?: boolean
  classificationType?: Cesium.ClassificationType
  [key: string]: unknown
}

/**
 * Rectangle Primitive 属性接口 (用于 DrawPRectangle)
 */
export interface RectanglePrimitiveAttribute {
  style: RectanglePrimitiveStyle
  [key: string]: unknown
}

/**
 * Wall Primitive 样式接口 (用于 DrawPWall)
 */
export interface WallPrimitiveStyle {
  color?: string | Cesium.Color
  extrudedHeight?: number
  show?: boolean
  [key: string]: unknown
}

/**
 * Wall Primitive 配置接口 (用于 DrawPWall)
 */
export interface WallPrimitiveConfig {
  minPointNum?: number
  maxPointNum?: number
  [key: string]: unknown
}

/**
 * Wall Primitive 属性接口 (用于 DrawPWall)
 */
export interface WallPrimitiveAttribute {
  style: WallPrimitiveStyle
  config?: WallPrimitiveConfig
  [key: string]: unknown
}

// ============================================
// 水域相关类型定义
// ============================================

/**
 * 水面类型
 */
export type WaterType = 'water' | 'flood' | 'river' | 'lake' | 'ocean'

// WaveType 从 MaterialPlugin 导入
export type { WaveType }

/**
 * 水面样式配置接口 (用于 DrawPWater)
 */
export interface WaterPrimitiveStyle {
  /** 基础颜色 */
  baseWaterColor?: string | Cesium.Color
  /** 混合颜色 */
  blendColor?: string | Cesium.Color
  /** 镜面反射强度 (0-1) */
  specularIntensity?: number
  /** 衰减距离 */
  fadeFactor?: number
  /** 水面高度 */
  height?: number
  /** 拉伸高度 (用于水体厚度) */
  extrudedHeight?: number
  /** 法线贴图 URL */
  normalMap?: string
  /** 波纹频率 */
  frequency?: number
  /** 波纹振幅 */
  amplitude?: number
  /** 动画速度 */
  animationSpeed?: number
  /** 透明度 */
  opacity?: number
  /** 是否显示 */
  show?: boolean
  /** 波纹类型 */
  waveType?: WaveType
  /** 反射强度 */
  reflectivity?: number
  /** 折射率 */
  refractivity?: number
  /** 流动方向角度 (弧度) */
  flowDirection?: number
  /** 流动速度 */
  flowSpeed?: number
  [key: string]: unknown
}

/**
 * 水面配置接口
 */
export interface WaterPrimitiveConfig {
  minPointNum?: number
  maxPointNum?: number
  addHeight?: number
}

/**
 * 水面属性接口 (用于 DrawPWater)
 */
export interface WaterPrimitiveAttribute {
  style: WaterPrimitiveStyle
  config?: WaterPrimitiveConfig
  type?: WaterType
  [key: string]: unknown
}

/**
 * 扩展的 Water Primitive 对象接口
 */
export interface WaterPrimitiveObject extends PrimitiveObject {
  _waterAttribute?: WaterPrimitiveAttribute
  editing?: unknown
}

/**
 * 洪水推进样式配置接口 (用于 DrawPFlood)
 */
export interface FloodPrimitiveStyle extends WaterPrimitiveStyle {
  /** 起始水位高度 */
  startHeight?: number
  /** 目标水位高度 */
  targetHeight?: number
  /** 当前水位高度 */
  currentHeight?: number
  /** 推进速度 (米/秒) */
  riseSpeed?: number
  /** 推进持续时间 (秒) */
  duration?: number
  /** 是否循环 */
  loop?: boolean
  /** 是否自动开始 */
  autoStart?: boolean
  /** 淹没区域颜色渐变 */
  floodGradient?: boolean
  /** 深水区颜色 */
  deepWaterColor?: string | Cesium.Color
  /** 浅水区颜色 */
  shallowWaterColor?: string | Cesium.Color
}

/**
 * 洪水推进属性接口 (用于 DrawPFlood)
 */
export interface FloodPrimitiveAttribute {
  style: FloodPrimitiveStyle
  config?: WaterPrimitiveConfig
  [key: string]: unknown
}

/**
 * 洪水推进动画状态 (用于 DrawPFlood)
 */
export interface FloodAnimationState {
  isAnimating: boolean
  startTime: number
  currentHeight: number
  startHeight: number
  targetHeight: number
}

/**
 * 河流断面配置
 */
export interface RiverCrossSection {
  /** 断面位置 */
  position: Cesium.Cartesian3
  /** 断面宽度 */
  width: number
  /** 断面深度 */
  depth: number
  /** 水位高度 */
  waterLevel: number
}

/**
 * 河流样式配置接口 (用于 DrawPRiver)
 */
export interface RiverPrimitiveStyle extends WaterPrimitiveStyle {
  /** 河流宽度 */
  width?: number
  /** 河流深度 */
  depth?: number
  /** 流速 (米/秒) */
  flowVelocity?: number
  /** 河流断面数组 */
  crossSections?: RiverCrossSection[]
  /** 是否启用断面水位动态 */
  dynamicWaterLevel?: boolean
  /** 水位变化周期 (秒) */
  waterLevelPeriod?: number
  /** 水位变化幅度 (米) */
  waterLevelAmplitude?: number
  /** 河流纹理重复次数 */
  textureRepeat?: number
  /** 是否显示河床 */
  showRiverbed?: boolean
  /** 河床颜色 */
  riverbedColor?: string | Cesium.Color
}

/**
 * 河流属性接口 (用于 DrawPRiver)
 */
export interface RiverPrimitiveAttribute {
  style: RiverPrimitiveStyle
  config?: WaterPrimitiveConfig
  /** 河流路径点 */
  pathPositions?: Cesium.Cartesian3[]
  [key: string]: unknown
}

/**
 * 河流动画状态 (用于 DrawPRiver)
 */
export interface RiverAnimationState {
  isAnimating: boolean
  startTime: number
  currentWaterLevel: number
  baseWaterLevel: number
}

/**
 * 扩展的 River Primitive 对象接口 (用于 DrawPRiver)
 */
export interface RiverPrimitiveObject extends WaterPrimitiveObject {
  _riverAttribute?: RiverPrimitiveAttribute
}

/**
 * 水面动画状态
 */
export interface WaterAnimationState {
  /** 是否正在播放 */
  isPlaying: boolean
  /** 当前时间 */
  currentTime: number
  /** 当前水位 */
  currentHeight: number
  /** 动画回调 */
  onUpdate?: (state: WaterAnimationState) => void
  /** 动画完成回调 */
  onComplete?: () => void
}

// ============================================
// 视频融合相关类型定义
// ============================================

/**
 * 视频源类型
 */
export type VideoSourceType = 'mp4' | 'webm' | 'flv' | 'hls' | 'm3u8' | 'rtmp' | 'webrtc'

/**
 * 视频投射模式
 */
export type VideoProjectionMode = '2d' | '3d' | 'ground'

/**
 * 视频融合样式配置接口 (用于 DrawPVideoFusion)
 */
export interface VideoFusionPrimitiveStyle {
  /** 视频源 URL */
  videoUrl?: string
  /** 视频源类型 */
  sourceType?: VideoSourceType
  /** 投射模式: 2d-平面投射, 3d-贴物投射, ground-贴地 */
  projectionMode?: VideoProjectionMode
  /** 视频宽度 (像素或米，取决于投射模式) */
  width?: number
  /** 视频高度 (像素或米) */
  height?: number
  /** 透明度 (0-1) */
  opacity?: number
  /** 是否显示 */
  show?: boolean
  /** 是否自动播放 */
  autoPlay?: boolean
  /** 是否循环播放 */
  loop?: boolean
  /** 是否静音 */
  muted?: boolean
  /** 播放速率 */
  playbackRate?: number
  /** 音量 (0-1) */
  volume?: number
  /** 视频旋转角度 (弧度) */
  rotation?: number
  /** 色相调整 (-180 到 180) */
  hue?: number
  /** 饱和度调整 (0-2, 1为正常) */
  saturation?: number
  /** 亮度调整 (0-2, 1为正常) */
  brightness?: number
  /** 对比度调整 (0-2, 1为正常) */
  contrast?: number
  /** 是否启用深度测试 */
  depthTest?: boolean
  /** 深度测试距离 */
  disableDepthTestDistance?: number
  /** 分类类型 (用于3D贴物) */
  classificationType?: Cesium.ClassificationType
  /** 视锥体可视化 (用于3D投射) */
  showFrustum?: boolean
  /** 视锥体颜色 */
  frustumColor?: string | Cesium.Color
  /** 视锥体线宽 */
  frustumLineWidth?: number
  /** 投影面高度 (用于ground模式) */
  groundHeight?: number
  /** HLS/FLV 配置 */
  hlsConfig?: Record<string, unknown>
  flvConfig?: Record<string, unknown>
  [key: string]: unknown
}

/**
 * 视频投射相机参数 (用于3D投射)
 */
export interface VideoProjectionCamera {
  /** 相机位置 */
  position: Cesium.Cartesian3
  /** 相机朝向 (heading, pitch, roll in radians) */
  orientation: {
    heading: number
    pitch: number
    roll: number
  }
  /** 水平视场角 (弧度) */
  fov: number
  /** 宽高比 */
  aspectRatio: number
  /** 近裁剪面 */
  near: number
  /** 远裁剪面 */
  far: number
}

/**
 * 视频融合配置接口
 */
export interface VideoFusionPrimitiveConfig {
  /** 是否可编辑 */
  editable?: boolean
  /** 编辑控制点大小 */
  controlPointSize?: number
  /** 编辑控制点颜色 */
  controlPointColor?: string
  /** 最小点数 */
  minPointNum?: number
  /** 最大点数 */
  maxPointNum?: number
}

/**
 * 视频融合属性接口 (用于 DrawPVideoFusion)
 */
export interface VideoFusionPrimitiveAttribute {
  style: VideoFusionPrimitiveStyle
  config?: VideoFusionPrimitiveConfig
  /** 投射相机参数 (用于3D投射) */
  camera?: VideoProjectionCamera
  /** 投射目标点 (用于2D/ground投射) */
  targetPositions?: Cesium.Cartesian3[]
  [key: string]: unknown
}

/**
 * 视频播放状态
 */
export interface VideoPlaybackState {
  /** 是否正在播放 */
  isPlaying: boolean
  /** 是否暂停 */
  isPaused: boolean
  /** 当前播放时间 (秒) */
  currentTime: number
  /** 视频总时长 (秒) */
  duration: number
  /** 缓冲进度 (0-1) */
  buffered: number
  /** 是否静音 */
  muted: boolean
  /** 音量 (0-1) */
  volume: number
  /** 播放速率 */
  playbackRate: number
  /** 是否已结束 */
  ended: boolean
  /** 是否正在加载 */
  loading: boolean
  /** 错误信息 */
  error?: string
}

/**
 * 视频融合编辑控制点类型
 */
export type VideoEditPointType =
  | 'corner' // 角点
  | 'edge' // 边中点
  | 'center' // 中心点
  | 'rotation' // 旋转控制点
  | 'camera' // 相机位置点 (3D投射)
  | 'target' // 投射目标点

/**
 * 视频融合编辑控制点
 */
export interface VideoEditControlPoint {
  /** 控制点类型 */
  type: VideoEditPointType
  /** 控制点位置 */
  position: Cesium.Cartesian3
  /** 控制点索引 */
  index: number
  /** 是否可见 */
  visible: boolean
}

/**
 * 视频融合事件数据
 */
export interface VideoFusionEventData {
  /** 事件类型 */
  eventType: 'play' | 'pause' | 'ended' | 'timeupdate' | 'error' | 'loaded' | 'edit'
  /** 播放状态 */
  state?: VideoPlaybackState
  /** 错误信息 */
  error?: string
  /** 编辑数据 */
  editData?: {
    controlPoint?: VideoEditControlPoint
    positions?: Cesium.Cartesian3[]
  }
}

// ============================================
// Cesium 内部 API 类型扩展
// ============================================

/**
 * Cesium Material 缓存接口
 */
export interface MaterialCache {
  addMaterial: (
    type: string,
    materialTemplate: {
      fabric: {
        type: string
        uniforms?: Record<string, unknown>
        source?: string
      }
    }
  ) => void
}

/**
 * Cesium Material 构造函数扩展接口
 */
export interface MaterialConstructor {
  _materialCache: MaterialCache
}

// ============================================
// HLS.js 类型定义
// ============================================

/**
 * HLS.js 配置接口
 */
export interface HlsConfig {
  [key: string]: unknown
}

/**
 * HLS.js 事件接口
 */
export interface HlsEvents {
  MANIFEST_PARSED: string
  ERROR: string
}

/**
 * HLS.js 错误数据接口
 */
export interface HlsErrorData {
  fatal: boolean
  details: string
}

/**
 * HLS.js 静态类接口
 */
export interface HlsStatic {
  isSupported: () => boolean
  Events: HlsEvents
  new (config?: HlsConfig): HlsInstance
}

/**
 * HLS.js 实例接口
 */
export interface HlsInstance {
  loadSource: (url: string) => void
  attachMedia: (videoElement: HTMLVideoElement) => void
  on: (event: string, callback: (event: unknown, data: HlsErrorData) => void) => void
  destroy: () => void
}

// ============================================
// flv.js 类型定义
// ============================================

/**
 * flv.js 配置接口
 */
export interface FlvConfig {
  type: string
  url: string
  isLive?: boolean
}

/**
 * flv.js 事件接口
 */
export interface FlvEvents {
  ERROR: string
}

/**
 * flv.js 静态类接口
 */
export interface FlvStatic {
  isSupported: () => boolean
  Events: FlvEvents
  createPlayer: (config: FlvConfig) => FlvInstance
}

/**
 * flv.js 实例接口
 */
export interface FlvInstance {
  attachMediaElement: (videoElement: HTMLVideoElement) => void
  load: () => void
  on: (event: string, callback: (errorType: string, errorDetail: string) => void) => void
  destroy: () => void
}
