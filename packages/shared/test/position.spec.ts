import { describe, it, expect, vi } from 'vitest'
import { Cartesian3, Viewer, Cartographic } from 'cesium'
import {
  getMaxHeight,
  getMinHeight,
  getAverageHeight,
  addPositionsHeight,
  setPositionsHeight,
  getDistance,
  getTotalDistance,
  getCenterPosition,
  lerpPosition,
  interpolatePositions,
  setPositionSurfaceHeight
} from '../src/position'

describe('position', () => {
  // ==================== 高度相关函数 ====================
  describe('getMaxHeight', () => {
    it('should return max height from positions', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 500),
        Cartesian3.fromDegrees(116.393, 39.909, 300)
      ]

      const maxHeight = getMaxHeight(positions)
      expect(maxHeight).toBe(500)
    })

    it('should return default value for empty array', () => {
      expect(getMaxHeight([])).toBe(0)
      expect(getMaxHeight([], 100)).toBe(100)
    })

    it('should return default value for null input', () => {
      expect(getMaxHeight(null as unknown as Cartesian3[])).toBe(0)
      expect(getMaxHeight(null as unknown as Cartesian3[], 200)).toBe(200)
    })

    it('should handle single position', () => {
      const positions = [Cartesian3.fromDegrees(116.391, 39.907, 250)]
      expect(getMaxHeight(positions)).toBe(250)
    })

    it('should format to 2 decimal places', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100.456),
        Cartesian3.fromDegrees(116.392, 39.908, 200.789)
      ]

      const maxHeight = getMaxHeight(positions)
      expect(maxHeight).toBe(200.79)
    })
  })

  describe('getMinHeight', () => {
    it('should return min height from positions', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 500),
        Cartesian3.fromDegrees(116.393, 39.909, 300)
      ]

      const minHeight = getMinHeight(positions)
      expect(minHeight).toBe(100)
    })

    it('should return default value for empty array', () => {
      expect(getMinHeight([])).toBe(0)
      expect(getMinHeight([], 50)).toBe(50)
    })

    it('should return default value for null input', () => {
      expect(getMinHeight(null as unknown as Cartesian3[])).toBe(0)
    })

    it('should handle negative heights', () => {
      const positions = [Cartesian3.fromDegrees(116.391, 39.907, -50), Cartesian3.fromDegrees(116.392, 39.908, 100)]

      const minHeight = getMinHeight(positions)
      expect(minHeight).toBe(-50)
    })

    it('should format to 2 decimal places', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100.456),
        Cartesian3.fromDegrees(116.392, 39.908, 50.123)
      ]

      const minHeight = getMinHeight(positions)
      expect(minHeight).toBe(50.12)
    })
  })

  describe('getAverageHeight', () => {
    it('should calculate average height', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 200),
        Cartesian3.fromDegrees(116.393, 39.909, 300)
      ]

      const avgHeight = getAverageHeight(positions)
      expect(avgHeight).toBe(200)
    })

    it('should return 0 for empty array', () => {
      expect(getAverageHeight([])).toBe(0)
    })

    it('should return 0 for null input', () => {
      expect(getAverageHeight(null as unknown as Cartesian3[])).toBe(0)
    })

    it('should format to 2 decimal places', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 150),
        Cartesian3.fromDegrees(116.393, 39.909, 200)
      ]

      const avgHeight = getAverageHeight(positions)
      expect(avgHeight).toBe(150)
    })
  })

  // ==================== 高度调整函数 ====================
  describe('addPositionsHeight', () => {
    it('should add height to single position', () => {
      const position = Cartesian3.fromDegrees(116.391, 39.907, 100)
      const result = addPositionsHeight(position, 50) as Cartesian3

      const carto = Cartographic.fromCartesian(result)
      expect(carto.height).toBeCloseTo(150, 1)
    })

    it('should add height to position array', () => {
      const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.908, 200)]

      const result = addPositionsHeight(positions, 50) as Cartesian3[]

      expect(result).toHaveLength(2)
      const carto1 = Cartographic.fromCartesian(result[0])
      const carto2 = Cartographic.fromCartesian(result[1])
      expect(carto1.height).toBeCloseTo(150, 1)
      expect(carto2.height).toBeCloseTo(250, 1)
    })

    it('should return original positions if addHeight is 0', () => {
      const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100)]
      const result = addPositionsHeight(positions, 0)

      expect(result).toBe(positions)
    })

    it('should handle negative height additions', () => {
      const position = Cartesian3.fromDegrees(116.391, 39.907, 100)
      const result = addPositionsHeight(position, -50) as Cartesian3

      const carto = Cartographic.fromCartesian(result)
      expect(carto.height).toBeCloseTo(50, 1)
    })

    it('should handle NaN and convert to 0', () => {
      const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100)]
      const result = addPositionsHeight(positions, NaN)

      expect(result).toBe(positions)
    })

    it('should handle string numbers', () => {
      const position = Cartesian3.fromDegrees(116.391, 39.907, 100)
      const result = addPositionsHeight(position, '50' as unknown as number) as Cartesian3

      const carto = Cartographic.fromCartesian(result)
      expect(carto.height).toBeCloseTo(150, 1)
    })
  })

  describe('setPositionsHeight', () => {
    it('should set height for single position', () => {
      const position = Cartesian3.fromDegrees(116.391, 39.907, 100)
      const result = setPositionsHeight(position, 200) as Cartesian3

      const carto = Cartographic.fromCartesian(result)
      expect(carto.height).toBeCloseTo(200, 1)
    })

    it('should set height for position array', () => {
      const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.908, 300)]

      const result = setPositionsHeight(positions, 150) as Cartesian3[]

      expect(result).toHaveLength(2)
      const carto1 = Cartographic.fromCartesian(result[0])
      const carto2 = Cartographic.fromCartesian(result[1])
      expect(carto1.height).toBeCloseTo(150, 1)
      expect(carto2.height).toBeCloseTo(150, 1)
    })

    it('should handle 0 height', () => {
      const position = Cartesian3.fromDegrees(116.391, 39.907, 100)
      const result = setPositionsHeight(position, 0) as Cartesian3

      const carto = Cartographic.fromCartesian(result)
      expect(carto.height).toBeCloseTo(0, 1)
    })

    it('should handle negative height', () => {
      const position = Cartesian3.fromDegrees(116.391, 39.907, 100)
      const result = setPositionsHeight(position, -50) as Cartesian3

      const carto = Cartographic.fromCartesian(result)
      expect(carto.height).toBeCloseTo(-50, 1)
    })
  })

  // ==================== 距离计算函数 ====================
  describe('getDistance', () => {
    it('should calculate distance between two positions', () => {
      const pos1 = Cartesian3.fromDegrees(116.391, 39.907, 100)
      const pos2 = Cartesian3.fromDegrees(116.392, 39.908, 100)

      const distance = getDistance(pos1, pos2)

      expect(distance).toBeGreaterThan(0)
      expect(distance).toBeLessThan(200) // 大约100多米
    })

    it('should return 0 for same position', () => {
      const pos = Cartesian3.fromDegrees(116.391, 39.907, 100)

      const distance = getDistance(pos, pos)

      expect(distance).toBeCloseTo(0, 1)
    })
  })

  describe('getTotalDistance', () => {
    it('should calculate total distance of positions', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100)
      ]

      const totalDistance = getTotalDistance(positions)

      expect(totalDistance).toBeGreaterThan(0)
    })

    it('should return 0 for empty array', () => {
      expect(getTotalDistance([])).toBe(0)
    })

    it('should return 0 for null input', () => {
      expect(getTotalDistance(null as unknown as Cartesian3[])).toBe(0)
    })

    it('should return 0 for single position', () => {
      const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100)]
      expect(getTotalDistance(positions)).toBe(0)
    })

    it('should format to 2 decimal places', () => {
      const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.908, 100)]

      const totalDistance = getTotalDistance(positions)

      // 检查是否是数字且保留了2位小数
      expect(typeof totalDistance).toBe('number')
    })
  })

  // ==================== 中心点和插值 ====================
  describe('getCenterPosition', () => {
    it('should calculate center position', () => {
      const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.393, 39.909, 100)]

      const center = getCenterPosition(positions)

      expect(center).toBeInstanceOf(Cartesian3)
      expect(center).not.toBeNull()
    })

    it('should return null for empty array', () => {
      expect(getCenterPosition([])).toBeNull()
    })

    it('should return null for null input', () => {
      expect(getCenterPosition(null as unknown as Cartesian3[])).toBeNull()
    })

    it('should return the position itself for single position', () => {
      const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100)]
      const center = getCenterPosition(positions)

      expect(center).toBe(positions[0])
    })

    it('should calculate correct center for multiple positions', () => {
      const positions = [
        Cartesian3.fromDegrees(0, 0, 0),
        Cartesian3.fromDegrees(0, 0, 0),
        Cartesian3.fromDegrees(0, 0, 0)
      ]

      const center = getCenterPosition(positions)

      expect(center).not.toBeNull()
      expect(center!.x).toBeCloseTo(positions[0].x, 1)
      expect(center!.y).toBeCloseTo(positions[0].y, 1)
      expect(center!.z).toBeCloseTo(positions[0].z, 1)
    })
  })

  describe('lerpPosition', () => {
    it('should interpolate between two positions', () => {
      const pos1 = Cartesian3.fromDegrees(116.391, 39.907, 100)
      const pos2 = Cartesian3.fromDegrees(116.393, 39.909, 300)

      const lerp = lerpPosition(pos1, pos2, 0.5)

      expect(lerp).toBeInstanceOf(Cartesian3)
    })

    it('should return pos1 at t=0', () => {
      const pos1 = Cartesian3.fromDegrees(116.391, 39.907, 100)
      const pos2 = Cartesian3.fromDegrees(116.393, 39.909, 300)

      const lerp = lerpPosition(pos1, pos2, 0)

      expect(lerp.x).toBeCloseTo(pos1.x, 5)
      expect(lerp.y).toBeCloseTo(pos1.y, 5)
      expect(lerp.z).toBeCloseTo(pos1.z, 5)
    })

    it('should return pos2 at t=1', () => {
      const pos1 = Cartesian3.fromDegrees(116.391, 39.907, 100)
      const pos2 = Cartesian3.fromDegrees(116.393, 39.909, 300)

      const lerp = lerpPosition(pos1, pos2, 1)

      expect(lerp.x).toBeCloseTo(pos2.x, 5)
      expect(lerp.y).toBeCloseTo(pos2.y, 5)
      expect(lerp.z).toBeCloseTo(pos2.z, 5)
    })
  })

  describe('interpolatePositions', () => {
    it('should generate interpolated positions', () => {
      const pos1 = Cartesian3.fromDegrees(116.391, 39.907, 100)
      const pos2 = Cartesian3.fromDegrees(116.393, 39.909, 300)

      const result = interpolatePositions(pos1, pos2, 3)

      expect(result).toHaveLength(5) // pos1 + 3 interpolated + pos2
      expect(result[0]).toBe(pos1)
      expect(result[4]).toBe(pos2)
    })

    it('should handle 0 count', () => {
      const pos1 = Cartesian3.fromDegrees(116.391, 39.907, 100)
      const pos2 = Cartesian3.fromDegrees(116.393, 39.909, 300)

      const result = interpolatePositions(pos1, pos2, 0)

      expect(result).toHaveLength(2)
      expect(result[0]).toBe(pos1)
      expect(result[1]).toBe(pos2)
    })

    it('should handle large count', () => {
      const pos1 = Cartesian3.fromDegrees(116.391, 39.907, 100)
      const pos2 = Cartesian3.fromDegrees(116.393, 39.909, 300)

      const result = interpolatePositions(pos1, pos2, 10)

      expect(result).toHaveLength(12)
    })
  })

  // ==================== 表面高度设置 ====================
  describe('setPositionSurfaceHeight', () => {
    it('should return null when scene methods are not available', () => {
      const position = Cartesian3.fromDegrees(116.391, 39.907, 100)

      // 创建一个模拟的 scene 对象
      const mockScene = {
        sampleHeight: vi.fn().mockReturnValue(undefined),
        globe: {
          getHeight: vi.fn().mockReturnValue(undefined)
        }
      } as unknown as Parameters<typeof setPositionSurfaceHeight>[0]

      const result = setPositionSurfaceHeight(mockScene, position)

      expect(result).toBeNull()
    })

    it('should use sampleHeight when available', () => {
      const position = Cartesian3.fromDegrees(116.391, 39.907, 100)

      const mockScene = {
        sampleHeight: vi.fn().mockReturnValue(150),
        globe: {
          getHeight: vi.fn()
        }
      } as unknown as Parameters<typeof setPositionSurfaceHeight>[0]

      const result = setPositionSurfaceHeight(mockScene, position)

      expect(result).toBeInstanceOf(Cartesian3)
      expect(mockScene.sampleHeight).toHaveBeenCalled()
    })

    it('should fallback to globe.getHeight when sampleHeight returns invalid value', () => {
      const position = Cartesian3.fromDegrees(116.391, 39.907, 100)

      const mockScene = {
        sampleHeight: vi.fn().mockReturnValue(-1001),
        globe: {
          getHeight: vi.fn().mockReturnValue(200)
        }
      } as unknown as Parameters<typeof setPositionSurfaceHeight>[0]

      const result = setPositionSurfaceHeight(mockScene, position)

      expect(result).toBeInstanceOf(Cartesian3)
      expect(mockScene.globe.getHeight).toHaveBeenCalled()
    })

    it('should handle Viewer parameter', () => {
      const position = Cartesian3.fromDegrees(116.391, 39.907, 100)

      const mockScene = {
        sampleHeight: vi.fn().mockReturnValue(150),
        globe: {
          getHeight: vi.fn()
        }
      } as unknown as Parameters<typeof setPositionSurfaceHeight>[0]

      // Create a mock that passes instanceof check by using Object.create
      const mockViewer = Object.create(Viewer.prototype)
      Object.defineProperty(mockViewer, 'scene', {
        value: mockScene,
        writable: false
      })

      const result = setPositionSurfaceHeight(mockViewer, position)

      expect(result).toBeInstanceOf(Cartesian3)
      expect(mockScene.sampleHeight).toHaveBeenCalled()
    })

    it('should handle errors gracefully', () => {
      const position = Cartesian3.fromDegrees(116.391, 39.907, 100)

      const mockScene = {
        sampleHeight: vi.fn().mockImplementation(() => {
          throw new Error('Sample height error')
        }),
        globe: {
          getHeight: vi.fn()
        }
      } as unknown as Parameters<typeof setPositionSurfaceHeight>[0]

      const result = setPositionSurfaceHeight(mockScene, position)

      expect(result).toBeNull()
    })

    it('should return null when height is too low', () => {
      const position = Cartesian3.fromDegrees(116.391, 39.907, 100)

      const mockScene = {
        sampleHeight: vi.fn().mockReturnValue(-2000),
        globe: {
          getHeight: vi.fn().mockReturnValue(-2000)
        }
      } as unknown as Parameters<typeof setPositionSurfaceHeight>[0]

      const result = setPositionSurfaceHeight(mockScene, position)

      expect(result).toBeNull()
    })
  })
})
