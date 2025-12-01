import { describe, it, expect } from 'vitest'
import { Cartesian3 } from 'cesium'
import {
  computeFineArrowPositions,
  computeFineArrowYWPositions,
  type FineArrowOptions,
  type FineArrowYWOptions
} from '../src/fineArrow'

describe('fineArrow', () => {
  // ==================== 普通细直箭头测试 ====================
  describe('computeFineArrowPositions', () => {
    describe('Basic functionality', () => {
      it('should compute fine arrow positions with default options', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.91, 100)]

        const result = computeFineArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(7) // 尾部左、箭颈左、箭头左、顶点、箭头右、箭颈右、尾部右
        result.forEach((pos) => {
          expect(pos).toBeInstanceOf(Cartesian3)
        })
      })

      it('should compute fine arrow with custom headAngle', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.91, 100)]

        const options: FineArrowOptions = {
          headAngle: Math.PI / 6
        }

        const result = computeFineArrowPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(7)
      })

      it('should compute fine arrow with custom neckAngle', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.91, 100)]

        const options: FineArrowOptions = {
          neckAngle: Math.PI / 10
        }

        const result = computeFineArrowPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(7)
      })

      it('should compute fine arrow with custom tailWidthFactor', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.91, 100)]

        const options: FineArrowOptions = {
          tailWidthFactor: 0.15
        }

        const result = computeFineArrowPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(7)
      })

      it('should compute fine arrow with custom neckWidthFactor', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.91, 100)]

        const options: FineArrowOptions = {
          neckWidthFactor: 0.25
        }

        const result = computeFineArrowPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(7)
      })

      it('should compute fine arrow with custom headWidthFactor', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.91, 100)]

        const options: FineArrowOptions = {
          headWidthFactor: 0.3
        }

        const result = computeFineArrowPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(7)
      })

      it('should compute fine arrow with all custom options', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.91, 100)]

        const options: FineArrowOptions = {
          headAngle: Math.PI / 7,
          neckAngle: Math.PI / 12,
          tailWidthFactor: 0.12,
          neckWidthFactor: 0.22,
          headWidthFactor: 0.28
        }

        const result = computeFineArrowPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(7)
      })
    })

    describe('Boundary conditions', () => {
      it('should return empty array for null positions', () => {
        const result = computeFineArrowPositions(null as unknown as Cartesian3[])

        expect(result).toEqual([])
      })

      it('should return empty array for undefined positions', () => {
        const result = computeFineArrowPositions(undefined as unknown as Cartesian3[])

        expect(result).toEqual([])
      })

      it('should return original array for less than 2 points', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100)]

        const result = computeFineArrowPositions(positions)

        expect(result).toBe(positions)
      })

      it('should return empty array for empty array', () => {
        const result = computeFineArrowPositions([])

        expect(result).toEqual([])
      })

      it('should handle exactly 2 points', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.91, 100)]

        const result = computeFineArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(7)
      })

      it('should use only first 2 points when more provided', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.395, 39.91, 100),
          Cartesian3.fromDegrees(116.397, 39.912, 100)
        ]

        const result = computeFineArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(7)
      })
    })

    describe('Edge cases', () => {
      it('should handle very close points', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.3910001, 39.9070001, 100)
        ]

        const result = computeFineArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(7)
      })

      it('should handle very far apart points', () => {
        const positions = [Cartesian3.fromDegrees(0, 0, 100), Cartesian3.fromDegrees(90, 45, 100)]

        const result = computeFineArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(7)
      })

      it('should handle negative coordinates', () => {
        const positions = [
          Cartesian3.fromDegrees(-116.391, -39.907, 100),
          Cartesian3.fromDegrees(-116.395, -39.91, 100)
        ]

        const result = computeFineArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(7)
      })

      it('should handle different heights', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 0), Cartesian3.fromDegrees(116.395, 39.91, 5000)]

        const result = computeFineArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(7)
      })

      it('should handle zero tailWidthFactor', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.91, 100)]

        const options: FineArrowOptions = {
          tailWidthFactor: 0
        }

        const result = computeFineArrowPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(7)
      })

      it('should handle very large headAngle', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.91, 100)]

        const options: FineArrowOptions = {
          headAngle: Math.PI / 3
        }

        const result = computeFineArrowPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(7)
      })

      it('should handle very small headAngle', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.91, 100)]

        const options: FineArrowOptions = {
          headAngle: Math.PI / 30
        }

        const result = computeFineArrowPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(7)
      })
    })

    describe('Direction tests', () => {
      it('should handle horizontal arrow (west to east)', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.907, 100)]

        const result = computeFineArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(7)
      })

      it('should handle vertical arrow (south to north)', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.391, 39.912, 100)]

        const result = computeFineArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(7)
      })

      it('should handle diagonal arrow (southwest to northeast)', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.912, 100)]

        const result = computeFineArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(7)
      })

      it('should handle diagonal arrow (northwest to southeast)', () => {
        const positions = [Cartesian3.fromDegrees(116.395, 39.912, 100), Cartesian3.fromDegrees(116.391, 39.907, 100)]

        const result = computeFineArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBe(7)
      })
    })
  })

  // ==================== 燕尾细直箭头测试 ====================
  describe('computeFineArrowYWPositions', () => {
    describe('Basic functionality', () => {
      it('should compute fine arrow YW positions with default options', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.91, 100)]

        const result = computeFineArrowYWPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(10) // Includes smoothed curves
        result.forEach((pos) => {
          expect(pos).toBeInstanceOf(Cartesian3)
        })
      })

      it('should compute with custom headHeightFactor', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.91, 100)]

        const options: FineArrowYWOptions = {
          headHeightFactor: 0.2
        }

        const result = computeFineArrowYWPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(10)
      })

      it('should compute with custom headWidthFactor', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.91, 100)]

        const options: FineArrowYWOptions = {
          headWidthFactor: 0.4
        }

        const result = computeFineArrowYWPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(10)
      })

      it('should compute with custom neckHeightFactor', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.91, 100)]

        const options: FineArrowYWOptions = {
          neckHeightFactor: 0.9
        }

        const result = computeFineArrowYWPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(10)
      })

      it('should compute with custom neckWidthFactor', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.91, 100)]

        const options: FineArrowYWOptions = {
          neckWidthFactor: 0.2
        }

        const result = computeFineArrowYWPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(10)
      })

      it('should compute with custom tailWidthFactor', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.91, 100)]

        const options: FineArrowYWOptions = {
          tailWidthFactor: 0.15
        }

        const result = computeFineArrowYWPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(10)
      })

      it('should compute with custom swallowTailFactor', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.91, 100)]

        const options: FineArrowYWOptions = {
          swallowTailFactor: 1.5
        }

        const result = computeFineArrowYWPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(10)
      })

      it('should compute with all custom options', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.91, 100)]

        const options: FineArrowYWOptions = {
          headHeightFactor: 0.2,
          headWidthFactor: 0.35,
          neckHeightFactor: 0.88,
          neckWidthFactor: 0.18,
          tailWidthFactor: 0.12,
          swallowTailFactor: 1.2
        }

        const result = computeFineArrowYWPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(10)
      })
    })

    describe('Boundary conditions', () => {
      it('should return empty array for null positions', () => {
        const result = computeFineArrowYWPositions(null as unknown as Cartesian3[])

        expect(result).toEqual([])
      })

      it('should return empty array for undefined positions', () => {
        const result = computeFineArrowYWPositions(undefined as unknown as Cartesian3[])

        expect(result).toEqual([])
      })

      it('should return original array for less than 2 points', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100)]

        const result = computeFineArrowYWPositions(positions)

        expect(result).toBe(positions)
      })

      it('should return empty array for empty array', () => {
        const result = computeFineArrowYWPositions([])

        expect(result).toEqual([])
      })

      it('should handle exactly 2 points', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.91, 100)]

        const result = computeFineArrowYWPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(10)
      })

      it('should use only first 2 points when more provided', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.395, 39.91, 100),
          Cartesian3.fromDegrees(116.397, 39.912, 100)
        ]

        const result = computeFineArrowYWPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(10)
      })
    })

    describe('Edge cases', () => {
      it('should handle very close points', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.3910001, 39.9070001, 100)
        ]

        const result = computeFineArrowYWPositions(positions)

        expect(result).toBeInstanceOf(Array)
      })

      it('should handle very far apart points', () => {
        const positions = [Cartesian3.fromDegrees(0, 0, 100), Cartesian3.fromDegrees(90, 45, 100)]

        const result = computeFineArrowYWPositions(positions)

        expect(result).toBeInstanceOf(Array)
      })

      it('should handle negative coordinates', () => {
        const positions = [
          Cartesian3.fromDegrees(-116.391, -39.907, 100),
          Cartesian3.fromDegrees(-116.395, -39.91, 100)
        ]

        const result = computeFineArrowYWPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle different heights', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 0), Cartesian3.fromDegrees(116.395, 39.91, 5000)]

        const result = computeFineArrowYWPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle zero swallowTailFactor', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.91, 100)]

        const options: FineArrowYWOptions = {
          swallowTailFactor: 0
        }

        const result = computeFineArrowYWPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle very large swallowTailFactor', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.91, 100)]

        const options: FineArrowYWOptions = {
          swallowTailFactor: 3.0
        }

        const result = computeFineArrowYWPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle zero tailWidthFactor', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.91, 100)]

        const options: FineArrowYWOptions = {
          tailWidthFactor: 0
        }

        const result = computeFineArrowYWPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
      })

      it('should handle very large headHeightFactor', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.91, 100)]

        const options: FineArrowYWOptions = {
          headHeightFactor: 0.5
        }

        const result = computeFineArrowYWPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })
    })

    describe('Smoothness tests', () => {
      it('should produce smooth curves', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.91, 100)]

        const result = computeFineArrowYWPositions(positions)

        // Should have many points due to B-spline smoothing
        expect(result.length).toBeGreaterThan(10)
      })

      it('should have swallow tail point', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.91, 100)]

        const result = computeFineArrowYWPositions(positions)

        // Result should form a closed shape with swallow tail
        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(10)
      })
    })

    describe('Direction tests', () => {
      it('should handle horizontal arrow (west to east)', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.907, 100)]

        const result = computeFineArrowYWPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(10)
      })

      it('should handle vertical arrow (south to north)', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.391, 39.912, 100)]

        const result = computeFineArrowYWPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(10)
      })

      it('should handle diagonal arrow', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.912, 100)]

        const result = computeFineArrowYWPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(10)
      })
    })
  })

  // ==================== 对比测试 ====================
  describe('Comparison tests', () => {
    it('should produce different shapes for normal vs YW arrow', () => {
      const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.91, 100)]

      const normalResult = computeFineArrowPositions(positions)
      const ywResult = computeFineArrowYWPositions(positions)

      expect(normalResult.length).toBe(7)
      expect(ywResult.length).toBeGreaterThan(normalResult.length) // YW has more points due to smoothing
    })

    it('should produce consistent results for same input (normal)', () => {
      const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.91, 100)]

      const result1 = computeFineArrowPositions(positions)
      const result2 = computeFineArrowPositions(positions)

      expect(result1.length).toBe(result2.length)
      for (let i = 0; i < result1.length; i++) {
        expect(result1[i].x).toBeCloseTo(result2[i].x, 5)
        expect(result1[i].y).toBeCloseTo(result2[i].y, 5)
        expect(result1[i].z).toBeCloseTo(result2[i].z, 5)
      }
    })

    it('should produce consistent results for same input (YW)', () => {
      const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.395, 39.91, 100)]

      const result1 = computeFineArrowYWPositions(positions)
      const result2 = computeFineArrowYWPositions(positions)

      expect(result1.length).toBe(result2.length)
      for (let i = 0; i < result1.length; i++) {
        expect(result1[i].x).toBeCloseTo(result2[i].x, 5)
        expect(result1[i].y).toBeCloseTo(result2[i].y, 5)
        expect(result1[i].z).toBeCloseTo(result2[i].z, 5)
      }
    })
  })
})
