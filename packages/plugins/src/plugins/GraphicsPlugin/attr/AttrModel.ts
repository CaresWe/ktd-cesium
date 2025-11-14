import * as Cesium from 'cesium'
import { cartesian2lonlat } from '@ktd-cesium/shared'

/**
 * 模型样式配置接口
 */
export interface ModelStyleConfig {
  modelUrl?: string
  scale?: number
  heading?: number
  pitch?: number
  roll?: number
  fill?: boolean
  color?: string
  opacity?: number
  silhouette?: boolean
  silhouetteColor?: string
  silhouetteSize?: number
  silhouetteAlpha?: number
  clampToGround?: boolean
  heightReference?: string | Cesium.HeightReference
  [key: string]: unknown
}

/**
 * 模型 Entity 属性接口
 */
export interface ModelEntityAttr {
  uri?: string
  scale?: number
  heading?: number
  pitch?: number
  roll?: number
  color?: Cesium.ConstantProperty
  silhouetteColor?: Cesium.ConstantProperty
  silhouetteSize?: number
  heightReference?: Cesium.HeightReference
  [key: string]: unknown
}

/**
 * 样式赋值到 entity
 */
export function style2Entity(style?: ModelStyleConfig, entityattr?: ModelEntityAttr): ModelEntityAttr {
  const finalStyle = style || {}

  if (entityattr == null) {
    entityattr = {}
  }

  // Style 赋值到 Entity
  for (const key in finalStyle) {
    const value = finalStyle[key]

    switch (key) {
      default:
        entityattr[key] = value
        break
      case 'silhouette':
      case 'silhouetteColor':
      case 'silhouetteAlpha':
      case 'silhouetteSize':
      case 'fill':
      case 'color':
      case 'opacity':
        break
      case 'modelUrl':
        entityattr.uri = value as string
        break
      case 'clampToGround':
        if (value) {
          entityattr.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND
        } else {
          entityattr.heightReference = Cesium.HeightReference.NONE
        }
        break
      case 'heightReference':
        switch (value) {
          case 'NONE':
            entityattr.heightReference = Cesium.HeightReference.NONE
            break
          case 'CLAMP_TO_GROUND':
            entityattr.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND
            break
          case 'RELATIVE_TO_GROUND':
            entityattr.heightReference = Cesium.HeightReference.RELATIVE_TO_GROUND
            break
          default:
            entityattr.heightReference = value as Cesium.HeightReference
            break
        }
        break
    }
  }

  // 轮廓
  if (finalStyle.silhouette) {
    entityattr.silhouetteColor = new Cesium.ConstantProperty(
      Cesium.Color.fromCssColorString(finalStyle.silhouetteColor || '#FFFFFF').withAlpha(
        Number(finalStyle.silhouetteAlpha || 1.0)
      )
    )
    entityattr.silhouetteSize = Number(finalStyle.silhouetteSize || 1.0)
  } else {
    entityattr.silhouetteSize = 0.0
  }

  // 透明度、颜色
  const opacity = finalStyle.opacity || 1
  if (finalStyle.fill) {
    entityattr.color = new Cesium.ConstantProperty(
      Cesium.Color.fromCssColorString(finalStyle.color || '#FFFFFF').withAlpha(opacity)
    )
  } else {
    entityattr.color = new Cesium.ConstantProperty(
      Cesium.Color.fromCssColorString('#FFFFFF').withAlpha(opacity)
    )
  }

  return entityattr
}

export function getPositions(entity: Cesium.Entity): Cesium.Cartesian3[] {
  const time = Cesium.JulianDate.now()
  const positionProperty = entity.position
  if (!positionProperty) {
    return []
  }
  const position = positionProperty.getValue(time)
  return position ? [position] : []
}

export function getCoordinates(entity: Cesium.Entity): number[][] {
  const positions = getPositions(entity)
  return positions.map((pos) => cartesian2lonlat(pos))
}

/**
 * GeoJSON Feature 接口
 */
export interface GeoJSONFeature {
  type: 'Feature'
  properties: Record<string, unknown>
  geometry: {
    type: 'Point'
    coordinates: number[]
  }
}

/**
 * Entity 扩展接口，包含 attribute 属性
 */
interface EntityWithAttribute extends Cesium.Entity {
  attribute?: Record<string, unknown>
}

export function toGeoJSON(entity: Cesium.Entity): GeoJSONFeature {
  const coordinates = getCoordinates(entity)
  const entityWithAttr = entity as EntityWithAttribute
  return {
    type: 'Feature',
    properties: entityWithAttr.attribute || {},
    geometry: { type: 'Point', coordinates: coordinates.length > 0 ? coordinates[0] : [] }
  }
}
