import { describe, it, expect } from 'vitest'
import { Cartesian3, Cartographic, Math as CesiumMath } from 'cesium'
import {
  degreesToCartesian,
  cartesianToDegrees,
  radiansToDegrees,
  degreesToRadians,
  calculateDistance
} from '../src/coordinate'

describe('coordinate', () => {
  describe('degreesToCartesian', () => {
    it('should convert degrees to Cartesian3', () => {
      const result = degreesToCartesian(116.4074, 39.9042, 0)

      expect(result).toBeInstanceOf(Cartesian3)
      expect(result.x).toBeDefined()
      expect(result.y).toBeDefined()
      expect(result.z).toBeDefined()
    })

    it('should handle default height', () => {
      const result = degreesToCartesian(0, 0)
      expect(result).toBeInstanceOf(Cartesian3)
    })

    it('should handle positive height', () => {
      const result1 = degreesToCartesian(0, 0, 0)
      const result2 = degreesToCartesian(0, 0, 1000)

      const magnitude1 = Cartesian3.magnitude(result1)
      const magnitude2 = Cartesian3.magnitude(result2)

      expect(magnitude2).toBeGreaterThan(magnitude1)
    })

    it('should convert known coordinates correctly', () => {
      // Test origin point (0, 0, 0)
      const result = degreesToCartesian(0, 0, 0)
      const cartographic = Cartographic.fromCartesian(result)

      expect(CesiumMath.toDegrees(cartographic.longitude)).toBeCloseTo(0, 5)
      expect(CesiumMath.toDegrees(cartographic.latitude)).toBeCloseTo(0, 5)
    })
  })

  describe('cartesianToDegrees', () => {
    it('should convert Cartesian3 to degrees', () => {
      const cartesian = Cartesian3.fromDegrees(116.4074, 39.9042, 100)
      const result = cartesianToDegrees(cartesian)

      expect(result.longitude).toBeCloseTo(116.4074, 4)
      expect(result.latitude).toBeCloseTo(39.9042, 4)
      expect(result.height).toBeCloseTo(100, 1)
    })

    it('should handle zero coordinates', () => {
      const cartesian = Cartesian3.fromDegrees(0, 0, 0)
      const result = cartesianToDegrees(cartesian)

      expect(result.longitude).toBeCloseTo(0, 5)
      expect(result.latitude).toBeCloseTo(0, 5)
      expect(result.height).toBeCloseTo(0, 1)
    })

    it('should round-trip correctly', () => {
      const original = { longitude: 120.5, latitude: 30.5, height: 500 }
      const cartesian = degreesToCartesian(original.longitude, original.latitude, original.height)
      const result = cartesianToDegrees(cartesian)

      expect(result.longitude).toBeCloseTo(original.longitude, 4)
      expect(result.latitude).toBeCloseTo(original.latitude, 4)
      expect(result.height).toBeCloseTo(original.height, 1)
    })
  })

  describe('radiansToDegrees', () => {
    it('should convert radians to degrees', () => {
      expect(radiansToDegrees(0)).toBe(0)
      expect(radiansToDegrees(Math.PI)).toBeCloseTo(180, 10)
      expect(radiansToDegrees(Math.PI / 2)).toBeCloseTo(90, 10)
      expect(radiansToDegrees(2 * Math.PI)).toBeCloseTo(360, 10)
    })

    it('should handle negative radians', () => {
      expect(radiansToDegrees(-Math.PI)).toBeCloseTo(-180, 10)
      expect(radiansToDegrees(-Math.PI / 2)).toBeCloseTo(-90, 10)
    })
  })

  describe('degreesToRadians', () => {
    it('should convert degrees to radians', () => {
      expect(degreesToRadians(0)).toBe(0)
      expect(degreesToRadians(180)).toBeCloseTo(Math.PI, 10)
      expect(degreesToRadians(90)).toBeCloseTo(Math.PI / 2, 10)
      expect(degreesToRadians(360)).toBeCloseTo(2 * Math.PI, 10)
    })

    it('should handle negative degrees', () => {
      expect(degreesToRadians(-180)).toBeCloseTo(-Math.PI, 10)
      expect(degreesToRadians(-90)).toBeCloseTo(-Math.PI / 2, 10)
    })

    it('should round-trip correctly', () => {
      const degrees = 45.5
      const radians = degreesToRadians(degrees)
      const back = radiansToDegrees(radians)

      expect(back).toBeCloseTo(degrees, 10)
    })
  })

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      // Beijing to Shanghai (approximate)
      const beijing = { longitude: 116.4074, latitude: 39.9042 }
      const shanghai = { longitude: 121.4737, latitude: 31.2304 }

      const distance = calculateDistance(beijing, shanghai)

      // Distance should be around 1067 km
      expect(distance).toBeGreaterThan(1000000) // > 1000 km
      expect(distance).toBeLessThan(1200000) // < 1200 km
    })

    it('should return 0 for same point', () => {
      const point = { longitude: 0, latitude: 0 }
      const distance = calculateDistance(point, point)

      expect(distance).toBeCloseTo(0, 1)
    })

    it('should handle points on equator', () => {
      const point1 = { longitude: 0, latitude: 0 }
      const point2 = { longitude: 1, latitude: 0 }

      const distance = calculateDistance(point1, point2)

      // 1 degree on equator is approximately 111 km
      expect(distance).toBeGreaterThan(110000)
      expect(distance).toBeLessThan(112000)
    })

    it('should handle points on prime meridian', () => {
      const point1 = { longitude: 0, latitude: 0 }
      const point2 = { longitude: 0, latitude: 1 }

      const distance = calculateDistance(point1, point2)

      // 1 degree latitude is approximately 111 km
      expect(distance).toBeGreaterThan(110000)
      expect(distance).toBeLessThan(112000)
    })

    it('should be symmetric', () => {
      const point1 = { longitude: 116.4074, latitude: 39.9042 }
      const point2 = { longitude: 121.4737, latitude: 31.2304 }

      const distance1 = calculateDistance(point1, point2)
      const distance2 = calculateDistance(point2, point1)

      expect(distance1).toBeCloseTo(distance2, 1)
    })

    it('should handle negative coordinates', () => {
      const point1 = { longitude: -74.006, latitude: 40.7128 } // New York
      const point2 = { longitude: -118.2437, latitude: 34.0522 } // Los Angeles

      const distance = calculateDistance(point1, point2)

      // Distance should be around 3936 km
      expect(distance).toBeGreaterThan(3900000)
      expect(distance).toBeLessThan(4000000)
    })
  })
})
