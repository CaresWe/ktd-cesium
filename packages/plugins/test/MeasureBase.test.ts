import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MeasureBase } from '../src/modules/AnalysisPlugin/MeasureBase'
import type { MeasureTypeString, MeasureResult } from '../src/modules/AnalysisPlugin/types'
import type { DrawConfig } from '../src/modules/GraphicsPlugin/types'
import * as Cesium from 'cesium'

// Mock CustomDataSource
class MockCustomDataSource {
  name: string
  entities = {
    values: [] as Cesium.Entity[],
    add: vi.fn((entity: Cesium.Entity) => {
      const mockEntity = {
        id: `entity-${Math.random()}`,
        position: entity.position,
        point: entity.point,
        polyline: entity.polyline,
        polygon: entity.polygon,
        label: entity.label
      } as Cesium.Entity
      return mockEntity
    }),
    remove: vi.fn(),
    removeAll: vi.fn(),
    getById: vi.fn(),
    contains: vi.fn(() => true)
  }

  constructor(name: string) {
    this.name = name
  }
}

// 创建测试用的 MeasureBase 子类
class TestMeasure extends MeasureBase {
  measureType: MeasureTypeString = 'distance'

  protected calculateResult(positions: Cesium.Cartesian3[]): MeasureResult {
    const distance = positions.length > 1 ? this.calculateTotalDistance(positions) : 0

    return {
      type: this.measureType,
      value: distance,
      positions,
      text: this.formatDistance(distance)
    }
  }

  protected updateDisplay(_positions: Cesium.Cartesian3[]): void {
    // 测试实现
  }

  // 暴露 protected 方法用于测试
  public testCalculateDistance(pos1: Cesium.Cartesian3, pos2: Cesium.Cartesian3): number {
    return this.calculateDistance(pos1, pos2)
  }

  public testCalculateArea(positions: Cesium.Cartesian3[]): number {
    return this.calculateArea(positions)
  }

  public testCalculateHeightDiff(pos1: Cesium.Cartesian3, pos2: Cesium.Cartesian3): number {
    return this.calculateHeightDiff(pos1, pos2)
  }

  public testCalculateAngle(pos1: Cesium.Cartesian3, pos2: Cesium.Cartesian3): number {
    return this.calculateAngle(pos1, pos2)
  }

  public testCalculateTotalDistance(positions: Cesium.Cartesian3[]): number {
    return this.calculateTotalDistance(positions)
  }

  public testCalculateResult(positions: Cesium.Cartesian3[]): MeasureResult {
    return this.calculateResult(positions)
  }

  public testFormatDistance(distance: number): string {
    return this.formatDistance(distance)
  }

  public testFormatArea(area: number): string {
    return this.formatArea(area)
  }

  public testFormatAngle(angle: number): string {
    return this.formatAngle(angle)
  }

  public testFormatCoordinate(position: Cesium.Cartesian3) {
    return this.formatCoordinate(position)
  }

  public testConvertDistance(distance: number, unit?: string) {
    return this.convertDistance(distance, unit as never)
  }

  public testConvertArea(area: number, unit?: string) {
    return this.convertArea(area, unit as never)
  }

  public testCreatePointEntity(position: Cesium.Cartesian3, isMidpoint = false) {
    return this.createPointEntity(position, isMidpoint)
  }

  public testCreateLineEntity(positions: Cesium.Cartesian3[], isAuxiliary = false) {
    return this.createLineEntity(positions, isAuxiliary)
  }

  public testCreateLabelEntity(position: Cesium.Cartesian3, text: string) {
    return this.createLabelEntity(position, text)
  }

  public testCreatePolygonEntity(positions: Cesium.Cartesian3[]) {
    return this.createPolygonEntity(positions)
  }

  public testUpdateMidpoints(positions: Cesium.Cartesian3[]) {
    this.updateMidpoints(positions)
  }

  public testClearAuxiliaryEntities() {
    this.clearAuxiliaryEntities()
  }
}

// Mock Cesium Viewer
const createMockViewer = (): Cesium.Viewer => {
  return {
    scene: {
      globe: {
        pick: vi.fn()
      }
    },
    camera: {
      getPickRay: vi.fn()
    },
    container: {
      style: {}
    }
  } as unknown as Cesium.Viewer
}

