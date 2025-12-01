/**
 * WaterMaterial - 水面材质
 * 支持反射水面、波纹动画、流动效果
 */
import * as Cesium from 'cesium'
import WaterSurfaceShader from './shaders/WaterSurface.glsl?raw'

/**
 * 波浪类型
 */
export type WaveType = 'calm' | 'ripple' | 'wave' | 'turbulent'

/**
 * 默认法线贴图（1x1 透明图）
 */
const DEFAULT_NORMAL_MAP =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFeAJ5gJqGJAAAAABJRU5ErkJggg=='

/**
 * 默认颜色
 */
const DEFAULT_BASE_COLOR = new Cesium.Color(0.0, 0.3, 0.5, 0.8)
const DEFAULT_BLEND_COLOR = new Cesium.Color(0.0, 0.5, 0.7, 0.8)

/**
 * 波浪参数预设
 */
const WAVE_PARAMS: Record<WaveType, { frequency: number; amplitude: number; speed: number }> = {
  calm: { frequency: 2.0, amplitude: 0.002, speed: 0.002 },
  ripple: { frequency: 8.0, amplitude: 0.01, speed: 0.005 },
  wave: { frequency: 15.0, amplitude: 0.02, speed: 0.01 },
  turbulent: { frequency: 25.0, amplitude: 0.04, speed: 0.02 }
}

/**
 * WaterMaterial 配置选项
 */
export interface WaterMaterialOptions {
  /** 基础水体颜色 */
  baseWaterColor?: Cesium.Color | string
  /** 混合颜色 */
  blendColor?: Cesium.Color | string
  /** 法线贴图 URL */
  normalMap?: string
  /** 波浪类型 */
  waveType?: WaveType
  /** 波浪频率（覆盖 waveType 的预设） */
  frequency?: number
  /** 波浪振幅（覆盖 waveType 的预设） */
  amplitude?: number
  /** 动画速度（覆盖 waveType 的预设） */
  animationSpeed?: number
  /** 镜面反射强度 */
  specularIntensity?: number
  /** 颜色渐变因子 */
  fadeFactor?: number
  /** 流动方向（角度，0-360） */
  flowDirection?: number
  /** 流动速度 */
  flowSpeed?: number
}

/**
 * 水面材质类
 */
export class WaterMaterial {
  private _definitionChanged: Cesium.Event
  private _materialType: string
  private _uniforms: {
    normalMap: string
    baseWaterColor: Cesium.Color
    blendColor: Cesium.Color
    frequency: number
    animationSpeed: number
    amplitude: number
    specularIntensity: number
    fadeFactor: number
    flowDirection: number
    flowSpeed: number
  }

  constructor(options: WaterMaterialOptions = {}) {
    this._definitionChanged = new Cesium.Event()

    // 获取波浪参数
    const waveParams = WAVE_PARAMS[options.waveType || 'ripple']

    // 解析颜色
    const baseWaterColor = this.parseColor(options.baseWaterColor) || DEFAULT_BASE_COLOR
    const blendColor = this.parseColor(options.blendColor) || DEFAULT_BLEND_COLOR

    // 初始化 uniforms
    this._uniforms = {
      normalMap: options.normalMap || DEFAULT_NORMAL_MAP,
      baseWaterColor: baseWaterColor,
      blendColor: blendColor,
      frequency: options.frequency ?? waveParams.frequency,
      animationSpeed: options.animationSpeed ?? waveParams.speed,
      amplitude: options.amplitude ?? waveParams.amplitude,
      specularIntensity: options.specularIntensity ?? 0.5,
      fadeFactor: options.fadeFactor ?? 0.3,
      flowDirection: options.flowDirection ?? 0,
      flowSpeed: options.flowSpeed ?? 1.0
    }

    // 创建唯一的材质类型名称
    this._materialType = 'WaterSurface_' + Date.now()

    // 注册材质
    const MaterialStatic = Cesium.Material as unknown as CesiumMaterialStatic
    MaterialStatic._materialCache.addMaterial(this._materialType, {
      fabric: {
        type: this._materialType,
        uniforms: {
          normalMap: this._uniforms.normalMap,
          baseWaterColor: {
            red: this._uniforms.baseWaterColor.red,
            green: this._uniforms.baseWaterColor.green,
            blue: this._uniforms.baseWaterColor.blue,
            alpha: this._uniforms.baseWaterColor.alpha
          },
          blendColor: {
            red: this._uniforms.blendColor.red,
            green: this._uniforms.blendColor.green,
            blue: this._uniforms.blendColor.blue,
            alpha: this._uniforms.blendColor.alpha
          },
          frequency: this._uniforms.frequency,
          animationSpeed: this._uniforms.animationSpeed,
          amplitude: this._uniforms.amplitude,
          specularIntensity: this._uniforms.specularIntensity,
          fadeFactor: this._uniforms.fadeFactor,
          flowDirection: this._uniforms.flowDirection,
          flowSpeed: this._uniforms.flowSpeed
        },
        source: WaterSurfaceShader
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
  equals(other?: WaterMaterial): boolean {
    return this === other
  }

  /**
   * 解析颜色
   */
  private parseColor(color: string | Cesium.Color | undefined): Cesium.Color | undefined {
    if (!color) return undefined
    if (color instanceof Cesium.Color) return color
    if (typeof color === 'string') {
      return Cesium.Color.fromCssColorString(color)
    }
    return undefined
  }

  /**
   * 更新基础水体颜色
   */
  setBaseWaterColor(color: Cesium.Color | string): void {
    const parsedColor = this.parseColor(color)
    if (parsedColor) {
      this._uniforms.baseWaterColor = parsedColor
      this._definitionChanged.raiseEvent(this)
    }
  }

  /**
   * 更新混合颜色
   */
  setBlendColor(color: Cesium.Color | string): void {
    const parsedColor = this.parseColor(color)
    if (parsedColor) {
      this._uniforms.blendColor = parsedColor
      this._definitionChanged.raiseEvent(this)
    }
  }

  /**
   * 更新波浪频率
   */
  setFrequency(frequency: number): void {
    this._uniforms.frequency = frequency
    this._definitionChanged.raiseEvent(this)
  }

  /**
   * 更新动画速度
   */
  setAnimationSpeed(speed: number): void {
    this._uniforms.animationSpeed = speed
    this._definitionChanged.raiseEvent(this)
  }

  /**
   * 更新波浪振幅
   */
  setAmplitude(amplitude: number): void {
    this._uniforms.amplitude = amplitude
    this._definitionChanged.raiseEvent(this)
  }

  /**
   * 更新镜面反射强度
   */
  setSpecularIntensity(intensity: number): void {
    this._uniforms.specularIntensity = intensity
    this._definitionChanged.raiseEvent(this)
  }

  /**
   * 更新渐变因子
   */
  setFadeFactor(factor: number): void {
    this._uniforms.fadeFactor = factor
    this._definitionChanged.raiseEvent(this)
  }

  /**
   * 更新流动方向
   */
  setFlowDirection(direction: number): void {
    this._uniforms.flowDirection = direction
    this._definitionChanged.raiseEvent(this)
  }

  /**
   * 更新流动速度
   */
  setFlowSpeed(speed: number): void {
    this._uniforms.flowSpeed = speed
    this._definitionChanged.raiseEvent(this)
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
 * 创建水面材质的便捷函数
 */
export function createWaterMaterial(options: WaterMaterialOptions = {}): Cesium.Material {
  const waterMaterial = new WaterMaterial(options)
  return waterMaterial.createMaterial()
}
