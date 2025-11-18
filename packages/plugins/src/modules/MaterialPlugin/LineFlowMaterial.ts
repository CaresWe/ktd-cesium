/**
 * LineFlowMaterial - 线状流动效果材质
 */
import * as Cesium from 'cesium'
import LineFlowShader from './shaders/LineFlow.glsl?raw'
import LineFlow2Shader from './shaders/LineFlow2.glsl?raw'

const defaultColor = new Cesium.Color(0, 0, 0, 0)
const defaultBgColor = new Cesium.Color(1, 1, 1)

/**
 * LineFlowMaterial 配置选项
 */
export interface LineFlowMaterialOptions {
  color?: Cesium.Color
  url?: string
  duration?: number
  repeat?: Cesium.Cartesian2
  axisY?: boolean
  bgUrl?: string
  bgColor?: Cesium.Color
}

/**
 * 线状流动效果材质
 */
export class LineFlowMaterial {
  private _definitionChanged: Cesium.Event
  private _color: Cesium.Property | undefined
  private _colorSubscription: Cesium.Event.RemoveCallback | undefined
  private _materialType: string
  private _materialImage: string | undefined
  private _time: number | undefined
  private _duration: number
  private _isInvalid: boolean

  public url: string | undefined
  public axisY: boolean
  public bgUrl: string | undefined
  public bgColor: Cesium.Color

  constructor(options: LineFlowMaterialOptions = {}) {
    this._definitionChanged = new Cesium.Event()
    this._color = undefined
    this._colorSubscription = undefined

    this.color = options.color ?? defaultColor
    this.url = options.url

    // 如果没有url,标记为无效但不要提前返回，确保所有属性都被初始化
    if (!this.url) {
      this._isInvalid = true
      this._materialType = Cesium.Material.ColorType
      this._materialImage = undefined
      this._time = undefined
      this._duration = 1000
      this.axisY = false
      this.bgUrl = undefined
      this.bgColor = defaultBgColor
      return
    }

    this.axisY = Boolean(options.axisY)
    this.bgUrl = options.bgUrl
    this.bgColor = options.bgColor ?? defaultBgColor
    this._duration = options.duration ?? 1000

    const material = getImageMaterial(
      this.url,
      this.bgUrl,
      options.repeat,
      Boolean(options.axisY),
      this.bgColor
    )

    this._materialType = material.type
    this._materialImage = material.image
    this._time = undefined
    this._isInvalid = false
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
    if (this._isInvalid) {
      return Cesium.Material.ColorType
    }
    return this._materialType
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

    if (this._isInvalid) {
      return result
    }

    result.image = this._materialImage
    if (this._time === undefined) {
      this._time = new Date().getTime()
    }
    result.time = (new Date().getTime() - this._time) / this._duration
    return result
  }

  /**
   * Compares this property to the provided property
   */
  equals(other?: LineFlowMaterial): boolean {
    if (this === other) {
      return true
    }
    if (!other || !(other instanceof LineFlowMaterial)) {
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

// 静态方法，处理材质
let cacheIdx = 0
const nameEx = 'AnimationLine'

interface MaterialResult {
  type: string
  image: string
}

function getImageMaterial(
  imgurl: string,
  bgUrl: string | undefined,
  repeat: Cesium.Cartesian2 | undefined,
  axisY: boolean,
  bgColor: Cesium.Color
): MaterialResult {
  cacheIdx++
  const typeName = nameEx + cacheIdx + 'Type'
  const imageName = nameEx + cacheIdx + 'Image'

  const MaterialStatic = Cesium.Material as unknown as CesiumMaterialStatic
  MaterialStatic[typeName] = typeName
  MaterialStatic[imageName] = imgurl

  if (bgUrl) {
    // 存在2张url的，用叠加融合的效果
    MaterialStatic._materialCache.addMaterial(typeName, {
      fabric: {
        type: MaterialStatic.PolylineArrowLinkType,
        uniforms: {
          color: { red: 1.0, green: 0.0, blue: 0.0, alpha: 1.0 },
          image: imgurl,
          time: 0,
          repeat: repeat ?? new Cesium.Cartesian2(1.0, 1.0),
          axisY: axisY,
          image2: bgUrl,
          bgColor: {
            red: bgColor.red,
            green: bgColor.green,
            blue: bgColor.blue,
            alpha: bgColor.alpha
          }
        },
        source: LineFlow2Shader
      },
      translucent: () => true
    })
  } else {
    MaterialStatic._materialCache.addMaterial(typeName, {
      fabric: {
        type: typeName,
        uniforms: {
          color: { red: 1.0, green: 0.0, blue: 0.0, alpha: 1.0 },
          image: imgurl,
          time: 0,
          repeat: repeat ?? new Cesium.Cartesian2(1.0, 1.0),
          axisY: axisY
        },
        source: LineFlowShader
      },
      translucent: () => true
    })
  }

  return {
    type: typeName,
    image: imgurl
  }
}