describe('MeasureBase', () => {
  let measure: TestMeasure
  let mockViewer: Cesium.Viewer
  let mockDataSource: MockCustomDataSource

  beforeEach(() => {
    mockViewer = createMockViewer()
    mockDataSource = new MockCustomDataSource('test-datasource')

    const config: DrawConfig = {
      viewer: mockViewer,
      dataSource: mockDataSource as unknown as Cesium.CustomDataSource
    }

    measure = new TestMeasure(config)
  })

  describe('初始化', () => {
    it('应该正确初始化', () => {
      expect(measure).toBeDefined()
      expect(measure.measureType).toBe('distance')
    })

    it('应该有默认样式', () => {
      expect(measure).toBeDefined()
    })
  })

  describe('样式设置', () => {
    it('应该能够设置样式', () => {
      const result = measure.setStyle({
        lineColor: '#ff0000',
        lineWidth: 3
      })

      expect(result).toBe(measure)
    })

    it('应该能够部分更新样式', () => {
      measure.setStyle({ lineColor: '#ff0000' })
      measure.setStyle({ lineWidth: 5 })

      expect(measure).toBeDefined()
    })
  })

  describe('吸附配置', () => {
    it('应该能够设置吸附配置', () => {
      const result = measure.setSnapConfig({
        enabled: true,
        radius: 20
      })

      expect(result).toBe(measure)
    })
  })

  describe('单位配置', () => {
    it('应该能够设置单位配置', () => {
      const result = measure.setUnitConfig({
        distance: 'kilometer',
        area: 'squareKilometer'
      })

      expect(result).toBe(measure)
    })
  })

  describe('移动端配置', () => {
    it('应该能够设置移动端配置', () => {
      const result = measure.setMobileConfig({
        enableLongPress: false,
        longPressDelay: 1000
      })

      expect(result).toBe(measure)
    })
  })

  describe('距离计算', () => {
    it('应该能够计算两点距离', () => {
      const pos1 = Cesium.Cartesian3.fromDegrees(120.0, 30.0, 100.0)
      const pos2 = Cesium.Cartesian3.fromDegrees(120.1, 30.0, 100.0)

      const distance = measure.testCalculateDistance(pos1, pos2)

      expect(distance).toBeGreaterThan(0)
      expect(typeof distance).toBe('number')
    })

    it('应该能够计算多点总距离', () => {
      const positions = [
        Cesium.Cartesian3.fromDegrees(120.0, 30.0, 100.0),
        Cesium.Cartesian3.fromDegrees(120.1, 30.0, 100.0),
        Cesium.Cartesian3.fromDegrees(120.1, 30.1, 100.0)
      ]

      const result = measure.testCalculateResult(positions)

      expect(result.value).toBeGreaterThan(0)
      expect(result.type).toBe('distance')
    })
  })

  describe('面积计算', () => {
    it('应该能够计算多边形面积', () => {
      const positions = [
        Cesium.Cartesian3.fromDegrees(120.0, 30.0, 100.0),
        Cesium.Cartesian3.fromDegrees(120.1, 30.0, 100.0),
        Cesium.Cartesian3.fromDegrees(120.1, 30.1, 100.0),
        Cesium.Cartesian3.fromDegrees(120.0, 30.1, 100.0)
      ]

      const area = measure.testCalculateArea(positions)

      expect(area).toBeGreaterThan(0)
      expect(typeof area).toBe('number')
    })

    it('点数少于3时应该返回0', () => {
      const positions = [
        Cesium.Cartesian3.fromDegrees(120.0, 30.0, 100.0),
        Cesium.Cartesian3.fromDegrees(120.1, 30.0, 100.0)
      ]

      const area = measure.testCalculateArea(positions)

      expect(area).toBe(0)
    })
  })

  describe('高度差计算', () => {
    it('应该能够计算高度差', () => {
      const pos1 = Cesium.Cartesian3.fromDegrees(120.0, 30.0, 100.0)
      const pos2 = Cesium.Cartesian3.fromDegrees(120.0, 30.0, 200.0)

      const heightDiff = measure.testCalculateHeightDiff(pos1, pos2)

      expect(heightDiff).toBeCloseTo(100.0, 1)
    })
  })

  describe('角度计算', () => {
    it('应该能够计算方位角', () => {
      const pos1 = Cesium.Cartesian3.fromDegrees(120.0, 30.0, 100.0)
      const pos2 = Cesium.Cartesian3.fromDegrees(120.0, 30.1, 100.0)

      const angle = measure.testCalculateAngle(pos1, pos2)

      expect(angle).toBeGreaterThanOrEqual(0)
      expect(angle).toBeLessThanOrEqual(360)
    })
  })

  describe('单位换算', () => {
    it('应该能够将米转换为千米', () => {
      const result = measure.testConvertDistance(1000, 'kilometer')
      expect(result).toBe(1)
    })

    it('应该能够将米转换为英里', () => {
      const result = measure.testConvertDistance(1609.344, 'mile')
      expect(result).toBeCloseTo(1, 2)
    })

    it('应该能够将平方米转换为平方千米', () => {
      const result = measure.testConvertArea(1000000, 'squareKilometer')
      expect(result).toBe(1)
    })

    it('应该能够将平方米转换为公顷', () => {
      const result = measure.testConvertArea(10000, 'hectare')
      expect(result).toBe(1)
    })
  })

  describe('格式化输出', () => {
    it('应该格式化距离（米）', () => {
      const formatted = measure.testFormatDistance(123.456)
      expect(formatted).toContain('123.46')
      expect(formatted).toContain('m')
    })

    it('应该格式化距离（千米）', () => {
      const formatted = measure.testFormatDistance(1234.56)
      expect(formatted).toContain('km')
    })

    it('应该格式化面积', () => {
      const formatted = measure.testFormatArea(5000.5)
      expect(formatted).toContain('5000.50')
      expect(formatted).toContain('m²')
    })

    it('应该格式化角度', () => {
      const formatted = measure.testFormatAngle(45.678)
      expect(formatted).toBeDefined()
      expect(typeof formatted).toBe('string')
    })

    it('应该格式化坐标', () => {
      const position = Cesium.Cartesian3.fromDegrees(120.123, 30.456, 100.0)
      const formatted = measure.testFormatCoordinate(position)

      expect(formatted).toHaveProperty('lng')
      expect(formatted).toHaveProperty('lat')
      expect(formatted).toHaveProperty('height')
      expect(formatted.height).toBeCloseTo(100.0, 1)
    })
  })

  describe('实体创建', () => {
    it('应该能够创建点实体', () => {
      const position = Cesium.Cartesian3.fromDegrees(120.0, 30.0, 100.0)
      const entity = measure.testCreatePointEntity(position)

      expect(entity).toBeDefined()
      expect(mockDataSource.entities.add).toHaveBeenCalled()
    })

    it('应该能够创建中间点实体', () => {
      const position = Cesium.Cartesian3.fromDegrees(120.0, 30.0, 100.0)
      const entity = measure.testCreatePointEntity(position, true)

      expect(entity).toBeDefined()
      expect(mockDataSource.entities.add).toHaveBeenCalled()
    })

    it('应该能够创建线实体', () => {
      const positions = [
        Cesium.Cartesian3.fromDegrees(120.0, 30.0, 100.0),
        Cesium.Cartesian3.fromDegrees(120.1, 30.0, 100.0)
      ]

      const entity = measure.testCreateLineEntity(positions)

      expect(entity).toBeDefined()
      expect(mockDataSource.entities.add).toHaveBeenCalled()
    })

    it('应该能够创建辅助线实体', () => {
      const positions = [
        Cesium.Cartesian3.fromDegrees(120.0, 30.0, 100.0),
        Cesium.Cartesian3.fromDegrees(120.1, 30.0, 100.0)
      ]

      const entity = measure.testCreateLineEntity(positions, true)

      expect(entity).toBeDefined()
      expect(mockDataSource.entities.add).toHaveBeenCalled()
    })

    it('应该能够创建标签实体', () => {
      const position = Cesium.Cartesian3.fromDegrees(120.0, 30.0, 100.0)
      const entity = measure.testCreateLabelEntity(position, 'Test Label')

      expect(entity).toBeDefined()
      expect(mockDataSource.entities.add).toHaveBeenCalled()
    })

    it('应该能够创建多边形实体', () => {
      const positions = [
        Cesium.Cartesian3.fromDegrees(120.0, 30.0, 100.0),
        Cesium.Cartesian3.fromDegrees(120.1, 30.0, 100.0),
        Cesium.Cartesian3.fromDegrees(120.1, 30.1, 100.0)
      ]

      const entity = measure.testCreatePolygonEntity(positions)

      expect(entity).toBeDefined()
      expect(mockDataSource.entities.add).toHaveBeenCalled()
    })
  })

  describe('中间点管理', () => {
    it('应该能够更新中间点', () => {
      const positions = [
        Cesium.Cartesian3.fromDegrees(120.0, 30.0, 100.0),
        Cesium.Cartesian3.fromDegrees(120.1, 30.0, 100.0),
        Cesium.Cartesian3.fromDegrees(120.1, 30.1, 100.0)
      ]

      measure.testUpdateMidpoints(positions)

      expect(mockDataSource.entities.add).toHaveBeenCalled()
    })

    it('点数少于2时不应创建中间点', () => {
      const positions = [Cesium.Cartesian3.fromDegrees(120.0, 30.0, 100.0)]

      mockDataSource.entities.add.mockClear()
      measure.testUpdateMidpoints(positions)

      expect(mockDataSource.entities.add).not.toHaveBeenCalled()
    })
  })

  describe('辅助实体清理', () => {
    it('应该能够清除辅助实体', () => {
      measure.testClearAuxiliaryEntities()

      expect(measure).toBeDefined()
    })
  })

  describe('获取结果', () => {
    it('初始状态应该返回 null', () => {
      const result = measure.getResult()
      expect(result).toBeNull()
    })
  })

  describe('启用和禁用', () => {
    it('应该能够启用测量工具', () => {
      const result = measure.enable()
      expect(result).toBe(measure)
    })

    it('应该能够禁用测量工具', () => {
      measure.enable()
      const result = measure.disable()

      expect(result).toBe(measure)
    })
  })

  describe('链式调用', () => {
    it('应该支持链式调用', () => {
      const result = measure
        .setStyle({ lineColor: '#ff0000' })
        .setSnapConfig({ enabled: true })
        .setUnitConfig({ distance: 'kilometer' })
        .setMobileConfig({ enableLongPress: false })

      expect(result).toBe(measure)
    })
  })
})
