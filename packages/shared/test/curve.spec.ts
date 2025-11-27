import { describe, it, expect } from 'vitest'
import { Cartesian3 } from 'cesium'
import {
  line2curve,
  bezierInterpolation,
  catmullRomSpline,
  simpleBezierCurve,
  quadraticBezier,
  cubicBezier
} from '../src/curve'

describe('curve', () => {
  // ==================== line2curve ====================
  describe('line2curve', () => {
    it('should return original positions if less than 3 points', () => {
      const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.908, 100)]

      const result = line2curve(positions)
      expect(result).toBe(positions)
    })

    it('should convert line to smooth curve', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100)
      ]

      const result = line2curve(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(positions.length)
      expect(result[0]).toBeInstanceOf(Cartesian3)
    })

    it('should handle closure parameter', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100)
      ]

      const result = line2curve(positions, true)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(positions.length)
    })

    it('should return original positions if null or empty', () => {
      expect(line2curve(null as any)).toBe(null)
      expect(line2curve([])).toEqual([])
    })
  })

  // ==================== bezierInterpolation ====================
  describe('bezierInterpolation', () => {
    it('should return original points if less than 3', () => {
      const points = [
        [116.391, 39.907, 100],
        [116.392, 39.908, 100]
      ]

      const result = bezierInterpolation(points)
      expect(result).toBe(points)
    })

    it('should interpolate points using Catmull-Rom spline', () => {
      const points = [
        [116.391, 39.907, 100],
        [116.392, 39.908, 100],
        [116.393, 39.909, 100]
      ]

      const result = bezierInterpolation(points)

      expect(result.length).toBeGreaterThan(points.length)
      expect(result[result.length - 1]).toEqual(points[points.length - 1])
    })

    it('should respect resolution parameter', () => {
      const points = [
        [116.391, 39.907, 100],
        [116.392, 39.908, 100],
        [116.393, 39.909, 100]
      ]

      const result = bezierInterpolation(points, 10)

      // 应该生成更多的点
      expect(result.length).toBeGreaterThan(points.length)
    })

    it('should handle 3 control points', () => {
      const points = [
        [0, 0, 0],
        [1, 1, 0],
        [2, 0, 0]
      ]

      const result = bezierInterpolation(points, 20)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(3)
    })
  })

  // ==================== catmullRomSpline ====================
  describe('catmullRomSpline', () => {
    it('should calculate Catmull-Rom spline point', () => {
      const p0 = [0, 0, 0]
      const p1 = [1, 1, 0]
      const p2 = [2, 0, 0]
      const p3 = [3, 1, 0]

      const result = catmullRomSpline(p0, p1, p2, p3, 0.5)

      expect(result).toBeInstanceOf(Array)
      expect(result).toHaveLength(3)
    })

    it('should return p1 at t=0', () => {
      const p0 = [0, 0, 0]
      const p1 = [1, 1, 0]
      const p2 = [2, 0, 0]
      const p3 = [3, 1, 0]

      const result = catmullRomSpline(p0, p1, p2, p3, 0)

      expect(result[0]).toBeCloseTo(p1[0], 5)
      expect(result[1]).toBeCloseTo(p1[1], 5)
      expect(result[2]).toBeCloseTo(p1[2], 5)
    })

    it('should return p2 at t=1', () => {
      const p0 = [0, 0, 0]
      const p1 = [1, 1, 0]
      const p2 = [2, 0, 0]
      const p3 = [3, 1, 0]

      const result = catmullRomSpline(p0, p1, p2, p3, 1)

      expect(result[0]).toBeCloseTo(p2[0], 5)
      expect(result[1]).toBeCloseTo(p2[1], 5)
      expect(result[2]).toBeCloseTo(p2[2], 5)
    })

    it('should handle 2D points', () => {
      const p0 = [0, 0]
      const p1 = [1, 1]
      const p2 = [2, 0]
      const p3 = [3, 1]

      const result = catmullRomSpline(p0, p1, p2, p3, 0.5)

      expect(result).toHaveLength(2)
    })

    it('should handle points with missing values', () => {
      const p0 = [0]
      const p1 = [1, 1]
      const p2 = [2, 0, 5]
      const p3 = [3]

      const result = catmullRomSpline(p0, p1, p2, p3, 0.5)

      expect(result).toBeInstanceOf(Array)
    })
  })

  // ==================== simpleBezierCurve ====================
  describe('simpleBezierCurve', () => {
    it('should return original points if less than 3', () => {
      const points = [
        [116.391, 39.907, 100],
        [116.392, 39.908, 100]
      ]

      const result = simpleBezierCurve(points)
      expect(result).toBe(points)
    })

    it('should create quadratic Bezier curve', () => {
      const points = [
        [0, 0, 0],
        [1, 1, 0],
        [2, 0, 0]
      ]

      const result = simpleBezierCurve(points, 10)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle multiple segments', () => {
      const points = [
        [0, 0, 0],
        [1, 1, 0],
        [2, 0, 0],
        [3, 1, 0],
        [4, 0, 0]
      ]

      const result = simpleBezierCurve(points, 20)

      expect(result).toBeInstanceOf(Array)
    })

    it('should respect resolution parameter', () => {
      const points = [
        [0, 0, 0],
        [1, 1, 0],
        [2, 0, 0]
      ]

      const result = simpleBezierCurve(points, 5)

      expect(result.length).toBe(6) // resolution + 1
    })
  })

  // ==================== quadraticBezier ====================
  describe('quadraticBezier', () => {
    it('should calculate quadratic Bezier point', () => {
      const p0 = [0, 0, 0]
      const p1 = [1, 1, 0]
      const p2 = [2, 0, 0]

      const result = quadraticBezier(p0, p1, p2, 0.5)

      expect(result).toBeInstanceOf(Array)
      expect(result).toHaveLength(3)
    })

    it('should return p0 at t=0', () => {
      const p0 = [0, 0, 0]
      const p1 = [1, 1, 0]
      const p2 = [2, 0, 0]

      const result = quadraticBezier(p0, p1, p2, 0)

      expect(result[0]).toBe(p0[0])
      expect(result[1]).toBe(p0[1])
      expect(result[2]).toBe(p0[2])
    })

    it('should return p2 at t=1', () => {
      const p0 = [0, 0, 0]
      const p1 = [1, 1, 0]
      const p2 = [2, 0, 0]

      const result = quadraticBezier(p0, p1, p2, 1)

      expect(result[0]).toBe(p2[0])
      expect(result[1]).toBe(p2[1])
      expect(result[2]).toBe(p2[2])
    })

    it('should handle 2D points', () => {
      const p0 = [0, 0]
      const p1 = [1, 1]
      const p2 = [2, 0]

      const result = quadraticBezier(p0, p1, p2, 0.5)

      expect(result).toHaveLength(2)
      expect(result[0]).toBeCloseTo(1, 5)
      expect(result[1]).toBeCloseTo(0.5, 5)
    })

    it('should handle points with missing values', () => {
      const p0 = [0]
      const p1 = [1, 1]
      const p2 = [2]

      const result = quadraticBezier(p0, p1, p2, 0.5)

      expect(result).toBeInstanceOf(Array)
    })
  })

  // ==================== cubicBezier ====================
  describe('cubicBezier', () => {
    it('should calculate cubic Bezier point', () => {
      const p0 = [0, 0, 0]
      const p1 = [1, 2, 0]
      const p2 = [2, 2, 0]
      const p3 = [3, 0, 0]

      const result = cubicBezier(p0, p1, p2, p3, 0.5)

      expect(result).toBeInstanceOf(Array)
      expect(result).toHaveLength(3)
    })

    it('should return p0 at t=0', () => {
      const p0 = [0, 0, 0]
      const p1 = [1, 2, 0]
      const p2 = [2, 2, 0]
      const p3 = [3, 0, 0]

      const result = cubicBezier(p0, p1, p2, p3, 0)

      expect(result[0]).toBe(p0[0])
      expect(result[1]).toBe(p0[1])
      expect(result[2]).toBe(p0[2])
    })

    it('should return p3 at t=1', () => {
      const p0 = [0, 0, 0]
      const p1 = [1, 2, 0]
      const p2 = [2, 2, 0]
      const p3 = [3, 0, 0]

      const result = cubicBezier(p0, p1, p2, p3, 1)

      expect(result[0]).toBe(p3[0])
      expect(result[1]).toBe(p3[1])
      expect(result[2]).toBe(p3[2])
    })

    it('should handle 2D points', () => {
      const p0 = [0, 0]
      const p1 = [1, 2]
      const p2 = [2, 2]
      const p3 = [3, 0]

      const result = cubicBezier(p0, p1, p2, p3, 0.5)

      expect(result).toHaveLength(2)
      expect(result[0]).toBeCloseTo(1.5, 5)
      expect(result[1]).toBeCloseTo(1.5, 5)
    })

    it('should interpolate at quarter points', () => {
      const p0 = [0, 0, 0]
      const p1 = [1, 1, 0]
      const p2 = [2, 1, 0]
      const p3 = [3, 0, 0]

      const result1 = cubicBezier(p0, p1, p2, p3, 0.25)
      const result2 = cubicBezier(p0, p1, p2, p3, 0.75)

      expect(result1).toBeInstanceOf(Array)
      expect(result2).toBeInstanceOf(Array)
    })

    it('should handle points with missing values', () => {
      const p0 = [0]
      const p1 = [1, 2]
      const p2 = [2]
      const p3 = [3, 0, 1]

      const result = cubicBezier(p0, p1, p2, p3, 0.5)

      expect(result).toBeInstanceOf(Array)
    })
  })

  // ==================== 曲线连续性测试 ====================
  describe('curve continuity', () => {
    it('should produce smooth transitions between segments', () => {
      const points = [
        [0, 0, 0],
        [1, 1, 0],
        [2, 0, 0],
        [3, 1, 0]
      ]

      const result = bezierInterpolation(points, 20)

      // 检查点之间的距离不应该有突变
      for (let i = 1; i < result.length; i++) {
        const dx = result[i][0] - result[i - 1][0]
        const dy = result[i][1] - result[i - 1][1]
        const distance = Math.sqrt(dx * dx + dy * dy)

        // 相邻点之间的距离应该相对均匀
        expect(distance).toBeGreaterThan(0)
        expect(distance).toBeLessThan(1) // 合理的距离范围
      }
    })
  })
})
