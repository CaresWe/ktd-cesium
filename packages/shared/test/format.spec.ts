import { describe, it, expect } from 'vitest'
import { formatNum, formatCoordinate, formatDistance, formatArea, formatHeight, formatAngle } from '../src/format'

describe('format', () => {
  describe('formatNum', () => {
    it('should format number with default 0 digits', () => {
      expect(formatNum(3.14159)).toBe(3)
      expect(formatNum(2.5)).toBe(3) // Rounds up
      expect(formatNum(2.4)).toBe(2) // Rounds down
    })

    it('should format number with specified digits', () => {
      expect(formatNum(3.14159, 2)).toBe(3.14)
      expect(formatNum(3.14159, 4)).toBe(3.1416)
    })

    it('should handle zero', () => {
      expect(formatNum(0)).toBe(0)
      expect(formatNum(0, 2)).toBe(0)
    })

    it('should handle negative numbers', () => {
      expect(formatNum(-3.14159, 2)).toBe(-3.14)
      expect(formatNum(-2.5, 0)).toBe(-3) // Rounds down for negative
    })

    it('should handle integers', () => {
      expect(formatNum(42, 2)).toBe(42)
    })
  })

  describe('formatCoordinate', () => {
    it('should format positive coordinates', () => {
      const result = formatCoordinate(116.4074, 39.9042)

      expect(result).toContain('N')
      expect(result).toContain('E')
      expect(result).toContain('39.9042')
      expect(result).toContain('116.4074')
    })

    it('should format negative coordinates', () => {
      const result = formatCoordinate(-74.006, -40.7128)

      expect(result).toContain('S')
      expect(result).toContain('W')
      expect(result).toContain('40.7128')
      expect(result).toContain('74.006')
    })

    it('should handle mixed signs', () => {
      const result = formatCoordinate(-118.2437, 34.0522)

      expect(result).toContain('N')
      expect(result).toContain('W')
    })

    it('should respect precision parameter', () => {
      const result = formatCoordinate(116.4074, 39.9042, 2)

      expect(result).toContain('39.9')
      expect(result).toContain('116.41')
    })

    it('should handle zero coordinates', () => {
      const result = formatCoordinate(0, 0)

      expect(result).toContain('N')
      expect(result).toContain('E')
      expect(result).toContain('0')
    })

    it('should format with degree symbol', () => {
      const result = formatCoordinate(116.4074, 39.9042)

      expect(result).toContain('°')
    })
  })

  describe('formatDistance', () => {
    it('should format meters for values < 1000', () => {
      expect(formatDistance(100)).toBe('100.00 m')
      expect(formatDistance(999)).toBe('999.00 m')
      expect(formatDistance(0.5)).toBe('0.50 m')
    })

    it('should format kilometers for values < 1000000', () => {
      expect(formatDistance(1000)).toBe('1.00 km')
      expect(formatDistance(5500)).toBe('5.50 km')
      expect(formatDistance(999999)).toBe('1000.00 km')
    })

    it('should format megameters for values >= 1000000', () => {
      expect(formatDistance(1000000)).toBe('1.00 Mm')
      expect(formatDistance(5500000)).toBe('5.50 Mm')
    })

    it('should handle zero', () => {
      expect(formatDistance(0)).toBe('0.00 m')
    })

    it('should round to 2 decimal places', () => {
      expect(formatDistance(123.456)).toBe('123.46 m')
      expect(formatDistance(1234.567)).toBe('1.23 km')
    })
  })

  describe('formatArea', () => {
    it('should format square meters for values < 10000', () => {
      expect(formatArea(100)).toBe('100.00 m²')
      expect(formatArea(9999)).toBe('9999.00 m²')
    })

    it('should format hectares for values < 1000000', () => {
      expect(formatArea(10000)).toBe('1.00 ha')
      expect(formatArea(55000)).toBe('5.50 ha')
      expect(formatArea(999999)).toBe('100.00 ha')
    })

    it('should format square kilometers for values >= 1000000', () => {
      expect(formatArea(1000000)).toBe('1.00 km²')
      expect(formatArea(5500000)).toBe('5.50 km²')
    })

    it('should handle zero', () => {
      expect(formatArea(0)).toBe('0.00 m²')
    })

    it('should round to 2 decimal places', () => {
      expect(formatArea(123.456)).toBe('123.46 m²')
      expect(formatArea(12345.678)).toBe('1.23 ha')
    })
  })

  describe('formatHeight', () => {
    it('should format meters for values < 1000', () => {
      expect(formatHeight(100)).toBe('100.00 m')
      expect(formatHeight(999)).toBe('999.00 m')
      expect(formatHeight(-100)).toBe('-100.00 m')
    })

    it('should format kilometers for values >= 1000', () => {
      expect(formatHeight(1000)).toBe('1.00 km')
      expect(formatHeight(5500)).toBe('5.50 km')
      expect(formatHeight(-2000)).toBe('-2.00 km')
    })

    it('should handle zero', () => {
      expect(formatHeight(0)).toBe('0.00 m')
    })

    it('should handle negative values', () => {
      expect(formatHeight(-50)).toBe('-50.00 m')
      expect(formatHeight(-1500)).toBe('-1.50 km')
    })

    it('should round to 2 decimal places', () => {
      expect(formatHeight(123.456)).toBe('123.46 m')
      expect(formatHeight(1234.567)).toBe('1.23 km')
    })
  })

  describe('formatAngle', () => {
    it('should format angle with degree symbol', () => {
      expect(formatAngle(45)).toBe('45.00°')
      expect(formatAngle(90)).toBe('90.00°')
      expect(formatAngle(180)).toBe('180.00°')
    })

    it('should handle negative angles', () => {
      expect(formatAngle(-45)).toBe('-45.00°')
    })

    it('should handle zero', () => {
      expect(formatAngle(0)).toBe('0.00°')
    })

    it('should round to 2 decimal places', () => {
      expect(formatAngle(45.678)).toBe('45.68°')
      expect(formatAngle(123.456)).toBe('123.46°')
    })

    it('should handle decimal angles', () => {
      expect(formatAngle(30.5)).toBe('30.50°')
    })
  })
})
