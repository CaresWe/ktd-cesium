/**
 * VideoMaterial - 视频融合材质
 * 支持视频纹理、颜色调整、透明度控制
 */
import * as Cesium from 'cesium'
import VideoFusionShader from './shaders/VideoFusion.glsl?raw'

/**
 * VideoMaterial 配置选项
 */
export interface VideoMaterialOptions {
  /** 视频元素或纹理 */
  videoSource: HTMLVideoElement | HTMLCanvasElement | string
  /** 透明度 (0-1) */
  opacity?: number
  /** 亮度 (0-2, 1为正常) */
  brightness?: number
  /** 对比度 (0-2, 1为正常) */
  contrast?: number
  /** 饱和度 (0-2, 1为正常) */
  saturation?: number
  /** 色相调整 (-180 到 180) */
  hue?: number
}

/**
 * 视频融合材质类
 */
export class VideoMaterial {
  private _definitionChanged: Cesium.Event
  private _materialType: string
  private _uniforms: {
    videoTexture: HTMLVideoElement | HTMLCanvasElement | string
    opacity: number
    brightness: number
    contrast: number
    saturation: number
    hue: number
  }

  constructor(options: VideoMaterialOptions) {
    this._definitionChanged = new Cesium.Event()

    // 初始化 uniforms
    this._uniforms = {
      videoTexture: options.videoSource,
      opacity: options.opacity ?? 1.0,
      brightness: options.brightness ?? 1.0,
      contrast: options.contrast ?? 1.0,
      saturation: options.saturation ?? 1.0,
      hue: options.hue ?? 0
    }

    // 创建唯一的材质类型名称
    this._materialType = 'VideoFusion_' + Date.now()

    // 注册材质
    const MaterialStatic = Cesium.Material as unknown as CesiumMaterialStatic
    MaterialStatic._materialCache.addMaterial(this._materialType, {
      fabric: {
        type: this._materialType,
        uniforms: {
          videoTexture: this._uniforms.videoTexture,
          opacity: this._uniforms.opacity,
          brightness: this._uniforms.brightness,
          contrast: this._uniforms.contrast,
          saturation: this._uniforms.saturation,
          hue: this._uniforms.hue
        },
        source: VideoFusionShader
      }
    })
  }

  get isConstant(): boolean {
    return false
  }

  get definitionChanged(): Cesium.Event {
    return this._definitionChanged
  }

  /**
   * 获取材质类型
   */
  getType(_time: Cesium.JulianDate): string {
    return this._materialType
  }

  /**
   * 获取材质值
   */
  getValue(_time: Cesium.JulianDate, result?: Record<string, unknown>): Record<string, unknown> {
    if (!result) {
      result = {}
    }
    return result
  }

  /**
   * 比较材质
   */
  equals(other?: VideoMaterial): boolean {
    return this === other
  }

  /**
   * 更新视频源
   */
  setVideoSource(source: HTMLVideoElement | HTMLCanvasElement | string): void {
    this._uniforms.videoTexture = source
    this._definitionChanged.raiseEvent(this)
  }

  /**
   * 更新透明度
   */
  setOpacity(opacity: number): void {
    this._uniforms.opacity = Math.max(0, Math.min(1, opacity))
    this._definitionChanged.raiseEvent(this)
  }

  /**
   * 更新亮度
   */
  setBrightness(brightness: number): void {
    this._uniforms.brightness = Math.max(0, Math.min(2, brightness))
    this._definitionChanged.raiseEvent(this)
  }

  /**
   * 更新对比度
   */
  setContrast(contrast: number): void {
    this._uniforms.contrast = Math.max(0, Math.min(2, contrast))
    this._definitionChanged.raiseEvent(this)
  }

  /**
   * 更新饱和度
   */
  setSaturation(saturation: number): void {
    this._uniforms.saturation = Math.max(0, Math.min(2, saturation))
    this._definitionChanged.raiseEvent(this)
  }

  /**
   * 更新色相
   */
  setHue(hue: number): void {
    this._uniforms.hue = Math.max(-180, Math.min(180, hue))
    this._definitionChanged.raiseEvent(this)
  }

  /**
   * 获取当前透明度
   */
  getOpacity(): number {
    return this._uniforms.opacity
  }

  /**
   * 获取当前亮度
   */
  getBrightness(): number {
    return this._uniforms.brightness
  }

  /**
   * 获取当前对比度
   */
  getContrast(): number {
    return this._uniforms.contrast
  }

  /**
   * 获取当前饱和度
   */
  getSaturation(): number {
    return this._uniforms.saturation
  }

  /**
   * 获取当前色相
   */
  getHue(): number {
    return this._uniforms.hue
  }

  /**
   * 创建 Cesium.Material 实例
   */
  createMaterial(): Cesium.Material {
    return new Cesium.Material({
      fabric: {
        type: this._materialType
      }
    })
  }
}

/**
 * 创建视频材质的便捷函数
 */
export function createVideoMaterial(options: VideoMaterialOptions): Cesium.Material {
  const videoMaterial = new VideoMaterial(options)
  return videoMaterial.createMaterial()
}
