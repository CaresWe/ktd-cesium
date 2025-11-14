import type { ScreenSpaceEventHandler, Cartesian2, Cartesian3, Ray } from 'cesium'

/**
 * 鼠标事件类型
 */
export enum MouseEventType {
  LEFT_CLICK = 'leftClick',
  LEFT_DOUBLE_CLICK = 'leftDoubleClick',
  LEFT_DOWN = 'leftDown',
  LEFT_UP = 'leftUp',
  MIDDLE_CLICK = 'middleClick',
  MIDDLE_DOWN = 'middleDown',
  MIDDLE_UP = 'middleUp',
  RIGHT_CLICK = 'rightClick',
  RIGHT_DOWN = 'rightDown',
  RIGHT_UP = 'rightUp',
  MOUSE_MOVE = 'mouseMove',
  WHEEL = 'wheel'
}

/**
 * 触摸事件类型
 */
export enum TouchEventType {
  TOUCH_START = 'touchStart',
  TOUCH_END = 'touchEnd',
  TOUCH_MOVE = 'touchMove',
  PINCH_START = 'pinchStart',
  PINCH_END = 'pinchEnd',
  PINCH_MOVE = 'pinchMove'
}

/**
 * 相机事件类型
 */
export enum CameraEventType {
  MOVE_START = 'moveStart',
  MOVE_END = 'moveEnd',
  CHANGED = 'changed'
}

/**
 * 键盘事件类型
 */
export enum KeyboardEventType {
  KEY_DOWN = 'keyDown',
  KEY_UP = 'keyUp',
  KEY_PRESS = 'keyPress'
}

/**
 * 场景事件类型
 */
export enum SceneEventType {
  PRE_UPDATE = 'preUpdate',
  POST_UPDATE = 'postUpdate',
  PRE_RENDER = 'preRender',
  POST_RENDER = 'postRender',
  MORPH_COMPLETE = 'morphComplete',
  RENDER_ERROR = 'renderError'
}

/**
 * 图层事件类型
 */
export enum LayerEventType {
  LAYER_ADDED = 'layerAdded',
  LAYER_REMOVED = 'layerRemoved',
  LAYER_MOVED = 'layerMoved',
  LAYER_SHOWN = 'layerShown',
  LAYER_HIDDEN = 'layerHidden'
}

/**
 * 鼠标/触摸事件信息
 */
export interface PickInfo {
  /** 屏幕坐标 */
  position: Cartesian2
  /** 拾取到的对象 */
  pickedObject?: any
  /** 拾取到的特征 */
  pickedFeature?: any
  /** 世界坐标 */
  cartesian?: Cartesian3
  /** 经纬度高度 */
  coordinates?: {
    longitude: number
    latitude: number
    height: number
  }
  /** 射线 */
  ray?: Ray
}

/**
 * 鼠标事件回调
 */
export type MouseEventCallback = (info: PickInfo) => void

/**
 * 触摸事件回调
 */
export type TouchEventCallback = (info: PickInfo) => void

/**
 * 相机事件回调
 */
export type CameraEventCallback = (percentage: number) => void

/**
 * 键盘事件信息
 */
export interface KeyboardEventInfo {
  key: string
  code: string
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  metaKey: boolean
}

/**
 * 键盘事件回调
 */
export type KeyboardEventCallback = (info: KeyboardEventInfo) => void

/**
 * 场景事件回调
 */
export type SceneEventCallback = (scene: any, time?: any) => void

/**
 * 图层事件信息
 */
export interface LayerEventInfo {
  layer: any
  index?: number
}

/**
 * 图层事件回调
 */
export type LayerEventCallback = (info: LayerEventInfo) => void

/**
 * 事件监听器
 */
export interface EventListener {
  id: string
  type: string
  callback: Function
  handler?: ScreenSpaceEventHandler | Function
}

/**
 * 事件配置
 */
export interface EventConfig {
  /** 是否启用拾取 */
  enablePicking?: boolean
  /** 是否获取世界坐标 */
  enableCartesian?: boolean
  /** 是否获取经纬度 */
  enableCoordinates?: boolean
}

// ==================== GraphicsPlugin 事件类型常量 ====================

/**
 * GraphicsPlugin 绘制和编辑事件类型
 */
export enum GraphicsEventType {
  /** 开始绘制 */
  DRAW_START = 'draw-start',
  /** 绘制过程中增加了点 */
  DRAW_ADD_POINT = 'draw-add-point',
  /** 绘制过程中删除了最后一个点 */
  DRAW_REMOVE_POINT = 'draw-remove-lastpoint',
  /** 绘制过程中鼠标移动 */
  DRAW_MOUSE_MOVE = 'draw-mouse-move',
  /** 创建完成 */
  DRAW_CREATED = 'draw-created',
  /** 开始编辑 */
  EDIT_START = 'edit-start',
  /** 编辑修改了点 */
  EDIT_MOVE_POINT = 'edit-move-point',
  /** 编辑删除了点 */
  EDIT_REMOVE_POINT = 'edit-remove-point',
  /** 停止编辑 */
  EDIT_STOP = 'edit-stop',
  /** 删除对象 */
  DELETE = 'delete'
}

/** 开始绘制 */
export const DrawStart = GraphicsEventType.DRAW_START

/** 绘制过程中增加了点 */
export const DrawAddPoint = GraphicsEventType.DRAW_ADD_POINT

/** 绘制过程中删除了最后一个点 */
export const DrawRemovePoint = GraphicsEventType.DRAW_REMOVE_POINT

/** 绘制过程中鼠标移动 */
export const DrawMouseMove = GraphicsEventType.DRAW_MOUSE_MOVE

/** 创建完成 */
export const DrawCreated = GraphicsEventType.DRAW_CREATED

/** 开始编辑 */
export const EditStart = GraphicsEventType.EDIT_START

/** 编辑修改了点 */
export const EditMovePoint = GraphicsEventType.EDIT_MOVE_POINT

/** 编辑删除了点 */
export const EditRemovePoint = GraphicsEventType.EDIT_REMOVE_POINT

/** 停止编辑 */
export const EditStop = GraphicsEventType.EDIT_STOP

/** 删除对象 */
export const Delete = GraphicsEventType.DELETE
