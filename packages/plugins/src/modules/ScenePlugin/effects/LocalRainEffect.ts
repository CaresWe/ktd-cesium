import * as Cesium from 'cesium'
import type { Viewer as CesiumViewer, BillboardCollection, Billboard } from 'cesium'
import type { LocalRainEffectOptions, ILocalRainEffect } from '../types'
import { SceneEffectType } from '../types'

/**
 * 局部下雨效果
 */
export class LocalRainEffect implements ILocalRainEffect {
  name: string
  type = SceneEffectType.LOCAL_RAIN
  billboardCollection: BillboardCollection | null = null
  visible = true
  private viewer: CesiumViewer
  private rainDrops: Billboard[] = []
  private options: Required<Omit<LocalRainEffectOptions, 'positions'>> & {
    positions?: [number, number][]
  }
  private updateListener: (() => void) | null = null
  private polygonPositions: [number, number][] | null = null
  private boundingBox: {
    minLongitude: number
    minLatitude: number
    maxLongitude: number
    maxLatitude: number
  } | null = null

  constructor(viewer: CesiumViewer, options: LocalRainEffectOptions = {}) {
    this.viewer = viewer
    this.name = options.name || 'local-rain-effect'

    // 设置默认选项
    this.options = {
      name: this.name,
      positions: options.positions,
      minLongitude: options.minLongitude ?? -100,
      minLatitude: options.minLatitude ?? 30,
      maxLongitude: options.maxLongitude ?? -99.5,
      maxLatitude: options.maxLatitude ?? 30.5,
      dropWidth: options.dropWidth ?? 15,
      dropCount: options.dropCount ?? 5000,
      dropSpeed: options.dropSpeed ?? 50,
      dropImage:
        options.dropImage ||
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAAwCAYAAAA9ivJJAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QjhBODk5RTMyNzlGMTFFNkI3RTRCMzU4NzA2NjQ0QjMiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QjhBODk5RTQyNzlGMTFFNkI3RTRCMzU4NzA2NjQ0QjMiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpCOEE4OTlFMTI3OUYxMUU2QjdFNEIzNTg3MDY2NDRCMyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpCOEE4OTlFMjI3OUYxMUU2QjdFNEIzNTg3MDY2NDRCMyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pkl2ztMAAABrSURBVHjaYvz//z8DPgAEoDADAyMDFsCED6C6AQh/X7yYgS1DBMhABhgBqAZsgAUf4MAGgGwGXACIHRgYGP5jA0D2fwYcAFUNKi+AAZw0GAGxAx4AdB4TAiB2wAeg7gFqgNoHdB8gAAgwAJdLFOXTwQSrAAAAAElFTkSuQmCC'
    }

    // 设置多边形区域或边界框
    if (options.positions && options.positions.length >= 3) {
      this.polygonPositions = options.positions
      this.calculateBoundingBox()
    } else {
      this.boundingBox = {
        minLongitude: this.options.minLongitude,
        minLatitude: this.options.minLatitude,
        maxLongitude: this.options.maxLongitude,
        maxLatitude: this.options.maxLatitude
      }
    }

    this.init()
  }

  /**
   * 计算多边形的边界框
   */
  private calculateBoundingBox(): void {
    if (!this.polygonPositions || this.polygonPositions.length === 0) return

    let minLon = Infinity
    let minLat = Infinity
    let maxLon = -Infinity
    let maxLat = -Infinity

    for (const [lon, lat] of this.polygonPositions) {
      minLon = Math.min(minLon, lon)
      minLat = Math.min(minLat, lat)
      maxLon = Math.max(maxLon, lon)
      maxLat = Math.max(maxLat, lat)
    }

    this.boundingBox = {
      minLongitude: minLon,
      minLatitude: minLat,
      maxLongitude: maxLon,
      maxLatitude: maxLat
    }
  }

  /**
   * 判断点是否在多边形内（射线法）
   * @param lon 经度
   * @param lat 纬度
   * @returns 是否在多边形内
   */
  private isPointInPolygon(lon: number, lat: number): boolean {
    if (!this.polygonPositions) return true // 如果没有多边形，使用矩形边界

    let inside = false
    const vertices = this.polygonPositions
    const n = vertices.length

    for (let i = 0, j = n - 1; i < n; j = i++) {
      const [xi, yi] = vertices[i]
      const [xj, yj] = vertices[j]

      const intersect =
        yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi

      if (intersect) inside = !inside
    }

    return inside
  }

  /**
   * 初始化
   */
  private init(): void {
    // 创建 BillboardCollection
    this.billboardCollection = this.viewer.scene.primitives.add(
      new Cesium.BillboardCollection()
    ) as BillboardCollection

    // 添加雨滴
    this.addRainDrops()

    // 注册更新监听器
    this.updateListener = this.updatePositions.bind(this)
    this.viewer.scene.postRender.addEventListener(this.updateListener)
  }

