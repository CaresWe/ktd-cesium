import * as Cesium from 'cesium'
import { DrawPrimitiveBase } from './DrawPrimitiveBase'
import { getCurrentMousePosition } from '@ktd-cesium/shared'
import { defaultMessages } from '../../TooltipPlugin/messages'
import { GraphicsEventType } from '../../EventPlugin'
import { createVideoMaterial } from '../../MaterialPlugin'
import type {
  VideoFusionPrimitiveStyle,
  VideoFusionPrimitiveAttribute,
  VideoPlaybackState,
  VideoSourceType,
  VideoProjectionCamera,
  PrimitiveObject,
  HlsStatic,
  HlsInstance,
  HlsErrorData,
  FlvStatic,
  FlvInstance
} from '../types'

// HLS.js 和 flv.js 全局声明
declare const Hls: HlsStatic | undefined
declare const flvjs: FlvStatic | undefined

/**
 * 扩展的视频Primitive接口
 */
interface ExtendedVideoPrimitive extends PrimitiveObject {
  _videoAttribute?: VideoFusionPrimitiveAttribute
  _positions_draw?: Cesium.Cartesian3[]
}

/**
 * 视频融合 Primitive 绘制类
 * 支持：
 * - 视频材质 (MP4, WebM, FLV, HLS)
 * - 2D 平面投射
 * - 3D 贴物投射
 * - 贴地投射
 * - 可编辑
 */
export class DrawPVideoFusion extends DrawPrimitiveBase {
  type = 'video-fusion-p'

  // 坐标位置相关
  protected _minPointNum = 4 // 矩形四个角点
  protected _maxPointNum = 4

  /** 视频 Primitive */
  protected videoPrimitive: Cesium.Primitive | Cesium.GroundPrimitive | null = null

  /** 视频元素 */
  protected videoElement: HTMLVideoElement | null = null

  /** 视频材质 */
  protected videoMaterial: Cesium.Material | null = null

  /** HLS 实例 */
  protected hlsInstance: HlsInstance | null = null

  /** FLV 实例 */
  protected flvInstance: FlvInstance | null = null

  /** 播放状态 */
  protected playbackState: VideoPlaybackState = {
    isPlaying: false,
    isPaused: true,
    currentTime: 0,
    duration: 0,
    buffered: 0,
    muted: false,
    volume: 1,
    playbackRate: 1,
    ended: false,
    loading: true,
    error: undefined
  }

  /** 视锥体实体 (用于3D投射可视化) */
  protected frustumEntity: Cesium.Entity | null = null

  /** 编辑控制点 */
  protected editPoints: Cesium.Entity[] = []

  /** 是否处于编辑模式 */
  protected isEditing = false

  /**
   * 创建视频 Primitive
   */
  protected override createPrimitive(attribute: Record<string, unknown>): Cesium.Primitive | null {
    this._positions_draw = []

    const videoAttr = attribute as VideoFusionPrimitiveAttribute
    const style = videoAttr.style

    // 创建视频元素
    this.createVideoElement(style)

    // 初始化播放参数
    if (this.videoElement) {
      this.videoElement.muted = style.muted ?? true
      this.videoElement.loop = style.loop ?? false
      this.videoElement.playbackRate = style.playbackRate ?? 1
      this.videoElement.volume = style.volume ?? 1
    }

    // 创建视频材质
    this.videoMaterial = this.createVideoMaterial(style)

    // 创建初始 Primitive（等待位置点）
    this.primitive = null

    return null
  }

  /**
   * 创建视频元素并加载视频
   */
  protected createVideoElement(style: VideoFusionPrimitiveStyle): void {
    this.videoElement = document.createElement('video')
    this.videoElement.crossOrigin = 'anonymous'
    this.videoElement.playsInline = true
    this.videoElement.style.display = 'none'
    document.body.appendChild(this.videoElement)

    // 绑定视频事件
    this.bindVideoEvents()

    // 加载视频
    if (style.videoUrl) {
      this.loadVideo(style.videoUrl, style.sourceType)
    }
  }

  /**
   * 加载视频
   */
  loadVideo(url: string, sourceType?: VideoSourceType): void {
    if (!this.videoElement) return

    // 清理之前的实例
    this.destroyVideoInstances()

    const type = sourceType || this.detectSourceType(url)

    switch (type) {
      case 'hls':
      case 'm3u8':
        this.loadHLS(url)
        break
      case 'flv':
        this.loadFLV(url)
        break
      default:
        // MP4, WebM 等原生支持格式
        this.videoElement.src = url
        break
    }
  }

