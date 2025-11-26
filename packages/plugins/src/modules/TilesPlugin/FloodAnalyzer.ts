import {
  Cesium3DTileset,
  Cesium3DTileStyle,
  Color as CesiumColor,
  Entity,
  Cartesian3,
  Cartographic,
  Math as CesiumMath,
  PolygonHierarchy,
  JulianDate
} from 'cesium'
import type { FloodAnalysisConfig, RegionalFloodConfig } from './types'

/**
 * 淹没分析器
 * 支持两种模式:
 * 1. 全局淹没分析 - 对整个 3D Tiles 模型进行淹没分析
 * 2. 局部淹没分析 - 基于绘制的 polygon 进行区域性淹没分析
 */
export class FloodAnalyzer {
  private tileset: Cesium3DTileset
  private config: FloodAnalysisConfig | null = null
  private regionalConfig: RegionalFloodConfig | null = null
  private animationFrame: number | null = null
  private isAnimating = false
  private startTime = 0
  private mode: 'global' | 'regional' = 'global'

  constructor(tileset: Cesium3DTileset) {
    this.tileset = tileset
  }

  /**
   * 启用全局淹没分析
   */
  enable(config: FloodAnalysisConfig): void {
    try {
      this.mode = 'global'
      this.config = config
      this.regionalConfig = null

      // 应用初始水位样式
      this.updateWaterLevel(config.currentHeight)

      console.log('Global flood analysis enabled')
    } catch (error) {
      console.error('Failed to enable flood analysis:', error)
      throw error
    }
  }

  /**
   * 启用局部淹没分析（基于绘制的polygon）
   * @param polygon - GraphicsPlugin 绘制的 polygon entity
   * @param config - 区域淹没配置
   */
  enableRegionalFlood(polygon: Entity, config: RegionalFloodConfig): void {
    try {
      this.mode = 'regional'
      this.regionalConfig = {
        ...config,
        polygon
      }
      this.config = null

      // 获取polygon的边界坐标
      const positions = this.getPolygonPositions(polygon)
      if (!positions || positions.length === 0) {
        throw new Error('Invalid polygon: no positions found')
      }

      // 应用区域淹没样式
      this.updateRegionalFlood(config.currentHeight, positions)

      console.log('Regional flood analysis enabled', {
        polygonId: polygon.id,
        positionCount: positions.length,
        currentHeight: config.currentHeight
      })
    } catch (error) {
      console.error('Failed to enable regional flood analysis:', error)
      throw error
    }
  }

  /**
   * 从 Entity 获取 polygon 的坐标
   */
  private getPolygonPositions(entity: Entity): Cartesian3[] {
    try {
      if (!entity.polygon || !entity.polygon.hierarchy) {
        throw new Error('Entity is not a valid polygon')
      }

      const hierarchy = entity.polygon.hierarchy.getValue(JulianDate.now())

      if (hierarchy instanceof PolygonHierarchy) {
        return hierarchy.positions
      }

      if (Array.isArray(hierarchy)) {
        return hierarchy
      }

      // 尝试从扩展属性获取
      const extendedEntity = entity as Entity & { _positions_draw?: Cartesian3[] }
      if (extendedEntity._positions_draw) {
        return extendedEntity._positions_draw
      }

      throw new Error('Could not extract positions from polygon entity')
    } catch (error) {
      console.error('Failed to get polygon positions:', error)
      throw error
    }
  }

  /**
   * 更新水位高度
   */
  updateHeight(height: number): void {
    try {
      if (this.mode === 'global') {
        if (!this.config) {
          throw new Error('Flood analysis not initialized')
        }

        // 限制在范围内
        const clampedHeight = Math.max(
          this.config.minHeight,
          Math.min(this.config.maxHeight, height)
        )

        this.config.currentHeight = clampedHeight
        this.updateWaterLevel(clampedHeight)

        // 触发回调
        if (this.config.onHeightChange) {
          this.config.onHeightChange(clampedHeight)
        }
      } else {
        // regional mode
        if (!this.regionalConfig) {
          throw new Error('Regional flood analysis not initialized')
        }

        const clampedHeight = Math.max(
          this.regionalConfig.minHeight,
          Math.min(this.regionalConfig.maxHeight, height)
        )

        this.regionalConfig.currentHeight = clampedHeight

        const positions = this.getPolygonPositions(this.regionalConfig.polygon)
        this.updateRegionalFlood(clampedHeight, positions)

        if (this.regionalConfig.onHeightChange) {
          this.regionalConfig.onHeightChange(clampedHeight)
        }
      }
    } catch (error) {
      console.error('Failed to update flood height:', error)
      throw error
    }
  }

  /**
   * 更新全局水位样式
   */
  private updateWaterLevel(height: number): void {
    try {
      if (!this.config) return

      const waterColor = this.config.waterColor ?? CesiumColor.fromCssColorString('rgba(0, 150, 255, 0.6)')
      const waterAlpha = this.config.waterAlpha ?? 0.6

      // 创建样式：低于水位的部分显示水色
      const style = new Cesium3DTileStyle({
        color: {
          conditions: [
            // 如果模型高度低于水位，显示水色
            [`\${Height} <= ${height}`, `color('${waterColor.withAlpha(waterAlpha).toCssColorString()}')`],
            // 否则显示原色
            ['true', 'color("#ffffff")']
          ]
        }
      })

      this.tileset.style = style
    } catch (error) {
      console.error('Failed to update water level style:', error)
      throw error
    }
  }

