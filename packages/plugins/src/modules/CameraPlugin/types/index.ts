import type * as Cesium from 'cesium'

/**
 * 相机飞行选项
 */
export interface CameraFlyToOptions {
  /** 目标位置 [经度, 纬度, 高度] */
  destination: [number, number, number]
  /** 飞行时长（秒），默认 3 */
  duration?: number
  /** 航向角（度），默认 0 */
  heading?: number
  /** 俯仰角（度），默认 -90 */
  pitch?: number
  /** 翻滚角（度），默认 0 */
  roll?: number
  /** 缓动函数 */
  easingFunction?: Cesium.EasingFunction.Callback
  /** 完成回调 */
  complete?: () => void
  /** 取消回调 */
  cancel?: () => void
}

/**
 * 相机视图设置选项
 */
export interface CameraSetViewOptions {
  /** 目标位置 [经度, 纬度, 高度] */
  destination: [number, number, number]
  /** 航向角（度），默认 0 */
  heading?: number
  /** 俯仰角（度），默认 -90 */
  pitch?: number
  /** 翻滚角（度），默认 0 */
  roll?: number
}

/**
 * 相机环绕查看选项
 */
export interface CameraLookAtOptions {
  /** 目标位置 [经度, 纬度, 高度] */
  target: [number, number, number]
  /** 航向角（度），默认 0 */
  heading?: number
  /** 俯仰角（度），默认 -45 */
  pitch?: number
  /** 距离（米），默认 10000 */
  range?: number
}

/**
 * 飞行漫游选项
 */
export interface RoamingOptions {
  /** 航点集合 (经纬度高度数组) */
  waypoints: [number, number, number][]
  /** 漫游总时长（秒），默认 360 */
  duration?: number
  /** 飞行速度倍率，默认 1 */
  speedMultiplier?: number
  /** 是否循环漫游，默认 false */
  loop?: boolean
  /** 是否贴地飞行，默认 false */
  clampToGround?: boolean
  /** 是否贴模型飞行，默认 false */
  clampToTileset?: boolean
  /** 插值算法类型，默认 'hermite' */
  interpolation?: 'hermite' | 'lagrange'
  /** 插值度数，默认 100 */
  interpolationDegree?: number
  /** 相机偏移配置 */
  cameraOffset?: {
    heading?: number
    pitch?: number
    range?: number
  }
  /** 是否显示轨迹线，默认 false */
  showPath?: boolean
  /** 轨迹线配置 */
  pathOptions?: {
    width?: number
    material?: Cesium.Color
    resolution?: number
  }
  /** 是否显示相机视锥体，默认 false */
  showFrustum?: boolean
  /** 视锥体配置 */
  frustumOptions?: {
    /** 视锥体长度（米），默认 100 */
    length?: number
    /** 视野角度（度），默认 60 */
    fov?: number
    /** 视锥体颜色，默认半透明蓝色 */
    color?: Cesium.Color
    /** 线框颜色，默认蓝色 */
    outlineColor?: Cesium.Color
    /** 线框宽度，默认 2 */
    outlineWidth?: number
    /** 是否显示填充，默认 true */
    fill?: boolean
    /** 是否显示线框，默认 true */
    outline?: boolean
  }
}

/**
 * 模型漫游选项
 */
export interface ModelRoamingOptions extends Omit<RoamingOptions, 'showFrustum' | 'frustumOptions'> {
  /** 模型配置 */
  model?: {
    /** 模型 URI */
    uri?: string
    /** 最小像素大小 */
    minimumPixelSize?: number
    /** 最大缩放大小 */
    maximumScale?: number
    /** 其他模型选项 */
    [key: string]: any
  }
  /** 是否显示标签，默认 false */
  showLabel?: boolean
  /** 标签配置 */
  labelOptions?: {
    text?: string
    font?: string
    fillColor?: Cesium.Color
    outlineColor?: Cesium.Color
    outlineWidth?: number
    pixelOffset?: Cesium.Cartesian2
  }
  /** 是否显示圆柱体标记，默认 false */
  showCylinder?: boolean
  /** 圆柱体配置 */
  cylinderOptions?: {
    topRadius?: number
    bottomRadius?: number
    length?: number
    material?: Cesium.Color
    heightReference?: Cesium.HeightReference
  }
  /** 是否显示轨迹折线，默认 false */
  showPolyline?: boolean
  /** 轨迹折线配置 */
  polylineOptions?: {
    width?: number
    material?: Cesium.Color
  }
  /** 是否显示相机视锥体，默认 false */
  showFrustum?: boolean
  /** 视锥体配置 */
  frustumOptions?: {
    /** 视锥体长度（米），默认 100 */
    length?: number
    /** 视野角度（度），默认 60 */
    fov?: number
    /** 视锥体颜色，默认半透明绿色 */
    color?: Cesium.Color
    /** 线框颜色，默认绿色 */
    outlineColor?: Cesium.Color
    /** 线框宽度，默认 2 */
    outlineWidth?: number
    /** 是否显示填充，默认 true */
    fill?: boolean
    /** 是否显示线框，默认 true */
    outline?: boolean
  }
}

