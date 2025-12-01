/**
 * 几何计算工具函数
 * 提供矩阵变换、旋转、平移等几何计算功能
 */

import * as Cesium from 'cesium'

// 复用的临时变量，避免频繁创建对象
const matrix3Scratch = new Cesium.Matrix3()
const matrix4Scratch = new Cesium.Matrix4()

/**
 * 通过四元数获取 HeadingPitchRoll
 * @param position 位置
 * @param orientation 方向四元数
 * @param ellipsoid 椭球体（可选）
 * @param fixedFrameTransform 坐标系转换函数（可选）
 * @returns HeadingPitchRoll
 */
export function getHeadingPitchRollByOrientation(
  position: Cesium.Cartesian3,
  orientation: Cesium.Quaternion,
  ellipsoid?: Cesium.Ellipsoid,
  fixedFrameTransform?: Cesium.Transforms.LocalFrameToFixedFrame
): Cesium.HeadingPitchRoll {
  if (!Cesium.defined(orientation) || !Cesium.defined(position)) {
    return new Cesium.HeadingPitchRoll()
  }

  const matrix = Cesium.Matrix4.fromRotationTranslation(
    Cesium.Matrix3.fromQuaternion(orientation, matrix3Scratch),
    position,
    matrix4Scratch
  )
  return getHeadingPitchRollByMatrix(matrix, ellipsoid, fixedFrameTransform)
}

/**
 * 通过矩阵获取 HeadingPitchRoll
 * @param matrix 4x4矩阵
 * @param ellipsoid 椭球体（可选）
 * @param fixedFrameTransform 坐标系转换函数（可选）
 * @param result 结果对象（可选）
 * @returns HeadingPitchRoll
 */
export function getHeadingPitchRollByMatrix(
  matrix: Cesium.Matrix4,
  ellipsoid?: Cesium.Ellipsoid,
  fixedFrameTransform?: Cesium.Transforms.LocalFrameToFixedFrame,
  result?: Cesium.HeadingPitchRoll
): Cesium.HeadingPitchRoll {
  return Cesium.Transforms.fixedFrameToHeadingPitchRoll(matrix, ellipsoid, fixedFrameTransform, result)
}

/**
 * 获取绕中心点旋转后的点
 * @param center 旋转中心点
 * @param point 要旋转的点
 * @param angle 旋转角度（度）
 * @returns 旋转后的新点
 */
export function getRotateCenterPoint(
  center: Cesium.Cartesian3,
  point: Cesium.Cartesian3,
  angle: number
): Cesium.Cartesian3 {
  // 计算中心点在地面的法向量
  const chicB = Cesium.Cartographic.fromCartesian(center)
  chicB.height = 0
  const dB = Cesium.Cartographic.toCartesian(chicB)
  const normaB = Cesium.Cartesian3.normalize(
    Cesium.Cartesian3.subtract(dB, center, new Cesium.Cartesian3()),
    new Cesium.Cartesian3()
  )

  // 根据法向量构建旋转矩阵
  const Q = Cesium.Quaternion.fromAxisAngle(normaB, Cesium.Math.toRadians(angle))
  const m3 = Cesium.Matrix3.fromQuaternion(Q)
  const m4 = Cesium.Matrix4.fromRotationTranslation(m3)

  // 计算 point 相对于 center 的坐标
  const A1 = Cesium.Cartesian3.subtract(point, center, new Cesium.Cartesian3())

  // 应用旋转矩阵
  const p = Cesium.Matrix4.multiplyByPoint(m4, A1, new Cesium.Cartesian3())

  // 得到新点坐标
  return Cesium.Cartesian3.add(p, center, new Cesium.Cartesian3())
}

/**
 * 在直线上获取距离 p1 指定长度的点（朝向 p2 方向）
 * @param p1 起点
 * @param p2 终点
 * @param len 距离长度（米）
 * @param addBS 是否在原距离基础上增加（默认 false）
 * @returns 计算出的点
 */
