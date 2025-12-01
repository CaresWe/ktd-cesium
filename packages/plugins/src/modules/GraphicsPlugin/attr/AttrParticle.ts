import * as Cesium from 'cesium'
import { cartesians2lonlats } from '@ktd-cesium/shared'
import type { ParticleSystemOptions } from '../draw/DrawParticle'

/**
 * 粒子系统样式配置接口
 */
export interface ParticleStyleConfig {
  /** 粒子图片路径 */
  image?: string
  /** 开始颜色 */
  startColor?: string | Cesium.Color
  /** 结束颜色 */
  endColor?: string | Cesium.Color
  /** 开始缩放 */
  startScale?: number
  /** 结束缩放 */
  endScale?: number
  /** 最小粒子生命周期（秒） */
  minimumParticleLife?: number
  /** 最大粒子生命周期（秒） */
  maximumParticleLife?: number
  /** 最小速度 */
  minimumSpeed?: number
  /** 最大速度 */
  maximumSpeed?: number
  /** 粒子大小 */
  particleSize?: number
  /** 发射率（每秒发射的粒子数） */
  emissionRate?: number
  /** 粒子系统生命周期（秒） */
  lifetime?: number
  /** 是否循环 */
  loop?: boolean
  /** 大小单位是否为米 */
  sizeInMeters?: boolean
  /** 发射器类型 */
  emitterType?: 'cone' | 'box' | 'circle' | 'sphere'
  /** 发射器参数 */
  emitterOptions?: number | { x: number; y: number; z: number }
  /** 发射器位置偏移 */
  emitterOffset?: { x: number; y: number; z: number }
  /** 发射器旋转（度） */
  emitterRotation?: { heading: number; pitch: number; roll: number }
  /** 粒子效果类型（预设） */
  effectType?: 'fire' | 'water' | 'explosion' | 'spray' | 'smoke' | 'custom'
  /** 重力效果类型 */
  gravityType?: 'none' | 'water' | 'smoke' | 'spray'
  [key: string]: unknown
}

/**
 * Entity 扩展接口，包含 attribute 属性
 */
export interface EntityWithAttribute extends Cesium.Entity {
  position: Cesium.PositionProperty
  attribute?: {
    type?: string
    style?: ParticleStyleConfig
    attr?: Record<string, unknown>
    [key: string]: unknown
  }
}

/**
 * GeoJSON Feature 接口
 */
export interface GeoJSONFeature {
  type: 'Feature'
  properties: Record<string, unknown>
  geometry: {
    type: 'Point'
    coordinates: number[]
  }
}

/**
 * 将样式配置转换为粒子系统选项
 * @param style - 样式配置对象
 * @returns 粒子系统选项
 */
