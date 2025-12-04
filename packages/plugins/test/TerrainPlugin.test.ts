import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TerrainPlugin, FloodAnalysis } from '../src/modules/TerrainPlugin'
import { TerrainServiceType } from '../src/modules/TerrainPlugin/types'
import type { AutoViewer } from '@auto-cesium/core'
import * as Cesium from 'cesium'

// Mock Cesium
vi.mock('cesium', async () => {
  const actual = await vi.importActual<typeof Cesium>('cesium')

  const mockTerrainProvider = {
    ready: true,
    availability: null
  }

  return {
    ...actual,
    EllipsoidTerrainProvider: vi.fn(() => mockTerrainProvider),
    CesiumTerrainProvider: {
      fromUrl: vi.fn(() => Promise.resolve(mockTerrainProvider))
    },
    ArcGISTiledElevationTerrainProvider: {
      fromUrl: vi.fn(() => Promise.resolve(mockTerrainProvider))
    },
    IonResource: {
      fromAssetId: vi.fn(() => Promise.resolve('mock-resource'))
    },
    CustomDataSource: vi.fn(function (this: unknown, name: string) {
      const self = this as {
        name: string
        entities: {
          add: (entity: unknown) => unknown
          remove: () => boolean
        }
      }
      self.name = name
      self.entities = {
        add: vi.fn((entity) => entity),
        remove: vi.fn(() => true)
      }
      return self
    }),
    sampleTerrainMostDetailed: vi.fn((_provider, positions) => {
      return Promise.resolve(
        positions.map((pos: unknown) => {
          const p = pos as Record<string, unknown>
          return {
            ...p,
            height: 100
          }
        })
      )
    }),
    Cartographic: {
      fromCartesian: vi.fn((_pos) => ({
        longitude: 2.0,
        latitude: 0.7,
        height: 0
      }))
    },
    Math: {
      ...actual.Math,
      toDegrees: vi.fn((rad) => rad * 57.29577951308232)
    },
    PolygonHierarchy: vi.fn(function (this: unknown, positions: unknown) {
      const self = this as { positions: unknown }
      self.positions = positions
      return self
    }),
    Color: {
      fromCssColorString: vi.fn((color: string) => ({
        withAlpha: vi.fn((alpha: number) => ({ color, alpha }))
      }))
    },
    JulianDate: {
      now: vi.fn(() => ({}))
    },
    ConstantProperty: vi.fn(function (this: unknown, value: unknown) {
      const self = this as { value: unknown }
      self.value = value
      return self
    }),
    Rectangle: {
      fromDegrees: vi.fn((west, south, east, north) => ({
        west,
        south,
        east,
        north
      }))
    }
  }
})

// Mock AutoViewer
const createMockViewer = (): AutoViewer => {
  const mockScene = {
    globe: {
      show: true,
      enableLighting: false,
      terrainExaggeration: 1.0,
      terrainExaggerationRelativeHeight: 0
    }
  }

  const mockDataSources = {
    add: vi.fn((dataSource) => dataSource),
    remove: vi.fn(() => true),
    contains: vi.fn(() => true)
  }

  const mockCesiumViewer = {
    scene: mockScene,
    terrainProvider: {},
    dataSources: mockDataSources
  } as unknown as Cesium.Viewer

  return {
    cesiumViewer: mockCesiumViewer
  } as AutoViewer
}

