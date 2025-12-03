import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  BaseLayerPlugin,
  CoordinateSystem,
  TiandituLayerType,
  AmapLayerType,
  TencentLayerType,
  BaiduLayerType,
  GeovisLayerType,
  SuperMapLayerType
} from '../src/modules/BaseLayerPlugin'
import type { AutoViewer } from '@auto-cesium/core'
import * as Cesium from 'cesium'

// Mock SingleTileImageryProvider to avoid constructor validation
vi.mock('cesium', async () => {
  const actual = await vi.importActual<typeof Cesium>('cesium')
  return {
    ...actual,
    SingleTileImageryProvider: vi.fn().mockImplementation((options) => {
      return {
        url: options.url,
        rectangle: options.rectangle
      }
    })
  }
})

// Mock ImageryLayer
class MockImageryLayer {
  alpha = 1
  brightness = 1
  contrast = 1
  hue = 0
  saturation = 1
  gamma = 1
  colorToAlpha = new Cesium.Color(0, 0, 0, 0.004)
  show = true
  _imageryProvider: {
    _reload: () => void
    _resource?: { _url: string }
  }

  constructor(public imageryProvider: unknown) {
    this._imageryProvider = {
      _reload: vi.fn(),
      _resource: { _url: '' }
    }
  }
}

// Mock ImageryLayerCollection
class MockImageryLayerCollection {
  private layers: MockImageryLayer[] = []

  addImageryProvider(provider: unknown, index?: number): MockImageryLayer {
    const layer = new MockImageryLayer(provider)
    if (index !== undefined && index >= 0 && index <= this.layers.length) {
      this.layers.splice(index, 0, layer)
    } else {
      this.layers.push(layer)
    }
    return layer
  }

  remove(layer: MockImageryLayer, _destroy?: boolean): boolean {
    const index = this.layers.indexOf(layer)
    if (index !== -1) {
      this.layers.splice(index, 1)
      return true
    }
    return false
  }

  add(layer: MockImageryLayer, index?: number): void {
    if (index !== undefined && index >= 0 && index <= this.layers.length) {
      this.layers.splice(index, 0, layer)
    } else {
      this.layers.push(layer)
    }
  }

  indexOf(layer: MockImageryLayer): number {
    return this.layers.indexOf(layer)
  }

  raise(layer: MockImageryLayer): void {
    const index = this.indexOf(layer)
    if (index !== -1 && index < this.layers.length - 1) {
      this.layers.splice(index, 1)
      this.layers.splice(index + 1, 0, layer)
    }
  }

  lower(layer: MockImageryLayer): void {
    const index = this.indexOf(layer)
    if (index > 0) {
      this.layers.splice(index, 1)
      this.layers.splice(index - 1, 0, layer)
    }
  }

  raiseToTop(layer: MockImageryLayer): void {
    const index = this.indexOf(layer)
    if (index !== -1) {
      this.layers.splice(index, 1)
      this.layers.push(layer)
    }
  }

  lowerToBottom(layer: MockImageryLayer): void {
    const index = this.indexOf(layer)
    if (index !== -1) {
      this.layers.splice(index, 1)
      this.layers.unshift(layer)
    }
  }
}

// Mock Cesium Viewer
const createMockCesiumViewer = (): Cesium.Viewer => {
  return {
    imageryLayers: new MockImageryLayerCollection(),
    container: {
      style: {}
    }
  } as unknown as Cesium.Viewer
}

// Mock AutoViewer
const createMockViewer = (): AutoViewer => {
  const mockCesiumViewer = createMockCesiumViewer()

  return {
    cesiumViewer: mockCesiumViewer,
    getPlugin: vi.fn(() => null)
  } as unknown as AutoViewer
}

