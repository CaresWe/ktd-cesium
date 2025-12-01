import * as Cesium from 'cesium'
import { template, cartesians2lonlats } from '@ktd-cesium/shared'

// Type definitions
/**
 * 标签样式配置接口
 */
export interface LabelStyleConfig {
  font_style?: string
  font_weight?: string
  font_size?: number | string
  font_family?: string
  scaleByDistance_near?: number
  scaleByDistance_nearValue?: number
  scaleByDistance_far?: number
  scaleByDistance_farValue?: number
  distanceDisplayCondition_far?: number
  distanceDisplayCondition_near?: number
  background_opacity?: number
  pixelOffsetY?: number
  text?: string
  color?: string
  opacity?: number
  border?: boolean
  border_color?: string
  border_width?: number
  background?: boolean
  background_color?: string
  pixelOffset?: number[]
  pixelOffsetX?: number
  hasPixelOffset?: boolean
  scaleByDistance?: boolean
  distanceDisplayCondition?: boolean
  clampToGround?: boolean
  heightReference?: string | Cesium.HeightReference
  visibleDepth?: boolean
  [key: string]: unknown
}

/**
 * 标签 Entity 属性接口
 *
 * 注意：使用具体接口定义，与 PointEntityAttr 保持兼容
 */
export interface LabelEntityAttr {
  scale?: number
  horizontalOrigin?: Cesium.HorizontalOrigin
  verticalOrigin?: Cesium.VerticalOrigin
  fillColor?: Cesium.ConstantProperty
  outlineColor?: Cesium.ConstantProperty
  backgroundColor?: Cesium.ConstantProperty
  style?: Cesium.LabelStyle
  outlineWidth?: number
  showBackground?: boolean
  pixelOffset?: Cesium.Cartesian2
  scaleByDistance?: Cesium.NearFarScalar
  distanceDisplayCondition?: Cesium.DistanceDisplayCondition
  heightReference?: Cesium.HeightReference
  disableDepthTestDistance?: number
  font?: string
  text?: string
  [key: string]: unknown
}

/**
 * Entity 扩展接口，包含 attribute 属性
 */
