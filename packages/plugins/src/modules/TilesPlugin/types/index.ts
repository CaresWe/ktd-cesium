import type {
  Cesium3DTileset,
  Cesium3DTileStyle,
  Cesium3DTileFeature,
  Color,
  Matrix4
} from 'cesium'

/**
 * 3D Tiles 图层配置
 */
export interface TilesLayerConfig {
  /** 图层名称 */
  name: string

  /** 瓦片集 URL */
  url: string

  /** 是否显示 */
  show?: boolean

  /** 最大屏幕空间误差 */
  maximumScreenSpaceError?: number

  /** 最大内存使用（MB） */
  maximumMemoryUsage?: number

  /** 是否跳过细节层次 */
  skipLevelOfDetail?: boolean

  /** 是否投射阴影 */
  shadows?: boolean

  /** 变换矩阵 */
  modelMatrix?: Matrix4

  /** 高度偏移 */
  heightOffset?: number

  /** 位置偏移 [x, y, z] */
  offset?: [number, number, number]

  /** 旋转角度 [heading, pitch, roll] 单位：度 */
  rotation?: [number, number, number]

  /** 缩放比例 */
  scale?: number

  /** 初始样式 */
  style?: Cesium3DTileStyle | TilesStyleOptions

  /** 加载完成回调 */
  onLoad?: (tileset: Cesium3DTileset) => void

  /** 加载失败回调 */
  onError?: (error: Error) => void
}

/**
 * 样式配置选项
 */
export interface TilesStyleOptions {
  /** 颜色表达式 */
  color?: string | Color

  /** 显示条件表达式 */
  show?: string | boolean

  /** 点大小表达式 */
  pointSize?: string | number

  /** 元数据条件 */
  meta?: Record<string, unknown>

  /** 自定义条件表达式 */
  conditions?: Array<[string, string | boolean | number | Color]>
}

/**
 * 单体化配置
 */
export interface MonomerConfig {
  /** 单体化名称 */
  name: string

  /** 标识字段名称（如 floor, unit, building） */
  propertyName: string

  /** 单体化类型 */
  type: 'floor' | 'unit' | 'building' | 'custom'

  /** 默认颜色 */
  defaultColor?: Color

  /** 高亮颜色 */
  highlightColor?: Color

  /** 选中颜色 */
  selectedColor?: Color

  /** 颜色映射：属性值 -> 颜色 */
  colorMap?: Map<string | number, Color>

  /** 是否启用点击选择 */
  enableClick?: boolean

  /** 是否启用悬停高亮 */
  enableHover?: boolean

  /** 点击回调 */
  onClick?: (feature: Cesium3DTileFeature, propertyValue: string | number) => void

  /** 悬停回调 */
  onHover?: (feature: Cesium3DTileFeature | null, propertyValue?: string | number) => void
}

/**
 * 分层配置
 */
export interface FloorConfig extends Omit<MonomerConfig, 'type'> {
  type: 'floor'

  /** 楼层范围 [最小楼层, 最大楼层] */
  floorRange?: [number, number]

  /** 楼层高度（用于计算） */
  floorHeight?: number
}

/**
 * 分户配置
 */
export interface UnitConfig extends Omit<MonomerConfig, 'type'> {
  type: 'unit'

  /** 户型分类 */
  unitTypes?: string[]
}

/**
 * 单体化实例
 */
export interface MonomerInstance {
  /** 唯一标识 */
  id: string

  /** 名称 */
  name: string

  /** 配置 */
  config: MonomerConfig

  /** 关联的瓦片集 */
  tileset: Cesium3DTileset

  /** 当前选中的要素 */
  selectedFeature: Cesium3DTileFeature | null

  /** 当前高亮的要素 */
  highlightedFeature: Cesium3DTileFeature | null

  /** 设置选中 */
  select(propertyValue: string | number): void

  /** 清除选中 */
  clearSelection(): void

  /** 设置高亮 */
  highlight(propertyValue: string | number): void

  /** 清除高亮 */
  clearHighlight(): void

  /** 根据属性值设置颜色 */
  setColor(propertyValue: string | number, color: Color): void

  /** 批量设置颜色 */
  setColors(colorMap: Map<string | number, Color>): void

  /** 重置所有颜色 */
  resetColors(): void

  /** 显示指定楼层/单元 */
  show(propertyValue: string | number): void

  /** 隐藏指定楼层/单元 */
  hide(propertyValue: string | number): void

