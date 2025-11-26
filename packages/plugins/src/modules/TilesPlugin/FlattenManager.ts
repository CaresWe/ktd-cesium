import {
  Cesium3DTileset,
  ClippingPlaneCollection,
  ClippingPlane,
  Cartesian3,
  Color as CesiumColor,
  PolygonHierarchy,
  JulianDate,
  Entity
} from 'cesium'
import type { FlattenConfig, EntityFlattenConfig } from './types'
import type { KtdViewer } from '@ktd-cesium/core'
import type { GraphicsPlugin } from '../GraphicsPlugin'

/**
 * 压平管理器
 * 负责在指定区域压平模型
 */
export class FlattenManager {
  private tileset: Cesium3DTileset
  private _viewer?: KtdViewer
  private graphicsPlugin?: GraphicsPlugin
  private config: FlattenConfig | null = null
  private _entityConfig: EntityFlattenConfig | null = null
  private clippingPlanes: ClippingPlaneCollection | null = null

  constructor(tileset: Cesium3DTileset, viewer?: KtdViewer) {
    this.tileset = tileset
    this._viewer = viewer
    if (viewer) {
      this.graphicsPlugin = viewer.getPlugin('graphics') as GraphicsPlugin | undefined
    }
  }

  /**
   * 启用压平
   */
  enable(config: FlattenConfig): void {
    try {
      this.config = config

      // 创建一个水平剖切平面，高于压平高度的部分被剪切掉
      const plane = this.createFlattenPlane(config.height)

      this.clippingPlanes = new ClippingPlaneCollection({
        planes: [plane],
        enabled: true,
        unionClippingRegions: false,
        edgeColor: config.boundaryColor
          ? CesiumColor.fromCssColorString(config.boundaryColor.toCssColorString())
          : CesiumColor.WHITE,
        edgeWidth: config.showBoundary ? 2.0 : 0.0
      })

      this.tileset.clippingPlanes = this.clippingPlanes

      console.log('Flatten enabled at height:', config.height)
    } catch (error) {
      console.error('Failed to enable flatten:', error)
      throw error
    }
  }

  /**
   * 创建压平剖切平面
   */
  private createFlattenPlane(height: number): ClippingPlane {
    try {
      // 使用向上的法向量创建水平平面
      const normal = new Cartesian3(0, 0, 1)

      // 计算平面距离
      // 对于水平平面，距离就是高度的负值
      const distance = -height

      return new ClippingPlane(normal, distance)
    } catch (error) {
      console.error('Failed to create flatten plane:', error)
      throw error
    }
  }

  /**
   * 更新压平高度
   */
  updateHeight(height: number): void {
    try {
      if (!this.config) {
        throw new Error('Flatten not initialized')
      }

      this.config.height = height

      // 重新创建剖切平面
      if (this.clippingPlanes) {
        this.clippingPlanes.removeAll()
        const plane = this.createFlattenPlane(height)
        this.clippingPlanes.add(plane)
      }

      console.log('Flatten height updated:', height)
    } catch (error) {
      console.error('Failed to update flatten height:', error)
      throw error
    }
  }

  /**
   * 启用基于实体的压平
   */
  enableEntityFlatten(config: EntityFlattenConfig): void {
    try {
      this._entityConfig = config

      // 获取实体
      let entity: Entity
      if (typeof config.entity === 'string') {
        if (!this.graphicsPlugin) {
          throw new Error('GraphicsPlugin is required for entity flatten')
        }
        const foundEntity = this.graphicsPlugin.getEntityById?.(config.entity)
        if (!foundEntity) {
          throw new Error(`Entity ${config.entity} not found`)
        }
        entity = foundEntity as Entity
      } else {
        entity = config.entity
      }

      // 获取 polygon 的位置
      const positions = this.getPolygonPositions(entity)
      if (!positions || positions.length < 3) {
        throw new Error('Invalid polygon entity')
      }

      // 创建压平剖切平面（结合区域和高度）
      const planes = this.createEntityFlattenPlanes(positions, config.height)

      this.clippingPlanes = new ClippingPlaneCollection({
        planes,
        enabled: true,
        unionClippingRegions: false, // 使用交集，保留区域内且低于高度的部分
        edgeColor: config.boundaryColor
          ? CesiumColor.fromCssColorString(config.boundaryColor.toCssColorString())
          : CesiumColor.WHITE,
        edgeWidth: config.showBoundary ? 2.0 : 0.0
      })

      this.tileset.clippingPlanes = this.clippingPlanes

      console.log('Entity flatten enabled', {
        entityId: entity.id,
        height: config.height,
        planesCount: planes.length
      })
    } catch (error) {
      console.error('Failed to enable entity flatten:', error)
      throw error
    }
  }

  /**
   * 从 Entity 获取 polygon 的坐标
   */
  private getPolygonPositions(entity: Entity): Cartesian3[] | null {
    try {
      const entityAny = entity as unknown as Record<string, unknown>
      const polygon = entityAny.polygon as Record<string, unknown>
      if (!polygon || !polygon.hierarchy) {
        return null
      }

      const hierarchy = polygon.hierarchy as { getValue?: (time: JulianDate) => PolygonHierarchy | Cartesian3[] }

      if (hierarchy.getValue) {
        const value = hierarchy.getValue(JulianDate.now())

        if (value instanceof PolygonHierarchy) {
          return value.positions
        }

        if (Array.isArray(value)) {
          return value
        }
      }

      // 尝试从扩展属性获取
      const extendedEntity = entityAny as { _positions_draw?: Cartesian3[] }
      if (extendedEntity._positions_draw) {
        return extendedEntity._positions_draw
      }

      return null
    } catch (error) {
      console.error('Failed to get polygon positions:', error)
      return null
    }
  }

  /**
   * 创建基于实体的压平剖切平面
   * 结合区域边界平面和高度平面
   */
  private createEntityFlattenPlanes(positions: Cartesian3[], height: number): ClippingPlane[] {
    try {
      const planes: ClippingPlane[] = []

      // 1. 添加水平剖切平面（高度限制）
      const horizontalPlane = this.createFlattenPlane(height)
      planes.push(horizontalPlane)

      // 2. 为多边形的每条边创建垂直剖切平面（区域限制）
      for (let i = 0; i < positions.length; i++) {
        const p1 = positions[i]
        const p2 = positions[(i + 1) % positions.length]

        // 计算边的方向
        const edge = Cartesian3.subtract(p2, p1, new Cartesian3())
        const edgeNormalized = Cartesian3.normalize(edge, new Cartesian3())

        // 计算垂直于边的法向量（指向多边形外部）
        const up = new Cartesian3(0, 0, 1)
        const normal = Cartesian3.cross(edgeNormalized, up, new Cartesian3())
        Cartesian3.normalize(normal, normal)

        // 计算平面距离
        const distance = -Cartesian3.dot(normal, p1)
        planes.push(new ClippingPlane(normal, distance))
      }

      return planes
    } catch (error) {
      console.error('Failed to create entity flatten planes:', error)
      throw error
    }
  }

  /**
   * 禁用压平
   */
  disable(): void {
    try {
      if (this.clippingPlanes) {
        // @ts-expect-error - Cesium allows undefined to clear clipping planes
        this.tileset.clippingPlanes = undefined
        this.clippingPlanes = null
      }

      this.config = null
      this._entityConfig = null
      console.log('Flatten disabled')
    } catch (error) {
      console.error('Failed to disable flatten:', error)
      throw error
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): FlattenConfig | null {
    return this.config ? { ...this.config } : null
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.disable()
  }
}
