import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EventPlugin, EventEmitter } from '../src/modules/EventPlugin'
import type { AutoViewer } from '@auto-cesium/core'
import * as Cesium from 'cesium'

// Mock ScreenSpaceEventHandler
class MockScreenSpaceEventHandler {
  private actions: Map<number, (movement: unknown) => void> = new Map()

  setInputAction = vi.fn((action: (movement: unknown) => void, type: number) => {
    this.actions.set(type, action)
  })

  removeInputAction = vi.fn((type: number) => {
    this.actions.delete(type)
  })

  destroy = vi.fn(() => {
    this.actions.clear()
  })

  // Test helper to trigger an action
  triggerAction(type: number, movement: unknown) {
    const action = this.actions.get(type)
    if (action) {
      action(movement)
    }
  }
}

// Mock Cesium classes
vi.mock('cesium', async () => {
  const actual = await vi.importActual<typeof Cesium>('cesium')
  return {
    ...actual,
    ScreenSpaceEventHandler: vi.fn().mockImplementation(() => new MockScreenSpaceEventHandler()),
    defined: vi.fn((value) => value !== undefined && value !== null)
  }
})

// Create mock Cesium Viewer
const createMockCesiumViewer = () => {
  const mockCanvas = document.createElement('canvas')

  return {
    canvas: mockCanvas,
    scene: {
      pick: vi.fn(() => ({ id: 'picked-object', primitive: {} })),
      globe: {
        pick: vi.fn((ray) => {
          if (ray) {
            return new Cesium.Cartesian3(1000, 2000, 3000)
          }
          return undefined
        })
      },
      preUpdate: {
        addEventListener: vi.fn((callback) => () => callback()),
        removeEventListener: vi.fn()
      },
      postUpdate: {
        addEventListener: vi.fn((callback) => () => callback()),
        removeEventListener: vi.fn()
      },
      preRender: {
        addEventListener: vi.fn((callback) => () => callback()),
        removeEventListener: vi.fn()
      },
      postRender: {
        addEventListener: vi.fn((callback) => () => callback()),
        removeEventListener: vi.fn()
      },
      morphComplete: {
        addEventListener: vi.fn((callback) => () => callback()),
        removeEventListener: vi.fn()
      },
      renderError: {
        addEventListener: vi.fn((callback) => () => callback()),
        removeEventListener: vi.fn()
      }
    },
    camera: {
      getPickRay: vi.fn((position) => {
        if (position) {
          return { origin: new Cesium.Cartesian3(0, 0, 0), direction: new Cesium.Cartesian3(1, 0, 0) }
        }
        return undefined
      }),
      moveStart: {
        addEventListener: vi.fn((callback) => () => callback()),
        removeEventListener: vi.fn()
      },
      moveEnd: {
        addEventListener: vi.fn((callback) => () => callback()),
        removeEventListener: vi.fn()
      },
      changed: {
        addEventListener: vi.fn((callback) => () => callback()),
        removeEventListener: vi.fn()
      }
    },
    imageryLayers: {
      layerAdded: {
        addEventListener: vi.fn((callback) => () => callback()),
        removeEventListener: vi.fn()
      },
      layerRemoved: {
        addEventListener: vi.fn((callback) => () => callback()),
        removeEventListener: vi.fn()
      },
      layerMoved: {
        addEventListener: vi.fn((callback) => () => callback()),
        removeEventListener: vi.fn()
      },
      layerShownOrHidden: {
        addEventListener: vi.fn((callback) => () => callback()),
        removeEventListener: vi.fn()
      }
    }
  } as unknown as Cesium.Viewer
}

// Create mock AutoViewer
const createMockViewer = (): AutoViewer => {
  const mockCesiumViewer = createMockCesiumViewer()

  return {
    cesiumViewer: mockCesiumViewer,
    getPlugin: vi.fn(() => null)
  } as unknown as AutoViewer
}

