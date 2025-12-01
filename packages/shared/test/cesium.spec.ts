import { describe, it, expect, vi } from 'vitest'
import { Cartesian3, Cartesian2 } from 'cesium'
import {
  defConfigStyle,
  removeGeoJsonDefVal,
  addGeoJsonDefVal,
  getDefStyle,
  getPositionByGeoJSON,
  formatPosition,
  getCurrentMousePosition
} from '../src/cesium'

describe('cesium', () => {
  // ==================== 默认样式配置 ====================
  describe('defConfigStyle', () => {
    it('should have default style configurations', () => {
      expect(defConfigStyle).toBeDefined()
      expect(typeof defConfigStyle).toBe('object')
    })

    it('should have common geometry types', () => {
      expect(defConfigStyle.point).toBeDefined()
      expect(defConfigStyle.polyline).toBeDefined()
      expect(defConfigStyle.polygon).toBeDefined()
      expect(defConfigStyle.circle).toBeDefined()
      expect(defConfigStyle.rectangle).toBeDefined()
    })
  })

  // ==================== GeoJSON 处理 ====================
  describe('removeGeoJsonDefVal', () => {
    it('should remove default values from geojson', () => {
      const geojson = {
        type: 'Feature',
        properties: {
          type: 'point',
          style: {
            pixelSize: 10, // 默认值
            color: '#ff0000' // 非默认值
          }
        },
        geometry: {
          type: 'Point',
          coordinates: [116.391, 39.907]
        }
      }

      const result = removeGeoJsonDefVal(geojson)

      expect(result.properties!.style).toBeDefined()
      expect(result.properties!.style!.color).toBe('#ff0000')
    })

    it('should return original geojson if no properties', () => {
      const geojson = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [116.391, 39.907]
        }
      }

      const result = removeGeoJsonDefVal(geojson)

      expect(result).toBe(geojson)
    })

    it('should return original geojson if no type', () => {
      const geojson = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [116.391, 39.907]
        }
      }

      const result = removeGeoJsonDefVal(geojson)

      expect(result).toBe(geojson)
    })
  })

  describe('addGeoJsonDefVal', () => {
    it('should add default values to properties', () => {
      const properties = {
        type: 'point',
        style: {
          color: '#ff0000'
        }
      }

      const result = addGeoJsonDefVal(properties)

      expect(result!.style).toBeDefined()
      expect(result!.style!.color).toBe('#ff0000')
      expect(result!.style!.pixelSize).toBeDefined() // 从默认值添加
    })

    it('should handle undefined properties', () => {
      const result = addGeoJsonDefVal(undefined)

      expect(result).toBeUndefined()
    })

    it('should create style object if not exists', () => {
      const properties = {
        type: 'point'
      }

      const result = addGeoJsonDefVal(properties)

      expect(result!.style).toBeDefined()
    })
  })

  describe('getDefStyle', () => {
    it('should get default style for type', () => {
      const style = getDefStyle('point')

      expect(style).toBeDefined()
      expect(style.pixelSize).toBeDefined()
      expect(style.color).toBeDefined()
    })

    it('should merge with provided style', () => {
      const style = getDefStyle('point', { color: '#ff0000' })

      expect(style.color).toBe('#ff0000')
      expect(style.pixelSize).toBeDefined() // 从默认值
    })

    it('should not override non-null values', () => {
      const style = getDefStyle('point', { color: '#ff0000', pixelSize: 20 })

      expect(style.color).toBe('#ff0000')
      expect(style.pixelSize).toBe(20)
    })

    it('should handle unknown type', () => {
      const style = getDefStyle('unknownType', { color: '#ff0000' })

      expect(style.color).toBe('#ff0000')
    })
  })

  // ==================== GeoJSON 位置获取 ====================
  describe('getPositionByGeoJSON', () => {
    describe('Point', () => {
      it('should parse Point geometry', () => {
        const geojson = {
          type: 'Point',
          coordinates: [116.391, 39.907, 100]
        }

        const result = getPositionByGeoJSON(geojson)

        expect(result).toBeInstanceOf(Cartesian3)
      })

      it('should handle Feature with Point', () => {
        const geojson = {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [116.391, 39.907]
          }
        }

        const result = getPositionByGeoJSON(geojson)

        expect(result).toBeInstanceOf(Cartesian3)
      })

      it('should use default height', () => {
        const geojson = {
          type: 'Point',
          coordinates: [116.391, 39.907]
        }

        const result = getPositionByGeoJSON(geojson, 500)

        expect(result).toBeInstanceOf(Cartesian3)
      })

      it('should return null for invalid Point coordinates', () => {
        const geojson = {
          type: 'Point',
          coordinates: []
        }

        const result = getPositionByGeoJSON(geojson)

        expect(result).toBeNull()
      })
    })

    describe('LineString', () => {
      it('should parse LineString geometry', () => {
        const geojson = {
          type: 'LineString',
          coordinates: [
            [116.391, 39.907],
            [116.392, 39.908]
          ]
        }

        const result = getPositionByGeoJSON(geojson)

        expect(Array.isArray(result)).toBe(true)
        expect((result as Cartesian3[]).length).toBe(2)
      })

      it('should return null for empty LineString', () => {
        const geojson = {
          type: 'LineString',
          coordinates: []
        }

        const result = getPositionByGeoJSON(geojson)

        expect(result).toBeNull()
      })
    })

    describe('Polygon', () => {
      it('should parse Polygon geometry', () => {
        const geojson = {
          type: 'Polygon',
          coordinates: [
            [
              [116.391, 39.907],
              [116.392, 39.908],
              [116.391, 39.909],
              [116.391, 39.907]
            ]
          ]
        }

        const result = getPositionByGeoJSON(geojson)

        expect(Array.isArray(result)).toBe(true)
        expect((result as Cartesian3[]).length).toBe(4)
      })

      it('should return null for invalid Polygon', () => {
        const geojson = {
          type: 'Polygon',
          coordinates: []
        }

        const result = getPositionByGeoJSON(geojson)

        expect(result).toBeNull()
      })
    })

    describe('MultiPolygon', () => {
      it('should parse MultiPolygon geometry', () => {
        const geojson = {
          type: 'MultiPolygon',
          coordinates: [
            [
              [
                [116.391, 39.907],
                [116.392, 39.908],
                [116.391, 39.909],
                [116.391, 39.907]
              ]
            ]
          ]
        }

        const result = getPositionByGeoJSON(geojson)

        expect(Array.isArray(result)).toBe(true)
        expect((result as Cartesian3[]).length).toBe(4)
      })

      it('should return null for invalid MultiPolygon', () => {
        const geojson = {
          type: 'MultiPolygon',
          coordinates: []
        }

        const result = getPositionByGeoJSON(geojson)

        expect(result).toBeNull()
      })
    })

    describe('Error handling', () => {
      it('should return null for missing geometry', () => {
        const geojson = {
          type: 'Feature'
        }

        const result = getPositionByGeoJSON(geojson)

        expect(result).toBeNull()
      })

      it('should return null for missing geometry type', () => {
        const geojson = {
          type: 'Feature',
          geometry: {
            coordinates: [116.391, 39.907]
          }
        }

        const result = getPositionByGeoJSON(geojson as unknown as Parameters<typeof getPositionByGeoJSON>[0])

        expect(result).toBeNull()
      })

      it('should return null for unsupported geometry type', () => {
        const geojson = {
          type: 'UnsupportedType',
          coordinates: [116.391, 39.907]
        }

        const result = getPositionByGeoJSON(geojson)

        expect(result).toBeNull()
      })
    })
  })

  // ==================== 位置格式化 ====================
  describe('formatPosition', () => {
    it('should format Cartesian3 position', () => {
      const position = Cartesian3.fromDegrees(116.391, 39.907, 100)
      const result = formatPosition(position)

      expect(result).not.toBeNull()
      expect(result!.x).toBeCloseTo(116.391, 5)
      expect(result!.y).toBeCloseTo(39.907, 5)
      expect(result!.z).toBeCloseTo(100, 1)
    })

    it('should return null for null position', () => {
      const result = formatPosition(null as unknown as Cartesian3)

      expect(result).toBeNull()
    })

    it('should format coordinates with proper precision', () => {
      const position = Cartesian3.fromDegrees(116.391234567, 39.907234567, 100.456)
      const result = formatPosition(position)

      expect(result).not.toBeNull()
      // x and y should be formatted to 6 decimal places
      // z should be formatted to 2 decimal places
      expect(result!.z).toBe(100.46)
    })
  })

  // ==================== 鼠标位置拾取 ====================
  describe('getCurrentMousePosition', () => {
    it('should handle scene without pickPositionSupported', () => {
      const mockScene = {
        pickPositionSupported: false,
        mode: 1, // SCENE3D
        pick: vi.fn().mockReturnValue(undefined),
        camera: {
          getPickRay: vi.fn().mockReturnValue({}),
          pickEllipsoid: vi.fn().mockReturnValue(Cartesian3.fromDegrees(116.391, 39.907, 100)),
          positionCartographic: { height: 5000 }
        },
        globe: {
          pick: vi.fn().mockReturnValue(Cartesian3.fromDegrees(116.391, 39.907, 100)),
          ellipsoid: {}
        }
      } as unknown as Parameters<typeof getCurrentMousePosition>[0]

      const position = new Cartesian2(100, 100)
      const result = getCurrentMousePosition(mockScene, position)

      expect(result).toBeInstanceOf(Cartesian3)
    })

    it('should handle pick exception gracefully', () => {
      const mockScene = {
        pickPositionSupported: false,
        mode: 1,
        pick: vi.fn().mockImplementation(() => {
          throw new Error('Pick error')
        }),
        camera: {
          getPickRay: vi.fn().mockReturnValue({}),
          pickEllipsoid: vi.fn().mockReturnValue(Cartesian3.fromDegrees(116.391, 39.907, 100)),
          positionCartographic: { height: 5000 }
        },
        globe: {
          pick: vi.fn().mockReturnValue(Cartesian3.fromDegrees(116.391, 39.907, 100)),
          ellipsoid: {}
        }
      } as unknown as Parameters<typeof getCurrentMousePosition>[0]

      const position = new Cartesian2(100, 100)
      getCurrentMousePosition(mockScene, position)

      expect(mockScene.pick).toHaveBeenCalled()
    })

    it('should return undefined for very low height', () => {
      const mockScene = {
        pickPositionSupported: false,
        mode: 1,
        pick: vi.fn().mockReturnValue(undefined),
        camera: {
          getPickRay: vi.fn().mockReturnValue({}),
          pickEllipsoid: vi.fn().mockReturnValue(Cartesian3.fromDegrees(116.391, 39.907, -6000)),
          positionCartographic: { height: 5000 }
        },
        globe: {
          pick: vi.fn().mockReturnValue(Cartesian3.fromDegrees(116.391, 39.907, -6000)),
          ellipsoid: {}
        }
      } as unknown as Parameters<typeof getCurrentMousePosition>[0]

      const position = new Cartesian2(100, 100)
      const result = getCurrentMousePosition(mockScene, position)

      expect(result).toBeUndefined()
    })
  })
})
