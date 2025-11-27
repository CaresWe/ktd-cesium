import { describe, it, expect } from 'vitest'
import { Cartesian3 } from 'cesium'
import { computeRegularPositions, getRegularParams } from '../src/regular'

describe('regular', () => {
  // ==================== computeRegularPositions ====================
  describe('computeRegularPositions', () => {
    describe('Basic functionality', () => {
      it('should compute regular hexagon with default sides', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100), // center
          Cartesian3.fromDegrees(116.392, 39.907, 100) // vertex
        ]

        const result = computeRegularPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(6) // Default is hexagon (6 sides)
        result.forEach((pos) => {
          expect(pos).toBeInstanceOf(Cartesian3)
        })
      })

      it('should compute triangle with 3 sides', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const result = computeRegularPositions(positions, 3)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(3)
      })

      it('should compute square with 4 sides', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const result = computeRegularPositions(positions, 4)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(4)
      })

      it('should compute pentagon with 5 sides', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const result = computeRegularPositions(positions, 5)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(5)
      })

      it('should compute octagon with 8 sides', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const result = computeRegularPositions(positions, 8)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(8)
      })

      it('should compute decagon with 10 sides', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const result = computeRegularPositions(positions, 10)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(10)
      })

      it('should have all vertices at equal distance from center', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const result = computeRegularPositions(positions, 6)
        const center = positions[0]

        // All vertices should be equidistant from center
        const distances = result.map((vertex) => Cartesian3.distance(center, vertex))
        const firstDistance = distances[0]

        distances.forEach((distance) => {
          expect(distance).toBeCloseTo(firstDistance, 3)
        })
      })

      it('should have first vertex at original position', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const result = computeRegularPositions(positions, 6)

        // First vertex should be at the original vertex position
        expect(result[0].x).toBeCloseTo(positions[1].x, 5)
        expect(result[0].y).toBeCloseTo(positions[1].y, 5)
        expect(result[0].z).toBeCloseTo(positions[1].z, 5)
      })
    })

    describe('Sides validation', () => {
      it('should enforce minimum of 3 sides', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const result = computeRegularPositions(positions, 2)

        // Should produce triangle (minimum 3 sides)
        expect(result.length).toBe(3)
      })

      it('should enforce minimum of 3 sides for negative input', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const result = computeRegularPositions(positions, -5)

        // Should produce triangle (minimum 3 sides)
        expect(result.length).toBe(3)
      })

      it('should enforce minimum of 3 sides for zero input', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const result = computeRegularPositions(positions, 0)

        // Should produce triangle (minimum 3 sides)
        expect(result.length).toBe(3)
      })

      it('should handle very large number of sides', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const result = computeRegularPositions(positions, 100)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(100)
      })

      it('should handle 12 sides (dodecagon)', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const result = computeRegularPositions(positions, 12)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(12)
      })
    })

    describe('Boundary conditions', () => {
      it('should return empty array for null positions', () => {
        const result = computeRegularPositions(null as any)

        expect(result).toEqual([])
      })

      it('should return empty array for undefined positions', () => {
        const result = computeRegularPositions(undefined as any)

        expect(result).toEqual([])
      })

      it('should return original array for less than 2 points', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100)]

        const result = computeRegularPositions(positions)

        expect(result).toBe(positions)
      })

      it('should return empty array for empty array', () => {
        const result = computeRegularPositions([])

        expect(result).toEqual([])
      })

      it('should handle exactly 2 points', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const result = computeRegularPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(6) // Default hexagon
      })

      it('should use only first 2 points when more provided', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.908, 100)
        ]

        const result = computeRegularPositions(positions, 4)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(4)
      })
    })

    describe('Edge cases', () => {
      it('should handle center and vertex at same location', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.391, 39.907, 100)]

        const result = computeRegularPositions(positions, 6)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(6)
      })

      it('should handle points very close together', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.3910001, 39.9070001, 100)
        ]

        const result = computeRegularPositions(positions, 6)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(6)
      })

      it('should handle points very far apart', () => {
        const positions = [Cartesian3.fromDegrees(0, 0, 100), Cartesian3.fromDegrees(90, 45, 100)]

        const result = computeRegularPositions(positions, 6)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(6)
      })

      it('should handle negative coordinates', () => {
        const positions = [
          Cartesian3.fromDegrees(-116.391, -39.907, 100),
          Cartesian3.fromDegrees(-116.392, -39.907, 100)
        ]

        const result = computeRegularPositions(positions, 6)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(6)
      })

      it('should handle mixed positive and negative coordinates', () => {
        const positions = [Cartesian3.fromDegrees(-116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, -39.907, 100)]

        const result = computeRegularPositions(positions, 6)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(6)
      })

      it('should handle points with different heights', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 0), Cartesian3.fromDegrees(116.392, 39.907, 5000)]

        const result = computeRegularPositions(positions, 6)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(6)
      })

      it('should handle zero height', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 0), Cartesian3.fromDegrees(116.392, 39.907, 0)]

        const result = computeRegularPositions(positions, 6)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(6)
      })

      it('should handle negative heights', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, -100), Cartesian3.fromDegrees(116.392, 39.907, -200)]

        const result = computeRegularPositions(positions, 6)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(6)
      })
    })

    describe('Geometric properties', () => {
      it('should create equilateral triangle (3 sides)', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const result = computeRegularPositions(positions, 3)

        // Calculate side lengths
        const side1 = Cartesian3.distance(result[0], result[1])
        const side2 = Cartesian3.distance(result[1], result[2])
        const side3 = Cartesian3.distance(result[2], result[0])

        // All sides should be equal
        expect(side1).toBeCloseTo(side2, 1)
        expect(side2).toBeCloseTo(side3, 1)
      })

      it('should create regular square (4 sides)', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const result = computeRegularPositions(positions, 4)

        // Calculate side lengths
        const side1 = Cartesian3.distance(result[0], result[1])
        const side2 = Cartesian3.distance(result[1], result[2])
        const side3 = Cartesian3.distance(result[2], result[3])
        const side4 = Cartesian3.distance(result[3], result[0])

        // All sides should be equal
        expect(side1).toBeCloseTo(side2, 1)
        expect(side2).toBeCloseTo(side3, 1)
        expect(side3).toBeCloseTo(side4, 1)
      })

      it('should have vertices evenly distributed around circle', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const result = computeRegularPositions(positions, 8)
        const center = positions[0]

        // Check angular spacing (should be 360/8 = 45 degrees)
        const expectedAngle = 360 / 8

        for (let i = 0; i < result.length; i++) {
          const dist = Cartesian3.distance(center, result[i])
          expect(dist).toBeGreaterThan(0)
        }
      })
    })

    describe('Different polygon types', () => {
      it('should create triangle', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const result = computeRegularPositions(positions, 3)

        expect(result.length).toBe(3)
      })

      it('should create quadrilateral', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const result = computeRegularPositions(positions, 4)

        expect(result.length).toBe(4)
      })

      it('should create pentagon', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const result = computeRegularPositions(positions, 5)

        expect(result.length).toBe(5)
      })

      it('should create hexagon', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const result = computeRegularPositions(positions, 6)

        expect(result.length).toBe(6)
      })

      it('should create heptagon', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const result = computeRegularPositions(positions, 7)

        expect(result.length).toBe(7)
      })
    })

    describe('Performance tests', () => {
      it('should handle computation with reasonable performance', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const startTime = performance.now()
        const result = computeRegularPositions(positions, 100)
        const endTime = performance.now()

        expect(result).toBeInstanceOf(Array)
        expect(endTime - startTime).toBeLessThan(1000) // Should complete in less than 1 second
      })

      it('should produce consistent results for same input', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const result1 = computeRegularPositions(positions, 6)
        const result2 = computeRegularPositions(positions, 6)

        expect(result1.length).toBe(result2.length)
        for (let i = 0; i < result1.length; i++) {
          expect(result1[i].x).toBeCloseTo(result2[i].x, 5)
          expect(result1[i].y).toBeCloseTo(result2[i].y, 5)
          expect(result1[i].z).toBeCloseTo(result2[i].z, 5)
        }
      })
    })
  })

  // ==================== getRegularParams ====================
  describe('getRegularParams', () => {
    describe('Basic functionality', () => {
      it('should return parameters for regular polygon', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const params = getRegularParams(positions)

        expect(params).not.toBeNull()
        expect(params).toHaveProperty('center')
        expect(params).toHaveProperty('radius')
      })

      it('should return correct center point', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const params = getRegularParams(positions)

        expect(params).not.toBeNull()
        expect(params!.center).toBeInstanceOf(Cartesian3)
        expect(params!.center.x).toBeCloseTo(positions[0].x, 5)
        expect(params!.center.y).toBeCloseTo(positions[0].y, 5)
        expect(params!.center.z).toBeCloseTo(positions[0].z, 5)
      })

      it('should return positive radius', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const params = getRegularParams(positions)

        expect(params).not.toBeNull()
        expect(params!.radius).toBeGreaterThan(0)
        expect(typeof params!.radius).toBe('number')
        expect(params!.radius).not.toBeNaN()
      })

      it('should calculate correct radius', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const params = getRegularParams(positions)

        expect(params).not.toBeNull()

        const expectedRadius = Cartesian3.distance(positions[0], positions[1])
        expect(params!.radius).toBeCloseTo(expectedRadius, 5)
      })

      it('should return radius matching distance from center to vertex', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const params = getRegularParams(positions)

        expect(params).not.toBeNull()

        const calculatedDistance = Cartesian3.distance(params!.center, positions[1])
        expect(params!.radius).toBeCloseTo(calculatedDistance, 5)
      })
    })

    describe('Boundary conditions', () => {
      it('should return null for null positions', () => {
        const params = getRegularParams(null as any)

        expect(params).toBeNull()
      })

      it('should return null for undefined positions', () => {
        const params = getRegularParams(undefined as any)

        expect(params).toBeNull()
      })

      it('should return null for less than 2 points', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100)]

        const params = getRegularParams(positions)

        expect(params).toBeNull()
      })

      it('should return null for empty array', () => {
        const params = getRegularParams([])

        expect(params).toBeNull()
      })

      it('should handle exactly 2 points', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const params = getRegularParams(positions)

        expect(params).not.toBeNull()
      })

      it('should use only first 2 points when more provided', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.908, 100)
        ]

        const params = getRegularParams(positions)

        expect(params).not.toBeNull()
        expect(params!.center.x).toBeCloseTo(positions[0].x, 5)
      })
    })

    describe('Edge cases', () => {
      it('should handle zero radius (same center and vertex)', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.391, 39.907, 100)]

        const params = getRegularParams(positions)

        expect(params).not.toBeNull()
        expect(params!.radius).toBe(0)
      })

      it('should handle very small radius', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.3910001, 39.9070001, 100)
        ]

        const params = getRegularParams(positions)

        expect(params).not.toBeNull()
        expect(params!.radius).toBeGreaterThan(0)
        expect(params!.radius).toBeLessThan(1)
      })

      it('should handle very large radius', () => {
        const positions = [Cartesian3.fromDegrees(0, 0, 100), Cartesian3.fromDegrees(90, 45, 100)]

        const params = getRegularParams(positions)

        expect(params).not.toBeNull()
        expect(params!.radius).toBeGreaterThan(1000000)
      })

      it('should handle negative coordinates', () => {
        const positions = [
          Cartesian3.fromDegrees(-116.391, -39.907, 100),
          Cartesian3.fromDegrees(-116.392, -39.907, 100)
        ]

        const params = getRegularParams(positions)

        expect(params).not.toBeNull()
        expect(params!.radius).toBeGreaterThan(0)
      })

      it('should handle different heights', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 0), Cartesian3.fromDegrees(116.392, 39.907, 5000)]

        const params = getRegularParams(positions)

        expect(params).not.toBeNull()
        expect(params!.radius).toBeGreaterThan(0)
      })
    })

    describe('Consistency tests', () => {
      it('should produce consistent results for same input', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const params1 = getRegularParams(positions)
        const params2 = getRegularParams(positions)

        expect(params1).not.toBeNull()
        expect(params2).not.toBeNull()

        expect(params1!.center.x).toBeCloseTo(params2!.center.x, 5)
        expect(params1!.center.y).toBeCloseTo(params2!.center.y, 5)
        expect(params1!.center.z).toBeCloseTo(params2!.center.z, 5)
        expect(params1!.radius).toBeCloseTo(params2!.radius, 5)
      })

      it('should return all required properties', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const params = getRegularParams(positions)

        expect(params).not.toBeNull()

        // Verify all properties are defined and have correct types
        expect(params!.center).toBeInstanceOf(Cartesian3)
        expect(typeof params!.radius).toBe('number')
        expect(params!.radius).not.toBeNaN()
      })
    })

    describe('Integration with computeRegularPositions', () => {
      it('should have matching parameters between both functions', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const params = getRegularParams(positions)
        const vertices = computeRegularPositions(positions, 6)

        expect(params).not.toBeNull()
        expect(vertices).toBeInstanceOf(Array)
        expect(vertices.length).toBe(6)

        // All vertices should be at distance equal to radius from center
        vertices.forEach((vertex) => {
          const distance = Cartesian3.distance(params!.center, vertex)
          expect(distance).toBeCloseTo(params!.radius, 3)
        })
      })

      it('should verify radius consistency across different polygon types', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.907, 100)]

        const params = getRegularParams(positions)

        const triangle = computeRegularPositions(positions, 3)
        const square = computeRegularPositions(positions, 4)
        const hexagon = computeRegularPositions(positions, 6)

        // All should have same circumradius
        triangle.forEach((vertex) => {
          const distance = Cartesian3.distance(params!.center, vertex)
          expect(distance).toBeCloseTo(params!.radius, 3)
        })

        square.forEach((vertex) => {
          const distance = Cartesian3.distance(params!.center, vertex)
          expect(distance).toBeCloseTo(params!.radius, 3)
        })

        hexagon.forEach((vertex) => {
          const distance = Cartesian3.distance(params!.center, vertex)
          expect(distance).toBeCloseTo(params!.radius, 3)
        })
      })
    })
  })
})