describe('EventPlugin', () => {
  let plugin: EventPlugin
  let mockViewer: AutoViewer

  beforeEach(() => {
    plugin = new EventPlugin()
    mockViewer = createMockViewer()
  })

  describe('初始化', () => {
    it('应该正确设置插件名称', () => {
      expect(plugin.name).toBe('event')
      expect(EventPlugin.pluginName).toBe('event')
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

    it('安装时应该创建 ScreenSpaceEventHandler', () => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
      expect(Cesium.ScreenSpaceEventHandler).toHaveBeenCalledWith(mockViewer.cesiumViewer.canvas)
    })
  })

  describe('setConfig 方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够设置事件配置', () => {
      plugin.setConfig({
        enablePicking: false,
        enableCartesian: false,
        enableCoordinates: false
      })

      expect(plugin).toBeDefined()
    })

    it('应该能够部分更新配置', () => {
      plugin.setConfig({ enablePicking: false })
      plugin.setConfig({ enableCartesian: false })

      expect(plugin).toBeDefined()
    })
  })

  describe('鼠标事件', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够监听左键单击事件', () => {
      const callback = vi.fn()
      const id = plugin.onLeftClick(callback)

      expect(id).toMatch(/^leftClick_\d+$/)
      expect(callback).not.toHaveBeenCalled()
    })

    it('应该能够监听左键双击事件', () => {
      const callback = vi.fn()
      const id = plugin.onLeftDoubleClick(callback)

      expect(id).toMatch(/^leftDoubleClick_\d+$/)
    })

    it('应该能够监听左键按下事件', () => {
      const callback = vi.fn()
      const id = plugin.onLeftDown(callback)

      expect(id).toMatch(/^leftDown_\d+$/)
    })

    it('应该能够监听左键抬起事件', () => {
      const callback = vi.fn()
      const id = plugin.onLeftUp(callback)

      expect(id).toMatch(/^leftUp_\d+$/)
    })

    it('应该能够监听右键单击事件', () => {
      const callback = vi.fn()
      const id = plugin.onRightClick(callback)

      expect(id).toMatch(/^rightClick_\d+$/)
    })

    it('应该能够监听右键按下事件', () => {
      const callback = vi.fn()
      const id = plugin.onRightDown(callback)

      expect(id).toMatch(/^rightDown_\d+$/)
    })

    it('应该能够监听右键抬起事件', () => {
      const callback = vi.fn()
      const id = plugin.onRightUp(callback)

      expect(id).toMatch(/^rightUp_\d+$/)
    })

    it('应该能够监听中键单击事件', () => {
      const callback = vi.fn()
      const id = plugin.onMiddleClick(callback)

      expect(id).toMatch(/^middleClick_\d+$/)
    })

    it('应该能够监听中键按下事件', () => {
      const callback = vi.fn()
      const id = plugin.onMiddleDown(callback)

      expect(id).toMatch(/^middleDown_\d+$/)
    })

    it('应该能够监听中键抬起事件', () => {
      const callback = vi.fn()
      const id = plugin.onMiddleUp(callback)

      expect(id).toMatch(/^middleUp_\d+$/)
    })

    it('应该能够监听鼠标移动事件', () => {
      const callback = vi.fn()
      const id = plugin.onMouseMove(callback)

      expect(id).toMatch(/^mouseMove_\d+$/)
    })

    it('应该能够监听鼠标滚轮事件', () => {
      const callback = vi.fn()
      const id = plugin.onWheel(callback)

      expect(id).toMatch(/^wheel_\d+$/)
    })
  })

  describe('触摸事件', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够监听触摸开始事件', () => {
      const callback = vi.fn()
      const id = plugin.onTouchStart(callback)

      expect(id).toMatch(/^touchStart_\d+$/)
    })

    it('应该能够监听触摸结束事件', () => {
      const callback = vi.fn()
      const id = plugin.onTouchEnd(callback)

      expect(id).toMatch(/^touchEnd_\d+$/)
    })

    it('应该能够监听触摸移动事件', () => {
      const callback = vi.fn()
      const id = plugin.onTouchMove(callback)

      expect(id).toMatch(/^touchMove_\d+$/)
    })
  })

  describe('相机事件', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够监听相机移动开始事件', () => {
      const callback = vi.fn()
      const id = plugin.onCameraMoveStart(callback)

      expect(id).toMatch(/^cameraMoveStart_\d+$/)
      expect(mockViewer.cesiumViewer.camera.moveStart.addEventListener).toHaveBeenCalled()
    })

    it('应该能够监听相机移动结束事件', () => {
      const callback = vi.fn()
      const id = plugin.onCameraMoveEnd(callback)

      expect(id).toMatch(/^cameraMoveEnd_\d+$/)
      expect(mockViewer.cesiumViewer.camera.moveEnd.addEventListener).toHaveBeenCalled()
    })

    it('应该能够监听相机变化事件', () => {
      const callback = vi.fn()
      const id = plugin.onCameraChanged(callback)

      expect(id).toMatch(/^cameraChanged_\d+$/)
      expect(mockViewer.cesiumViewer.camera.changed.addEventListener).toHaveBeenCalled()
    })
  })

  describe('键盘事件', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够监听键盘按下事件', () => {
      const callback = vi.fn()
      const id = plugin.onKeyDown(callback)

      expect(id).toMatch(/^keyDown_\d+$/)
    })

    it('应该能够监听键盘抬起事件', () => {
      const callback = vi.fn()
      const id = plugin.onKeyUp(callback)

      expect(id).toMatch(/^keyUp_\d+$/)
    })

    it('应该能够监听键盘按压事件', () => {
      const callback = vi.fn()
      const id = plugin.onKeyPress(callback)

      expect(id).toMatch(/^keyPress_\d+$/)
    })

    it('键盘事件回调应该接收键盘信息', () => {
      const callback = vi.fn()
      plugin.onKeyDown(callback)

      // 模拟键盘事件
      const event = new KeyboardEvent('keydown', {
        key: 'a',
        code: 'KeyA',
        ctrlKey: true,
        shiftKey: false,
        altKey: false,
        metaKey: false
      })

      document.dispatchEvent(event)

      expect(callback).toHaveBeenCalledWith({
        key: 'a',
        code: 'KeyA',
        ctrlKey: true,
        shiftKey: false,
        altKey: false,
        metaKey: false
      })
    })
  })

  describe('场景事件', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够监听场景更新前事件', () => {
      const callback = vi.fn()
      const id = plugin.onPreUpdate(callback)

      expect(id).toMatch(/^preUpdate_\d+$/)
      expect(mockViewer.cesiumViewer.scene.preUpdate.addEventListener).toHaveBeenCalled()
    })

    it('应该能够监听场景更新后事件', () => {
      const callback = vi.fn()
      const id = plugin.onPostUpdate(callback)

      expect(id).toMatch(/^postUpdate_\d+$/)
      expect(mockViewer.cesiumViewer.scene.postUpdate.addEventListener).toHaveBeenCalled()
    })

    it('应该能够监听场景渲染前事件', () => {
      const callback = vi.fn()
      const id = plugin.onPreRender(callback)

      expect(id).toMatch(/^preRender_\d+$/)
      expect(mockViewer.cesiumViewer.scene.preRender.addEventListener).toHaveBeenCalled()
    })

    it('应该能够监听场景渲染后事件', () => {
      const callback = vi.fn()
      const id = plugin.onPostRender(callback)

      expect(id).toMatch(/^postRender_\d+$/)
      expect(mockViewer.cesiumViewer.scene.postRender.addEventListener).toHaveBeenCalled()
    })

    it('应该能够监听场景模式变换完成事件', () => {
      const callback = vi.fn()
      const id = plugin.onMorphComplete(callback)

      expect(id).toMatch(/^morphComplete_\d+$/)
      expect(mockViewer.cesiumViewer.scene.morphComplete.addEventListener).toHaveBeenCalled()
    })

    it('应该能够监听渲染错误事件', () => {
      const callback = vi.fn()
      const id = plugin.onRenderError(callback)

      expect(id).toMatch(/^renderError_\d+$/)
      expect(mockViewer.cesiumViewer.scene.renderError.addEventListener).toHaveBeenCalled()
    })
  })

  describe('图层事件', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够监听图层添加事件', () => {
      const callback = vi.fn()
      const id = plugin.onLayerAdded(callback)

      expect(id).toMatch(/^layerAdded_\d+$/)
      expect(mockViewer.cesiumViewer.imageryLayers.layerAdded.addEventListener).toHaveBeenCalled()
    })

    it('应该能够监听图层移除事件', () => {
      const callback = vi.fn()
      const id = plugin.onLayerRemoved(callback)

      expect(id).toMatch(/^layerRemoved_\d+$/)
      expect(mockViewer.cesiumViewer.imageryLayers.layerRemoved.addEventListener).toHaveBeenCalled()
    })

    it('应该能够监听图层移动事件', () => {
      const callback = vi.fn()
      const id = plugin.onLayerMoved(callback)

      expect(id).toMatch(/^layerMoved_\d+$/)
      expect(mockViewer.cesiumViewer.imageryLayers.layerMoved.addEventListener).toHaveBeenCalled()
    })

    it('应该能够监听图层显示事件', () => {
      const callback = vi.fn()
      const id = plugin.onLayerShown(callback)

      expect(id).toMatch(/^layerShown_\d+$/)
      expect(mockViewer.cesiumViewer.imageryLayers.layerShownOrHidden.addEventListener).toHaveBeenCalled()
    })
  })

  describe('事件管理', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够移除指定ID的事件监听', () => {
      const callback = vi.fn()
      const id = plugin.onLeftClick(callback)

      const result = plugin.off(id)

      expect(result).toBe(true)
    })

    it('移除不存在的事件监听应该返回 false', () => {
      const result = plugin.off('non-existent-id')

      expect(result).toBe(false)
    })

    it('应该能够移除指定类型的所有事件监听', () => {
      plugin.onLeftClick(vi.fn())
      plugin.onLeftClick(vi.fn())
      plugin.onRightClick(vi.fn())

      const count = plugin.offType('leftClick')

      expect(count).toBe(2)
    })

    it('应该能够移除所有事件监听', () => {
      plugin.onLeftClick(vi.fn())
      plugin.onRightClick(vi.fn())
      plugin.onMouseMove(vi.fn())

      plugin.offAll()

      expect(plugin.getListeners()).toHaveLength(0)
    })

    it('应该能够获取所有事件监听器', () => {
      plugin.onLeftClick(vi.fn())
      plugin.onRightClick(vi.fn())

      const listeners = plugin.getListeners()

      expect(listeners).toHaveLength(2)
    })

    it('应该能够获取指定类型的事件监听器', () => {
      plugin.onLeftClick(vi.fn())
      plugin.onLeftClick(vi.fn())
      plugin.onRightClick(vi.fn())

      const listeners = plugin.getListenersByType('leftClick')

      expect(listeners).toHaveLength(2)
      expect(listeners.every((l) => l.type === 'leftClick')).toBe(true)
    })
  })

  describe('销毁插件', () => {
    it('应该正确清理资源', () => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)

      plugin.onLeftClick(vi.fn())
      plugin.onRightClick(vi.fn())

      plugin.destroy()

      expect(plugin.installed).toBe(false)
      expect(plugin.getListeners()).toHaveLength(0)
    })

    it('未安装时销毁应该不报错', () => {
      expect(() => plugin.destroy()).not.toThrow()
    })
  })

  describe('未安装时的错误处理', () => {
    it('未安装时调用方法应该抛出错误', () => {
      expect(() => plugin.onLeftClick(vi.fn())).toThrow()
    })
  })
})

