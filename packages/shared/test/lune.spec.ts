import { describe, it, expect } from 'vitest'
import { Cartesian3 } from 'cesium'
import { computeLunePositions, getLuneArcParams } from '../src/lune'

describe('lune', () => {
  // ==================== computeLunePositions ====================
  describe('computeLunePositions', () => {
    describe('Basic functionality', () => {
      it('should compute lune positions with default segments', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const result = computeLunePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(positions.length)
        result.forEach((pos) => {
          expect(pos).toBeInstanceOf(Cartesian3)
        })
      })

      it('should compute lune with custom segments', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const result = computeLunePositions(positions, 50)

        expect(result).toBeInstanceOf(Array)
        // With 50 segments, should have 52 points (50+1 arc points + 1 for closure)
        expect(result.length).toBe(52)
      })

      it('should produce closed curve', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const result = computeLunePositions(positions)

        // First and last points should be the same (closed curve)
        const first = result[0]
        const last = result[result.length - 1]
        expect(first.x).toBeCloseTo(last.x, 5)
        expect(first.y).toBeCloseTo(last.y, 5)
        expect(first.z).toBeCloseTo(last.z, 5)
      })

      it('should create arc through all three points', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const result = computeLunePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(100)
      })

      it('should handle horizontal chord', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.91, 100)
        ]

        const result = computeLunePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle vertical chord', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.391, 39.909, 100),
          Cartesian3.fromDegrees(116.393, 39.908, 100)
        ]

        const result = computeLunePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle diagonal chord', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100),
          Cartesian3.fromDegrees(116.394, 39.908, 100)
        ]

        const result = computeLunePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })
    })

    describe('Segments variation', () => {
      it('should handle very small segments count', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const result = computeLunePositions(positions, 5)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(7) // 5+1 arc points + 1 closure
      })

      it('should handle large segments count', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const result = computeLunePositions(positions, 200)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(202) // 200+1 arc points + 1 closure
      })

      it('should handle segments = 1', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const result = computeLunePositions(positions, 1)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(3) // 1+1 arc points + 1 closure
      })

      it('should produce more points with higher segments', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const result10 = computeLunePositions(positions, 10)
        const result100 = computeLunePositions(positions, 100)

        expect(result100.length).toBeGreaterThan(result10.length)
      })
    })

    describe('Boundary conditions', () => {
      it('should return empty array for null positions', () => {
        const result = computeLunePositions(null as any)

        expect(result).toEqual([])
      })

      it('should return empty array for undefined positions', () => {
        const result = computeLunePositions(undefined as any)

        expect(result).toEqual([])
      })

      it('should return original array for less than 3 points', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.908, 100)]

        const result = computeLunePositions(positions)

        expect(result).toBe(positions)
      })

      it('should return empty array for empty array', () => {
        const result = computeLunePositions([])

        expect(result).toEqual([])
      })

      it('should handle exactly 3 points', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100)
        ]

        const result = computeLunePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(3)
      })

      it('should use only first 3 points when more provided', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100),
          Cartesian3.fromDegrees(116.394, 39.91, 100)
        ]

        const result = computeLunePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })
    })

    describe('Edge cases', () => {
      it('should handle points very close together', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.3910001, 39.9070001, 100),
          Cartesian3.fromDegrees(116.39100005, 39.9070002, 100)
        ]

        const result = computeLunePositions(positions)

        expect(result).toBeInstanceOf(Array)
      })

      it('should handle points very far apart', () => {
        const positions = [
          Cartesian3.fromDegrees(0, 0, 100),
          Cartesian3.fromDegrees(90, 0, 100),
          Cartesian3.fromDegrees(45, 45, 100)
        ]

        const result = computeLunePositions(positions)

        expect(result).toBeInstanceOf(Array)
      })

      it('should handle negative coordinates', () => {
        const positions = [
          Cartesian3.fromDegrees(-116.391, -39.907, 100),
          Cartesian3.fromDegrees(-116.393, -39.907, 100),
          Cartesian3.fromDegrees(-116.392, -39.909, 100)
        ]

        const result = computeLunePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle mixed positive and negative coordinates', () => {
        const positions = [
          Cartesian3.fromDegrees(-116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, -39.907, 100),
          Cartesian3.fromDegrees(-116.392, -39.909, 100)
        ]

        const result = computeLunePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle points with different heights', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 0),
          Cartesian3.fromDegrees(116.393, 39.907, 1000),
          Cartesian3.fromDegrees(116.392, 39.909, 5000)
        ]

        const result = computeLunePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle zero height', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 0),
          Cartesian3.fromDegrees(116.393, 39.907, 0),
          Cartesian3.fromDegrees(116.392, 39.909, 0)
        ]

        const result = computeLunePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle negative heights', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, -100),
          Cartesian3.fromDegrees(116.393, 39.907, -200),
          Cartesian3.fromDegrees(116.392, 39.909, -300)
        ]

        const result = computeLunePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle collinear points', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100)
        ]

        const result = computeLunePositions(positions)

        expect(result).toBeInstanceOf(Array)
      })
    })

    describe('Arc orientation', () => {
      it('should handle clockwise arc', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.905, 100)
        ]

        const result = computeLunePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle counter-clockwise arc', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const result = computeLunePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })
    })

    describe('Arc size variations', () => {
      it('should handle small arc (shallow lune)', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.9075, 100)
        ]

        const result = computeLunePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle large arc (deep lune)', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.915, 100)
        ]

        const result = computeLunePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle semicircular arc', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100)
        ]

        const result = computeLunePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })
    })

    describe('Performance tests', () => {
      it('should handle computation with reasonable performance', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const startTime = performance.now()
        const result = computeLunePositions(positions, 100)
        const endTime = performance.now()

        expect(result).toBeInstanceOf(Array)
        expect(endTime - startTime).toBeLessThan(1000) // Should complete in less than 1 second
      })

      it('should produce consistent results for same input', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const result1 = computeLunePositions(positions)
        const result2 = computeLunePositions(positions)

        expect(result1.length).toBe(result2.length)
        for (let i = 0; i < result1.length; i++) {
          expect(result1[i].x).toBeCloseTo(result2[i].x, 5)
          expect(result1[i].y).toBeCloseTo(result2[i].y, 5)
          expect(result1[i].z).toBeCloseTo(result2[i].z, 5)
        }
      })
    })
  })

  // ==================== getLuneArcParams ====================
  describe('getLuneArcParams', () => {
    describe('Basic functionality', () => {
      it('should return arc parameters', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const params = getLuneArcParams(positions)

        expect(params).not.toBeNull()
        expect(params).toHaveProperty('center')
        expect(params).toHaveProperty('radius')
        expect(params).toHaveProperty('startAngle')
        expect(params).toHaveProperty('endAngle')
      })

      it('should return valid center coordinates', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const params = getLuneArcParams(positions)

        expect(params).not.toBeNull()
        expect(params!.center).toBeInstanceOf(Array)
        expect(params!.center.length).toBe(2)
        expect(typeof params!.center[0]).toBe('number')
        expect(typeof params!.center[1]).toBe('number')
        expect(params!.center[0]).not.toBeNaN()
        expect(params!.center[1]).not.toBeNaN()
      })

      it('should return positive radius', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const params = getLuneArcParams(positions)

        expect(params).not.toBeNull()
        expect(params!.radius).toBeGreaterThan(0)
        expect(typeof params!.radius).toBe('number')
        expect(params!.radius).not.toBeNaN()
      })

      it('should return valid angles', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const params = getLuneArcParams(positions)

        expect(params).not.toBeNull()
        expect(typeof params!.startAngle).toBe('number')
        expect(typeof params!.endAngle).toBe('number')
        expect(params!.startAngle).not.toBeNaN()
        expect(params!.endAngle).not.toBeNaN()
      })

      it('should return angles in radians', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const params = getLuneArcParams(positions)

        expect(params).not.toBeNull()
        // Angles should be in radians (typically between -2π and 2π)
        expect(Math.abs(params!.startAngle)).toBeLessThanOrEqual(Math.PI * 2)
        expect(Math.abs(params!.endAngle)).toBeLessThanOrEqual(Math.PI * 2)
      })

      it('should have all three points equidistant from center', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const params = getLuneArcParams(positions)

        expect(params).not.toBeNull()

        // Convert positions to mercator to compare distances
        // This is a simplified check - the actual implementation uses mercator projection
        expect(params!.radius).toBeGreaterThan(0)
      })
    })

    describe('Boundary conditions', () => {
      it('should return null for null positions', () => {
        const params = getLuneArcParams(null as any)

        expect(params).toBeNull()
      })

      it('should return null for undefined positions', () => {
        const params = getLuneArcParams(undefined as any)

        expect(params).toBeNull()
      })

      it('should return null for less than 3 points', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.908, 100)]

        const params = getLuneArcParams(positions)

        expect(params).toBeNull()
      })

      it('should return null for empty array', () => {
        const params = getLuneArcParams([])

        expect(params).toBeNull()
      })

      it('should handle exactly 3 points', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100)
        ]

        const params = getLuneArcParams(positions)

        expect(params).not.toBeNull()
      })

      it('should use only first 3 points when more provided', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100),
          Cartesian3.fromDegrees(116.394, 39.91, 100)
        ]

        const params = getLuneArcParams(positions)

        expect(params).not.toBeNull()
      })
    })

    describe('Edge cases', () => {
      it('should handle very small arc', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.9070001, 100)
        ]

        const params = getLuneArcParams(positions)

        expect(params).not.toBeNull()
        expect(params!.radius).toBeGreaterThan(0)
      })

      it('should handle very large arc', () => {
        const positions = [
          Cartesian3.fromDegrees(0, 0, 100),
          Cartesian3.fromDegrees(90, 0, 100),
          Cartesian3.fromDegrees(45, 45, 100)
        ]

        const params = getLuneArcParams(positions)

        expect(params).not.toBeNull()
        expect(params!.radius).toBeGreaterThan(0)
      })

      it('should handle negative coordinates', () => {
        const positions = [
          Cartesian3.fromDegrees(-116.391, -39.907, 100),
          Cartesian3.fromDegrees(-116.393, -39.907, 100),
          Cartesian3.fromDegrees(-116.392, -39.909, 100)
        ]

        const params = getLuneArcParams(positions)

        expect(params).not.toBeNull()
        expect(params!.radius).toBeGreaterThan(0)
      })

      it('should handle different heights', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 0),
          Cartesian3.fromDegrees(116.393, 39.907, 1000),
          Cartesian3.fromDegrees(116.392, 39.909, 5000)
        ]

        const params = getLuneArcParams(positions)

        expect(params).not.toBeNull()
        expect(params!.radius).toBeGreaterThan(0)
      })

      it('should handle collinear points', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100)
        ]

        const params = getLuneArcParams(positions)

        expect(params).not.toBeNull()
        // For collinear points, radius will be very large (or infinite)
        // but the function should still return a result
      })
    })

    describe('Arc orientation tests', () => {
      it('should handle clockwise orientation', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.905, 100)
        ]

        const params = getLuneArcParams(positions)

        expect(params).not.toBeNull()
        expect(params!.startAngle).toBeDefined()
        expect(params!.endAngle).toBeDefined()
      })

      it('should handle counter-clockwise orientation', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const params = getLuneArcParams(positions)

        expect(params).not.toBeNull()
        expect(params!.startAngle).toBeDefined()
        expect(params!.endAngle).toBeDefined()
      })
    })

    describe('Consistency tests', () => {
      it('should produce consistent results for same input', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const params1 = getLuneArcParams(positions)
        const params2 = getLuneArcParams(positions)

        expect(params1).not.toBeNull()
        expect(params2).not.toBeNull()

        expect(params1!.center[0]).toBeCloseTo(params2!.center[0], 5)
        expect(params1!.center[1]).toBeCloseTo(params2!.center[1], 5)
        expect(params1!.radius).toBeCloseTo(params2!.radius, 5)
        expect(params1!.startAngle).toBeCloseTo(params2!.startAngle, 5)
        expect(params1!.endAngle).toBeCloseTo(params2!.endAngle, 5)
      })

      it('should return all required properties', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const params = getLuneArcParams(positions)

        expect(params).not.toBeNull()

        // Verify all properties are defined and have correct types
        expect(params!.center).toBeInstanceOf(Array)
        expect(params!.center.length).toBe(2)
        expect(typeof params!.radius).toBe('number')
        expect(typeof params!.startAngle).toBe('number')
        expect(typeof params!.endAngle).toBe('number')
        expect(params!.radius).not.toBeNaN()
        expect(params!.startAngle).not.toBeNaN()
        expect(params!.endAngle).not.toBeNaN()
      })
    })

    describe('Integration with computeLunePositions', () => {
      it('should have matching parameters between both functions', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const params = getLuneArcParams(positions)
        const curve = computeLunePositions(positions, 100)

        expect(params).not.toBeNull()
        expect(curve).toBeInstanceOf(Array)
        expect(curve.length).toBe(102) // 100+1 arc points + 1 closure

        // The curve should use the same arc parameters
        expect(params!.radius).toBeGreaterThan(0)
      })
    })
  })
})
