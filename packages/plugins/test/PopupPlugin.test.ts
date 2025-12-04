import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { PopupPlugin } from '../src/modules/PopupPlugin'
import { PopupAlignment } from '../src/modules/PopupPlugin/types'
import type { AutoViewer } from '@auto-cesium/core'
import * as Cesium from 'cesium'

// Mock Vue (optional dependency)
vi.mock('vue', () => ({
  createApp: vi.fn(() => ({
    mount: vi.fn(),
    unmount: vi.fn()
  })),
  h: vi.fn()
}))

// Mock React (optional dependency)
vi.mock('react', () => ({
  createElement: vi.fn()
}))

// Mock React DOM (optional dependency)
vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn(),
    unmount: vi.fn()
  }))
}))

// Mock Cesium classes
vi.mock('cesium', async () => {
  const actual = await vi.importActual<typeof Cesium>('cesium')
  return {
    ...actual,
    Cartesian3: {
      ...actual.Cartesian3,
      fromDegrees: vi.fn((lon: number, lat: number, height = 0) => {
        return { x: lon * 1000, y: lat * 1000, z: height, lon, lat, height }
      })
    },
    SceneTransforms: {
      worldToWindowCoordinates: vi.fn((_scene, cartesian) => {
        if (cartesian && cartesian.lon !== undefined) {
          // 模拟转换：简单的映射
          return new actual.Cartesian2(cartesian.lon * 10, cartesian.lat * 10)
        }
        return undefined
      })
    }
  }
})

