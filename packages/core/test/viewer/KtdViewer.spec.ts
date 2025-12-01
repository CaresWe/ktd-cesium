import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { KtdViewer } from '../../src/viewer/KtdViewer'
import type { Viewer as CesiumViewer } from 'cesium'
import type { ViewerPlugin, ViewerPluginConstructor, KtdViewer as KtdViewerType } from '../../src/viewer/types'

// Mock Cesium Viewer
const createMockViewer = (): CesiumViewer => {
  const mockViewer = {
    isDestroyed: vi.fn(() => false),
    destroy: vi.fn(),
    scene: {
      globe: {},
      camera: {},
      primitives: new Map()
    },
    camera: {
      position: {},
      direction: {},
      up: {}
    },
    canvas: document.createElement('canvas'),
    dataSources: {
      add: vi.fn(),
      remove: vi.fn()
    },
    entities: {
      add: vi.fn(),
      remove: vi.fn()
    }
  }
  return mockViewer as unknown as CesiumViewer
}

// Mock Plugin
class MockPlugin implements ViewerPlugin {
  static pluginName = 'mockPlugin'

  name = 'mockPlugin'
  installed = false

  install = vi.fn((_viewer: KtdViewerType) => {
    this.installed = true
    return undefined
  })

  destroy = vi.fn(() => {
    this.installed = false
    return undefined
  })
}

