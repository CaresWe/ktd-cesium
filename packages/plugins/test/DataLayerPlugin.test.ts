import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DataLayerPlugin } from '../src/modules/DataLayerPlugin'
import type { AutoViewer } from '@auto-cesium/core'
import * as Cesium from 'cesium'

// Mock CustomDataSource
class MockCustomDataSource {
  name: string
  show = true
  entities: {
    values: Cesium.Entity[]
    add: (entity: Cesium.Entity) => Cesium.Entity
    remove: (entity: Cesium.Entity) => boolean
    removeAll: () => void
    getById: (id: string) => Cesium.Entity | undefined
  }
  clustering = {
    enabled: false,
    pixelRange: 80,
    minimumClusterSize: 3,
    clusterEvent: {
      addEventListener: vi.fn()
    }
  }

  constructor(name: string) {
    this.name = name
    this.entities = {
      values: [],
      add: vi.fn((entity: Cesium.Entity) => {
        this.entities.values.push(entity)
        return entity
      }),
      remove: vi.fn((entity: Cesium.Entity) => {
        const index = this.entities.values.indexOf(entity)
        if (index !== -1) {
          this.entities.values.splice(index, 1)
          return true
        }
        return false
      }),
      removeAll: vi.fn(() => {
        this.entities.values = []
      }),
      getById: vi.fn((id: string) => {
        return this.entities.values.find((e: Cesium.Entity) => e.id === id)
      })
    }
  }
}

// Mock PrimitiveCollection
class MockPrimitiveCollection {
  show = true
  _primitives: unknown[] = []

  add = vi.fn((primitive) => {
    this._primitives.push(primitive)
    return primitive
  })

  remove = vi.fn((primitive) => {
    const index = this._primitives.indexOf(primitive)
    if (index !== -1) {
      this._primitives.splice(index, 1)
      return true
    }
    return false
  })
}

// Mock PointPrimitiveCollection
class MockPointPrimitiveCollection {
  length = 0
  private points: Array<{
    position: Cesium.Cartesian3
    pixelSize: number
    color: Cesium.Color
    outlineColor: Cesium.Color
    outlineWidth: number
    show: boolean
    id: string | number
  }> = []

  add = vi.fn((options) => {
    const point = { ...options }
    this.points.push(point)
    this.length = this.points.length
    return point
  })

  get = vi.fn((index: number) => {
    return this.points[index]
  })

  remove = vi.fn((point) => {
    const index = this.points.indexOf(point)
    if (index !== -1) {
      this.points.splice(index, 1)
      this.length = this.points.length
      return true
    }
    return false
  })

  removeAll = vi.fn(() => {
    this.points = []
    this.length = 0
  })
}

// Mock LabelCollection
class MockLabelCollection {
  add = vi.fn((options) => options)
  removeAll = vi.fn()
}

// Mock Cesium Viewer
const createMockCesiumViewer = (): Cesium.Viewer => {
  return {
    dataSources: {
      add: vi.fn((dataSource) => Promise.resolve(dataSource)),
      remove: vi.fn(() => true)
    },
    scene: {
      primitives: {
        add: vi.fn((primitive) => primitive),
        remove: vi.fn(() => true)
      }
    },
    camera: {
      moveEnd: {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      },
      flyToBoundingSphere: vi.fn(() => Promise.resolve())
    },
    flyTo: vi.fn(() => Promise.resolve())
  } as unknown as Cesium.Viewer
}

// Mock AutoViewer
const createMockViewer = (): AutoViewer => {
  const mockCesiumViewer = createMockCesiumViewer()

  return {
    cesiumViewer: mockCesiumViewer,
    getPlugin: vi.fn((name: string) => {
      if (name === 'event') {
        return {
          onLeftClick: vi.fn(() => 'click-listener-id'),
          off: vi.fn()
        }
      }
      if (name === 'popup') {
        return {
          createHTML: vi.fn(() => Promise.resolve()),
          createVue: vi.fn(() => Promise.resolve()),
          createReact: vi.fn(() => Promise.resolve())
        }
      }
      return null
    })
  } as unknown as AutoViewer
}

