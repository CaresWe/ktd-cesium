/**
 * Cesium 相关工具函数
 */

import * as Cesium from 'cesium'
import { formatNum } from './format'
import { clone } from './utils'

// ==================== 类型定义 ====================

interface StyleConfig {
  [key: string]: string | number | boolean | undefined
}

interface DefConfigStyle {
  [key: string]: StyleConfig
}

type Coordinates = number[] | number[][] | number[][][]

interface GeoJSONGeometry {
  type: string
  coordinates: Coordinates
}

interface GeoJSONFeature {
  type: string
  geometry?: GeoJSONGeometry
  properties?: {
    type?: string
    edittype?: string
    style?: StyleConfig
    [key: string]: unknown
  }
}

interface PickedObject {
  id?: unknown
  primitive?: unknown
  [key: string]: unknown
}

interface EntityWithShow {
  show?: boolean
  _noMousePosition?: boolean
}

// ==================== 默认样式配置 ====================

const defConfigStyle: DefConfigStyle = {
  "label": { "text": "文字", "color": "#ffffff", "opacity": 1, "font_family": "楷体", "font_size": 30, "border": true, "border_color": "#000000", "border_width": 3, "background": false, "background_color": "#000000", "background_opacity": 0.5, "font_weight": "normal", "font_style": "normal", "scaleByDistance": false, "scaleByDistance_far": 1000000, "scaleByDistance_farValue": 0.1, "scaleByDistance_near": 1000, "scaleByDistance_nearValue": 1, "distanceDisplayCondition": false, "distanceDisplayCondition_far": 10000, "distanceDisplayCondition_near": 0, "clampToGround": false, "visibleDepth": true },
  "point": { "pixelSize": 10, "color": "#3388ff", "opacity": 1, "outline": true, "outlineColor": "#ffffff", "outlineOpacity": 0.6, "outlineWidth": 2, "scaleByDistance": false, "scaleByDistance_far": 1000000, "scaleByDistance_farValue": 0.1, "scaleByDistance_near": 1000, "scaleByDistance_nearValue": 1, "distanceDisplayCondition": false, "distanceDisplayCondition_far": 10000, "distanceDisplayCondition_near": 0, "clampToGround": false, "visibleDepth": true },
  "billboard": { "opacity": 1, "scale": 1, "rotation": 0, "horizontalOrigin": "CENTER", "verticalOrigin": "BOTTOM", "scaleByDistance": false, "scaleByDistance_far": 1000000, "scaleByDistance_farValue": 0.1, "scaleByDistance_near": 1000, "scaleByDistance_nearValue": 1, "distanceDisplayCondition": false, "distanceDisplayCondition_far": 10000, "distanceDisplayCondition_near": 0, "clampToGround": false, "visibleDepth": true },
  "font-point": { "iconClass": "fa fa-automobile", "iconSize": 50, "color": "#00ffff", "opacity": 1, "horizontalOrigin": "CENTER", "verticalOrigin": "CENTER", "rotation": 0, "scaleByDistance": false, "scaleByDistance_far": 1000000, "scaleByDistance_farValue": 0.1, "scaleByDistance_near": 1000, "scaleByDistance_nearValue": 1, "distanceDisplayCondition": false, "distanceDisplayCondition_far": 10000, "distanceDisplayCondition_near": 0, "clampToGround": false, "visibleDepth": true },
  "model": { "scale": 1, "heading": 0, "pitch": 0, "roll": 0, "fill": false, "color": "#3388ff", "opacity": 1, "silhouette": false, "silhouetteColor": "#ffffff", "silhouetteSize": 2, "silhouetteAlpha": 0.8, "clampToGround": false },
  "polyline": { "lineType": "solid", "animationDuration": 1000, "animationImage": "img/textures/lineClr.png", "color": "#3388ff", "width": 4, "clampToGround": false, "outline": false, "outlineColor": "#ffffff", "outlineWidth": 2, "depthFail": false, "depthFailColor": "#ff0000", "depthFailOpacity": 0.2, "opacity": 1, "zIndex": 0 },
  "polylineVolume": { "color": "#00FF00", "radius": 10, "shape": "pipeline", "outline": false, "outlineColor": "#ffffff", "opacity": 1 },
  "wall": { "extrudedHeight": 50, "fill": true, "fillType": "color", "animationDuration": 1000, "animationImage": "img/textures/fence.png", "animationRepeatX": 1, "animationAxisY": false, "grid_lineCount": 8, "grid_lineThickness": 2, "grid_cellAlpha": 0.1, "stripe_oddcolor": "#ffffff", "stripe_repeat": 6, "checkerboard_oddcolor": "#ffffff", "checkerboard_repeat": 4, "color": "#00FF00", "opacity": 0.6, "outline": true, "outlineWidth": 1, "outlineColor": "#ffffff", "outlineOpacity": 0.6 },
  "corridor": { "height": 0, "width": 100, "cornerType": "ROUNDED", "fillType": "color", "grid_lineCount": 8, "grid_lineThickness": 2, "grid_cellAlpha": 0.1, "color": "#3388ff", "opacity": 0.6, "clampToGround": false, "zIndex": 0 },
  "extrudedCorridor": { "height": 0, "extrudedHeight": 50, "width": 100, "cornerType": "ROUNDED", "fillType": "color", "grid_lineCount": 8, "grid_lineThickness": 2, "grid_cellAlpha": 0.1, "color": "#00FF00", "opacity": 0.6, "clampToGround": false, "zIndex": 0 },
  "polygon": { "fill": true, "fillType": "color", "grid_lineCount": 8, "grid_lineThickness": 2, "grid_cellAlpha": 0.1, "stripe_oddcolor": "#ffffff", "stripe_repeat": 6, "checkerboard_oddcolor": "#ffffff", "checkerboard_repeat": 4, "color": "#3388ff", "opacity": 0.6, "stRotation": 0, "outline": true, "outlineWidth": 1, "outlineColor": "#ffffff", "outlineOpacity": 0.6, "clampToGround": false, "zIndex": 0 },
  "polygon_clampToGround": { "fillType": "color", "grid_lineCount": 8, "grid_lineThickness": 2, "grid_cellAlpha": 0.1, "stripe_oddcolor": "#ffffff", "stripe_repeat": 6, "checkerboard_oddcolor": "#ffffff", "checkerboard_repeat": 4, "color": "#ffff00", "opacity": 0.6, "stRotation": 0, "clampToGround": true, "zIndex": 0 },
  "extrudedPolygon": { "extrudedHeight": 100, "fillType": "color", "grid_lineCount": 8, "grid_lineThickness": 2, "grid_cellAlpha": 0.1, "stripe_oddcolor": "#ffffff", "stripe_repeat": 6, "checkerboard_oddcolor": "#ffffff", "checkerboard_repeat": 4, "color": "#00FF00", "opacity": 0.6, "stRotation": 0, "outline": true, "outlineWidth": 1, "outlineColor": "#ffffff", "outlineOpacity": 0.6, "perPositionHeight": true, "zIndex": 0 },
  "rectangle": { "height": 0, "fill": true, "fillType": "color", "grid_lineCount": 8, "grid_lineThickness": 2, "grid_cellAlpha": 0.1, "stripe_oddcolor": "#ffffff", "stripe_repeat": 6, "checkerboard_oddcolor": "#ffffff", "checkerboard_repeat": 4, "color": "#3388ff", "opacity": 0.6, "outline": true, "outlineWidth": 1, "outlineColor": "#ffffff", "outlineOpacity": 0.6, "rotation": 0, "stRotation": 0, "clampToGround": false, "zIndex": 0 },
  "rectangleImg": { "opacity": 1, "rotation": 0, "clampToGround": true, "zIndex": 0 },
  "extrudedRectangle": { "extrudedHeight": 100, "height": 0, "fill": true, "fillType": "color", "grid_lineCount": 8, "grid_lineThickness": 2, "grid_cellAlpha": 0.1, "stripe_oddcolor": "#ffffff", "stripe_repeat": 6, "checkerboard_oddcolor": "#ffffff", "checkerboard_repeat": 4, "color": "#00FF00", "opacity": 0.6, "outline": true, "outlineWidth": 1, "outlineColor": "#ffffff", "outlineOpacity": 0.6, "rotation": 0, "stRotation": 0, "zIndex": 0 },
  "circle": { "radius": 100, "height": 0, "fill": true, "fillType": "color", "animationDuration": 1000, "animationCount": 1, "animationGradient": 0.1, "grid_lineCount": 8, "grid_lineThickness": 2, "grid_cellAlpha": 0.1, "stripe_oddcolor": "#ffffff", "stripe_repeat": 6, "checkerboard_oddcolor": "#ffffff", "checkerboard_repeat": 4, "color": "#3388ff", "opacity": 0.6, "stRotation": 0, "outline": true, "outlineWidth": 1, "outlineColor": "#ffffff", "outlineOpacity": 0.6, "rotation": 0, "clampToGround": false, "zIndex": 0 },
  "circle_clampToGround": { "radius": 100, "fillType": "color", "animationDuration": 1000, "animationCount": 1, "animationGradient": 0.1, "grid_lineCount": 8, "grid_lineThickness": 2, "grid_cellAlpha": 0.1, "stripe_oddcolor": "#ffffff", "stripe_repeat": 6, "checkerboard_oddcolor": "#ffffff", "checkerboard_repeat": 4, "color": "#ffff00", "opacity": 0.6, "stRotation": 0, "rotation": 0, "clampToGround": true, "zIndex": 0 },
  "extrudedCircle": { "radius": 100, "extrudedHeight": 100, "height": 0, "fill": true, "fillType": "color", "animationDuration": 1000, "animationCount": 1, "animationGradient": 0.1, "grid_lineCount": 8, "grid_lineThickness": 2, "grid_cellAlpha": 0.1, "stripe_oddcolor": "#ffffff", "stripe_repeat": 6, "checkerboard_oddcolor": "#ffffff", "checkerboard_repeat": 4, "color": "#00FF00", "opacity": 0.6, "stRotation": 0, "outline": true, "outlineWidth": 1, "outlineColor": "#ffffff", "outlineOpacity": 0.6, "rotation": 0, "zIndex": 0 },
  "ellipse": { "semiMinorAxis": 100, "semiMajorAxis": 100, "height": 0, "fill": true, "fillType": "color", "animationDuration": 1000, "animationCount": 1, "animationGradient": 0.1, "grid_lineCount": 8, "grid_lineThickness": 2, "grid_cellAlpha": 0.1, "stripe_oddcolor": "#ffffff", "stripe_repeat": 6, "checkerboard_oddcolor": "#ffffff", "checkerboard_repeat": 4, "color": "#3388ff", "opacity": 0.6, "stRotation": 0, "outline": true, "outlineWidth": 1, "outlineColor": "#ffffff", "outlineOpacity": 0.6, "rotation": 0, "clampToGround": false, "zIndex": 0 },
  "ellipse_clampToGround": { "semiMinorAxis": 100, "semiMajorAxis": 100, "fillType": "color", "animationDuration": 1000, "animationCount": 1, "animationGradient": 0.1, "grid_lineCount": 8, "grid_lineThickness": 2, "grid_cellAlpha": 0.1, "stripe_oddcolor": "#ffffff", "stripe_repeat": 6, "checkerboard_oddcolor": "#ffffff", "checkerboard_repeat": 4, "color": "#ffff00", "opacity": 0.6, "stRotation": 0, "rotation": 0, "clampToGround": true, "zIndex": 0 },
  "extrudedEllipse": { "semiMinorAxis": 100, "semiMajorAxis": 100, "extrudedHeight": 100, "height": 0, "fill": true, "fillType": "color", "animationDuration": 1000, "animationCount": 1, "animationGradient": 0.1, "grid_lineCount": 8, "grid_lineThickness": 2, "grid_cellAlpha": 0.1, "stripe_oddcolor": "#ffffff", "stripe_repeat": 6, "checkerboard_oddcolor": "#ffffff", "checkerboard_repeat": 4, "color": "#00FF00", "opacity": 0.6, "stRotation": 0, "outline": true, "outlineWidth": 1, "outlineColor": "#ffffff", "outlineOpacity": 0.6, "rotation": 0, "zIndex": 0 },
  "cylinder": { "topRadius": 0, "bottomRadius": 100, "length": 100, "fill": true, "fillType": "color", "animationDuration": 1000, "animationCount": 1, "animationGradient": 0.1, "color": "#00FF00", "opacity": 0.6, "outline": false, "outlineWidth": 1, "outlineColor": "#ffffff", "outlineOpacity": 0.6 },
  "ellipsoid": { "extentRadii": 100, "widthRadii": 100, "heightRadii": 100, "fill": true, "fillType": "color", "grid_lineCount": 8, "grid_lineThickness": 2, "grid_cellAlpha": 0.1, "stripe_oddcolor": "#ffffff", "stripe_repeat": 6, "checkerboard_oddcolor": "#ffffff", "checkerboard_repeat": 4, "color": "#00FF00", "opacity": 0.6, "outline": true, "outlineWidth": 1, "outlineColor": "#ffffff", "outlineOpacity": 0.6 },
  "plane": { "dimensionsX": 100, "dimensionsY": 100, "plane_normal": "z", "plane_distance": 0, "fill": true, "fillType": "color", "grid_lineCount": 8, "grid_lineThickness": 2, "grid_cellAlpha": 0.1, "stripe_oddcolor": "#ffffff", "stripe_repeat": 6, "checkerboard_oddcolor": "#ffffff", "checkerboard_repeat": 4, "color": "#00FF00", "opacity": 0.6, "outline": true, "outlineWidth": 1, "outlineColor": "#ffffff", "outlineOpacity": 0.6, "distanceDisplayCondition": false, "distanceDisplayCondition_far": 10000, "distanceDisplayCondition_near": 0 },
  "box": { "dimensionsX": 100, "dimensionsY": 100, "dimensionsZ": 100, "fill": true, "fillType": "color", "grid_lineCount": 8, "grid_lineThickness": 2, "grid_cellAlpha": 0.1, "stripe_oddcolor": "#ffffff", "stripe_repeat": 6, "checkerboard_oddcolor": "#ffffff", "checkerboard_repeat": 4, "color": "#00FF00", "opacity": 0.6, "outline": true, "outlineWidth": 1, "outlineColor": "#ffffff", "outlineOpacity": 0.6, "distanceDisplayCondition": false, "distanceDisplayCondition_far": 10000, "distanceDisplayCondition_near": 0, "clampToGround": false }
}

