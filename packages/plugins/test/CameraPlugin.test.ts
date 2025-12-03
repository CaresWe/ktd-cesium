import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CameraPlugin, ViewMode } from '../src/modules/CameraPlugin'
import type { AutoViewer } from '@auto-cesium/core'
import * as Cesium from 'cesium'

// Mock Camera
const createMockCamera = () => ({
  position: Cesium.Cartesian3.fromDegrees(116.4, 39.9, 10000),
  heading: 0,
  pitch: Cesium.Math.toRadians(-90),
  roll: 0,
  flyTo: vi.fn((options) => {
    if (options.complete) {
      setTimeout(options.complete, 0)
    }
  }),
  setView: vi.fn(),
  lookAt: vi.fn()
})

// Mock Cesium Viewer
const createMockCesiumViewer = (): Cesium.Viewer => {
  return {
    camera: createMockCamera() as unknown as Cesium.Camera,
    clock: {
      shouldAnimate: true,
      multiplier: 1,
      startTime: new Cesium.JulianDate(),
      stopTime: new Cesium.JulianDate(),
      currentTime: new Cesium.JulianDate(),
      onTick: {
        addEventListener: vi.fn((_callback) => {
          return () => {}
        }),
        removeEventListener: vi.fn()
      }
    },
    scene: {
      screenSpaceCameraController: {
        enableRotate: true,
        enableTranslate: true,
        enableZoom: true,
        enableTilt: true,
        enableLook: true
      },
      requestRender: vi.fn(),
      canvas: document.createElement('canvas'),
      preUpdate: {
        addEventListener: vi.fn((_callback) => {
          return () => {}
        }),
        removeEventListener: vi.fn()
      }
    },
    entities: {
      add: vi.fn((entity) => entity),
      remove: vi.fn(),
      removeAll: vi.fn()
    },
    container: {
      style: {}
    },
    zoomTo: vi.fn((_entity, _offset) => {
      return Promise.resolve(true)
    }),
    flyTo: vi.fn((_entity, _options) => {
      return Promise.resolve(true)
    }),
    canvas: document.createElement('canvas')
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

describe('CameraPlugin', () => {
  let plugin: CameraPlugin
  let mockViewer: AutoViewer

  beforeEach(() => {
    plugin = new CameraPlugin()
    mockViewer = createMockViewer()
  })

  describe('初始化', () => {
    it('应该正确设置插件名称', () => {
      expect(plugin.name).toBe('camera')
      expect(CameraPlugin.pluginName).toBe('camera')
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

    it('安装后应该初始化漫游管理器', () => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)

      expect(plugin.roaming).toBeDefined()
      expect(plugin.keyboardRoaming).toBeDefined()
      expect(plugin.indoorRoaming).toBeDefined()
    })
  })

  describe('flyTo 方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够飞行到指定位置', async () => {
      await plugin.flyTo({
        destination: [116.4, 39.9, 10000],
        duration: 3
      })

      expect(mockViewer.cesiumViewer.camera.flyTo).toHaveBeenCalled()
    })

    it('应该支持自定义视角参数', async () => {
      await plugin.flyTo({
        destination: [116.4, 39.9, 10000],
        duration: 2,
        heading: 45,
        pitch: -30,
        roll: 0
      })

      expect(mockViewer.cesiumViewer.camera.flyTo).toHaveBeenCalled()
      const callArgs = vi.mocked(mockViewer.cesiumViewer.camera.flyTo).mock.calls[0][0]
      expect(callArgs.duration).toBe(2)
    })

    it('应该支持完成回调', async () => {
      const completeSpy = vi.fn()

      await plugin.flyTo({
        destination: [116.4, 39.9, 10000],
        complete: completeSpy
      })

      expect(completeSpy).toHaveBeenCalled()
    })

    it('取消飞行应该 reject Promise', async () => {
      const mockCamera = mockViewer.cesiumViewer.camera as unknown as ReturnType<typeof createMockCamera>
      mockCamera.flyTo = vi.fn((options) => {
        if (options.cancel) {
          setTimeout(options.cancel, 0)
        }
      })

      await expect(
        plugin.flyTo({
          destination: [116.4, 39.9, 10000]
        })
      ).rejects.toThrow('Flight cancelled')
    })
  })

  describe('setView 方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够直接设置相机视角', () => {
      plugin.setView({
        destination: [116.4, 39.9, 10000]
      })

      expect(mockViewer.cesiumViewer.camera.setView).toHaveBeenCalled()
    })

    it('应该支持自定义视角参数', () => {
      plugin.setView({
        destination: [116.4, 39.9, 10000],
        heading: 45,
        pitch: -30,
        roll: 0
      })

      expect(mockViewer.cesiumViewer.camera.setView).toHaveBeenCalled()
    })
  })

  describe('lookAt 方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够环绕指定点查看', () => {
      plugin.lookAt({
        target: [116.4, 39.9, 0]
      })

      expect(mockViewer.cesiumViewer.camera.lookAt).toHaveBeenCalled()
    })

    it('应该支持自定义视角参数', () => {
      plugin.lookAt({
        target: [116.4, 39.9, 0],
        heading: 45,
        pitch: -30,
        range: 5000
      })

      expect(mockViewer.cesiumViewer.camera.lookAt).toHaveBeenCalled()
    })
  })

  describe('getCurrentPosition 方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够获取当前相机位置', () => {
      const position = plugin.getCurrentPosition()

      expect(position).toHaveProperty('longitude')
      expect(position).toHaveProperty('latitude')
      expect(position).toHaveProperty('height')
      expect(position).toHaveProperty('heading')
      expect(position).toHaveProperty('pitch')
      expect(position).toHaveProperty('roll')
    })

    it('返回的位置信息应该是正确的格式', () => {
      const position = plugin.getCurrentPosition()

      expect(typeof position.longitude).toBe('number')
      expect(typeof position.latitude).toBe('number')
      expect(typeof position.height).toBe('number')
      expect(typeof position.heading).toBe('number')
      expect(typeof position.pitch).toBe('number')
      expect(typeof position.roll).toBe('number')
    })
  })

  describe('zoomToEntity 方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够缩放到实体', () => {
      const mockEntity = new Cesium.Entity()

      plugin.zoomToEntity(mockEntity)

      expect(mockViewer.cesiumViewer.zoomTo).toHaveBeenCalledWith(mockEntity, undefined)
    })

    it('应该支持视角偏移', () => {
      const mockEntity = new Cesium.Entity()
      const offset = new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-45), 1000)

      plugin.zoomToEntity(mockEntity, offset)

      expect(mockViewer.cesiumViewer.zoomTo).toHaveBeenCalledWith(mockEntity, offset)
    })
  })

  describe('flyToEntity 方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够飞行到实体', async () => {
      const mockEntity = new Cesium.Entity()

      await plugin.flyToEntity(mockEntity)

      expect(mockViewer.cesiumViewer.flyTo).toHaveBeenCalled()
    })

    it('应该支持飞行选项', async () => {
      const mockEntity = new Cesium.Entity()
      const offset = new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-45), 1000)

      await plugin.flyToEntity(mockEntity, {
        duration: 2,
        offset
      })

      expect(mockViewer.cesiumViewer.flyTo).toHaveBeenCalled()
    })
  })

  describe('flyToRectangle 方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够飞行到矩形区域', async () => {
      await plugin.flyToRectangle([110, 30, 120, 40], 3)

      expect(mockViewer.cesiumViewer.camera.flyTo).toHaveBeenCalled()
    })

    it('应该使用默认时长', async () => {
      await plugin.flyToRectangle([110, 30, 120, 40])

      expect(mockViewer.cesiumViewer.camera.flyTo).toHaveBeenCalled()
    })
  })

  describe('相机漫游快捷方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够开始相机漫游', () => {
      const startSpy = vi.spyOn(plugin.roaming, 'startCameraRoaming')

      plugin.startCameraRoaming({
        waypoints: [
          [114.35, 30.54, 1000],
          [114.41, 30.51, 100]
        ],
        duration: 10
      })

      expect(startSpy).toHaveBeenCalled()
    })

    it('应该能够开始模型漫游', () => {
      const startSpy = vi.spyOn(plugin.roaming, 'startModelRoaming')

      plugin.startModelRoaming({
        waypoints: [
          [114.35, 30.54, 1000],
          [114.41, 30.51, 100]
        ],
        duration: 10
      })

      expect(startSpy).toHaveBeenCalled()
    })

    it('应该能够开始绕点飞行', () => {
      const startSpy = vi.spyOn(plugin.roaming, 'startCircleAroundPoint')

      plugin.startCircleAroundPoint({
        center: [120, 30, 0],
        radius: 500000,
        duration: 10
      })

      expect(startSpy).toHaveBeenCalled()
    })

    it('应该能够暂停或继续漫游', () => {
      const pauseSpy = vi.spyOn(plugin.roaming, 'pauseOrContinue')

      plugin.pauseOrContinueRoaming(false)

      expect(pauseSpy).toHaveBeenCalledWith(false)
    })

    it('应该能够改变漫游速度', () => {
      const speedSpy = vi.spyOn(plugin.roaming, 'changeSpeed')

      plugin.changeRoamingSpeed(2)

      expect(speedSpy).toHaveBeenCalledWith(2)
    })

    it('应该能够停止漫游', () => {
      const stopSpy = vi.spyOn(plugin.roaming, 'stopRoaming')

      plugin.stopRoaming()

      expect(stopSpy).toHaveBeenCalled()
    })

    it('应该能够切换漫游视角', () => {
      const changeViewSpy = vi.spyOn(plugin.roaming, 'changeView')

      plugin.changeRoamingView(ViewMode.FOLLOW)

      expect(changeViewSpy).toHaveBeenCalledWith(ViewMode.FOLLOW, undefined)
    })

    it('应该能够监听漫游数据更新', () => {
      const callback = vi.fn()
      const onDataUpdateSpy = vi.spyOn(plugin.roaming, 'onDataUpdate')

      plugin.onRoamingDataUpdate(callback)

      expect(onDataUpdateSpy).toHaveBeenCalledWith(callback)
    })

    it('应该能够获取漫游数据', () => {
      const getDataSpy = vi.spyOn(plugin.roaming, 'getRoamingData')

      plugin.getRoamingData()

      expect(getDataSpy).toHaveBeenCalled()
    })
  })

  describe('键盘漫游方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够启动键盘漫游', () => {
      const startSpy = vi.spyOn(plugin.keyboardRoaming, 'start')

      plugin.startKeyboardRoaming({
        moveSpeed: 10,
        rotateSpeed: 0.002
      })

      expect(startSpy).toHaveBeenCalled()
    })

    it('应该能够停止键盘漫游', () => {
      const stopSpy = vi.spyOn(plugin.keyboardRoaming, 'stop')

      plugin.stopKeyboardRoaming()

      expect(stopSpy).toHaveBeenCalled()
    })

    it('应该能够设置键盘漫游速度', () => {
      const setSpeedSpy = vi.spyOn(plugin.keyboardRoaming, 'setMoveSpeed')

      plugin.setKeyboardRoamingSpeed(20)

      expect(setSpeedSpy).toHaveBeenCalledWith(20)
    })

    it('应该能够获取键盘漫游速度', () => {
      const getSpeedSpy = vi.spyOn(plugin.keyboardRoaming, 'getMoveSpeed').mockReturnValue(10)

      const speed = plugin.getKeyboardRoamingSpeed()

      expect(getSpeedSpy).toHaveBeenCalled()
      expect(speed).toBe(10)
    })

    it('应该能够检查键盘漫游是否启用', () => {
      const isEnabledSpy = vi.spyOn(plugin.keyboardRoaming, 'isEnabled').mockReturnValue(false)

      const enabled = plugin.isKeyboardRoamingEnabled()

      expect(isEnabledSpy).toHaveBeenCalled()
      expect(enabled).toBe(false)
    })
  })

  describe('室内漫游方法', () => {
    beforeEach(() => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)
    })

    it('应该能够启动室内漫游', () => {
      const startSpy = vi.spyOn(plugin.indoorRoaming, 'start')

      plugin.startIndoorRoaming({
        waypoints: [
          [116.4, 39.9, 10],
          [116.41, 39.91, 10],
          [116.42, 39.92, 10]
        ],
        duration: 30
      })

      expect(startSpy).toHaveBeenCalled()
    })

    it('应该能够停止室内漫游', () => {
      const stopSpy = vi.spyOn(plugin.indoorRoaming, 'stop')

      plugin.stopIndoorRoaming()

      expect(stopSpy).toHaveBeenCalled()
    })

    it('应该能够暂停或继续室内漫游', () => {
      const pauseSpy = vi.spyOn(plugin.indoorRoaming, 'pauseOrContinue')

      plugin.pauseOrContinueIndoorRoaming(true)

      expect(pauseSpy).toHaveBeenCalledWith(true)
    })

    it('应该能够改变室内漫游速度', () => {
      const speedSpy = vi.spyOn(plugin.indoorRoaming, 'changeSpeed')

      plugin.changeIndoorRoamingSpeed(1.5)

      expect(speedSpy).toHaveBeenCalledWith(1.5)
    })

    it('应该能够监听室内漫游数据更新', () => {
      const callback = vi.fn()
      const onDataUpdateSpy = vi.spyOn(plugin.indoorRoaming, 'onDataUpdate')

      plugin.onIndoorRoamingDataUpdate(callback)

      expect(onDataUpdateSpy).toHaveBeenCalledWith(callback)
    })

    it('应该能够获取室内漫游数据', () => {
      const getDataSpy = vi.spyOn(plugin.indoorRoaming, 'getRoamingData')

      plugin.getIndoorRoamingData()

      expect(getDataSpy).toHaveBeenCalled()
    })
  })

  describe('销毁插件', () => {
    it('应该正确清理资源', () => {
      // @ts-expect-error - 测试目的需要访问 install 方法
      plugin.install(mockViewer)

      const roamingDestroySpy = vi.spyOn(plugin.roaming, 'destroy')
      const keyboardDestroySpy = vi.spyOn(plugin.keyboardRoaming, 'destroy')
      const indoorDestroySpy = vi.spyOn(plugin.indoorRoaming, 'destroy')

      plugin.destroy()

      expect(roamingDestroySpy).toHaveBeenCalled()
      expect(keyboardDestroySpy).toHaveBeenCalled()
      expect(indoorDestroySpy).toHaveBeenCalled()
      expect(plugin.installed).toBe(false)
    })

    it('未安装时销毁应该不报错', () => {
      expect(() => plugin.destroy()).not.toThrow()
    })
  })

  describe('未安装时的错误处理', () => {
    it('未安装时调用方法应该抛出错误', () => {
      expect(() =>
        plugin.flyTo({
          destination: [116.4, 39.9, 10000]
        })
      ).toThrow()
    })
  })
})
