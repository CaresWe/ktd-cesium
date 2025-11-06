import type {
  Entity,
  EntityCollection,
  CustomDataSource,
  PrimitiveCollection,
  Cartesian3,
  Color
} from 'cesium'

/**
 * 数据图层类型
 */
export type DataLayerType = 'entity' | 'primitive'

/**
 * 数据图层渲染模式
 */
export type DataLayerMode = 'normal' | 'cluster'

/**
 * 几何类型
 */
export type GeometryType =
  | 'point'      // 点
  | 'polyline'   // 线
  | 'polygon'    // 面
  | 'model'      // 模型
  | 'circle'     // 圆
  | 'ellipse'    // 椭圆
  | 'rectangle'  // 矩形
  | 'corridor'   // 走廊
  | 'wall'       // 墙
  | 'cylinder'   // 圆柱
  | 'box'        // 盒子

/**
 * 数据点位置类型
 */
export type PositionType = Cartesian3 | [number, number, number?]

/**
 * 多点位置类型
 */
export type PositionsType = Cartesian3[] | Array<[number, number, number?]>

/**
 * 数据项接口
 */
export interface DataItem {
  /** 唯一标识 */
  id: string | number
  /** 几何类型 */
  geometryType: GeometryType
  /** 位置坐标（点、模型、圆心等） */
  position?: PositionType
  /** 多点位置（线、面、走廊、墙等） */
  positions?: PositionsType
  /** 自定义数据（可以是任意类型） */
  data?: any
  /** 样式配置 */
  style?: DataItemStyle
  /** 是否显示 */
  show?: boolean
  /** 几何配置 */
  geometry?: GeometryConfig
}

/**
 * 数据项样式配置
 */
export interface DataItemStyle {
  /** 图标（Entity模式，用于点） */
  icon?: {
    /** 图片地址 */
    image: string
    /** 图标大小 */
    scale?: number
    /** 图标颜色 */
    color?: Color
    /** 像素偏移 */
    pixelOffset?: [number, number]
  }
  /** 点样式 */
  point?: {
    /** 点大小 */
    pixelSize?: number
    /** 点颜色 */
    color?: Color
    /** 外边框颜色 */
    outlineColor?: Color
    /** 外边框宽度 */
    outlineWidth?: number
  }
  /** 线样式 */
  polyline?: {
    /** 线宽 */
    width?: number
    /** 线颜色 */
    material?: Color
    /** 是否贴地 */
    clampToGround?: boolean
    /** 是否显示深度 */
    depthFailMaterial?: Color
  }
  /** 面样式 */
  polygon?: {
    /** 填充颜色 */
    material?: Color
    /** 外边框 */
    outline?: boolean
    /** 外边框颜色 */
    outlineColor?: Color
    /** 外边框宽度 */
    outlineWidth?: number
    /** 是否贴地 */
    clampToGround?: boolean
    /** 高度 */
    height?: number
    /** 拉伸高度 */
    extrudedHeight?: number
  }
  /** 模型样式 */
  model?: {
    /** 模型 URI */
    uri: string
    /** 缩放比例 */
    scale?: number
    /** 最小像素大小 */
    minimumPixelSize?: number
    /** 最大缩放距离 */
    maximumScale?: number
    /** 颜色 */
    color?: Color
  }
  /** 圆样式 */
  circle?: {
    /** 半径 */
    semiMajorAxis?: number
    /** 填充颜色 */
    material?: Color
    /** 外边框 */
    outline?: boolean
    /** 外边框颜色 */
    outlineColor?: Color
    /** 外边框宽度 */
    outlineWidth?: number
    /** 高度 */
    height?: number
    /** 拉伸高度 */
    extrudedHeight?: number
  }
  /** 椭圆样式 */
  ellipse?: {
    /** 长半轴 */
    semiMajorAxis?: number
    /** 短半轴 */
    semiMinorAxis?: number
    /** 填充颜色 */
    material?: Color
    /** 外边框 */
    outline?: boolean
    /** 外边框颜色 */
    outlineColor?: Color
    /** 外边框宽度 */
    outlineWidth?: number
    /** 高度 */
    height?: number
    /** 拉伸高度 */
    extrudedHeight?: number
  }
  /** 矩形样式 */
  rectangle?: {
    /** 填充颜色 */
    material?: Color
    /** 外边框 */
    outline?: boolean
    /** 外边框颜色 */
    outlineColor?: Color
    /** 外边框宽度 */
    outlineWidth?: number
    /** 高度 */
    height?: number
    /** 拉伸高度 */
    extrudedHeight?: number
  }
  /** 走廊样式 */
  corridor?: {
    /** 宽度 */
    width?: number
    /** 填充颜色 */
    material?: Color
    /** 外边框 */
    outline?: boolean
    /** 外边框颜色 */
    outlineColor?: Color
    /** 高度 */
    height?: number
    /** 拉伸高度 */
    extrudedHeight?: number
  }
  /** 墙样式 */
  wall?: {
    /** 填充颜色 */
    material?: Color
    /** 外边框 */
    outline?: boolean
    /** 外边框颜色 */
    outlineColor?: Color
    /** 最小高度数组 */
    minimumHeights?: number[]
    /** 最大高度数组 */
    maximumHeights?: number[]
  }
  /** 圆柱样式 */
  cylinder?: {
    /** 顶部半径 */
    topRadius?: number
    /** 底部半径 */
    bottomRadius?: number
    /** 长度 */
    length?: number
    /** 填充颜色 */
    material?: Color
    /** 外边框 */
    outline?: boolean
    /** 外边框颜色 */
    outlineColor?: Color
  }
  /** 盒子样式 */
  box?: {
    /** 尺寸 */
    dimensions?: { x: number; y: number; z: number }
    /** 填充颜色 */
    material?: Color
    /** 外边框 */
    outline?: boolean
    /** 外边框颜色 */
    outlineColor?: Color
  }
  /** 标签 */
  label?: {
    /** 文本内容 */
    text: string
    /** 字体 */
    font?: string
    /** 文字颜色 */
    fillColor?: Color
    /** 外边框颜色 */
    outlineColor?: Color
    /** 外边框宽度 */
    outlineWidth?: number
    /** 像素偏移 */
    pixelOffset?: [number, number]
    /** 是否显示 */
    show?: boolean
  }
}