export function style2ParticleOptions(style: ParticleStyleConfig): ParticleSystemOptions {
  // 处理颜色
  const parseColor = (color: string | Cesium.Color | undefined, defaultColor: Cesium.Color): Cesium.Color => {
    if (!color) return defaultColor
    if (color instanceof Cesium.Color) return color
    return Cesium.Color.fromCssColorString(color as string)
  }

  // 处理发射器偏移
  const emitterOffset = style.emitterOffset
    ? new Cesium.Cartesian3(style.emitterOffset.x, style.emitterOffset.y, style.emitterOffset.z)
    : new Cesium.Cartesian3(-4.0, 0.0, 1.4)

  // 处理发射器参数
  let emitterOptions: number | Cesium.Cartesian3 | undefined
  if (typeof style.emitterOptions === 'number') {
    emitterOptions = style.emitterOptions
  } else if (style.emitterOptions && typeof style.emitterOptions === 'object') {
    const opts = style.emitterOptions as { x: number; y: number; z: number }
    emitterOptions = new Cesium.Cartesian3(opts.x, opts.y, opts.z)
  }

  // 创建更新回调（根据重力类型）
  let updateCallback: ((particle: Cesium.Particle, dt: number) => void) | undefined

  if (style.gravityType === 'water') {
    updateCallback = (particle: Cesium.Particle, dt: number) => {
      const gravityScratch = new Cesium.Cartesian3()
      const position = particle.position
      Cesium.Cartesian3.normalize(position, gravityScratch)
      Cesium.Cartesian3.fromElements(20 * dt, gravityScratch.y * dt, -30 * dt, gravityScratch)
      particle.velocity = Cesium.Cartesian3.add(particle.velocity, gravityScratch, particle.velocity)
    }
  } else if (style.gravityType === 'smoke') {
    updateCallback = (particle: Cesium.Particle, dt: number) => {
      const gravityScratch = new Cesium.Cartesian3()
      const position = particle.position
      Cesium.Cartesian3.normalize(position, gravityScratch)
      Cesium.Cartesian3.fromElements(20 * dt, 30 * dt, gravityScratch.y * dt, gravityScratch)
      particle.velocity = Cesium.Cartesian3.add(particle.velocity, gravityScratch, particle.velocity)
    }
  } else if (style.gravityType === 'spray') {
    updateCallback = (particle: Cesium.Particle, dt: number) => {
      const gravityScratch = new Cesium.Cartesian3()
      const position = particle.position
      Cesium.Cartesian3.normalize(position, gravityScratch)
      Cesium.Cartesian3.fromElements(15 * dt, 15 * dt, -10 * dt, gravityScratch)
      particle.velocity = Cesium.Cartesian3.add(particle.velocity, gravityScratch, particle.velocity)
    }
  }

  return {
    image: style.image || '',
    startColor: parseColor(style.startColor, Cesium.Color.WHITE),
    endColor: parseColor(style.endColor, Cesium.Color.WHITE.withAlpha(0)),
    startScale: style.startScale ?? 0.0,
    endScale: style.endScale ?? 10.0,
    minimumParticleLife: style.minimumParticleLife ?? 1.0,
    maximumParticleLife: style.maximumParticleLife ?? 6.0,
    minimumSpeed: style.minimumSpeed ?? 1.0,
    maximumSpeed: style.maximumSpeed ?? 4.0,
    particleSize: style.particleSize ?? 25.0,
    emissionRate: style.emissionRate ?? 5.0,
    lifetime: style.lifetime ?? 16.0,
    loop: style.loop ?? true,
    sizeInMeters: style.sizeInMeters ?? true,
    emitterType: style.emitterType || 'cone',
    emitterOptions,
    emitterOffset,
    emitterRotation: style.emitterRotation,
    updateCallback
  }
}

/**
 * 获取实体坐标
 * @param entity - Cesium 实体对象
 * @returns Cartesian3 坐标数组
 */
export function getPositions(entity: EntityWithAttribute): Cesium.Cartesian3[] {
  const time = Cesium.JulianDate.now()
  const position = entity.position.getValue(time)
  return position ? [position] : []
}

/**
 * 获取实体经纬度坐标
 * @param entity - Cesium 实体对象
 * @returns 经纬度坐标数组 [[longitude, latitude, height]]
 */
export function getCoordinates(entity: EntityWithAttribute): number[][] {
  const positions = getPositions(entity)
  const coordinates = cartesians2lonlats(positions)
  return coordinates
}

/**
 * 将实体转换为 GeoJSON 格式
 * @param entity - Cesium 实体对象
 * @returns GeoJSON Feature 对象
 */
export function toGeoJSON(entity: EntityWithAttribute): GeoJSONFeature {
  const coordinates = getCoordinates(entity)
  return {
    type: 'Feature',
    properties: entity.attribute || {},
    geometry: { type: 'Point', coordinates: coordinates.length > 0 ? coordinates[0] : [] }
  }
}

/**
 * 将样式应用到实体
 * @param _style - 样式配置对象
 * @param _entityattr - 实体对象
 */
export function style2Entity(_style: ParticleStyleConfig, _entityattr?: unknown): void {
  // 粒子系统的样式在创建时应用，这里无需做任何操作
  // 保留此方法以满足 AttrClass 接口要求
}