// Mock Cesium classes
vi.mock('cesium', async () => {
  const actual = await vi.importActual<typeof Cesium>('cesium')
  return {
    ...actual,
    CustomDataSource: vi.fn().mockImplementation((name) => new MockCustomDataSource(name)),
    PrimitiveCollection: vi.fn().mockImplementation(() => new MockPrimitiveCollection()),
    PointPrimitiveCollection: vi.fn().mockImplementation(() => new MockPointPrimitiveCollection()),
    LabelCollection: vi.fn().mockImplementation(() => new MockLabelCollection())
  }
})

describe('DataLayerPlugin', () => {
  let plugin: DataLayerPlugin
  let mockViewer: AutoViewer

  beforeEach(() => {
    plugin = new DataLayerPlugin()
    mockViewer = createMockViewer()
  })

  describe('初始化', () => {
    it('应该正确设置插件名称', () => {
      expect(plugin.name).toBe('dataLayer')
      expect(DataLayerPlugin.pluginName).toBe('dataLayer')
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

    it('安装后应该注册点击事件监听器', () => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)

      const eventPlugin = mockViewer.getPlugin('event')
      expect(eventPlugin).toBeDefined()
    })
  })

  describe('createLayer 方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够创建 Entity 图层', () => {
      const layerId = plugin.createLayer({
        name: 'test-entity-layer',
        type: 'entity'
      })

      expect(layerId).toBeDefined()
      expect(layerId).toMatch(/^layer_\d+$/)
    })

    it('应该能够创建 Primitive 图层', () => {
      const layerId = plugin.createLayer({
        name: 'test-primitive-layer',
        type: 'primitive'
      })

      expect(layerId).toBeDefined()
      expect(layerId).toMatch(/^layer_\d+$/)
    })

    it('应该能够创建带聚合配置的 Entity 图层', () => {
      const layerId = plugin.createLayer({
        name: 'clustered-layer',
        type: 'entity',
        clustering: {
          enabled: true,
          pixelRange: 100,
          minimumClusterSize: 5
        }
      })

      expect(layerId).toBeDefined()
    })
  })

  describe('getLayer 方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够获取图层实例', () => {
      const layerId = plugin.createLayer({
        name: 'test-layer',
        type: 'entity'
      })

      const layer = plugin.getLayer(layerId)

      expect(layer).toBeDefined()
      expect(layer?.id).toBe(layerId)
      expect(layer?.name).toBe('test-layer')
    })

    it('获取不存在的图层应该返回 undefined', () => {
      const layer = plugin.getLayer('non-existent-id')
      expect(layer).toBeUndefined()
    })
  })

  describe('getLayerByName 方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够根据名称获取图层', () => {
      plugin.createLayer({
        name: 'my-layer',
        type: 'entity'
      })

      const layer = plugin.getLayerByName('my-layer')

      expect(layer).toBeDefined()
      expect(layer?.name).toBe('my-layer')
    })

    it('获取不存在的图层名称应该返回 undefined', () => {
      const layer = plugin.getLayerByName('non-existent')
      expect(layer).toBeUndefined()
    })
  })

  describe('图层数据操作', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够添加数据项到 Entity 图层', () => {
      const layerId = plugin.createLayer({
        name: 'data-layer',
        type: 'entity'
      })

      const layer = plugin.getLayer(layerId)

      layer?.addItem({
        id: 'point-1',
        geometryType: 'point',
        position: [116.4, 39.9, 0],
        data: { name: 'Beijing' }
      })

      const item = layer?.getItem('point-1')
      expect(item).toBeDefined()
      expect(item?.id).toBe('point-1')
    })

    it('应该能够批量添加数据项', () => {
      const layerId = plugin.createLayer({
        name: 'data-layer',
        type: 'entity'
      })

      const layer = plugin.getLayer(layerId)

      layer?.addItems([
        {
          id: 'point-1',
          geometryType: 'point',
          position: [116.4, 39.9, 0]
        },
        {
          id: 'point-2',
          geometryType: 'point',
          position: [116.5, 39.8, 0]
        }
      ])

      expect(layer?.getItem('point-1')).toBeDefined()
      expect(layer?.getItem('point-2')).toBeDefined()
    })

    it('应该能够移除数据项', () => {
      const layerId = plugin.createLayer({
        name: 'data-layer',
        type: 'entity'
      })

      const layer = plugin.getLayer(layerId)

      layer?.addItem({
        id: 'point-1',
        geometryType: 'point',
        position: [116.4, 39.9, 0]
      })

      layer?.removeItem('point-1')

      expect(layer?.getItem('point-1')).toBeUndefined()
    })

    it('应该能够清空图层数据', () => {
      const layerId = plugin.createLayer({
        name: 'data-layer',
        type: 'entity'
      })

      const layer = plugin.getLayer(layerId)

      layer?.addItems([
        { id: 'point-1', geometryType: 'point', position: [116.4, 39.9, 0] },
        { id: 'point-2', geometryType: 'point', position: [116.5, 39.8, 0] }
      ])

      layer?.clear()

      expect(layer?.getItem('point-1')).toBeUndefined()
      expect(layer?.getItem('point-2')).toBeUndefined()
    })

    it('应该能够更新数据项', () => {
      const layerId = plugin.createLayer({
        name: 'data-layer',
        type: 'entity'
      })

      const layer = plugin.getLayer(layerId)

      layer?.addItem({
        id: 'point-1',
        geometryType: 'point',
        position: [116.4, 39.9, 0]
      })

      // Verify item was added
      const itemBefore = layer?.getItem('point-1')
      expect(itemBefore).toBeDefined()
      expect(itemBefore?.position).toEqual([116.4, 39.9, 0])

      layer?.updateItem('point-1', {
        show: false,
        position: [116.5, 39.8, 0]
      })

      const item = layer?.getItem('point-1')
      expect(item?.show).toBe(false)
      expect(item?.position).toEqual([116.5, 39.8, 0])
    })
  })

  describe('图层显示控制', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够设置图层可见性', () => {
      const layerId = plugin.createLayer({
        name: 'test-layer',
        type: 'entity'
      })

      const layer = plugin.getLayer(layerId)

      layer?.setShow(false)
      expect(layer?.show).toBe(false)

      layer?.setShow(true)
      expect(layer?.show).toBe(true)
    })

    it('创建图层时应该使用配置的初始显示状态', () => {
      const layerId = plugin.createLayer({
        name: 'hidden-layer',
        type: 'entity',
        show: false
      })

      const layer = plugin.getLayer(layerId)
      expect(layer?.show).toBe(false)
    })
  })

  describe('图层管理', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够移除图层', () => {
      const layerId = plugin.createLayer({
        name: 'test-layer',
        type: 'entity'
      })

      const result = plugin.removeLayer(layerId)

      expect(result).toBe(true)
      expect(plugin.getLayer(layerId)).toBeUndefined()
    })

    it('移除不存在的图层应该返回 false', () => {
      const result = plugin.removeLayer('non-existent')
      expect(result).toBe(false)
    })

    it('应该能够移除所有图层', () => {
      plugin.createLayer({ name: 'layer-1', type: 'entity' })
      plugin.createLayer({ name: 'layer-2', type: 'entity' })
      plugin.createLayer({ name: 'layer-3', type: 'primitive' })

      plugin.removeAllLayers()

      expect(plugin.getLayerCount()).toBe(0)
    })

    it('应该能够获取所有图层 ID', () => {
      const id1 = plugin.createLayer({ name: 'layer-1', type: 'entity' })
      const id2 = plugin.createLayer({ name: 'layer-2', type: 'entity' })

      const ids = plugin.getAllLayerIds()

      expect(ids).toHaveLength(2)
      expect(ids).toContain(id1)
      expect(ids).toContain(id2)
    })

    it('应该能够获取图层数量', () => {
      plugin.createLayer({ name: 'layer-1', type: 'entity' })
      plugin.createLayer({ name: 'layer-2', type: 'entity' })

      expect(plugin.getLayerCount()).toBe(2)
    })
  })

  describe('从数组数据创建数据项', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够从数组创建数据项', () => {
      const rawData = [
        { id: '1', lon: 116.4, lat: 39.9, name: 'Beijing' },
        { id: '2', lon: 121.5, lat: 31.2, name: 'Shanghai' }
      ]

      const items = plugin.createDataItemsFromArray(rawData, {
        idField: 'id',
        geometryType: 'point',
        position: {
          lonField: 'lon',
          latField: 'lat'
        }
      })

      expect(items).toHaveLength(2)
      expect(items[0].id).toBe('1')
      expect(items[0].position).toEqual([116.4, 39.9, 0])
      expect(items[1].id).toBe('2')
      expect(items[1].position).toEqual([121.5, 31.2, 0])
    })

    it('应该支持数据过滤', () => {
      const rawData = [
        { id: '1', value: 100 },
        { id: '2', value: 50 },
        { id: '3', value: 200 }
      ]

      const items = plugin.createDataItemsFromArray(rawData, {
        idField: 'id',
        geometryType: 'point',
        filter: (item: unknown) => (item as { value: number }).value > 80
      })

      expect(items).toHaveLength(2)
      expect(items[0].id).toBe('1')
      expect(items[1].id).toBe('3')
    })

    it('应该支持数据转换', () => {
      const rawData = [{ id: '1', coord: '116.4,39.9' }]

      const items = plugin.createDataItemsFromArray(rawData, {
        idField: 'id',
        geometryType: 'point',
        transform: (item: unknown) => {
          const i = item as { id: string; coord: string }
          const [lon, lat] = i.coord.split(',').map(Number)
          return { ...i, lon, lat }
        },
        position: {
          lonField: 'lon',
          latField: 'lat'
        }
      })

      expect(items).toHaveLength(1)
      expect(items[0].position).toEqual([116.4, 39.9, 0])
    })
  })

  describe('批量导入数组数据', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够批量导入数据到图层', () => {
      const layerId = plugin.createLayer({
        name: 'import-layer',
        type: 'entity'
      })

      const rawData = [
        { id: '1', lon: 116.4, lat: 39.9 },
        { id: '2', lon: 121.5, lat: 31.2 }
      ]

      plugin.importArrayData(layerId, rawData, {
        idField: 'id',
        geometryType: 'point',
        position: {
          lonField: 'lon',
          latField: 'lat'
        }
      })

      const layer = plugin.getLayer(layerId)
      expect(layer?.getItem('1')).toBeDefined()
      expect(layer?.getItem('2')).toBeDefined()
    })

    it('导入到不存在的图层应该抛出错误', () => {
      expect(() => {
        plugin.importArrayData('non-existent', [], {
          idField: 'id',
          geometryType: 'point'
        })
      }).toThrow()
    })
  })

  describe('飞向图层', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够飞向 Entity 图层', async () => {
      const layerId = plugin.createLayer({
        name: 'test-layer',
        type: 'entity'
      })

      const layer = plugin.getLayer(layerId)

      await layer?.flyTo(3)

      expect(mockViewer.cesiumViewer.flyTo).toHaveBeenCalled()
    })

    it('应该能够飞向 Primitive 图层', async () => {
      const layerId = plugin.createLayer({
        name: 'test-layer',
        type: 'primitive'
      })

      const layer = plugin.getLayer(layerId)

      layer?.addItem({
        id: 'point-1',
        geometryType: 'point',
        position: [116.4, 39.9, 0]
      })

      await layer?.flyTo(3)

      expect(mockViewer.cesiumViewer.camera.flyToBoundingSphere).toHaveBeenCalled()
    })
  })

  describe('销毁插件', () => {
    it('应该正确清理资源', () => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)

      plugin.createLayer({ name: 'layer-1', type: 'entity' })
      plugin.createLayer({ name: 'layer-2', type: 'primitive' })

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
        plugin.createLayer({
          name: 'test',
          type: 'entity'
        })
      ).toThrow()
    })
  })
})
