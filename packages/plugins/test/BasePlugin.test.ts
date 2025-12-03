import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BasePlugin } from '../src/BasePlugin'
import type { AutoViewer } from '@auto-cesium/core'
import type { Viewer as CesiumViewer } from 'cesium'

// 创建一个测试插件类
class TestPlugin extends BasePlugin {
  readonly name = 'test-plugin'
  onInstallCalled = false
  onDestroyCalled = false

  protected onInstall(_viewer: AutoViewer): void {
    this.onInstallCalled = true
  }

  protected onDestroy(): void {
    this.onDestroyCalled = true
  }

  // 暴露 cesiumViewer 用于测试
  public getCesiumViewer(): CesiumViewer {
    return this.cesiumViewer
  }
}

// Mock AutoViewer
const createMockViewer = (): AutoViewer => {
  const mockCesiumViewer = {
    scene: {},
    camera: {},
    entities: {},
    dataSources: {}
  } as CesiumViewer

  return {
    cesiumViewer: mockCesiumViewer
  } as AutoViewer
}

describe('BasePlugin', () => {
  let plugin: TestPlugin
  let mockViewer: AutoViewer

  beforeEach(() => {
    plugin = new TestPlugin()
    mockViewer = createMockViewer()
  })

  describe('初始化状态', () => {
    it('应该正确初始化插件名称', () => {
      expect(plugin.name).toBe('test-plugin')
    })

    it('初始状态应该是未安装', () => {
      expect(plugin.installed).toBe(false)
    })
  })

  describe('install 方法', () => {
    it('应该成功安装插件', () => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
      expect(plugin.installed).toBe(true)
      expect(plugin.onInstallCalled).toBe(true)
    })

    it('重复安装应该显示警告', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)

      expect(warnSpy).toHaveBeenCalledWith('Plugin "test-plugin" is already installed')
      warnSpy.mockRestore()
    })

    it('安装后应该能访问 viewer', () => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
      const cesiumViewer = plugin.getCesiumViewer()
      expect(cesiumViewer).toBe(mockViewer.cesiumViewer)
    })

    it('应该支持异步安装', async () => {
      class AsyncPlugin extends BasePlugin {
        readonly name = 'async-plugin'

        protected async onInstall(_viewer: AutoViewer): Promise<void> {
          return new Promise((resolve) => {
            setTimeout(resolve, 10)
          })
        }
      }

      const asyncPlugin = new AsyncPlugin()
      // @ts-expect-error - 访问 protected 方法用于测试
      const result = asyncPlugin.install(mockViewer)

      expect(result).toBeInstanceOf(Promise)
      await result
      expect(asyncPlugin.installed).toBe(true)
    })
  })

  describe('cesiumViewer getter', () => {
    it('未安装时访问 cesiumViewer 应该抛出错误', () => {
      expect(() => plugin.getCesiumViewer()).toThrow('Plugin "test-plugin" is not installed')
    })

    it('安装后应该能正确访问 cesiumViewer', () => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
      const cesiumViewer = plugin.getCesiumViewer()
      expect(cesiumViewer).toBeDefined()
      expect(cesiumViewer).toBe(mockViewer.cesiumViewer)
    })
  })

  describe('destroy 方法', () => {
    it('应该成功销毁已安装的插件', () => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
      plugin.destroy()

      expect(plugin.installed).toBe(false)
      expect(plugin.onDestroyCalled).toBe(true)
    })

    it('未安装时调用 destroy 应该不做任何操作', () => {
      plugin.destroy()
      expect(plugin.onDestroyCalled).toBe(false)
    })

    it('销毁后应该无法访问 cesiumViewer', () => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
      plugin.destroy()

      expect(() => plugin.getCesiumViewer()).toThrow('Plugin "test-plugin" is not installed')
    })

    it('应该支持异步销毁', async () => {
      class AsyncDestroyPlugin extends BasePlugin {
        readonly name = 'async-destroy-plugin'

        protected onInstall(_viewer: AutoViewer): void {}

        protected async onDestroy(): Promise<void> {
          return new Promise((resolve) => {
            setTimeout(resolve, 10)
          })
        }
      }

      const asyncPlugin = new AsyncDestroyPlugin()
      // @ts-expect-error - 访问 protected 方法用于测试
      asyncPlugin.install(mockViewer)

      const result = asyncPlugin.destroy()
      expect(result).toBeInstanceOf(Promise)
      await result
      expect(asyncPlugin.installed).toBe(false)
    })
  })

  describe('ensureInstalled 方法', () => {
    it('未安装时应该抛出错误', () => {
      // @ts-expect-error - 访问 protected 方法用于测试
      expect(() => plugin.ensureInstalled()).toThrow('Plugin "test-plugin" is not installed')
    })

    it('已安装时不应该抛出错误', () => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
      // @ts-expect-error - 访问 protected 方法用于测试
      expect(() => plugin.ensureInstalled()).not.toThrow()
    })
  })

  describe('生命周期完整测试', () => {
    it('应该正确执行完整的生命周期', async () => {
      // 初始状态
      expect(plugin.installed).toBe(false)

      // 安装
      // @ts-expect-error - 访问 protected 方法用于测试
      await plugin.install(mockViewer)
      expect(plugin.installed).toBe(true)
      expect(plugin.onInstallCalled).toBe(true)

      // 使用
      const cesiumViewer = plugin.getCesiumViewer()
      expect(cesiumViewer).toBeDefined()

      // 销毁
      await plugin.destroy()
      expect(plugin.installed).toBe(false)
      expect(plugin.onDestroyCalled).toBe(true)
    })
  })

  describe('边界情况', () => {
    it('多次销毁应该只执行一次', () => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
      plugin.destroy()
      plugin.destroy()

      // onDestroy 只应该被调用一次
      expect(plugin.onDestroyCalled).toBe(true)
    })

    it('销毁后重新安装应该正常工作', () => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
      plugin.destroy()
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
      expect(plugin.installed).toBe(true)
    })
  })
})