export function getOnLinePointByLen(
  p1: Cesium.Cartesian3,
  p2: Cesium.Cartesian3,
  len: number,
  addBS?: boolean
): Cesium.Cartesian3 {
  const mtx4 = Cesium.Transforms.eastNorthUpToFixedFrame(p1)
  const mtx4_inverser = Cesium.Matrix4.inverse(mtx4, new Cesium.Matrix4())

  const localP1 = Cesium.Matrix4.multiplyByPoint(mtx4_inverser, p1, new Cesium.Cartesian3())
  const localP2 = Cesium.Matrix4.multiplyByPoint(mtx4_inverser, p2, new Cesium.Cartesian3())

  const direction = Cesium.Cartesian3.subtract(localP2, localP1, new Cesium.Cartesian3())
  const distance = Cesium.Cartesian3.distance(localP1, localP2)

  let scale = len / distance
  if (addBS) scale += 1

  const newP = Cesium.Cartesian3.multiplyByScalar(direction, scale, new Cesium.Cartesian3())
  return Cesium.Matrix4.multiplyByPoint(mtx4, newP, new Cesium.Cartesian3())
}

/**
 * 通过偏移量平移位置
 * @param position 原始位置
 * @param offset 偏移量 {x, y, z}
 * @param degree 旋转角度（度，可选）
 * @param type 旋转轴类型（'x', 'y', 'z'，默认 'z'）
 * @param fixedFrameTransform 坐标系转换函数（可选）
 * @returns 平移后的位置
 */
export function getPositionTranslation(
  position: Cesium.Cartesian3,
  offset: { x?: number; y?: number; z?: number },
  degree?: number,
  type?: string,
  fixedFrameTransform?: Cesium.Transforms.LocalFrameToFixedFrame
): Cesium.Cartesian3 {
  fixedFrameTransform = fixedFrameTransform || Cesium.Transforms.eastNorthUpToFixedFrame

  const rotate = Cesium.Math.toRadians(-(degree ?? 0))
  const axisType = (type || 'z').toUpperCase()

  // 获取旋转轴向量
  let normal: Cesium.Cartesian3
  switch (axisType) {
    case 'X':
      normal = Cesium.Cartesian3.UNIT_X
      break
    case 'Y':
      normal = Cesium.Cartesian3.UNIT_Y
      break
    case 'Z':
    default:
      normal = Cesium.Cartesian3.UNIT_Z
      break
  }

  const quaternion = Cesium.Quaternion.fromAxisAngle(normal, rotate)
  const rotateMatrix3 = Cesium.Matrix3.fromQuaternion(quaternion)

  const pointCartesian3 = new Cesium.Cartesian3(offset.x ?? 0, offset.y ?? 0, offset.z ?? 0)

  const rotateTranslationMatrix4 = Cesium.Matrix4.fromRotationTranslation(rotateMatrix3, Cesium.Cartesian3.ZERO)
  Cesium.Matrix4.multiplyByTranslation(rotateTranslationMatrix4, pointCartesian3, rotateTranslationMatrix4)

  const originPositionCartesian3 = Cesium.Ellipsoid.WGS84.cartographicToCartesian(
    Cesium.Cartographic.fromCartesian(position)
  )
  const originPositionTransform = fixedFrameTransform(originPositionCartesian3)

  Cesium.Matrix4.multiplyTransformation(originPositionTransform, rotateTranslationMatrix4, rotateTranslationMatrix4)

  const pointCartesian = new Cesium.Cartesian3()
  Cesium.Matrix4.getTranslation(rotateTranslationMatrix4, pointCartesian)
  return pointCartesian
}

/**
 * 计算平行线（偏移线）
 * @param positions 原始线的点位数组
 * @param offset 偏移距离（千米，正负值决定偏移方向）
 * @returns 偏移后的线点位数组
 */
