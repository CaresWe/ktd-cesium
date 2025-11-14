import * as Cesium from 'cesium'

/**
 * 拖拽点提示消息
 */
const draggerMessage = {
  def: '拖动以移动位置'
}

/**
 * 编辑点的像素大小
 */
export const PixelSize = 12

/**
 * 拖拽点类型
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
 * 拖拽点属性
 */
interface DraggerAttr {
  scale: number
  pixelSize: number
  color?: Cesium.Color
  outlineColor: Cesium.Color
  outlineWidth: number
  scaleByDistance: Cesium.NearFarScalar
  disableDepthTestDistance: number
}

/**
 * 创建拖拽点选项
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
 * 扩展的 Entity 类型,包含拖拽相关属性
 */
export interface DraggerEntity extends Cesium.Entity {
  _isDragger: boolean
  _noMousePosition: boolean
  _pointType: PointType
  draw_tooltip?: string
  contextmenuItems?: boolean | any[]
  onDragStart?: ((dragger: Cesium.Entity, position: Cesium.Cartesian3) => void) | null
  onDrag?: ((dragger: Cesium.Entity, position: Cesium.Cartesian3) => void) | null
  onDragEnd?: ((dragger: Cesium.Entity, position: Cesium.Cartesian3) => void) | null
}

/**
 * 根据类型获取属性
 */
function getAttrForType(type: PointType, attr: DraggerAttr): DraggerAttr {
  switch (type) {
    case PointType.AddMidPoint:
      attr.color = PointColor.AddMidPoint
      attr.outlineColor = Cesium.Color.fromCssColorString('#ffffff').withAlpha(0.4)
      break
    case PointType.MoveAll:
      attr.color = PointColor.MoveAll
      break
    case PointType.MoveHeight:
      attr.color = PointColor.MoveHeight
      break
    case PointType.EditAttr:
      attr.color = PointColor.EditAttr
      break
    case PointType.Control:
    default:
      attr.color = PointColor.Control
      break
  }
  return attr
}

/**
 * 创建 Dragger 拖动点
 * @param dataSource 数据源
 * @param options 选项
 * @returns 拖拽点实体
 */
export function createDragger(
  dataSource: Cesium.CustomDataSource,
  options: CreateDraggerOptions
): DraggerEntity {
  let dragger: DraggerEntity

  if (options.dragger) {
    dragger = options.dragger as DraggerEntity
  } else {
    let attr: DraggerAttr = {
      scale: 1,
      pixelSize: PixelSize,
      outlineColor: Cesium.Color.fromCssColorString('#ffffff').withAlpha(0.5),
      outlineWidth: 2,
      scaleByDistance: new Cesium.NearFarScalar(1000, 1, 1000000, 0.5),
      disableDepthTestDistance: Number.POSITIVE_INFINITY // 一直显示，不被地形等遮挡
    }

    attr = getAttrForType(options.type || PointType.Control, attr)

    dragger = dataSource.entities.add({
      position: options.position || Cesium.Cartesian3.ZERO,
      point: attr
    }) as DraggerEntity

    dragger.contextmenuItems = false // 不加右键菜单
    dragger.draw_tooltip = options.tooltip || draggerMessage.def
  }

  dragger._isDragger = true
  dragger._noMousePosition = true // 不被 getCurrentMousePosition 拾取
  dragger._pointType = options.type || PointType.Control // 默认是位置控制拖拽点

  dragger.onDragStart = options.onDragStart || null
  dragger.onDrag = options.onDrag || null
  dragger.onDragEnd = options.onDragEnd || null

  return dragger
}
