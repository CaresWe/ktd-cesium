import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AnalysisPlugin } from '../src/modules/AnalysisPlugin'
import type { AutoViewer } from '@auto-cesium/core'
import type { GraphicsPlugin } from '../src/modules/GraphicsPlugin'
import * as Cesium from 'cesium'
import { MeasureEventType } from '../src/modules/AnalysisPlugin/types'

// Mock Cesium CustomDataSource
class MockCustomDataSource {
  name: string
  entities = {
    values: [] as Cesium.Entity[],
    add: vi.fn((entity: Cesium.Entity) => entity),
    remove: vi.fn(),
    removeAll: vi.fn(),
    getById: vi.fn(),
    contains: vi.fn(() => true)
  }

  constructor(name: string) {
    this.name = name
  }
}

// Mock Cesium Viewer
const createMockCesiumViewer = (): Cesium.Viewer => {
  return {
    scene: {},
    camera: {},
    entities: {},
    container: {
      style: {}
    },
    dataSources: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(() => true)
    }
  } as unknown as Cesium.Viewer
}

// Mock AutoViewer
const createMockViewer = (graphicsPlugin?: GraphicsPlugin | null): AutoViewer => {
  const mockCesiumViewer = createMockCesiumViewer()

  return {
    cesiumViewer: mockCesiumViewer,
    getPlugin: vi.fn((name: string) => {
      if (name === 'graphics') return graphicsPlugin
      return null
    })
  } as unknown as AutoViewer
}

// Mock GraphicsPlugin
const createMockGraphicsPlugin = (): GraphicsPlugin => {
  const mockDataSource = new MockCustomDataSource('graphics-datasource')

  return {
    getDataSource: vi.fn(() => mockDataSource)
  } as unknown as GraphicsPlugin
}