defConfigStyle.imagepoint = defConfigStyle.billboard
defConfigStyle.ellipse = defConfigStyle.circle

export { defConfigStyle }

// ==================== GeoJSON 处理 ====================

/**
 * 移除 GeoJSON 中与默认值相同的属性
 */
export function removeGeoJsonDefVal(geojson: GeoJSONFeature): GeoJSONFeature {
  if (!geojson.properties || !geojson.properties.type) return geojson

  const type = geojson.properties.edittype || geojson.properties.type
  const defStyle = defConfigStyle[type]
  if (!defStyle) return geojson

  const newgeojson = clone(geojson)
  if (geojson.properties.style) {
    const newstyle: StyleConfig = {}
    for (const i in geojson.properties.style) {
      const val = geojson.properties.style[i]
      if (!Cesium.defined(val)) continue

      const valDef = defStyle[i]
      if (valDef === val) continue
      newstyle[i] = val
    }
    newgeojson.properties!.style = newstyle
  }

  return newgeojson
}

/**
 * 为 GeoJSON 属性添加默认值
 */
export function addGeoJsonDefVal(properties: GeoJSONFeature['properties']): GeoJSONFeature['properties'] {
  if (!properties) return properties

  const defStyle = defConfigStyle[properties.edittype || properties.type || '']
  if (defStyle) {
    properties.style = properties.style || {}
    for (const key in defStyle) {
      const val = properties.style[key]
      if (Cesium.defined(val)) continue

      properties.style[key] = defStyle[key]
    }
  }
  return properties
}

