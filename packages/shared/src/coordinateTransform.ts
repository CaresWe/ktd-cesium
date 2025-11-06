/**
 * 国内坐标偏移类型
 * 用于处理国内地图服务商使用的加密坐标系
 */
export enum CoordinateOffset {
  /** 无偏移 - 标准 WGS84/CGCS2000 坐标 */
  NONE = 'NONE',
  /** 国测局偏移 - GCJ-02（火星坐标系） */
  GCJ02 = 'GCJ02',
  /** 百度偏移 - BD-09（百度坐标系） */
  BD09 = 'BD09'
}

/**
 * 坐标转换工具
 * 提供 WGS84、GCJ-02、BD-09 之间的相互转换
 */

// 常量定义
const X_PI = (Math.PI * 3000.0) / 180.0
const PI = Math.PI
const A = 6378245.0 // 长半轴
const EE = 0.00669342162296594323 // 偏心率平方

/**
 * 判断坐标是否在中国境内
 */
function isInChina(lng: number, lat: number): boolean {
  return lng >= 72.004 && lng <= 137.8347 && lat >= 0.8293 && lat <= 55.8271
}

/**
 * 计算经度偏移量
 */
function transformLng(lng: number, lat: number): number {
  let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng))
  ret += ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0) / 3.0
  ret += ((20.0 * Math.sin(lng * PI) + 40.0 * Math.sin((lng / 3.0) * PI)) * 2.0) / 3.0
  ret += ((150.0 * Math.sin((lng / 12.0) * PI) + 300.0 * Math.sin((lng / 30.0) * PI)) * 2.0) / 3.0
  return ret
}

/**
 * 计算纬度偏移量
 */
function transformLat(lng: number, lat: number): number {
  let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng))
  ret += ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0) / 3.0
  ret += ((20.0 * Math.sin(lat * PI) + 40.0 * Math.sin((lat / 3.0) * PI)) * 2.0) / 3.0
  ret += ((160.0 * Math.sin((lat / 12.0) * PI) + 320.0 * Math.sin((lat * PI) / 30.0)) * 2.0) / 3.0
  return ret
}

/**
 * WGS84 转 GCJ-02
 * @param lng WGS84 经度
 * @param lat WGS84 纬度
 * @returns [GCJ-02 经度, GCJ-02 纬度]
 */
export function wgs84ToGcj02(lng: number, lat: number): [number, number] {
  if (!isInChina(lng, lat)) {
    return [lng, lat]
  }

  let dLat = transformLat(lng - 105.0, lat - 35.0)
  let dLng = transformLng(lng - 105.0, lat - 35.0)

  const radLat = (lat / 180.0) * PI
  let magic = Math.sin(radLat)
  magic = 1 - EE * magic * magic
  const sqrtMagic = Math.sqrt(magic)

  dLat = (dLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI)
  dLng = (dLng * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * PI)

  const mgLat = lat + dLat
  const mgLng = lng + dLng

  return [mgLng, mgLat]
}

/**
 * GCJ-02 转 WGS84（粗略算法）
 * @param lng GCJ-02 经度
 * @param lat GCJ-02 纬度
 * @returns [WGS84 经度, WGS84 纬度]
 */
export function gcj02ToWgs84(lng: number, lat: number): [number, number] {
  if (!isInChina(lng, lat)) {
    return [lng, lat]
  }

  let dLat = transformLat(lng - 105.0, lat - 35.0)
  let dLng = transformLng(lng - 105.0, lat - 35.0)

  const radLat = (lat / 180.0) * PI
  let magic = Math.sin(radLat)
  magic = 1 - EE * magic * magic
  const sqrtMagic = Math.sqrt(magic)

  dLat = (dLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI)
  dLng = (dLng * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * PI)

  const mgLat = lat - dLat
  const mgLng = lng - dLng

  return [mgLng, mgLat]
}

/**
 * GCJ-02 转 BD-09
 * @param lng GCJ-02 经度
 * @param lat GCJ-02 纬度
 * @returns [BD-09 经度, BD-09 纬度]
 */
export function gcj02ToBd09(lng: number, lat: number): [number, number] {
  const z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * X_PI)
  const theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * X_PI)
  const bdLng = z * Math.cos(theta) + 0.0065
  const bdLat = z * Math.sin(theta) + 0.006
  return [bdLng, bdLat]
}

/**
 * BD-09 转 GCJ-02
 * @param lng BD-09 经度
 * @param lat BD-09 纬度
 * @returns [GCJ-02 经度, GCJ-02 纬度]
 */
export function bd09ToGcj02(lng: number, lat: number): [number, number] {
  const x = lng - 0.0065
  const y = lat - 0.006
  const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * X_PI)
  const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * X_PI)
  const gcjLng = z * Math.cos(theta)
  const gcjLat = z * Math.sin(theta)
  return [gcjLng, gcjLat]
}

/**
 * WGS84 转 BD-09
 * @param lng WGS84 经度
 * @param lat WGS84 纬度
 * @returns [BD-09 经度, BD-09 纬度]
 */
export function wgs84ToBd09(lng: number, lat: number): [number, number] {
  const [gcjLng, gcjLat] = wgs84ToGcj02(lng, lat)
  return gcj02ToBd09(gcjLng, gcjLat)
}

/**
 * BD-09 转 WGS84
 * @param lng BD-09 经度
 * @param lat BD-09 纬度
 * @returns [WGS84 经度, WGS84 纬度]
 */
export function bd09ToWgs84(lng: number, lat: number): [number, number] {
  const [gcjLng, gcjLat] = bd09ToGcj02(lng, lat)
  return gcj02ToWgs84(gcjLng, gcjLat)
}

/**
 * 坐标转换工厂函数
 * 根据源偏移类型和目标偏移类型进行转换
 * @param lng 经度
 * @param lat 纬度
 * @param from 源坐标偏移类型
 * @param to 目标坐标偏移类型
 * @returns [转换后经度, 转换后纬度]
 */
export function transformCoordinate(
  lng: number,
  lat: number,
  from: CoordinateOffset,
  to: CoordinateOffset
): [number, number] {
  // 如果源和目标相同，直接返回
  if (from === to) {
    return [lng, lat]
  }

  // 先将源坐标转换为 WGS84
  let wgs84Coord: [number, number] = [lng, lat]
  if (from === CoordinateOffset.GCJ02) {
    wgs84Coord = gcj02ToWgs84(lng, lat)
  } else if (from === CoordinateOffset.BD09) {
    wgs84Coord = bd09ToWgs84(lng, lat)
  }

  // 再从 WGS84 转换为目标坐标
  if (to === CoordinateOffset.NONE) {
    return wgs84Coord
  } else if (to === CoordinateOffset.GCJ02) {
    return wgs84ToGcj02(wgs84Coord[0], wgs84Coord[1])
  } else if (to === CoordinateOffset.BD09) {
    return wgs84ToBd09(wgs84Coord[0], wgs84Coord[1])
  }

  return wgs84Coord
}
