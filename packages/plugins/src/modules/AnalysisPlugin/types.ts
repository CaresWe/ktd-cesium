/**
 * 量算分析插件类型定义
 */

import type * as Cesium from 'cesium'

/**
 * 默认量算样式
 */
export const DEFAULT_MEASURE_STYLE: Required<MeasureStyle> = {
  lineColor: '#ffff00',
  lineWidth: 2,
  pointColor: '#ff0000',
  pointSize: 8,
  fillColor: '#00ff00',
  fillOpacity: 0.3,
  labelFont: '14px sans-serif',
  labelColor: '#ffffff',
  labelBackgroundColor: '#000000',
  labelBackgroundOpacity: 0.7,
  labelPixelOffset: { x: 0, y: -20 },
  auxiliaryLineColor: '#ffffff',
  auxiliaryLineWidth: 1,
  auxiliaryLineDashLength: 10
}

/**
 * 量算类型枚举
 */
export enum MeasureType {
  /** 空间距离测量 */
  DISTANCE = 'distance',
  /** 贴地距离测量 */
  SURFACE_DISTANCE = 'surfaceDistance',
  /** 水平面积测量 */
  AREA = 'area',
  /** 贴地面积测量 */
  SURFACE_AREA = 'surfaceArea',
  /** 高度差测量 */
  HEIGHT = 'height',
  /** 坐标测量 */
  COORDINATE = 'coordinate',
  /** 三角测量 */
  TRIANGLE = 'triangle',
  /** 方位角测量 */
  ANGLE = 'angle',
  /** 剖面分析 */
  PROFILE = 'profile',
  /** 方量分析 */
  VOLUME = 'volume',
  /** 通视分析 */
  VIEWSHED = 'viewshed',
  /** 环视分析（天际线分析） */
  SKYLINE = 'skyline',
  /** 最短路径分析（基于地形坡度） */
  SHORTEST_PATH = 'shortestPath',
  /** 缓冲区分析 */
  BUFFER = 'buffer',
  /** 可视域分析（视域范围分析） */
  VIEWSHED_ANALYSIS = 'viewshedAnalysis',
  /** 日照分析 */
  SUNLIGHT = 'sunlight',
  /** 叠面分析 */
  OVERLAY = 'overlay'
}

/**
 * 量算类型（字符串联合类型）
 */
export type MeasureTypeString =
  | 'distance'
  | 'surfaceDistance'
  | 'area'
  | 'surfaceArea'
  | 'height'
  | 'coordinate'
  | 'triangle'
  | 'angle'
  | 'profile'
  | 'volume'
  | 'viewshed'
  | 'skyline'
  | 'shortestPath'
  | 'buffer'
  | 'viewshedAnalysis'
  | 'sunlight'
  | 'overlay'

/**
 * 量算样式配置
 */
export interface MeasureStyle {
  /** 线颜色 */
  lineColor?: string
  /** 线宽 */
  lineWidth?: number
  /** 点颜色 */
  pointColor?: string
  /** 点大小 */
  pointSize?: number
  /** 填充颜色 */
  fillColor?: string
  /** 填充透明度 */
  fillOpacity?: number
  /** 标签字体 */
  labelFont?: string
  /** 标签颜色 */
  labelColor?: string
  /** 标签背景色 */
  labelBackgroundColor?: string
  /** 标签背景透明度 */
  labelBackgroundOpacity?: number
  /** 标签偏移量 */
  labelPixelOffset?: { x: number; y: number }
  /** 辅助线颜色 */
  auxiliaryLineColor?: string
  /** 辅助线宽度 */
  auxiliaryLineWidth?: number
  /** 辅助线虚线样式 */
  auxiliaryLineDashLength?: number
}

/**
 * 量算结果
 */
export interface MeasureResult {
  /** 量算类型 */
  type: MeasureTypeString
  /** 量算值 */
  value: number | string | Record<string, unknown>
  /** 位置数组 */
  positions: Cesium.Cartesian3[]
  /** 关联的实体 */
  entity?: Cesium.Entity
  /** 格式化的文本 */
  text?: string
}

