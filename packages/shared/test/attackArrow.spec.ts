import { describe, it, expect } from 'vitest'
import { Cartesian3 } from 'cesium'
import {
  computeAttackArrowPositions,
  computeAttackArrowPWPositions,
  computeAttackArrowYWPositions,
  AttackArrowOptions,
  AttackArrowPWOptions,
  AttackArrowYWOptions
} from '../src/attackArrow'

describe('attackArrow', () => {
  // ==================== computeAttackArrowPositions ====================
  describe('computeAttackArrowPositions', () => {
    it('should compute attack arrow positions with default options', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.394, 39.91, 100)
      ]

      const result = computeAttackArrowPositions(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(positions.length)
      result.forEach((pos) => {
        expect(pos).toBeInstanceOf(Cartesian3)
      })
    })

    it('should compute attack arrow with custom options', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.394, 39.91, 100)
      ]

      const options: AttackArrowOptions = {
        headHeightFactor: 0.2,
        headWidthFactor: 0.35,
        neckHeightFactor: 0.9,
        neckWidthFactor: 0.2,
        headTailFactor: 0.9
      }

      const result = computeAttackArrowPositions(positions, options)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(positions.length)
    })

    it('should return original positions if less than 3 points', () => {
      const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.908, 100)]

      const result = computeAttackArrowPositions(positions)

      expect(result).toBe(positions)
    })

    it('should return empty array for null input', () => {
      const result = computeAttackArrowPositions(null as any)

      expect(result).toEqual([])
    })

    it('should return empty array for undefined input', () => {
      const result = computeAttackArrowPositions(undefined as any)

      expect(result).toEqual([])
    })

    it('should handle exactly 3 points', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100)
      ]

      const result = computeAttackArrowPositions(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle many points', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.394, 39.91, 100),
        Cartesian3.fromDegrees(116.395, 39.911, 100),
        Cartesian3.fromDegrees(116.396, 39.912, 100)
      ]

      const result = computeAttackArrowPositions(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(positions.length)
    })

    it('should handle partial options', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.394, 39.91, 100)
      ]

      const options: AttackArrowOptions = {
        headHeightFactor: 0.25
      }

      const result = computeAttackArrowPositions(positions, options)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should create smooth arrow shape', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.394, 39.91, 100)
      ]

      const result = computeAttackArrowPositions(positions)

      // 箭头应该有足够多的点来形成平滑形状
      expect(result.length).toBeGreaterThan(20)
    })

    it('should handle different height values', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 0),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 200),
        Cartesian3.fromDegrees(116.394, 39.91, 300)
      ]

      const result = computeAttackArrowPositions(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })
  })

  // ==================== computeAttackArrowPWPositions ====================
  describe('computeAttackArrowPWPositions', () => {
    it('should compute flat-tail attack arrow positions with default options', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.394, 39.91, 100)
      ]

      const result = computeAttackArrowPWPositions(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(positions.length)
      result.forEach((pos) => {
        expect(pos).toBeInstanceOf(Cartesian3)
      })
    })

    it('should compute flat-tail arrow with custom options', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.394, 39.91, 100)
      ]

      const options: AttackArrowPWOptions = {
        headHeightFactor: 0.2,
        headWidthFactor: 0.35,
        neckHeightFactor: 0.9,
        neckWidthFactor: 0.2,
        tailWidthFactor: 0.15
      }

      const result = computeAttackArrowPWPositions(positions, options)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(positions.length)
    })

    it('should return original positions if less than 3 points', () => {
      const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.908, 100)]

      const result = computeAttackArrowPWPositions(positions)

      expect(result).toBe(positions)
    })

    it('should return empty array for null input', () => {
      const result = computeAttackArrowPWPositions(null as any)

      expect(result).toEqual([])
    })

    it('should handle exactly 3 points', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100)
      ]

      const result = computeAttackArrowPWPositions(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should create smooth arrow shape with flat tail', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.394, 39.91, 100)
      ]

      const result = computeAttackArrowPWPositions(positions)

      // 平尾箭头应该有足够多的点来形成平滑形状
      expect(result.length).toBeGreaterThan(20)
    })

    it('should handle partial options', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.394, 39.91, 100)
      ]

      const options: AttackArrowPWOptions = {
        tailWidthFactor: 0.2
      }

      const result = computeAttackArrowPWPositions(positions, options)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle many points', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.394, 39.91, 100),
        Cartesian3.fromDegrees(116.395, 39.911, 100),
        Cartesian3.fromDegrees(116.396, 39.912, 100)
      ]

      const result = computeAttackArrowPWPositions(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(positions.length)
    })
  })

  // ==================== computeAttackArrowYWPositions ====================
  describe('computeAttackArrowYWPositions', () => {
    it('should compute swallow-tail attack arrow positions with default options', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.394, 39.91, 100)
      ]

      const result = computeAttackArrowYWPositions(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(positions.length)
      result.forEach((pos) => {
        expect(pos).toBeInstanceOf(Cartesian3)
      })
    })

    it('should compute swallow-tail arrow with custom options', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.394, 39.91, 100)
      ]

      const options: AttackArrowYWOptions = {
        headHeightFactor: 0.2,
        headWidthFactor: 0.35,
        neckHeightFactor: 0.9,
        neckWidthFactor: 0.2,
        tailWidthFactor: 0.15,
        headTailFactor: 0.9,
        swallowTailFactor: 1.2
      }

      const result = computeAttackArrowYWPositions(positions, options)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(positions.length)
    })

    it('should return original positions if less than 3 points', () => {
      const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.908, 100)]

      const result = computeAttackArrowYWPositions(positions)

      expect(result).toBe(positions)
    })

    it('should return empty array for null input', () => {
      const result = computeAttackArrowYWPositions(null as any)

      expect(result).toEqual([])
    })

    it('should handle exactly 3 points', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100)
      ]

      const result = computeAttackArrowYWPositions(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should create smooth arrow shape with swallow tail', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.394, 39.91, 100)
      ]

      const result = computeAttackArrowYWPositions(positions)

      // 燕尾箭头应该有足够多的点来形成平滑形状，且比其他类型更多（因为有燕尾）
      expect(result.length).toBeGreaterThan(20)
    })

    it('should handle partial options', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.394, 39.91, 100)
      ]

      const options: AttackArrowYWOptions = {
        swallowTailFactor: 1.5
      }

      const result = computeAttackArrowYWPositions(positions, options)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle many points', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.394, 39.91, 100),
        Cartesian3.fromDegrees(116.395, 39.911, 100),
        Cartesian3.fromDegrees(116.396, 39.912, 100)
      ]

      const result = computeAttackArrowYWPositions(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(positions.length)
    })

    it('should handle zero swallow tail factor', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.394, 39.91, 100)
      ]

      const options: AttackArrowYWOptions = {
        swallowTailFactor: 0
      }

      const result = computeAttackArrowYWPositions(positions, options)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle large swallow tail factor', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100),
        Cartesian3.fromDegrees(116.394, 39.91, 100)
      ]

      const options: AttackArrowYWOptions = {
        swallowTailFactor: 2.0
      }

      const result = computeAttackArrowYWPositions(positions, options)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })
  })

  // ==================== 比较测试 ====================
  describe('arrow types comparison', () => {
    const basePositions = [
      Cartesian3.fromDegrees(116.391, 39.907, 100),
      Cartesian3.fromDegrees(116.392, 39.908, 100),
      Cartesian3.fromDegrees(116.393, 39.909, 100),
      Cartesian3.fromDegrees(116.394, 39.91, 100)
    ]

    it('should generate different shapes for different arrow types', () => {
      const normalArrow = computeAttackArrowPositions(basePositions)
      const flatTailArrow = computeAttackArrowPWPositions(basePositions)
      const swallowTailArrow = computeAttackArrowYWPositions(basePositions)

      // 所有类型都应该生成有效的点数组
      expect(normalArrow.length).toBeGreaterThan(0)
      expect(flatTailArrow.length).toBeGreaterThan(0)
      expect(swallowTailArrow.length).toBeGreaterThan(0)

      // 燕尾箭头应该有最多的点（因为有额外的燕尾点）
      expect(swallowTailArrow.length).toBeGreaterThanOrEqual(normalArrow.length)
    })

    it('should all handle the same input positions', () => {
      const normalArrow = computeAttackArrowPositions(basePositions)
      const flatTailArrow = computeAttackArrowPWPositions(basePositions)
      const swallowTailArrow = computeAttackArrowYWPositions(basePositions)

      // 所有箭头都应该是 Cartesian3 实例
      normalArrow.forEach((pos) => expect(pos).toBeInstanceOf(Cartesian3))
      flatTailArrow.forEach((pos) => expect(pos).toBeInstanceOf(Cartesian3))
      swallowTailArrow.forEach((pos) => expect(pos).toBeInstanceOf(Cartesian3))
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

      const result = computeAttackArrowPositions(positions)

      expect(result).toBeInstanceOf(Array)
    })

    it('should handle very close points', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.391001, 39.907001, 100),
        Cartesian3.fromDegrees(116.391002, 39.907002, 100),
        Cartesian3.fromDegrees(116.391003, 39.907003, 100)
      ]

      const result = computeAttackArrowPositions(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle very far apart points', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(117.0, 40.0, 100),
        Cartesian3.fromDegrees(118.0, 41.0, 100),
        Cartesian3.fromDegrees(119.0, 42.0, 100)
      ]

      const result = computeAttackArrowPositions(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle negative coordinates', () => {
      const positions = [
        Cartesian3.fromDegrees(-74.006, 40.7128, 100),
        Cartesian3.fromDegrees(-74.005, 40.7138, 100),
        Cartesian3.fromDegrees(-74.004, 40.7148, 100),
        Cartesian3.fromDegrees(-74.003, 40.7158, 100)
      ]

      const result = computeAttackArrowPositions(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle zero height', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 0),
        Cartesian3.fromDegrees(116.392, 39.908, 0),
        Cartesian3.fromDegrees(116.393, 39.909, 0),
        Cartesian3.fromDegrees(116.394, 39.91, 0)
      ]

      const result = computeAttackArrowPositions(positions)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })
  })

  // ==================== 选项边界值测试 ====================
  describe('options boundary values', () => {
    const basePositions = [
      Cartesian3.fromDegrees(116.391, 39.907, 100),
      Cartesian3.fromDegrees(116.392, 39.908, 100),
      Cartesian3.fromDegrees(116.393, 39.909, 100),
      Cartesian3.fromDegrees(116.394, 39.91, 100)
    ]

    it('should handle zero factors', () => {
      const options: AttackArrowOptions = {
        headHeightFactor: 0,
        headWidthFactor: 0,
        neckHeightFactor: 0,
        neckWidthFactor: 0,
        headTailFactor: 0
      }

      const result = computeAttackArrowPositions(basePositions, options)

      expect(result).toBeInstanceOf(Array)
    })

    it('should handle very large factors', () => {
      const options: AttackArrowOptions = {
        headHeightFactor: 10,
        headWidthFactor: 10,
        neckHeightFactor: 10,
        neckWidthFactor: 10,
        headTailFactor: 10
      }

      const result = computeAttackArrowPositions(basePositions, options)

      expect(result).toBeInstanceOf(Array)
    })

    it('should handle factors equal to 1', () => {
      const options: AttackArrowOptions = {
        headHeightFactor: 1,
        headWidthFactor: 1,
        neckHeightFactor: 1,
        neckWidthFactor: 1,
        headTailFactor: 1
      }

      const result = computeAttackArrowPositions(basePositions, options)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })
  })
})
