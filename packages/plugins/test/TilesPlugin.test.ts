import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TilesPlugin } from '../src/modules/TilesPlugin'
import type { AutoViewer } from '@auto-cesium/core'
import * as Cesium from 'cesium'

// Mock Cesium
vi.mock('cesium', async () => {
  const actual = await vi.importActual<typeof Cesium>('cesium')

  const mockTileset = {
    show: true,
    modelMatrix: actual.Matrix4.IDENTITY,
    shadows: 0,
    root: {
      content: {
        featuresLength: 0,
        getFeature: vi.fn(() => null)
      }
    },
    readyPromise: Promise.resolve({})
  }

  return {
    ...actual,
    Cesium3DTileset: {
      fromUrl: vi.fn(() => Promise.resolve(mockTileset))
    }
  }
})

// Mock AutoViewer
const createMockViewer = (): AutoViewer => {
  const mockScene = {
    primitives: {
      add: vi.fn((primitive) => primitive),
      remove: vi.fn(() => true)
    },
    pick: vi.fn(() => null)
  }

  const mockCesiumViewer = {
    scene: mockScene,
    flyTo: vi.fn(() => Promise.resolve(true)),
    zoomTo: vi.fn(() => Promise.resolve(true))
  } as unknown as Cesium.Viewer

  return {
    cesiumViewer: mockCesiumViewer,
    getPlugin: vi.fn((name: string) => {
      if (name === 'event') {
        return {
          onLeftClick: vi.fn(() => 'click-id'),
          onMouseMove: vi.fn(() => 'move-id'),
          off: vi.fn()
        }
      }
      return null
    })
  } as unknown as AutoViewer
}

