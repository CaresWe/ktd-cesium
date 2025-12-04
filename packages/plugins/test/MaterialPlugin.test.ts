import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LineFlowMaterial, CircleWaveMaterial } from '../src/modules/MaterialPlugin'
import type { LineFlowMaterialOptions, CircleWaveMaterialOptions } from '../src/modules/MaterialPlugin'
import * as Cesium from 'cesium'

// Mock shader imports
vi.mock('../src/modules/MaterialPlugin/shaders/LineFlow.glsl?raw', () => ({
  default: 'mock-lineflow-shader'
}))

vi.mock('../src/modules/MaterialPlugin/shaders/LineFlow2.glsl?raw', () => ({
  default: 'mock-lineflow2-shader'
}))

vi.mock('../src/modules/MaterialPlugin/shaders/CircleWave.glsl?raw', () => ({
  default: 'mock-circlewave-shader'
}))

// Mock Cesium Material
vi.mock('cesium', async () => {
  const actual = await vi.importActual<typeof Cesium>('cesium')
  return {
    ...actual,
    Material: {
      ...actual.Material,
      ColorType: 'Color',
      _materialCache: {
        addMaterial: vi.fn()
      }
    } as unknown as typeof Cesium.Material
  }
})

describe('MaterialPlugin', () => {
  describe('LineFlowMaterial', () => {
    let material: LineFlowMaterial

    beforeEach(() => {
      vi.clearAllMocks()
    })

    describe('初始化', () => {
      it('应该能够使用默认选项创建', () => {
        material = new LineFlowMaterial()
        expect(material).toBeDefined()
      })

      it('应该能够使用自定义选项创建', () => {
        const options: LineFlowMaterialOptions = {
          color: new Cesium.Color(1, 0, 0, 1),
          url: 'test-image.png',
          duration: 2000,
          axisY: true
        }
        material = new LineFlowMaterial(options)
        expect(material).toBeDefined()
        expect(material.url).toBe('test-image.png')
        expect(material.axisY).toBe(true)
      })

      it('没有 url 时应该标记为无效', () => {
        material = new LineFlowMaterial({})
        expect(material.url).toBeUndefined()
      })

      it('应该能够设置背景色', () => {
        const bgColor = new Cesium.Color(0, 1, 0, 0.5)
        material = new LineFlowMaterial({
          url: 'test.png',
          bgColor
        })
        expect(material.bgColor).toBeDefined()
      })

      it('应该能够设置背景图片', () => {
        material = new LineFlowMaterial({
          url: 'test.png',
          bgUrl: 'bg.png'
        })
        expect(material.bgUrl).toBe('bg.png')
      })
    })

    describe('属性', () => {
      beforeEach(() => {
        material = new LineFlowMaterial({
          url: 'test.png',
          color: new Cesium.Color(1, 0, 0, 1)
        })
      })

      it('isConstant 应该返回 false', () => {
        expect(material.isConstant).toBe(false)
      })

      it('definitionChanged 应该是 Event 对象', () => {
        expect(material.definitionChanged).toBeDefined()
        expect(typeof material.definitionChanged.addEventListener).toBe('function')
      })

      it('应该能够获取和设置 color', () => {
        const newColor = new Cesium.Color(0, 1, 0, 1)
        material.color = newColor
        expect(material.color).toBe(newColor)
      })

      it('设置相同的 color 不应该触发变化', () => {
        const color = new Cesium.Color(1, 0, 0, 1)
        material.color = color
        const spy = vi.fn()
        material.definitionChanged.addEventListener(spy)
        material.color = color
        expect(spy).not.toHaveBeenCalled()
      })
    })

    describe('getType 方法', () => {
      it('无效材质应该返回 ColorType', () => {
        material = new LineFlowMaterial({})
        const time = Cesium.JulianDate.now()
        expect(material.getType(time)).toBe(Cesium.Material.ColorType)
      })

      it('有效材质应该返回正确的类型', () => {
        material = new LineFlowMaterial({ url: 'test.png' })
        const time = Cesium.JulianDate.now()
        const type = material.getType(time)
        expect(type).toContain('AnimationLine')
        expect(type).toContain('Type')
      })
    })

    describe('getValue 方法', () => {
      beforeEach(() => {
        material = new LineFlowMaterial({
          url: 'test.png',
          color: new Cesium.Color(1, 0, 0, 1)
        })
      })

      it('应该返回包含 color 的对象', () => {
        const time = Cesium.JulianDate.now()
        const value = material.getValue(time)
        expect(value.color).toBeDefined()
      })

      it('应该返回包含 image 的对象', () => {
        const time = Cesium.JulianDate.now()
        const value = material.getValue(time)
        expect(value.image).toBe('test.png')
      })

      it('应该返回包含 time 的对象', () => {
        const time = Cesium.JulianDate.now()
        const value = material.getValue(time)
        expect(typeof value.time).toBe('number')
        expect(value.time).toBeGreaterThanOrEqual(0)
      })

      it('应该能够使用提供的 result 对象', () => {
        const time = Cesium.JulianDate.now()
        const result = {}
        const returnValue = material.getValue(time, result)
        expect(returnValue).toBe(result)
      })

      it('无效材质应该只返回 color', () => {
        const invalidMaterial = new LineFlowMaterial({})
        const time = Cesium.JulianDate.now()
        const value = invalidMaterial.getValue(time)
        expect(value.color).toBeDefined()
        expect(value.image).toBeUndefined()
      })
    })

    describe('equals 方法', () => {
      beforeEach(() => {
        material = new LineFlowMaterial({
          url: 'test.png',
          color: new Cesium.Color(1, 0, 0, 1)
        })
      })

      it('与自身比较应该返回 true', () => {
        expect(material.equals(material)).toBe(true)
      })

      it('与 undefined 比较应该返回 false', () => {
        expect(material.equals(undefined)).toBe(false)
      })

      it('与其他类型比较应该返回 false', () => {
        // @ts-expect-error - Testing invalid input
        expect(material.equals({})).toBe(false)
      })

      it('与不同 color 的材质比较应该返回 false', () => {
        const other = new LineFlowMaterial({
          url: 'test.png',
          color: new Cesium.Color(0, 1, 0, 1)
        })
        expect(material.equals(other)).toBe(false)
      })
    })

    describe('时间处理', () => {
      it('time 应该随时间增长', async () => {
        material = new LineFlowMaterial({
          url: 'test.png',
          duration: 1000
        })

        const time = Cesium.JulianDate.now()
        const value1 = material.getValue(time)
        const time1 = value1.time as number

        // 等待一小段时间
        await new Promise((resolve) => setTimeout(resolve, 100))

        const value2 = material.getValue(time)
        const time2 = value2.time as number

        expect(time2).toBeGreaterThan(time1)
      })
    })
  })

  describe('CircleWaveMaterial', () => {
    let material: CircleWaveMaterial

    beforeEach(() => {
      vi.clearAllMocks()
    })

    describe('初始化', () => {
      it('应该能够使用默认选项创建', () => {
        material = new CircleWaveMaterial()
        expect(material).toBeDefined()
      })

      it('应该能够使用自定义选项创建', () => {
        const options: CircleWaveMaterialOptions = {
          color: new Cesium.Color(1, 0, 0, 1),
          duration: 2000,
          count: 3,
          gradient: 0.5
        }
        material = new CircleWaveMaterial(options)
        expect(material).toBeDefined()
      })

      it('count 小于等于 0 时应该设置为 1', () => {
        material = new CircleWaveMaterial({ count: 0 })
        const value = material.getValue(Cesium.JulianDate.now())
        expect(value.count).toBe(1)
      })

      it('gradient 小于 0 时应该设置为 0', () => {
        material = new CircleWaveMaterial({ gradient: -1 })
        const value = material.getValue(Cesium.JulianDate.now())
        // gradient 被转换为 1 + 10 * (1 - gradient)
        expect(value.gradient).toBe(11)
      })

      it('gradient 大于 1 时应该设置为 1', () => {
        material = new CircleWaveMaterial({ gradient: 2 })
        const value = material.getValue(Cesium.JulianDate.now())
        // gradient = 1, 所以结果是 1 + 10 * (1 - 1) = 1
        expect(value.gradient).toBe(1)
      })
    })

    describe('属性', () => {
      beforeEach(() => {
        material = new CircleWaveMaterial({
          color: new Cesium.Color(1, 0, 0, 1)
        })
      })

      it('isConstant 应该返回 false', () => {
        expect(material.isConstant).toBe(false)
      })

      it('definitionChanged 应该是 Event 对象', () => {
        expect(material.definitionChanged).toBeDefined()
        expect(typeof material.definitionChanged.addEventListener).toBe('function')
      })

      it('应该能够获取和设置 color', () => {
        const newColor = new Cesium.Color(0, 1, 0, 1)
        material.color = newColor
        expect(material.color).toBe(newColor)
      })

      it('设置相同的 color 不应该触发变化', () => {
        const color = new Cesium.Color(1, 0, 0, 1)
        material.color = color
        const spy = vi.fn()
        material.definitionChanged.addEventListener(spy)
        material.color = color
        expect(spy).not.toHaveBeenCalled()
      })
    })

    describe('getType 方法', () => {
      it('应该返回 CircleWaveMaterial', () => {
        material = new CircleWaveMaterial()
        const time = Cesium.JulianDate.now()
        expect(material.getType(time)).toBe('CircleWaveMaterial')
      })
    })

    describe('getValue 方法', () => {
      beforeEach(() => {
        material = new CircleWaveMaterial({
          color: new Cesium.Color(1, 0, 0, 1),
          count: 3,
          gradient: 0.5
        })
      })

      it('应该返回包含 color 的对象', () => {
        const time = Cesium.JulianDate.now()
        const value = material.getValue(time)
        expect(value.color).toBeDefined()
      })

      it('应该返回包含 time 的对象', () => {
        const time = Cesium.JulianDate.now()
        const value = material.getValue(time)
        expect(typeof value.time).toBe('number')
        expect(value.time).toBeGreaterThanOrEqual(0)
      })

      it('应该返回包含 count 的对象', () => {
        const time = Cesium.JulianDate.now()
        const value = material.getValue(time)
        expect(value.count).toBe(3)
      })

      it('应该返回包含 gradient 的对象', () => {
        const time = Cesium.JulianDate.now()
        const value = material.getValue(time)
        expect(typeof value.gradient).toBe('number')
        expect(value.gradient).toBeGreaterThan(0)
      })

      it('应该能够使用提供的 result 对象', () => {
        const time = Cesium.JulianDate.now()
        const result = {}
        const returnValue = material.getValue(time, result)
        expect(returnValue).toBe(result)
      })
    })

    describe('equals 方法', () => {
      beforeEach(() => {
        material = new CircleWaveMaterial({
          color: new Cesium.Color(1, 0, 0, 1)
        })
      })

      it('与自身比较应该返回 true', () => {
        expect(material.equals(material)).toBe(true)
      })

      it('与 undefined 比较应该返回 false', () => {
        expect(material.equals(undefined)).toBe(false)
      })

      it('与其他类型比较应该返回 false', () => {
        // @ts-expect-error - Testing invalid input
        expect(material.equals({})).toBe(false)
      })

      it('与不同 color 的材质比较应该返回 false', () => {
        const other = new CircleWaveMaterial({
          color: new Cesium.Color(0, 1, 0, 1)
        })
        expect(material.equals(other)).toBe(false)
      })
    })

    describe('时间处理', () => {
      it('time 应该随时间增长', async () => {
        material = new CircleWaveMaterial({
          duration: 1000
        })

        const time = Cesium.JulianDate.now()
        const value1 = material.getValue(time)
        const time1 = value1.time as number

        // 等待一小段时间
        await new Promise((resolve) => setTimeout(resolve, 100))

        const value2 = material.getValue(time)
        const time2 = value2.time as number

        expect(time2).toBeGreaterThan(time1)
      })
    })

    describe('color 订阅', () => {
      it('应该能够订阅 color 的变化', () => {
        const colorProperty = new Cesium.ConstantProperty(new Cesium.Color(1, 0, 0, 1))
        material = new CircleWaveMaterial()

        const spy = vi.fn()
        material.definitionChanged.addEventListener(spy)

        material.color = colorProperty

        expect(spy).toHaveBeenCalled()
      })

      it('更新 color 时应该清理旧的订阅', () => {
        const color1 = new Cesium.ConstantProperty(new Cesium.Color(1, 0, 0, 1))
        const color2 = new Cesium.ConstantProperty(new Cesium.Color(0, 1, 0, 1))

        material = new CircleWaveMaterial()
        material.color = color1
        material.color = color2

        // 不应该抛出错误
        expect(material.color).toBe(color2)
      })
    })
  })

  describe('边界情况', () => {
    it('LineFlowMaterial 应该能够处理 Property 对象的 color', () => {
      const colorProperty = new Cesium.ConstantProperty(new Cesium.Color(1, 0, 0, 1))
      const material = new LineFlowMaterial({
        url: 'test.png',
        color: colorProperty as unknown as Cesium.Color
      })

      const time = Cesium.JulianDate.now()
      const value = material.getValue(time)
      expect(value.color).toBeDefined()
    })

    it('CircleWaveMaterial 应该能够处理 Property 对象的 color', () => {
      const colorProperty = new Cesium.ConstantProperty(new Cesium.Color(1, 0, 0, 1))
      const material = new CircleWaveMaterial({
        color: colorProperty as unknown as Cesium.Color
      })

      const time = Cesium.JulianDate.now()
      const value = material.getValue(time)
      expect(value.color).toBeDefined()
    })

    it('应该能够处理没有 color 的情况', () => {
      const material = new LineFlowMaterial({ url: 'test.png' })
      material.color = undefined as unknown as Cesium.Color

      const time = Cesium.JulianDate.now()
      const value = material.getValue(time)
      expect(value.color).toBeDefined()
    })
  })

  describe('equals 方法 - Property 比较', () => {
    it('LineFlowMaterial 应该能够比较 Property 对象', () => {
      const color1 = new Cesium.ConstantProperty(new Cesium.Color(1, 0, 0, 1))
      const material1 = new LineFlowMaterial({
        url: 'test.png',
        color: color1 as unknown as Cesium.Color
      })

      const material2 = new LineFlowMaterial({
        url: 'test.png',
        color: color1 as unknown as Cesium.Color
      })

      expect(material1.equals(material2)).toBe(true)
    })

    it('CircleWaveMaterial 应该能够比较 Property 对象', () => {
      const color1 = new Cesium.ConstantProperty(new Cesium.Color(1, 0, 0, 1))
      const material1 = new CircleWaveMaterial({
        color: color1 as unknown as Cesium.Color
      })

      const material2 = new CircleWaveMaterial({
        color: color1 as unknown as Cesium.Color
      })

      expect(material1.equals(material2)).toBe(true)
    })
  })

  describe('duration 配置', () => {
    it('LineFlowMaterial 应该使用自定义 duration', () => {
      const material = new LineFlowMaterial({
        url: 'test.png',
        duration: 5000
      })

      expect(material).toBeDefined()
    })

    it('CircleWaveMaterial 应该使用自定义 duration', () => {
      const material = new CircleWaveMaterial({
        duration: 3000
      })

      expect(material).toBeDefined()
    })
  })

  describe('repeat 配置', () => {
    it('LineFlowMaterial 应该支持 repeat 参数', () => {
      const material = new LineFlowMaterial({
        url: 'test.png',
        repeat: new Cesium.Cartesian2(2, 2)
      })

      expect(material).toBeDefined()
    })
  })
})