/**
 * 顶点吸附配置
 */
export interface SnapConfig {
  /** 是否启用吸附 */
  enabled: boolean
  /** 吸附半径（像素） */
  radius: number
  /** 吸附的实体集合 */
  entities?: Cesium.Entity[]
  /** 吸附的数据源 */
  dataSources?: Cesium.CustomDataSource[]
}

/**
 * 距离单位
 */
export type DistanceUnit = 'meter' | 'kilometer' | 'mile' | 'foot'

/**
 * 面积单位
 */
export type AreaUnit = 'squareMeter' | 'squareKilometer' | 'hectare' | 'acre' | 'squareMile'

/**
 * 坐标系统
 */
export type CoordinateSystem = 'WGS84' | 'CGCS2000' | 'GCJ02' | 'BD09'

/**
 * 单位配置
 */
export interface UnitConfig {
  /** 距离单位，默认 meter */
  distance?: DistanceUnit
  /** 面积单位，默认 squareMeter */
  area?: AreaUnit
  /** 坐标系统，默认 WGS84 */
  coordinateSystem?: CoordinateSystem
}

/**
 * 移动端配置
 */
export interface MobileConfig {
  /** 是否启用长按结束测量，默认 true */
  enableLongPress?: boolean
  /** 长按触发时间（毫秒），默认 800ms */
  longPressDelay?: number
  /** 长按移动阈值（像素），超过此距离取消长按，默认 10px */
  longPressMoveThreshold?: number
}

/**
 * 量算配置
 */
export interface MeasureConfig {
  /** Cesium Viewer 实例 */
  viewer: Cesium.Viewer
  /** 数据源 (可选) */
  dataSource?: Cesium.CustomDataSource
  /** 默认样式 */
  style?: MeasureStyle
  /** 顶点吸附配置 */
  snap?: Partial<SnapConfig>
  /** 是否显示中间点 */
  showMidpoint?: boolean
  /** 是否实时更新测量值 */
  liveUpdate?: boolean
  /** 单位配置 */
  units?: UnitConfig
  /** 移动端配置 */
  mobile?: MobileConfig
}

/**
 * 量算事件类型
 */
export enum MeasureEventType {
  /** 开始量算 */
  START = 'measure:start',
  /** 量算中（添加点） */
  POINT_ADD = 'measure:pointAdd',
  /** 量算完成 */
  COMPLETE = 'measure:complete',
  /** 量算更新 */
  UPDATE = 'measure:update',
  /** 量算清除 */
  CLEAR = 'measure:clear',
  /** 量算移除 */
  REMOVE = 'measure:remove',
  /** 顶点吸附 */
  SNAP = 'measure:snap'
}

/**
 * 扩展的实体接口
 */
export interface MeasureEntity extends Cesium.Entity {
  /** 量算属性 */
  measureAttribute?: {
    /** 量算类型 */
    type: MeasureTypeString
    /** 量算结果 */
    result?: MeasureResult
    /** 样式 */
    style?: MeasureStyle
    /** 是否正在编辑 */
    isEditing?: boolean
  }
  /** 绑定的编辑控制器 */
  measureEditor?: unknown
}

/**
 * 量算选项
 */
export interface MeasureOptions {
  /** 量算类型 */
  type: MeasureTypeString
  /** 样式覆盖 */
  style?: Partial<MeasureStyle>
  /** 完成回调 */
  onComplete?: (result: MeasureResult) => void
  /** 更新回调 */
  onUpdate?: (result: MeasureResult) => void
  /** 剖面分析配置（仅用于 profile 类型） */
  profileOptions?: ProfileOptions
  /** 方量分析配置（仅用于 volume 类型） */
  volumeOptions?: VolumeOptions
  /** 通视分析配置（仅用于 viewshed 类型） */
  viewshedOptions?: ViewshedOptions
  /** 环视分析配置（仅用于 skyline 类型） */
  skylineOptions?: SkylineOptions
  /** 最短路径分析配置（仅用于 shortestPath 类型） */
  shortestPathOptions?: ShortestPathOptions
  /** 缓冲区分析配置（仅用于 buffer 类型） */
  bufferOptions?: BufferOptions
  /** 可视域分析配置（仅用于 viewshedAnalysis 类型） */
  viewshedAnalysisOptions?: ViewshedAnalysisOptions
  /** 日照分析配置（仅用于 sunlight 类型） */
  sunlightOptions?: SunlightOptions
  /** 叠面分析配置（仅用于 overlay 类型） */
  overlayOptions?: OverlayOptions
}