describe('KtdViewer', () => {
  let mockCesiumViewer: CesiumViewer
  let ktdViewer: KtdViewerType

  beforeEach(() => {
    mockCesiumViewer = createMockViewer()
    ktdViewer = new KtdViewer(mockCesiumViewer) as unknown as KtdViewerType
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('构造函数', () => {
    it('应该正确创建 KtdViewer 实例', () => {
      expect(ktdViewer).toBeDefined()
      expect(ktdViewer.plugins).toBeInstanceOf(Map)
      expect(ktdViewer.plugins.size).toBe(0)
    })

    it('应该代理 Cesium Viewer 的属性', () => {
      // 通过 Proxy,可以访问原始 viewer 的属性
      const viewer = ktdViewer as KtdViewerType & CesiumViewer
      expect(viewer.scene).toBeDefined()
      expect(viewer.camera).toBeDefined()
      expect(viewer.canvas).toBeDefined()
    })

    it('应该能设置 Cesium Viewer 的属性', () => {
      const viewer = ktdViewer as KtdViewerType & CesiumViewer
      const customValue = 'test-value'

      // 设置一个自定义属性到 viewer
      ;(viewer as unknown as Record<string, string>).customProperty = customValue

      expect((viewer as unknown as Record<string, string>).customProperty).toBe(customValue)
      expect((mockCesiumViewer as unknown as Record<string, string>).customProperty).toBe(customValue)
    })

    it('应该安装预设插件', () => {
      const viewer = new KtdViewer(createMockViewer(), {
        plugins: [MockPlugin as ViewerPluginConstructor]
      })

      expect(viewer.plugins.size).toBe(1)
      expect(viewer.plugins.has('mockPlugin')).toBe(true)
    })

    it('应该处理空的预设插件数组', () => {
      const viewer = new KtdViewer(createMockViewer(), {
        plugins: []
      })

      expect(viewer.plugins.size).toBe(0)
    })

    it('应该处理没有预设插件的选项', () => {
      const viewer = new KtdViewer(createMockViewer(), {})

      expect(viewer.plugins.size).toBe(0)
    })
  })

  describe('use 方法', () => {
    it('应该能安装插件', () => {
      const plugin = ktdViewer.use(MockPlugin as ViewerPluginConstructor)

      expect(plugin).toBeInstanceOf(MockPlugin)
      expect(ktdViewer.plugins.has('mockPlugin')).toBe(true)
      expect(plugin.install).toHaveBeenCalledOnce()
      expect(plugin.install).toHaveBeenCalledWith(ktdViewer)
      expect(plugin.installed).toBe(true)
    })

    it('应该防止重复安装同一插件', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const plugin1 = ktdViewer.use(MockPlugin as ViewerPluginConstructor)
      const plugin2 = ktdViewer.use(MockPlugin as ViewerPluginConstructor)

      expect(plugin1).toBe(plugin2)
      expect(ktdViewer.plugins.size).toBe(1)
      expect(consoleSpy).toHaveBeenCalledWith('Plugin "mockPlugin" is already installed')

      consoleSpy.mockRestore()
    })

    it('应该处理同步插件安装成功', () => {
      class SyncPlugin implements ViewerPlugin {
        static pluginName = 'syncPlugin'
        name = 'syncPlugin'
        installed = false

        install = vi.fn((_viewer: KtdViewerType) => {
          this.installed = true
          // 返回 undefined (同步)
        })
      }

      const plugin = ktdViewer.use(SyncPlugin as ViewerPluginConstructor)

      expect(ktdViewer.plugins.has('syncPlugin')).toBe(true)
      expect(plugin.install).toHaveBeenCalled()
      expect(plugin.installed).toBe(true)
    })

    it('应该处理异步插件安装成功', async () => {
      class AsyncPlugin implements ViewerPlugin {
        static pluginName = 'asyncPlugin'
        name = 'asyncPlugin'
        installed = false

        install = vi.fn((_viewer: KtdViewerType) => {
          return Promise.resolve().then(() => {
            this.installed = true
          })
        })
      }

      const plugin = ktdViewer.use(AsyncPlugin as ViewerPluginConstructor)

      // 等待异步完成
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(ktdViewer.plugins.has('asyncPlugin')).toBe(true)
      expect(plugin.install).toHaveBeenCalled()
      expect(plugin.installed).toBe(true)
    })

    it('应该处理异步插件安装失败', async () => {
      class FailingAsyncPlugin implements ViewerPlugin {
        static pluginName = 'failingAsyncPlugin'
        name = 'failingAsyncPlugin'
        installed = false

        install = vi.fn(() => {
          return Promise.reject(new Error('Install failed'))
        })
      }

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      ktdViewer.use(FailingAsyncPlugin as ViewerPluginConstructor)

      // 等待异步失败
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(consoleSpy).toHaveBeenCalledWith('Failed to install plugin "failingAsyncPlugin":', expect.any(Error))
      // 插件不应该被添加到 map 中
      expect(ktdViewer.plugins.has('failingAsyncPlugin')).toBe(false)

      consoleSpy.mockRestore()
    })
  })

  describe('getPlugin 方法', () => {
    it('应该能获取已安装的插件', () => {
      ktdViewer.use(MockPlugin as ViewerPluginConstructor)

      const plugin = ktdViewer.getPlugin<MockPlugin>('mockPlugin')

      expect(plugin).toBeInstanceOf(MockPlugin)
      expect(plugin?.name).toBe('mockPlugin')
    })

    it('应该在插件不存在时返回 undefined', () => {
      const plugin = ktdViewer.getPlugin('nonExistent')

      expect(plugin).toBeUndefined()
    })

    it('应该能获取正确类型的插件', () => {
      const installedPlugin = ktdViewer.use(MockPlugin as ViewerPluginConstructor)
      const retrievedPlugin = ktdViewer.getPlugin<MockPlugin>('mockPlugin')

      expect(retrievedPlugin).toBe(installedPlugin)
    })
  })

  describe('destroy 方法', () => {
    it('应该销毁所有插件', () => {
      const plugin = ktdViewer.use(MockPlugin as ViewerPluginConstructor)

      ktdViewer.destroy()

      expect(plugin.destroy).toHaveBeenCalledOnce()
      expect(ktdViewer.plugins.size).toBe(0)
      expect(plugin.installed).toBe(false)
    })

    it('应该销毁多个插件', () => {
      class Plugin1 implements ViewerPlugin {
        static pluginName = 'plugin1'
        name = 'plugin1'
        installed = false
        install = vi.fn(() => {
          this.installed = true
        })
        destroy = vi.fn(() => {
          this.installed = false
        })
      }

      class Plugin2 implements ViewerPlugin {
        static pluginName = 'plugin2'
        name = 'plugin2'
        installed = false
        install = vi.fn(() => {
          this.installed = true
        })
        destroy = vi.fn(() => {
          this.installed = false
        })
      }

      const p1 = ktdViewer.use(Plugin1 as ViewerPluginConstructor)
      const p2 = ktdViewer.use(Plugin2 as ViewerPluginConstructor)

      expect(ktdViewer.plugins.size).toBe(2)

      ktdViewer.destroy()

      expect(p1.destroy).toHaveBeenCalledOnce()
      expect(p2.destroy).toHaveBeenCalledOnce()
      expect(ktdViewer.plugins.size).toBe(0)
    })

    it('应该销毁没有 destroy 方法的插件', () => {
      class PluginWithoutDestroy implements ViewerPlugin {
        static pluginName = 'pluginWithoutDestroy'
        name = 'pluginWithoutDestroy'
        installed = false
        install = vi.fn(() => {
          this.installed = true
        })
        // 没有 destroy 方法
      }

      ktdViewer.use(PluginWithoutDestroy as ViewerPluginConstructor)

      expect(() => ktdViewer.destroy()).not.toThrow()
      expect(ktdViewer.plugins.size).toBe(0)
    })

    it('应该销毁 Cesium Viewer', () => {
      ktdViewer.destroy()

      expect(mockCesiumViewer.isDestroyed).toHaveBeenCalled()
      expect(mockCesiumViewer.destroy).toHaveBeenCalledOnce()
    })

    it('应该标记为已销毁', () => {
      expect(ktdViewer.destroyed).toBe(false)

      ktdViewer.destroy()

      expect(ktdViewer.destroyed).toBe(true)
    })

    it('应该防止重复销毁', () => {
      ktdViewer.destroy()
      const mockDestroy = mockCesiumViewer.destroy as ReturnType<typeof vi.fn>
      const destroyCalls = mockDestroy.mock.calls.length

      ktdViewer.destroy()

      expect(mockDestroy.mock.calls.length).toBe(destroyCalls)
      expect(ktdViewer.destroyed).toBe(true)
    })

    it('应该处理插件同步销毁失败', () => {
      class FailingPlugin implements ViewerPlugin {
        static pluginName = 'failingPlugin'
        name = 'failingPlugin'
        installed = false

        install = vi.fn(() => {
          this.installed = true
        })
        destroy = vi.fn(() => {
          throw new Error('Destroy failed')
        })
      }

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      ktdViewer.use(FailingPlugin as ViewerPluginConstructor)
      ktdViewer.destroy()

      expect(consoleSpy).toHaveBeenCalledWith('Failed to destroy plugin "failingPlugin":', expect.any(Error))
      expect(ktdViewer.destroyed).toBe(true)
      expect(ktdViewer.plugins.size).toBe(0)

      consoleSpy.mockRestore()
    })

    it('应该处理插件异步销毁失败', async () => {
      class FailingAsyncDestroyPlugin implements ViewerPlugin {
        static pluginName = 'failingAsyncDestroyPlugin'
        name = 'failingAsyncDestroyPlugin'
        installed = false

        install = vi.fn(() => {
          this.installed = true
        })
        destroy = vi.fn(() => {
          return Promise.reject(new Error('Async destroy failed'))
        })
      }

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      ktdViewer.use(FailingAsyncDestroyPlugin as ViewerPluginConstructor)
      ktdViewer.destroy()

      // 等待异步失败
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to destroy plugin "failingAsyncDestroyPlugin":',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it('应该处理 Cesium Viewer 已销毁的情况', () => {
      const alreadyDestroyedViewer = createMockViewer()
      const mockIsDestroyed = alreadyDestroyedViewer.isDestroyed as ReturnType<typeof vi.fn>
      mockIsDestroyed.mockReturnValue(true)

      const viewer = new KtdViewer(alreadyDestroyedViewer)
      const mockDestroy = alreadyDestroyedViewer.destroy as ReturnType<typeof vi.fn>

      viewer.destroy()

      // 不应该调用已销毁的 viewer 的 destroy
      expect(mockDestroy).not.toHaveBeenCalled()
      expect(viewer.destroyed).toBe(true)
    })
  })

  describe('cesiumViewer 属性', () => {
    it('应该能获取原始 Cesium Viewer', () => {
      expect(ktdViewer.cesiumViewer).toBe(mockCesiumViewer)
    })

    it('原始 Cesium Viewer 应该与代理的属性一致', () => {
      const viewer = ktdViewer as KtdViewerType & CesiumViewer
      expect(ktdViewer.cesiumViewer.scene).toBe(viewer.scene)
      expect(ktdViewer.cesiumViewer.camera).toBe(viewer.camera)
    })
  })

  describe('Proxy 行为', () => {
    it('应该能调用 Cesium Viewer 的方法', () => {
      const viewer = ktdViewer as KtdViewerType & CesiumViewer
      const mockMethod = vi.fn()
      mockCesiumViewer.isDestroyed = mockMethod

      viewer.isDestroyed()

      expect(mockMethod).toHaveBeenCalled()
    })

    it('应该正确绑定 this 到原始 viewer', () => {
      const viewer = ktdViewer as KtdViewerType & CesiumViewer
      const mockIsDestroyed = mockCesiumViewer.isDestroyed as ReturnType<typeof vi.fn>

      viewer.isDestroyed()

      // 验证函数被正确调用
      expect(mockIsDestroyed).toHaveBeenCalled()
    })

    it('应该能获取 KtdViewer 自己的属性优先', () => {
      expect(ktdViewer.plugins).toBeDefined()
      expect(ktdViewer.plugins).toBeInstanceOf(Map)
    })

    it('应该能通过 Proxy 设置 Cesium Viewer 的属性', () => {
      const viewer = ktdViewer as KtdViewerType & CesiumViewer
      const customProperty = { custom: 'value' }

      // 设置一个不存在于 KtdViewer 的属性，应该被代理到 cesiumViewer
      ;(viewer as unknown as Record<string, unknown>).customProp = customProperty

      expect((viewer as unknown as Record<string, unknown>).customProp).toBe(customProperty)
      expect((ktdViewer.cesiumViewer as unknown as Record<string, unknown>).customProp).toBe(customProperty)
    })
  })

  describe('边缘情况', () => {
    it('应该处理插件构造函数返回的实例', () => {
      const plugin = ktdViewer.use(MockPlugin as ViewerPluginConstructor)

      expect(plugin).toBeInstanceOf(MockPlugin)
      expect(plugin.name).toBe('mockPlugin')
    })

    it('应该处理连续安装多个不同插件', () => {
      class Plugin1 implements ViewerPlugin {
        static pluginName = 'plugin1'
        name = 'plugin1'
        installed = false
        install = vi.fn(() => {
          this.installed = true
        })
      }

      class Plugin2 implements ViewerPlugin {
        static pluginName = 'plugin2'
        name = 'plugin2'
        installed = false
        install = vi.fn(() => {
          this.installed = true
        })
      }

      class Plugin3 implements ViewerPlugin {
        static pluginName = 'plugin3'
        name = 'plugin3'
        installed = false
        install = vi.fn(() => {
          this.installed = true
        })
      }

      ktdViewer.use(Plugin1 as ViewerPluginConstructor)
      ktdViewer.use(Plugin2 as ViewerPluginConstructor)
      ktdViewer.use(Plugin3 as ViewerPluginConstructor)

      expect(ktdViewer.plugins.size).toBe(3)
      expect(ktdViewer.plugins.has('plugin1')).toBe(true)
      expect(ktdViewer.plugins.has('plugin2')).toBe(true)
      expect(ktdViewer.plugins.has('plugin3')).toBe(true)
    })
  })
})
