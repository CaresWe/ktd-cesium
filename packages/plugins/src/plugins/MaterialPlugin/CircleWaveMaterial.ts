/**
 * CircleWaveMaterial - 圆形扩散效果材质
 */
import * as Cesium from 'cesium'
import CircleWaveShader from './shaders/CircleWave.glsl?raw'

const defaultColor = new Cesium.Color(0, 0, 0, 0)
const defaultCount = 2
const defaultGradient = 0.1

/**
 * CircleWaveMaterial 配置选项
 */
export interface CircleWaveMaterialOptions {
  color?: Cesium.Color
  duration?: number
  count?: number
  gradient?: number
}

/**
 * 圆形单个扩散效果材质
 */
export class CircleWaveMaterial {
  private _definitionChanged: Cesium.Event
  private _color: Cesium.Property | undefined
  private _colorSubscription: Cesium.Event.RemoveCallback | undefined
  private _duration: number
  private _count: number
  private _gradient: number
  private _time: number | undefined

  constructor(options: CircleWaveMaterialOptions = {}) {
    this._definitionChanged = new Cesium.Event()
    this._color = undefined
    this._colorSubscription = undefined

    this.color = options.color ?? defaultColor
    this._duration = options.duration ?? 1000
    this._count = options.count ?? defaultCount
    if (this._count <= 0) this._count = 1

    this._gradient = options.gradient ?? defaultGradient
    if (this._gradient < 0) this._gradient = 0
    if (this._gradient > 1) this._gradient = 1

    this._time = undefined
  }

  get isConstant(): boolean {
    return false
  }

  get definitionChanged(): Cesium.Event {
    return this._definitionChanged
  }

  /**
   * Gets the Material type at the provided time.
   */
  getType(_time: Cesium.JulianDate): string {
    return 'CircleWaveMaterial'
  }

  /**
   * Gets the value of the property at the provided time.
   */
  getValue(time: Cesium.JulianDate, result?: Record<string, unknown>): Record<string, unknown> {
    if (!result) {
      result = {}
    }

    // Get color value
    if (this._color) {
      if (typeof (this._color as Cesium.Property).getValue === 'function') {
        result.color = (this._color as Cesium.Property).getValue(time) || defaultColor
      } else {
        result.color = this._color
      }
    } else {
      result.color = defaultColor
    }

    if (this._time === undefined) {
      this._time = new Date().getTime()
    }
    result.time = (new Date().getTime() - this._time) / this._duration
    result.count = this._count
    result.gradient = 1 + 10 * (1 - this._gradient)
    return result
  }

  /**
   * Compares this property to the provided property
   */
  equals(other?: CircleWaveMaterial): boolean {
    if (this === other) {
      return true
    }
    if (!other || !(other instanceof CircleWaveMaterial)) {
      return false
    }

    // Compare colors
    if (this._color === other._color) {
      return true
    }
    if (!this._color || !other._color) {
      return false
    }

    // If both are Property objects with equals method
    if (
      typeof (this._color as Cesium.Property).equals === 'function' &&
      typeof (other._color as Cesium.Property).equals === 'function'
    ) {
      return (this._color as Cesium.Property).equals(other._color as Cesium.Property)
    }

    // Direct comparison
    return this._color === other._color
  }

  get color(): Cesium.Property | Cesium.Color {
    return this._color as Cesium.Property
  }

  set color(value: Cesium.Property | Cesium.Color) {
    if (this._color !== value) {
      if (this._colorSubscription) {
        this._colorSubscription()
        this._colorSubscription = undefined
      }

      this._color = value as Cesium.Property

      if (value && typeof (value as Cesium.Property).definitionChanged === 'object') {
        this._colorSubscription = (value as Cesium.Property).definitionChanged.addEventListener(
          () => {
            this._definitionChanged.raiseEvent(this)
          }
        )
      }

      this._definitionChanged.raiseEvent(this)
    }
  }
}

// 静态初始化材质
const MaterialStatic = Cesium.Material as unknown as CesiumMaterialStatic
MaterialStatic.CircleWaveMaterialType = 'CircleWaveMaterial'

MaterialStatic._materialCache.addMaterial('CircleWaveMaterial', {
  fabric: {
    type: 'CircleWaveMaterial',
    uniforms: {
      color: { red: 1.0, green: 0.0, blue: 0.0, alpha: 1.0 },
      time: 1,
      count: defaultCount,
      gradient: defaultGradient
    },
    source: CircleWaveShader
  },
  translucent: () => true
})
