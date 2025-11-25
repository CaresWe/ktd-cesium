import {
  Cesium3DTileset,
  ClippingPlane,
  ClippingPlaneCollection,
  Cartesian3,
  Color as CesiumColor
} from 'cesium'
import type { ClippingPlanesConfig, ClippingPlaneConfig } from './types'

/**
 * 剖切平面管理器
 * 负责管理 3D Tiles 的平面剖切功能
 */
export class ClippingPlaneManager {
  private tileset: Cesium3DTileset
  private clippingPlanes: ClippingPlaneCollection | null = null
  private config: ClippingPlanesConfig | null = null

  constructor(tileset: Cesium3DTileset) {
    this.tileset = tileset
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
   * 禁用剖切
   */
  disable(): void {
    try {
      if (this.clippingPlanes) {
        // @ts-expect-error - Cesium allows undefined to clear clipping planes
        this.tileset.clippingPlanes = undefined
        this.clippingPlanes = null
        this.config = null
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