describe('BaseLayerPlugin', () => {
  let plugin: BaseLayerPlugin
  let mockViewer: AutoViewer

  beforeEach(() => {
    plugin = new BaseLayerPlugin()
    mockViewer = createMockViewer()
  })

  describe('初始化', () => {
    it('应该正确设置插件名称', () => {
      expect(plugin.name).toBe('baseLayer')
      expect(BaseLayerPlugin.pluginName).toBe('baseLayer')
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

    it('重复安装应该警告', () => {
      const warnSpy = vi.spyOn(console, 'warn')
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)

      expect(warnSpy).toHaveBeenCalledWith('Plugin "baseLayer" is already installed')
      warnSpy.mockRestore()
    })
  })

  describe('addXYZ 方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够添加 XYZ 图层', () => {
      const layer = plugin.addXYZ('xyz-layer', {
        url: 'https://example.com/tiles/{z}/{x}/{y}.png'
      })

      expect(layer).toBeDefined()
      expect(plugin.getLayer('xyz-layer')).toBe(layer)
    })

    it('应该支持子域名配置', () => {
      const layer = plugin.addXYZ('xyz-subdomain', {
        url: 'https://{s}.example.com/tiles/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c']
      })

      expect(layer).toBeDefined()
    })

    it('应该支持层级配置', () => {
      const layer = plugin.addXYZ('xyz-levels', {
        url: 'https://example.com/tiles/{z}/{x}/{y}.png',
        minimumLevel: 5,
        maximumLevel: 18
      })

      expect(layer).toBeDefined()
    })

    it('应该支持区域范围配置', () => {
      const layer = plugin.addXYZ('xyz-rectangle', {
        url: 'https://example.com/tiles/{z}/{x}/{y}.png',
        rectangle: [110, 30, 120, 40]
      })

      expect(layer).toBeDefined()
    })

    it('应该支持 WGS84 坐标系', () => {
      const layer = plugin.addXYZ('xyz-wgs84', {
        url: 'https://example.com/tiles/{z}/{x}/{y}.png',
        coordinateSystem: CoordinateSystem.WGS84
      })

      expect(layer).toBeDefined()
    })

    it('重复添加相同 ID 的图层应该返回现有图层', () => {
      const warnSpy = vi.spyOn(console, 'warn')
      const layer1 = plugin.addXYZ('same-id', {
        url: 'https://example.com/tiles/{z}/{x}/{y}.png'
      })

      const layer2 = plugin.addXYZ('same-id', {
        url: 'https://example2.com/tiles/{z}/{x}/{y}.png'
      })

      expect(layer1).toBe(layer2)
      expect(warnSpy).toHaveBeenCalledWith('Layer "same-id" already exists')
      warnSpy.mockRestore()
    })
  })

  describe('addTMS 方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够添加 TMS 图层', () => {
      const layer = plugin.addTMS('tms-layer', {
        url: 'https://example.com/tms/{z}/{x}/{y}.png'
      })

      expect(layer).toBeDefined()
      expect(plugin.getLayer('tms-layer')).toBe(layer)
    })

    it('应该支持区域范围配置', () => {
      const layer = plugin.addTMS('tms-rectangle', {
        url: 'https://example.com/tms/{z}/{x}/{y}.png',
        rectangle: [110, 30, 120, 40]
      })

      expect(layer).toBeDefined()
    })
  })

  describe('addWMS 方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够添加 WMS 图层', () => {
      const layer = plugin.addWMS('wms-layer', {
        url: 'https://example.com/wms',
        layers: 'layer1,layer2'
      })

      expect(layer).toBeDefined()
      expect(plugin.getLayer('wms-layer')).toBe(layer)
    })

    it('应该支持 WMS 参数配置', () => {
      const layer = plugin.addWMS('wms-params', {
        url: 'https://example.com/wms',
        layers: 'layer1',
        version: '1.3.0',
        format: 'image/png',
        transparent: true,
        crs: 'EPSG:4326',
        styles: 'default'
      })

      expect(layer).toBeDefined()
    })
  })

  describe('addWMTS 方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够添加 WMTS 图层', () => {
      const layer = plugin.addWMTS('wmts-layer', {
        url: 'https://example.com/wmts',
        layer: 'layer_id',
        style: 'default',
        tileMatrixSetID: 'GoogleMapsCompatible'
      })

      expect(layer).toBeDefined()
      expect(plugin.getLayer('wmts-layer')).toBe(layer)
    })

    it('应该支持 WMTS 参数配置', () => {
      const layer = plugin.addWMTS('wmts-params', {
        url: 'https://example.com/wmts',
        layer: 'layer_id',
        style: 'default',
        tileMatrixSetID: 'GoogleMapsCompatible',
        format: 'image/jpeg',
        tileMatrixLabels: ['0', '1', '2']
      })

      expect(layer).toBeDefined()
    })
  })

  describe('addArcGIS 方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够添加 ArcGIS 图层', () => {
      const layer = plugin.addArcGIS('arcgis-layer', {
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
      })

      expect(layer).toBeDefined()
      expect(plugin.getLayer('arcgis-layer')).toBe(layer)
    })

    it('应该支持 ArcGIS 参数配置', () => {
      const layer = plugin.addArcGIS('arcgis-params', {
        url: 'https://example.com/arcgis/rest/services/MyService/MapServer',
        layers: '0,1,2',
        enablePickFeatures: false
      })

      expect(layer).toBeDefined()
    })
  })

  describe('addSingleImage 方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够添加单图片图层', () => {
      const layer = plugin.addSingleImage('single-image', {
        url: 'https://example.com/image.jpg',
        rectangle: [110, 30, 120, 40]
      })

      expect(layer).toBeDefined()
      expect(plugin.getLayer('single-image')).toBe(layer)
    })
  })

  describe('addTimeSeries 方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够添加时序图层', () => {
      const times = [
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-01T06:00:00Z'),
        new Date('2024-01-01T12:00:00Z')
      ]

      const layer = plugin.addTimeSeries('timeseries-layer', {
        url: 'https://example.com/tiles/{z}/{x}/{y}?time={time}',
        times
      })

      expect(layer).toBeDefined()
      expect(plugin.getLayer('timeseries-layer')).toBe(layer)
    })

    it('应该支持字符串形式的时间列表', () => {
      const times = ['2024-01-01', '2024-01-02', '2024-01-03']

      const layer = plugin.addTimeSeries('timeseries-strings', {
        url: 'https://example.com/tiles/{z}/{x}/{y}/{time}.png',
        times,
        timeFormatter: (date) => {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}${month}${day}`
        }
      })

      expect(layer).toBeDefined()
    })

    it('应该支持设置初始时间索引', () => {
      const times = [new Date('2024-01-01'), new Date('2024-01-02'), new Date('2024-01-03')]

      const layer = plugin.addTimeSeries('timeseries-index', {
        url: 'https://example.com/tiles/{z}/{x}/{y}?time={time}',
        times,
        currentTimeIndex: 1
      })

      expect(layer).toBeDefined()
      expect(plugin.getTimeSeriesCurrentIndex('timeseries-index')).toBe(1)
    })
  })

  describe('setTimeSeriesTime 方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够设置时序图层的时间', () => {
      const times = [new Date('2024-01-01'), new Date('2024-01-02'), new Date('2024-01-03')]

      plugin.addTimeSeries('timeseries', {
        url: 'https://example.com/tiles/{z}/{x}/{y}?time={time}',
        times
      })

      const result = plugin.setTimeSeriesTime('timeseries', 2)
      expect(result).toBe(true)
      expect(plugin.getTimeSeriesCurrentIndex('timeseries')).toBe(2)
    })

    it('无效的时间索引应该返回 false', () => {
      const times = [new Date('2024-01-01'), new Date('2024-01-02')]

      plugin.addTimeSeries('timeseries', {
        url: 'https://example.com/tiles/{z}/{x}/{y}?time={time}',
        times
      })

      const result1 = plugin.setTimeSeriesTime('timeseries', -1)
      expect(result1).toBe(false)

      const result2 = plugin.setTimeSeriesTime('timeseries', 5)
      expect(result2).toBe(false)
    })

    it('不存在的图层应该返回 false', () => {
      const result = plugin.setTimeSeriesTime('non-existent', 0)
      expect(result).toBe(false)
    })
  })

  describe('getTimeSeriesTimes 方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够获取时序图层的时间列表', () => {
      const times = [new Date('2024-01-01'), new Date('2024-01-02'), new Date('2024-01-03')]

      plugin.addTimeSeries('timeseries', {
        url: 'https://example.com/tiles/{z}/{x}/{y}?time={time}',
        times
      })

      const retrievedTimes = plugin.getTimeSeriesTimes('timeseries')
      expect(retrievedTimes).toHaveLength(3)
    })

    it('不存在的图层应该返回 undefined', () => {
      const times = plugin.getTimeSeriesTimes('non-existent')
      expect(times).toBeUndefined()
    })
  })

  describe('图层管理', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够获取图层', () => {
      plugin.addXYZ('test-layer', {
        url: 'https://example.com/tiles/{z}/{x}/{y}.png'
      })

      const layer = plugin.getLayer('test-layer')
      expect(layer).toBeDefined()
    })

    it('应该能够移除图层', () => {
      plugin.addXYZ('test-layer', {
        url: 'https://example.com/tiles/{z}/{x}/{y}.png'
      })

      const result = plugin.removeLayer('test-layer')
      expect(result).toBe(true)
      expect(plugin.getLayer('test-layer')).toBeUndefined()
    })

    it('移除不存在的图层应该返回 false', () => {
      const result = plugin.removeLayer('non-existent')
      expect(result).toBe(false)
    })

    it('应该能够获取所有图层 ID', () => {
      plugin.addXYZ('layer1', { url: 'https://example.com/1/{z}/{x}/{y}.png' })
      plugin.addXYZ('layer2', { url: 'https://example.com/2/{z}/{x}/{y}.png' })
      plugin.addXYZ('layer3', { url: 'https://example.com/3/{z}/{x}/{y}.png' })

      const ids = plugin.getAllLayerIds()
      expect(ids).toHaveLength(3)
      expect(ids).toContain('layer1')
      expect(ids).toContain('layer2')
      expect(ids).toContain('layer3')
    })

    it('应该能够获取图层数量', () => {
      plugin.addXYZ('layer1', { url: 'https://example.com/1/{z}/{x}/{y}.png' })
      plugin.addXYZ('layer2', { url: 'https://example.com/2/{z}/{x}/{y}.png' })

      expect(plugin.getLayerCount()).toBe(2)
    })

    it('应该能够清除所有图层', () => {
      plugin.addXYZ('layer1', { url: 'https://example.com/1/{z}/{x}/{y}.png' })
      plugin.addXYZ('layer2', { url: 'https://example.com/2/{z}/{x}/{y}.png' })

      plugin.clearAll()

      expect(plugin.getLayerCount()).toBe(0)
      expect(plugin.getAllLayerIds()).toHaveLength(0)
    })
  })

  describe('图层可见性和透明度', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够设置图层可见性', () => {
      plugin.addXYZ('test-layer', {
        url: 'https://example.com/tiles/{z}/{x}/{y}.png'
      })

      plugin.setLayerVisible('test-layer', false)
      const layer = plugin.getLayer('test-layer')
      expect(layer?.show).toBe(false)

      plugin.setLayerVisible('test-layer', true)
      expect(layer?.show).toBe(true)
    })

    it('应该能够设置图层透明度', () => {
      plugin.addXYZ('test-layer', {
        url: 'https://example.com/tiles/{z}/{x}/{y}.png'
      })

      plugin.setLayerAlpha('test-layer', 0.5)
      const layer = plugin.getLayer('test-layer')
      expect(layer?.alpha).toBe(0.5)
    })

    it('透明度应该限制在 0-1 范围内', () => {
      plugin.addXYZ('test-layer', {
        url: 'https://example.com/tiles/{z}/{x}/{y}.png'
      })

      plugin.setLayerAlpha('test-layer', 1.5)
      let layer = plugin.getLayer('test-layer')
      expect(layer?.alpha).toBe(1)

      plugin.setLayerAlpha('test-layer', -0.5)
      layer = plugin.getLayer('test-layer')
      expect(layer?.alpha).toBe(0)
    })
  })

  describe('图层颜色调整', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够设置图层亮度', () => {
      plugin.addXYZ('test-layer', {
        url: 'https://example.com/tiles/{z}/{x}/{y}.png'
      })

      plugin.setLayerBrightness('test-layer', 1.5)
      const layer = plugin.getLayer('test-layer')
      expect(layer?.brightness).toBe(1.5)
    })

    it('应该能够设置图层对比度', () => {
      plugin.addXYZ('test-layer', {
        url: 'https://example.com/tiles/{z}/{x}/{y}.png'
      })

      plugin.setLayerContrast('test-layer', 1.2)
      const layer = plugin.getLayer('test-layer')
      expect(layer?.contrast).toBe(1.2)
    })

    it('应该能够设置图层色调', () => {
      plugin.addXYZ('test-layer', {
        url: 'https://example.com/tiles/{z}/{x}/{y}.png'
      })

      plugin.setLayerHue('test-layer', Math.PI / 2)
      const layer = plugin.getLayer('test-layer')
      expect(layer?.hue).toBe(Math.PI / 2)
    })

    it('应该能够设置图层饱和度', () => {
      plugin.addXYZ('test-layer', {
        url: 'https://example.com/tiles/{z}/{x}/{y}.png'
      })

      plugin.setLayerSaturation('test-layer', 1.5)
      const layer = plugin.getLayer('test-layer')
      expect(layer?.saturation).toBe(1.5)
    })

    it('饱和度应该不小于 0', () => {
      plugin.addXYZ('test-layer', {
        url: 'https://example.com/tiles/{z}/{x}/{y}.png'
      })

      plugin.setLayerSaturation('test-layer', -0.5)
      const layer = plugin.getLayer('test-layer')
      expect(layer?.saturation).toBe(0)
    })

    it('应该能够设置图层 Gamma 值', () => {
      plugin.addXYZ('test-layer', {
        url: 'https://example.com/tiles/{z}/{x}/{y}.png'
      })

      plugin.setLayerGamma('test-layer', 0.8)
      const layer = plugin.getLayer('test-layer')
      expect(layer?.gamma).toBe(0.8)
    })

    it('Gamma 值应该不小于 0.1', () => {
      plugin.addXYZ('test-layer', {
        url: 'https://example.com/tiles/{z}/{x}/{y}.png'
      })

      plugin.setLayerGamma('test-layer', 0.05)
      const layer = plugin.getLayer('test-layer')
      expect(layer?.gamma).toBe(0.1)
    })

    it('应该能够设置颜色转透明', () => {
      plugin.addXYZ('test-layer', {
        url: 'https://example.com/tiles/{z}/{x}/{y}.png'
      })

      plugin.setLayerColorToAlpha('test-layer', [255, 255, 255])
      const layer = plugin.getLayer('test-layer')
      expect(layer?.colorToAlpha).toBeDefined()
    })
  })

  describe('setLayerColorFilter 方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够批量设置滤镜', () => {
      plugin.addXYZ('test-layer', {
        url: 'https://example.com/tiles/{z}/{x}/{y}.png'
      })

      plugin.setLayerColorFilter('test-layer', {
        hue: Math.PI / 2,
        saturation: 1.2,
        gamma: 0.9,
        brightness: 1.1,
        contrast: 1.2,
        alpha: 0.8
      })

      const layer = plugin.getLayer('test-layer')
      expect(layer?.hue).toBe(Math.PI / 2)
      expect(layer?.saturation).toBe(1.2)
      expect(layer?.gamma).toBe(0.9)
      expect(layer?.brightness).toBe(1.1)
      expect(layer?.contrast).toBe(1.2)
      expect(layer?.alpha).toBe(0.8)
    })

    it('不存在的图层应该警告', () => {
      const warnSpy = vi.spyOn(console, 'warn')
      plugin.setLayerColorFilter('non-existent', { brightness: 1.5 })

      expect(warnSpy).toHaveBeenCalledWith('Layer "non-existent" not found')
      warnSpy.mockRestore()
    })
  })

  describe('resetLayerColorFilter 方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够重置滤镜', () => {
      plugin.addXYZ('test-layer', {
        url: 'https://example.com/tiles/{z}/{x}/{y}.png'
      })

      plugin.setLayerColorFilter('test-layer', {
        hue: Math.PI,
        saturation: 2,
        gamma: 0.5,
        brightness: 2,
        contrast: 2,
        alpha: 0.5
      })

      plugin.resetLayerColorFilter('test-layer')

      const layer = plugin.getLayer('test-layer')
      expect(layer?.hue).toBe(0)
      expect(layer?.saturation).toBe(1)
      expect(layer?.gamma).toBe(1)
      expect(layer?.brightness).toBe(1)
      expect(layer?.contrast).toBe(1)
      expect(layer?.alpha).toBe(1)
    })

    it('不存在的图层应该警告', () => {
      const warnSpy = vi.spyOn(console, 'warn')
      plugin.resetLayerColorFilter('non-existent')

      expect(warnSpy).toHaveBeenCalledWith('Layer "non-existent" not found')
      warnSpy.mockRestore()
    })
  })

  describe('图层顺序调整', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够提升图层', () => {
      plugin.addXYZ('layer1', { url: 'https://example.com/1/{z}/{x}/{y}.png' })
      plugin.addXYZ('layer2', { url: 'https://example.com/2/{z}/{x}/{y}.png' })

      plugin.raiseLayer('layer1')
      expect(plugin).toBeDefined()
    })

    it('应该能够降低图层', () => {
      plugin.addXYZ('layer1', { url: 'https://example.com/1/{z}/{x}/{y}.png' })
      plugin.addXYZ('layer2', { url: 'https://example.com/2/{z}/{x}/{y}.png' })

      plugin.lowerLayer('layer2')
      expect(plugin).toBeDefined()
    })

    it('应该能够移到最顶层', () => {
      plugin.addXYZ('layer1', { url: 'https://example.com/1/{z}/{x}/{y}.png' })
      plugin.addXYZ('layer2', { url: 'https://example.com/2/{z}/{x}/{y}.png' })
      plugin.addXYZ('layer3', { url: 'https://example.com/3/{z}/{x}/{y}.png' })

      plugin.raiseLayerToTop('layer1')
      expect(plugin).toBeDefined()
    })

    it('应该能够移到最底层', () => {
      plugin.addXYZ('layer1', { url: 'https://example.com/1/{z}/{x}/{y}.png' })
      plugin.addXYZ('layer2', { url: 'https://example.com/2/{z}/{x}/{y}.png' })
      plugin.addXYZ('layer3', { url: 'https://example.com/3/{z}/{x}/{y}.png' })

      plugin.lowerLayerToBottom('layer3')
      expect(plugin).toBeDefined()
    })

    it('应该能够移动图层到指定位置', () => {
      plugin.addXYZ('layer1', { url: 'https://example.com/1/{z}/{x}/{y}.png' })
      plugin.addXYZ('layer2', { url: 'https://example.com/2/{z}/{x}/{y}.png' })
      plugin.addXYZ('layer3', { url: 'https://example.com/3/{z}/{x}/{y}.png' })

      plugin.moveLayer('layer1', 2)
      expect(plugin).toBeDefined()
    })
  })

  describe('预设地图服务', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够添加天地图图层', () => {
      const layer = plugin.addTianditu('tdt-vec', {
        token: 'test_token',
        layerType: TiandituLayerType.VEC
      })

      expect(layer).toBeDefined()
      expect(plugin.getLayer('tdt-vec')).toBe(layer)
    })

    it('应该能够添加高德地图图层', () => {
      const layer = plugin.addAmap('amap-vector', {
        layerType: AmapLayerType.VECTOR
      })

      expect(layer).toBeDefined()
      expect(plugin.getLayer('amap-vector')).toBe(layer)
    })

    it('应该能够添加腾讯地图图层', () => {
      const layer = plugin.addTencent('tencent-vector', {
        layerType: TencentLayerType.VECTOR
      })

      expect(layer).toBeDefined()
      expect(plugin.getLayer('tencent-vector')).toBe(layer)
    })

    it('应该能够添加百度地图图层', () => {
      const layer = plugin.addBaidu('baidu-normal', {
        layerType: BaiduLayerType.NORMAL
      })

      expect(layer).toBeDefined()
      expect(plugin.getLayer('baidu-normal')).toBe(layer)
    })

    it('应该能够添加星图地球图层', () => {
      const layer = plugin.addGeovis('geovis-vector', {
        token: 'test_token',
        layerType: GeovisLayerType.VECTOR
      })

      expect(layer).toBeDefined()
      expect(plugin.getLayer('geovis-vector')).toBe(layer)
    })

    it('应该能够添加超图图层', () => {
      const layer = plugin.addSuperMap('supermap-layer', {
        url: 'https://example.com/iserver/services',
        layerType: SuperMapLayerType.VECTOR
      })

      expect(layer).toBeDefined()
      expect(plugin.getLayer('supermap-layer')).toBe(layer)
    })
  })

  describe('销毁插件', () => {
    it('应该正确清理资源', () => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)

      plugin.addXYZ('layer1', { url: 'https://example.com/1/{z}/{x}/{y}.png' })
      plugin.addXYZ('layer2', { url: 'https://example.com/2/{z}/{x}/{y}.png' })

      plugin.destroy()

      expect(plugin.installed).toBe(false)
      expect(plugin.getLayerCount()).toBe(0)
    })

    it('未安装时销毁应该不报错', () => {
      expect(() => plugin.destroy()).not.toThrow()
    })
  })

  describe('未安装时的错误处理', () => {
    it('未安装时调用方法应该抛出错误', () => {
      expect(() =>
        plugin.addXYZ('test', {
          url: 'https://example.com/tiles/{z}/{x}/{y}.png'
        })
      ).toThrow()
    })
  })
})