/**
 * 获取默认样式
 */
export function getDefStyle(type: string, style?: StyleConfig): StyleConfig {
  style = style || {}
  const defStyle = defConfigStyle[type]
  if (defStyle) {
    for (const key in defStyle) {
      const val = style[key]
      if (val != null) continue

      style[key] = defStyle[key]
    }
  }
  return clone(style)
}

/**
 * 根据 GeoJSON 获取位置
 * @param geojson GeoJSON Feature 或 Geometry 对象
 * @param defHeight 默认高度（可选）
 * @returns Cartesian3 坐标或坐标数组，解析失败返回 null
 */
export function getPositionByGeoJSON(geojson: GeoJSONFeature | GeoJSONGeometry, defHeight?: number): Cesium.Cartesian3 | Cesium.Cartesian3[] | null {
  try {
    // 提取 geometry 对象
    const geometry = (geojson as GeoJSONFeature).type === 'Feature'
      ? (geojson as GeoJSONFeature).geometry
      : geojson as GeoJSONGeometry

    if (!geometry) {
      console.warn('getPositionByGeoJSON: geometry is undefined')
      return null
    }

    if (!geometry.type) {
      console.warn('getPositionByGeoJSON: geometry.type is missing')
      return null
    }

    const coords = geometry.coordinates

    if (!coords) {
      console.warn('getPositionByGeoJSON: coordinates are undefined')
      return null
    }

    // 根据几何类型处理坐标
    switch (geometry.type) {
      case 'Point':
        if (!Array.isArray(coords) || coords.length < 2) {
          console.warn('getPositionByGeoJSON: invalid Point coordinates')
          return null
        }
        return lonlat2cartesian(coords as unknown as number[], defHeight)

      case 'MultiPoint':
      case 'LineString':
        if (!Array.isArray(coords) || coords.length === 0) {
          console.warn(`getPositionByGeoJSON: invalid ${geometry.type} coordinates`)
          return null
        }
        return lonlats2cartesians(coords as unknown as number[][], defHeight)

      case 'MultiLineString':
      case 'Polygon':
        if (!Array.isArray(coords) || coords.length === 0 || !Array.isArray(coords[0])) {
          console.warn(`getPositionByGeoJSON: invalid ${geometry.type} coordinates`)
          return null
        }
        return lonlats2cartesians((coords as unknown as number[][][])[0], defHeight)

      case 'MultiPolygon':
        if (!Array.isArray(coords) || coords.length === 0 ||
            !Array.isArray(coords[0]) || coords[0].length === 0 ||
            !Array.isArray(coords[0][0])) {
          console.warn('getPositionByGeoJSON: invalid MultiPolygon coordinates')
          return null
        }
        return lonlats2cartesians((coords as unknown as number[][][][])[0][0], defHeight)

      default:
        console.warn(`getPositionByGeoJSON: unsupported geometry type: ${geometry.type}`)
        return null
    }
  } catch (error) {
    console.error('getPositionByGeoJSON: error parsing GeoJSON', error)
    return null
  }
}

