import * as Cesium from 'cesium'
import { cartesian2lonlat } from '@ktd-cesium/shared'
import * as globe from './globe'

/**
 * 样式赋值到 entity
 */
export function style2Entity(style: Record<string, unknown>, entityattr?: Cesium.BoxGraphics.ConstructorOptions): Cesium.BoxGraphics.ConstructorOptions {
  style = style || {}

  if (entityattr == null) {
    entityattr = {}
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
      case 'dimensionsY':
      case 'dimensionsZ':
      case 'distanceDisplayCondition_far':
      case 'distanceDisplayCondition_near':
        break
      case 'outlineColor':
        entityattr.outlineColor = new Cesium.ConstantProperty(
          Cesium.Color.fromCssColorString(String(value || '#FFFF00')).withAlpha(
            Number(style.outlineOpacity || style.opacity || 1.0)
          )
        )
        break
      case 'color':
        entityattr.material = new Cesium.ColorMaterialProperty(
          Cesium.Color.fromCssColorString(String(value || '#FFFF00')).withAlpha(
            Number(style.opacity || 1.0)
          )
        )
        break
      case 'dimensionsX':
        const dimensionsX = Number(style.dimensionsX || 100.0)
        const dimensionsY = Number(style.dimensionsY || 100.0)
        const dimensionsZ = Number(style.dimensionsZ || 100.0)
        entityattr.dimensions = new Cesium.Cartesian3(dimensionsX, dimensionsY, dimensionsZ)
        break
      case 'distanceDisplayCondition':
        if (value) {
          entityattr.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(
            Number(style.distanceDisplayCondition_near || 0),
            Number(style.distanceDisplayCondition_far || 100000)
          )
        } else {
          entityattr.distanceDisplayCondition = undefined
        }
        break
      case 'clampToGround':
        if (value) {
          entityattr.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND
        } else {
          entityattr.heightReference = Cesium.HeightReference.NONE
        }
        break
    }
  }

  globe.setFillMaterial(entityattr, style)
  return entityattr
}

export function getPositions(entity: Cesium.Entity): Cesium.Cartesian3[] {
  const time = Cesium.JulianDate.now()
  const position = entity.position?.getValue(time)
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