export interface EntityWithAttribute {
  position: Cesium.PositionProperty
  attribute?: Record<string, unknown>
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
 * Convert style configuration to entity attributes
 * @param style - Style configuration object
 * @param entityattr - Entity attributes object or LabelGraphics (optional)
 * @param textAttr - Text attribute object for template replacement (optional)
 * @returns Entity attributes with applied style
 */
export function style2Entity(
  style?: LabelStyleConfig,
  entityattr?: LabelEntityAttr | Cesium.LabelGraphics,
  textAttr?: Record<string, string | number | ((data: Record<string, unknown>) => string | number)>
): LabelEntityAttr {
  const finalStyle = style || {}
  if (entityattr == null) {
    // Default values
    entityattr = {
      scale: 1.0,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM
    }
  }

  // Convert to a type we can safely manipulate
  const attr = entityattr as Record<string, unknown>

  // Apply Style to Entity
  for (const key in finalStyle) {
    const value = finalStyle[key]
    switch (key) {
      default: // Direct assignment
        attr[key] = value
        break
      case 'font_style': // Skip parameters for extended properties
      case 'font_weight':
      case 'font_size':
      case 'font_family':
      case 'scaleByDistance_near':
      case 'scaleByDistance_nearValue':
      case 'scaleByDistance_far':
      case 'scaleByDistance_farValue':
      case 'distanceDisplayCondition_far':
      case 'distanceDisplayCondition_near':
      case 'background_opacity':
      case 'pixelOffsetY':
        break

      case 'text': // Text content
        {
          let textValue = typeof value === 'string' ? value : ''
          if (textAttr) {
            // When attributes exist, use formatted string
            textValue = template(textValue, textAttr)
          }
          attr.text = textValue.replace(new RegExp('<br />', 'gm'), '\n')
        }
        break
      case 'color': // Color
        {
          const colorString = typeof value === 'string' ? value : '#ffffff'
          attr.fillColor = new Cesium.ConstantProperty(
            Cesium.Color.fromCssColorString(colorString).withAlpha(
              typeof finalStyle.opacity === 'number' ? finalStyle.opacity : 1.0
            )
          )
        }
        break

      case 'border': // Whether to have outline
        attr.style = value ? Cesium.LabelStyle.FILL_AND_OUTLINE : Cesium.LabelStyle.FILL
        break
      case 'border_color': // Outline color
        {
          const borderColorString = typeof value === 'string' ? value : '#000000'
          attr.outlineColor = new Cesium.ConstantProperty(
            Cesium.Color.fromCssColorString(borderColorString).withAlpha(
              typeof finalStyle.opacity === 'number' ? finalStyle.opacity : 1.0
            )
          )
        }
        break
      case 'border_width':
        if (typeof value === 'number') {
          attr.outlineWidth = value
        }
        break
      case 'background': // Whether to have background
        if (typeof value === 'boolean') {
          attr.showBackground = value
        }
        break
      case 'background_color': // Background color
        {
          const bgColorString = typeof value === 'string' ? value : '#000000'
          const bgOpacity =
            typeof finalStyle.background_opacity === 'number'
              ? finalStyle.background_opacity
              : typeof finalStyle.opacity === 'number'
                ? finalStyle.opacity
                : 0.5
          attr.backgroundColor = new Cesium.ConstantProperty(
            Cesium.Color.fromCssColorString(bgColorString).withAlpha(bgOpacity)
          )
        }
        break
      case 'pixelOffset': // Offset
        if (Array.isArray(finalStyle.pixelOffset) && finalStyle.pixelOffset.length >= 2) {
          attr.pixelOffset = new Cesium.Cartesian2(Number(finalStyle.pixelOffset[0]), Number(finalStyle.pixelOffset[1]))
        }
        break
      case 'hasPixelOffset': // Whether to have offset
        if (!value) {
          attr.pixelOffset = new Cesium.Cartesian2(0, 0)
        }
        break
      case 'pixelOffsetX': // Offset
        if (typeof value === 'number') {
          attr.pixelOffset = new Cesium.Cartesian2(
            value,
            typeof finalStyle.pixelOffsetY === 'number' ? finalStyle.pixelOffsetY : 0
          )
        }
        break
      case 'scaleByDistance': // Scale by distance
        if (value) {
          attr.scaleByDistance = new Cesium.NearFarScalar(
            Number(finalStyle.scaleByDistance_near ?? 1000),
            Number(finalStyle.scaleByDistance_nearValue ?? 1.0),
            Number(finalStyle.scaleByDistance_far ?? 1000000),
            Number(finalStyle.scaleByDistance_farValue ?? 0.1)
          )
        } else {
          attr.scaleByDistance = undefined
        }
        break
      case 'distanceDisplayCondition': // Display based on distance
        if (value) {
          attr.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(
            Number(finalStyle.distanceDisplayCondition_near ?? 0),
            Number(finalStyle.distanceDisplayCondition_far ?? 100000)
          )
        } else {
          attr.distanceDisplayCondition = undefined
        }
        break

      case 'clampToGround': // Clamp to ground
        if (value) attr.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND
        else attr.heightReference = Cesium.HeightReference.NONE
        break
      case 'heightReference':
        switch (value) {
          case 'NONE':
            attr.heightReference = Cesium.HeightReference.NONE
            break
          case 'CLAMP_TO_GROUND':
            attr.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND
            break
          case 'RELATIVE_TO_GROUND':
            attr.heightReference = Cesium.HeightReference.RELATIVE_TO_GROUND
            break
          default:
            attr.heightReference = value as Cesium.HeightReference
            break
        }
        break

      case 'visibleDepth':
        if (value) attr.disableDepthTestDistance = 0
        else attr.disableDepthTestDistance = Number.POSITIVE_INFINITY // Always visible, not obscured by terrain
        break
    }
  }

  // Font style (italic, bold, etc.)
  const fontStyle =
    (finalStyle.font_style ?? 'normal') +
    ' small-caps ' +
    (finalStyle.font_weight ?? 'normal') +
    ' ' +
    (finalStyle.font_size ?? '25') +
    'px ' +
    (finalStyle.font_family ?? '楷体')
  attr.font = fontStyle

  return attr as LabelEntityAttr
}

/**
 * Get entity coordinates
 * @param entity - Cesium entity object
 * @returns Array of Cartesian3 positions
 */
export function getPositions(entity: EntityWithAttribute): Cesium.Cartesian3[] {
  const time = Cesium.JulianDate.now()
  const position = entity.position.getValue(time)
  return position ? [position] : []
}

/**
 * Get entity coordinates in GeoJSON format
 * @param entity - Cesium entity object
 * @returns Array of coordinate arrays [longitude, latitude, height]
 */
export function getCoordinates(entity: EntityWithAttribute): number[][] {
  const positions = getPositions(entity)
  const coordinates = cartesians2lonlats(positions)
  return coordinates
}

/**
 * Convert entity to GeoJSON format
 * @param entity - Cesium entity object
 * @returns GeoJSON feature object
 */
export function toGeoJSON(entity: EntityWithAttribute): GeoJSONFeature {
  const coordinates = getCoordinates(entity)
  return {
    type: 'Feature',
    properties: entity.attribute || {},
    geometry: { type: 'Point', coordinates: coordinates.length > 0 ? coordinates[0] : [] }
  }
}
