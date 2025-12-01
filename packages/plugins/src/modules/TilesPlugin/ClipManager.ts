import {
  Cesium3DTileset,
  ClippingPlane,
  ClippingPlaneCollection,
  Cartesian3,
  Matrix3,
  HeadingPitchRoll,
  Transforms,
  Math as CesiumMath,
  Cartographic,
  Color as CesiumColor,
  Ellipsoid,
  PolygonHierarchy,
  JulianDate
} from 'cesium'
import type { KtdViewer } from '@ktd-cesium/core'
import type { BoxClipConfig, ModelClipConfig } from './types'
import type { GraphicsPlugin } from '../GraphicsPlugin'

/**
 * 裁剪管理器
 * 负责盒子裁剪和模型裁剪功能
 */
export class ClipManager {
  private tileset: Cesium3DTileset
  private graphicsPlugin?: GraphicsPlugin
  private boxClipConfig: BoxClipConfig | null = null
  private modelClipConfig: ModelClipConfig | null = null
  private clippingPlanes: ClippingPlaneCollection | null = null
  private boxEntity: unknown = null // Entity from GraphicsPlugin

  constructor(tileset: Cesium3DTileset, viewer: KtdViewer) {
    this.tileset = tileset
    this.graphicsPlugin = viewer.getPlugin('graphics') as GraphicsPlugin | undefined
  }

  /**
   * 启用盒子裁剪
   */
  enableBoxClip(config: BoxClipConfig): void {
    try {
      this.boxClipConfig = config

      // 计算盒子的六个面作为剖切平面
      const planes = this.createBoxClippingPlanes(config)

      this.clippingPlanes = new ClippingPlaneCollection({
        planes,
        enabled: true,
        unionClippingRegions: config.mode === 'outside',
        edgeColor: config.boxColor
          ? CesiumColor.fromCssColorString(config.boxColor.toCssColorString())
          : CesiumColor.WHITE,
        edgeWidth: 1.0
      })

      this.tileset.clippingPlanes = this.clippingPlanes

      // 显示盒子边框（如果配置要求）
      if (config.showBox && this.graphicsPlugin) {
        this.boxEntity = this.createBoxVisualization(config)
      }
    } catch (error) {
      console.error('Failed to enable box clipping:', error)
      throw error
    }
  }

  /**
   * 创建盒子边框可视化
   */
  private createBoxVisualization(config: BoxClipConfig): unknown {
    try {
      if (!this.graphicsPlugin) return null

      const [lon, lat, height] = config.center
      const [width, length, boxHeight] = config.dimensions
      const rotation = config.rotation ?? [0, 0, 0]

      // 使用 GraphicsPlugin 的绘制功能创建盒子
      // 注意：这里假设 GraphicsPlugin 有 drawBox 方法
      // 实际使用时需要根据 GraphicsPlugin 的实际 API 调整
      const plugin = this.graphicsPlugin as unknown as Record<string, unknown>
      if (typeof plugin.drawBox === 'function') {
        return (plugin.drawBox as (config: unknown) => unknown)({
          position: [lon, lat, height],
          dimensions: [width, length, boxHeight],
          rotation: rotation,
          outline: true,
          outlineColor: config.boxColor ?? CesiumColor.WHITE,
          fill: false
        })
      }

      console.warn('GraphicsPlugin does not support drawBox method')
      return null
    } catch (error) {
      console.error('Failed to create box visualization:', error)
      return null
    }
  }

  /**
   * 创建盒子的剖切平面
   */
  private createBoxClippingPlanes(config: BoxClipConfig): ClippingPlane[] {
    try {
      const [centerX, centerY, centerZ] = config.center
      const [width, length, height] = config.dimensions

      // 将经纬度高度转换为笛卡尔坐标
      const centerCartographic = Cartographic.fromDegrees(centerX, centerY, centerZ)
      const centerCartesian = Ellipsoid.WGS84.cartographicToCartesian(centerCartographic)

      // 创建旋转矩阵
      let rotationMatrix = Matrix3.IDENTITY
      if (config.rotation) {
        const [heading, pitch, roll] = config.rotation
        const hpr = new HeadingPitchRoll(
          CesiumMath.toRadians(heading),
          CesiumMath.toRadians(pitch),
          CesiumMath.toRadians(roll)
        )
        const quaternion = Transforms.headingPitchRollQuaternion(centerCartesian, hpr)
        rotationMatrix = Matrix3.fromQuaternion(quaternion, new Matrix3())
      }

      // 定义盒子六个面的法向量（局部坐标系）
      const localNormals = [
        new Cartesian3(1, 0, 0), // 右
        new Cartesian3(-1, 0, 0), // 左
        new Cartesian3(0, 1, 0), // 前
        new Cartesian3(0, -1, 0), // 后
        new Cartesian3(0, 0, 1), // 上
        new Cartesian3(0, 0, -1) // 下
      ]

      // 面的偏移距离
      const distances = [width / 2, width / 2, length / 2, length / 2, height / 2, height / 2]

      // 创建剖切平面
      const planes: ClippingPlane[] = []
      for (let i = 0; i < localNormals.length; i++) {
        // 将局部法向量转换到世界坐标系
        const worldNormal = Matrix3.multiplyByVector(rotationMatrix, localNormals[i], new Cartesian3())

        // 计算平面到原点的距离
        const planePoint = Cartesian3.add(
          centerCartesian,
          Cartesian3.multiplyByScalar(worldNormal, distances[i], new Cartesian3()),
          new Cartesian3()
        )
        const distance = -Cartesian3.dot(worldNormal, planePoint)

        planes.push(new ClippingPlane(worldNormal, distance))
      }

      return planes
    } catch (error) {
      console.error('Failed to create box clipping planes:', error)
      throw error
    }
  }