// Create mock Cesium Viewer
const createMockCesiumViewer = () => {
  const container = document.createElement('div')
  document.body.appendChild(container)

  return {
    container,
    scene: {
      postRender: {
        addEventListener: vi.fn((callback) => {
          return () => callback()
        }),
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

describe('PopupPlugin', () => {
  let plugin: PopupPlugin
  let mockViewer: AutoViewer

  beforeEach(() => {
    plugin = new PopupPlugin()
    mockViewer = createMockViewer()
  })

  afterEach(() => {
    // 清理 DOM
    if (plugin.installed) {
      plugin.destroy()
    }
    document.body.innerHTML = ''
  })

  describe('初始化', () => {
    it('应该正确设置插件名称', () => {
      expect(plugin.name).toBe('popup')
      expect(PopupPlugin.pluginName).toBe('popup')
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

    it('安装时应该创建弹窗容器元素', () => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)

      const container = mockViewer.cesiumViewer.container.querySelector('div')
      expect(container).toBeTruthy()
      expect(container?.style.position).toBe('absolute')
      expect(container?.style.zIndex).toBe('1000')
    })

    it('安装时应该监听场景渲染事件', () => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)

      expect(mockViewer.cesiumViewer.scene.postRender.addEventListener).toHaveBeenCalled()
    })
  })

  describe('创建HTML弹窗', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够创建字符串内容的HTML弹窗（屏幕坐标）', async () => {
      const id = await plugin.createHTML('<div>Test Popup</div>', [100, 200])

      expect(id).toMatch(/^popup_\d+$/)

      const popup = plugin.get(id)
      expect(popup).toBeDefined()
      expect(popup?.container.innerHTML).toBe('<div>Test Popup</div>')
    })

    it('应该能够创建DOM元素内容的HTML弹窗', async () => {
      const element = document.createElement('div')
      element.textContent = 'Test Element'

      const id = await plugin.createHTML(element, [100, 200])

      const popup = plugin.get(id)
      expect(popup?.container.contains(element)).toBe(true)
    })

    it('应该能够创建世界坐标的HTML弹窗', async () => {
      const id = await plugin.createHTML('<div>World Popup</div>', [116.4, 39.9, 0])

      expect(id).toMatch(/^popup_\d+$/)

      const popup = plugin.get(id)
      expect(popup).toBeDefined()
    })

    it('应该能够设置弹窗选项', async () => {
      const id = await plugin.createHTML('<div>Test</div>', [100, 200], {
        alignment: PopupAlignment.TOP_CENTER,
        className: 'custom-popup',
        offset: [10, 20]
      })

      const popup = plugin.get(id)
      expect(popup?.container.className).toBe('custom-popup')
    })
  })

  describe('弹窗对齐方式', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该支持 top-left 对齐', async () => {
      const id = await plugin.createHTML('<div>Test</div>', [100, 200], {
        alignment: PopupAlignment.TOP_LEFT
      })

      const popup = plugin.get(id)
      expect(popup?.container.style.cssText).toContain('transform-origin: top left')
    })

    it('应该支持 top-center 对齐', async () => {
      const id = await plugin.createHTML('<div>Test</div>', [100, 200], {
        alignment: PopupAlignment.TOP_CENTER
      })

      const popup = plugin.get(id)
      expect(popup?.container.style.cssText).toContain('top center')
    })

    it('应该支持 center 对齐', async () => {
      const id = await plugin.createHTML('<div>Test</div>', [100, 200], {
        alignment: PopupAlignment.CENTER
      })

      const popup = plugin.get(id)
      expect(popup?.container.style.cssText).toContain('center')
    })

    it('应该支持 bottom-right 对齐', async () => {
      const id = await plugin.createHTML('<div>Test</div>', [100, 200], {
        alignment: PopupAlignment.BOTTOM_RIGHT
      })

      const popup = plugin.get(id)
      expect(popup?.container.style.cssText).toContain('bottom right')
    })
  })

  describe('弹窗位置', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该正确设置屏幕坐标位置', async () => {
      const id = await plugin.createHTML('<div>Test</div>', [100, 200])

      const popup = plugin.get(id)
      expect(popup?.container.style.left).toBe('100px')
      expect(popup?.container.style.top).toBe('200px')
    })

    it('应该支持位置偏移', async () => {
      const id = await plugin.createHTML('<div>Test</div>', [100, 200], {
        offset: [10, 20]
      })

      const popup = plugin.get(id)
      expect(popup?.container.style.left).toBe('110px')
      expect(popup?.container.style.top).toBe('220px')
    })

    it('应该能够更新弹窗位置', async () => {
      const id = await plugin.createHTML('<div>Test</div>', [100, 200])

      plugin.updatePosition(id, [300, 400])

      const popup = plugin.get(id)
      expect(popup?.container.style.left).toBe('300px')
      expect(popup?.container.style.top).toBe('400px')
    })
  })

  describe('弹窗显示和隐藏', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够隐藏弹窗', async () => {
      const id = await plugin.createHTML('<div>Test</div>', [100, 200])

      plugin.hide(id)

      const popup = plugin.get(id)
      expect(popup?.container.style.display).toBe('none')
    })

    it('应该能够显示弹窗', async () => {
      const id = await plugin.createHTML('<div>Test</div>', [100, 200], { show: false })

      plugin.show(id)

      const popup = plugin.get(id)
      expect(popup?.container.style.display).toBe('block')
    })

    it('应该能够通过实例方法显示和隐藏', async () => {
      const id = await plugin.createHTML('<div>Test</div>', [100, 200])
      const popup = plugin.get(id)

      popup?.hide()
      expect(popup?.container.style.display).toBe('none')

      popup?.show()
      expect(popup?.container.style.display).toBe('block')
    })

    it('创建时应该支持初始隐藏状态', async () => {
      const id = await plugin.createHTML('<div>Test</div>', [100, 200], { show: false })

      const popup = plugin.get(id)
      expect(popup?.container.style.display).toBe('none')
    })
  })

  describe('更新弹窗内容', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够更新HTML内容', async () => {
      const id = await plugin.createHTML('<div>Original</div>', [100, 200])

      await plugin.updateContent(id, '<div>Updated</div>')

      const popup = plugin.get(id)
      expect(popup?.container.innerHTML).toBe('<div>Updated</div>')
    })

    it('应该能够通过实例方法更新内容', async () => {
      const id = await plugin.createHTML('<div>Original</div>', [100, 200])
      const popup = plugin.get(id)

      await popup?.updateContent('<div>Updated via instance</div>')

      expect(popup?.container.innerHTML).toBe('<div>Updated via instance</div>')
    })
  })

  describe('弹窗管理', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够获取弹窗实例', async () => {
      const id = await plugin.createHTML('<div>Test</div>', [100, 200])

      const popup = plugin.get(id)

      expect(popup).toBeDefined()
      expect(popup?.id).toBe(id)
    })

    it('获取不存在的弹窗应该返回 undefined', () => {
      const popup = plugin.get('non-existent')

      expect(popup).toBeUndefined()
    })

    it('应该能够移除弹窗', async () => {
      const id = await plugin.createHTML('<div>Test</div>', [100, 200])

      const result = plugin.remove(id)

      expect(result).toBe(true)
      expect(plugin.get(id)).toBeUndefined()
    })

    it('移除不存在的弹窗应该返回 false', () => {
      const result = plugin.remove('non-existent')

      expect(result).toBe(false)
    })

    it('应该能够通过实例方法销毁弹窗', async () => {
      const id = await plugin.createHTML('<div>Test</div>', [100, 200])
      const popup = plugin.get(id)

      popup?.destroy()

      expect(plugin.get(id)).toBeUndefined()
    })

    it('应该能够获取所有弹窗ID', async () => {
      const id1 = await plugin.createHTML('<div>Test 1</div>', [100, 200])
      const id2 = await plugin.createHTML('<div>Test 2</div>', [200, 300])

      const ids = plugin.getAllIds()

      expect(ids).toHaveLength(2)
      expect(ids).toContain(id1)
      expect(ids).toContain(id2)
    })

    it('应该能够获取弹窗数量', async () => {
      await plugin.createHTML('<div>Test 1</div>', [100, 200])
      await plugin.createHTML('<div>Test 2</div>', [200, 300])

      expect(plugin.getCount()).toBe(2)
    })

    it('应该能够移除所有弹窗', async () => {
      await plugin.createHTML('<div>Test 1</div>', [100, 200])
      await plugin.createHTML('<div>Test 2</div>', [200, 300])
      await plugin.createHTML('<div>Test 3</div>', [300, 400])

      plugin.removeAll()

      expect(plugin.getCount()).toBe(0)
    })
  })

  describe('关闭回调', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('移除弹窗时应该调用 onClose 回调', async () => {
      const onClose = vi.fn()
      const id = await plugin.createHTML('<div>Test</div>', [100, 200], {
        onClose
      })

      plugin.remove(id)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('通过实例销毁时也应该调用 onClose 回调', async () => {
      const onClose = vi.fn()
      const id = await plugin.createHTML('<div>Test</div>', [100, 200], {
        onClose
      })

      const popup = plugin.get(id)
      popup?.destroy()

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('拖拽功能', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够创建可拖拽的弹窗', async () => {
      const id = await plugin.createHTML('<div>Draggable</div>', [100, 200], {
        draggable: true
      })

      const popup = plugin.get(id)
      expect(popup).toBeDefined()
    })

    it('可拖拽弹窗应该响应鼠标事件', async () => {
      const id = await plugin.createHTML('<div>Draggable</div>', [100, 200], {
        draggable: true
      })

      const popup = plugin.get(id)
      const container = popup?.container

      // 模拟鼠标按下事件
      const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 200,
        bubbles: true
      })

      container?.dispatchEvent(mouseDownEvent)

      expect(popup).toBeDefined()
    })
  })

  describe('点击外部关闭', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够创建点击外部关闭的弹窗', async () => {
      const id = await plugin.createHTML('<div>Click Outside</div>', [100, 200], {
        closeOnClickOutside: true
      })

      const popup = plugin.get(id)
      expect(popup).toBeDefined()
    })
  })

  describe('世界坐标弹窗', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够创建世界坐标弹窗', async () => {
      const id = await plugin.createHTML('<div>World Popup</div>', [116.4, 39.9, 0])

      const popup = plugin.get(id)
      expect(popup).toBeDefined()
    })

    it('世界坐标应该转换为屏幕坐标', async () => {
      const id = await plugin.createHTML('<div>World Popup</div>', [116.4, 39.9, 0])

      const popup = plugin.get(id)
      // SceneTransforms.worldToWindowCoordinates 被 mock 为返回 lon*10, lat*10
      expect(popup?.container.style.left).toBe('1164px')
      expect(popup?.container.style.top).toBe('399px')
    })

    it('应该能够使用 Cartesian3 创建世界坐标弹窗', async () => {
      const cartesian = Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0)
      const id = await plugin.createHTML('<div>Cartesian Popup</div>', cartesian)

      const popup = plugin.get(id)
      expect(popup).toBeDefined()
    })
  })

  describe('Vue 组件弹窗', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够创建 Vue 组件弹窗', async () => {
      const vueConfig = {
        component: { template: '<div>Vue Component</div>' },
        props: { title: 'Test' }
      }

      const id = await plugin.createVue(vueConfig, [100, 200])

      expect(id).toMatch(/^popup_\d+$/)
      const popup = plugin.get(id)
      expect(popup?.vueApp).toBeDefined()
    })

    it('应该能够在世界坐标创建 Vue 组件弹窗', async () => {
      const vueConfig = {
        component: { template: '<div>Vue Component</div>' }
      }

      const id = await plugin.createVue(vueConfig, [116.4, 39.9, 0])

      expect(id).toMatch(/^popup_\d+$/)
    })
  })

  describe('React 组件弹窗', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够创建 React 组件弹窗', async () => {
      const reactConfig = {
        component: () => null,
        props: { title: 'Test' }
      }

      const id = await plugin.createReact(reactConfig, [100, 200])

      expect(id).toMatch(/^popup_\d+$/)
      const popup = plugin.get(id)
      expect(popup?.reactRoot).toBeDefined()
    })

    it('应该能够在世界坐标创建 React 组件弹窗', async () => {
      const reactConfig = {
        component: () => null
      }

      const id = await plugin.createReact(reactConfig, [116.4, 39.9, 0])

      expect(id).toMatch(/^popup_\d+$/)
    })
  })

  describe('销毁插件', () => {
    it('应该正确清理资源', async () => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)

      await plugin.createHTML('<div>Test 1</div>', [100, 200])
      await plugin.createHTML('<div>Test 2</div>', [200, 300])

      plugin.destroy()

      expect(plugin.installed).toBe(false)
      expect(plugin.getCount()).toBe(0)
    })

    it('销毁时应该移除容器元素', () => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)

      const containerBefore = mockViewer.cesiumViewer.container.querySelector('div')
      expect(containerBefore).toBeTruthy()

      plugin.destroy()

      const containerAfter = mockViewer.cesiumViewer.container.querySelector('div')
      expect(containerAfter).toBeFalsy()
    })

    it('销毁时应该移除渲染监听器', () => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)

      plugin.destroy()

      expect(plugin.installed).toBe(false)
    })

    it('未安装时销毁应该不报错', () => {
      expect(() => plugin.destroy()).not.toThrow()
    })
  })

  describe('未安装时的错误处理', () => {
    it('未安装时创建弹窗应该抛出错误', async () => {
      await expect(plugin.createHTML('<div>Test</div>', [100, 200])).rejects.toThrow()
    })
  })

  describe('边界情况', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够创建空内容的弹窗', async () => {
      const id = await plugin.createHTML('', [100, 200])

      const popup = plugin.get(id)
      expect(popup?.container.innerHTML).toBe('')
    })

    it('应该能够在零坐标位置创建弹窗', async () => {
      const id = await plugin.createHTML('<div>Zero</div>', [0, 0])

      const popup = plugin.get(id)
      expect(popup?.container.style.left).toBe('0px')
      expect(popup?.container.style.top).toBe('0px')
    })

    it('更新不存在的弹窗位置不应该报错', () => {
      expect(() => plugin.updatePosition('non-existent', [100, 200])).not.toThrow()
    })

    it('更新不存在的弹窗内容不应该报错', async () => {
      await expect(plugin.updateContent('non-existent', '<div>New</div>')).resolves.toBeUndefined()
    })

    it('显示不存在的弹窗不应该报错', () => {
      expect(() => plugin.show('non-existent')).not.toThrow()
    })

    it('隐藏不存在的弹窗不应该报错', () => {
      expect(() => plugin.hide('non-existent')).not.toThrow()
    })
  })

  describe('多个弹窗', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够同时管理多个弹窗', async () => {
      const ids = await Promise.all([
        plugin.createHTML('<div>Popup 1</div>', [100, 100]),
        plugin.createHTML('<div>Popup 2</div>', [200, 200]),
        plugin.createHTML('<div>Popup 3</div>', [300, 300])
      ])

      expect(plugin.getCount()).toBe(3)
      ids.forEach((id) => {
        expect(plugin.get(id)).toBeDefined()
      })
    })

    it('应该为每个弹窗生成唯一ID', async () => {
      const id1 = await plugin.createHTML('<div>1</div>', [100, 100])
      const id2 = await plugin.createHTML('<div>2</div>', [200, 200])
      const id3 = await plugin.createHTML('<div>3</div>', [300, 300])

      expect(id1).not.toBe(id2)
      expect(id2).not.toBe(id3)
      expect(id1).not.toBe(id3)
    })

    it('移除一个弹窗不应该影响其他弹窗', async () => {
      const id1 = await plugin.createHTML('<div>1</div>', [100, 100])
      const id2 = await plugin.createHTML('<div>2</div>', [200, 200])
      const id3 = await plugin.createHTML('<div>3</div>', [300, 300])

      plugin.remove(id2)

      expect(plugin.getCount()).toBe(2)
      expect(plugin.get(id1)).toBeDefined()
      expect(plugin.get(id2)).toBeUndefined()
      expect(plugin.get(id3)).toBeDefined()
    })
  })
})