  /**
   * 更新区域淹没样式
   */
  private updateRegionalFlood(height: number, polygonPositions: Cartesian3[]): void {
    try {
      if (!this.regionalConfig) return

      const waterColor = this.regionalConfig.waterColor ?? CesiumColor.fromCssColorString('rgba(0, 150, 255, 0.6)')
      const waterAlpha = this.regionalConfig.waterAlpha ?? 0.6

      // 计算 polygon 的边界框（用于优化判断）
      const bounds = this.calculateBounds(polygonPositions)

      // 创建样式条件表达式
      // 由于 Cesium3DTileStyle 不支持自定义函数，我们使用边界框近似
      const style = new Cesium3DTileStyle({
        color: {
          conditions: [
            // 首先检查是否在边界框内且低于水位
            [
              `\${Longitude} >= ${bounds.west} && \${Longitude} <= ${bounds.east} && ` +
              `\${Latitude} >= ${bounds.south} && \${Latitude} <= ${bounds.north} && ` +
              `\${Height} <= ${height}`,
              `color('${waterColor.withAlpha(waterAlpha).toCssColorString()}')`
            ],
            // 否则显示原色
            ['true', 'color("#ffffff")']
          ]
        }
      })

      this.tileset.style = style

      console.log('Regional flood style updated', {
        height,
        bounds,
        waterColor: waterColor.toCssColorString()
      })
    } catch (error) {
      console.error('Failed to update regional flood style:', error)
      throw error
    }
  }

  /**
   * 计算多边形边界框
   */
  private calculateBounds(positions: Cartesian3[]): {
    west: number
    east: number
    south: number
    north: number
  } {
    const cartos = positions.map((pos) => Cartographic.fromCartesian(pos))

    let west = Number.MAX_VALUE
    let east = -Number.MAX_VALUE
    let south = Number.MAX_VALUE
    let north = -Number.MAX_VALUE

    cartos.forEach((carto) => {
      const lon = CesiumMath.toDegrees(carto.longitude)
      const lat = CesiumMath.toDegrees(carto.latitude)

      west = Math.min(west, lon)
      east = Math.max(east, lon)
      south = Math.min(south, lat)
      north = Math.max(north, lat)
    })

    return { west, east, south, north }
  }

  /**
   * 开始淹没动画
   */
  startAnimation(): void {
    try {
      const config = this.mode === 'global' ? this.config : this.regionalConfig

      if (!config) {
        throw new Error('Flood analysis not initialized')
      }

      if (this.isAnimating) {
        console.warn('Animation already running')
        return
      }

      this.isAnimating = true
      this.startTime = Date.now()

      const animate = () => {
        if (!this.isAnimating) return

        const currentConfig = this.mode === 'global' ? this.config : this.regionalConfig
        if (!currentConfig) return

        const elapsed = (Date.now() - this.startTime) / 1000 // 秒
        const speed = currentConfig.floodSpeed ?? 1 // 米/秒
        const newHeight = currentConfig.minHeight + elapsed * speed

        if (newHeight >= currentConfig.maxHeight) {
          // 达到最大水位，停止动画
          this.updateHeight(currentConfig.maxHeight)
          this.stopAnimation()
        } else {
          this.updateHeight(newHeight)
          this.animationFrame = requestAnimationFrame(animate)
        }
      }

      animate()
      console.log(`${this.mode === 'global' ? 'Global' : 'Regional'} flood animation started`)
    } catch (error) {
      console.error('Failed to start flood animation:', error)
      throw error
    }
  }

  /**
   * 停止淹没动画
   */
  stopAnimation(): void {
    try {
      if (this.animationFrame !== null) {
        cancelAnimationFrame(this.animationFrame)
        this.animationFrame = null
      }

      this.isAnimating = false
      console.log('Flood animation stopped')
    } catch (error) {
      console.error('Failed to stop flood animation:', error)
    }
  }

  /**
   * 禁用淹没分析
   */
  disable(): void {
    try {
      this.stopAnimation()

      // 重置样式
      this.tileset.style = undefined

      this.config = null
      this.regionalConfig = null
      console.log('Flood analysis disabled')
    } catch (error) {
      console.error('Failed to disable flood analysis:', error)
      throw error
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): FloodAnalysisConfig | RegionalFloodConfig | null {
    if (this.mode === 'global') {
      return this.config ? { ...this.config } : null
    } else {
      return this.regionalConfig ? { ...this.regionalConfig } : null
    }
  }

  /**
   * 获取当前模式
   */
  getMode(): 'global' | 'regional' {
    return this.mode
  }

  /**
   * 是否正在动画
   */
  isRunning(): boolean {
    return this.isAnimating
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.disable()
  }
}