  /**
   * 更新盒子裁剪
   */
  updateBoxClip(config: Partial<BoxClipConfig>): void {
    try {
      if (!this.boxClipConfig) {
        throw new Error('Box clipping not initialized')
      }

      // 更新配置
      this.boxClipConfig = { ...this.boxClipConfig, ...config }

      // 如果更新了关键参数，重新创建裁剪平面
      if (config.center || config.dimensions || config.rotation || config.mode) {
        this.disableBoxClip()
        this.enableBoxClip(this.boxClipConfig)
      }
    } catch (error) {
      console.error('Failed to update box clipping:', error)
      throw error
    }
  }

  /**
   * 禁用盒子裁剪
   */
  disableBoxClip(): void {
    try {
      if (this.clippingPlanes && !this.modelClipConfig) {
        // @ts-expect-error - Cesium allows undefined to clear clipping planes
        this.tileset.clippingPlanes = undefined
        this.clippingPlanes = null
      }

      if (this.boxEntity && this.graphicsPlugin) {
        // 移除盒子实体
        const plugin = this.graphicsPlugin as unknown as Record<string, unknown>
        const removeEntity = plugin.removeEntity
        if (typeof removeEntity === 'function') {
          ;(removeEntity as (entity: unknown) => void)(this.boxEntity)
        }
      }

      this.boxClipConfig = null
      this.boxEntity = null
    } catch (error) {
      console.error('Failed to disable box clipping:', error)
      throw error
    }
  }

  /**
   * 启用模型裁剪
   */
  enableModelClip(config: ModelClipConfig): void {
    try {
      if (!this.graphicsPlugin) {
        throw new Error('GraphicsPlugin is required for model clipping')
      }

      this.modelClipConfig = config

      // 从 GraphicsPlugin 获取实体
      const entity = this.graphicsPlugin.getEntityById?.(config.entityId)
      if (!entity) {
        throw new Error(`Entity ${config.entityId} not found`)
      }

      // 根据实体几何类型创建裁剪平面
      const planes = this.createModelClippingPlanes(entity, config)

      if (planes && planes.length > 0) {
        this.clippingPlanes = new ClippingPlaneCollection({
          planes,
          enabled: true,
          unionClippingRegions: config.mode === 'outside',
          edgeWidth: 1.0
        })

        this.tileset.clippingPlanes = this.clippingPlanes
      } else {
        console.warn('No clipping planes generated from entity geometry')
      }
    } catch (error) {
      console.error('Failed to enable model clipping:', error)
      throw error
    }
  }

