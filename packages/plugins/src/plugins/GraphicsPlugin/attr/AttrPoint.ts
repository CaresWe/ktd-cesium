import * as Cesium from "cesium";
import { cartesians2lonlats } from "@ktd-cesium/shared";

// Type definitions
/**
 * 点样式配置接口
 */
export interface PointStyleConfig {
  opacity?: number;
  outlineOpacity?: number;
  scaleByDistance_near?: number;
  scaleByDistance_nearValue?: number;
  scaleByDistance_far?: number;
  scaleByDistance_farValue?: number;
  distanceDisplayCondition_far?: number;
  distanceDisplayCondition_near?: number;
  outlineColor?: string;
  color?: string;
  scaleByDistance?: boolean;
  distanceDisplayCondition?: boolean;
  clampToGround?: boolean;
  heightReference?: string | Cesium.HeightReference;
  visibleDepth?: boolean;
  outline?: boolean;
  pixelSize?: number;
  outlineWidth?: number;
  [key: string]: unknown;
}

/**
 * 点 Entity 属性接口
 */
export interface PointEntityAttr {
  outlineColor?: Cesium.ConstantProperty;
  color?: Cesium.ConstantProperty;
  scaleByDistance?: Cesium.NearFarScalar;
  distanceDisplayCondition?: Cesium.DistanceDisplayCondition;
  heightReference?: Cesium.HeightReference;
  disableDepthTestDistance?: number;
  outlineWidth?: number;
  pixelSize?: number;
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
 * @returns Entity attributes with applied style
 */
export function style2Entity(style?: PointStyleConfig, entityattr?: PointEntityAttr): PointEntityAttr {
  const finalStyle = style || {};

  if (entityattr == null) {
    // Default values
    entityattr = {};
  }

  // Apply Style to Entity
  for (const key in finalStyle) {
    const value = finalStyle[key];
    switch (key) {
      default: // Direct assignment
        entityattr[key] = value;
        break;
      case "opacity": // Skip parameters for extended properties
      case "outlineOpacity":
      case "scaleByDistance_near":
      case "scaleByDistance_nearValue":
      case "scaleByDistance_far":
      case "scaleByDistance_farValue":
      case "distanceDisplayCondition_far":
      case "distanceDisplayCondition_near":
        break;
      case "outlineColor": // Outline color
        entityattr.outlineColor = new Cesium.ConstantProperty(
          Cesium.Color.fromCssColorString((value as string) || "#FFFF00").withAlpha(
            finalStyle.outlineOpacity || finalStyle.opacity || 1.0
          )
        );
        break;
      case "color": // Fill color
        entityattr.color = new Cesium.ConstantProperty(
          Cesium.Color.fromCssColorString((value as string) || "#FFFF00").withAlpha(
            Number(finalStyle.opacity || 1.0)
          )
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

  // When no outline, set width to 0
  if (!finalStyle.outline) entityattr.outlineWidth = 0.0;

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
