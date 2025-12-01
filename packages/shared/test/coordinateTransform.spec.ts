import { describe, it, expect } from 'vitest'
import { Cartesian3 } from 'cesium'
import {
  CoordinateOffset,
  wgs84ToGcj02,
  gcj02ToWgs84,
  gcj02ToBd09,
  bd09ToGcj02,
  wgs84ToBd09,
  bd09ToWgs84,
  transformCoordinate,
  cartesians2lonlats,
  cartesian2lonlat,
  lonlats2cartesians,
  lonlat2cartesian
} from '../src/coordinateTransform'

describe('coordinateTransform', () => {
  // ==================== CoordinateOffset 枚举 ====================
  describe('CoordinateOffset', () => {
    it('should have correct enum values', () => {
      expect(CoordinateOffset.NONE).toBe('NONE')
      expect(CoordinateOffset.GCJ02).toBe('GCJ02')
      expect(CoordinateOffset.BD09).toBe('BD09')
    })
  })

  // ==================== WGS84 转 GCJ-02 ====================
  describe('wgs84ToGcj02', () => {
    it('should convert WGS84 to GCJ-02 for coordinates in China', () => {
      // 北京天安门广场坐标
      const [lng, lat] = wgs84ToGcj02(116.391, 39.907)

      // GCJ-02 应该有偏移
      expect(lng).not.toBe(116.391)
      expect(lat).not.toBe(39.907)
      expect(lng).toBeCloseTo(116.391, 0) // 大致在附近
      expect(lat).toBeCloseTo(39.907, 0)
    })

    it('should not convert coordinates outside China', () => {
      // 纽约坐标（不在中国）
      const [lng, lat] = wgs84ToGcj02(-74.006, 40.7128)

      expect(lng).toBe(-74.006)
      expect(lat).toBe(40.7128)
    })

    it('should handle edge cases at China border', () => {
      // 测试中国边界附近的点
      const [lng, lat] = wgs84ToGcj02(73, 40)
      expect(lng).toBeCloseTo(73, 1)
      expect(lat).toBeCloseTo(40, 1)
    })
  })

  // ==================== GCJ-02 转 WGS84 ====================
  describe('gcj02ToWgs84', () => {
    it('should convert GCJ-02 to WGS84', () => {
      // 先转换一次
      const [gcjLng, gcjLat] = wgs84ToGcj02(116.391, 39.907)
      // 再转换回来
      const [wgs84Lng, wgs84Lat] = gcj02ToWgs84(gcjLng, gcjLat)

      // 应该近似还原（粗略算法会有误差）
      expect(wgs84Lng).toBeCloseTo(116.391, 2)
      expect(wgs84Lat).toBeCloseTo(39.907, 2)
    })

    it('should not convert coordinates outside China', () => {
      const [lng, lat] = gcj02ToWgs84(-74.006, 40.7128)

      expect(lng).toBe(-74.006)
      expect(lat).toBe(40.7128)
    })
  })

  // ==================== GCJ-02 转 BD-09 ====================
  describe('gcj02ToBd09', () => {
    it('should convert GCJ-02 to BD-09', () => {
      const [bdLng, bdLat] = gcj02ToBd09(116.404, 39.915)

      // BD-09 应该有额外偏移
      expect(bdLng).not.toBe(116.404)
      expect(bdLat).not.toBe(39.915)
      expect(bdLng).toBeCloseTo(116.41, 1)
      expect(bdLat).toBeCloseTo(39.92, 1)
    })

    it('should handle zero coordinates', () => {
      const [bdLng, bdLat] = gcj02ToBd09(0, 0)

      expect(bdLng).toBeCloseTo(0.0065, 4)
      expect(bdLat).toBeCloseTo(0.006, 4)
    })
  })

  // ==================== BD-09 转 GCJ-02 ====================
  describe('bd09ToGcj02', () => {
    it('should convert BD-09 to GCJ-02', () => {
      // 先转换一次
      const [bdLng, bdLat] = gcj02ToBd09(116.404, 39.915)
      // 再转换回来
      const [gcjLng, gcjLat] = bd09ToGcj02(bdLng, bdLat)

      expect(gcjLng).toBeCloseTo(116.404, 5)
      expect(gcjLat).toBeCloseTo(39.915, 5)
    })

    it('should handle round-trip conversion', () => {
      const original = [120.5, 30.5]
      const bd09 = gcj02ToBd09(original[0], original[1])
      const gcj02 = bd09ToGcj02(bd09[0], bd09[1])

      expect(gcj02[0]).toBeCloseTo(original[0], 5)
      expect(gcj02[1]).toBeCloseTo(original[1], 5)
    })
  })

  // ==================== WGS84 转 BD-09 ====================
  describe('wgs84ToBd09', () => {
    it('should convert WGS84 to BD-09 for coordinates in China', () => {
      const [bdLng, bdLat] = wgs84ToBd09(116.391, 39.907)

      expect(bdLng).not.toBe(116.391)
      expect(bdLat).not.toBe(39.907)
      expect(bdLng).toBeCloseTo(116.391, 0)
      expect(bdLat).toBeCloseTo(39.907, 0)
    })

    it('should not convert coordinates outside China', () => {
      const [lng, lat] = wgs84ToBd09(-74.006, 40.7128)

      // 即使在中国外，也会经过 gcj02ToBd09 的偏移
      expect(lng).not.toBe(-74.006)
      expect(lat).not.toBe(40.7128)
    })
  })

  // ==================== BD-09 转 WGS84 ====================
  describe('bd09ToWgs84', () => {
    it('should convert BD-09 to WGS84', () => {
      const [bdLng, bdLat] = wgs84ToBd09(116.391, 39.907)
      const [wgs84Lng, wgs84Lat] = bd09ToWgs84(bdLng, bdLat)

      expect(wgs84Lng).toBeCloseTo(116.391, 2)
      expect(wgs84Lat).toBeCloseTo(39.907, 2)
    })
  })

  // ==================== 坐标转换工厂函数 ====================
  describe('transformCoordinate', () => {
    it('should return same coordinates if from equals to', () => {
      const [lng, lat] = transformCoordinate(116.391, 39.907, CoordinateOffset.NONE, CoordinateOffset.NONE)

      expect(lng).toBe(116.391)
      expect(lat).toBe(39.907)
    })

    it('should convert from NONE to GCJ02', () => {
      const [lng, lat] = transformCoordinate(116.391, 39.907, CoordinateOffset.NONE, CoordinateOffset.GCJ02)

      expect(lng).not.toBe(116.391)
      expect(lat).not.toBe(39.907)
    })

    it('should convert from NONE to BD09', () => {
      const [lng, lat] = transformCoordinate(116.391, 39.907, CoordinateOffset.NONE, CoordinateOffset.BD09)

      expect(lng).not.toBe(116.391)
      expect(lat).not.toBe(39.907)
    })

    it('should convert from GCJ02 to NONE', () => {
      const [gcjLng, gcjLat] = wgs84ToGcj02(116.391, 39.907)
      const [lng, lat] = transformCoordinate(gcjLng, gcjLat, CoordinateOffset.GCJ02, CoordinateOffset.NONE)

      expect(lng).toBeCloseTo(116.391, 2)
      expect(lat).toBeCloseTo(39.907, 2)
    })

    it('should convert from GCJ02 to BD09', () => {
      const [lng, lat] = transformCoordinate(116.404, 39.915, CoordinateOffset.GCJ02, CoordinateOffset.BD09)

      expect(lng).not.toBe(116.404)
      expect(lat).not.toBe(39.915)
    })

    it('should convert from BD09 to NONE', () => {
      const [bdLng, bdLat] = wgs84ToBd09(116.391, 39.907)
      const [lng, lat] = transformCoordinate(bdLng, bdLat, CoordinateOffset.BD09, CoordinateOffset.NONE)

      expect(lng).toBeCloseTo(116.391, 2)
      expect(lat).toBeCloseTo(39.907, 2)
    })

    it('should convert from BD09 to GCJ02', () => {
      const [bdLng, bdLat] = gcj02ToBd09(116.404, 39.915)
      const [lng, lat] = transformCoordinate(bdLng, bdLat, CoordinateOffset.BD09, CoordinateOffset.GCJ02)

      expect(lng).toBeCloseTo(116.404, 5)
      expect(lat).toBeCloseTo(39.915, 5)
    })
  })

  // ==================== Cartesian3 与经纬度数组转换 ====================
  describe('cartesians2lonlats', () => {
    it('should convert Cartesian3 array to lonlat array', () => {
      const cartesians = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(121.473, 31.23, 200)]

      const lonlats = cartesians2lonlats(cartesians)

      expect(lonlats).toHaveLength(2)
      expect(lonlats[0][0]).toBeCloseTo(116.391, 4)
      expect(lonlats[0][1]).toBeCloseTo(39.907, 4)
      expect(lonlats[0][2]).toBeCloseTo(100, 1)
      expect(lonlats[1][0]).toBeCloseTo(121.473, 4)
      expect(lonlats[1][1]).toBeCloseTo(31.23, 4)
      expect(lonlats[1][2]).toBeCloseTo(200, 1)
    })

    it('should return empty array for empty input', () => {
      expect(cartesians2lonlats([])).toEqual([])
    })

    it('should return empty array for null input', () => {
      expect(cartesians2lonlats(null as unknown as Cartesian3[])).toEqual([])
    })
  })

  describe('cartesian2lonlat', () => {
    it('should convert single Cartesian3 to lonlat array', () => {
      const cartesian = Cartesian3.fromDegrees(116.391, 39.907, 100)
      const lonlat = cartesian2lonlat(cartesian)

      expect(lonlat).toHaveLength(3)
      expect(lonlat[0]).toBeCloseTo(116.391, 4)
      expect(lonlat[1]).toBeCloseTo(39.907, 4)
      expect(lonlat[2]).toBeCloseTo(100, 1)
    })

    it('should handle zero height', () => {
      const cartesian = Cartesian3.fromDegrees(0, 0, 0)
      const lonlat = cartesian2lonlat(cartesian)

      expect(lonlat[0]).toBeCloseTo(0, 5)
      expect(lonlat[1]).toBeCloseTo(0, 5)
      expect(lonlat[2]).toBeCloseTo(0, 1)
    })
  })

  describe('lonlats2cartesians', () => {
    it('should convert lonlat array to Cartesian3 array', () => {
      const lonlats = [
        [116.391, 39.907, 100],
        [121.473, 31.23, 200]
      ]

      const cartesians = lonlats2cartesians(lonlats)

      expect(cartesians).toHaveLength(2)
      expect(cartesians[0]).toBeInstanceOf(Cartesian3)
      expect(cartesians[1]).toBeInstanceOf(Cartesian3)
    })

    it('should use default height when not provided', () => {
      const lonlats = [[116.391, 39.907]]
      const cartesians = lonlats2cartesians(lonlats)

      expect(cartesians).toHaveLength(1)

      // 验证高度为 0
      const lonlat = cartesian2lonlat(cartesians[0])
      expect(lonlat[2]).toBeCloseTo(0, 1)
    })

    it('should use specified default height', () => {
      const lonlats = [[116.391, 39.907]]
      const cartesians = lonlats2cartesians(lonlats, 500)

      const lonlat = cartesian2lonlat(cartesians[0])
      expect(lonlat[2]).toBeCloseTo(500, 1)
    })

    it('should return empty array for empty input', () => {
      expect(lonlats2cartesians([])).toEqual([])
    })

    it('should return empty array for null input', () => {
      expect(lonlats2cartesians(null as unknown as number[][])).toEqual([])
    })

    it('should prioritize coordinate height over default height', () => {
      const lonlats = [[116.391, 39.907, 100]]
      const cartesians = lonlats2cartesians(lonlats, 500)

      const lonlat = cartesian2lonlat(cartesians[0])
      expect(lonlat[2]).toBeCloseTo(100, 1)
    })
  })

  describe('lonlat2cartesian', () => {
    it('should convert single lonlat array to Cartesian3', () => {
      const lonlat = [116.391, 39.907, 100]
      const cartesian = lonlat2cartesian(lonlat)

      expect(cartesian).toBeInstanceOf(Cartesian3)

      const converted = cartesian2lonlat(cartesian)
      expect(converted[0]).toBeCloseTo(116.391, 4)
      expect(converted[1]).toBeCloseTo(39.907, 4)
      expect(converted[2]).toBeCloseTo(100, 1)
    })

    it('should use default height when not provided', () => {
      const lonlat = [116.391, 39.907]
      const cartesian = lonlat2cartesian(lonlat)

      const converted = cartesian2lonlat(cartesian)
      expect(converted[2]).toBeCloseTo(0, 1)
    })

    it('should use specified default height', () => {
      const lonlat = [116.391, 39.907]
      const cartesian = lonlat2cartesian(lonlat, 500)

      const converted = cartesian2lonlat(cartesian)
      expect(converted[2]).toBeCloseTo(500, 1)
    })

    it('should prioritize coordinate height over default height', () => {
      const lonlat = [116.391, 39.907, 100]
      const cartesian = lonlat2cartesian(lonlat, 500)

      const converted = cartesian2lonlat(cartesian)
      expect(converted[2]).toBeCloseTo(100, 1)
    })
  })

  // ==================== 往返转换测试 ====================
  describe('round-trip conversions', () => {
    it('should maintain accuracy in Cartesian3 <-> lonlat conversions', () => {
      const original = [116.391, 39.907, 100]
      const cartesian = lonlat2cartesian(original)
      const converted = cartesian2lonlat(cartesian)

      expect(converted[0]).toBeCloseTo(original[0], 4)
      expect(converted[1]).toBeCloseTo(original[1], 4)
      expect(converted[2]).toBeCloseTo(original[2], 1)
    })

    it('should maintain accuracy in array conversions', () => {
      const original = [
        [116.391, 39.907, 100],
        [121.473, 31.23, 200]
      ]
      const cartesians = lonlats2cartesians(original)
      const converted = cartesians2lonlats(cartesians)

      expect(converted[0][0]).toBeCloseTo(original[0][0], 4)
      expect(converted[0][1]).toBeCloseTo(original[0][1], 4)
      expect(converted[0][2]).toBeCloseTo(original[0][2], 1)
      expect(converted[1][0]).toBeCloseTo(original[1][0], 4)
      expect(converted[1][1]).toBeCloseTo(original[1][1], 4)
      expect(converted[1][2]).toBeCloseTo(original[1][2], 1)
    })
  })
})
