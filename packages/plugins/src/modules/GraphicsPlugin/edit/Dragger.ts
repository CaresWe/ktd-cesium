import * as Cesium from 'cesium'
import { PointType, PixelSize, PointColor } from '../types/index'
import type { CreateDraggerOptions, DraggerEntity } from '../types/index'

// 重新导出供其他模块使用
export { PointType, PixelSize, PointColor }
export type { CreateDraggerOptions, DraggerEntity }

/**
 * 拖拽点提示消息
 */
const draggerMessage = {
  def: '拖动以移动位置'
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
