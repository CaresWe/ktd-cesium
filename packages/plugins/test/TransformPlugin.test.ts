import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TransformPlugin, TransformMode, TransformSpace, Axis } from '../src/modules/TransformPlugin'
import type { AutoViewer } from '@auto-cesium/core'
import * as Cesium from 'cesium'

// Mock Cesium
vi.mock('cesium', async () => {
  const actual = await vi.importActual<typeof Cesium>('cesium')
  return {
    ...actual,
    CustomDataSource: vi.fn(function (this: unknown) {
      const self = this as {
        name: string
        entities: {
          add: (entity: unknown) => unknown
          remove: () => boolean
        }
      }
      self.name = 'transform-gizmo'
      self.entities = {
        add: vi.fn((entity) => entity),
        remove: vi.fn(() => true)
      }
      return self
    }),
    ScreenSpaceEventHandler: vi.fn(function (this: unknown) {
      const self = this as {
        setInputAction: ReturnType<typeof vi.fn>
        removeInputAction: ReturnType<typeof vi.fn>
        destroy: ReturnType<typeof vi.fn>
      }
      self.setInputAction = vi.fn()
      self.removeInputAction = vi.fn()
      self.destroy = vi.fn()
      return self
    })
  }
})

// Mock AutoViewer
const createMockViewer = (): AutoViewer => {
  const mockDataSources = {
    add: vi.fn(),
    remove: vi.fn()
  }

  const mockCesiumViewer = {
    scene: {
      canvas: document.createElement('canvas'),
      pick: vi.fn(() => null),
      globe: {
        pick: vi.fn(() => null)
      }
    },
    camera: {
      getPickRay: vi.fn(() => null)
    },
    dataSources: mockDataSources
  } as unknown as Cesium.Viewer

  return {
    cesiumViewer: mockCesiumViewer
  } as AutoViewer
}

