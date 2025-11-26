import {
  Cesium3DTileset,
  ClippingPlane,
  ClippingPlaneCollection,
  Cartesian3,
  Color as CesiumColor,
  PolygonHierarchy,
  JulianDate,
  Entity
} from 'cesium'
import type { ClippingPlanesConfig, ClippingPlaneConfig, EntityClippingConfig } from './types'
import type { KtdViewer } from '@ktd-cesium/core'
import type { GraphicsPlugin } from '../GraphicsPlugin'

/**
 * 剖切平面管理器
 * 负责管理 3D Tiles 的平面剖切功能
 */
export class ClippingPlaneManager {
  private tileset: Cesium3DTileset
  private _viewer?: KtdViewer
  private graphicsPlugin?: GraphicsPlugin
  private clippingPlanes: ClippingPlaneCollection | null = null
  private config: ClippingPlanesConfig | null = null
  private _entityConfig: EntityClippingConfig | null = null

  constructor(tileset: Cesium3DTileset, viewer?: KtdViewer) {
    this.tileset = tileset
    this._viewer = viewer
    if (viewer) {
      this.graphicsPlugin = viewer.getPlugin('graphics') as GraphicsPlugin | undefined
    }
  }

  /**
   * 启用剖切
   */
  enable(config: ClippingPlanesConfig): void {
    try {
      this.config = config

      // 创建剖切平面集合
      const planes = config.planes.map((planeConfig) => {
        const normal = new Cartesian3(
          planeConfig.normal[0],
          planeConfig.normal[1],
          planeConfig.normal[2]
        )
        return new ClippingPlane(normal, planeConfig.distance)
      })

      this.clippingPlanes = new ClippingPlaneCollection({
        planes,
        enabled: config.enabled !== false,
        unionClippingRegions: config.unionClippingRegions ?? false,
        edgeColor: config.edgeColor
          ? CesiumColor.fromCssColorString(config.edgeColor.toCssColorString())
          : CesiumColor.WHITE,
        edgeWidth: config.edgeWidth ?? 1.0
      })

      // 应用到 tileset
      this.tileset.clippingPlanes = this.clippingPlanes

      console.log('Clipping planes enabled')
    } catch (error) {
      console.error('Failed to enable clipping planes:', error)
      throw error
    }
  }

  /**
   * 更新剖切配置
   */
  update(config: Partial<ClippingPlanesConfig>): void {
    try {
      if (!this.clippingPlanes || !this.config) {
        throw new Error('Clipping planes not initialized')
      }

      // 更新配置
      if (config.enabled !== undefined) {
        this.clippingPlanes.enabled = config.enabled
        this.config.enabled = config.enabled
      }

      if (config.unionClippingRegions !== undefined) {
        this.clippingPlanes.unionClippingRegions = config.unionClippingRegions
        this.config.unionClippingRegions = config.unionClippingRegions
      }

      if (config.edgeColor !== undefined) {
        this.clippingPlanes.edgeColor = CesiumColor.fromCssColorString(
          config.edgeColor.toCssColorString()
        )
        this.config.edgeColor = config.edgeColor
      }

      if (config.edgeWidth !== undefined) {
        this.clippingPlanes.edgeWidth = config.edgeWidth
        this.config.edgeWidth = config.edgeWidth
      }

      // 如果更新了平面列表，重新创建
      if (config.planes) {
        this.clippingPlanes.removeAll()
        config.planes.forEach((planeConfig) => {
          const normal = new Cartesian3(
            planeConfig.normal[0],
            planeConfig.normal[1],
            planeConfig.normal[2]
          )
          this.clippingPlanes!.add(new ClippingPlane(normal, planeConfig.distance))
        })
        this.config.planes = config.planes
      }
    } catch (error) {
      console.error('Failed to update clipping planes:', error)
      throw error
    }
  }

  /**
   * 添加剖切平面
   */
  addPlane(planeConfig: ClippingPlaneConfig): void {
    try {
      if (!this.clippingPlanes || !this.config) {
        throw new Error('Clipping planes not initialized')
      }

      const normal = new Cartesian3(
        planeConfig.normal[0],
        planeConfig.normal[1],
        planeConfig.normal[2]
      )
      const plane = new ClippingPlane(normal, planeConfig.distance)

      this.clippingPlanes.add(plane)
      this.config.planes.push(planeConfig)

      console.log('Clipping plane added')
    } catch (error) {
      console.error('Failed to add clipping plane:', error)
      throw error
    }
  }

