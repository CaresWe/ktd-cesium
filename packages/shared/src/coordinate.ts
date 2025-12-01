import { Cartesian3, Cartographic, EllipsoidGeodesic, Math as CesiumMath } from 'cesium'

/**
 * 经纬度转笛卡尔坐标
 * @param longitude 经度
 * @param latitude 纬度
 * @param height 高度（米）
 */
export function degreesToCartesian(longitude: number, latitude: number, height: number = 0): Cartesian3 {
  return Cartesian3.fromDegrees(longitude, latitude, height)
}

/**
 * 笛卡尔坐标转经纬度
 * @param cartesian 笛卡尔坐标
 */
export function cartesianToDegrees(cartesian: Cartesian3): { longitude: number; latitude: number; height: number } {
  const cartographic = Cartographic.fromCartesian(cartesian)

  return {
    longitude: CesiumMath.toDegrees(cartographic.longitude),
    latitude: CesiumMath.toDegrees(cartographic.latitude),
    height: cartographic.height
  }
}

/**
 * 弧度转角度
 * @param radians 弧度
 */
export function radiansToDegrees(radians: number): number {
  return CesiumMath.toDegrees(radians)
}

/**
 * 角度转弧度
 * @param degrees 角度
 */
export function degreesToRadians(degrees: number): number {
  return CesiumMath.toRadians(degrees)
}

/**
 * 计算两点之间的距离（米）
 * @param pos1 第一个点的经纬度
 * @param pos2 第二个点的经纬度
 */
export function calculateDistance(
  pos1: { longitude: number; latitude: number },
  pos2: { longitude: number; latitude: number }
): number {
  const cartographic1 = Cartographic.fromDegrees(pos1.longitude, pos1.latitude)
  const cartographic2 = Cartographic.fromDegrees(pos2.longitude, pos2.latitude)

  const geodesic = new EllipsoidGeodesic(cartographic1, cartographic2)

  return geodesic.surfaceDistance
}
