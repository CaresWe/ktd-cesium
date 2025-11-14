import * as Cesium from 'cesium'
import { cartesian2lonlat } from '@ktd-cesium/shared'
import * as globe from './globe'

/**
 * �b^'Mn
 */

/**
 * ��/&/pW
 */
function isNumber(obj: any): boolean {
  return typeof obj === 'number' && obj.constructor === Number
}

/**
 * 7lb: Entity ^'
 */
export function style2Entity(style: any, entityattr?: any): any {
  style = style || {}

  if (entityattr == null) {
    entityattr = {}
  }

  // 40�,Tdئ�s^'
  if (style.clampToGround) {
    if (style.hasOwnProperty('height')) delete style.height
    if (style.hasOwnProperty('extrudedHeight')) delete style.extrudedHeight
  }

  // Style K<0 Entity
  for (const key in style) {
    const value = style[key]

    switch (key) {
      default:
        // ��K<
        entityattr[key] = value
        break
      case 'opacity': // ��iUv�^'��p
      case 'outlineOpacity':
      case 'grid_lineCount':
      case 'grid_lineThickness':
      case 'grid_cellAlpha':
      case 'checkerboard_repeat':
      case 'checkerboard_oddcolor':
      case 'stripe_oddcolor':
      case 'stripe_repeat':
      case 'animationDuration':
      case 'animationImage':
      case 'animationRepeatX':
      case 'animationRepeatY':
      case 'animationAxisY':
      case 'animationGradient':
      case 'animationCount':
      case 'randomColor':
        break
      case 'outlineColor': // �F�r
        entityattr.outlineColor = new Cesium.ConstantProperty(
          Cesium.Color.fromCssColorString(value || '#FFFF00').withAlpha(
            style.outlineOpacity || style.opacity || 1.0
          )
        )
        break
      case 'height':
        entityattr.height = value
        if (style.extrudedHeight && isNumber(style.extrudedHeight)) {
          entityattr.extrudedHeight = Number(style.extrudedHeight) + Number(value)
        }
        break
      case 'extrudedHeight':
        if (isNumber(value)) {
          entityattr.extrudedHeight = Number(entityattr.height || style.height || 0) + Number(value)
        } else {
          entityattr.extrudedHeight = value
        }
        break
      case 'color': // kE�r
        entityattr.material = new Cesium.ColorMaterialProperty(
          Cesium.Color.fromCssColorString(value || '#FFFF00').withAlpha(
            Number(style.opacity || 1.0)
          )
        )
        break
      case 'image': // kE�G
        entityattr.material = new Cesium.ImageMaterialProperty({
          image: style.image,
          color: Cesium.Color.fromCssColorString('#FFFFFF').withAlpha(
            Number(style.opacity || 1.0)
          )
        })
        break
      case 'rotation': // �lҦ
        entityattr.rotation = Cesium.Math.toRadians(value)
        if (!style.stRotation) entityattr.stRotation = Cesium.Math.toRadians(value)
        break
      case 'stRotation':
        entityattr.stRotation = Cesium.Math.toRadians(value)
        break
    }
  }

  // �nkEP(
  globe.setFillMaterial(entityattr, style)

  return entityattr
}

/**
 * �� entity �P
 */
export function getPositions(entity: Cesium.Entity): Cesium.Cartesian3[] | null {
  if (!(entity as any).rectangle) return null

  if ((entity as any)._positions_draw && (entity as any)._positions_draw.length > 0) {
    return (entity as any)._positions_draw
  }

  const time = Cesium.JulianDate.now()
  const re = (entity as any).rectangle.coordinates.getValue(time) // Rectangle
  const height = (entity as any).rectangle.height
    ? (entity as any).rectangle.height.getValue(time)
    : 0

  const pt1 = Cesium.Cartesian3.fromRadians(re.west, re.south, height)
  const pt2 = Cesium.Cartesian3.fromRadians(re.east, re.north, height)
  return [pt1, pt2]
}

/**
 * �� entity �Pgeojson ��<	
 */
export function getCoordinates(entity: Cesium.Entity): number[][] | null {
  const positions = getPositions(entity)
  if (!positions) return null

  const coordinates = positions.map((pos) => {
    const lonlat = cartesian2lonlat(pos)
    return lonlat
  })
  return coordinates
}

/**
 * entity l geojson
 */
export function toGeoJSON(entity: Cesium.Entity): any {
  const coordinates = getCoordinates(entity)

  return {
    type: 'Feature',
    properties: (entity as any).attribute || {},
    geometry: {
      type: 'MultiPoint',
      coordinates: coordinates
    }
  }
}

/**
 * �� entity ����LP
 */
export function getOutlinePositions(entity: Cesium.Entity, noAdd?: boolean): Cesium.Cartesian3[] | null {
  if (!(entity as any).rectangle) return null

  const time = Cesium.JulianDate.now()
  const re = (entity as any).rectangle.coordinates.getValue(time) // Rectangle
  if (!re) return null

  const height = (entity as any).rectangle.height
    ? (entity as any).rectangle.height.getValue(time)
    : 0

  const pt1 = Cesium.Cartesian3.fromRadians(re.west, re.south, height)
  const pt2 = Cesium.Cartesian3.fromRadians(re.east, re.south, height)
  const pt3 = Cesium.Cartesian3.fromRadians(re.east, re.north, height)
  const pt4 = Cesium.Cartesian3.fromRadians(re.west, re.north, height)

  const arr = [pt1, pt2, pt3, pt4]
  if (!noAdd) arr.push(pt1)

  return arr
}

/**
 * �� entity ����LPgeojson ��<	
 */
export function getOutlineCoordinates(entity: Cesium.Entity, noAdd?: boolean): number[][] | null {
  const positions = getOutlinePositions(entity, noAdd)
  if (!positions) return null

  const coordinates = positions.map((pos) => {
    const lonlat = cartesian2lonlat(pos)
    return lonlat
  })
  return coordinates
}
