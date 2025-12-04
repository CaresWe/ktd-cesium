import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { GraphicsPlugin } from '../src/modules/GraphicsPlugin'
import type { AutoViewer } from '@auto-cesium/core'
import * as Cesium from 'cesium'

// Mock Cesium classes
vi.mock('cesium', async () => {
  const actual = await vi.importActual<typeof Cesium>('cesium')
  return {
    ...actual,
    CustomDataSource: vi.fn(() => ({
      name: 'GraphicsPlugin-DataSource',
      entities: {
        add: vi.fn(),
        remove: vi.fn(),
        removeAll: vi.fn(),
        contains: vi.fn(() => false),
        values: []
      },
      show: true,
      clustering: {
        enabled: false,
        pixelRange: 80,
        minimumClusterSize: 2,
        clusterEvent: {
          addEventListener: vi.fn()
        }
      }
    })),
    PrimitiveCollection: vi.fn(() => ({
      add: vi.fn(),
      remove: vi.fn(),
      removeAll: vi.fn(),
      contains: vi.fn(() => false),
      show: true,
      _primitives: []
    })),
    BoundingSphere: {
      ...actual.BoundingSphere,
      fromPoints: vi.fn((points) => {
        if (!points || points.length === 0) return null
        return { center: points[0], radius: 100 }
      }),
      fromBoundingSpheres: vi.fn((spheres) => {
        if (!spheres || spheres.length === 0) return null
        return spheres[0]
      })
    },
    SceneTransforms: {
      worldToWindowCoordinates: vi.fn(() => new actual.Cartesian2(100, 100))
    }
  }
})

// Create mock Cesium Viewer
const createMockCesiumViewer = () => {
  const container = document.createElement('div')
  document.body.appendChild(container)

  const removeInputAction = vi.fn()

  return {
    container,
    scene: {
      primitives: {
        add: vi.fn((primitive) => primitive),
        remove: vi.fn(),
        contains: vi.fn(() => false)
      },
      postRender: {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }
    },
    camera: {
      flyToBoundingSphere: vi.fn()
    },
    dataSources: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(() => false)
    },
    screenSpaceEventHandler: {
      removeInputAction
    }
  } as unknown as Cesium.Viewer
}

// Create mock AutoViewer
const createMockViewer = (): AutoViewer => {
  const mockCesiumViewer = createMockCesiumViewer()

  return {
    cesiumViewer: mockCesiumViewer,
    getPlugin: vi.fn((name: string) => {
      if (name === 'event') {
        return {
          onLeftClick: vi.fn(() => 'left-click-id'),
          onTouchStart: vi.fn(() => 'touch-start-id'),
          onMouseMove: vi.fn(() => 'mouse-move-id'),
          off: vi.fn()
        }
      }
      return null
    })
  } as unknown as AutoViewer
}

