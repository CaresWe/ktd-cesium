import { describe, it, expect } from 'vitest'
import { clamp, lerp, mapRange, random, randomInt } from '../src/math'

describe('math', () => {
  describe('clamp', () => {
    it('should clamp value within range', () => {
      expect(clamp(5, 0, 10)).toBe(5)
      expect(clamp(-5, 0, 10)).toBe(0)
      expect(clamp(15, 0, 10)).toBe(10)
    })

    it('should handle edge cases', () => {
      expect(clamp(0, 0, 10)).toBe(0)
      expect(clamp(10, 0, 10)).toBe(10)
    })

    it('should handle negative ranges', () => {
      expect(clamp(-5, -10, -1)).toBe(-5)
      expect(clamp(-15, -10, -1)).toBe(-10)
      expect(clamp(0, -10, -1)).toBe(-1)
    })
  })

  describe('lerp', () => {
    it('should interpolate between two values', () => {
      expect(lerp(0, 10, 0)).toBe(0)
      expect(lerp(0, 10, 0.5)).toBe(5)
      expect(lerp(0, 10, 1)).toBe(10)
    })

    it('should clamp t to [0, 1]', () => {
      expect(lerp(0, 10, -0.5)).toBe(0)
      expect(lerp(0, 10, 1.5)).toBe(10)
    })

    it('should work with negative values', () => {
      expect(lerp(-10, 10, 0.5)).toBe(0)
      expect(lerp(10, -10, 0.5)).toBe(0)
    })

    it('should handle decimal precision', () => {
      const result = lerp(0, 1, 0.333)
      expect(result).toBeCloseTo(0.333, 3)
    })
  })

  describe('mapRange', () => {
    it('should map value from one range to another', () => {
      expect(mapRange(5, 0, 10, 0, 100)).toBe(50)
      expect(mapRange(0, 0, 10, 0, 100)).toBe(0)
      expect(mapRange(10, 0, 10, 0, 100)).toBe(100)
    })

    it('should work with negative ranges', () => {
      expect(mapRange(0, -10, 10, 0, 100)).toBe(50)
      expect(mapRange(-10, -10, 10, 0, 100)).toBe(0)
      expect(mapRange(10, -10, 10, 0, 100)).toBe(100)
    })

    it('should handle reversed ranges', () => {
      expect(mapRange(5, 0, 10, 100, 0)).toBe(50)
      expect(mapRange(0, 0, 10, 100, 0)).toBe(100)
      expect(mapRange(10, 0, 10, 100, 0)).toBe(0)
    })

    it('should handle decimal values', () => {
      const result = mapRange(3.5, 0, 10, 0, 100)
      expect(result).toBeCloseTo(35, 1)
    })
  })

  describe('random', () => {
    it('should generate random number in range', () => {
      for (let i = 0; i < 100; i++) {
        const value = random(0, 10)
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThan(10)
      }
    })

    it('should use default range [0, 1)', () => {
      for (let i = 0; i < 100; i++) {
        const value = random()
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThan(1)
      }
    })

    it('should work with negative ranges', () => {
      for (let i = 0; i < 100; i++) {
        const value = random(-10, -5)
        expect(value).toBeGreaterThanOrEqual(-10)
        expect(value).toBeLessThan(-5)
      }
    })
  })

  describe('randomInt', () => {
    it('should generate random integer in range (inclusive)', () => {
      const values = new Set<number>()
      for (let i = 0; i < 1000; i++) {
        const value = randomInt(0, 5)
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(5)
        expect(Number.isInteger(value)).toBe(true)
        values.add(value)
      }
      // Should generate all possible values (0-5)
      expect(values.size).toBe(6)
    })

    it('should handle single value range', () => {
      for (let i = 0; i < 50; i++) {
        const value = randomInt(5, 5)
        expect(value).toBe(5)
      }
    })

    it('should work with negative ranges', () => {
      for (let i = 0; i < 100; i++) {
        const value = randomInt(-5, -1)
        expect(value).toBeGreaterThanOrEqual(-5)
        expect(value).toBeLessThanOrEqual(-1)
        expect(Number.isInteger(value)).toBe(true)
      }
    })
  })
})