describe('TerrainPlugin', () => {
  let plugin: TerrainPlugin
  let mockViewer: AutoViewer

  beforeEach(() => {
    plugin = new TerrainPlugin()
    mockViewer = createMockViewer()
  })

  describe('初始化状态', () => {
    it('应该正确初始化插件名称', () => {
      expect(plugin.name).toBe('terrain')
      expect(TerrainPlugin.pluginName).toBe('terrain')
    })

    it('初始状态应该是未安装', () => {
      expect(plugin.installed).toBe(false)
    })
  })

  describe('安装插件', () => {
    it('应该成功安装插件', () => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
      expect(plugin.installed).toBe(true)
    })

    it('安装时应该创建数据源', () => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
      expect(mockViewer.cesiumViewer.dataSources.add).toHaveBeenCalled()
    })

    it('安装时如果配置了默认地形应该自动应用', async () => {
      const pluginWithDefaultTerrain = new TerrainPlugin()
      // @ts-expect-error - 访问 protected 方法用于测试
      await pluginWithDefaultTerrain.install(mockViewer, {
        autoApply: true,
        defaultTerrain: {
          type: TerrainServiceType.ELLIPSOID
        }
      })
      expect(pluginWithDefaultTerrain.installed).toBe(true)
    })

    it('安装时如果 autoApply 为 false 不应该自动应用地形', () => {
      const pluginNoAutoApply = new TerrainPlugin()
      // @ts-expect-error - 访问 protected 方法用于测试
      pluginNoAutoApply.install(mockViewer, {
        autoApply: false,
        defaultTerrain: {
          type: TerrainServiceType.ELLIPSOID
        }
      })
      expect(pluginNoAutoApply.installed).toBe(true)
    })
  })

  describe('设置地形', () => {
    beforeEach(() => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
    })

    it('应该能够设置椭球体地形', async () => {
      await plugin.setTerrain({
        type: TerrainServiceType.ELLIPSOID
      })

      expect(plugin.getCurrentTerrainOptions()).toEqual({
        type: TerrainServiceType.ELLIPSOID
      })
    })

    it('应该能够设置 Cesium World Terrain', async () => {
      const options = {
        type: TerrainServiceType.CESIUM_WORLD as const,
        requestWaterMask: true,
        requestVertexNormals: true,
        enableLighting: true
      }

      await plugin.setTerrain(options)
      expect(plugin.getCurrentTerrainOptions()).toEqual(options)
    })

    it('应该能够设置 ArcGIS 地形', async () => {
      const options = {
        type: TerrainServiceType.ARCGIS as const,
        url: 'https://example.com/terrain',
        enableLighting: true
      }

      await plugin.setTerrain(options)
      expect(plugin.getCurrentTerrainOptions()).toEqual(options)
    })

    it('应该能够设置自定义地形', async () => {
      const options = {
        type: TerrainServiceType.CUSTOM as const,
        url: 'https://example.com/terrain',
        requestWaterMask: false,
        requestVertexNormals: true,
        enableLighting: true,
        minimumLevel: 0,
        maximumLevel: 15,
        rectangle: [100, 30, 120, 40] as [number, number, number, number],
        credit: 'Custom Terrain'
      }

      await plugin.setTerrain(options)
      expect(plugin.getCurrentTerrainOptions()).toEqual(options)
    })

    it('应该能够设置地形光照', async () => {
      await plugin.setTerrain({
        type: TerrainServiceType.ELLIPSOID,
        enableLighting: true
      })

      expect(mockViewer.cesiumViewer.scene.globe.enableLighting).toBe(true)
    })

    it('应该能够设置地形夸张倍数', async () => {
      await plugin.setTerrain({
        type: TerrainServiceType.ELLIPSOID,
        exaggeration: 2.0
      })

      // @ts-expect-error - terrainExaggeration 是扩展属性
      expect(mockViewer.cesiumViewer.scene.globe.terrainExaggeration).toBe(2.0)
    })

    it('未安装时设置地形应该抛出错误', async () => {
      const uninstalledPlugin = new TerrainPlugin()
      await expect(
        uninstalledPlugin.setTerrain({
          type: TerrainServiceType.ELLIPSOID
        })
      ).rejects.toThrow('Plugin "terrain" is not installed')
    })
  })

  describe('移除地形', () => {
    beforeEach(() => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
    })

    it('应该能够移除地形', async () => {
      await plugin.setTerrain({
        type: TerrainServiceType.CESIUM_WORLD,
        requestWaterMask: true
      })

      plugin.removeTerrain()
      expect(plugin.getCurrentTerrainOptions()).toBeNull()
    })

    it('移除地形后应该恢复为椭球体地形', async () => {
      await plugin.setTerrain({
        type: TerrainServiceType.CESIUM_WORLD,
        requestWaterMask: true
      })

      plugin.removeTerrain()
      expect(Cesium.EllipsoidTerrainProvider).toHaveBeenCalled()
    })
  })

  describe('地形配置', () => {
    beforeEach(() => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
    })

    it('应该能够设置地形夸张倍数', () => {
      plugin.setExaggeration(3.0)
      // @ts-expect-error - terrainExaggeration 是扩展属性
      expect(mockViewer.cesiumViewer.scene.globe.terrainExaggeration).toBe(3.0)
    })

    it('应该能够设置地形相对高度夸张', () => {
      plugin.setExaggerationRelativeHeight(100)
      // @ts-expect-error - terrainExaggerationRelativeHeight 是扩展属性
      expect(mockViewer.cesiumViewer.scene.globe.terrainExaggerationRelativeHeight).toBe(100)
    })

    it('应该能够启用地形光照', () => {
      plugin.enableLighting(true)
      expect(mockViewer.cesiumViewer.scene.globe.enableLighting).toBe(true)
    })

    it('应该能够禁用地形光照', () => {
      plugin.enableLighting(false)
      expect(mockViewer.cesiumViewer.scene.globe.enableLighting).toBe(false)
    })

    it('应该能够获取当前地形提供者', async () => {
      await plugin.setTerrain({
        type: TerrainServiceType.ELLIPSOID
      })

      const provider = plugin.getCurrentTerrainProvider()
      expect(provider).toBeDefined()
    })
  })

  describe('地形采样', () => {
    beforeEach(() => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
    })

    it('应该能够采样地形高程', async () => {
      const positions = [Cesium.Cartesian3.fromDegrees(116.4, 39.9), Cesium.Cartesian3.fromDegrees(121.5, 31.2)]

      const elevations = await plugin.sampleTerrain(positions)

      expect(elevations).toHaveLength(2)
      expect(elevations[0]).toHaveProperty('elevation')
      expect(elevations[0]).toHaveProperty('longitude')
      expect(elevations[0]).toHaveProperty('latitude')
      expect(elevations[0]).toHaveProperty('position')
    })

    it('采样结果应该包含正确的数据格式', async () => {
      const positions = [Cesium.Cartesian3.fromDegrees(116.4, 39.9)]
      const elevations = await plugin.sampleTerrain(positions)

      expect(typeof elevations[0].elevation).toBe('number')
      expect(typeof elevations[0].longitude).toBe('number')
      expect(typeof elevations[0].latitude).toBe('number')
      expect(elevations[0].position).toBeDefined()
    })
  })

  describe('水效果', () => {
    beforeEach(() => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
    })

    it('应该能够添加水效果', () => {
      const positions = [
        Cesium.Cartesian3.fromDegrees(116.4, 39.9),
        Cesium.Cartesian3.fromDegrees(116.5, 39.9),
        Cesium.Cartesian3.fromDegrees(116.5, 40.0),
        Cesium.Cartesian3.fromDegrees(116.4, 40.0)
      ]

      const waterEntity = plugin.addWaterEffect('lake', {
        positions,
        height: 100,
        color: '#0088ff',
        alpha: 0.6
      })

      expect(waterEntity).toBeDefined()
      expect(waterEntity.id).toBe('water-lake')
    })

    it('重复添加相同 ID 的水效果应该返回现有实体', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const positions = [
        Cesium.Cartesian3.fromDegrees(116.4, 39.9),
        Cesium.Cartesian3.fromDegrees(116.5, 39.9),
        Cesium.Cartesian3.fromDegrees(116.5, 40.0)
      ]

      const water1 = plugin.addWaterEffect('lake', {
        positions,
        height: 100
      })

      const water2 = plugin.addWaterEffect('lake', {
        positions,
        height: 100
      })

      expect(water1).toBe(water2)
      expect(warnSpy).toHaveBeenCalledWith('Water effect "lake" already exists')
      warnSpy.mockRestore()
    })

    it('应该能够移除水效果', () => {
      const positions = [Cesium.Cartesian3.fromDegrees(116.4, 39.9)]

      plugin.addWaterEffect('lake', {
        positions,
        height: 100
      })

      const result = plugin.removeWaterEffect('lake')
      expect(result).toBe(true)
    })

    it('移除不存在的水效果应该返回 false', () => {
      const result = plugin.removeWaterEffect('non-existent')
      expect(result).toBe(false)
    })
  })

  describe('淹没分析', () => {
    beforeEach(() => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
    })

    it('应该能够创建淹没分析', () => {
      const positions = [
        Cesium.Cartesian3.fromDegrees(116.4, 39.9),
        Cesium.Cartesian3.fromDegrees(116.5, 39.9),
        Cesium.Cartesian3.fromDegrees(116.5, 40.0)
      ]

      // 创建模拟的 polygon entity
      const mockEntity = {
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(positions)
        }
      } as unknown as Cesium.Entity

      const analysis = plugin.createFloodAnalysis('flood-1', mockEntity, {
        startHeight: 0,
        targetHeight: 50,
        duration: 10
      })

      expect(analysis).toBeDefined()
      expect(analysis).toBeInstanceOf(FloodAnalysis)
    })

    it('重复创建相同 ID 的淹没分析应该返回现有实例', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const positions = [Cesium.Cartesian3.fromDegrees(116.4, 39.9)]

      const mockEntity = {
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(positions)
        }
      } as unknown as Cesium.Entity

      const analysis1 = plugin.createFloodAnalysis('flood-1', mockEntity, {
        startHeight: 0,
        targetHeight: 50
      })

      const analysis2 = plugin.createFloodAnalysis('flood-1', mockEntity, {
        startHeight: 0,
        targetHeight: 50
      })

      expect(analysis1).toBe(analysis2)
      expect(warnSpy).toHaveBeenCalledWith('Flood analysis "flood-1" already exists')
      warnSpy.mockRestore()
    })

    it('创建淹没分析时应该能够从 entity 获取坐标', () => {
      const positions = [Cesium.Cartesian3.fromDegrees(116.4, 39.9)]

      const mockEntity = {
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(positions)
        }
      } as unknown as Cesium.Entity

      const analysis = plugin.createFloodAnalysis('flood-1', mockEntity, {
        startHeight: 0,
        targetHeight: 50
      })

      expect(analysis).toBeDefined()
    })

    it('创建淹没分析失败时应该抛出错误', () => {
      const mockEntity = {} as Cesium.Entity

      expect(() => {
        plugin.createFloodAnalysis('flood-1', mockEntity, {
          startHeight: 0,
          targetHeight: 50
        })
      }).toThrow('Failed to get positions from entity')
    })

    it('应该能够移除淹没分析', () => {
      const positions = [Cesium.Cartesian3.fromDegrees(116.4, 39.9)]

      const mockEntity = {
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(positions)
        }
      } as unknown as Cesium.Entity

      plugin.createFloodAnalysis('flood-1', mockEntity, {
        startHeight: 0,
        targetHeight: 50
      })

      const result = plugin.removeFloodAnalysis('flood-1')
      expect(result).toBe(true)
    })

    it('移除不存在的淹没分析应该返回 false', () => {
      const result = plugin.removeFloodAnalysis('non-existent')
      expect(result).toBe(false)
    })

    it('应该能够获取淹没分析实例', () => {
      const positions = [Cesium.Cartesian3.fromDegrees(116.4, 39.9)]

      const mockEntity = {
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(positions)
        }
      } as unknown as Cesium.Entity

      plugin.createFloodAnalysis('flood-1', mockEntity, {
        startHeight: 0,
        targetHeight: 50
      })

      const analysis = plugin.getFloodAnalysis('flood-1')
      expect(analysis).toBeDefined()
      expect(analysis).toBeInstanceOf(FloodAnalysis)
    })
  })

  describe('清除功能', () => {
    beforeEach(() => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
    })

    it('应该能够清除所有水效果和淹没分析', () => {
      // 添加水效果
      const waterPositions = [Cesium.Cartesian3.fromDegrees(116.4, 39.9)]
      plugin.addWaterEffect('lake', {
        positions: waterPositions,
        height: 100
      })

      // 添加淹没分析
      const floodPositions = [Cesium.Cartesian3.fromDegrees(116.4, 39.9)]
      const mockEntity = {
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(floodPositions)
        }
      } as unknown as Cesium.Entity

      plugin.createFloodAnalysis('flood-1', mockEntity, {
        startHeight: 0,
        targetHeight: 50
      })

      plugin.clearAll()

      expect(plugin.getFloodAnalysis('flood-1')).toBeUndefined()
    })
  })

  describe('销毁插件', () => {
    it('应该能够正确销毁插件', () => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)

      // 添加一些数据
      const positions = [Cesium.Cartesian3.fromDegrees(116.4, 39.9)]
      plugin.addWaterEffect('lake', {
        positions,
        height: 100
      })

      plugin.destroy()

      expect(plugin.installed).toBe(false)
      expect(mockViewer.cesiumViewer.dataSources.remove).toHaveBeenCalled()
    })

    it('销毁时应该清除所有水效果和淹没分析', () => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)

      const positions = [Cesium.Cartesian3.fromDegrees(116.4, 39.9)]
      plugin.addWaterEffect('lake', {
        positions,
        height: 100
      })

      const mockEntity = {
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(positions)
        }
      } as unknown as Cesium.Entity

      plugin.createFloodAnalysis('flood-1', mockEntity, {
        startHeight: 0,
        targetHeight: 50
      })

      plugin.destroy()

      expect(plugin.installed).toBe(false)
    })
  })
})