/**
 * 剖面分析配置
 */
export interface ProfileOptions {
  /** 采样点数量，默认 100 */
  sampleCount?: number
  /** 是否使用贴地高度，默认 true */
  clampToGround?: boolean
  /** 是否异步采样地形（更精确但更慢），默认 false */
  sampleTerrain?: boolean
}

/**
 * 剖面分析结果数据点
 */
export interface ProfileDataPoint {
  /** 距起点的水平距离（米） */
  distance: number
  /** 该点的高程（米） */
  elevation: number
  /** 该点的经纬度坐标 */
  longitude: number
  latitude: number
  /** 该点的世界坐标 */
  position: Cesium.Cartesian3
}

/**
 * 方量分析配置
 */
export interface VolumeOptions {
  /** 基准高程（米），不设置则自动计算平均高程 */
  baseElevation?: number
  /** 网格采样密度（米），默认 10 米 */
  gridSize?: number
  /** 是否异步采样地形（更精确但更慢），默认 false */
  sampleTerrain?: boolean
}

/**
 * 通视分析配置
 */
export interface ViewshedOptions {
  /** 观察点高度偏移（米），默认 1.6 米（人眼高度） */
  observerHeight?: number
  /** 目标点高度偏移（米），默认 0 米 */
  targetHeight?: number
  /** 采样点数量，默认 100 */
  sampleCount?: number
  /** 可见段线颜色，默认绿色 */
  visibleColor?: string
  /** 不可见段线颜色，默认红色 */
  invisibleColor?: string
  /** 是否显示遮挡点，默认 true */
  showBlockPoint?: boolean
}

/**
 * 环视分析配置（天际线分析）
 */
export interface SkylineOptions {
  /** 观察点高度偏移（米），默认 1.6 米（人眼高度） */
  observerHeight?: number
  /** 分析半径（米），默认 1000 米 */
  radius?: number
  /** 方位角采样数量（决定精度），默认 360 */
  azimuthSamples?: number
  /** 俯仰角采样数量，默认 90 */
  pitchSamples?: number
  /** 最小俯仰角（度），默认 -90 */
  minPitch?: number
  /** 最大俯仰角（度），默认 90 */
  maxPitch?: number
  /** 可视区域颜色，默认半透明绿色 */
  visibleColor?: string
  /** 不可视区域颜色，默认半透明红色 */
  invisibleColor?: string
  /** 是否显示天际线，默认 true */
  showSkyline?: boolean
  /** 天际线颜色，默认黄色 */
  skylineColor?: string
  /** 天际线宽度，默认 3 */
  skylineWidth?: number
}

/**
 * 最短路径分析配置（基于地形坡度）
 */
export interface ShortestPathOptions {
  /** 网格采样密度（米），默认 20 米 */
  gridSize?: number
  /** 坡度权重系数（越大坡度影响越大），默认 1.0 */
  slopeWeight?: number
  /** 距离权重系数（越大距离影响越大），默认 1.0 */
  distanceWeight?: number
  /** 最大坡度限制（度），超过此坡度视为不可通行，默认 45 度 */
  maxSlope?: number
  /** 路径线颜色，默认蓝色 */
  pathColor?: string
  /** 路径线宽度，默认 3 */
  pathWidth?: number
  /** 是否显示网格点，默认 false */
  showGridPoints?: boolean
  /** 网格点颜色，默认灰色 */
  gridPointColor?: string
  /** 网格点大小，默认 3 */
  gridPointSize?: number
  /** 是否异步采样地形（更精确但更慢），默认 false */
  sampleTerrain?: boolean
}