describe('AnalysisPlugin', () => {
  let plugin: AnalysisPlugin
  let mockViewer: AutoViewer

  beforeEach(() => {
    plugin = new AnalysisPlugin()
    mockViewer = createMockViewer()
  })

  describe('初始化', () => {
    it('应该正确设置插件名称', () => {
      expect(plugin.name).toBe('analysis')
      expect(AnalysisPlugin.pluginName).toBe('analysis')
    })

    it('初始状态应该未安装', () => {
      expect(plugin.installed).toBe(false)
    })
  })

  describe('安装插件', () => {
    it('应该成功安装插件', () => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
      expect(plugin.installed).toBe(true)
    })

    it('安装时应该创建独立数据源（无 GraphicsPlugin）', () => {
      const viewer = createMockViewer(null)
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(viewer)

      expect(viewer.cesiumViewer.dataSources.add).toHaveBeenCalled()
    })

    it('安装时应该共享 GraphicsPlugin 的数据源', () => {
      const graphicsPlugin = createMockGraphicsPlugin()
      const viewer = createMockViewer(graphicsPlugin)
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(viewer)

      expect(graphicsPlugin.getDataSource).toHaveBeenCalled()
      expect(viewer.cesiumViewer.dataSources.add).not.toHaveBeenCalled()
    })

    it('应该支持传入配置选项', () => {
      const options = {
        showMidpoint: false,
        liveUpdate: false,
        style: {
          lineColor: '#ff0000'
        }
      }

      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer, options)
      expect(plugin.installed).toBe(true)
    })
  })

  describe('startMeasure 方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够开始距离测量', () => {
      const result = plugin.startMeasure({
        type: 'distance'
      })

      expect(result).toBe(plugin)
    })

    it('应该能够开始面积测量', () => {
      const result = plugin.startMeasure({
        type: 'area'
      })

      expect(result).toBe(plugin)
    })

    it('应该能够设置样式', () => {
      const customStyle = {
        lineColor: '#00ff00',
        lineWidth: 3
      }

      plugin.startMeasure({
        type: 'distance',
        style: customStyle
      })

      expect(plugin).toBeDefined()
    })

    it('应该支持完成回调', () => {
      const onComplete = vi.fn()

      plugin.startMeasure({
        type: 'distance',
        onComplete
      })

      expect(plugin).toBeDefined()
    })

    it('应该支持更新回调', () => {
      const onUpdate = vi.fn()

      plugin.startMeasure({
        type: 'distance',
        onUpdate
      })

      expect(plugin).toBeDefined()
    })

    it('开始新测量时应该停止当前测量', () => {
      plugin.startMeasure({ type: 'distance' })
      plugin.startMeasure({ type: 'area' })

      expect(plugin).toBeDefined()
    })

    it('应该支持所有测量类型', () => {
      const measureTypes = [
        'distance',
        'surfaceDistance',
        'area',
        'surfaceArea',
        'height',
        'coordinate',
        'triangle',
        'angle',
        'profile',
        'volume',
        'viewshed',
        'skyline',
        'shortestPath',
        'buffer',
        'viewshedAnalysis',
        'sunlight',
        'overlay'
      ] as const

      measureTypes.forEach((type) => {
        plugin.startMeasure({ type })
        expect(plugin).toBeDefined()
      })
    })
  })

  describe('stopMeasure 方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够停止测量', () => {
      plugin.startMeasure({ type: 'distance' })
      const result = plugin.stopMeasure()

      expect(result).toBe(plugin)
    })

    it('未开始测量时停止应该不报错', () => {
      expect(() => plugin.stopMeasure()).not.toThrow()
    })
  })

  describe('clearAll 方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该清除所有测量结果', () => {
      plugin.clearAll()

      const results = plugin.getResults()
      expect(results).toHaveLength(0)
    })

    it('清除时应该停止当前测量', () => {
      plugin.startMeasure({ type: 'distance' })
      plugin.clearAll()

      expect(plugin).toBeDefined()
    })
  })

  describe('remove 方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够移除指定的测量结果', () => {
      const result = plugin.remove('test-entity-id')
      expect(result).toBe(plugin)
    })
  })

  describe('getResults 和 getResult 方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该返回空数组（初始状态）', () => {
      const results = plugin.getResults()
      expect(results).toEqual([])
    })

    it('getResult 应该返回 null（不存在的 ID）', () => {
      const result = plugin.getResult('non-existent-id')
      expect(result).toBeNull()
    })
  })

  describe('exportGeoJSON 方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该导出空数组（无测量结果）', () => {
      const geojson = plugin.exportGeoJSON()
      expect(geojson).toEqual([])
    })
  })

  describe('importGeoJSON 方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够导入 Point 类型的 GeoJSON', () => {
      const features = [
        {
          type: 'Feature' as const,
          properties: {
            measureType: 'coordinate',
            value: 'test',
            text: 'Test Point'
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [120.0, 30.0, 100.0]
          }
        }
      ]

      const result = plugin.importGeoJSON(features)
      expect(result).toBe(plugin)
    })

    it('应该能够导入 LineString 类型的 GeoJSON', () => {
      const features = [
        {
          type: 'Feature' as const,
          properties: {
            measureType: 'distance',
            value: 1000,
            text: '1000m'
          },
          geometry: {
            type: 'LineString' as const,
            coordinates: [
              [120.0, 30.0, 100.0],
              [120.1, 30.1, 100.0]
            ]
          }
        }
      ]

      const result = plugin.importGeoJSON(features)
      expect(result).toBe(plugin)
    })

    it('应该能够导入 Polygon 类型的 GeoJSON', () => {
      const features = [
        {
          type: 'Feature' as const,
          properties: {
            measureType: 'area',
            value: 5000,
            text: '5000m²'
          },
          geometry: {
            type: 'Polygon' as const,
            coordinates: [
              [
                [120.0, 30.0, 100.0],
                [120.1, 30.0, 100.0],
                [120.1, 30.1, 100.0],
                [120.0, 30.1, 100.0],
                [120.0, 30.0, 100.0]
              ]
            ]
          }
        }
      ]

      const result = plugin.importGeoJSON(features)
      expect(result).toBe(plugin)
    })

    it('应该忽略无效的 GeoJSON 特征', () => {
      const features = [
        {
          type: 'Feature' as const,
          properties: null,
          geometry: null
        }
      ] as never

      expect(() => plugin.importGeoJSON(features)).not.toThrow()
    })
  })

  describe('setSnapConfig 方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够设置吸附配置', () => {
      const result = plugin.setSnapConfig({
        enabled: true,
        radius: 20
      })

      expect(result).toBe(plugin)
    })

    it('启用吸附时应该自动添加 GraphicsPlugin 数据源', () => {
      const graphicsPlugin = createMockGraphicsPlugin()
      const viewer = createMockViewer(graphicsPlugin)
      const newPlugin = new AnalysisPlugin()
      // @ts-expect-error - 测试目的需要访问 install 方法
      newPlugin.install(viewer)

      newPlugin.setSnapConfig({ enabled: true })

      expect(graphicsPlugin.getDataSource).toHaveBeenCalled()
    })
  })

  describe('事件系统', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够监听事件', () => {
      const callback = vi.fn()
      const result = plugin.on(MeasureEventType.COMPLETE, callback)

      expect(result).toBe(plugin)
    })

    it('应该能够取消监听事件', () => {
      const callback = vi.fn()
      plugin.on(MeasureEventType.COMPLETE, callback)

      const result = plugin.off(MeasureEventType.COMPLETE, callback)
      expect(result).toBe(plugin)
    })

    it('应该能够取消所有指定类型的监听', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      plugin.on(MeasureEventType.COMPLETE, callback1)
      plugin.on(MeasureEventType.COMPLETE, callback2)

      const result = plugin.off(MeasureEventType.COMPLETE)
      expect(result).toBe(plugin)
    })
  })

  describe('销毁插件', () => {
    it('应该正确清理资源', () => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
      plugin.startMeasure({ type: 'distance' })

      plugin.destroy()

      expect(plugin.installed).toBe(false)
    })

    it('销毁时应该移除独立数据源', () => {
      const viewer = createMockViewer(null)
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(viewer)

      plugin.destroy()

      expect(viewer.cesiumViewer.dataSources.remove).toHaveBeenCalled()
    })

    it('销毁时不应该移除共享数据源', () => {
      const graphicsPlugin = createMockGraphicsPlugin()
      const viewer = createMockViewer(graphicsPlugin)

      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(viewer)
      plugin.destroy()

      expect(viewer.cesiumViewer.dataSources.remove).not.toHaveBeenCalled()
    })

    it('未安装时销毁应该不报错', () => {
      expect(() => plugin.destroy()).not.toThrow()
    })
  })

  describe('链式调用', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该支持链式调用', () => {
      const result = plugin.setSnapConfig({ enabled: true }).startMeasure({ type: 'distance' }).stopMeasure().clearAll()

      expect(result).toBe(plugin)
    })
  })
})
