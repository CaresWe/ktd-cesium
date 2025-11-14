import * as Cesium from "cesium";
import { template, cartesians2lonlats } from "@ktd-cesium/shared";

// Type definitions
/**
 * 标签样式配置接口
 */
export interface LabelStyleConfig {
  font_style?: string;
  font_weight?: string;
  font_size?: number | string;
  font_family?: string;
  scaleByDistance_near?: number;
  scaleByDistance_nearValue?: number;
  scaleByDistance_far?: number;
  scaleByDistance_farValue?: number;
  distanceDisplayCondition_far?: number;
  distanceDisplayCondition_near?: number;
  background_opacity?: number;
  pixelOffsetY?: number;
  text?: string;
  color?: string;
  opacity?: number;
  border?: boolean;
  border_color?: string;
  border_width?: number;
  background?: boolean;
  background_color?: string;
  pixelOffset?: number[];
  pixelOffsetX?: number;
  hasPixelOffset?: boolean;
  scaleByDistance?: boolean;
  distanceDisplayCondition?: boolean;
  clampToGround?: boolean;
  heightReference?: string | Cesium.HeightReference;
  visibleDepth?: boolean;
  [key: string]: unknown;
}

/**
 * 标签 Entity 属性接口
 */
export interface LabelEntityAttr {
  scale?: number;
  horizontalOrigin?: Cesium.HorizontalOrigin;
  verticalOrigin?: Cesium.VerticalOrigin;
  text?: string;
  fillColor?: Cesium.ConstantProperty;
  style?: Cesium.LabelStyle;
  outlineColor?: Cesium.ConstantProperty;
  outlineWidth?: number;
  showBackground?: boolean;
  backgroundColor?: Cesium.ConstantProperty;
  pixelOffset?: Cesium.Cartesian2;
  scaleByDistance?: Cesium.NearFarScalar;
  distanceDisplayCondition?: Cesium.DistanceDisplayCondition;
  heightReference?: Cesium.HeightReference;
  disableDepthTestDistance?: number;
  font?: string;
  [key: string]: unknown;
}

/**
 * Entity 扩展接口，包含 attribute 属性
 */
export interface EntityWithAttribute {
  position: Cesium.PositionProperty;
  attribute?: Record<string, unknown>;
}

/**
 * GeoJSON Feature 接口
 */
export interface GeoJSONFeature {
  type: 'Feature';
  properties: Record<string, unknown>;
  geometry: {
    type: 'Point';
    coordinates: number[];
  };
}

/**
 * Convert style configuration to entity attributes
 * @param style - Style configuration object
 * @param entityattr - Entity attributes object (optional)
 * @param textAttr - Text attribute object for template replacement (optional)
 * @returns Entity attributes with applied style
 */