/**
 * 几何配置
 */
export interface GeometryConfig {
  /** 矩形范围（用于rectangle） */
  rectangleBounds?: {
    west: number
    south: number
    east: number
    north: number
  }
  /** 走廊/墙的拐角类型 */
  cornerType?: 'ROUNDED' | 'MITERED' | 'BEVELED'
}

/**
 * 聚合配置
 */
export interface ClusterConfig {
  /** 是否启用聚合 */
  enabled: boolean
  /** 聚合像素范围 */
  pixelRange?: number
  /** 最小聚合数量 */
  minimumClusterSize?: number
  /** 是否显示标签 */
  showLabels?: boolean
  /** 自定义聚合样式 */
  clusterStyle?: (clusteredEntities: Entity[], cluster: any) => {
    image?: string
    label?: string
    scale?: number
  }
}

/**
 * 弹窗字段配置
 */
export interface PopupFieldConfig {
  /** 字段名（支持嵌套路径，如 'user.name'） */
  field: string
  /** 显示标签 */
  label?: string
  /** 格式化函数 */
  formatter?: (value: any, item: DataItem) => string
  /** 是否显示 */
  show?: boolean
}

/**
 * Vue 组件配置（来自 PopupPlugin）
 */
export interface VuePopupConfig {
  /** Vue 组件 */
  component: any
  /** 组件属性 */
  props?: Record<string, any>
}

/**
 * React 组件配置（来自 PopupPlugin）
 */
export interface ReactPopupConfig {
  /** React 组件 */
  component: any
  /** 组件属性 */
  props?: Record<string, any>
}

/**
 * 弹窗配置
 */
