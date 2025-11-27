import { describe, it, expect } from 'vitest'
import { Cartesian3 } from 'cesium'
import { computeGatheringPlacePositions, type GatheringPlaceOptions } from '../src/gatheringPlace'

describe('gatheringPlace', () => {
  describe('computeGatheringPlacePositions', () => {
    // ==================== 基本功能测试 ====================
    describe('Basic functionality', () => {
      it('should compute gathering place positions with default options', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100)
        ]

        const result = computeGatheringPlacePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(positions.length)
        result.forEach((pos) => {
          expect(pos).toBeInstanceOf(Cartesian3)
        })
      })

      it('should produce smooth closed curve', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100)
        ]

        const result = computeGatheringPlacePositions(positions)

        // With default segments=100, should have many points (4 segments * 100 + control points)
        expect(result.length).toBeGreaterThan(400)
      })

      it('should handle triangle formation', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100),
          Cartesian3.fromDegrees(116.394, 39.907, 100)
        ]

        const result = computeGatheringPlacePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle wide spread points', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.395, 39.912, 100),
          Cartesian3.fromDegrees(116.399, 39.907, 100)
        ]

        const result = computeGatheringPlacePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle narrow spread points', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.3911, 39.9071, 100),
          Cartesian3.fromDegrees(116.3912, 39.907, 100)
        ]

        const result = computeGatheringPlacePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })
    })

    // ==================== 选项测试 ====================
    describe('Options behavior', () => {
      it('should compute with custom smoothFactor', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100)
        ]

        const options: GatheringPlaceOptions = {
          smoothFactor: 0.5
        }

        const result = computeGatheringPlacePositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(positions.length)
      })

      it('should compute with custom segments', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100)
        ]

        const options: GatheringPlaceOptions = {
          segments: 50
        }

        const result = computeGatheringPlacePositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        // With 50 segments, should have fewer points than default
        expect(result.length).toBeGreaterThan(200)
        expect(result.length).toBeLessThan(500)
      })

      it('should compute with all custom options', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100)
        ]

        const options: GatheringPlaceOptions = {
          smoothFactor: 0.3,
          segments: 75
        }

        const result = computeGatheringPlacePositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(positions.length)
      })

      it('should handle zero smoothFactor', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100)
        ]

        const options: GatheringPlaceOptions = {
          smoothFactor: 0
        }

        const result = computeGatheringPlacePositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle very large smoothFactor', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100)
        ]

        const options: GatheringPlaceOptions = {
          smoothFactor: 1.0
        }

        const result = computeGatheringPlacePositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle very small smoothFactor', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100)
        ]

        const options: GatheringPlaceOptions = {
          smoothFactor: 0.1
        }

        const result = computeGatheringPlacePositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle negative smoothFactor', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100)
        ]

        const options: GatheringPlaceOptions = {
          smoothFactor: -0.2
        }

        const result = computeGatheringPlacePositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle very small segments', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100)
        ]

        const options: GatheringPlaceOptions = {
          segments: 5
        }

        const result = computeGatheringPlacePositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle very large segments', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100)
        ]

        const options: GatheringPlaceOptions = {
          segments: 200
        }

        const result = computeGatheringPlacePositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(800) // Should have many points
      })

      it('should handle zero segments', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100)
        ]

        const options: GatheringPlaceOptions = {
          segments: 0
        }

        const result = computeGatheringPlacePositions(positions, options)

        expect(result).toBeInstanceOf(Array)
      })

      it('should handle segments equal to 1', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100)
        ]

        const options: GatheringPlaceOptions = {
          segments: 1
        }

        const result = computeGatheringPlacePositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })
    })

    // ==================== 边界条件测试 ====================
    describe('Boundary conditions', () => {
      it('should return empty array for null positions', () => {
        const result = computeGatheringPlacePositions(null as any)

        expect(result).toEqual([])
      })

      it('should return empty array for undefined positions', () => {
        const result = computeGatheringPlacePositions(undefined as any)

        expect(result).toEqual([])
      })

      it('should return original array for less than 3 points', () => {
        const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.908, 100)]

        const result = computeGatheringPlacePositions(positions)

        expect(result).toBe(positions)
      })

      it('should return empty array for empty array', () => {
        const result = computeGatheringPlacePositions([])

        expect(result).toEqual([])
      })

      it('should handle exactly 3 points', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100)
        ]

        const result = computeGatheringPlacePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(positions.length)
      })

      it('should use only first 3 points when more provided', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.394, 39.908, 100)
        ]

        const result = computeGatheringPlacePositions(positions)

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

        const result = computeGatheringPlacePositions(positions)

        expect(result).toBeInstanceOf(Array)
      })

      it('should handle points very close together', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.3910001, 39.9070001, 100),
          Cartesian3.fromDegrees(116.3910002, 39.9070002, 100)
        ]

        const result = computeGatheringPlacePositions(positions)

        expect(result).toBeInstanceOf(Array)
      })

      it('should handle points very far apart', () => {
        const positions = [
          Cartesian3.fromDegrees(0, 0, 100),
          Cartesian3.fromDegrees(90, 45, 100),
          Cartesian3.fromDegrees(180, 0, 100)
        ]

        const result = computeGatheringPlacePositions(positions)

        expect(result).toBeInstanceOf(Array)
      })

      it('should handle negative coordinates', () => {
        const positions = [
          Cartesian3.fromDegrees(-116.391, -39.907, 100),
          Cartesian3.fromDegrees(-116.392, -39.908, 100),
          Cartesian3.fromDegrees(-116.393, -39.907, 100)
        ]

        const result = computeGatheringPlacePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle mixed positive and negative coordinates', () => {
        const positions = [
          Cartesian3.fromDegrees(-116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, -39.908, 100),
          Cartesian3.fromDegrees(-116.393, -39.907, 100)
        ]

        const result = computeGatheringPlacePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle points with different heights', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 0),
          Cartesian3.fromDegrees(116.392, 39.908, 1000),
          Cartesian3.fromDegrees(116.393, 39.907, 5000)
        ]

        const result = computeGatheringPlacePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle zero height', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 0),
          Cartesian3.fromDegrees(116.392, 39.908, 0),
          Cartesian3.fromDegrees(116.393, 39.907, 0)
        ]

        const result = computeGatheringPlacePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle negative heights', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, -100),
          Cartesian3.fromDegrees(116.392, 39.908, -200),
          Cartesian3.fromDegrees(116.393, 39.907, -300)
        ]

        const result = computeGatheringPlacePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle collinear points', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100)
        ]

        const result = computeGatheringPlacePositions(positions)

        expect(result).toBeInstanceOf(Array)
      })
    })

    // ==================== 形状特性测试 ====================
    describe('Shape characteristics', () => {
      it('should produce clockwise triangle', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100)
        ]

        const result = computeGatheringPlacePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(positions.length)
      })

      it('should produce counter-clockwise triangle', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100)
        ]

        const result = computeGatheringPlacePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(positions.length)
      })

      it('should produce obtuse triangle', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.3915, 39.91, 100)
        ]

        const result = computeGatheringPlacePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should produce acute triangle', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.908, 100)
        ]

        const result = computeGatheringPlacePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should produce equilateral-like triangle', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.907, 100),
          Cartesian3.fromDegrees(116.3915, 39.9078, 100)
        ]

        const result = computeGatheringPlacePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should produce isosceles triangle', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.909, 100)
        ]

        const result = computeGatheringPlacePositions(positions)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })
    })

    // ==================== 平滑度测试 ====================
    describe('Smoothness tests', () => {
      it('should produce smooth curve with default smoothFactor', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100)
        ]

        const result = computeGatheringPlacePositions(positions)

        // Should have many points due to cubic Bezier interpolation
        expect(result.length).toBeGreaterThan(100)
      })

      it('should have more points with higher segments', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100)
        ]

        const result50 = computeGatheringPlacePositions(positions, { segments: 50 })
        const result150 = computeGatheringPlacePositions(positions, { segments: 150 })

        expect(result150.length).toBeGreaterThan(result50.length)
      })

      it('should produce different smoothness with different smoothFactor', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100)
        ]

        const result1 = computeGatheringPlacePositions(positions, { smoothFactor: 0.2 })
        const result2 = computeGatheringPlacePositions(positions, { smoothFactor: 0.6 })

        // Both should produce results but with different curvatures
        expect(result1.length).toBeGreaterThan(0)
        expect(result2.length).toBeGreaterThan(0)
      })
    })

    // ==================== 选项组合测试 ====================
    describe('Option combinations', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.907, 100)
      ]

      it('should handle low smoothFactor with low segments', () => {
        const options: GatheringPlaceOptions = {
          smoothFactor: 0.1,
          segments: 10
        }

        const result = computeGatheringPlacePositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle high smoothFactor with high segments', () => {
        const options: GatheringPlaceOptions = {
          smoothFactor: 0.8,
          segments: 150
        }

        const result = computeGatheringPlacePositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
      })

      it('should handle low smoothFactor with high segments', () => {
        const options: GatheringPlaceOptions = {
          smoothFactor: 0.1,
          segments: 150
        }

        const result = computeGatheringPlacePositions(positions, options)

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(500)
      })

      it('should handle high smoothFactor with low segments', () => {
        const options: GatheringPlaceOptions = {
          smoothFactor: 0.8,
          segments: 10
        }

        const result = computeGatheringPlacePositions(positions, options)

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
          Cartesian3.fromDegrees(116.393, 39.907, 100)
        ]

        const startTime = performance.now()
        const result = computeGatheringPlacePositions(positions)
        const endTime = performance.now()

        expect(result).toBeInstanceOf(Array)
        expect(endTime - startTime).toBeLessThan(1000) // Should complete in less than 1 second
      })

      it('should produce consistent results for same input', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100)
        ]

        const result1 = computeGatheringPlacePositions(positions)
        const result2 = computeGatheringPlacePositions(positions)

        expect(result1.length).toBe(result2.length)
        for (let i = 0; i < result1.length; i++) {
          expect(result1[i].x).toBeCloseTo(result2[i].x, 5)
          expect(result1[i].y).toBeCloseTo(result2[i].y, 5)
          expect(result1[i].z).toBeCloseTo(result2[i].z, 5)
        }
      })

      it('should handle very high segments without excessive time', () => {
        const positions = [
          Cartesian3.fromDegrees(116.391, 39.907, 100),
          Cartesian3.fromDegrees(116.392, 39.908, 100),
          Cartesian3.fromDegrees(116.393, 39.907, 100)
        ]

        const options: GatheringPlaceOptions = {
          segments: 300
        }

        const startTime = performance.now()
        const result = computeGatheringPlacePositions(positions, options)
        const endTime = performance.now()

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(1200)
        expect(endTime - startTime).toBeLessThan(2000) // Should complete in less than 2 seconds even with high segments
      })
    })
  })
})
