import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ScenePlugin } from '../src/modules/ScenePlugin'
import { SceneEffectType } from '../src/modules/ScenePlugin'
import type { AutoViewer } from '@auto-cesium/core'
import * as Cesium from 'cesium'

// Mock Cesium
vi.mock('cesium', async () => {
  const actual = await vi.importActual<typeof Cesium>('cesium')
  return {
    ...actual,
    PostProcessStage: vi.fn(() => ({
      enabled: true,
      name: 'test-stage'
    })),
    BillboardCollection: vi.fn(() => ({
      add: vi.fn(),
      remove: vi.fn(),
      removeAll: vi.fn(),
      length: 0
    }))
  }
})

// Create mock Cesium Viewer
const createMockCesiumViewer = () => {
  const container = document.createElement('div')
  document.body.appendChild(container)

  const mockStages = {
    add: vi.fn((stage) => stage),
    remove: vi.fn(),
    removeAll: vi.fn()
  }

  const mockPrimitives = {
    add: vi.fn((primitive) => primitive),
    remove: vi.fn(),
    removeAll: vi.fn()
  }

  return {
    container,
    scene: {
      postProcessStages: mockStages,
      primitives: mockPrimitives,
      postRender: {
        addEventListener: vi.fn(),
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

describe('ScenePlugin', () => {
  let plugin: ScenePlugin
  let mockViewer: AutoViewer

  beforeEach(() => {
    plugin = new ScenePlugin()
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
      expect(plugin.name).toBe('scene')
      expect(ScenePlugin.pluginName).toBe('scene')
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

    it('应该支持自定义选项', () => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer, {})
      expect(plugin.installed).toBe(true)
    })
  })

  describe('添加雨效果', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够添加雨效果', () => {
      const rain = plugin.addRain()
      expect(rain).toBeDefined()
      expect(rain.name).toBe('rain-effect')
      expect(rain.type).toBe(SceneEffectType.RAIN)
    })

    it('应该能够使用自定义名称', () => {
      const rain = plugin.addRain({ name: 'custom-rain' })
      expect(rain.name).toBe('custom-rain')
    })

    it('应该能够设置混合系数', () => {
      const rain = plugin.addRain({ mixFactor: 0.5 })
      expect(rain).toBeDefined()
    })

    it('添加后应该能够获取效果', () => {
      const rain = plugin.addRain()
      const retrieved = plugin.getEffect(rain.name)
      expect(retrieved).toBe(rain)
    })
  })

  describe('添加雪效果', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够添加雪效果', () => {
      const snow = plugin.addSnow()
      expect(snow).toBeDefined()
      expect(snow.name).toBe('snow-effect')
      expect(snow.type).toBe(SceneEffectType.SNOW)
    })

    it('应该能够使用自定义名称', () => {
      const snow = plugin.addSnow({ name: 'custom-snow' })
      expect(snow.name).toBe('custom-snow')
    })

    it('添加后应该能够获取效果', () => {
      const snow = plugin.addSnow()
      const retrieved = plugin.getEffect(snow.name)
      expect(retrieved).toBe(snow)
    })
  })

  describe('添加雾效果', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够添加雾效果', () => {
      const fog = plugin.addFog()
      expect(fog).toBeDefined()
      expect(fog.name).toBe('fog-effect')
      expect(fog.type).toBe(SceneEffectType.FOG)
    })

    it('应该能够设置颜色', () => {
      const fog = plugin.addFog({ color: Cesium.Color.WHITE })
      expect(fog).toBeDefined()
    })

    it('应该能够使用字符串颜色', () => {
      const fog = plugin.addFog({ color: '#ffffff' })
      expect(fog).toBeDefined()
    })
  })

  describe('添加闪电效果', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够添加闪电效果', () => {
      const lightning = plugin.addLightning()
      expect(lightning).toBeDefined()
      expect(lightning.name).toBe('lightning-effect')
      expect(lightning.type).toBe(SceneEffectType.LIGHTNING)
    })

    it('应该能够设置下落间隔', () => {
      const lightning = plugin.addLightning({ fallInterval: 0.3 })
      expect(lightning).toBeDefined()
    })
  })

  describe('添加高度雾效果', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够添加高度雾效果', () => {
      const heightFog = plugin.addHeightFog()
      expect(heightFog).toBeDefined()
      expect(heightFog.name).toBe('height-fog-effect')
      expect(heightFog.type).toBe(SceneEffectType.HEIGHT_FOG)
    })

    it('应该能够设置雾高度', () => {
      const heightFog = plugin.addHeightFog({ fogHeight: 1000 })
      expect(heightFog).toBeDefined()
    })

    it('应该能够设置全局密度', () => {
      const heightFog = plugin.addHeightFog({ globalDensity: 0.6 })
      expect(heightFog).toBeDefined()
    })

    it('应该能够设置雾颜色', () => {
      const heightFog = plugin.addHeightFog({
        fogColor: [0.5, 0.5, 0.5]
      })
      expect(heightFog).toBeDefined()
    })
  })

  describe('添加局部下雨效果', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够添加局部下雨效果', () => {
      const localRain = plugin.addLocalRain()
      expect(localRain).toBeDefined()
      expect(localRain.name).toBe('local-rain-effect')
      expect(localRain.type).toBe(SceneEffectType.LOCAL_RAIN)
    })

    it('应该能够使用矩形边界', () => {
      const localRain = plugin.addLocalRain({
        minLongitude: -100,
        minLatitude: 30,
        maxLongitude: -99.5,
        maxLatitude: 30.5
      })
      expect(localRain).toBeDefined()
    })

    it('应该能够使用多边形位置', () => {
      const localRain = plugin.addLocalRain({
        positions: [
          [-100, 30],
          [-99.5, 30],
          [-99.5, 30.5],
          [-100, 30.5]
        ]
      })
      expect(localRain).toBeDefined()
    })

    it('应该能够设置雨滴参数', () => {
      const localRain = plugin.addLocalRain({
        dropCount: 5000,
        dropSpeed: 2.0,
        dropWidth: 2.0
      })
      expect(localRain).toBeDefined()
    })
  })

  describe('效果管理', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够根据名称获取效果', () => {
      const rain = plugin.addRain({ name: 'test-rain' })
      const retrieved = plugin.getEffect('test-rain')
      expect(retrieved).toBe(rain)
    })

    it('获取不存在的效果应该返回 undefined', () => {
      const retrieved = plugin.getEffect('non-existent')
      expect(retrieved).toBeUndefined()
    })

    it('应该能够根据类型获取效果', () => {
      plugin.addRain({ name: 'rain1' })
      plugin.addRain({ name: 'rain2' })
      plugin.addSnow()

      const rainEffects = plugin.getEffectsByType(SceneEffectType.RAIN)
      expect(rainEffects).toHaveLength(2)
    })

    it('应该能够获取所有效果', () => {
      plugin.addRain()
      plugin.addSnow()
      plugin.addFog()

      const allEffects = plugin.getAllEffects()
      expect(allEffects).toHaveLength(3)
    })

    it('空插件应该返回空数组', () => {
      const allEffects = plugin.getAllEffects()
      expect(allEffects).toHaveLength(0)
    })
  })

  describe('移除效果', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够移除单个效果', () => {
      const rain = plugin.addRain()
      const removeSpy = vi.spyOn(rain, 'remove')

      plugin.removeEffect(rain.name)

      expect(removeSpy).toHaveBeenCalled()
      expect(plugin.getEffect(rain.name)).toBeUndefined()
    })

    it('移除不存在的效果不应该报错', () => {
      expect(() => plugin.removeEffect('non-existent')).not.toThrow()
    })

    it('应该能够根据类型移除效果', () => {
      const rain1 = plugin.addRain({ name: 'rain1' })
      const rain2 = plugin.addRain({ name: 'rain2' })
      const snow = plugin.addSnow()

      const removeSpy1 = vi.spyOn(rain1, 'remove')
      const removeSpy2 = vi.spyOn(rain2, 'remove')
      const removeSpy3 = vi.spyOn(snow, 'remove')

      plugin.removeEffectsByType(SceneEffectType.RAIN)

      expect(removeSpy1).toHaveBeenCalled()
      expect(removeSpy2).toHaveBeenCalled()
      expect(removeSpy3).not.toHaveBeenCalled()
      expect(plugin.getEffect(rain1.name)).toBeUndefined()
      expect(plugin.getEffect(rain2.name)).toBeUndefined()
      expect(plugin.getEffect(snow.name)).toBe(snow)
    })

    it('应该能够移除所有效果', () => {
      const rain = plugin.addRain()
      const snow = plugin.addSnow()
      const fog = plugin.addFog()

      const removeSpy1 = vi.spyOn(rain, 'remove')
      const removeSpy2 = vi.spyOn(snow, 'remove')
      const removeSpy3 = vi.spyOn(fog, 'remove')

      plugin.removeAllEffects()

      expect(removeSpy1).toHaveBeenCalled()
      expect(removeSpy2).toHaveBeenCalled()
      expect(removeSpy3).toHaveBeenCalled()
      expect(plugin.getAllEffects()).toHaveLength(0)
    })
  })

  describe('显示和隐藏效果', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够显示效果', () => {
      const rain = plugin.addRain()
      const showSpy = vi.spyOn(rain, 'show')

      plugin.showEffect(rain.name)

      expect(showSpy).toHaveBeenCalled()
    })

    it('应该能够隐藏效果', () => {
      const rain = plugin.addRain()
      const hideSpy = vi.spyOn(rain, 'hide')

      plugin.hideEffect(rain.name)

      expect(hideSpy).toHaveBeenCalled()
    })

    it('显示不存在的效果不应该报错', () => {
      expect(() => plugin.showEffect('non-existent')).not.toThrow()
    })

    it('隐藏不存在的效果不应该报错', () => {
      expect(() => plugin.hideEffect('non-existent')).not.toThrow()
    })

    it('应该能够显示所有效果', () => {
      const rain = plugin.addRain()
      const snow = plugin.addSnow()

      const showSpy1 = vi.spyOn(rain, 'show')
      const showSpy2 = vi.spyOn(snow, 'show')

      plugin.showAllEffects()

      expect(showSpy1).toHaveBeenCalled()
      expect(showSpy2).toHaveBeenCalled()
    })

    it('应该能够隐藏所有效果', () => {
      const rain = plugin.addRain()
      const snow = plugin.addSnow()

      const hideSpy1 = vi.spyOn(rain, 'hide')
      const hideSpy2 = vi.spyOn(snow, 'hide')

      plugin.hideAllEffects()

      expect(hideSpy1).toHaveBeenCalled()
      expect(hideSpy2).toHaveBeenCalled()
    })
  })

  describe('效果可见性', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('新添加的效果应该默认可见', () => {
      const rain = plugin.addRain()
      expect(rain.visible).toBe(true)
    })

    it('隐藏后应该不可见', () => {
      const rain = plugin.addRain()
      rain.hide()
      expect(rain.visible).toBe(false)
    })

    it('显示后应该可见', () => {
      const rain = plugin.addRain()
      rain.hide()
      rain.show()
      expect(rain.visible).toBe(true)
    })
  })

  describe('效果移除', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('雨效果应该能够自己移除', () => {
      const rain = plugin.addRain()
      expect(() => rain.remove()).not.toThrow()
    })

    it('雪效果应该能够自己移除', () => {
      const snow = plugin.addSnow()
      expect(() => snow.remove()).not.toThrow()
    })

    it('雾效果应该能够自己移除', () => {
      const fog = plugin.addFog()
      expect(() => fog.remove()).not.toThrow()
    })

    it('闪电效果应该能够自己移除', () => {
      const lightning = plugin.addLightning()
      expect(() => lightning.remove()).not.toThrow()
    })

    it('高度雾效果应该能够自己移除', () => {
      const heightFog = plugin.addHeightFog()
      expect(() => heightFog.remove()).not.toThrow()
    })

    it('局部下雨效果应该能够自己移除', () => {
      const localRain = plugin.addLocalRain()
      expect(() => localRain.remove()).not.toThrow()
    })
  })

  describe('销毁插件', () => {
    it('应该正确清理资源', () => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
      plugin.addRain()
      plugin.addSnow()

      plugin.destroy()

      expect(plugin.installed).toBe(false)
      expect(plugin.getAllEffects()).toHaveLength(0)
    })

    it('销毁时应该移除所有效果', () => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)

      const rain = plugin.addRain()
      const snow = plugin.addSnow()

      const removeSpy1 = vi.spyOn(rain, 'remove')
      const removeSpy2 = vi.spyOn(snow, 'remove')

      plugin.destroy()

      expect(removeSpy1).toHaveBeenCalled()
      expect(removeSpy2).toHaveBeenCalled()
    })

    it('未安装时销毁应该不报错', () => {
      expect(() => plugin.destroy()).not.toThrow()
    })
  })

  describe('边界情况', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够添加多个相同类型的效果', () => {
      const rain1 = plugin.addRain({ name: 'rain1' })
      const rain2 = plugin.addRain({ name: 'rain2' })
      const rain3 = plugin.addRain({ name: 'rain3' })

      expect(plugin.getEffectsByType(SceneEffectType.RAIN)).toHaveLength(3)
      expect(rain1.name).not.toBe(rain2.name)
      expect(rain2.name).not.toBe(rain3.name)
    })

    it('应该能够添加所有类型的效果', () => {
      plugin.addRain()
      plugin.addSnow()
      plugin.addFog()
      plugin.addLightning()
      plugin.addHeightFog()
      plugin.addLocalRain()

      expect(plugin.getAllEffects()).toHaveLength(6)
    })

    it('空名称查询应该返回 undefined', () => {
      const effect = plugin.getEffect('')
      expect(effect).toBeUndefined()
    })
  })

  describe('PostProcessStage 集成', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('雨效果应该有 PostProcessStage', () => {
      const rain = plugin.addRain()
      expect(rain.stage).toBeDefined()
    })

    it('雪效果应该有 PostProcessStage', () => {
      const snow = plugin.addSnow()
      expect(snow.stage).toBeDefined()
    })

    it('雾效果应该有 PostProcessStage', () => {
      const fog = plugin.addFog()
      expect(fog.stage).toBeDefined()
    })

    it('闪电效果应该有 PostProcessStage', () => {
      const lightning = plugin.addLightning()
      expect(lightning.stage).toBeDefined()
    })

    it('高度雾效果应该有 PostProcessStage', () => {
      const heightFog = plugin.addHeightFog()
      expect(heightFog.stage).toBeDefined()
    })
  })

  describe('局部下雨特殊功能', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('局部下雨应该有 BillboardCollection', () => {
      const localRain = plugin.addLocalRain()
      expect(localRain.billboardCollection).toBeDefined()
    })

    it('局部下雨应该有更新位置方法', () => {
      const localRain = plugin.addLocalRain()
      // updatePositions 依赖于 Cesium.Ellipsoid 等完整环境
      // 我们只验证方法存在
      expect(typeof localRain.updatePositions).toBe('function')
    })
  })
})
