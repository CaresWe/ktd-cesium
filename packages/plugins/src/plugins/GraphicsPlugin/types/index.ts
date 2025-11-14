/**
 * GraphicsPlugin 类型定义
 */

import * as Cesium from 'cesium'

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
  jsonToEntity?: (feature: GeoJSONFeature) => Cesium.Entity | undefined
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
