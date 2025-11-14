/**
 * Attr 模块导出
 * 属性配置和样式转换
 */

import * as Cesium from 'cesium'

// 导入所有 Attr 模块
import * as AttrBillboard from './AttrBillboard'
import * as AttrLabel from './AttrLabel'
import * as AttrPoint from './AttrPoint'
import * as AttrModel from './AttrModel'
import * as AttrPlane from './AttrPlane'
import * as AttrBox from './AttrBox'
import * as AttrPolyline from './AttrPolyline'
import * as AttrPolylineVolume from './AttrPolylineVolume'
import * as AttrWall from './AttrWall'
import * as AttrCorridor from './AttrCorridor'
import * as AttrPolygon from './AttrPolygon'
import * as AttrCircle from './AttrCircle'
import * as AttrCylinder from './AttrCylinder'
import * as AttrRectangle from './AttrRectangle'
import * as AttrEllipsoid from './AttrEllipsoid'

// 导出所有 Attr 模块
export {
  AttrBillboard,
  AttrLabel,
  AttrPoint,
  AttrModel,
  AttrPlane,
  AttrBox,
  AttrPolyline,
  AttrPolylineVolume,
  AttrWall,
  AttrCorridor,
  AttrPolygon,
  AttrCircle,
  AttrCylinder,
  AttrRectangle,
  AttrEllipsoid,
}

// 别名
export const AttrEllipse = AttrCircle

/**
 * Attr 模块接口
 */
interface AttrModule {
  getCoordinates: (entity: Cesium.Entity) => number[][] | null
  getPositions: (entity: Cesium.Entity) => Cesium.Cartesian3[] | null
  toGeoJSON: (entity: Cesium.Entity) => Record<string, unknown>
  style2Entity: (style: Record<string, unknown>, entityattr?: Record<string, unknown>) => Record<string, unknown>
}

/**
 * 实体图形属性类型
 */
type EntityWithGraphics = Cesium.Entity & {
  plane?: unknown
}

/**
 * 获取实体类型名称
 */
export function getTypeName(entity: Cesium.Entity): string {
  const extEntity = entity as EntityWithGraphics

  if (entity.polygon) return 'polygon'
  if (entity.rectangle) return 'rectangle'

  if (entity.polyline) return 'polyline'
  if (entity.polylineVolume) return 'polylineVolume'
  if (entity.corridor) return 'corridor'
  if (entity.wall) return 'wall'

  if (entity.ellipse) return 'circle'
  if (entity.ellipsoid) return 'ellipsoid'
  if (entity.cylinder) return 'cylinder'
  if (extEntity.plane) return 'plane'
  if (entity.box) return 'box'

  if (entity.billboard) return 'billboard'
  if (entity.point) return 'point'
  if (entity.model) return 'model'
  if (entity.label) return 'label'

  return ''
}

/**
 * 获取实体对应的属性类
 */
function getAttrClass(entity: Cesium.Entity): AttrModule {
  const extEntity = entity as EntityWithGraphics

  if (entity.polygon) return AttrPolygon as unknown as AttrModule
  if (entity.rectangle) return AttrRectangle as unknown as AttrModule

  if (entity.polyline) return AttrPolyline as unknown as AttrModule
  if (entity.polylineVolume) return AttrPolylineVolume as unknown as AttrModule
  if (entity.corridor) return AttrCorridor as unknown as AttrModule
  if (entity.wall) return AttrWall as unknown as AttrModule

  if (entity.ellipse) return AttrCircle as unknown as AttrModule
  if (entity.cylinder) return AttrCylinder as unknown as AttrModule
  if (entity.ellipsoid) return AttrEllipsoid as unknown as AttrModule
  if (extEntity.plane) return AttrPlane as unknown as AttrModule
  if (entity.box) return AttrBox as unknown as AttrModule

  if (entity.point) return AttrPoint as unknown as AttrModule
  if (entity.billboard) return AttrBillboard as unknown as AttrModule
  if (entity.model) return AttrModel as unknown as AttrModule
  if (entity.label) return AttrLabel as unknown as AttrModule

  // 默认返回空实现
  return {
    getCoordinates: (_entity: Cesium.Entity): null => null,
    getPositions: (_entity: Cesium.Entity): null => null,
    toGeoJSON: (_entity: Cesium.Entity): Record<string, unknown> => ({}),
    style2Entity: (_style: Record<string, unknown>, _entityattr?: Record<string, unknown>): Record<string, unknown> => ({}),
  }
}

/**
 * 获取实体坐标（GeoJSON 格式）
 */
export function getCoordinates(entity: Cesium.Entity): number[][] | null {
  return getAttrClass(entity).getCoordinates(entity)
}

/**
 * 获取实体坐标（Cartesian3 数组）
 */
export function getPositions(entity: Cesium.Entity): Cesium.Cartesian3[] | null {
  return getAttrClass(entity).getPositions(entity)
}

/**
 * 获取实体中心位置
 */
export function getCenterPosition(entity: Cesium.Entity): Cesium.Cartesian3 | null {
  // 如果存在 position 属性，直接返回
  if (entity.position) {
    const time = Cesium.JulianDate.now()
    const position = entity.position.getValue(time)
    if (position) return position
  }

  const positions = getPositions(entity)
  if (!positions || positions.length === 0) return null
  if (positions.length === 1) return positions[0]

  // 多边形取中心点，其他取中间点
  if (entity.polygon) {
    // 简单实现：取所有点的平均值
    let x = 0, y = 0, z = 0
    for (const pos of positions) {
      x += pos.x
      y += pos.y
      z += pos.z
    }
    return new Cesium.Cartesian3(x / positions.length, y / positions.length, z / positions.length)
  } else {
    return positions[Math.floor(positions.length / 2)]
  }
}

/**
 * 实体转 GeoJSON
 */
export function toGeoJSON(entity: Cesium.Entity): Record<string, unknown> {
  return getAttrClass(entity).toGeoJSON(entity)
}

/**
 * 样式转实体属性
 */
export function style2Entity(style: Record<string, unknown>, entity: Cesium.Entity): Record<string, unknown> {
  return getAttrClass(entity).style2Entity(style, entity as unknown as Record<string, unknown>)
}
