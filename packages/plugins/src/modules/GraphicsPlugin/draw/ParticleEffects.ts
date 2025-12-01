import * as Cesium from 'cesium'
import type { ParticleSystemOptions } from './DrawParticle'

/**
 * 粒子效果预设配置
 *
 * 包含火焰、水枪、爆炸、喷雾、烟雾等各种粒子效果的预设配置
 */

/**
 * 火焰效果
 * @param imagePath 火焰图片路径
 */
export function createFireEffect(imagePath: string): ParticleSystemOptions {
  return {
    image: imagePath,
    startColor: new Cesium.Color(1, 1, 1, 1),
    endColor: new Cesium.Color(0.5, 0, 0, 0),
    startScale: 0.0,
    endScale: 10.0,
    minimumParticleLife: 1.0,
    maximumParticleLife: 6.0,
    minimumSpeed: 1.0,
    maximumSpeed: 4.0,
    particleSize: 25.0,
    emissionRate: 5.0,
    lifetime: 16.0,
    loop: true,
    sizeInMeters: true,
    emitterType: 'cone',
    emitterOptions: 45.0, // 45度圆锥
    emitterOffset: new Cesium.Cartesian3(-4.0, 0.0, 1.4),
    emitterRotation: { heading: 0, pitch: 0, roll: 0 }
  }
}

/**
 * 水枪效果
 * @param imagePath 水滴图片路径
 */
export function createWaterEffect(imagePath: string): ParticleSystemOptions {
  return {
    image: imagePath,
    startColor: new Cesium.Color(1, 1, 1, 0.6),
    endColor: new Cesium.Color(0.8, 0.86, 1, 0.4),
    startScale: 0.0,
    endScale: 10.0,
    minimumParticleLife: 1.0,
    maximumParticleLife: 6.0,
    minimumSpeed: 1.0,
    maximumSpeed: 4.0,
    particleSize: 25.0,
    emissionRate: 5.0,
    lifetime: 16.0,
    loop: true,
    sizeInMeters: true,
    emitterType: 'circle',
    emitterOptions: 0.2, // 半径0.2米
    emitterOffset: new Cesium.Cartesian3(-4.0, 0.0, 1.4),
    emitterRotation: { heading: 0, pitch: 0, roll: 0 },
    updateCallback: (particle: Cesium.Particle, dt: number) => {
      // 应用重力效果（水流下落）
      const gravityScratch = new Cesium.Cartesian3()
      const position = particle.position
      Cesium.Cartesian3.normalize(position, gravityScratch)
      Cesium.Cartesian3.fromElements(20 * dt, gravityScratch.y * dt, -30 * dt, gravityScratch)
      particle.velocity = Cesium.Cartesian3.add(particle.velocity, gravityScratch, particle.velocity)
    }
  }
}

/**
 * 爆炸效果
 * @param imagePath 爆炸图片路径
 */
export function createExplosionEffect(imagePath: string): ParticleSystemOptions {
  return {
    image: imagePath,
    startColor: Cesium.Color.RED.withAlpha(0.7),
    endColor: Cesium.Color.YELLOW.withAlpha(0.3),
    startScale: 0.0,
    endScale: 10.0,
    minimumParticleLife: 1.0,
    maximumParticleLife: 6.0,
    minimumSpeed: 1.0,
    maximumSpeed: 4.0,
    particleSize: 25.0,
    emissionRate: 5.0,
    lifetime: 16.0,
    loop: true,
    sizeInMeters: true,
    emitterType: 'circle',
    emitterOptions: 5.0, // 半径5米
    emitterOffset: new Cesium.Cartesian3(-4.0, 0.0, 1.4),
    emitterRotation: { heading: 0, pitch: 0, roll: 0 }
  }
}

/**
 * 喷雾效果
 * @param imagePath 喷雾图片路径
 */
export function createSprayEffect(imagePath: string): ParticleSystemOptions {
  return {
    image: imagePath,
    startColor: new Cesium.Color(1, 1, 1, 0.8),
    endColor: new Cesium.Color(1, 1, 1, 0.2),
    startScale: 0.0,
    endScale: 8.0,
    minimumParticleLife: 1.5,
    maximumParticleLife: 5.0,
    minimumSpeed: 2.0,
    maximumSpeed: 6.0,
    particleSize: 20.0,
    emissionRate: 10.0,
    lifetime: 16.0,
    loop: true,
    sizeInMeters: true,
    emitterType: 'cone',
    emitterOptions: 30.0, // 30度圆锥
    emitterOffset: new Cesium.Cartesian3(-4.0, 0.0, 1.4),
    emitterRotation: { heading: 0, pitch: 0, roll: 0 },
    updateCallback: (particle: Cesium.Particle, dt: number) => {
      // 应用轻微重力和扩散效果
      const gravityScratch = new Cesium.Cartesian3()
      const position = particle.position
      Cesium.Cartesian3.normalize(position, gravityScratch)
      Cesium.Cartesian3.fromElements(15 * dt, 15 * dt, -10 * dt, gravityScratch)
      particle.velocity = Cesium.Cartesian3.add(particle.velocity, gravityScratch, particle.velocity)
    }
  }
}

/**
 * 烟雾效果
 * @param imagePath 烟雾图片路径
 */
export function createSmokeEffect(imagePath: string): ParticleSystemOptions {
  return {
    image: imagePath,
    startColor: Cesium.Color.BLACK.withAlpha(0.7),
    endColor: Cesium.Color.WHITE.withAlpha(0.3),
    startScale: 0.0,
    endScale: 10.0,
    minimumParticleLife: 1.0,
    maximumParticleLife: 6.0,
    minimumSpeed: 1.0,
    maximumSpeed: 4.0,
    particleSize: 25.0,
    emissionRate: 5.0,
    lifetime: 16.0,
    loop: true,
    sizeInMeters: true,
    emitterType: 'circle',
    emitterOptions: 2.0, // 半径2米
    emitterOffset: new Cesium.Cartesian3(-4.0, 0.0, 1.4),
    emitterRotation: { heading: 0, pitch: 0, roll: 0 },
    updateCallback: (particle: Cesium.Particle, dt: number) => {
      // 应用上升效果（烟雾向上飘）
      const gravityScratch = new Cesium.Cartesian3()
      const position = particle.position
      Cesium.Cartesian3.normalize(position, gravityScratch)
      Cesium.Cartesian3.fromElements(20 * dt, 30 * dt, gravityScratch.y * dt, gravityScratch)
      particle.velocity = Cesium.Cartesian3.add(particle.velocity, gravityScratch, particle.velocity)
    }
  }
}

/**
 * 获取预设粒子效果
 * @param effectType 效果类型: 'fire' | 'water' | 'explosion' | 'spray' | 'smoke'
 * @param imagePath 图片路径
 */
export function getParticleEffect(
  effectType: 'fire' | 'water' | 'explosion' | 'spray' | 'smoke',
  imagePath: string
): ParticleSystemOptions {
  switch (effectType) {
    case 'fire':
      return createFireEffect(imagePath)
    case 'water':
      return createWaterEffect(imagePath)
    case 'explosion':
      return createExplosionEffect(imagePath)
    case 'spray':
      return createSprayEffect(imagePath)
    case 'smoke':
      return createSmokeEffect(imagePath)
    default:
      return createFireEffect(imagePath)
  }
}
