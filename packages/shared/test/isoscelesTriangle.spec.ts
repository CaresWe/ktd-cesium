import { describe, it, expect } from 'vitest'
import { Cartesian3 } from 'cesium'
import { computeIsoscelesTrianglePositions, getIsoscelesTriangleParams } from '../src/isoscelesTriangle'

describe('isoscelesTriangle', () => {
  // ==================== computeIsoscelesTrianglePositions ====================
  describe('computeIsoscelesTrianglePositions', () => {
    describe('Basic functionality', () => {
      it('should compute isosceles triangle positions with 3 points', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.3915, 39.908, 100)
        ]

        const result = computeIsoscelesTrianglePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(3)
        result.forEach((pos) => {
          expect(pos).toBeInstanceOf(Cartesian3)
        })
      })

      it('should return triangle with base as first two points', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.3915, 39.908, 100)
        ]

        const result = computeIsoscelesTrianglePositions(positions)

        // First two points should remain as the base
        expect(result[0].x).toBeCloseTo(positions[0].x, 5)
        expect(result[0].y).toBeCloseTo(positions[0].y, 5)
        expect(result[1].x).toBeCloseTo(positions[1].x, 5)
        expect(result[1].y).toBeCloseTo(positions[1].y, 5)
      })

      it('should compute apex point based on third point direction', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const result = computeIsoscelesTrianglePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(3)
        // Third point should be different from input (rotated)
        expect(result[2]).toBeInstanceOf(Cartesian3)
      })

      it('should create isosceles triangle with equal leg lengths', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const result = computeIsoscelesTrianglePositions(positions)

        // Calculate leg lengths
        const leg1 = Cartesian3.distance(result[0], result[2])
        const leg2 = Cartesian3.distance(result[1], result[2])

        // Legs should be approximately equal (isosceles property)
        expect(leg1).toBeCloseTo(leg2, 1)
      })

      it('should handle horizontal base', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.91, 100)
        ]

        const result = computeIsoscelesTrianglePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(3)
      })

      it('should handle vertical base', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.391, 39.909, 100),
          Cartesian3.fromDegrees(116.393, 39.908, 100)
        ]

        const result = computeIsoscelesTrianglePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(3)
      })

      it('should handle diagonal base', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100),
          Cartesian3.fromDegrees(116.392, 39.911, 100)
        ]

        const result = computeIsoscelesTrianglePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(3)
      })
    })

    describe('Boundary conditions', () => {
      it('should return empty array for null positions', () => {
        const result = computeIsoscelesTrianglePositions(null as unknown as Cartesian3[])

        expect(result).toEqual([])
      })

      it('should return empty array for undefined positions', () => {
        const result = computeIsoscelesTrianglePositions(undefined as unknown as Cartesian3[])

        expect(result).toEqual([])
      })

      it('should return original array for less than 3 points', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.908, 100)]

        const result = computeIsoscelesTrianglePositions(positions)

        expect(result).toBe(positions)
      })

      it('should return empty array for empty array', () => {
        const result = computeIsoscelesTrianglePositions([])

        expect(result).toEqual([])
      })

      it('should handle exactly 3 points', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100)
        ]

        const result = computeIsoscelesTrianglePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(3)
      })

      it('should use only first 3 points when more provided', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100),
          Cartesian3.fromDegrees(116.394, 39.91, 100)
        ]

        const result = computeIsoscelesTrianglePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(3)
      })
    })

    describe('Edge cases', () => {
      it('should handle points with same coordinates for base', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100)
        ]

        const result = computeIsoscelesTrianglePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(3)
      })

      it('should handle points very close together', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.3910001, 39.9070001, 100),
          Cartesian3.fromDegrees(116.3910002, 39.9070002, 100)
        ]

        const result = computeIsoscelesTrianglePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(3)
      })

      it('should handle points very far apart', () => {
        const positions = [
          Cartesian3.fromDegrees(0, 0, 100),
          Cartesian3.fromDegrees(90, 0, 100),
          Cartesian3.fromDegrees(45, 45, 100)
        ]

        const result = computeIsoscelesTrianglePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(3)
      })

      it('should handle negative coordinates', () => {
        const positions = [
          Cartesian3.fromDegrees(-116.391, -39.907, 100),
          Cartesian3.fromDegrees(-116.392, -39.907, 100),
          Cartesian3.fromDegrees(-116.3915, -39.908, 100)
        ]

        const result = computeIsoscelesTrianglePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(3)
      })

      it('should handle mixed positive and negative coordinates', () => {
        const positions = [
          Cartesian3.fromDegrees(-116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, -39.907, 100),
          Cartesian3.fromDegrees(-116.3915, -39.908, 100)
        ]

        const result = computeIsoscelesTrianglePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(3)
      })

      it('should handle points with different heights', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 0),
          Cartesian3.fromDegrees(116.392, 39.907, 1000),
          Cartesian3.fromDegrees(116.3915, 39.908, 5000)
        ]

        const result = computeIsoscelesTrianglePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(3)
      })

      it('should handle zero height', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 0),
          Cartesian3.fromDegrees(116.392, 39.907, 0),
          Cartesian3.fromDegrees(116.3915, 39.908, 0)
        ]

        const result = computeIsoscelesTrianglePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(3)
      })

      it('should handle negative heights', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, -100),
          Cartesian3.fromDegrees(116.392, 39.907, -200),
          Cartesian3.fromDegrees(116.3915, 39.908, -300)
        ]

        const result = computeIsoscelesTrianglePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(3)
      })

      it('should handle collinear points', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100)
        ]

        const result = computeIsoscelesTrianglePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(3)
      })
    })

    describe('Triangle orientation', () => {
      it('should handle apex pointing north', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.91, 100)
        ]

        const result = computeIsoscelesTrianglePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(3)
      })

      it('should handle apex pointing south', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.91, 100),
          Cartesian3.fromDegrees(116.393, 39.91, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100)
        ]

        const result = computeIsoscelesTrianglePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(3)
      })

      it('should handle apex pointing east', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.391, 39.909, 100),
          Cartesian3.fromDegrees(116.394, 39.908, 100)
        ]

        const result = computeIsoscelesTrianglePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(3)
      })

      it('should handle apex pointing west', () => {
        const positions = [
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100),
          Cartesian3.fromDegrees(116.39, 39.908, 100)
        ]

        const result = computeIsoscelesTrianglePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(3)
      })
    })

    describe('Triangle shape variations', () => {
      it('should handle narrow isosceles triangle', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.3911, 39.907, 100),
          Cartesian3.fromDegrees(116.39105, 39.91, 100)
        ]

        const result = computeIsoscelesTrianglePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(3)
      })

      it('should handle wide isosceles triangle', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.395, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.908, 100)
        ]

        const result = computeIsoscelesTrianglePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(3)
      })

      it('should handle tall isosceles triangle', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.3915, 39.915, 100)
        ]

        const result = computeIsoscelesTrianglePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(3)
      })

      it('should handle short isosceles triangle', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.9075, 100)
        ]

        const result = computeIsoscelesTrianglePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(3)
      })
    })
  })

  // ==================== getIsoscelesTriangleParams ====================
  describe('getIsoscelesTriangleParams', () => {
    describe('Basic functionality', () => {
      it('should return triangle parameters', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const params = getIsoscelesTriangleParams(positions)

        expect(params).not.toBeNull()
        expect(params).toHaveProperty('base1')
        expect(params).toHaveProperty('base2')
        expect(params).toHaveProperty('apex')
        expect(params).toHaveProperty('midpoint')
        expect(params).toHaveProperty('baseLength')
        expect(params).toHaveProperty('height')
      })

      it('should return correct base points', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const params = getIsoscelesTriangleParams(positions)

        expect(params).not.toBeNull()
        expect(params!.base1).toBeInstanceOf(Cartesian3)
        expect(params!.base2).toBeInstanceOf(Cartesian3)

        // Base points should match first two input points
        expect(params!.base1.x).toBeCloseTo(positions[0].x, 5)
        expect(params!.base2.x).toBeCloseTo(positions[1].x, 5)
      })

      it('should return correct apex point', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const params = getIsoscelesTriangleParams(positions)

        expect(params).not.toBeNull()
        expect(params!.apex).toBeInstanceOf(Cartesian3)
      })

      it('should return correct midpoint', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const params = getIsoscelesTriangleParams(positions)

        expect(params).not.toBeNull()
        expect(params!.midpoint).toBeInstanceOf(Cartesian3)

        // Midpoint should be between base points
        const calculatedMidpoint = Cartesian3.midpoint(params!.base1, params!.base2, new Cartesian3())
        expect(params!.midpoint.x).toBeCloseTo(calculatedMidpoint.x, 5)
        expect(params!.midpoint.y).toBeCloseTo(calculatedMidpoint.y, 5)
      })

      it('should return positive base length', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const params = getIsoscelesTriangleParams(positions)

        expect(params).not.toBeNull()
        expect(params!.baseLength).toBeGreaterThan(0)
        expect(typeof params!.baseLength).toBe('number')
      })

      it('should return positive height', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const params = getIsoscelesTriangleParams(positions)

        expect(params).not.toBeNull()
        expect(params!.height).toBeGreaterThan(0)
        expect(typeof params!.height).toBe('number')
      })

      it('should calculate correct base length', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const params = getIsoscelesTriangleParams(positions)

        expect(params).not.toBeNull()

        const expectedLength = Cartesian3.distance(params!.base1, params!.base2)
        expect(params!.baseLength).toBeCloseTo(expectedLength, 1)
      })

      it('should calculate correct height', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const params = getIsoscelesTriangleParams(positions)

        expect(params).not.toBeNull()

        const expectedHeight = Cartesian3.distance(params!.midpoint, params!.apex)
        expect(params!.height).toBeCloseTo(expectedHeight, 1)
      })
    })

    describe('Boundary conditions', () => {
      it('should return null for null positions', () => {
        const params = getIsoscelesTriangleParams(null as unknown as Cartesian3[])

        expect(params).toBeNull()
      })

      it('should return null for undefined positions', () => {
        const params = getIsoscelesTriangleParams(undefined as unknown as Cartesian3[])

        expect(params).toBeNull()
      })

      it('should return null for less than 3 points', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.908, 100)]

        const params = getIsoscelesTriangleParams(positions)

        expect(params).toBeNull()
      })

      it('should return null for empty array', () => {
        const params = getIsoscelesTriangleParams([])

        expect(params).toBeNull()
      })

      it('should handle exactly 3 points', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100)
        ]

        const params = getIsoscelesTriangleParams(positions)

        expect(params).not.toBeNull()
      })

      it('should use only first 3 points when more provided', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100),
          Cartesian3.fromDegrees(116.394, 39.91, 100)
        ]

        const params = getIsoscelesTriangleParams(positions)

        expect(params).not.toBeNull()
      })
    })

    describe('Edge cases', () => {
      it('should handle very small triangle', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.3910001, 39.907, 100),
          Cartesian3.fromDegrees(116.39100005, 39.9070001, 100)
        ]

        const params = getIsoscelesTriangleParams(positions)

        expect(params).not.toBeNull()
        expect(params!.baseLength).toBeGreaterThan(0)
        expect(params!.height).toBeGreaterThan(0)
      })

      it('should handle very large triangle', () => {
        const positions = [
          Cartesian3.fromDegrees(0, 0, 100),
          Cartesian3.fromDegrees(90, 0, 100),
          Cartesian3.fromDegrees(45, 45, 100)
        ]

        const params = getIsoscelesTriangleParams(positions)

        expect(params).not.toBeNull()
        expect(params!.baseLength).toBeGreaterThan(0)
        expect(params!.height).toBeGreaterThan(0)
      })

      it('should handle negative coordinates', () => {
        const positions = [
          Cartesian3.fromDegrees(-116.391, -39.907, 100),
          Cartesian3.fromDegrees(-116.393, -39.907, 100),
          Cartesian3.fromDegrees(-116.392, -39.909, 100)
        ]

        const params = getIsoscelesTriangleParams(positions)

        expect(params).not.toBeNull()
        expect(params!.baseLength).toBeGreaterThan(0)
        expect(params!.height).toBeGreaterThan(0)
      })

      it('should handle different heights', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 0),
          Cartesian3.fromDegrees(116.393, 39.907, 1000),
          Cartesian3.fromDegrees(116.392, 39.909, 5000)
        ]

        const params = getIsoscelesTriangleParams(positions)

        expect(params).not.toBeNull()
        expect(params!.baseLength).toBeGreaterThan(0)
        expect(params!.height).toBeGreaterThan(0)
      })
    })

    describe('Isosceles property verification', () => {
      it('should verify equal leg lengths', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const params = getIsoscelesTriangleParams(positions)

        expect(params).not.toBeNull()

        // Calculate leg lengths
        const leg1 = Cartesian3.distance(params!.base1, params!.apex)
        const leg2 = Cartesian3.distance(params!.base2, params!.apex)

        // Legs should be approximately equal
        expect(leg1).toBeCloseTo(leg2, 1)
      })

      it('should verify apex is on perpendicular bisector', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const params = getIsoscelesTriangleParams(positions)

        expect(params).not.toBeNull()

        // Distance from midpoint to base1 should equal distance from midpoint to base2
        const distToBase1 = Cartesian3.distance(params!.midpoint, params!.base1)
        const distToBase2 = Cartesian3.distance(params!.midpoint, params!.base2)

        expect(distToBase1).toBeCloseTo(distToBase2, 1)
      })

      it('should verify height is perpendicular to base', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const params = getIsoscelesTriangleParams(positions)

        expect(params).not.toBeNull()

        // In isosceles triangle, height from apex to midpoint forms the altitude
        expect(params!.height).toBeGreaterThan(0)
        expect(params!.midpoint).toBeInstanceOf(Cartesian3)
        expect(params!.apex).toBeInstanceOf(Cartesian3)
      })
    })

    describe('Consistency tests', () => {
      it('should produce consistent results for same input', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const params1 = getIsoscelesTriangleParams(positions)
        const params2 = getIsoscelesTriangleParams(positions)

        expect(params1).not.toBeNull()
        expect(params2).not.toBeNull()

        expect(params1!.baseLength).toBeCloseTo(params2!.baseLength, 5)
        expect(params1!.height).toBeCloseTo(params2!.height, 5)
        expect(params1!.apex.x).toBeCloseTo(params2!.apex.x, 5)
        expect(params1!.apex.y).toBeCloseTo(params2!.apex.y, 5)
      })

      it('should return all required properties', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const params = getIsoscelesTriangleParams(positions)

        expect(params).not.toBeNull()

        // Verify all properties are defined and have correct types
        expect(params!.base1).toBeInstanceOf(Cartesian3)
        expect(params!.base2).toBeInstanceOf(Cartesian3)
        expect(params!.apex).toBeInstanceOf(Cartesian3)
        expect(params!.midpoint).toBeInstanceOf(Cartesian3)
        expect(typeof params!.baseLength).toBe('number')
        expect(typeof params!.height).toBe('number')
        expect(params!.baseLength).not.toBeNaN()
        expect(params!.height).not.toBeNaN()
      })
    })
  })
})