  /**
   * 添加雨滴
   */
  private addRainDrops(): void {
    if (!this.billboardCollection || !this.boundingBox) return

    const { dropCount, dropWidth, dropImage } = this.options
    const { minLongitude, minLatitude, maxLongitude, maxLatitude } = this.boundingBox

    let addedCount = 0
    let attempts = 0
    const maxAttempts = dropCount * 10 // 防止无限循环

    // 生成雨滴位置，确保在多边形内
    while (addedCount < dropCount && attempts < maxAttempts) {
      attempts++

      // 在边界框内随机生成点
      const lon = minLongitude + Math.random() * (maxLongitude - minLongitude)
      const lat = minLatitude + Math.random() * (maxLatitude - minLatitude)

      // 如果指定了多边形，检查点是否在多边形内
      if (!this.isPointInPolygon(lon, lat)) {
        continue
      }

      const height = this.getRandomHeight()

      const billboard = this.billboardCollection.add({
        scaleByDistance: new Cesium.NearFarScalar(2000000, 0.8, 8000000, 0.3),
        position: Cesium.Cartesian3.fromDegrees(lon, lat, height),
        image: dropImage,
        width: dropWidth,
        height: dropWidth
      })

      this.rainDrops.push(billboard)
      addedCount++
    }

    if (addedCount < dropCount) {
      console.warn(
        `LocalRainEffect: Only ${addedCount}/${dropCount} rain drops were added. ` +
          `Consider using a larger polygon area or fewer drops.`
      )
    }
  }

  /**
   * 获取随机高度
   */
  private getRandomHeight(): number {
    return Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000
  }

  /**
   * 更新雨滴位置
   */
  updatePositions(): void {
    if (!this.visible) return

    this.rainDrops.forEach((billboard) => {
      this.updateBillboardPosition(billboard)
    })
  }

  /**
   * 更新单个雨滴位置
   */
  private updateBillboardPosition(billboard: Billboard): void {
    const ellipsoid = this.viewer.scene.globe.ellipsoid
    const cartographic = ellipsoid.cartesianToCartographic(billboard.position)
    const lat = Cesium.Math.toDegrees(cartographic.latitude)
    const lon = Cesium.Math.toDegrees(cartographic.longitude)
    let height = cartographic.height

    // 如果高度小于0，重新设置为随机高度
    if (height < 0) {
      height = this.getRandomHeight()
    } else {
      // 向下移动雨滴
      height -= this.options.dropSpeed
    }

    // 更新雨滴位置
    billboard.position = Cesium.Cartesian3.fromDegrees(lon, lat, height)
  }

  remove(): void {
    // 移除更新监听器
    if (this.updateListener) {
      this.viewer.scene.postRender.removeEventListener(this.updateListener)
      this.updateListener = null
    }

    // 移除 BillboardCollection
    if (this.billboardCollection) {
      this.viewer.scene.primitives.remove(this.billboardCollection)
      this.billboardCollection = null
    }

    this.rainDrops = []
  }

  show(): void {
    if (this.billboardCollection) {
      this.billboardCollection.show = true
      this.visible = true
    }
  }

  hide(): void {
    if (this.billboardCollection) {
      this.billboardCollection.show = false
      this.visible = false
    }
  }

  /**
   * 设置雨滴下落速度
   */
  setDropSpeed(speed: number): void {
    this.options.dropSpeed = speed
  }

  /**
   * 设置雨滴矩形区域
   */
  setRainArea(
    minLongitude: number,
    minLatitude: number,
    maxLongitude: number,
    maxLatitude: number
  ): void {
    this.options.minLongitude = minLongitude
    this.options.minLatitude = minLatitude
    this.options.maxLongitude = maxLongitude
    this.options.maxLatitude = maxLatitude

    // 清除多边形设置
    this.polygonPositions = null
    this.boundingBox = {
      minLongitude,
      minLatitude,
      maxLongitude,
      maxLatitude
    }

    // 重新生成雨滴
    this.remove()
    this.init()
  }

  /**
   * 设置雨滴多边形区域
   * @param positions 多边形顶点坐标数组 [longitude, latitude]
   */
  setRainPolygon(positions: [number, number][]): void {
    if (positions.length < 3) {
      console.error('LocalRainEffect: Polygon must have at least 3 points')
      return
    }

    this.options.positions = positions
    this.polygonPositions = positions
    this.calculateBoundingBox()

    // 重新生成雨滴
    this.remove()
    this.init()
  }

  /**
   * 获取当前雨滴区域配置
   */
  getRainArea():
    | { type: 'polygon'; positions: [number, number][] }
    | {
        type: 'rectangle'
        minLongitude: number
        minLatitude: number
        maxLongitude: number
        maxLatitude: number
      } {
    if (this.polygonPositions) {
      return {
        type: 'polygon',
        positions: this.polygonPositions
      }
    }

    return {
      type: 'rectangle',
      minLongitude: this.options.minLongitude,
      minLatitude: this.options.minLatitude,
      maxLongitude: this.options.maxLongitude,
      maxLatitude: this.options.maxLatitude
    }
  }
}
