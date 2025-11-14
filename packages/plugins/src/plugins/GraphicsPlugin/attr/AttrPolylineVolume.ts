import * as Cesium from 'cesium'
import { cartesian2lonlat } from '@ktd-cesium/shared'

/**
 * 样式赋值到 entity
 */
export function style2Entity(style: any, entityattr?: any): any {
  style = style || {}

  if (entityattr == null) {
    entityattr = {}
  }

  // Style 赋值到 Entity
  for (const key in style) {
    const value = style[key]

    switch (key) {
      default:
        entityattr[key] = value
        break
      case 'opacity':
      case 'outlineOpacity':
      case 'radius':
      case 'shape':
        break
      case 'outlineColor':
        entityattr.outlineColor = new Cesium.ConstantProperty(
          Cesium.Color.fromCssColorString(value || '#FFFF00').withAlpha(
            style.outlineOpacity || style.opacity || 1.0
          )
        )
        break
      case 'color':
        entityattr.material = new Cesium.ColorMaterialProperty(
          Cesium.Color.fromCssColorString(value || '#FFFF00').withAlpha(
            Number(style.opacity || 1.0)
          )
        )
        break
    }
  }

  // 管道样式
  const radius = style.radius || 10
  switch (style.shape) {
    default:
    case 'pipeline':
      entityattr.shape = getCorridorShape1(radius) // 厚度固定为半径的1/3
      break
    case 'circle':
      entityattr.shape = getCorridorShape2(radius)
      break
    case 'star':
      entityattr.shape = getCorridorShape3(radius)
      break
  }

  return entityattr
}

// 管道形状1【内空管道】radius整个管道的外半径
function getCorridorShape1(radius: number): Cesium.Cartesian2[] {
  const hd = radius / 3
  const startAngle = 0
  const endAngle = 360

  const pss: Cesium.Cartesian2[] = []
  for (let i = startAngle; i <= endAngle; i++) {
    const radians = Cesium.Math.toRadians(i)
    pss.push(new Cesium.Cartesian2(radius * Math.cos(radians), radius * Math.sin(radians)))
  }
  for (let i = endAngle; i >= startAngle; i--) {
    const radians = Cesium.Math.toRadians(i)
    pss.push(new Cesium.Cartesian2((radius - hd) * Math.cos(radians), (radius - hd) * Math.sin(radians)))
  }
  return pss
}

// 管道形状2【圆柱体】radius整个管道的外半径
function getCorridorShape2(radius: number): Cesium.Cartesian2[] {
  const startAngle = 0
  const endAngle = 360

  const pss: Cesium.Cartesian2[] = []
  for (let i = startAngle; i <= endAngle; i++) {
    const radians = Cesium.Math.toRadians(i)
    pss.push(new Cesium.Cartesian2(radius * Math.cos(radians), radius * Math.sin(radians)))
  }
  return pss
}

// 管道形状3【星状】radius整个管道的外半径，arms星角的个数（默认6个角）
function getCorridorShape3(radius: number, arms: number = 6): Cesium.Cartesian2[] {
  const angle = Math.PI / arms
  const length = 2 * arms
  const pss: Cesium.Cartesian2[] = new Array(length)
  for (let i = 0; i < length; i++) {
    const r = i % 2 === 0 ? radius : radius / 3
    pss[i] = new Cesium.Cartesian2(Math.cos(i * angle) * r, Math.sin(i * angle) * r)
  }
  return pss
}

export function getPositions(entity: Cesium.Entity): Cesium.Cartesian3[] {
  if ((entity as any)._positions_draw && (entity as any)._positions_draw.length > 0) {
    return (entity as any)._positions_draw
  }

  const time = Cesium.JulianDate.now()
  return (entity as any).polylineVolume.positions.getValue(time) || []
}

export function getCoordinates(entity: Cesium.Entity): number[][] {
  const positions = getPositions(entity)
  return positions.map((pos) => cartesian2lonlat(pos))
}

export function toGeoJSON(entity: Cesium.Entity): any {
  const coordinates = getCoordinates(entity)
  return {
    type: 'Feature',
    properties: (entity as any).attribute || {},
    geometry: {
      type: 'LineString',
      coordinates: coordinates
    }
  }
}
