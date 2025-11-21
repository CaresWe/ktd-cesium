import type { Entity, CustomDataSource, PrimitiveCollection, Viewer, Cartesian3, PositionProperty, Cartesian2, BillboardGraphics, LabelGraphics, BoxGraphics, EllipseGraphics, PolylineGraphics, CorridorGraphics, EllipsoidGraphics, CylinderGraphics, ModelGraphics, PlaneGraphics, PointGraphics, PolygonGraphics, PolylineVolumeGraphics, RectangleGraphics, WallGraphics } from 'cesium'
import type { GeoJSONFeature as SharedGeoJSONFeature } from '@ktd-cesium/shared'
import type { EventEmitter } from '../EventPlugin'

/**
 * 可启用的插件接口
 */
export interface EnableablePlugin {
  enable: boolean
}

/**
 * EventPlugin 接口
 */
export interface EventPluginInterface extends EventEmitter {
  // EventEmitter 的方法
}

/**
 * 扩展的 Viewer 类型（支持 KtdViewer 的插件系统）
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
  | 'lune'
  | 'regular'
  | 'sector'
  | 'isoscelesTriangle'
  | 'attackArrow'
  | 'attackArrowPW'
  | 'attackArrowYW'
  | 'closeCurve'
  | 'doubleArrow'
  | 'fineArrow'
  | 'fineArrowYW'
  | 'gatheringPlace'
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
  getPositions?: (entity: Entity) => Cartesian3[] | null
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
 * 定义编辑类必须实现的公共接口
 */
export interface EditController {
  activate(): void
  disable(): void
  updateDraggers?(): void
  setPositions?(positions: Cartesian3[]): void
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
  _positions_draw?: Cartesian3[]
  _draw_positions?: Cartesian3[]
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
  viewer: Viewer
  dataSource?: CustomDataSource
  primitives?: PrimitiveCollection
}

/**
 * TooltipPlugin 接口
 */
export interface TooltipPluginInterface {
  showAt: (position: { x: number; y: number } | Cartesian2 | null, content?: string) => void
  setVisible: (visible: boolean) => void
  enable?: boolean
}

/**
 * 编辑类构造函数类型
 * 用于将编辑类作为类型传递给绘制类
 */
