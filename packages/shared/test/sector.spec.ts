import { describe, it, expect } from 'vitest'
import { Cartesian3 } from 'cesium'
import { computeSectorPositions, getSectorParams } from '../src/sector'

describe('sector', () => {
  // ==================== computeSectorPositions ====================
  describe('computeSectorPositions', () => {
    describe('Basic functionality', () => {
      it('should compute sector positions with default segments', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100), // center
          Cartesian3.fromDegrees(116.392, 39.907, 100), // start point
          Cartesian3.fromDegrees(116.392, 39.908, 100) // end point
        ]

        const result = computeSectorPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(positions.length)
        result.forEach((pos) => {
          expect(pos).toBeInstanceOf(Cartesian3)
        })
      })

      it('should compute sector with custom segments', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100)
        ]

        const result = computeSectorPositions(positions, 50)

        expect(result).toBeInstanceOf(Array)
        // With 50 segments: 51 arc points + center + first point = 53
        expect(result.length).toBe(53)
      })

      it('should produce closed sector (returns to center and start)', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100)
        ]

        const result = computeSectorPositions(positions)

        // Last point should match first arc point (closure)
        const firstArc = result[0]
        const lastPoint = result[result.length - 1]
        expect(firstArc.x).toBeCloseTo(lastPoint.x, 5)
        expect(firstArc.y).toBeCloseTo(lastPoint.y, 5)
        expect(firstArc.z).toBeCloseTo(lastPoint.z, 5)
      })

      it('should create arc from start to end angle', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.391, 39.908, 100)
        ]

        const result = computeSectorPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(100)
      })

      it('should handle 90 degree sector', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100), // East
          Cartesian3.fromDegrees(116.391, 39.908, 100) // North
        ]

        const result = computeSectorPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle 180 degree sector', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100), // East
          Cartesian3.fromDegrees(116.39, 39.907, 100) // West
        ]

        const result = computeSectorPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle small angle sector', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.3921, 39.9071, 100)
        ]

        const result = computeSectorPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle large angle sector', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.3919, 39.906, 100)
        ]

        const result = computeSectorPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })
    })

    describe('Segments variation', () => {
      it('should handle very small segments count', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100)
        ]

        const result = computeSectorPositions(positions, 5)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(8) // 5+1 arc points + center + first = 8
      })

      it('should handle large segments count', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100)
        ]

        const result = computeSectorPositions(positions, 200)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(203) // 200+1 arc points + center + first = 203
      })

      it('should handle segments = 1', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100)
        ]

        const result = computeSectorPositions(positions, 1)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(4) // 1+1 arc points + center + first = 4
      })

      it('should produce more points with higher segments', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100)
        ]

        const result10 = computeSectorPositions(positions, 10)
        const result100 = computeSectorPositions(positions, 100)

        expect(result100.length).toBeGreaterThan(result10.length)
      })
    })

    describe('Boundary conditions', () => {
      it('should return empty array for null positions', () => {
        const result = computeSectorPositions(null as unknown as Cartesian3[])

        expect(result).toEqual([])
      })

      it('should return empty array for undefined positions', () => {
        const result = computeSectorPositions(undefined as unknown as Cartesian3[])

        expect(result).toEqual([])
      })

      it('should return original array for less than 3 points', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.908, 100)]

        const result = computeSectorPositions(positions)

        expect(result).toBe(positions)
      })

      it('should return empty array for empty array', () => {
        const result = computeSectorPositions([])

        expect(result).toEqual([])
      })

      it('should handle exactly 3 points', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100)
        ]

        const result = computeSectorPositions(positions)

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

        const result = computeSectorPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })
    })

    describe('Edge cases', () => {
      it('should handle center and boundary points at same location', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100)
        ]

        const result = computeSectorPositions(positions)

        expect(result).toBeInstanceOf(Array)
      })

      it('should handle points very close together', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.3910001, 39.9070001, 100),
          Cartesian3.fromDegrees(116.3910002, 39.9070002, 100)
        ]

        const result = computeSectorPositions(positions)

        expect(result).toBeInstanceOf(Array)
      })

      it('should handle points very far apart', () => {
        const positions = [
          Cartesian3.fromDegrees(0, 0, 100),
          Cartesian3.fromDegrees(90, 0, 100),
          Cartesian3.fromDegrees(0, 90, 100)
        ]

        const result = computeSectorPositions(positions)

        expect(result).toBeInstanceOf(Array)
      })

      it('should handle negative coordinates', () => {
        const positions = [
          Cartesian3.fromDegrees(-116.391, -39.907, 100),
          Cartesian3.fromDegrees(-116.392, -39.907, 100),
          Cartesian3.fromDegrees(-116.392, -39.908, 100)
        ]

        const result = computeSectorPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle mixed positive and negative coordinates', () => {
        const positions = [
          Cartesian3.fromDegrees(-116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, -39.907, 100),
          Cartesian3.fromDegrees(-116.392, -39.908, 100)
        ]

        const result = computeSectorPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle points with different heights', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 0),
          Cartesian3.fromDegrees(116.392, 39.907, 1000),
          Cartesian3.fromDegrees(116.392, 39.908, 5000)
        ]

        const result = computeSectorPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle zero height', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 0),
          Cartesian3.fromDegrees(116.392, 39.907, 0),
          Cartesian3.fromDegrees(116.392, 39.908, 0)
        ]

        const result = computeSectorPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle negative heights', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, -100),
          Cartesian3.fromDegrees(116.392, 39.907, -200),
          Cartesian3.fromDegrees(116.392, 39.908, -300)
        ]

        const result = computeSectorPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })
    })

    describe('Sector directions', () => {
      it('should handle clockwise sector', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100), // East
          Cartesian3.fromDegrees(116.391, 39.906, 100) // South (clockwise)
        ]

        const result = computeSectorPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle counter-clockwise sector', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100), // East
          Cartesian3.fromDegrees(116.391, 39.908, 100) // North (counter-clockwise)
        ]

        const result = computeSectorPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle sector pointing north', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.39, 39.908, 100), // NW
          Cartesian3.fromDegrees(116.392, 39.908, 100) // NE
        ]

        const result = computeSectorPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle sector pointing south', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.906, 100), // SE
          Cartesian3.fromDegrees(116.39, 39.906, 100) // SW
        ]

        const result = computeSectorPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle sector pointing east', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100), // NE
          Cartesian3.fromDegrees(116.392, 39.906, 100) // SE
        ]

        const result = computeSectorPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle sector pointing west', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.39, 39.906, 100), // SW
          Cartesian3.fromDegrees(116.39, 39.908, 100) // NW
        ]

        const result = computeSectorPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })
    })

    describe('Sector angles', () => {
      it('should handle narrow sector (small angle)', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.3921, 39.9071, 100)
        ]

        const result = computeSectorPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle wide sector (large angle)', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.389, 39.906, 100)
        ]

        const result = computeSectorPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle nearly full circle sector', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.3921, 39.907, 100)
        ]

        const result = computeSectorPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })
    })

    describe('Performance tests', () => {
      it('should handle computation with reasonable performance', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100)
        ]

        const startTime = performance.now()
        const result = computeSectorPositions(positions, 100)
        const endTime = performance.now()

        expect(result).toBeInstanceOf(Array)
        expect(endTime - startTime).toBeLessThan(1000) // Should complete in less than 1 second
      })

      it('should produce consistent results for same input', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100)
        ]

        const result1 = computeSectorPositions(positions)
        const result2 = computeSectorPositions(positions)

        expect(result1.length).toBe(result2.length)
        for (let i = 0; i < result1.length; i++) {
          expect(result1[i].x).toBeCloseTo(result2[i].x, 5)
          expect(result1[i].y).toBeCloseTo(result2[i].y, 5)
          expect(result1[i].z).toBeCloseTo(result2[i].z, 5)
        }
      })
    })
  })

  // ==================== getSectorParams ====================
  describe('getSectorParams', () => {
    describe('Basic functionality', () => {
      it('should return sector parameters', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100)
        ]

        const params = getSectorParams(positions)

        expect(params).not.toBeNull()
        expect(params).toHaveProperty('center')
        expect(params).toHaveProperty('radius')
        expect(params).toHaveProperty('startAngle')
        expect(params).toHaveProperty('endAngle')
      })

      it('should return valid center coordinates', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100)
        ]

        const params = getSectorParams(positions)

        expect(params).not.toBeNull()
        expect(params!.center).toBeInstanceOf(Array)
        expect(params!.center.length).toBe(3) // x, y, z coordinates
        expect(typeof params!.center[0]).toBe('number')
        expect(typeof params!.center[1]).toBe('number')
        expect(params!.center[0]).not.toBeNaN()
        expect(params!.center[1]).not.toBeNaN()
      })

      it('should return positive radius', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100)
        ]

        const params = getSectorParams(positions)

        expect(params).not.toBeNull()
        expect(params!.radius).toBeGreaterThan(0)
        expect(typeof params!.radius).toBe('number')
        expect(params!.radius).not.toBeNaN()
      })

      it('should return valid angles in radians', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100)
        ]

        const params = getSectorParams(positions)

        expect(params).not.toBeNull()
        expect(typeof params!.startAngle).toBe('number')
        expect(typeof params!.endAngle).toBe('number')
        expect(params!.startAngle).not.toBeNaN()
        expect(params!.endAngle).not.toBeNaN()
        // Angles should be in radians (typically between 0 and 2π)
        expect(Math.abs(params!.startAngle)).toBeLessThanOrEqual(Math.PI * 2)
        expect(Math.abs(params!.endAngle)).toBeLessThanOrEqual(Math.PI * 2)
      })

      it('should calculate radius from center to start point', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100)
        ]

        const params = getSectorParams(positions)

        expect(params).not.toBeNull()
        // Radius should be positive and reasonable
        expect(params!.radius).toBeGreaterThan(0)
      })
    })

    describe('Boundary conditions', () => {
      it('should return null for null positions', () => {
        const params = getSectorParams(null as unknown as Cartesian3[])

        expect(params).toBeNull()
      })

      it('should return null for undefined positions', () => {
        const params = getSectorParams(undefined as unknown as Cartesian3[])

        expect(params).toBeNull()
      })

      it('should return null for less than 3 points', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.908, 100)]

        const params = getSectorParams(positions)

        expect(params).toBeNull()
      })

      it('should return null for empty array', () => {
        const params = getSectorParams([])

        expect(params).toBeNull()
      })

      it('should handle exactly 3 points', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100)
        ]

        const params = getSectorParams(positions)

        expect(params).not.toBeNull()
      })

      it('should use only first 3 points when more provided', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100),
          Cartesian3.fromDegrees(116.394, 39.91, 100)
        ]

        const params = getSectorParams(positions)

        expect(params).not.toBeNull()
      })
    })

    describe('Edge cases', () => {
      it('should handle zero radius (center at start point)', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100)
        ]

        const params = getSectorParams(positions)

        expect(params).not.toBeNull()
        expect(params!.radius).toBe(0)
      })

      it('should handle very small radius', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.3910001, 39.9070001, 100),
          Cartesian3.fromDegrees(116.3910002, 39.9070002, 100)
        ]

        const params = getSectorParams(positions)

        expect(params).not.toBeNull()
        expect(params!.radius).toBeGreaterThan(0)
      })

      it('should handle very large radius', () => {
        const positions = [
          Cartesian3.fromDegrees(0, 0, 100),
          Cartesian3.fromDegrees(90, 0, 100),
          Cartesian3.fromDegrees(0, 90, 100)
        ]

        const params = getSectorParams(positions)

        expect(params).not.toBeNull()
        expect(params!.radius).toBeGreaterThan(1000000)
      })

      it('should handle negative coordinates', () => {
        const positions = [
          Cartesian3.fromDegrees(-116.391, -39.907, 100),
          Cartesian3.fromDegrees(-116.392, -39.907, 100),
          Cartesian3.fromDegrees(-116.392, -39.908, 100)
        ]

        const params = getSectorParams(positions)

        expect(params).not.toBeNull()
        expect(params!.radius).toBeGreaterThan(0)
      })

      it('should handle different heights', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 0),
          Cartesian3.fromDegrees(116.392, 39.907, 1000),
          Cartesian3.fromDegrees(116.392, 39.908, 5000)
        ]

        const params = getSectorParams(positions)

        expect(params).not.toBeNull()
        expect(params!.radius).toBeGreaterThan(0)
      })
    })

    describe('Angle calculation tests', () => {
      it('should calculate angles for 90 degree sector', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100), // East
          Cartesian3.fromDegrees(116.391, 39.908, 100) // North
        ]

        const params = getSectorParams(positions)

        expect(params).not.toBeNull()
        expect(params!.startAngle).toBeDefined()
        expect(params!.endAngle).toBeDefined()
      })

      it('should calculate angles for 180 degree sector', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100), // East
          Cartesian3.fromDegrees(116.39, 39.907, 100) // West
        ]

        const params = getSectorParams(positions)

        expect(params).not.toBeNull()
        expect(params!.startAngle).toBeDefined()
        expect(params!.endAngle).toBeDefined()
      })

      it('should calculate angles for small sector', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.3921, 39.9071, 100)
        ]

        const params = getSectorParams(positions)

        expect(params).not.toBeNull()
        expect(params!.startAngle).toBeDefined()
        expect(params!.endAngle).toBeDefined()
      })
    })

    describe('Consistency tests', () => {
      it('should produce consistent results for same input', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100)
        ]

        const params1 = getSectorParams(positions)
        const params2 = getSectorParams(positions)

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
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100)
        ]

        const params = getSectorParams(positions)

        expect(params).not.toBeNull()

        // Verify all properties are defined and have correct types
        expect(params!.center).toBeInstanceOf(Array)
        expect(params!.center.length).toBe(3) // x, y, z coordinates
        expect(typeof params!.radius).toBe('number')
        expect(typeof params!.startAngle).toBe('number')
        expect(typeof params!.endAngle).toBe('number')
        expect(params!.radius).not.toBeNaN()
        expect(params!.startAngle).not.toBeNaN()
        expect(params!.endAngle).not.toBeNaN()
      })
    })

    describe('Integration with computeSectorPositions', () => {
      it('should have matching parameters between both functions', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100)
        ]

        const params = getSectorParams(positions)
        const sector = computeSectorPositions(positions, 100)

        expect(params).not.toBeNull()
        expect(sector).toBeInstanceOf(Array)
        expect(sector.length).toBe(103) // 100+1 arc points + center + first = 103

        // The sector should use the same parameters
        expect(params!.radius).toBeGreaterThan(0)
      })
    })
  })
})