// ==================== 坐标转换（内部辅助函数） ====================
// 注意: 公共的坐标转换函数请使用 coordinateTransform 模块

function lonlat2cartesian(coords: number[], defHeight?: number): Cesium.Cartesian3 {
  const lon = coords[0]
  const lat = coords[1]
  const height = coords[2] !== undefined ? coords[2] : (defHeight || 0)
  return Cesium.Cartesian3.fromDegrees(lon, lat, height)
}

function lonlats2cartesians(coords: number[][], defHeight?: number): Cesium.Cartesian3[] {
  return coords.map(coord => lonlat2cartesian(coord, defHeight))
}

/**
 * 格式化位置为可读格式
 */
export function formatPosition(position: Cesium.Cartesian3): { x: number; y: number; z: number } | null {
  if (!position) return null
  const carto = Cesium.Cartographic.fromCartesian(position)
  return {
    y: formatNum(Cesium.Math.toDegrees(carto.latitude), 6),
    x: formatNum(Cesium.Math.toDegrees(carto.longitude), 6),
    z: formatNum(carto.height, 2)
  }
}

// ==================== 鼠标位置拾取 ====================

/**
 * 获取当前鼠标在 3D 场景中的位置
 */
export function getCurrentMousePosition(
  scene: Cesium.Scene,
  position: Cesium.Cartesian2,
  noPickEntity?: unknown
): Cesium.Cartesian3 | undefined {
  let cartesian: Cesium.Cartesian3 | undefined

  let pickedObject: PickedObject | undefined
  try {
    pickedObject = scene.pick(position, 5, 5) as PickedObject | undefined
  } catch (e) {
    console.log("scene.pick exception when picking position")
  }

  if (scene.pickPositionSupported && Cesium.defined(pickedObject)) {
    const pcEntity = hasPickedModel(pickedObject!, noPickEntity)
    if (pcEntity) {
      if (pcEntity.show) {
        pcEntity.show = false
        cartesian = getCurrentMousePosition(scene, position, noPickEntity)
        pcEntity.show = true
        if (cartesian) {
          return cartesian
        } else {
          console.log("Picked the excluded noPickEntity model")
        }
      }
    } else {
      cartesian = scene.pickPosition(position)
      if (Cesium.defined(cartesian)) {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian!)
        if (cartographic.height >= 0) return cartesian

        if (!Cesium.defined(pickedObject!.id) && cartographic.height >= -500) return cartesian
        console.log("scene.pickPosition picked model with abnormal height value: " + cartographic.height)
      }
    }
  }

  // SuperMap S3M 数据拾取
  if (Cesium.defined((Cesium as unknown as Record<string, unknown>).S3MTilesLayer)) {
    cartesian = scene.pickPosition(position)
    if (Cesium.defined(cartesian)) {
      return cartesian
    }
  }

  if ((scene as unknown as Record<string, unknown>).onlyPickModelPosition) return cartesian

  // 提取鼠标点的地理坐标
  if (scene.mode === Cesium.SceneMode.SCENE3D) {
    const pickRay = scene.camera.getPickRay(position)
    cartesian = scene.globe.pick(pickRay!, scene)
  } else {
    cartesian = scene.camera.pickEllipsoid(position, scene.globe.ellipsoid)
  }

  if (Cesium.defined(cartesian) && scene.camera.positionCartographic.height < 10000) {
    const cartographic = Cesium.Cartographic.fromCartesian(cartesian!)
    if (cartographic.height < -5000) return undefined
  }

  return cartesian
}

function hasPickedModel(pickedObject: PickedObject, noPickEntity?: unknown): EntityWithShow | null {
  if (Cesium.defined(pickedObject.id)) {
    const entity = pickedObject.id as EntityWithShow
    if (entity._noMousePosition) return entity
    if (noPickEntity && entity === noPickEntity) return entity
  }

  if (Cesium.defined(pickedObject.primitive)) {
    const primitive = pickedObject.primitive as EntityWithShow
    if (primitive._noMousePosition) return primitive
    if (noPickEntity && primitive === noPickEntity) return primitive
  }

  return null
}