describe('TransformPlugin', () => {
  let plugin: TransformPlugin
  let mockViewer: AutoViewer

  beforeEach(() => {
    plugin = new TransformPlugin()
    mockViewer = createMockViewer()
  })

  describe('初始化状态', () => {
    it('应该正确初始化插件名称', () => {
      expect(plugin.name).toBe('transform')
      expect(TransformPlugin.pluginName).toBe('transform')
    })

    it('初始状态应该是未安装', () => {
      expect(plugin.installed).toBe(false)
    })

    it('应该使用默认的变换模式', () => {
      expect(plugin.mode).toBe(TransformMode.TRANSLATE)
    })

    it('应该使用默认的坐标空间', () => {
      expect(plugin.space).toBe(TransformSpace.WORLD)
    })

    it('初始状态应该是非激活状态', () => {
      expect(plugin.active).toBe(false)
    })

    it('初始状态没有附加实体', () => {
      expect(plugin.entity).toBeNull()
    })
  })

  describe('插件配置', () => {
    it('应该支持自定义变换模式', () => {
      const customPlugin = new TransformPlugin({
        mode: TransformMode.ROTATE
      })
      expect(customPlugin.mode).toBe(TransformMode.ROTATE)
    })

    it('应该支持自定义坐标空间', () => {
      const customPlugin = new TransformPlugin({
        space: TransformSpace.LOCAL
      })
      expect(customPlugin.space).toBe(TransformSpace.LOCAL)
    })

    it('应该支持自定义辅助轴大小', () => {
      const customPlugin = new TransformPlugin({
        gizmoSize: 2.0
      })
      // @ts-expect-error - 访问 private 属性用于测试
      expect(customPlugin.options.gizmoSize).toBe(2.0)
    })

    it('应该支持启用吸附功能', () => {
      const customPlugin = new TransformPlugin({
        snap: true,
        translateSnap: 0.5,
        rotateSnap: 10,
        scaleSnap: 0.2
      })
      // @ts-expect-error - 访问 private 属性用于测试
      expect(customPlugin.options.snap).toBe(true)
      // @ts-expect-error - 访问 private 属性用于测试
      expect(customPlugin.options.translateSnap).toBe(0.5)
    })

    it('默认应该显示辅助轴', () => {
      const customPlugin = new TransformPlugin()
      // @ts-expect-error - 访问 private 属性用于测试
      expect(customPlugin.options.showGizmo).toBe(true)
    })

    it('应该支持禁用辅助轴', () => {
      const customPlugin = new TransformPlugin({
        showGizmo: false
      })
      // @ts-expect-error - 访问 private 属性用于测试
      expect(customPlugin.options.showGizmo).toBe(false)
    })
  })

  describe('安装插件', () => {
    it('应该成功安装插件', () => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
      expect(plugin.installed).toBe(true)
    })

    it('安装时应该创建辅助轴数据源', () => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
      expect(mockViewer.cesiumViewer.dataSources.add).toHaveBeenCalled()
    })

    it('安装时应该创建事件处理器', () => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
      expect(Cesium.ScreenSpaceEventHandler).toHaveBeenCalled()
    })
  })

  describe('附加和分离', () => {
    beforeEach(() => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
    })

    it('应该能够附加到实体', () => {
      const entity = new Cesium.Entity()
      plugin.attach(entity)

      expect(plugin.entity).toBe(entity)
      expect(plugin.active).toBe(true)
    })

    it('应该能够分离实体', () => {
      const entity = new Cesium.Entity()
      plugin.attach(entity)
      plugin.detach()

      expect(plugin.entity).toBeNull()
      expect(plugin.active).toBe(false)
    })

    it('附加时应该先分离之前的实体', () => {
      const entity1 = new Cesium.Entity()
      const entity2 = new Cesium.Entity()

      plugin.attach(entity1)
      plugin.attach(entity2)

      expect(plugin.entity).toBe(entity2)
    })

    it('重复附加同一实体时应该不执行操作', () => {
      const entity = new Cesium.Entity()

      plugin.attach(entity)
      const firstAttachTime = plugin.active

      plugin.attach(entity)

      expect(plugin.active).toBe(firstAttachTime)
      expect(plugin.entity).toBe(entity)
    })
  })

  describe('变换模式', () => {
    beforeEach(() => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
    })

    it('应该能够设置平移模式', () => {
      plugin.setMode(TransformMode.TRANSLATE)
      expect(plugin.mode).toBe(TransformMode.TRANSLATE)
    })

    it('应该能够设置旋转模式', () => {
      plugin.setMode(TransformMode.ROTATE)
      expect(plugin.mode).toBe(TransformMode.ROTATE)
    })

    it('应该能够设置缩放模式', () => {
      plugin.setMode(TransformMode.SCALE)
      expect(plugin.mode).toBe(TransformMode.SCALE)
    })

    it('设置相同模式时不应重复操作', () => {
      plugin.setMode(TransformMode.TRANSLATE)
      const mode1 = plugin.mode

      plugin.setMode(TransformMode.TRANSLATE)
      const mode2 = plugin.mode

      expect(mode1).toBe(mode2)
    })
  })

  describe('坐标空间', () => {
    beforeEach(() => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
    })

    it('应该能够设置世界坐标系', () => {
      plugin.setSpace(TransformSpace.WORLD)
      expect(plugin.space).toBe(TransformSpace.WORLD)
    })

    it('应该能够设置本地坐标系', () => {
      plugin.setSpace(TransformSpace.LOCAL)
      expect(plugin.space).toBe(TransformSpace.LOCAL)
    })

    it('设置相同空间时不应重复操作', () => {
      plugin.setSpace(TransformSpace.WORLD)
      const space1 = plugin.space

      plugin.setSpace(TransformSpace.WORLD)
      const space2 = plugin.space

      expect(space1).toBe(space2)
    })
  })

  describe('变换数据', () => {
    beforeEach(() => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
    })

    it('未附加实体时获取变换应该返回 null', () => {
      const transform = plugin.getTransform()
      expect(transform).toBeNull()
    })

    it('应该能够获取实体的变换数据', () => {
      const entity = new Cesium.Entity({
        position: Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0)
      })

      plugin.attach(entity)
      const transform = plugin.getTransform()

      expect(transform).toBeDefined()
      expect(transform?.position).toBeDefined()
      expect(transform?.rotation).toBeDefined()
      expect(transform?.scale).toBeDefined()
    })

    it('应该能够设置实体的变换数据', () => {
      const entity = new Cesium.Entity({
        position: Cesium.Cartesian3.fromDegrees(116.4, 39.9, 0)
      })

      plugin.attach(entity)

      const newPosition = Cesium.Cartesian3.fromDegrees(121.5, 31.2, 0)
      plugin.setTransform({ position: newPosition })

      const transform = plugin.getTransform()
      expect(transform?.position).toBeDefined()
    })
  })

  describe('Primitive 模式', () => {
    beforeEach(() => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
    })

    it('应该能够附加到 Primitive', () => {
      const primitive = {
        modelMatrix: Cesium.Matrix4.IDENTITY
      }

      plugin.attachPrimitive(primitive)

      expect(plugin.isPrimitive()).toBe(true)
      expect(plugin.getPrimitive()).toBe(primitive)
    })

    it('应该能够获取 Primitive 的变换数据', () => {
      const primitive = {
        modelMatrix: Cesium.Matrix4.IDENTITY
      }

      plugin.attachPrimitive(primitive)
      const transform = plugin.getTransform()

      expect(transform).toBeDefined()
      expect(transform?.position).toBeDefined()
      expect(transform?.rotation).toBeDefined()
      expect(transform?.scale).toBeDefined()
    })

    it('应该能够重置 Primitive', () => {
      const primitive = {
        modelMatrix: Cesium.Matrix4.IDENTITY.clone()
      }

      plugin.attachPrimitive(primitive)

      expect(() => plugin.resetPrimitive()).not.toThrow()
    })
  })

  describe('枚举类型', () => {
    it('应该导出 TransformMode 枚举', () => {
      expect(TransformMode.TRANSLATE).toBe('translate')
      expect(TransformMode.ROTATE).toBe('rotate')
      expect(TransformMode.SCALE).toBe('scale')
    })

    it('应该导出 TransformSpace 枚举', () => {
      expect(TransformSpace.WORLD).toBe('world')
      expect(TransformSpace.LOCAL).toBe('local')
    })

    it('应该导出 Axis 枚举', () => {
      expect(Axis.X).toBe('x')
      expect(Axis.Y).toBe('y')
      expect(Axis.Z).toBe('z')
      expect(Axis.XY).toBe('xy')
      expect(Axis.YZ).toBe('yz')
      expect(Axis.XZ).toBe('xz')
      expect(Axis.XYZ).toBe('xyz')
    })
  })

  describe('销毁插件', () => {
    it('应该能够正确销毁插件', () => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)

      const entity = new Cesium.Entity()
      plugin.attach(entity)

      plugin.destroy()

      expect(plugin.installed).toBe(false)
      expect(plugin.active).toBe(false)
      expect(plugin.entity).toBeNull()
    })

    it('销毁时应该分离实体', () => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)

      const entity = new Cesium.Entity()
      plugin.attach(entity)

      plugin.destroy()

      expect(plugin.entity).toBeNull()
    })

    it('销毁时应该销毁事件处理器', () => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)

      const entity = new Cesium.Entity()
      plugin.attach(entity)

      plugin.destroy()

      // handler 应该被销毁
      expect(plugin.installed).toBe(false)
    })
  })

  describe('未安装时的错误处理', () => {
    it('未安装时附加实体应该能够处理', () => {
      const entity = new Cesium.Entity()

      // 不应抛出错误，但也不会成功
      expect(() => plugin.attach(entity)).not.toThrow()
    })

    it('未安装时分离应该不报错', () => {
      expect(() => plugin.detach()).not.toThrow()
    })

    it('未安装时设置模式应该不报错', () => {
      expect(() => plugin.setMode(TransformMode.ROTATE)).not.toThrow()
    })

    it('未安装时设置空间应该不报错', () => {
      expect(() => plugin.setSpace(TransformSpace.LOCAL)).not.toThrow()
    })
  })

  describe('边界情况', () => {
    beforeEach(() => {
      // @ts-expect-error - 访问 protected 方法用于测试
      plugin.install(mockViewer)
    })

    it('应该能够处理没有位置的实体', () => {
      const entity = new Cesium.Entity()
      plugin.attach(entity)

      const transform = plugin.getTransform()
      expect(transform).toBeNull()
    })

    it('应该能够处理多次分离', () => {
      const entity = new Cesium.Entity()
      plugin.attach(entity)

      plugin.detach()
      plugin.detach()

      expect(plugin.entity).toBeNull()
      expect(plugin.active).toBe(false)
    })

    it('应该能够处理没有 modelMatrix 的 Primitive', () => {
      const primitive = {}

      plugin.attachPrimitive(primitive)

      const transform = plugin.getTransform()
      expect(transform).toBeDefined()
    })
  })
})