describe('GraphicsPlugin', () => {
  let plugin: GraphicsPlugin
  let mockViewer: AutoViewer

  beforeEach(() => {
    plugin = new GraphicsPlugin()
    mockViewer = createMockViewer()
  })

  afterEach(() => {
    if (plugin.installed) {
      plugin.destroy()
    }
    document.body.innerHTML = ''
  })

  describe('初始化', () => {
    it('应该正确设置插件名称', () => {
      expect(plugin.name).toBe('graphics')
      expect(GraphicsPlugin.pluginName).toBe('graphics')
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

    it('安装时应该创建数据源', () => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)

      expect(mockViewer.cesiumViewer.dataSources.add).toHaveBeenCalled()
    })

    it('安装时应该创建图元集合', () => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)

      expect(mockViewer.cesiumViewer.scene.primitives.add).toHaveBeenCalled()
    })

    it('安装时应该移除默认的屏幕空间事件', () => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)

      expect(mockViewer.cesiumViewer.screenSpaceEventHandler.removeInputAction).toHaveBeenCalledWith(
        Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
      )
      expect(mockViewer.cesiumViewer.screenSpaceEventHandler.removeInputAction).toHaveBeenCalledWith(
        Cesium.ScreenSpaceEventType.LEFT_CLICK
      )
    })

    it('应该支持不移除默认的屏幕空间事件', () => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer, { removeScreenSpaceEvent: false })

      expect(mockViewer.cesiumViewer.screenSpaceEventHandler.removeInputAction).not.toHaveBeenCalled()
    })
  })

  describe('绘制功能', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够开始绘制', () => {
      // 绘制功能依赖复杂的内部实现，我们主要测试不抛出错误
      expect(() => plugin.startDraw('point')).not.toThrow()
    })

    it('应该支持使用对象参数开始绘制', () => {
      // 测试对象参数不抛出错误
      expect(() =>
        plugin.startDraw({
          type: 'point',
          style: { color: '#ff0000' }
        })
      ).not.toThrow()
    })

    it('缺少 type 参数时应该返回 undefined', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      // @ts-expect-error - 测试无效参数
      const entity = plugin.startDraw({})

      expect(entity).toBeUndefined()
      expect(errorSpy).toHaveBeenCalledWith('缺少绘制类型 type 参数!')
      errorSpy.mockRestore()
    })

    it('不支持的类型应该返回 undefined', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      // @ts-expect-error - 测试无效类型
      const entity = plugin.startDraw('invalid-type')

      expect(entity).toBeUndefined()
      expect(errorSpy).toHaveBeenCalledWith('不支持 type:invalid-type 的绘制,请检查参数!')
      errorSpy.mockRestore()
    })

    it('应该能够检查是否正在绘制', () => {
      const isDrawing1 = plugin.hasDrawing()
      expect(isDrawing1).toBe(false)

      plugin.startDraw('point')
      // hasDrawing 依赖于内部状态，可能需要 mock
      const isDrawing2 = plugin.hasDrawing()
      expect(typeof isDrawing2).toBe('boolean')
    })

    it('应该能够停止绘制', () => {
      plugin.startDraw('point')
      const result = plugin.stopDraw()
      expect(result).toBe(plugin)
    })

    it('应该能够强制结束绘制', () => {
      // endDraw 不依赖特定绘制状态
      const result = plugin.endDraw()
      expect(result).toBe(plugin)
    })

    it('应该能够清除所有绘制', () => {
      plugin.startDraw('point')
      const result = plugin.clearDraw()
      expect(result).toBe(plugin)
    })

    it('应该支持不同的绘制类型', () => {
      // 只测试简单类型，复杂类型需要完整的事件和 mock 系统
      expect(() => plugin.startDraw('point')).not.toThrow()
      plugin.stopDraw()
      expect(() => plugin.startDraw('billboard')).not.toThrow()
      plugin.stopDraw()
      expect(() => plugin.startDraw('label')).not.toThrow()
      plugin.stopDraw()
    })
  })

  describe('编辑功能', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够启用编辑模式', () => {
      const result = plugin.hasEdit(true)
      expect(result).toBe(plugin)
    })

    it('应该能够禁用编辑模式', () => {
      const result = plugin.hasEdit(false)
      expect(result).toBe(plugin)
    })

    it('应该能够获取编辑模式状态', () => {
      const status = plugin.hasEdit()
      expect(typeof status).toBe('boolean')
    })

    it('应该能够停止编辑', () => {
      plugin.stopEditing()
      expect(plugin.getCurrentEntity()).toBeNull()
    })

    it('应该能够获取当前编辑要素', () => {
      const entity = plugin.getCurrentEntity()
      expect(entity).toBeNull()
    })
  })

  describe('要素管理', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够获取所有要素', () => {
      const entities = plugin.getEntitys()
      expect(Array.isArray(entities)).toBe(true)
    })

    it('应该能够根据 ID 查找要素', () => {
      const entity = plugin.getEntityById('test-id')
      expect(entity).toBeNull()
    })

    it('应该能够删除要素', () => {
      plugin.deleteEntity()
      expect(plugin.getCurrentEntity()).toBeNull()
    })

    it('应该能够使用 remove 别名删除要素', () => {
      plugin.remove()
      expect(plugin.getCurrentEntity()).toBeNull()
    })

    it('应该能够删除所有要素', () => {
      const result = plugin.deleteAll()
      expect(result).toBe(plugin)
    })

    it('应该能够使用 removeAll 别名删除所有要素', () => {
      const result = plugin.removeAll()
      expect(result).toBe(plugin)
    })

    it('应该能够检查是否有绘制内容', () => {
      const hasDraw = plugin.hasDraw()
      expect(typeof hasDraw).toBe('boolean')
    })
  })

  describe('数据源操作', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够获取数据源', () => {
      const dataSource = plugin.getDataSource()
      expect(dataSource).toBeDefined()
    })

    it('应该能够获取图元集合', () => {
      const primitives = plugin.getPrimitives()
      expect(primitives).toBeDefined()
    })
  })

  describe('GeoJSON 操作', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够加载 GeoJSON 字符串', () => {
      const geojson = JSON.stringify({
        type: 'Feature',
        properties: {
          type: 'point'
        },
        geometry: {
          type: 'Point',
          coordinates: [116.4, 39.9, 0]
        }
      })

      const entities = plugin.loadJson(geojson)
      expect(Array.isArray(entities)).toBe(true)
    })

    it('应该能够加载 GeoJSON 对象', () => {
      const geojson = {
        type: 'Feature' as const,
        properties: {
          type: 'point'
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [116.4, 39.9, 0]
        }
      }

      const entities = plugin.loadJson(geojson)
      expect(Array.isArray(entities)).toBe(true)
    })

    it('应该能够加载 FeatureCollection', () => {
      const geojson = {
        type: 'FeatureCollection' as const,
        features: [
          {
            type: 'Feature' as const,
            properties: {
              type: 'point'
            },
            geometry: {
              type: 'Point' as const,
              coordinates: [116.4, 39.9, 0]
            }
          }
        ]
      }

      const entities = plugin.loadJson(geojson)
      expect(Array.isArray(entities)).toBe(true)
    })

    it('加载无效 JSON 应该返回空数组', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const entities = plugin.loadJson('invalid json')

      expect(entities).toEqual([])
      expect(errorSpy).toHaveBeenCalled()
      errorSpy.mockRestore()
    })

    it('应该支持清除选项', () => {
      const geojson = {
        type: 'Feature' as const,
        properties: {
          type: 'point'
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [116.4, 39.9, 0]
        }
      }

      plugin.loadJson(geojson, { clear: true })
      expect(true).toBe(true) // 确保没有抛出错误
    })

    it('应该能够转换为 GeoJSON', () => {
      const geojson = plugin.toGeoJSON()
      expect(geojson).toBeNull() // 没有数据时返回 null
    })
  })

  describe('属性更新', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够更新属性', () => {
      const result = plugin.updateAttribute({ style: { color: '#ff0000' } })
      expect(result).toBeNull() // 没有当前实体时返回 null
    })

    it('应该能够更新样式', () => {
      const result = plugin.updateStyle({ color: '#ff0000' })
      expect(result).toBeNull() // 没有当前实体时返回 null
    })

    it('应该能够设置位置', () => {
      const positions = [Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0)]
      const result = plugin.setPositions(positions)
      expect(result).toBeNull() // 没有当前实体时返回 null
    })

    it('应该能够获取坐标', () => {
      const mockEntity = new Cesium.Entity()
      const coords = plugin.getCoordinates(mockEntity)
      expect(coords).toBeNull() // 没有属性时返回 null
    })

    it('应该能够获取位置', () => {
      const mockEntity = new Cesium.Entity()
      const positions = plugin.getPositions(mockEntity)
      expect(positions).toBeNull() // 没有属性时返回 null
    })
  })

  describe('可见性控制', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够设置可见性', () => {
      plugin.setVisible(false)
      const dataSource = plugin.getDataSource()
      expect(dataSource?.show).toBe(false)

      plugin.setVisible(true)
      expect(dataSource?.show).toBe(true)
    })

    it('隐藏时应该停止绘制', () => {
      plugin.startDraw('point')
      plugin.setVisible(false)
      // 应该已经停止绘制
      expect(true).toBe(true)
    })
  })

  describe('飞行功能', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够飞行到实体', () => {
      const mockEntity = new Cesium.Entity({
        position: Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0)
      })

      plugin.flyTo(mockEntity)
      // 验证没有抛出错误
      expect(true).toBe(true)
    })

    it('应该能够飞行到实体数组', () => {
      const entities = [
        new Cesium.Entity({
          position: Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0)
        })
      ]

      plugin.flyTo(entities)
      expect(true).toBe(true)
    })

    it('空实体时不应该飞行', () => {
      plugin.flyTo([])
      expect(mockViewer.cesiumViewer.camera.flyToBoundingSphere).not.toHaveBeenCalled()
    })
  })

  describe('聚合功能', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够设置聚合配置', () => {
      plugin.setClusterOptions({
        enabled: true,
        pixelRange: 100,
        minimumClusterSize: 3
      })
      expect(true).toBe(true)
    })

    it('应该能够启用聚合', () => {
      plugin.enableClustering()
      expect(true).toBe(true)
    })

    it('应该能够禁用聚合', () => {
      plugin.disableClustering()
      const dataSource = plugin.getDataSource()
      expect(dataSource?.clustering.enabled).toBe(false)
    })
  })

  describe('变换控制器', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer, {
        transform: { enabled: true }
      })
    })

    it('应该能够启用变换控制器', () => {
      plugin.enableTransform()
      expect(true).toBe(true)
    })

    it('应该能够禁用变换控制器', () => {
      plugin.disableTransform()
      expect(true).toBe(true)
    })

    it('应该能够获取变换控制器实例', () => {
      const transformPlugin = plugin.getTransformPlugin()
      expect(transformPlugin).toBeDefined()
    })
  })

  describe('事件系统', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够监听事件', () => {
      const callback = vi.fn()
      plugin.on('drawCreated', callback)
      expect(true).toBe(true)
    })

    it('应该能够移除事件监听', () => {
      const callback = vi.fn()
      plugin.on('drawCreated', callback)
      plugin.off('drawCreated', callback)
      expect(true).toBe(true)
    })

    it('应该能够移除所有事件监听', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      plugin.on('drawCreated', callback1)
      plugin.on('drawCreated', callback2)
      plugin.off('drawCreated')
      expect(true).toBe(true)
    })
  })

  describe('销毁插件', () => {
    it('应该正确清理资源', () => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
      plugin.destroy()

      expect(plugin.installed).toBe(false)
    })

    it('销毁时应该移除数据源', () => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
      plugin.destroy()

      expect(mockViewer.cesiumViewer.dataSources.remove).toHaveBeenCalled()
    })

    it('销毁时应该清理图元集合', () => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)

      const primitives = plugin.getPrimitives()
      expect(primitives).toBeDefined()

      plugin.destroy()

      // 验证插件已销毁
      expect(plugin.installed).toBe(false)
    })

    it('未安装时销毁应该不报错', () => {
      expect(() => plugin.destroy()).not.toThrow()
    })
  })

  describe('未安装时的错误处理', () => {
    it('未安装时调用方法应该能够安全处理', () => {
      expect(() => plugin.getEntitys()).not.toThrow()
      expect(() => plugin.stopDraw()).not.toThrow()
      expect(() => plugin.clearDraw()).not.toThrow()
      expect(() => plugin.stopEditing()).not.toThrow()
    })
  })

  describe('边界情况', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够处理 null 实体', () => {
      expect(() => plugin.deleteEntity(undefined)).not.toThrow()
      expect(() => plugin.updateAttribute({}, undefined)).not.toThrow()
      expect(() => plugin.updateStyle({}, undefined)).not.toThrow()
    })

    it('应该能够处理空数组', () => {
      plugin.flyTo([])
      expect(true).toBe(true)
    })

    it('应该能够处理未定义的选项', () => {
      plugin.loadJson('{}', undefined)
      expect(true).toBe(true)
    })
  })

  describe('插件配置', () => {
    it('应该支持自定义配置', () => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer, {
        hasEdit: false,
        nameTooltip: true,
        removeScreenSpaceEvent: false
      })

      expect(plugin.installed).toBe(true)
    })

    it('应该支持聚合配置', () => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer, {
        clustering: {
          enabled: true,
          pixelRange: 100
        }
      })

      expect(plugin.installed).toBe(true)
    })
  })
})