/**
 * 缓冲区分析配置
 */
export interface BufferOptions {
  /** 缓冲半径（米），默认 100 米 */
  radius?: number
  /** 缓冲区段数（决定圆滑度），默认 64 */
  steps?: number
  /** 缓冲区类型，默认 'polygon' */
  bufferType?: 'point' | 'line' | 'polygon'
  /** 缓冲区填充颜色，默认半透明蓝色 */
  fillColor?: string
  /** 缓冲区填充透明度，默认 0.3 */
  fillOpacity?: number
  /** 缓冲区边界线颜色，默认蓝色 */
  outlineColor?: string
  /** 缓冲区边界线宽度，默认 2 */
  outlineWidth?: number
  /** 是否显示原始几何，默认 true */
  showOriginal?: boolean
  /** 原始几何颜色，默认红色 */
  originalColor?: string
  /** 原始几何线宽，默认 2 */
  originalWidth?: number
}

/**
 * 可视域分析配置（视域范围分析）
 */
export interface ViewshedAnalysisOptions {
  /** 观察点高度偏移（米），默认 1.6 米（人眼高度） */
  observerHeight?: number
  /** 分析半径（米），默认 500 米 */
  radius?: number
  /** 水平视角范围（度），默认 360（全方位） */
  horizontalFov?: number
  /** 水平视角起始角度（度，正北为0），默认 0 */
  horizontalAngle?: number
  /** 垂直视角范围（度），默认 90 */
  verticalFov?: number
  /** 垂直视角起始角度（度，水平为0，向下为负），默认 -45 */
  verticalAngle?: number
  /** 方位角采样数量（决定精度），默认 180 */
  azimuthSamples?: number
  /** 距离采样数量，默认 50 */
  distanceSamples?: number
  /** 可视区域颜色，默认半透明绿色 */
  visibleColor?: string
  /** 不可视区域颜色，默认半透明红色 */
  invisibleColor?: string
  /** 是否显示可视边界线，默认 true */
  showBoundary?: boolean
  /** 边界线颜色，默认黄色 */
  boundaryColor?: string
  /** 边界线宽度，默认 2 */
  boundaryWidth?: number
}

/**
 * 日照分析配置
 */
export interface SunlightOptions {
  /** 分析开始日期，默认当前日期 */
  startDate?: Date
  /** 分析结束日期，默认开始日期当天 */
  endDate?: Date
  /** 时间间隔（分钟），默认 60 分钟 */
  timeInterval?: number
  /** 分析开始时间（小时），默认 6 */
  startHour?: number
  /** 分析结束时间（小时），默认 18 */
  endHour?: number
  /** 采样网格密度（米），默认 10 米 */
  gridSize?: number
  /** 建筑物/遮挡物 3D Tiles 数据集 */
  tileset?: Cesium.Cesium3DTileset
  /** 建筑物/遮挡物实体列表 */
  entities?: Cesium.Entity[]
  /** 光照充足颜色（默认黄色） */
  sunlightColor?: string
  /** 光照不足颜色（默认蓝色） */
  shadowColor?: string
  /** 日照时长阈值（小时），超过此值视为充足，默认 2 小时 */
  sunlightThreshold?: number
  /** 是否显示时间轴，默认 false */
  showTimeline?: boolean
  /** 是否显示网格点，默认 false */
  showGridPoints?: boolean
  /** 网格点颜色，默认白色 */
  gridPointColor?: string
  /** 网格点大小，默认 4 */
  gridPointSize?: number
  /** 是否显示日照时长标签，默认 true */
  showDurationLabel?: boolean
  /** 是否使用热力图渲染，默认 true */
  useHeatmap?: boolean
  /** 热力图颜色梯度配置 */
  heatmapGradient?: {
    /** 位置（0-1） */
    position: number
    /** 颜色 */
    color: string
  }[]
}