  /** 显示所有 */
  showAll(): void

  /** 隐藏所有 */
  hideAll(): void

  /** 销毁 */
  destroy(): void
}

/**
 * 图层实例
 */
export interface TilesLayerInstance {
  /** 图层ID */
  id: string

  /** 图层名称 */
  name: string

  /** 瓦片集对象 */
  tileset: Cesium3DTileset

  /** 配置 */
  config: TilesLayerConfig

  /** 是否显示 */
  show: boolean

  /** 单体化实例集合 */
  monomers: Map<string, MonomerInstance>

  /** 是否正在编辑 */
  isEditing: boolean

  /** 设置显示状态 */
  setShow(show: boolean): void

  /** 设置样式 */
  setStyle(style: Cesium3DTileStyle | TilesStyleOptions): void

  /** 重置样式 */
  resetStyle(): void

  /** 飞行到图层 */
  flyTo(duration?: number): Promise<void>

  /** 缩放到图层 */
  zoomTo(duration?: number): Promise<void>

  /** 创建单体化 */
  createMonomer(config: MonomerConfig): string

  /** 获取单体化实例 */
  getMonomer(id: string): MonomerInstance | undefined

  /** 移除单体化 */
  removeMonomer(id: string): boolean

  /** 根据屏幕坐标拾取要素 */
  pick(windowPosition: { x: number; y: number }): Cesium3DTileFeature | undefined

  /** 获取所有要素 */
  getAllFeatures(): Cesium3DTileFeature[]

  /** 根据属性筛选要素 */
  getFeaturesByProperty(propertyName: string, value: string | number): Cesium3DTileFeature[]

  /** 启用位置编辑 */
  enableEdit(options?: TilesEditOptions): void

  /** 禁用位置编辑 */
  disableEdit(): void

  /** 更新模型位置（XYZ 局部坐标，不贴球面） */
  updatePosition(offset: { x?: number; y?: number; z?: number }): void

  /** 更新模型旋转 */
  updateRotation(rotation: { heading?: number; pitch?: number; roll?: number }): void

  /** 更新模型缩放 */
  updateScale(scale: number): void

  /** 获取当前变换参数 */
  getTransform(): TilesTransform

  /** 设置变换参数 */
  setTransform(transform: Partial<TilesTransform>): void

  /** 重置变换 */
  resetTransform(): void

  // ========== 剖切功能 ==========
  /** 启用平面剖切 */
  enableClipping(config: ClippingPlanesConfig): void

  /** 更新剖切平面 */
  updateClipping(config: Partial<ClippingPlanesConfig>): void

  /** 禁用剖切 */
  disableClipping(): void

  /** 添加剖切平面 */
  addClippingPlane(plane: ClippingPlaneConfig): void

  /** 移除剖切平面 */
  removeClippingPlane(index: number): void

  // ========== 裁剪功能 ==========
  /** 启用盒子裁剪 */
  enableBoxClip(config: BoxClipConfig): void

  /** 更新盒子裁剪 */
  updateBoxClip(config: Partial<BoxClipConfig>): void

  /** 禁用盒子裁剪 */
  disableBoxClip(): void

  /** 启用模型裁剪 */
  enableModelClip(config: ModelClipConfig): void

  /** 禁用模型裁剪 */
  disableModelClip(): void

  // ========== 淹没分析 ==========
  /** 启用淹没分析 */
  enableFloodAnalysis(config: FloodAnalysisConfig): void

  /** 更新水位高度 */
  updateFloodHeight(height: number): void

  /** 开始淹没动画 */
  startFloodAnimation(): void

  /** 停止淹没动画 */
  stopFloodAnimation(): void

  /** 禁用淹没分析 */
  disableFloodAnalysis(): void

  // ========== 压平功能 ==========
  /** 启用压平 */
  enableFlatten(config: FlattenConfig): void

  /** 更新压平高度 */
  updateFlattenHeight(height: number): void

  /** 禁用压平 */
  disableFlatten(): void

  // ========== 限高分析 ==========
  /** 启用限高分析 */
  enableHeightLimit(config: HeightLimitConfig): void

  /** 更新限制高度 */
  updateHeightLimit(height: number): void

  /** 禁用限高分析 */
  disableHeightLimit(): void

  // ========== 热力图 ==========
  /** 启用热力图 */
  enableHeatmap(config: HeatmapConfig): void