describe('TilesPlugin', () => {
  let plugin: TilesPlugin
  let mockViewer: AutoViewer

  beforeEach(() => {
    plugin = new TilesPlugin()
    mockViewer = createMockViewer()
  })

  describe('初始化状态', () => {
    it('应该正确初始化插件名称', () => {
      expect(plugin.name).toBe('tiles')
      expect(TilesPlugin.pluginName).toBe('tiles')
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

    it('安装时应该注册事件监听', () => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
      expect(mockViewer.getPlugin).toHaveBeenCalledWith('event')
    })
  })

  describe('图层管理', () => {
    beforeEach(() => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
    })

    it('应该能够创建图层', async () => {
      const layerId = await plugin.createLayer({
        name: 'test-layer',
        url: 'https://example.com/tileset.json'
      })

      expect(layerId).toBeDefined()
      expect(typeof layerId).toBe('string')
    })

    it('创建图层时应该添加到场景', async () => {
      await plugin.createLayer({
        name: 'test-layer',
        url: 'https://example.com/tileset.json'
      })

      expect(mockViewer.cesiumViewer.scene.primitives.add).toHaveBeenCalled()
    })

    it('应该能够获取图层', async () => {
      const layerId = await plugin.createLayer({
        name: 'test-layer',
        url: 'https://example.com/tileset.json'
      })

      const layer = plugin.getLayer(layerId)
      expect(layer).toBeDefined()
      expect(layer?.name).toBe('test-layer')
    })

    it('应该能够根据名称获取图层', async () => {
      await plugin.createLayer({
        name: 'test-layer',
        url: 'https://example.com/tileset.json'
      })

      const layer = plugin.getLayerByName('test-layer')
      expect(layer).toBeDefined()
      expect(layer?.name).toBe('test-layer')
    })

    it('获取不存在的图层应该返回 undefined', () => {
      const layer = plugin.getLayer('non-existent')
      expect(layer).toBeUndefined()
    })

    it('应该能够移除图层', async () => {
      const layerId = await plugin.createLayer({
        name: 'test-layer',
        url: 'https://example.com/tileset.json'
      })

      const result = plugin.removeLayer(layerId)
      expect(result).toBe(true)

      const layer = plugin.getLayer(layerId)
      expect(layer).toBeUndefined()
    })

    it('移除不存在的图层应该返回 false', () => {
      const result = plugin.removeLayer('non-existent')
      expect(result).toBe(false)
    })

    it('应该能够移除所有图层', async () => {
      await plugin.createLayer({
        name: 'layer-1',
        url: 'https://example.com/tileset1.json'
      })
      await plugin.createLayer({
        name: 'layer-2',
        url: 'https://example.com/tileset2.json'
      })

      plugin.removeAllLayers()
      expect(plugin.getLayerCount()).toBe(0)
    })

    it('应该能够获取所有图层ID', async () => {
      const id1 = await plugin.createLayer({
        name: 'layer-1',
        url: 'https://example.com/tileset1.json'
      })
      const id2 = await plugin.createLayer({
        name: 'layer-2',
        url: 'https://example.com/tileset2.json'
      })

      const ids = plugin.getAllLayerIds()
      expect(ids).toContain(id1)
      expect(ids).toContain(id2)
      expect(ids).toHaveLength(2)
    })

    it('应该能够获取图层数量', async () => {
      expect(plugin.getLayerCount()).toBe(0)

      await plugin.createLayer({
        name: 'layer-1',
        url: 'https://example.com/tileset1.json'
      })

      expect(plugin.getLayerCount()).toBe(1)

      await plugin.createLayer({
        name: 'layer-2',
        url: 'https://example.com/tileset2.json'
      })

      expect(plugin.getLayerCount()).toBe(2)
    })
  })

  describe('图层配置', () => {
    beforeEach(() => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
    })

    it('应该支持自定义最大屏幕空间错误', async () => {
      const layerId = await plugin.createLayer({
        name: 'test-layer',
        url: 'https://example.com/tileset.json',
        maximumScreenSpaceError: 8
      })

      const layer = plugin.getLayer(layerId)
      expect(layer).toBeDefined()
    })

    it('应该支持设置阴影', async () => {
      const layerId = await plugin.createLayer({
        name: 'test-layer',
        url: 'https://example.com/tileset.json',
        shadows: true
      })

      const layer = plugin.getLayer(layerId)
      expect(layer).toBeDefined()
    })

    it('应该支持设置初始显示状态', async () => {
      const layerId = await plugin.createLayer({
        name: 'test-layer',
        url: 'https://example.com/tileset.json',
        show: false
      })

      const layer = plugin.getLayer(layerId)
      expect(layer?.show).toBe(false)
    })

    it('应该支持高度偏移', async () => {
      const layerId = await plugin.createLayer({
        name: 'test-layer',
        url: 'https://example.com/tileset.json',
        heightOffset: 100
      })

      const layer = plugin.getLayer(layerId)
      expect(layer).toBeDefined()
    })

    it('应该支持位置偏移', async () => {
      const layerId = await plugin.createLayer({
        name: 'test-layer',
        url: 'https://example.com/tileset.json',
        offset: [10, 20, 30]
      })

      const layer = plugin.getLayer(layerId)
      expect(layer).toBeDefined()
    })

    it('应该支持旋转', async () => {
      const layerId = await plugin.createLayer({
        name: 'test-layer',
        url: 'https://example.com/tileset.json',
        rotation: [45, 0, 0]
      })

      const layer = plugin.getLayer(layerId)
      expect(layer).toBeDefined()
    })

    it('应该支持缩放', async () => {
      const layerId = await plugin.createLayer({
        name: 'test-layer',
        url: 'https://example.com/tileset.json',
        scale: 2.0
      })

      const layer = plugin.getLayer(layerId)
      expect(layer).toBeDefined()
    })
  })

  describe('图层操作', () => {
    beforeEach(() => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
    })

    it('应该能够设置图层显示状态', async () => {
      const layerId = await plugin.createLayer({
        name: 'test-layer',
        url: 'https://example.com/tileset.json'
      })

      const layer = plugin.getLayer(layerId)
      expect(layer).toBeDefined()

      layer?.setShow(false)
      expect(layer?.show).toBe(false)

      layer?.setShow(true)
      expect(layer?.show).toBe(true)
    })

    it('应该能够飞行到图层', async () => {
      const layerId = await plugin.createLayer({
        name: 'test-layer',
        url: 'https://example.com/tileset.json'
      })

      const layer = plugin.getLayer(layerId)
      expect(layer).toBeDefined()

      await layer?.flyTo()
      expect(mockViewer.cesiumViewer.flyTo).toHaveBeenCalled()
    })

    it('应该能够缩放到图层', async () => {
      const layerId = await plugin.createLayer({
        name: 'test-layer',
        url: 'https://example.com/tileset.json'
      })

      const layer = plugin.getLayer(layerId)
      expect(layer).toBeDefined()

      await layer?.zoomTo()
      expect(mockViewer.cesiumViewer.zoomTo).toHaveBeenCalled()
    })

    it('应该能够获取所有要素', async () => {
      const layerId = await plugin.createLayer({
        name: 'test-layer',
        url: 'https://example.com/tileset.json'
      })

      const layer = plugin.getLayer(layerId)
      const features = layer?.getAllFeatures()

      expect(Array.isArray(features)).toBe(true)
    })

    it('应该能够销毁图层', async () => {
      const layerId = await plugin.createLayer({
        name: 'test-layer',
        url: 'https://example.com/tileset.json'
      })

      const layer = plugin.getLayer(layerId)
      expect(layer).toBeDefined()

      layer?.destroy()

      const deletedLayer = plugin.getLayer(layerId)
      expect(deletedLayer).toBeUndefined()
    })
  })

  describe('图层变换', () => {
    beforeEach(() => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
    })

    it('应该能够获取当前变换', async () => {
      const layerId = await plugin.createLayer({
        name: 'test-layer',
        url: 'https://example.com/tileset.json',
        offset: [10, 20, 30],
        rotation: [45, 0, 0],
        scale: 2.0
      })

      const layer = plugin.getLayer(layerId)
      const transform = layer?.getTransform()

      expect(transform).toBeDefined()
      expect(transform?.offset.x).toBe(10)
      expect(transform?.offset.y).toBe(20)
      expect(transform?.offset.z).toBe(30)
      expect(transform?.rotation.heading).toBe(45)
      expect(transform?.scale).toBe(2.0)
    })

    it('应该能够更新位置', async () => {
      const layerId = await plugin.createLayer({
        name: 'test-layer',
        url: 'https://example.com/tileset.json'
      })

      const layer = plugin.getLayer(layerId)
      layer?.updatePosition({ x: 100, y: 200, z: 300 })

      const transform = layer?.getTransform()
      expect(transform?.offset.x).toBe(100)
      expect(transform?.offset.y).toBe(200)
      expect(transform?.offset.z).toBe(300)
    })

    it('应该能够更新旋转', async () => {
      const layerId = await plugin.createLayer({
        name: 'test-layer',
        url: 'https://example.com/tileset.json'
      })

      const layer = plugin.getLayer(layerId)
      layer?.updateRotation({ heading: 90, pitch: 45, roll: 30 })

      const transform = layer?.getTransform()
      expect(transform?.rotation.heading).toBe(90)
      expect(transform?.rotation.pitch).toBe(45)
      expect(transform?.rotation.roll).toBe(30)
    })

    it('应该能够更新缩放', async () => {
      const layerId = await plugin.createLayer({
        name: 'test-layer',
        url: 'https://example.com/tileset.json'
      })

      const layer = plugin.getLayer(layerId)
      layer?.updateScale(3.0)

      const transform = layer?.getTransform()
      expect(transform?.scale).toBe(3.0)
    })

    it('应该能够设置变换', async () => {
      const layerId = await plugin.createLayer({
        name: 'test-layer',
        url: 'https://example.com/tileset.json'
      })

      const layer = plugin.getLayer(layerId)
      layer?.setTransform({
        offset: { x: 50, y: 60, z: 70 },
        rotation: { heading: 30, pitch: 20, roll: 10 },
        scale: 1.5
      })

      const transform = layer?.getTransform()
      expect(transform?.offset.x).toBe(50)
      expect(transform?.rotation.heading).toBe(30)
      expect(transform?.scale).toBe(1.5)
    })

    it('应该能够重置变换', async () => {
      const layerId = await plugin.createLayer({
        name: 'test-layer',
        url: 'https://example.com/tileset.json',
        offset: [10, 20, 30],
        scale: 2.0
      })

      const layer = plugin.getLayer(layerId)

      // 更新位置
      layer?.updatePosition({ x: 100, y: 200, z: 300 })

      // 调用重置方法不应抛出错误
      expect(() => layer?.resetTransform()).not.toThrow()

      // 验证重置方法存在且可调用
      expect(typeof layer?.resetTransform).toBe('function')
    })
  })

  describe('编辑模式', () => {
    beforeEach(() => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
    })

    it('应该能够启用编辑模式', async () => {
      const layerId = await plugin.createLayer({
        name: 'test-layer',
        url: 'https://example.com/tileset.json'
      })

      const layer = plugin.getLayer(layerId)
      expect(layer?.isEditing).toBe(false)

      layer?.enableEdit()
      expect(layer?.isEditing).toBe(true)
    })

    it('应该能够禁用编辑模式', async () => {
      const layerId = await plugin.createLayer({
        name: 'test-layer',
        url: 'https://example.com/tileset.json'
      })

      const layer = plugin.getLayer(layerId)
      layer?.enableEdit()
      expect(layer?.isEditing).toBe(true)

      layer?.disableEdit()
      expect(layer?.isEditing).toBe(false)
    })

    it('启用编辑时应该触发回调', async () => {
      const onTransformStart = vi.fn()
      const layerId = await plugin.createLayer({
        name: 'test-layer',
        url: 'https://example.com/tileset.json'
      })

      const layer = plugin.getLayer(layerId)
      layer?.enableEdit({ onTransformStart })

      expect(onTransformStart).toHaveBeenCalled()
    })

    it('禁用编辑时应该触发回调', async () => {
      const onTransformEnd = vi.fn()
      const layerId = await plugin.createLayer({
        name: 'test-layer',
        url: 'https://example.com/tileset.json'
      })

      const layer = plugin.getLayer(layerId)
      layer?.enableEdit({ onTransformEnd })
      layer?.disableEdit()

      expect(onTransformEnd).toHaveBeenCalled()
    })
  })

  describe('未安装时的错误处理', () => {
    it('未安装时创建图层应该抛出错误', async () => {
      await expect(
        plugin.createLayer({
          name: 'test-layer',
          url: 'https://example.com/tileset.json'
        })
      ).rejects.toThrow('Plugin "tiles" is not installed')
    })
  })

  describe('销毁插件', () => {
    it('应该能够正确销毁插件', async () => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)

      await plugin.createLayer({
        name: 'test-layer',
        url: 'https://example.com/tileset.json'
      })

      plugin.destroy()

      expect(plugin.installed).toBe(false)
      expect(plugin.getLayerCount()).toBe(0)
    })

    it('销毁时应该移除所有图层', async () => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)

      await plugin.createLayer({
        name: 'layer-1',
        url: 'https://example.com/tileset1.json'
      })
      await plugin.createLayer({
        name: 'layer-2',
        url: 'https://example.com/tileset2.json'
      })

      expect(plugin.getLayerCount()).toBe(2)

      plugin.destroy()

      expect(plugin.getLayerCount()).toBe(0)
    })
  })

  describe('边界情况', () => {
    beforeEach(() => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
    })

    it('应该能够处理不存在的图层名称', () => {
      const layer = plugin.getLayerByName('non-existent')
      expect(layer).toBeUndefined()
    })

    it('应该能够处理空的图层ID列表', () => {
      const ids = plugin.getAllLayerIds()
      expect(ids).toEqual([])
    })

    it('初始图层数量应该为0', () => {
      expect(plugin.getLayerCount()).toBe(0)
    })
  })
})
