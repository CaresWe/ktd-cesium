import * as Cesium from 'cesium'
import { cartesian2lonlat } from '@ktd-cesium/shared'
import * as globe from './globe'

/**
 * 样式赋值到 entity
 */
export function style2Entity(style: Record<string, unknown>, entityattr?: Cesium.CylinderGraphics.ConstructorOptions): Cesium.CylinderGraphics.ConstructorOptions {
  style = style || {}

  if (entityattr == null) {
    entityattr = {
      fill: true,
      topRadius: 0
    }
  }

  // Style 赋值到 Entity
  for (const key in style) {
    const value = style[key]

    switch (key) {
      default:
        ;(entityattr as Record<string, unknown>)[key] = value
        break
      case 'opacity':
      case 'outlineOpacity':
      case 'color':
      case 'animation':
        break
      case 'outlineColor':
        entityattr.outlineColor = Cesium.Color.fromCssColorString(String(value || '#FFFF00')).withAlpha(
          Number(style.outlineOpacity ?? style.opacity ?? 1.0)
        )
        break
      case 'radius': // 半径（圆）
        entityattr.topRadius = Number(value)
        entityattr.bottomRadius = Number(value)
        break
    }
  }

  globe.setFillMaterial(entityattr, style)
  return entityattr
}

export function getPositions(entity: Cesium.Entity): Cesium.Cartesian3[] {
  const time = Cesium.JulianDate.now()
  const entityExt = entity as Cesium.Entity & { _positions_draw?: Cesium.Cartesian3[] }
  let position = entity.position?.getValue(time)

  if (entityExt._positions_draw && entityExt._positions_draw.length > 0) {
    position = entityExt._positions_draw[0]
  }

  return position ? [position] : []
}

export function getCoordinates(entity: Cesium.Entity): number[][] {
  const positions = getPositions(entity)
  return positions.map((pos) => cartesian2lonlat(pos))
}

export function toGeoJSON(entity: Cesium.Entity): Record<string, unknown> {
  const coordinates = getCoordinates(entity)
  const entityExt = entity as Cesium.Entity & { attribute?: Record<string, unknown> }
  return {
    type: 'Feature',
    properties: entityExt.attribute || {},
    geometry: { type: 'Point', coordinates: coordinates ? coordinates[0] : [] }
  }
}
