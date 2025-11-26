import type { Color, BillboardCollection } from 'cesium'

/**
 * 场景特效类型
 */
export enum SceneEffectType {
  /** 雨 */
  RAIN = 'rain',
  /** 雪 */
  SNOW = 'snow',
  /** 雾 */
  FOG = 'fog',
  /** 闪电 */
  LIGHTNING = 'lightning',
  /** 高度雾 */
  HEIGHT_FOG = 'heightFog',
  /** 局部下雨 */
  LOCAL_RAIN = 'localRain'
}

/**
 * 雨效果配置
 */
export interface RainEffectOptions {
  /** 效果名称 */
  name?: string
  /** 混合系数 0-1 */
  mixFactor?: number
}

/**
 * 雪效果配置
 */
export interface SnowEffectOptions {
  /** 效果名称 */
  name?: string
  /** 混合系数 0-1 */
  mixFactor?: number
}

/**
 * 雾效果配置
 */
export interface FogEffectOptions {
  /** 效果名称 */
  name?: string
  /** 雾颜色 */
  color?: Color | string
  /** 混合系数 0-1 */
  mixFactor?: number
}

/**
 * 闪电效果配置
 */
export interface LightningEffectOptions {
  /** 效果名称 */
  name?: string
  /** 混合系数 0-1 */
  mixFactor?: number
  /** 下落间隔 0-1 */
  fallInterval?: number
}

/**
 * 高度雾效果配置
 */
export interface HeightFogEffectOptions {
  /** 效果名称 */
  name?: string
  /** 雾颜色 */
  fogColor?: Color | [number, number, number]
  /** 雾高度 */
  fogHeight?: number
  /** 全局密度 */
  globalDensity?: number
}

/**
 * 局部下雨效果配置
 */
export interface LocalRainEffectOptions {
  /** 效果名称 */
  name?: string
  /** 多边形区域坐标数组 [longitude, latitude]，至少3个点 */
  positions?: [number, number][]
  /** 最小经度（当未提供 positions 时使用矩形边界） */
  minLongitude?: number
  /** 最小纬度（当未提供 positions 时使用矩形边界） */
  minLatitude?: number
  /** 最大经度（当未提供 positions 时使用矩形边界） */
  maxLongitude?: number
  /** 最大纬度（当未提供 positions 时使用矩形边界） */
  maxLatitude?: number
  /** 雨滴宽度 */
  dropWidth?: number
  /** 雨滴数量 */
  dropCount?: number
  /** 雨滴下落速度 */
  dropSpeed?: number
  /** 雨滴图片URL */
  dropImage?: string
}

/**
 * 场景特效配置联合类型
 */
export type SceneEffectOptions =
  | RainEffectOptions
  | SnowEffectOptions
  | FogEffectOptions
  | LightningEffectOptions
  | HeightFogEffectOptions
  | LocalRainEffectOptions

/**
 * 场景特效实例接口
 */
export interface SceneEffect {
  /** 效果名称 */
  name: string
  /** 效果类型 */
  type: SceneEffectType
  /** 移除效果 */
  remove(): void
  /** 显示效果 */
  show(): void
  /** 隐藏效果 */
  hide(): void
  /** 是否可见 */
  visible: boolean
}

/**
 * 后期处理特效基类接口
 */
export interface PostProcessEffect extends SceneEffect {
  /** 后期处理阶段 */
  stage: import('cesium').PostProcessStage | null
}

/**
 * 局部雨特效接口
 */
export interface ILocalRainEffect extends SceneEffect {
  /** Billboard集合 */
  billboardCollection: BillboardCollection | null
  /** 更新雨滴位置 */
  updatePositions(): void
}