describe('FloodAnalysis', () => {
  let mockDataSource: Cesium.CustomDataSource
  let mockViewer: Cesium.Viewer
  let positions: Cesium.Cartesian3[]

  beforeEach(() => {
    mockDataSource = new Cesium.CustomDataSource('test')
    mockViewer = {
      scene: {
        globe: {}
      }
    } as unknown as Cesium.Viewer

    positions = [
      Cesium.Cartesian3.fromDegrees(116.4, 39.9),
      Cesium.Cartesian3.fromDegrees(116.5, 39.9),
      Cesium.Cartesian3.fromDegrees(116.5, 40.0)
    ]
  })

  describe('初始化', () => {
    it('应该正确初始化淹没分析', () => {
      const analysis = new FloodAnalysis(mockViewer, mockDataSource, 'flood-1', {
        positions,
        startHeight: 0,
        targetHeight: 50,
        duration: 10
      })

      expect(analysis).toBeDefined()
      expect(analysis.getCurrentHeight()).toBe(0)
    })

    it('应该使用 currentHeight 作为初始高度', () => {
      const analysis = new FloodAnalysis(mockViewer, mockDataSource, 'flood-1', {
        positions,
        startHeight: 0,
        currentHeight: 25,
        targetHeight: 50
      })

      expect(analysis.getCurrentHeight()).toBe(25)
    })

    it('应该隐藏源实体', () => {
      const sourceEntity = {
        show: true,
        polygon: {}
      } as Cesium.Entity

      const analysis = new FloodAnalysis(
        mockViewer,
        mockDataSource,
        'flood-1',
        {
          positions,
          startHeight: 0,
          targetHeight: 50
        },
        sourceEntity
      )

      expect(analysis).toBeDefined()
      expect(sourceEntity.show).toBe(false)
    })
  })

  describe('动画控制', () => {
    it('应该能够开始淹没动画', () => {
      const analysis = new FloodAnalysis(mockViewer, mockDataSource, 'flood-1', {
        positions,
        startHeight: 0,
        targetHeight: 50,
        duration: 1
      })

      analysis.start()
      // 动画开始后无法立即验证状态，但不应抛出错误
      expect(() => analysis.start()).not.toThrow()
    })

    it('应该能够暂停淹没动画', () => {
      const analysis = new FloodAnalysis(mockViewer, mockDataSource, 'flood-1', {
        positions,
        startHeight: 0,
        targetHeight: 50,
        duration: 10
      })

      analysis.start()
      analysis.pause()
      // 暂停后不应抛出错误
      expect(() => analysis.pause()).not.toThrow()
    })

    it('应该能够重置淹没分析', () => {
      const analysis = new FloodAnalysis(mockViewer, mockDataSource, 'flood-1', {
        positions,
        startHeight: 0,
        targetHeight: 50
      })

      analysis.setHeight(25)
      analysis.reset()

      expect(analysis.getCurrentHeight()).toBe(0)
    })

    it('应该能够手动设置高度', () => {
      const analysis = new FloodAnalysis(mockViewer, mockDataSource, 'flood-1', {
        positions,
        startHeight: 0,
        targetHeight: 50
      })

      analysis.setHeight(30)
      expect(analysis.getCurrentHeight()).toBe(30)
    })

    it('设置高度时应该触发回调', () => {
      const onHeightChange = vi.fn()
      const analysis = new FloodAnalysis(mockViewer, mockDataSource, 'flood-1', {
        positions,
        startHeight: 0,
        targetHeight: 50,
        onHeightChange
      })

      analysis.setHeight(30)
      expect(onHeightChange).toHaveBeenCalledWith(30)
    })
  })

  describe('可见性控制', () => {
    it('应该能够显示/隐藏淹没区域', () => {
      const analysis = new FloodAnalysis(mockViewer, mockDataSource, 'flood-1', {
        positions,
        startHeight: 0,
        targetHeight: 50
      })

      expect(() => analysis.setVisible(false)).not.toThrow()
      expect(() => analysis.setVisible(true)).not.toThrow()
    })
  })

  describe('销毁', () => {
    it('应该能够销毁淹没分析', () => {
      const analysis = new FloodAnalysis(mockViewer, mockDataSource, 'flood-1', {
        positions,
        startHeight: 0,
        targetHeight: 50
      })

      expect(() => analysis.destroy()).not.toThrow()
    })

    it('销毁时应该恢复源实体的显示状态', () => {
      const sourceEntity = {
        show: true,
        polygon: {}
      } as Cesium.Entity

      const analysis = new FloodAnalysis(
        mockViewer,
        mockDataSource,
        'flood-1',
        {
          positions,
          startHeight: 0,
          targetHeight: 50
        },
        sourceEntity
      )

      analysis.destroy()
      expect(sourceEntity.show).toBe(true)
    })
  })
})
