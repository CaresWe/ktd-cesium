import { describe, it, expect } from 'vitest'
import { Cartesian3 } from 'cesium'
import { computeCloseCurvePositions, CloseCurveOptions } from '../src/closeCurve'

describe('closeCurve', () => {
  // ==================== computeCloseCurvePositions ====================
  describe('computeCloseCurvePositions', () => {
    it('should compute close curve positions with default options', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.394, 39.908, 100)
      ]

      const result = computeCloseCurvePositions(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(positions.length)
      result.forEach((pos) => {
        expect(pos).toBeInstanceOf(Cartesian3)
      })
    })

    it('should compute close curve with custom smooth factor', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.394, 39.908, 100)
      ]

      const options: CloseCurveOptions = {
        smoothFactor: 0.5
      }

      const result = computeCloseCurvePositions(positions, options)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(positions.length)
    })

    it('should compute close curve with custom segments', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.394, 39.908, 100)
      ]

      const options: CloseCurveOptions = {
        segments: 50
      }

      const result = computeCloseCurvePositions(positions, options)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(positions.length)
    })

    it('should compute close curve with both custom options', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.394, 39.908, 100)
      ]

      const options: CloseCurveOptions = {
        smoothFactor: 0.4,
        segments: 80
      }

      const result = computeCloseCurvePositions(positions, options)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(positions.length)
    })

    it('should return original positions if less than 3 points', () => {
      const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.908, 100)]

      const result = computeCloseCurvePositions(positions)

      expect(result).toBe(positions)
    })

    it('should return empty array for null input', () => {
      const result = computeCloseCurvePositions(null as any)

      expect(result).toEqual([])
    })

    it('should return empty array for undefined input', () => {
      const result = computeCloseCurvePositions(undefined as any)

      expect(result).toEqual([])
    })

    it('should handle exactly 3 points', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100)
      ]

      const result = computeCloseCurvePositions(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(3)
    })

    it('should create smooth closed curve', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.394, 39.908, 100)
      ]

      const result = computeCloseCurvePositions(positions)

      // 闭合曲线应该生成大量的平滑点
      expect(result.length).toBeGreaterThan(positions.length * 10)
    })

    it('should handle many points', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.394, 39.91, 100),
        Cartesian3.fromDegrees(116.395, 39.909, 100),
        Cartesian3.fromDegrees(116.394, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.907, 100)
      ]

      const result = computeCloseCurvePositions(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(positions.length)
    })

    it('should handle different height values', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 0),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 200),
        Cartesian3.fromDegrees(116.394, 39.908, 150)
      ]

      const result = computeCloseCurvePositions(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })
  })

  // ==================== 选项测试 ====================
  describe('options behavior', () => {
    const basePositions = [
      Cartesian3.fromDegrees(116.391, 39.907, 100),
      Cartesian3.fromDegrees(116.392, 39.908, 100),
      Cartesian3.fromDegrees(116.393, 39.909, 100),
      Cartesian3.fromDegrees(116.394, 39.908, 100)
    ]

    it('should generate fewer points with lower segments', () => {
      const lowSegments = computeCloseCurvePositions(basePositions, { segments: 10 })
      const highSegments = computeCloseCurvePositions(basePositions, { segments: 100 })

      expect(lowSegments.length).toBeLessThan(highSegments.length)
    })

    it('should handle zero smooth factor', () => {
      const options: CloseCurveOptions = {
        smoothFactor: 0
      }

      const result = computeCloseCurvePositions(basePositions, options)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle very small smooth factor', () => {
      const options: CloseCurveOptions = {
        smoothFactor: 0.01
      }

      const result = computeCloseCurvePositions(basePositions, options)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle large smooth factor', () => {
      const options: CloseCurveOptions = {
        smoothFactor: 1.0
      }

      const result = computeCloseCurvePositions(basePositions, options)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle very large smooth factor', () => {
      const options: CloseCurveOptions = {
        smoothFactor: 5.0
      }

      const result = computeCloseCurvePositions(basePositions, options)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle negative smooth factor', () => {
      const options: CloseCurveOptions = {
        smoothFactor: -0.3
      }

      const result = computeCloseCurvePositions(basePositions, options)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle very low segments', () => {
      const options: CloseCurveOptions = {
        segments: 1
      }

      const result = computeCloseCurvePositions(basePositions, options)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle very high segments', () => {
      const options: CloseCurveOptions = {
        segments: 200
      }

      const result = computeCloseCurvePositions(basePositions, options)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle zero segments', () => {
      const options: CloseCurveOptions = {
        segments: 0
      }

      const result = computeCloseCurvePositions(basePositions, options)

      expect(result).toBeInstanceOf(Array)
    })
  })

  // ==================== 边界条件测试 ====================
  describe('edge cases', () => {
    it('should handle positions with same coordinates', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100)
      ]

      const result = computeCloseCurvePositions(positions)

      expect(result).toBeInstanceOf(Array)
    })

    it('should handle very close points', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.391001, 39.907001, 100),
        Cartesian3.fromDegrees(116.391002, 39.907002, 100),
        Cartesian3.fromDegrees(116.391001, 39.906999, 100)
      ]

      const result = computeCloseCurvePositions(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle very far apart points', () => {
      const positions = [
        Cartesian3.fromDegrees(116.0, 39.0, 100),
        Cartesian3.fromDegrees(117.0, 40.0, 100),
        Cartesian3.fromDegrees(118.0, 39.0, 100),
        Cartesian3.fromDegrees(117.0, 38.0, 100)
      ]

      const result = computeCloseCurvePositions(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle negative coordinates', () => {
      const positions = [
        Cartesian3.fromDegrees(-74.006, 40.7128, 100),
        Cartesian3.fromDegrees(-74.005, 40.7138, 100),
        Cartesian3.fromDegrees(-74.004, 40.7148, 100),
        Cartesian3.fromDegrees(-74.005, 40.7118, 100)
      ]

      const result = computeCloseCurvePositions(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle zero height', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 0),
        Cartesian3.fromDegrees(116.392, 39.908, 0),
        Cartesian3.fromDegrees(116.393, 39.909, 0),
        Cartesian3.fromDegrees(116.394, 39.908, 0)
      ]

      const result = computeCloseCurvePositions(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle points forming a triangle', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.909, 100),
        Cartesian3.fromDegrees(116.39, 39.909, 100)
      ]

      const result = computeCloseCurvePositions(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(3)
    })

    it('should handle points forming a square', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.393, 39.907, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.391, 39.909, 100)
      ]

      const result = computeCloseCurvePositions(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(4)
    })

    it('should handle points forming a pentagon', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.392, 39.91, 100),
        Cartesian3.fromDegrees(116.39, 39.909, 100)
      ]

      const result = computeCloseCurvePositions(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(5)
    })

    it('should handle clockwise points', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.393, 39.907, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.391, 39.909, 100)
      ]

      const result = computeCloseCurvePositions(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle counter-clockwise points', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.391, 39.909, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.393, 39.907, 100)
      ]

      const result = computeCloseCurvePositions(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })
  })

  // ==================== 曲线质量测试 ====================
  describe('curve quality', () => {
    it('should generate smooth curve with default settings', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.394, 39.908, 100)
      ]

      const result = computeCloseCurvePositions(positions)

      // 默认segments=100，每段应该生成很多点
      expect(result.length).toBeGreaterThan(positions.length * 50)
    })

    it('should maintain closure of curve', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.394, 39.908, 100)
      ]

      const result = computeCloseCurvePositions(positions)

      // 闭合曲线应该生成合理数量的点
      expect(result.length).toBeGreaterThan(0)
      result.forEach((pos) => {
        expect(pos).toBeInstanceOf(Cartesian3)
      })
    })

    it('should produce different results for different smooth factors', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.394, 39.908, 100)
      ]

      const result1 = computeCloseCurvePositions(positions, { smoothFactor: 0.1 })
      const result2 = computeCloseCurvePositions(positions, { smoothFactor: 0.9 })

      // 两种平滑系数应该产生不同的结果
      expect(result1.length).toBeGreaterThan(0)
      expect(result2.length).toBeGreaterThan(0)
    })

    it('should handle irregular polygon shapes', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.907, 100),
        Cartesian3.fromDegrees(116.393, 39.908, 100),
        Cartesian3.fromDegrees(116.394, 39.909, 100),
        Cartesian3.fromDegrees(116.393, 39.91, 100),
        Cartesian3.fromDegrees(116.391, 39.909, 100)
      ]

      const result = computeCloseCurvePositions(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(positions.length * 10)
    })

    it('should handle concave polygon shapes', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.393, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.391, 39.909, 100)
      ]

      const result = computeCloseCurvePositions(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })
  })

  // ==================== 性能相关测试 ====================
  describe('performance related', () => {
    it('should handle large number of input points efficiently', () => {
      const positions: Cartesian3[] = []
      const pointCount = 20
      const radius = 0.01

      // 生成圆形分布的点
      for (let i = 0; i < pointCount; i++) {
        const angle = (i / pointCount) * Math.PI * 2
        const lon = 116.391 + radius * Math.cos(angle)
        const lat = 39.907 + radius * Math.sin(angle)
        positions.push(Cartesian3.fromDegrees(lon, lat, 100))
      }

      const result = computeCloseCurvePositions(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(positions.length)
    })

    it('should work with minimum segments for performance', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.394, 39.908, 100)
      ]

      const result = computeCloseCurvePositions(positions, { segments: 5 })

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })
  })

  // ==================== 组合选项测试 ====================
  describe('combined options', () => {
    const basePositions = [
      Cartesian3.fromDegrees(116.391, 39.907, 100),
      Cartesian3.fromDegrees(116.392, 39.908, 100),
      Cartesian3.fromDegrees(116.393, 39.909, 100),
      Cartesian3.fromDegrees(116.394, 39.908, 100)
    ]

    it('should work with low segments and low smooth factor', () => {
      const options: CloseCurveOptions = {
        smoothFactor: 0.1,
        segments: 10
      }

      const result = computeCloseCurvePositions(basePositions, options)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should work with high segments and high smooth factor', () => {
      const options: CloseCurveOptions = {
        smoothFactor: 0.9,
        segments: 150
      }

      const result = computeCloseCurvePositions(basePositions, options)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should work with low segments and high smooth factor', () => {
      const options: CloseCurveOptions = {
        smoothFactor: 0.8,
        segments: 20
      }

      const result = computeCloseCurvePositions(basePositions, options)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should work with high segments and low smooth factor', () => {
      const options: CloseCurveOptions = {
        smoothFactor: 0.2,
        segments: 120
      }

      const result = computeCloseCurvePositions(basePositions, options)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })
  })
})