export function getOffsetLine(positions: Cesium.Cartesian3[], offset: number): Cesium.Cartesian3[] {
  const arrNew: Cesium.Cartesian3[] = []

  for (let i = 1; i < positions.length; i++) {
    const point1 = positions[i - 1]
    const point2 = positions[i]

    const dir12 = Cesium.Cartesian3.subtract(point1, point2, new Cesium.Cartesian3())
    const dir21left = Cesium.Cartesian3.cross(point1, dir12, new Cesium.Cartesian3())

    const p1offset = computeOffsetPoint(point1, dir21left, offset * 1000)
    const p2offset = computeOffsetPoint(point2, dir21left, offset * 1000)

    if (i === 1) {
      arrNew.push(p1offset)
    }
    arrNew.push(p2offset)
  }

  return arrNew
}

/**
 * 计算偏移点（内部辅助函数）
 * @param origin 原点
 * @param direction 方向
 * @param distance 距离（米）
 * @returns 偏移后的点
 */
function computeOffsetPoint(
  origin: Cesium.Cartesian3,
  direction: Cesium.Cartesian3,
  distance: number
): Cesium.Cartesian3 {
  const ray = new Cesium.Ray(origin, direction)
  return Cesium.Ray.getPoint(ray, distance, new Cesium.Cartesian3())
}

/**
 * 计算质心（中心点）
 * @param positions 位置数组
 * @returns 质心位置
 */
export function centerOfMass(positions: Cesium.Cartesian3[]): Cesium.Cartesian3 {
  try {
    if (!positions || positions.length === 0) {
      throw new Error('位置数组不能为空')
    }

    const center = new Cesium.Cartesian3()
    for (const pos of positions) {
      if (!pos || !(pos instanceof Cesium.Cartesian3)) {
        throw new Error('位置必须是 Cesium.Cartesian3 类型')
      }
      Cesium.Cartesian3.add(center, pos, center)
    }
    Cesium.Cartesian3.divideByScalar(center, positions.length, center)
    return center
  } catch (error) {
    console.error('centerOfMass: 计算质心失败', error)
    // 返回第一个位置作为默认值
    return positions[0] || new Cesium.Cartesian3()
  }
}

/**
 * 计算两点的中点
 * @param p1 点1
 * @param p2 点2
 * @returns 中点
 */
export function getMidpoint(p1: Cesium.Cartesian3, p2: Cesium.Cartesian3): Cesium.Cartesian3 {
  return Cesium.Cartesian3.midpoint(p1, p2, new Cesium.Cartesian3())
}

/**
 * 计算点到直线的垂足
 * @param point 点
 * @param lineStart 直线起点
 * @param lineEnd 直线终点
 * @returns 垂足点
 */
export function getPerpendicularPoint(
  point: Cesium.Cartesian3,
  lineStart: Cesium.Cartesian3,
  lineEnd: Cesium.Cartesian3
): Cesium.Cartesian3 {
  const lineDir = Cesium.Cartesian3.subtract(lineEnd, lineStart, new Cesium.Cartesian3())
  const pointDir = Cesium.Cartesian3.subtract(point, lineStart, new Cesium.Cartesian3())

  const lineMag = Cesium.Cartesian3.magnitude(lineDir)
  const t = Cesium.Cartesian3.dot(pointDir, lineDir) / (lineMag * lineMag)

  const perpDir = Cesium.Cartesian3.multiplyByScalar(lineDir, t, new Cesium.Cartesian3())
  return Cesium.Cartesian3.add(lineStart, perpDir, new Cesium.Cartesian3())
}

/**
 * 计算点到直线的距离
 * @param point 点
 * @param lineStart 直线起点
 * @param lineEnd 直线终点
 * @returns 距离（米）
 */
export function getPointToLineDistance(
  point: Cesium.Cartesian3,
  lineStart: Cesium.Cartesian3,
  lineEnd: Cesium.Cartesian3
): number {
  const perpPoint = getPerpendicularPoint(point, lineStart, lineEnd)
  return Cesium.Cartesian3.distance(point, perpPoint)
}
