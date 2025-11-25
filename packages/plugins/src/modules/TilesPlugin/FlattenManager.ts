import {
  Cesium3DTileset,
  ClippingPlaneCollection,
  ClippingPlane,
  Cartesian3,
  Color as CesiumColor
} from 'cesium'
import type { FlattenConfig } from './types'

/**
 * 压平管理器
 * 负责在指定区域压平模型
 */
export class FlattenManager {
  private tileset: Cesium3DTileset
  private config: FlattenConfig | null = null
  private clippingPlanes: ClippingPlaneCollection | null = null

  constructor(tileset: Cesium3DTileset) {
    this.tileset = tileset
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