  /**
   * 检测视频源类型
   */
  protected detectSourceType(url: string): VideoSourceType {
    const ext = url.split('?')[0].split('.').pop()?.toLowerCase()
    if (ext === 'm3u8' || url.includes('.m3u8')) return 'hls'
    if (ext === 'flv') return 'flv'
    if (ext === 'webm') return 'webm'
    return 'mp4'
  }

  /**
   * 加载 HLS 视频
   */
  protected loadHLS(url: string): void {
    if (typeof Hls === 'undefined') {
      console.warn('HLS.js not loaded. Please include hls.js library.')
      return
    }

    if (Hls.isSupported()) {
      this.hlsInstance = new Hls()
      this.hlsInstance.loadSource(url)
      this.hlsInstance.attachMedia(this.videoElement!)

      this.hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        this.playbackState.loading = false
      })

      this.hlsInstance.on(Hls.Events.ERROR, (_event: unknown, data: HlsErrorData) => {
        if (data.fatal) {
          this.playbackState.error = data.details
          this.fire(GraphicsEventType.DRAW_MOUSE_MOVE, {
            eventType: 'error',
            error: data.details
          })
        }
      })
    } else if (this.videoElement!.canPlayType('application/vnd.apple.mpegurl')) {
      // iOS Safari 原生支持
      this.videoElement!.src = url
    }
  }

  /**
   * 加载 FLV 视频
   */
  protected loadFLV(url: string): void {
    if (typeof flvjs === 'undefined') {
      console.warn('flv.js not loaded. Please include flv.js library.')
      return
    }

    if (flvjs.isSupported()) {
      this.flvInstance = flvjs.createPlayer({
        type: 'flv',
        url: url,
        isLive: url.includes('live') || url.startsWith('ws')
      })
      this.flvInstance.attachMediaElement(this.videoElement!)
      this.flvInstance.load()

      this.flvInstance.on(flvjs.Events.ERROR, (errorType: string, errorDetail: string) => {
        this.playbackState.error = `${errorType}: ${errorDetail}`
      })
    }
  }

  /**
   * 绑定视频事件
   */
  protected bindVideoEvents(): void {
    if (!this.videoElement) return

    this.videoElement.addEventListener('loadedmetadata', () => {
      this.playbackState.duration = this.videoElement!.duration
      this.playbackState.loading = false
    })

    this.videoElement.addEventListener('timeupdate', () => {
      this.playbackState.currentTime = this.videoElement!.currentTime
    })

    this.videoElement.addEventListener('play', () => {
      this.playbackState.isPlaying = true
      this.playbackState.isPaused = false
    })

    this.videoElement.addEventListener('pause', () => {
      this.playbackState.isPlaying = false
      this.playbackState.isPaused = true
    })

    this.videoElement.addEventListener('ended', () => {
      this.playbackState.ended = true
      this.playbackState.isPlaying = false
    })

    this.videoElement.addEventListener('error', () => {
      this.playbackState.error = this.videoElement!.error?.message
      this.playbackState.loading = false
    })

    this.videoElement.addEventListener('progress', () => {
      if (this.videoElement!.buffered.length > 0) {
        const bufferedEnd = this.videoElement!.buffered.end(this.videoElement!.buffered.length - 1)
        this.playbackState.buffered = bufferedEnd / this.videoElement!.duration
      }
    })
  }

  /**
   * 创建视频材质
   */
  protected createVideoMaterial(style: VideoFusionPrimitiveStyle): Cesium.Material {
    if (!this.videoElement) {
      throw new Error('Video element not created')
    }

    return createVideoMaterial({
      videoSource: this.videoElement,
      opacity: style.opacity,
      brightness: style.brightness,
      contrast: style.contrast,
      saturation: style.saturation,
      hue: style.hue
    })
  }

  /**
   * 解析颜色
   */
  protected parseColor(color: string | Cesium.Color | undefined): Cesium.Color | undefined {
    if (!color) return undefined
    if (color instanceof Cesium.Color) return color
    if (typeof color === 'string') {
      return Cesium.Color.fromCssColorString(color)
    }
    return undefined
  }

  /**
   * 绑定鼠标事件
   */
  override bindEvent(): void {
    let lastPointTemporary = false
    const positions = this._positions_draw as Cesium.Cartesian3[]

    // 左键点击添加角点
    this.bindClickEvent((position: Cesium.Cartesian2) => {
      let point = getCurrentMousePosition(this.viewer!.scene, position, null)
      if (!point && lastPointTemporary) {
        point = positions[positions.length - 1]
      }

      if (point) {
        if (lastPointTemporary) {
          positions.pop()
        }
        lastPointTemporary = false

        positions.push(point)
        this.updateVideoGeometry()

        this.fire(GraphicsEventType.DRAW_ADD_POINT, {
          drawtype: this.type,
          primitive: this.videoPrimitive,
          position: point,
          positions: positions
        })

        if (positions.length >= this._maxPointNum) {
          this.disable()
        }
      }
    })

    // 鼠标移动
    this.bindMoveEvent((position: Cesium.Cartesian2) => {
      if (positions.length === 0) {
        this.tooltip!.showAt(position, defaultMessages.draw.rectangle.start)
      } else if (positions.length < this._maxPointNum) {
        this.tooltip!.showAt(position, `点击添加第 ${positions.length + 1} 个角点`)
      } else {
        this.tooltip!.showAt(position, defaultMessages.draw.rectangle.end)
      }

      const point = getCurrentMousePosition(this.viewer!.scene, position, null)
      if (point && positions.length > 0 && positions.length < this._maxPointNum) {
        if (lastPointTemporary) {
          positions.pop()
        }
        lastPointTemporary = true

        positions.push(point)
        this.updateVideoGeometry()

        this.fire(GraphicsEventType.DRAW_MOUSE_MOVE, {
          drawtype: this.type,
          primitive: this.videoPrimitive,
          position: point,
          positions: positions
        })
      }
    })

    // 右键删除上一个点
    this.bindRightClickEvent((position: Cesium.Cartesian2) => {
      if (positions.length > 0) {
        positions.pop()
        if (lastPointTemporary && positions.length > 0) {
          positions.pop()
        }
        lastPointTemporary = false

        const point = getCurrentMousePosition(this.viewer!.scene, position, null)
        this.fire(GraphicsEventType.DRAW_REMOVE_POINT, {
          drawtype: this.type,
          primitive: this.videoPrimitive,
          position: point,
          positions: positions
        })

        this.updateVideoGeometry()
      }
    })
  }

  /**
   * 更新视频几何体
   */
  protected updateVideoGeometry(): void {
    const positions = this._positions_draw as Cesium.Cartesian3[]
    if (positions.length < 3) return

    // 移除旧的 Primitive
    if (this.videoPrimitive && this.primitives!.contains(this.videoPrimitive)) {
      this.primitives!.remove(this.videoPrimitive)
    }

    const videoAttr = (this.videoPrimitive as ExtendedVideoPrimitive)?._videoAttribute
    const style = videoAttr?.style || {}
    const projectionMode = style.projectionMode || '2d'

    // 根据投射模式创建不同的几何体
    if (projectionMode === 'ground') {
      this.createGroundPrimitive(positions, style)
    } else {
      this.createRegularPrimitive(positions, style)
    }
  }

  /**
   * 创建普通 Primitive (2D/3D投射)
   */
  protected createRegularPrimitive(positions: Cesium.Cartesian3[], style: VideoFusionPrimitiveStyle): void {
    const geometryInstance = new Cesium.GeometryInstance({
      geometry: new Cesium.PolygonGeometry({
        polygonHierarchy: new Cesium.PolygonHierarchy(positions),
        vertexFormat: Cesium.MaterialAppearance.MaterialSupport.ALL.vertexFormat,
        perPositionHeight: true
      })
    })

    this.videoPrimitive = new Cesium.Primitive({
      geometryInstances: geometryInstance,
      appearance: new Cesium.MaterialAppearance({
        material: this.videoMaterial!,
        translucent: (style.opacity ?? 1) < 1
      }),
      show: style.show !== false
    })

    ;(this.videoPrimitive as ExtendedVideoPrimitive)._videoAttribute = { style } as VideoFusionPrimitiveAttribute
    ;(this.videoPrimitive as ExtendedVideoPrimitive)._positions_draw = positions

    this.primitives!.add(this.videoPrimitive)
    this.primitive = this.videoPrimitive
  }

  /**
   * 创建贴地 Primitive
   */
  protected createGroundPrimitive(positions: Cesium.Cartesian3[], style: VideoFusionPrimitiveStyle): void {
    const geometryInstance = new Cesium.GeometryInstance({
      geometry: new Cesium.PolygonGeometry({
        polygonHierarchy: new Cesium.PolygonHierarchy(positions),
        vertexFormat: Cesium.MaterialAppearance.MaterialSupport.ALL.vertexFormat
      })
    })

    this.videoPrimitive = new Cesium.GroundPrimitive({
      geometryInstances: geometryInstance,
      appearance: new Cesium.MaterialAppearance({
        material: this.videoMaterial!,
        translucent: (style.opacity ?? 1) < 1
      }),
      show: style.show !== false,
      classificationType: style.classificationType || Cesium.ClassificationType.BOTH
    })

    ;(this.videoPrimitive as unknown as ExtendedVideoPrimitive)._videoAttribute = { style } as VideoFusionPrimitiveAttribute
    ;(this.videoPrimitive as unknown as ExtendedVideoPrimitive)._positions_draw = positions

    this.primitives!.add(this.videoPrimitive)
    this.primitive = this.videoPrimitive
  }

  /**
   * Primitive 绘制结束
   */
  protected override finishPrimitive(): void {
    if (!this.videoPrimitive) return

    const extPrimitive = this.videoPrimitive as ExtendedVideoPrimitive
    extPrimitive._positions_draw = this.getDrawPosition() as Cesium.Cartesian3[]

    // 自动播放
    const style = extPrimitive._videoAttribute?.style
    if (style?.autoPlay && this.videoElement) {
      this.play()
    }
  }

  // ==================== 视频控制方法 ====================

  /**
   * 播放视频
   */
  play(): Promise<void> {
    if (!this.videoElement) return Promise.resolve()
    return this.videoElement.play()
  }

  /**
   * 暂停视频
   */
  pause(): void {
    this.videoElement?.pause()
  }

  /**
   * 停止视频
   */
  stop(): void {
    if (this.videoElement) {
      this.videoElement.pause()
      this.videoElement.currentTime = 0
    }
  }

  /**
   * 跳转到指定时间
   */
  seek(time: number): void {
    if (this.videoElement) {
      this.videoElement.currentTime = time
    }
  }

  /**
   * 设置音量
   */
  setVolume(volume: number): void {
    if (this.videoElement) {
      this.videoElement.volume = Math.max(0, Math.min(1, volume))
      this.playbackState.volume = this.videoElement.volume
    }
  }

  /**
   * 设置静音
   */
  setMuted(muted: boolean): void {
    if (this.videoElement) {
      this.videoElement.muted = muted
      this.playbackState.muted = muted
    }
  }

  /**
   * 设置播放速率
   */
  setPlaybackRate(rate: number): void {
    if (this.videoElement) {
      this.videoElement.playbackRate = rate
      this.playbackState.playbackRate = rate
    }
  }

  /**
   * 获取播放状态
   */
  getPlaybackState(): VideoPlaybackState {
    return { ...this.playbackState }
  }

  // ==================== 样式更新方法 ====================

  /**
   * 更新视频样式
   */
  updateVideoStyle(style: Partial<VideoFusionPrimitiveStyle>): void {
    if (!this.videoMaterial) return

    if (style.opacity !== undefined) {
      this.videoMaterial.uniforms.opacity = style.opacity
    }
    if (style.brightness !== undefined) {
      this.videoMaterial.uniforms.brightness = style.brightness
    }
    if (style.contrast !== undefined) {
      this.videoMaterial.uniforms.contrast = style.contrast
    }
    if (style.saturation !== undefined) {
      this.videoMaterial.uniforms.saturation = style.saturation
    }
    if (style.hue !== undefined) {
      this.videoMaterial.uniforms.hue = style.hue
    }
  }

  /**
   * 设置视频显示/隐藏
   */
  setVisible(visible: boolean): void {
    if (this.videoPrimitive) {
      this.videoPrimitive.show = visible
    }
  }

  // ==================== 编辑功能 ====================

  /**
   * 启用编辑模式
   */
  enableEdit(): void {
    if (this.isEditing) return
    this.isEditing = true
    this.createEditPoints()
  }

  /**
   * 禁用编辑模式
   */
  disableEdit(): void {
    if (!this.isEditing) return
    this.isEditing = false
    this.removeEditPoints()
  }

  /**
   * 创建编辑控制点
   */
  protected createEditPoints(): void {
    const positions = (this.videoPrimitive as ExtendedVideoPrimitive)?._positions_draw
    if (!positions || !this.dataSource) return

    positions.forEach((pos, index) => {
      const point = this.dataSource!.entities.add({
        position: pos,
        point: {
          pixelSize: 12,
          color: Cesium.Color.YELLOW,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      })
      ;(point as any)._editIndex = index
      ;(point as any)._editType = 'corner'
      this.editPoints.push(point)
    })
  }

  /**
   * 移除编辑控制点
   */
  protected removeEditPoints(): void {
    if (!this.dataSource) return

    this.editPoints.forEach(point => {
      this.dataSource!.entities.remove(point)
    })
    this.editPoints = []
  }

  /**
   * 更新控制点位置
   */
  updateEditPoint(index: number, position: Cesium.Cartesian3): void {
    const positions = (this.videoPrimitive as ExtendedVideoPrimitive)?._positions_draw
    if (!positions || index >= positions.length) return

    positions[index] = position
    this.updateVideoGeometry()

    // 更新控制点实体位置
    if (this.editPoints[index]) {
      this.editPoints[index].position = new Cesium.ConstantPositionProperty(position)
    }
  }

  /**
   * 获取编辑控制点
   */
  getEditPoints(): Cesium.Entity[] {
    return [...this.editPoints]
  }

  // ==================== 3D 投射方法 ====================

  /**
   * 设置3D投射相机参数
   */
  setProjectionCamera(camera: VideoProjectionCamera): void {
    const extPrimitive = this.videoPrimitive as ExtendedVideoPrimitive
    if (extPrimitive?._videoAttribute) {
      extPrimitive._videoAttribute.camera = camera
    }

    // 更新视锥体可视化
    const style = extPrimitive?._videoAttribute?.style
    if (style?.showFrustum) {
      this.updateFrustumVisualization(camera, style)
    }
  }

  /**
   * 更新视锥体可视化
   */
  protected updateFrustumVisualization(camera: VideoProjectionCamera, style: VideoFusionPrimitiveStyle): void {
    // 移除旧的视锥体
    if (this.frustumEntity && this.dataSource) {
      this.dataSource.entities.remove(this.frustumEntity)
    }

    if (!this.dataSource) return

    // 创建视锥体线条
    const frustumColor = this.parseColor(style.frustumColor) || Cesium.Color.YELLOW

    // 计算视锥体的四个角点（用于未来扩展）
    // const halfFov = camera.fov / 2
    // const halfHeight = Math.tan(halfFov) * camera.far
    // const halfWidth = halfHeight * camera.aspectRatio

    // 这里简化处理，只显示视锥体轮廓线
    this.frustumEntity = this.dataSource.entities.add({
      position: camera.position,
      polyline: {
        positions: [camera.position],
        width: style.frustumLineWidth || 2,
        material: frustumColor
      }
    })
  }

  // ==================== 资源清理 ====================

  /**
   * 销毁视频相关实例
   */
  protected destroyVideoInstances(): void {
    if (this.hlsInstance) {
      this.hlsInstance.destroy()
      this.hlsInstance = null
    }
    if (this.flvInstance) {
      this.flvInstance.destroy()
      this.flvInstance = null
    }
  }

  /**
   * 清理资源
   */
  override disable(hasWB?: boolean): this {
    this.disableEdit()
    this.destroyVideoInstances()

    // 移除视频元素
    if (this.videoElement) {
      this.videoElement.pause()
      this.videoElement.src = ''
      this.videoElement.remove()
      this.videoElement = null
    }

    // 移除视锥体
    if (this.frustumEntity && this.dataSource) {
      this.dataSource.entities.remove(this.frustumEntity)
      this.frustumEntity = null
    }

    super.disable(hasWB)

    if (hasWB && this.videoPrimitive && this.primitives) {
      if (this.primitives.contains(this.videoPrimitive)) {
        this.primitives.remove(this.videoPrimitive)
      }
    }

    this.videoPrimitive = null
    this.videoMaterial = null
    return this
  }

  override toEntityType(): string {
    return 'video-fusion'
  }

  override removePrimitive(): void {
    this.disableEdit()
    this.destroyVideoInstances()

    if (this.videoElement) {
      this.videoElement.pause()
      this.videoElement.src = ''
      this.videoElement.remove()
      this.videoElement = null
    }

    if (this.frustumEntity && this.dataSource) {
      this.dataSource.entities.remove(this.frustumEntity)
      this.frustumEntity = null
    }

    if (this.videoPrimitive && this.primitives) {
      if (this.primitives.contains(this.videoPrimitive)) {
        this.primitives.remove(this.videoPrimitive)
      }
    }
    this.videoPrimitive = null
    this.videoMaterial = null
    this.primitive = null
  }
}