  /** 更新热力图数据 */
  updateHeatmapData(dataPoints: HeatmapConfig['dataPoints']): void

  /** 禁用热力图 */
  disableHeatmap(): void

  // ========== 颜色校正 ==========
  /** 启用颜色校正 */
  enableColorCorrection(config: ColorCorrectionConfig): void

  /** 更新颜色校正 */
  updateColorCorrection(config: Partial<ColorCorrectionConfig>): void

  /** 禁用颜色校正 */
  disableColorCorrection(): void

  // ========== 地震分析 ==========
  /** 启用地震分析 */
  enableSeismicAnalysis(config: SeismicAnalysisConfig): void

  /** 开始地震动画 */
  startSeismicAnimation(): void

  /** 停止地震动画 */
  stopSeismicAnimation(): void

  /** 禁用地震分析 */
  disableSeismicAnalysis(): void

  /** 销毁图层 */
  destroy(): void
}

/**
 * 图层变换参数
 */
export interface TilesTransform {
  /** 位置偏移（相对于原始位置，局部坐标系） */
  offset: { x: number; y: number; z: number }

  /** 旋转角度（度） */
  rotation: { heading: number; pitch: number; roll: number }

  /** 缩放比例 */
  scale: number
}

/**
 * 编辑选项
 */
export interface TilesEditOptions {
  /** 是否显示辅助控制器 */
  showGizmo?: boolean

  /** 是否启用吸附 */
  enableSnap?: boolean

  /** 平移吸附值 */
  translateSnap?: number

  /** 旋转吸附值（度） */
  rotateSnap?: number

  /** 缩放吸附值 */
  scaleSnap?: number

  /** 变换开始回调 */
  onTransformStart?: (transform: TilesTransform) => void

  /** 变换中回调 */
  onTransforming?: (transform: TilesTransform) => void

  /** 变换结束回调 */
  onTransformEnd?: (transform: TilesTransform) => void
}

/**
 * 材质样式配置
 */
export interface MaterialStyleConfig {
  /** 材质名称 */
  name: string

  /** 颜色 */
  color?: Color

  /** 透明度 */
  alpha?: number

  /** 金属度 */
  metallic?: number

  /** 粗糙度 */
  roughness?: number

  /** 发射颜色 */
  emissive?: Color

  /** 高光颜色 */
  specular?: Color

  /** 环境光遮蔽 */
  occlusion?: number

  /** 法线贴图 */
  normalMap?: string

  /** 基础贴图 */
  baseColorTexture?: string

  /** 自定义着色器 */
  customShader?: {
    /** 顶点着色器 */
    vertexShaderText?: string
    /** 片元着色器 */
    fragmentShaderText?: string
    /** Uniform 变量 */
    uniforms?: Record<string, unknown>
  }
}

/**
 * 查询过滤条件
 */
export interface FeatureFilter {
  /** 属性名 */
  propertyName: string

  /** 操作符 */
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'in' | 'notIn' | 'contains'

  /** 值 */
  value: string | number | boolean | Array<string | number>
}

/**
 * 批量操作配置
 */
export interface BatchOperationConfig {
  /** 过滤条件 */
  filters: FeatureFilter[]

  /** 操作类型 */
  operation: 'show' | 'hide' | 'color' | 'style'

  /** 操作值 */
  value?: boolean | Color | TilesStyleOptions
}

/**
 * 剖切平面配置
 */
export interface ClippingPlaneConfig {
  /** 平面法向量 [x, y, z] */
  normal: [number, number, number]

  /** 平面距离原点距离 */
  distance: number

  /** 是否启用 */
  enabled?: boolean
}

/**
 * 剖切平面集合配置
 */
export interface ClippingPlanesConfig {
  /** 平面列表 */
  planes: ClippingPlaneConfig[]

  /** 是否启用 */
  enabled?: boolean

  /** 是否联合剖切（true: 所有平面联合, false: 所有平面相交） */
  unionClippingRegions?: boolean

  /** 边缘颜色 */
  edgeColor?: Color

  /** 边缘宽度 */
  edgeWidth?: number
}

/**
 * 盒子裁剪配置
 */
export interface BoxClipConfig {
  /** 盒子中心点 [x, y, z] 或 [lon, lat, height] */
  center: [number, number, number]

  /** 盒子尺寸 [width, length, height] */
  dimensions: [number, number, number]