describe('EventEmitter', () => {
  let emitter: EventEmitter

  beforeEach(() => {
    emitter = new EventEmitter()
  })

  describe('基本事件监听', () => {
    it('应该能够添加事件监听器', () => {
      const callback = vi.fn()
      emitter.on('test', callback)

      expect(emitter.listens('test')).toBe(true)
    })

    it('应该能够触发事件', () => {
      const callback = vi.fn()
      emitter.on('test', callback)
      emitter.fire('test', { data: 'test-data' })

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'test',
          data: 'test-data',
          target: emitter
        })
      )
    })

    it('应该能够移除事件监听器', () => {
      const callback = vi.fn()
      emitter.on('test', callback)
      emitter.off('test', callback)

      emitter.fire('test')

      expect(callback).not.toHaveBeenCalled()
    })

    it('应该能够添加多个监听器', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      emitter.on('test', callback1)
      emitter.on('test', callback2)
      emitter.fire('test')

      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)
    })
  })

  describe('空格分隔的事件类型', () => {
    it('应该支持空格分隔的多个事件类型', () => {
      const callback = vi.fn()
      emitter.on('event1 event2 event3', callback)

      emitter.fire('event1')
      emitter.fire('event2')
      emitter.fire('event3')

      expect(callback).toHaveBeenCalledTimes(3)
    })

    it('应该能够移除空格分隔的事件类型', () => {
      const callback = vi.fn()
      emitter.on('event1 event2', callback)
      emitter.off('event1 event2', callback)

      emitter.fire('event1')
      emitter.fire('event2')

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('对象形式的事件监听', () => {
    it('应该支持对象形式添加多个事件', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      emitter.on({
        event1: callback1,
        event2: callback2
      })

      emitter.fire('event1')
      emitter.fire('event2')

      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)
    })

    it('应该支持对象形式移除多个事件', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      emitter.on({
        event1: callback1,
        event2: callback2
      })

      emitter.off({
        event1: callback1,
        event2: callback2
      })

      emitter.fire('event1')
      emitter.fire('event2')

      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).not.toHaveBeenCalled()
    })
  })

  describe('一次性事件监听', () => {
    it('应该支持一次性事件监听', () => {
      const callback = vi.fn()
      emitter.once('test', callback)

      emitter.fire('test')
      emitter.fire('test')

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('应该支持对象形式的一次性事件监听', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      emitter.once({
        event1: callback1,
        event2: callback2
      })

      emitter.fire('event1')
      emitter.fire('event1')
      emitter.fire('event2')
      emitter.fire('event2')

      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)
    })
  })

  describe('上下文绑定', () => {
    it('应该支持指定回调上下文', () => {
      const context = { name: 'test-context' }
      const callback = vi.fn(function (this: typeof context) {
        expect(this.name).toBe('test-context')
      })

      emitter.on('test', callback, context)
      emitter.fire('test')

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('应该能够根据上下文移除监听器', () => {
      const context1 = { name: 'context1' }
      const context2 = { name: 'context2' }
      const callback = vi.fn()

      emitter.on('test', callback, context1)
      emitter.on('test', callback, context2)
      emitter.off('test', callback, context1)

      emitter.fire('test')

      expect(callback).toHaveBeenCalledTimes(1)
    })
  })

  describe('事件传播', () => {
    it('应该支持事件传播到父级', () => {
      const parent = new EventEmitter()
      const child = new EventEmitter()
      const callback = vi.fn()

      child.addEventParent(parent)
      parent.on('test', callback)

      child.fire('test', {}, true)

      expect(callback).toHaveBeenCalled()
    })

    it('应该能够移除事件父级', () => {
      const parent = new EventEmitter()
      const child = new EventEmitter()
      const callback = vi.fn()

      child.addEventParent(parent)
      child.removeEventParent(parent)
      parent.on('test', callback)

      child.fire('test', {}, true)

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('listens 方法', () => {
    it('应该正确检查是否有监听器', () => {
      expect(emitter.listens('test')).toBe(false)

      emitter.on('test', vi.fn())

      expect(emitter.listens('test')).toBe(true)
    })

    it('应该支持检查父级的监听器', () => {
      const parent = new EventEmitter()
      const child = new EventEmitter()

      parent.on('test', vi.fn())
      child.addEventParent(parent)

      expect(child.listens('test', true)).toBe(true)
    })
  })

  describe('清除所有监听器', () => {
    it('应该能够清除所有监听器', () => {
      emitter.on('event1', vi.fn())
      emitter.on('event2', vi.fn())
      emitter.on('event3', vi.fn())

      emitter.off()

      expect(emitter.listens('event1')).toBe(false)
      expect(emitter.listens('event2')).toBe(false)
      expect(emitter.listens('event3')).toBe(false)
    })

    it('应该能够清除指定类型的所有监听器', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      emitter.on('test', callback1)
      emitter.on('test', callback2)
      emitter.off('test')

      emitter.fire('test')

      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).not.toHaveBeenCalled()
    })
  })

  describe('防止重复添加', () => {
    it('应该防止添加相同的监听器', () => {
      const callback = vi.fn()

      emitter.on('test', callback)
      emitter.on('test', callback)

      emitter.fire('test')

      expect(callback).toHaveBeenCalledTimes(1)
    })
  })

  describe('别名方法', () => {
    it('addEventListener 应该是 on 的别名', () => {
      expect(emitter.addEventListener).toBe(emitter.on)
    })

    it('removeEventListener 应该是 off 的别名', () => {
      expect(emitter.removeEventListener).toBe(emitter.off)
    })

    it('clearAllEventListeners 应该是 off 的别名', () => {
      expect(emitter.clearAllEventListeners).toBe(emitter.off)
    })

    it('addOneTimeEventListener 应该是 once 的别名', () => {
      expect(emitter.addOneTimeEventListener).toBe(emitter.once)
    })

    it('fireEvent 应该是 fire 的别名', () => {
      expect(emitter.fireEvent).toBe(emitter.fire)
    })

    it('hasEventListeners 应该是 listens 的别名', () => {
      expect(emitter.hasEventListeners).toBe(emitter.listens)
    })
  })
})
