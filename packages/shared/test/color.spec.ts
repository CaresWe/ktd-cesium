import { describe, it, expect } from 'vitest'
import { Color } from 'cesium'
import { hexToColor, rgbToColor, lerpColor, valueToGradientColor } from '../src/color'

describe('color', () => {
  describe('hexToColor', () => {
    it('should convert hex color to Cesium Color', () => {
      const color = hexToColor('#FF0000')

      expect(color).toBeInstanceOf(Color)
      expect(color.red).toBeCloseTo(1, 2)
      expect(color.green).toBeCloseTo(0, 2)
      expect(color.blue).toBeCloseTo(0, 2)
      expect(color.alpha).toBeCloseTo(1, 2)
    })

    it('should handle custom alpha', () => {
      const color = hexToColor('#00FF00', 0.5)

      expect(color.red).toBeCloseTo(0, 2)
      expect(color.green).toBeCloseTo(1, 2)
      expect(color.blue).toBeCloseTo(0, 2)
      expect(color.alpha).toBeCloseTo(0.5, 2)
    })

    it('should handle shorthand hex colors', () => {
      const color = hexToColor('#F00')

      expect(color.red).toBeCloseTo(1, 2)
      expect(color.green).toBeCloseTo(0, 2)
      expect(color.blue).toBeCloseTo(0, 2)
    })

    it('should handle hex colors with alpha channel', () => {
      const color = hexToColor('#FF000080')

      expect(color.red).toBeCloseTo(1, 2)
      // Alpha value from hex is applied, then withAlpha overrides it
      // Since we're calling withAlpha(1) by default, alpha will be 1
      expect(color.alpha).toBeCloseTo(1, 2)
    })

    it('should handle black and white', () => {
      const black = hexToColor('#000000')
      const white = hexToColor('#FFFFFF')

      expect(black.red).toBeCloseTo(0, 2)
      expect(black.green).toBeCloseTo(0, 2)
      expect(black.blue).toBeCloseTo(0, 2)

      expect(white.red).toBeCloseTo(1, 2)
      expect(white.green).toBeCloseTo(1, 2)
      expect(white.blue).toBeCloseTo(1, 2)
    })
  })

  describe('rgbToColor', () => {
    it('should convert RGB to Cesium Color', () => {
      const color = rgbToColor(255, 0, 0)

      expect(color).toBeInstanceOf(Color)
      expect(color.red).toBeCloseTo(1, 2)
      expect(color.green).toBeCloseTo(0, 2)
      expect(color.blue).toBeCloseTo(0, 2)
      expect(color.alpha).toBeCloseTo(1, 2)
    })

    it('should handle custom alpha', () => {
      const color = rgbToColor(0, 255, 0, 0.5)

      expect(color.green).toBeCloseTo(1, 2)
      expect(color.alpha).toBeCloseTo(0.5, 2)
    })

    it('should handle partial RGB values', () => {
      const color = rgbToColor(128, 128, 128)

      expect(color.red).toBeCloseTo(0.5, 1)
      expect(color.green).toBeCloseTo(0.5, 1)
      expect(color.blue).toBeCloseTo(0.5, 1)
    })

    it('should handle zero values', () => {
      const color = rgbToColor(0, 0, 0)

      expect(color.red).toBe(0)
      expect(color.green).toBe(0)
      expect(color.blue).toBe(0)
    })

    it('should handle max values', () => {
      const color = rgbToColor(255, 255, 255)

      expect(color.red).toBeCloseTo(1, 2)
      expect(color.green).toBeCloseTo(1, 2)
      expect(color.blue).toBeCloseTo(1, 2)
    })
  })

  describe('lerpColor', () => {
    it('should interpolate between two colors', () => {
      const start = Color.RED
      const end = Color.BLUE

      const middle = lerpColor(start, end, 0.5)

      expect(middle).toBeInstanceOf(Color)
      expect(middle.red).toBeCloseTo(0.5, 1)
      expect(middle.blue).toBeCloseTo(0.5, 1)
    })

    it('should return start color at t=0', () => {
      const start = Color.RED
      const end = Color.BLUE

      const result = lerpColor(start, end, 0)

      expect(result.red).toBeCloseTo(start.red, 2)
      expect(result.green).toBeCloseTo(start.green, 2)
      expect(result.blue).toBeCloseTo(start.blue, 2)
    })

    it('should return end color at t=1', () => {
      const start = Color.RED
      const end = Color.BLUE

      const result = lerpColor(start, end, 1)

      expect(result.red).toBeCloseTo(end.red, 2)
      expect(result.green).toBeCloseTo(end.green, 2)
      expect(result.blue).toBeCloseTo(end.blue, 2)
    })

    it('should handle alpha channel interpolation', () => {
      const start = new Color(1, 0, 0, 1)
      const end = new Color(0, 0, 1, 0)

      const middle = lerpColor(start, end, 0.5)

      expect(middle.alpha).toBeCloseTo(0.5, 1)
    })
  })

  describe('valueToGradientColor', () => {
    it('should map value to gradient color', () => {
      const start = Color.RED
      const end = Color.BLUE

      const middle = valueToGradientColor(5, 0, 10, start, end)

      expect(middle).toBeInstanceOf(Color)
      expect(middle.red).toBeCloseTo(0.5, 1)
      expect(middle.blue).toBeCloseTo(0.5, 1)
    })

    it('should clamp to start color for values below min', () => {
      const start = Color.RED
      const end = Color.BLUE

      const result = valueToGradientColor(-5, 0, 10, start, end)

      expect(result.red).toBeCloseTo(start.red, 2)
      expect(result.green).toBeCloseTo(start.green, 2)
      expect(result.blue).toBeCloseTo(start.blue, 2)
    })

    it('should clamp to end color for values above max', () => {
      const start = Color.RED
      const end = Color.BLUE

      const result = valueToGradientColor(15, 0, 10, start, end)

      expect(result.red).toBeCloseTo(end.red, 2)
      expect(result.green).toBeCloseTo(end.green, 2)
      expect(result.blue).toBeCloseTo(end.blue, 2)
    })

    it('should handle negative ranges', () => {
      const start = Color.RED
      const end = Color.BLUE

      const result = valueToGradientColor(0, -10, 10, start, end)

      expect(result.red).toBeCloseTo(0.5, 1)
      expect(result.blue).toBeCloseTo(0.5, 1)
    })

    it('should handle reversed ranges', () => {
      const start = Color.RED
      const end = Color.BLUE

      const result = valueToGradientColor(7.5, 10, 0, start, end)

      // Value is at 25% (2.5 from max of 10)
      // This should give a color closer to start
      expect(result).toBeInstanceOf(Color)
    })
  })
})
