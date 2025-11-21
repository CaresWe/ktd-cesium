import type { Entity, Cartesian3, Quaternion } from 'cesium'

/**
 * 变换模式
 */
export enum TransformMode {
  /** 平移 */
  TRANSLATE = 'translate',
  /** 旋转 */
  ROTATE = 'rotate',
  /** 缩放 */
  SCALE = 'scale'
}

/**
 * 坐标空间
 */
export enum TransformSpace {
  /** 世界坐标系 */
  WORLD = 'world',
  /** 本地坐标系 */
  LOCAL = 'local'
}

/**
 * 轴向枚举
 */
export enum Axis {
  X = 'x',
  Y = 'y',
  Z = 'z',
  XY = 'xy',
  YZ = 'yz',
  XZ = 'xz',
  XYZ = 'xyz'
}

/**
 * 变换数据
 */
export interface TransformData {
  /** 位置 */
  position: Cartesian3
  /** 旋转（四元数） */
  rotation: Quaternion
  /** 缩放 */
  scale: Cartesian3
}

/**
 * 变换插件选项
 */
export interface TransformPluginOptions {
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

/**
 * 变换事件数据
 */
export interface TransformEventData {
  /** 实体 */
  entity: Entity
  /** 变换模式 */
  mode: TransformMode
  /** 变换数据 */
  transform: TransformData
}

/**
 * 变换控制器接口
 */
export interface ITransformController {
  /** 当前附加的实体 */
  entity: Entity | null
  /** 变换模式 */
  mode: TransformMode
  /** 坐标空间 */
  space: TransformSpace
  /** 是否激活 */
  active: boolean

  /** 附加到实体 */
  attach(entity: Entity): void
  /** 分离 */
  detach(): void
  /** 设置变换模式 */
  setMode(mode: TransformMode): void
  /** 设置坐标空间 */
  setSpace(space: TransformSpace): void
  /** 获取变换数据 */
  getTransform(): TransformData | null
  /** 设置变换数据 */
  setTransform(transform: Partial<TransformData>): void
}