/**
 * 绕点飞行选项
 */
export interface CircleAroundPointOptions {
  /** 中心点位置 [经度, 纬度, 高度] */
  center: [number, number, number]
  /** 飞行半径（米），默认 500000 */
  radius?: number
  /** 俯仰角（度），默认 -30 */
  pitch?: number
  /** 飞行时长（秒），默认 10 */
  duration?: number
  /** 是否顺时针，默认 true */
  clockwise?: boolean
  /** 是否循环，默认 true */
  loop?: boolean
  /** 每秒旋转角度，默认 360 / duration */
  anglePerSecond?: number
}

/**
 * 漫游实时数据
 */
export interface RoamingData {
  /** 是否正在漫游 */
  isRoaming: boolean
  /** 当前经度 */
  longitude: number
  /** 当前纬度 */
  latitude: number
  /** 当前高程 */
  elevation: number
  /** 地面高程 */
  terrainHeight: number
  /** 离地高度 */
  heightAboveTerrain: number
  /** 总时长（秒） */
  totalDuration: number
  /** 已用时长（秒） */
  elapsedDuration: number
  /** 总距离（米） */
  totalDistance: number
  /** 已飞行距离（米） */
  elapsedDistance: number
  /** 进度（百分比 0-100） */
  progress: number
  /** 格式化的总时长 */
  totalDurationFormatted: string
  /** 格式化的已用时长 */
  elapsedDurationFormatted: string
}

/**
 * 视角模式
 */
export enum ViewMode {
  /** 跟随模式 */
  FOLLOW = 1,
  /** 俯视模式 */
  TOP_DOWN = 2,
  /** 侧视模式 */
  SIDE_VIEW = 3,
  /** 自定义模式 */
  CUSTOM = 4
}

/**
 * 自定义视角选项
 */
export interface CustomViewOptions {
  /** 航向角（度） */
  heading?: number
  /** 俯仰角（度） */
  pitch?: number
  /** 距离（米） */
  range?: number
}

/**
 * 相机位置信息
 */
export interface CameraPosition {
  /** 经度 */
  longitude: number
  /** 纬度 */
  latitude: number
  /** 高度 */
  height: number
  /** 航向角（度） */
  heading: number
  /** 俯仰角（度） */
  pitch: number
  /** 翻滚角（度） */
  roll: number
}

/**
 * 键盘漫游选项
 */
export interface KeyboardRoamingOptions {
  /** 移动速度（米/秒），默认 10 */
  moveSpeed?: number
  /** 旋转速度（弧度/像素），默认 0.002 */
  rotateSpeed?: number
  /** 垂直移动速度（米/秒），默认 5 */
  verticalSpeed?: number
  /** Shift 加速倍率，默认 3 */
  speedMultiplier?: number
  /** 是否启用碰撞检测，默认 true */
  enableCollision?: boolean
  /** 最小高度（米），默认 1.5 */
  minHeight?: number
}

/**
 * 室内漫游选项
 */
export interface IndoorRoamingOptions {
  /** 航点集合 (经纬度高度数组) */
  waypoints: [number, number, number][]
  /** 漫游总时长（秒），默认 60 */
  duration?: number
  /** 飞行速度倍率，默认 1 */
  speedMultiplier?: number
  /** 是否循环漫游，默认 false */
  loop?: boolean
  /** 插值算法类型，默认 'hermite' */
  interpolation?: 'hermite' | 'lagrange'
  /** 插值度数，默认 100（hermite）或 5（lagrange） */
  interpolationDegree?: number
  /** 相机高度（米，人眼高度），默认 1.7 */
  cameraHeight?: number
  /** 俯仰角（度），默认 0 */
  pitchAngle?: number
  /** 向前看的距离（米），默认 10 */
  lookAheadDistance?: number
  /** 是否显示路径，默认 false */
  showPath?: boolean
  /** 路径配置 */
  pathOptions?: {
    width?: number
    material?: Cesium.Color
  }
  /** 是否显示相机视锥体，默认 false */
  showFrustum?: boolean
  /** 视锥体配置 */
  frustumOptions?: {
    /** 视锥体长度（米），默认 50 */
    length?: number
    /** 视野角度（度），默认 60 */
    fov?: number
    /** 视锥体颜色，默认半透明黄色 */
    color?: Cesium.Color
    /** 线框颜色，默认黄色 */
    outlineColor?: Cesium.Color
    /** 线框宽度，默认 2 */
    outlineWidth?: number
    /** 是否显示填充，默认 true */
    fill?: boolean
    /** 是否显示线框，默认 true */
    outline?: boolean
  }
}