export type EditClassConstructor = new (
  entity: Entity,
  viewer: Viewer,
  dataSource: CustomDataSource
) => EditController

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
  /** 是否显示聚合标签 */
  showLabel?: boolean
  /** 聚合样式配置 */
  clusterStyle?: {
    /** 聚合点颜色 */
    color?: string
    /** 聚合点大小 */
    pixelSize?: number
    /** 聚合点轮廓颜色 */
    outlineColor?: string
    /** 聚合点轮廓宽度 */
    outlineWidth?: number
    /** 聚合标签字体 */
    font?: string
    /** 聚合标签颜色 */
    labelColor?: string
    /** 聚合标签轮廓颜色 */
    labelOutlineColor?: string
    /** 聚合标签轮廓宽度 */
    labelOutlineWidth?: number
  }
  /** 自定义聚合图标回调 */
  clusterEvent?: (clusteredEntities: Entity[], cluster: { billboard: unknown; label: unknown }) => void
}

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
  heightReference?: string | import('cesium').HeightReference
  horizontalOrigin?: string | import('cesium').HorizontalOrigin
  verticalOrigin?: string | import('cesium').VerticalOrigin
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
  billboard?: BillboardGraphics
  label?: LabelGraphics
  attribute?: BillboardDrawAttribute
  editing?: unknown
  show?: boolean
  position?: PositionProperty | Cartesian3 | null
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
  heightReference?: string | import('cesium').HeightReference
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
  box?: BoxGraphics
  _positions_draw?: Cartesian3 | Cartesian3[] | null
  attribute?: BoxDrawAttribute
  editing?: unknown
  position?: PositionProperty | Cartesian3
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
export interface CircleExtendedEntity extends Omit<Entity, 'ellipse' | 'polyline'> {
  ellipse?: EllipseGraphics
  polyline?: PolylineGraphics
  attribute?: CircleDrawAttribute
  editing?: EditController
  _positions_draw?: Cartesian3[]
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
export interface CorridorExtendedEntity extends Omit<Entity, 'corridor'> {
  corridor?: CorridorGraphics
  attribute?: CorridorDrawAttribute
  editing?: EditController
  _positions_draw?: Cartesian3[]
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
export interface CurveExtendedEntity extends Omit<Entity, 'polyline'> {
  polyline?: PolylineGraphics
  attribute?: CurveDrawAttribute
  editing?: EditController
  _positions_draw?: Cartesian3[]
  _positions_show?: Cartesian3[] | null
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
export interface EllipsoidExtendedEntity extends Omit<Entity, 'ellipsoid'> {
  ellipsoid?: EllipsoidGraphics
  attribute?: EllipsoidDrawAttribute
  editing?: unknown
  _positions_draw?: Cartesian3 | Cartesian3[] | null
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
  heightReference?: string | import('cesium').HeightReference
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
  label?: LabelGraphics
  attribute?: LabelDrawAttribute
  show?: boolean
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
export interface CylinderExtendedEntity extends Omit<Entity, 'cylinder'> {
  cylinder?: CylinderGraphics
  attribute?: CylinderDrawAttribute
  editing?: EditController
  _positions_draw?: Cartesian3[]
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
export interface ModelExtendedEntity extends Omit<Entity, 'model'> {
  model?: ModelGraphics
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
export interface PlaneExtendedEntity extends Omit<Entity, 'plane'> {
  plane?: PlaneGraphics
  attribute?: PlaneDrawAttribute
  editing?: unknown
  _positions_draw?: Cartesian3 | Cartesian3[] | null
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
export interface PointExtendedEntity extends Omit<Entity, 'point'> {
  point?: PointGraphics
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
export interface PolylineExtendedEntity extends Omit<Entity, 'polyline'> {
  polyline?: PolylineGraphics
  attribute?: PolylineDrawAttribute
  editing?: unknown
  _positions_draw?: Cartesian3[]
}

/**
 * Polygon 样式配置接口 (用于 DrawPolygon)
 */
export interface PolygonStyleConfig {
  clampToGround?: boolean
  extrudedHeight?: number | import('cesium').Property
  outline?: boolean
  outlineWidth?: number
  outlineColor?: string
  color?: string
  opacity?: number
  outlineOpacity?: number
  fillType?: 'color' | 'image' | 'grid' | 'checkerboard' | 'stripe' | 'animationLine' | 'animationCircle'
  material?: import('cesium').MaterialProperty | import('cesium').Color
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
export interface PolygonExtendedEntity extends Omit<Entity, 'polygon'> {
  polygon?: PolygonGraphics
  attribute?: PolygonDrawAttribute
  editing?: EditController
  _positions_draw?: Cartesian3[]
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
 * 注意：PolylineVolumeStyleConfig 在 attr/AttrPolylineVolume.ts 中定义
 */
export interface PolylineVolumeDrawAttribute {
  style?: Record<string, unknown>
  config?: PolylineVolumeConfig
  [key: string]: unknown
}

/**
 * PolylineVolume 扩展的 Entity 接口
 */
export interface PolylineVolumeExtendedEntity extends Omit<Entity, 'polylineVolume'> {
  polylineVolume?: PolylineVolumeGraphics
  attribute?: PolylineVolumeDrawAttribute
  editing?: unknown
  _positions_draw?: Cartesian3[]
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
export interface RectangleExtendedEntity extends Omit<Entity, 'rectangle' | 'polyline'> {
  rectangle?: RectangleGraphics
  polyline?: PolylineGraphics
  attribute?: RectangleDrawAttribute
  editing?: EditController
  _draw_positions?: Cartesian3[]
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
export interface WallExtendedEntity extends Omit<Entity, 'wall'> {
  wall?: WallGraphics
  attribute?: WallDrawAttribute
  editing?: EditController
  _positions_draw?: Cartesian3[]
  _minimumHeights?: number[]
  _maximumHeights?: number[]
}

// ============================================
// Primitive 相关类型定义
// ============================================

/**
 * Billboard Primitive 样式接口 (用于 DrawPBillboard)
 */
export interface BillboardPrimitiveStyle {
  image?: string
  scale?: number
  pixelOffset?: Cartesian2
  eyeOffset?: Cartesian3
  horizontalOrigin?: import('cesium').HorizontalOrigin
  verticalOrigin?: import('cesium').VerticalOrigin
  color?: string | import('cesium').Color
  rotation?: number
  alignedAxis?: Cartesian3
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
 * Primitive 对象基础接口
 */
export interface PrimitiveObject {
  _positions_draw?: Cartesian3 | Cartesian3[] | null
  attribute?: Record<string, unknown>
}

/**
 * 扩展的 Billboard Primitive 接口 (用于 DrawPBillboard)
 */
export interface ExtendedBillboardPrimitive extends PrimitiveObject {
  attribute?: BillboardPrimitiveAttribute
  position?: Cartesian3
  show?: boolean
  image?: string
  scale?: number
  pixelOffset?: Cartesian2
  eyeOffset?: Cartesian3
  horizontalOrigin?: import('cesium').HorizontalOrigin
  verticalOrigin?: import('cesium').VerticalOrigin
  color?: import('cesium').Color
  rotation?: number
  alignedAxis?: Cartesian3
  width?: number
  height?: number
}

/**
 * Box Primitive 样式接口 (用于 DrawPBox)
 */
export interface BoxPrimitiveStyle {
  dimensions?: import('cesium').Cartesian3
  color?: string | import('cesium').Color
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
  color?: string | import('cesium').Color
  show?: boolean
  classificationType?: import('cesium').ClassificationType
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
  color?: string | import('cesium').Color
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
  color?: string | import('cesium').Color
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
  color?: string | import('cesium').Color
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
  radii?: import('cesium').Cartesian3
  color?: string | import('cesium').Color
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
 * Label Primitive 样式接口 (用于 DrawPLabel)
 */
export interface LabelPrimitiveStyle {
  text?: string
  font?: string
  fillColor?: string | import('cesium').Color
  outlineColor?: string | import('cesium').Color
  outlineWidth?: number
  style?: import('cesium').LabelStyle
  pixelOffset?: import('cesium').Cartesian2
  eyeOffset?: import('cesium').Cartesian3
  horizontalOrigin?: import('cesium').HorizontalOrigin
  verticalOrigin?: import('cesium').VerticalOrigin
  scale?: number
  show?: boolean
  disableDepthTestDistance?: number
  backgroundColor?: string | import('cesium').Color
  backgroundPadding?: import('cesium').Cartesian2
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

// ============================================
// 水域相关类型定义
// ============================================

/**
 * 水面类型
 */
export type WaterType = 'water' | 'flood' | 'river' | 'lake' | 'ocean'

/**
 * 水面波纹类型
 */
export type WaveType = 'calm' | 'ripple' | 'wave' | 'turbulent'

/**
 * 水面样式配置接口 (用于 DrawPWater)
 */
export interface WaterPrimitiveStyle {
  /** 基础颜色 */
  baseWaterColor?: string | import('cesium').Color
  /** 混合颜色 */
  blendColor?: string | import('cesium').Color
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
  deepWaterColor?: string | import('cesium').Color
  /** 浅水区颜色 */
  shallowWaterColor?: string | import('cesium').Color
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
 * 河流断面配置
 */
export interface RiverCrossSection {
  /** 断面位置 */
  position: Cartesian3
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
  riverbedColor?: string | import('cesium').Color
}

/**
 * 河流属性接口 (用于 DrawPRiver)
 */
export interface RiverPrimitiveAttribute {
  style: RiverPrimitiveStyle
  config?: WaterPrimitiveConfig
  /** 河流路径点 */
  pathPositions?: Cartesian3[]
  [key: string]: unknown
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
  classificationType?: import('cesium').ClassificationType
  /** 视锥体可视化 (用于3D投射) */
  showFrustum?: boolean
  /** 视锥体颜色 */
  frustumColor?: string | import('cesium').Color
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
  position: Cartesian3
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
  targetPositions?: Cartesian3[]
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
  | 'corner'      // 角点
  | 'edge'        // 边中点
  | 'center'      // 中心点
  | 'rotation'    // 旋转控制点
  | 'camera'      // 相机位置点 (3D投射)
  | 'target'      // 投射目标点

/**
 * 视频融合编辑控制点
 */
export interface VideoEditControlPoint {
  /** 控制点类型 */
  type: VideoEditPointType
  /** 控制点位置 */
  position: Cartesian3
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
    positions?: Cartesian3[]
  }
}