  /**
   * 移除剖切平面
   */
  removePlane(index: number): void {
    try {
      if (!this.clippingPlanes || !this.config) {
        throw new Error('Clipping planes not initialized')
      }

      if (index < 0 || index >= this.clippingPlanes.length) {
        throw new Error(`Invalid plane index: ${index}`)
      }

      this.clippingPlanes.remove(this.clippingPlanes.get(index))
      this.config.planes.splice(index, 1)

      console.log(`Clipping plane ${index} removed`)
    } catch (error) {
      console.error('Failed to remove clipping plane:', error)
      throw error
    }
  }

  /**
   * 启用基于实体的剖切
   */
  enableEntityClipping(config: EntityClippingConfig): void {
    try {
      this._entityConfig = config

      // 获取实体
      let entity: Entity
      if (typeof config.entity === 'string') {
        if (!this.graphicsPlugin) {
          throw new Error('GraphicsPlugin is required for entity clipping')
        }
        const foundEntity = this.graphicsPlugin.getEntityById?.(config.entity)
        if (!foundEntity) {
          throw new Error(`Entity ${config.entity} not found`)
        }
        entity = foundEntity as Entity
      } else {
        entity = config.entity
      }

      // 根据实体类型创建剖切平面
      const planes = this.createEntityClippingPlanes(entity)

      if (planes && planes.length > 0) {
        this.clippingPlanes = new ClippingPlaneCollection({
          planes,
          enabled: config.enabled !== false,
          unionClippingRegions: config.unionClippingRegions ?? false,
          edgeColor: config.edgeColor
            ? CesiumColor.fromCssColorString(config.edgeColor.toCssColorString())
            : CesiumColor.WHITE,
          edgeWidth: config.edgeWidth ?? 1.0
        })

        this.tileset.clippingPlanes = this.clippingPlanes
        console.log('Entity clipping enabled', { entityId: entity.id, planesCount: planes.length })
      } else {
        console.warn('No clipping planes generated from entity')
      }
    } catch (error) {
      console.error('Failed to enable entity clipping:', error)
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
   * 根据实体创建剖切平面
   */
  private createEntityClippingPlanes(entity: Entity): ClippingPlane[] {
    try {
      const planes: ClippingPlane[] = []
      const entityAny = entity as unknown as Record<string, unknown>

      // 处理多边形剖切
      if (entityAny.polygon) {
        const positions = this.getPolygonPositions(entity)

        if (positions && positions.length >= 3) {
          // 为多边形的每条边创建垂直剖切平面
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
        }
      }

      // 处理 polyline 剖切（创建沿线的垂直平面）
      else if (entityAny.polyline) {
        const polyline = entityAny.polyline as Record<string, unknown>
        const positionsProperty = polyline.positions as { getValue?: (time: JulianDate) => Cartesian3[] }

        if (positionsProperty?.getValue) {
          const positions = positionsProperty.getValue(JulianDate.now())

          if (positions && positions.length >= 2) {
            // 对于 polyline，在每个线段中点创建垂直剖切平面
            for (let i = 0; i < positions.length - 1; i++) {
              const p1 = positions[i]
              const p2 = positions[i + 1]

              // 计算线段方向
              const direction = Cartesian3.subtract(p2, p1, new Cartesian3())
              Cartesian3.normalize(direction, direction)

              // 计算中点
              const midpoint = Cartesian3.lerp(p1, p2, 0.5, new Cartesian3())

              // 创建垂直于线段的平面（法向量就是线段方向）
              const distance = -Cartesian3.dot(direction, midpoint)
              planes.push(new ClippingPlane(direction, distance))
            }
          }
        }
      }

      return planes
    } catch (error) {
      console.error('Failed to create entity clipping planes:', error)
      return []
    }
  }

  /**
   * 禁用剖切
   */
  disable(): void {
    try {
      if (this.clippingPlanes) {
        // @ts-expect-error - Cesium allows undefined to clear clipping planes
        this.tileset.clippingPlanes = undefined
        this.clippingPlanes = null
        this.config = null
        this._entityConfig = null
        console.log('Clipping planes disabled')
      }
    } catch (error) {
      console.error('Failed to disable clipping planes:', error)
      throw error
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): ClippingPlanesConfig | null {
    return this.config ? { ...this.config } : null
  }

  /**
   * 获取剖切平面集合
   */
  getClippingPlanes(): ClippingPlaneCollection | null {
    return this.clippingPlanes
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.disable()
  }
}