export function style2Entity(
  style?: LabelStyleConfig,
  entityattr?: LabelEntityAttr,
  textAttr?: Record<string, string | number | ((data: Record<string, unknown>) => string | number)>
): LabelEntityAttr {
  const finalStyle = style || {};
  if (entityattr == null) {
    // Default values
    entityattr = {
      scale: 1.0,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
    };
  }

  // Apply Style to Entity
  for (const key in finalStyle) {
    const value = finalStyle[key];
    switch (key) {
      default: // Direct assignment
        entityattr[key] = value;
        break;
      case "font_style": // Skip parameters for extended properties
      case "font_weight":
      case "font_size":
      case "font_family":
      case "scaleByDistance_near":
      case "scaleByDistance_nearValue":
      case "scaleByDistance_far":
      case "scaleByDistance_farValue":
      case "distanceDisplayCondition_far":
      case "distanceDisplayCondition_near":
      case "background_opacity":
      case "pixelOffsetY":
        break;

      case "text": // Text content
        {
          let textValue = value as string;
          if (textAttr) {
            // When attributes exist, use formatted string
            textValue = template(textValue, textAttr);
          }
          entityattr.text = textValue.replace(new RegExp("<br />", "gm"), "\n");
        }
        break;
      case "color": // Color
        entityattr.fillColor = new Cesium.ConstantProperty(
          Cesium.Color.fromCssColorString((value as string) || "#ffffff").withAlpha(
            Number(finalStyle.opacity || 1.0)
          )
        );
        break;

      case "border": // Whether to have outline
        entityattr.style = value
          ? Cesium.LabelStyle.FILL_AND_OUTLINE
          : Cesium.LabelStyle.FILL;
        break;
      case "border_color": // Outline color
        entityattr.outlineColor = new Cesium.ConstantProperty(
          Cesium.Color.fromCssColorString((value as string) || "#000000").withAlpha(
            Number(finalStyle.opacity || 1.0)
          )
        );
        break;
      case "border_width":
        entityattr.outlineWidth = value as number;
        break;
      case "background": // Whether to have background
        entityattr.showBackground = value as boolean;
        break;
      case "background_color": // Background color
        entityattr.backgroundColor = new Cesium.ConstantProperty(
          Cesium.Color.fromCssColorString((value as string) || "#000000").withAlpha(
            Number(finalStyle.background_opacity || finalStyle.opacity || 0.5)
          )
        );
        break;
      case "pixelOffset": // Offset
        entityattr.pixelOffset = new Cesium.Cartesian2(
          (finalStyle.pixelOffset as number[])[0],
          (finalStyle.pixelOffset as number[])[1]
        );
        break;
      case "hasPixelOffset": // Whether to have offset
        if (!value)
          entityattr.pixelOffset = new Cesium.Cartesian2(0, 0);
        break;
      case "pixelOffsetX": // Offset
        entityattr.pixelOffset = new Cesium.Cartesian2(
          value as number,
          finalStyle.pixelOffsetY || 0
        );
        break;
      case "scaleByDistance": // Scale by distance
        if (value) {
          entityattr.scaleByDistance = new Cesium.NearFarScalar(
            Number(finalStyle.scaleByDistance_near || 1000),
            Number(finalStyle.scaleByDistance_nearValue || 1.0),
            Number(finalStyle.scaleByDistance_far || 1000000),
            Number(finalStyle.scaleByDistance_farValue || 0.1)
          );
        } else {
          entityattr.scaleByDistance = undefined;
        }
        break;
      case "distanceDisplayCondition": // Display based on distance
        if (value) {
          entityattr.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(
            Number(finalStyle.distanceDisplayCondition_near || 0),
            Number(finalStyle.distanceDisplayCondition_far || 100000)
          );
        } else {
          entityattr.distanceDisplayCondition = undefined;
        }
        break;

      case "clampToGround": // Clamp to ground
        if (value) entityattr.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
        else entityattr.heightReference = Cesium.HeightReference.NONE;
        break;
      case "heightReference":
        switch (value) {
          case "NONE":
            entityattr.heightReference = Cesium.HeightReference.NONE;
            break;
          case "CLAMP_TO_GROUND":
            entityattr.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
            break;
          case "RELATIVE_TO_GROUND":
            entityattr.heightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
            break;
          default:
            entityattr.heightReference = value as Cesium.HeightReference;
            break;
        }
        break;

      case "visibleDepth":
        if (value) entityattr.disableDepthTestDistance = 0;
        else entityattr.disableDepthTestDistance = Number.POSITIVE_INFINITY; // Always visible, not obscured by terrain
        break;
    }
  }

  // Font style (italic, bold, etc.)
  const fontStyle =
    (finalStyle.font_style || "normal") +
    " small-caps " +
    (finalStyle.font_weight || "normal") +
    " " +
    (finalStyle.font_size || "25") +
    "px " +
    (finalStyle.font_family || "楷体");
  entityattr.font = fontStyle;

  return entityattr;
}

/**
 * Get entity coordinates
 * @param entity - Cesium entity object
 * @returns Array of Cartesian3 positions
 */
export function getPositions(entity: EntityWithAttribute): Cesium.Cartesian3[] {
  const time = Cesium.JulianDate.now();
  const position = entity.position.getValue(time);
  return position ? [position] : [];
}

/**
 * Get entity coordinates in GeoJSON format
 * @param entity - Cesium entity object
 * @returns Array of coordinate arrays [longitude, latitude, height]
 */
export function getCoordinates(entity: EntityWithAttribute): number[][] {
  const positions = getPositions(entity);
  const coordinates = cartesians2lonlats(positions);
  return coordinates;
}

/**
 * Convert entity to GeoJSON format
 * @param entity - Cesium entity object
 * @returns GeoJSON feature object
 */
export function toGeoJSON(entity: EntityWithAttribute): GeoJSONFeature {
  const coordinates = getCoordinates(entity);
  return {
    type: "Feature",
    properties: entity.attribute || {},
    geometry: { type: "Point", coordinates: coordinates.length > 0 ? coordinates[0] : [] },
  };
}