export interface PopupConfig {
  /** 是否显示弹窗 */
  enabled?: boolean
  /** 弹窗标题 */
  title?: string | ((item: DataItem) => string)
  /** 要显示的字段配置 */
  fields?: PopupFieldConfig[]
  /** 自定义弹窗内容（HTML/HTMLElement） */
  content?: (item: DataItem) => string | HTMLElement
  /** Vue 组件配置 */
  vueComponent?: (item: DataItem) => VuePopupConfig
  /** React 组件配置 */
  reactComponent?: (item: DataItem) => ReactPopupConfig
  /** 弹窗样式 */
  style?: {
    width?: string
    maxHeight?: string
    backgroundColor?: string
    borderRadius?: string
    padding?: string
  }
}

/**
 * 数据图层配置
 */
export interface DataLayerConfig {
  /** 图层名称 */
  name: string
  /** 图层类型 */
  type: DataLayerType
  /** 渲染模式 */
  mode?: DataLayerMode
  /** 是否显示 */
  show?: boolean
  /** 聚合配置（仅Entity模式支持） */
  clustering?: ClusterConfig
  /** 默认样式 */
  defaultStyle?: DataItemStyle
  /** 点击回调 */
  onClick?: (item: DataItem, event: any) => void
  /** 是否显示弹窗（简单模式） */
  showPopup?: boolean
  /** 弹窗配置（详细配置） */
  popup?: PopupConfig
  /** 自定义弹窗内容（已废弃，使用 popup.content） */
  popupContent?: (item: DataItem) => string | HTMLElement
}

/**
 * 数据图层实例
 */
export interface DataLayerInstance {
  /** 图层ID */
  id: string
  /** 图层名称 */
  name: string
  /** 图层类型 */
  type: DataLayerType
  /** 图层配置 */
  config: DataLayerConfig
  /** 数据源（Entity模式） */
  dataSource?: CustomDataSource
  /** 图元集合（Primitive模式） */
  primitives?: PrimitiveCollection
  /** Entity集合 */
  entities?: EntityCollection
  /** 数据项映射 */
  dataMap: Map<string | number, DataItem>
  /** 是否显示 */
  show: boolean
  /** 显示图层 */
  setShow: (show: boolean) => void
  /** 添加数据项 */
  addItem: (item: DataItem) => void
  /** 添加多个数据项 */
  addItems: (items: DataItem[]) => void
  /** 移除数据项 */
  removeItem: (id: string | number) => void
  /** 清空所有数据 */
  clear: () => void
  /** 获取数据项 */
  getItem: (id: string | number) => DataItem | undefined
  /** 更新数据项 */
  updateItem: (id: string | number, updates: Partial<DataItem>) => void
  /** 飞向图层 */
  flyTo: (duration?: number) => Promise<void>
  /** 销毁图层 */
  destroy: () => void
}

/**
 * Entity 创建选项
 */
export interface EntityItemOptions {
  id: string | number
  position: Cartesian3
  data: Record<string, any>
  style?: DataItemStyle
  show?: boolean
}

/**
 * Primitive 创建选项
 */
export interface PrimitiveItemOptions {
  id: string | number
  position: Cartesian3
  data: any
  style?: DataItemStyle
  show?: boolean
}

/**
 * 数据映射配置（用于从数组创建图层）
 */
export interface DataMappingConfig {
  /** ID 字段名 */
  idField: string
  /** 几何类型字段名或固定值 */
  geometryType: GeometryType | string
  /** 位置字段配置 */
  position?: {
    /** 经度字段 */
    lonField: string
    /** 纬度字段 */
    latField: string
    /** 高度字段（可选） */
    heightField?: string
  }
  /** 多点位置字段配置 */
  positions?: {
    /** 坐标数组字段名 */
    field: string
    /** 坐标格式：'lonlat' | 'latlon' */
    format?: 'lonlat' | 'latlon'
  }
  /** 样式字段映射 */
  styleMapping?: {
    [key: string]: string | ((item: any) => any)
  }
  /** 是否显示字段 */
  showField?: string
  /** 数据过滤函数 */
  filter?: (item: any) => boolean
  /** 数据转换函数 */
  transform?: (item: any) => any
}
