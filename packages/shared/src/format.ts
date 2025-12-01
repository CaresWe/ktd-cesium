/**
 * 格式化数字，保留指定小数位数
 * @param num 数字
 * @param digits 小数位数（默认 0）
 * @returns 格式化后的数字
 */
export function formatNum(num: number, digits: number = 0): number {
  return Number(num.toFixed(digits))
}

/**
 * 格式化坐标显示
 * @param longitude 经度
 * @param latitude 纬度
 * @param precision 精度（小数位数）
 */
export function formatCoordinate(longitude: number, latitude: number, precision: number = 6): string {
  const lon = longitude.toFixed(precision)
  const lat = latitude.toFixed(precision)
  const lonDir = longitude >= 0 ? 'E' : 'W'
  const latDir = latitude >= 0 ? 'N' : 'S'

  return `${Math.abs(parseFloat(lat))}°${latDir}, ${Math.abs(parseFloat(lon))}°${lonDir}`
}

/**
 * 格式化距离显示
 * @param meters 米
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters.toFixed(2)} m`
  } else if (meters < 1000000) {
    return `${(meters / 1000).toFixed(2)} km`
  } else {
    return `${(meters / 1000000).toFixed(2)} Mm`
  }
}

/**
 * 格式化面积显示
 * @param squareMeters 平方米
 */
export function formatArea(squareMeters: number): string {
  if (squareMeters < 10000) {
    return `${squareMeters.toFixed(2)} m²`
  } else if (squareMeters < 1000000) {
    return `${(squareMeters / 10000).toFixed(2)} ha`
  } else {
    return `${(squareMeters / 1000000).toFixed(2)} km²`
  }
}

/**
 * 格式化高度显示
 * @param meters 米
 */
export function formatHeight(meters: number): string {
  if (Math.abs(meters) < 1000) {
    return `${meters.toFixed(2)} m`
  } else {
    return `${(meters / 1000).toFixed(2)} km`
  }
}

/**
 * 格式化角度显示
 * @param degrees 角度
 */
export function formatAngle(degrees: number): string {
  return `${degrees.toFixed(2)}°`
}
