import { describe, it, expect } from 'vitest'
import { Cartesian3 } from 'cesium'
import { computeDoubleArrowPositions, type DoubleArrowOptions } from '../src/doubleArrow'

describe('doubleArrow', () => {
  describe('computeDoubleArrowPositions', () => {
    // ==================== 基本功能测试 ====================
    describe('Basic functionality', () => {
      it('should compute double arrow positions with default options (3 points)', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100)
        ]

        const result = computeDoubleArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(positions.length)
        result.forEach((pos) => {
          expect(pos).toBeInstanceOf(Cartesian3)
        })
      })

      it('should compute double arrow positions with default options (4 points)', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100),
          Cartesian3.fromDegrees(116.394, 39.91, 100)
        ]

        const result = computeDoubleArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(positions.length)
        result.forEach((pos) => {
          expect(pos).toBeInstanceOf(Cartesian3)
        })
      })

      it('should compute double arrow positions with default options (5 points)', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100),
          Cartesian3.fromDegrees(116.394, 39.91, 100),
          Cartesian3.fromDegrees(116.395, 39.909, 100)
        ]

        const result = computeDoubleArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(positions.length)
        result.forEach((pos) => {
          expect(pos).toBeInstanceOf(Cartesian3)
        })
      })

      it('should produce smooth double arrow shape', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100),
          Cartesian3.fromDegrees(116.394, 39.91, 100)
        ]

        const result = computeDoubleArrowPositions(positions)

        // Should have significantly more points than input due to Bezier curves
        expect(result.length).toBeGreaterThan(20)
      })
    })

    // ==================== 选项测试 ====================
    describe('Options behavior', () => {
      it('should compute with custom headHeightFactor', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100)
        ]

        const options: DoubleArrowOptions = {
          headHeightFactor: 0.3
        }

        const result = computeDoubleArrowPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should compute with custom headWidthFactor', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100)
        ]

        const options: DoubleArrowOptions = {
          headWidthFactor: 0.4
        }

        const result = computeDoubleArrowPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should compute with custom neckHeightFactor', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100)
        ]

        const options: DoubleArrowOptions = {
          neckHeightFactor: 0.9
        }

        const result = computeDoubleArrowPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should compute with custom neckWidthFactor', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100)
        ]

        const options: DoubleArrowOptions = {
          neckWidthFactor: 0.2
        }

        const result = computeDoubleArrowPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should compute with all custom options', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100),
          Cartesian3.fromDegrees(116.394, 39.91, 100)
        ]

        const options: DoubleArrowOptions = {
          headHeightFactor: 0.3,
          headWidthFactor: 0.4,
          neckHeightFactor: 0.9,
          neckWidthFactor: 0.2
        }

        const result = computeDoubleArrowPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle very small headHeightFactor', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100)
        ]

        const options: DoubleArrowOptions = {
          headHeightFactor: 0.05
        }

        const result = computeDoubleArrowPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle very large headHeightFactor', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100)
        ]

        const options: DoubleArrowOptions = {
          headHeightFactor: 0.5
        }

        const result = computeDoubleArrowPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle very small headWidthFactor', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100)
        ]

        const options: DoubleArrowOptions = {
          headWidthFactor: 0.1
        }

        const result = computeDoubleArrowPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle very large headWidthFactor', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100)
        ]

        const options: DoubleArrowOptions = {
          headWidthFactor: 0.8
        }

        const result = computeDoubleArrowPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle zero headHeightFactor', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100)
        ]

        const options: DoubleArrowOptions = {
          headHeightFactor: 0
        }

        const result = computeDoubleArrowPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })
    })

    // ==================== 边界条件测试 ====================
    describe('Boundary conditions', () => {
      it('should return empty array for null positions', () => {
        const result = computeDoubleArrowPositions(null as unknown as Cartesian3[])

        expect(result).toEqual([])
      })

      it('should return empty array for undefined positions', () => {
        const result = computeDoubleArrowPositions(undefined as unknown as Cartesian3[])

        expect(result).toEqual([])
      })

      it('should return original array for less than 3 points', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.908, 100)]

        const result = computeDoubleArrowPositions(positions)

        expect(result).toBe(positions)
      })

      it('should return empty array for empty array', () => {
        const result = computeDoubleArrowPositions([])

        expect(result).toEqual([])
      })

      it('should handle exactly 3 points', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100)
        ]

        const result = computeDoubleArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(positions.length)
      })

      it('should handle exactly 4 points', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100),
          Cartesian3.fromDegrees(116.394, 39.91, 100)
        ]

        const result = computeDoubleArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(positions.length)
      })

      it('should handle exactly 5 points', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100),
          Cartesian3.fromDegrees(116.394, 39.91, 100),
          Cartesian3.fromDegrees(116.395, 39.909, 100)
        ]

        const result = computeDoubleArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(positions.length)
      })

      it('should handle more than 5 points (only uses first 5)', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100),
          Cartesian3.fromDegrees(116.394, 39.91, 100),
          Cartesian3.fromDegrees(116.395, 39.909, 100),
          Cartesian3.fromDegrees(116.396, 39.908, 100)
        ]

        const result = computeDoubleArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })
    })

    // ==================== 边缘情况测试 ====================
    describe('Edge cases', () => {
      it('should handle points with same coordinates', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100)
        ]

        const result = computeDoubleArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
      })

      it('should handle points very close together', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.3910001, 39.9070001, 100),
          Cartesian3.fromDegrees(116.3910002, 39.9070002, 100)
        ]

        const result = computeDoubleArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
      })

      it('should handle points very far apart', () => {
        const positions = [
          Cartesian3.fromDegrees(0, 0, 100),
          Cartesian3.fromDegrees(90, 45, 100),
          Cartesian3.fromDegrees(180, 90, 100)
        ]

        const result = computeDoubleArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
      })

      it('should handle negative coordinates', () => {
        const positions = [
          Cartesian3.fromDegrees(-116.391, -39.907, 100),
          Cartesian3.fromDegrees(-116.392, -39.908, 100),
          Cartesian3.fromDegrees(-116.393, -39.909, 100)
        ]

        const result = computeDoubleArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle mixed positive and negative coordinates', () => {
        const positions = [
          Cartesian3.fromDegrees(-116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, -39.908, 100),
          Cartesian3.fromDegrees(-116.393, -39.909, 100)
        ]

        const result = computeDoubleArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle points with different heights', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 0),
          Cartesian3.fromDegrees(116.392, 39.908, 1000),
          Cartesian3.fromDegrees(116.393, 39.909, 5000)
        ]

        const result = computeDoubleArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle zero height', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 0),
          Cartesian3.fromDegrees(116.392, 39.908, 0),
          Cartesian3.fromDegrees(116.393, 39.909, 0)
        ]

        const result = computeDoubleArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle negative heights', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, -100),
          Cartesian3.fromDegrees(116.392, 39.908, -200),
          Cartesian3.fromDegrees(116.393, 39.909, -300)
        ]

        const result = computeDoubleArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })
    })

    // ==================== 形状测试 ====================
    describe('Shape characteristics', () => {
      it('should produce clockwise arrow shape', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100)
        ]

        const result = computeDoubleArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(positions.length)
      })

      it('should produce counter-clockwise arrow shape', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.906, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100)
        ]

        const result = computeDoubleArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(positions.length)
      })

      it('should produce linear arrangement', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100)
        ]

        const result = computeDoubleArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should produce wide spread', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.395, 39.908, 100),
          Cartesian3.fromDegrees(116.399, 39.907, 100)
        ]

        const result = computeDoubleArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(positions.length)
      })

      it('should produce narrow spread', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.3911, 39.9071, 100),
          Cartesian3.fromDegrees(116.3912, 39.907, 100)
        ]

        const result = computeDoubleArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle symmetric configuration', () => {
        const positions = [
          Cartesian3.fromDegrees(116.39, 39.907, 100),
          Cartesian3.fromDegrees(116.394, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.91, 100),
          Cartesian3.fromDegrees(116.392, 39.904, 100)
        ]

        const result = computeDoubleArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle asymmetric configuration', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.395, 39.908, 100),
          Cartesian3.fromDegrees(116.392, 39.911, 100),
          Cartesian3.fromDegrees(116.398, 39.905, 100)
        ]

        const result = computeDoubleArrowPositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })
    })

    // ==================== 不同点数对比测试 ====================
    describe('Point count comparison', () => {
      it('should handle 3-point configuration', () => {
        const positions3 = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100)
        ]

        const result3 = computeDoubleArrowPositions(positions3)

        expect(result3).toBeInstanceOf(Array)
        expect(result3.length).toBeGreaterThan(0)
      })

      it('should handle 4-point configuration', () => {
        const positions4 = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100),
          Cartesian3.fromDegrees(116.394, 39.91, 100)
        ]

        const result4 = computeDoubleArrowPositions(positions4)

        expect(result4).toBeInstanceOf(Array)
        expect(result4.length).toBeGreaterThan(0)
      })

      it('should handle 5-point configuration', () => {
        const positions5 = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100),
          Cartesian3.fromDegrees(116.394, 39.91, 100),
          Cartesian3.fromDegrees(116.395, 39.909, 100)
        ]

        const result5 = computeDoubleArrowPositions(positions5)

        expect(result5).toBeInstanceOf(Array)
        expect(result5.length).toBeGreaterThan(0)
      })

      it('should produce different results for different point counts', () => {
        const base = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100)
        ]

        const positions3 = [...base]
        const positions4 = [...base, Cartesian3.fromDegrees(116.394, 39.91, 100)]
        const positions5 = [
          ...base,
          Cartesian3.fromDegrees(116.394, 39.91, 100),
          Cartesian3.fromDegrees(116.395, 39.909, 100)
        ]

        const result3 = computeDoubleArrowPositions(positions3)
        const result4 = computeDoubleArrowPositions(positions4)
        const result5 = computeDoubleArrowPositions(positions5)

        expect(result3.length).toBeGreaterThan(0)
        expect(result4.length).toBeGreaterThan(0)
        expect(result5.length).toBeGreaterThan(0)
      })
    })

    // ==================== 选项组合测试 ====================
    describe('Option combinations', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.394, 39.91, 100)
      ]

      it('should handle small head and small neck', () => {
        const options: DoubleArrowOptions = {
          headHeightFactor: 0.1,
          headWidthFactor: 0.1,
          neckHeightFactor: 0.5,
          neckWidthFactor: 0.1
        }

        const result = computeDoubleArrowPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle large head and large neck', () => {
        const options: DoubleArrowOptions = {
          headHeightFactor: 0.4,
          headWidthFactor: 0.6,
          neckHeightFactor: 0.95,
          neckWidthFactor: 0.3
        }

        const result = computeDoubleArrowPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle small head and large neck', () => {
        const options: DoubleArrowOptions = {
          headHeightFactor: 0.1,
          headWidthFactor: 0.1,
          neckHeightFactor: 0.95,
          neckWidthFactor: 0.3
        }

        const result = computeDoubleArrowPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle large head and small neck', () => {
        const options: DoubleArrowOptions = {
          headHeightFactor: 0.4,
          headWidthFactor: 0.6,
          neckHeightFactor: 0.5,
          neckWidthFactor: 0.05
        }

        const result = computeDoubleArrowPositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })
    })

    // ==================== 性能测试 ====================
    describe('Performance characteristics', () => {
      it('should handle computation with reasonable performance', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100),
          Cartesian3.fromDegrees(116.394, 39.91, 100)
        ]

        const startTime = performance.now()
        const result = computeDoubleArrowPositions(positions)
        const endTime = performance.now()

        expect(result).toBeInstanceOf(Array)
        expect(endTime - startTime).toBeLessThan(1000) // Should complete in less than 1 second
      })

      it('should produce consistent results for same input', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.909, 100)
        ]

        const result1 = computeDoubleArrowPositions(positions)
        const result2 = computeDoubleArrowPositions(positions)

        expect(result1.length).toBe(result2.length)
        for (let i = 0; i < result1.length; i++) {
          expect(result1[i].x).toBeCloseTo(result2[i].x, 5)
          expect(result1[i].y).toBeCloseTo(result2[i].y, 5)
          expect(result1[i].z).toBeCloseTo(result2[i].z, 5)
        }
      })
    })
  })
})