  /** 盒子旋转 [heading, pitch, roll] 单位：度 */
  rotation?: [number, number, number]

  /** 裁剪模式：inside 保留内部，outside 保留外部 */
  mode?: 'inside' | 'outside'

  /** 是否显示盒子边框 */
  showBox?: boolean

  /** 盒子边框颜色 */
  boxColor?: Color
}

/**
 * 模型裁剪配置（使用 GraphicsPlugin 绘制的模型进行裁剪）
 */
export interface ModelClipConfig {
  /** 裁剪模型实体 ID（来自 GraphicsPlugin） */
  entityId: string

  /** 裁剪模式：inside 保留内部，outside 保留外部 */
  mode?: 'inside' | 'outside'

  /** 是否显示裁剪模型 */
  showModel?: boolean
}

/**
 * 淹没分析配置
 */
export interface FloodAnalysisConfig {
  /** 最小水位高度 */
  minHeight: number

  /** 最大水位高度 */
  maxHeight: number

  /** 当前水位高度 */
  currentHeight: number

  /** 水体颜色 */
  waterColor?: Color

  /** 水体透明度 */
  waterAlpha?: number

  /** 是否显示水面 */
  showWaterSurface?: boolean

  /** 淹没速度（米/秒，用于动画） */
  floodSpeed?: number

  /** 高度变化回调 */
  onHeightChange?: (height: number) => void
}

/**
 * 压平配置
 */
export interface FlattenConfig {
  /** 压平区域多边形坐标 [[lon, lat, height], ...] */
  positions: Array<[number, number, number]>

  /** 压平高度 */
  height: number

  /** 是否显示压平区域边界 */
  showBoundary?: boolean

  /** 边界颜色 */
  boundaryColor?: Color
}

/**
 * 限高分析配置
 */
export interface HeightLimitConfig {
  /** 限制高度 */
  limitHeight: number

  /** 超高部分颜色 */
  exceedColor?: Color

  /** 正常部分颜色 */
  normalColor?: Color

  /** 是否仅显示超高部分 */
  showOnlyExceeded?: boolean

  /** 高度属性名称（用于读取模型要素高度） */
  heightProperty?: string
}

/**
 * 热力图配置
 */
export interface HeatmapConfig {
  /** 数据点列表 */
  dataPoints: Array<{
    /** 位置 [lon, lat, height] */
    position: [number, number, number]
    /** 权重值 */
    value: number
  }>

  /** 热力图属性名称（如果使用模型属性） */
  propertyName?: string

  /** 最小值 */
  minValue: number

  /** 最大值 */
  maxValue: number

  /** 颜色梯度 */
  gradient?: Array<{
    /** 位置 [0-1] */
    stop: number
    /** 颜色 */
    color: Color
  }>

  /** 半径（像素） */
  radius?: number

  /** 模糊度 */
  blur?: number
}

/**
 * 颜色校正配置
 */
export interface ColorCorrectionConfig {
  /** 亮度 [-1, 1] */
  brightness?: number

  /** 对比度 [-1, 1] */
  contrast?: number

  /** 饱和度 [-1, 1] */
  saturation?: number

  /** 色相偏移 [-180, 180] 度 */
  hue?: number

  /** Gamma 值 [0.1, 3.0] */
  gamma?: number

  /** 色温 [-1, 1] */
  temperature?: number

  /** 色调 [-1, 1] */
  tint?: number
}

/**
 * 地震分析配置
 */
export interface SeismicAnalysisConfig {
  /** 震中位置 [lon, lat] */
  epicenter: [number, number]

  /** 震级 */
  magnitude: number

  /** 震源深度（千米） */
  depth: number

  /** 地震波速度（米/秒） */
  waveSpeed?: number

  /** 是否启用动画 */
  enableAnimation?: boolean

  /** 动画持续时间（毫秒） */
  animationDuration?: number

  /** 振幅系数 */
  amplitudeFactor?: number

  /** 频率系数 */
  frequencyFactor?: number

  /** 影响半径（米） */
  effectRadius?: number

  /** 颜色梯度（按影响强度） */
  gradient?: Array<{
    /** 位置 [0-1] */
    stop: number
    /** 颜色 */
    color: Color
  }>

  /** 动画开始回调 */
  onAnimationStart?: () => void

  /** 动画更新回调 */
  onAnimationUpdate?: (progress: number) => void

  /** 动画结束回调 */
  onAnimationEnd?: () => void
}