/**
 * 日照分析结果数据点
 */
export interface SunlightDataPoint {
  /** 该点的世界坐标 */
  position: Cesium.Cartesian3
  /** 该点的经纬度坐标 */
  longitude: number
  latitude: number
  /** 该点的高程（米） */
  elevation: number
  /** 日照总时长（小时） */
  sunlightDuration: number
  /** 日照百分比（0-1） */
  sunlightPercentage: number
  /** 各时间点的光照状态（true: 有光照, false: 阴影） */
  sunlightStatus: boolean[]
}

/**
 * 叠面分析类型
 */
export enum OverlayType {
  /** 相交（求两个面的交集） */
  INTERSECT = 'intersect',
  /** 合并（求两个面的并集） */
  UNION = 'union',
  /** 差集（从第一个面中减去第二个面） */
  DIFFERENCE = 'difference',
  /** 对称差（两个面互相排斥的部分） */
  XOR = 'xor',
  /** 包含判断（判断第一个面是否完全包含第二个面） */
  CONTAINS = 'contains',
  /** 被包含判断（判断第一个面是否被第二个面完全包含） */
  WITHIN = 'within',
  /** 重叠判断（判断两个面是否有重叠） */
  OVERLAPS = 'overlaps',
  /** 相邻判断（判断两个面是否相邻） */
  TOUCHES = 'touches'
}

/**
 * 叠面分析配置
 */
export interface OverlayOptions {
  /** 叠面分析类型，默认 'intersect' */
  overlayType?: OverlayType | keyof typeof OverlayType
  /** 第二个多边形（如果不指定，则需要用户绘制两个多边形） */
  secondPolygon?: Cesium.Cartesian3[]
  /** 第二个多边形实体（从已有实体获取多边形） */
  secondPolygonEntity?: Cesium.Entity
  /** 结果区域填充颜色，默认半透明红色 */
  resultFillColor?: string
  /** 结果区域填充透明度，默认 0.5 */
  resultFillOpacity?: number
  /** 结果区域边界线颜色，默认红色 */
  resultOutlineColor?: string
  /** 结果区域边界线宽度，默认 3 */
  resultOutlineWidth?: number
  /** 是否显示原始多边形，默认 true */
  showOriginalPolygons?: boolean
  /** 第一个多边形颜色，默认蓝色 */
  firstPolygonColor?: string
  /** 第二个多边形颜色，默认绿色 */
  secondPolygonColor?: string
  /** 是否显示面积标签，默认 true */
  showAreaLabel?: boolean
  /** 是否自动计算并显示重叠率，默认 true（仅对相交、重叠等操作有效） */
  showOverlapRatio?: boolean
  /** 容差（米），用于处理浮点数精度问题，默认 0.001 */
  tolerance?: number
}

/**
 * 叠面分析结果
 */
export interface OverlayResult {
  /** 分析类型 */
  type: OverlayType | keyof typeof OverlayType
  /** 第一个多边形坐标 */
  firstPolygon: Cesium.Cartesian3[]
  /** 第二个多边形坐标 */
  secondPolygon: Cesium.Cartesian3[]
  /** 结果多边形坐标（对于布尔判断类型，此字段可能为空） */
  resultPolygon?: Cesium.Cartesian3[]
  /** 布尔判断结果（仅用于 contains、within、overlaps、touches 等类型） */
  booleanResult?: boolean
  /** 第一个多边形面积（平方米） */
  firstArea: number
  /** 第二个多边形面积（平方米） */
  secondArea: number
  /** 结果多边形面积（平方米），对于布尔判断类型，此字段为 0 */
  resultArea: number
  /** 重叠率（结果面积 / 第一个面积），范围 0-1 */
  overlapRatio?: number
  /** GeoJSON 格式的结果（方便导出） */
  geoJSON?: {
    first: GeoJSON.Feature<GeoJSON.Polygon>
    second: GeoJSON.Feature<GeoJSON.Polygon>
    result?: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>
  }
}
