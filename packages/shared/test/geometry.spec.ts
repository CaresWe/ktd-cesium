import { describe, it, expect } from 'vitest'
import { Cartesian3, Quaternion, Matrix4, HeadingPitchRoll } from 'cesium'
import {
  getHeadingPitchRollByOrientation,
  getHeadingPitchRollByMatrix,
  getRotateCenterPoint,
  getOnLinePointByLen,
  getPositionTranslation,
  getOffsetLine,
  centerOfMass,
  getMidpoint,
  getPerpendicularPoint,
  getPointToLineDistance
} from '../src/geometry'

describe('geometry', () => {
  describe('getHeadingPitchRollByOrientation', () => {
    it('should return HeadingPitchRoll from quaternion and position', () => {
      const position = Cartesian3.fromDegrees(116.391, 39.907, 100)
      const orientation = Quaternion.IDENTITY

      const result = getHeadingPitchRollByOrientation(position, orientation)

      expect(result).toBeInstanceOf(HeadingPitchRoll)
    })

    it('should return default HeadingPitchRoll for undefined inputs', () => {
      const result = getHeadingPitchRollByOrientation(undefined as any, undefined as any)

      expect(result).toBeInstanceOf(HeadingPitchRoll)
    })
  })

  describe('getHeadingPitchRollByMatrix', () => {
    it('should return HeadingPitchRoll from matrix', () => {
      const matrix = Matrix4.IDENTITY

      const result = getHeadingPitchRollByMatrix(matrix)

      expect(result).toBeInstanceOf(HeadingPitchRoll)
    })
  })

  describe('getRotateCenterPoint', () => {
    it('should rotate point around center', () => {
      const center = Cartesian3.fromDegrees(116.391, 39.907, 100)
      const point = Cartesian3.fromDegrees(116.392, 39.907, 100)

      const result = getRotateCenterPoint(center, point, 90)

      expect(result).toBeInstanceOf(Cartesian3)
      expect(result).not.toBe(point)
    })

    it('should return same point for 0 degree rotation', () => {
      const center = Cartesian3.fromDegrees(116.391, 39.907, 100)
      const point = Cartesian3.fromDegrees(116.392, 39.907, 100)

      const result = getRotateCenterPoint(center, point, 0)

      expect(result.x).toBeCloseTo(point.x, 5)
      expect(result.y).toBeCloseTo(point.y, 5)
      expect(result.z).toBeCloseTo(point.z, 5)
    })

    it('should handle 360 degree rotation', () => {
      const center = Cartesian3.fromDegrees(116.391, 39.907, 100)
      const point = Cartesian3.fromDegrees(116.392, 39.907, 100)

      const result = getRotateCenterPoint(center, point, 360)

      expect(result.x).toBeCloseTo(point.x, 3)
      expect(result.y).toBeCloseTo(point.y, 3)
      expect(result.z).toBeCloseTo(point.z, 3)
    })
  })

  describe('getOnLinePointByLen', () => {
    it('should get point on line at specified distance', () => {
      const p1 = Cartesian3.fromDegrees(116.391, 39.907, 100)
      const p2 = Cartesian3.fromDegrees(116.392, 39.907, 100)

      const result = getOnLinePointByLen(p1, p2, 100)

      expect(result).toBeInstanceOf(Cartesian3)
    })

    it('should add to original distance when addBS is true', () => {
      const p1 = Cartesian3.fromDegrees(116.391, 39.907, 100)
      const p2 = Cartesian3.fromDegrees(116.392, 39.907, 100)

      const result = getOnLinePointByLen(p1, p2, 100, true)

      expect(result).toBeInstanceOf(Cartesian3)
    })
  })

  describe('getPositionTranslation', () => {
    it('should translate position by offset', () => {
      const position = Cartesian3.fromDegrees(116.391, 39.907, 100)
      const offset = { x: 100, y: 100, z: 0 }

      const result = getPositionTranslation(position, offset)

      expect(result).toBeInstanceOf(Cartesian3)
      expect(result).not.toBe(position)
    })

    it('should handle rotation', () => {
      const position = Cartesian3.fromDegrees(116.391, 39.907, 100)
      const offset = { x: 100, y: 0, z: 0 }

      const result = getPositionTranslation(position, offset, 90)

      expect(result).toBeInstanceOf(Cartesian3)
    })

    it('should handle different rotation axes', () => {
      const position = Cartesian3.fromDegrees(116.391, 39.907, 100)
      const offset = { x: 100, y: 0, z: 0 }

      const resultX = getPositionTranslation(position, offset, 45, 'x')
      const resultY = getPositionTranslation(position, offset, 45, 'y')
      const resultZ = getPositionTranslation(position, offset, 45, 'z')

      expect(resultX).toBeInstanceOf(Cartesian3)
      expect(resultY).toBeInstanceOf(Cartesian3)
      expect(resultZ).toBeInstanceOf(Cartesian3)
    })
  })

  describe('getOffsetLine', () => {
    it('should create offset line', () => {
      const positions = [
        Cartesian3.fromDegrees(116.391, 39.907, 100),
        Cartesian3.fromDegrees(116.392, 39.908, 100),
        Cartesian3.fromDegrees(116.393, 39.909, 100)
      ]

      const result = getOffsetLine(positions, 0.5)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBe(positions.length)
    })

    it('should handle negative offset', () => {
      const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.392, 39.908, 100)]

      const result = getOffsetLine(positions, -0.5)

      expect(result).toBeInstanceOf(Array)
      expect(result).toHaveLength(2)
    })
  })

  describe('centerOfMass', () => {
    it('should calculate center of mass', () => {
      const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100), Cartesian3.fromDegrees(116.393, 39.909, 100)]

      const result = centerOfMass(positions)

      expect(result).toBeInstanceOf(Cartesian3)
    })

    it('should return first position for invalid input', () => {
      const positions = [Cartesian3.fromDegrees(116.391, 39.907, 100)]

      const result = centerOfMass(positions)

      expect(result).toBeInstanceOf(Cartesian3)
      expect(result.x).toBeCloseTo(positions[0].x, 5)
      expect(result.y).toBeCloseTo(positions[0].y, 5)
      expect(result.z).toBeCloseTo(positions[0].z, 5)
    })

    it('should handle empty array gracefully', () => {
      const result = centerOfMass([])

      expect(result).toBeInstanceOf(Cartesian3)
    })
  })

  describe('getMidpoint', () => {
    it('should calculate midpoint between two points', () => {
      const p1 = Cartesian3.fromDegrees(116.391, 39.907, 100)
      const p2 = Cartesian3.fromDegrees(116.393, 39.909, 100)

      const result = getMidpoint(p1, p2)

      expect(result).toBeInstanceOf(Cartesian3)
    })
  })

  describe('getPerpendicularPoint', () => {
    it('should calculate perpendicular point', () => {
      const point = Cartesian3.fromDegrees(116.392, 39.909, 100)
      const lineStart = Cartesian3.fromDegrees(116.391, 39.907, 100)
      const lineEnd = Cartesian3.fromDegrees(116.393, 39.907, 100)

      const result = getPerpendicularPoint(point, lineStart, lineEnd)

      expect(result).toBeInstanceOf(Cartesian3)
    })
  })

  describe('getPointToLineDistance', () => {
    it('should calculate distance from point to line', () => {
      const point = Cartesian3.fromDegrees(116.392, 39.909, 100)
      const lineStart = Cartesian3.fromDegrees(116.391, 39.907, 100)
      const lineEnd = Cartesian3.fromDegrees(116.393, 39.907, 100)

      const result = getPointToLineDistance(point, lineStart, lineEnd)

      expect(typeof result).toBe('number')
      expect(result).toBeGreaterThanOrEqual(0)
    })
  })
})