  /**
   * 从 Entity 获取 polygon 的坐标
   * 支持多种方式获取位置，兼容 GraphicsPlugin 绘制的 polygon
   */
  private getPolygonPositions(entity: Record<string, unknown>): Cartesian3[] | null {
    try {
      const polygon = entity.polygon as Record<string, unknown>
      if (!polygon || !polygon.hierarchy) {
        return null
      }

      const hierarchy = polygon.hierarchy as { getValue?: (time: JulianDate) => PolygonHierarchy | Cartesian3[] }

      if (hierarchy.getValue) {
        const value = hierarchy.getValue(JulianDate.now())

        // 如果是 PolygonHierarchy 类型
        if (value instanceof PolygonHierarchy) {
          return value.positions
        }

        // 如果直接是 Cartesian3 数组
        if (Array.isArray(value)) {
          return value
        }
      }

      // 尝试从扩展属性获取（GraphicsPlugin 可能使用）
      const extendedEntity = entity as { _positions_draw?: Cartesian3[] }
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
   * 根据实体几何创建裁剪平面
   */
  private createModelClippingPlanes(entity: unknown, config: ModelClipConfig): ClippingPlane[] {
    try {
      const planes: ClippingPlane[] = []
      const entityAny = entity as Record<string, unknown>

      // 处理多边形裁剪
      if (entityAny.polygon) {
        const positions = this.getPolygonPositions(entityAny)

        if (positions && positions.length >= 3) {
          // 为多边形的每条边创建垂直剖切平面
          for (let i = 0; i < positions.length; i++) {
            const p1 = positions[i]
            const p2 = positions[(i + 1) % positions.length]

            // 计算边的方向
            const edge = Cartesian3.subtract(p2, p1, new Cartesian3())
            const edgeNormalized = Cartesian3.normalize(edge, new Cartesian3())

            // 计算垂直于边的法向量（指向多边形内部）
            const up = new Cartesian3(0, 0, 1)
            const normal = Cartesian3.cross(up, edgeNormalized, new Cartesian3())
            Cartesian3.normalize(normal, normal)

            // 如果是 outside 模式，反转法向量
            if (config.mode === 'outside') {
              Cartesian3.negate(normal, normal)
            }

            // 计算平面距离
            const distance = -Cartesian3.dot(normal, p1)
            planes.push(new ClippingPlane(normal, distance))
          }
        }
      }

      // 处理矩形裁剪
      else if (entityAny.rectangle) {
        const rectangle = entityAny.rectangle as Record<string, unknown>
        const coordinates = rectangle.coordinates as {
          getValue?: () => { west: number; south: number; east: number; north: number }
        }

        if (coordinates?.getValue) {
          const rect = coordinates.getValue()
          const height = (rectangle.height as { getValue?: () => number })?.getValue?.() ?? 0

          // 获取矩形四个角的笛卡尔坐标
          const sw = Cartesian3.fromRadians(rect.west, rect.south, height)
          const se = Cartesian3.fromRadians(rect.east, rect.south, height)
          const ne = Cartesian3.fromRadians(rect.east, rect.north, height)
          const nw = Cartesian3.fromRadians(rect.west, rect.north, height)

          // 创建四个边的剖切平面
          const corners = [sw, se, ne, nw]
          for (let i = 0; i < corners.length; i++) {
            const p1 = corners[i]
            const p2 = corners[(i + 1) % corners.length]

            const edge = Cartesian3.subtract(p2, p1, new Cartesian3())
            const edgeNormalized = Cartesian3.normalize(edge, new Cartesian3())

            const up = new Cartesian3(0, 0, 1)
            const normal = Cartesian3.cross(up, edgeNormalized, new Cartesian3())
            Cartesian3.normalize(normal, normal)

            if (config.mode === 'outside') {
              Cartesian3.negate(normal, normal)
            }

            const distance = -Cartesian3.dot(normal, p1)
            planes.push(new ClippingPlane(normal, distance))
          }
        }
      }

      // 处理圆形裁剪（近似为多边形）
      else if (entityAny.ellipse) {
        const ellipse = entityAny.ellipse as Record<string, unknown>
        const position = (entityAny.position as { getValue?: () => Cartesian3 })?.getValue?.()
        const semiMajorAxis = (ellipse.semiMajorAxis as { getValue?: () => number })?.getValue?.()
        const semiMinorAxis = (ellipse.semiMinorAxis as { getValue?: () => number })?.getValue?.()

        if (position && semiMajorAxis && semiMinorAxis) {
          // 用正多边形近似圆形（32边）
          const segments = 32
          const positions: Cartesian3[] = []

          for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2
            const offset = new Cartesian3(Math.cos(angle) * semiMajorAxis, Math.sin(angle) * semiMinorAxis, 0)
            const point = Cartesian3.add(position, offset, new Cartesian3())
            positions.push(point)
          }

          // 为每条边创建剖切平面
          for (let i = 0; i < positions.length; i++) {
            const p1 = positions[i]
            const p2 = positions[(i + 1) % positions.length]

            const edge = Cartesian3.subtract(p2, p1, new Cartesian3())
            const edgeNormalized = Cartesian3.normalize(edge, new Cartesian3())

            const up = new Cartesian3(0, 0, 1)
            const normal = Cartesian3.cross(up, edgeNormalized, new Cartesian3())
            Cartesian3.normalize(normal, normal)

            if (config.mode === 'outside') {
              Cartesian3.negate(normal, normal)
            }

            const distance = -Cartesian3.dot(normal, p1)
            planes.push(new ClippingPlane(normal, distance))
          }
        }
      }

      return planes
    } catch (error) {
      console.error('Failed to create model clipping planes:', error)
      return []
    }
  }

  /**
   * 禁用模型裁剪
   */
  disableModelClip(): void {
    try {
      if (this.clippingPlanes && !this.boxClipConfig) {
        // @ts-expect-error - Cesium allows undefined to clear clipping planes
        this.tileset.clippingPlanes = undefined
        this.clippingPlanes = null
      }

      this.modelClipConfig = null
    } catch (error) {
      console.error('Failed to disable model clipping:', error)
      throw error
    }
  }

  /**
   * 获取当前盒子裁剪配置
   */
  getBoxClipConfig(): BoxClipConfig | null {
    return this.boxClipConfig ? { ...this.boxClipConfig } : null
  }

  /**
   * 获取当前模型裁剪配置
   */
  getModelClipConfig(): ModelClipConfig | null {
    return this.modelClipConfig ? { ...this.modelClipConfig } : null
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.disableBoxClip()
    this.disableModelClip()
  }
}
