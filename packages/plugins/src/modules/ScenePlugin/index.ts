import { BasePlugin } from '../../BasePlugin'
import type { KtdViewer } from '@ktd-cesium/core'
import type {
  SceneEffectType,
  SceneEffect,
  RainEffectOptions,
  SnowEffectOptions,
  FogEffectOptions,
  LightningEffectOptions,
  HeightFogEffectOptions,
  LocalRainEffectOptions
} from './types'
import { RainEffect, SnowEffect, FogEffect, LightningEffect, HeightFogEffect, LocalRainEffect } from './effects'

/**
 * 场景插件选项接口
 */
export interface ScenePluginOptions {
  // 预留扩展选项
}

/**
 * 场景插件
 *
 * 提供各种场景特效功能，包括天气效果（雨、雪、雾）、闪电、高度雾、局部下雨等
 *
 * @example
 * ```typescript
 * // 使用插件
 * const scene = viewer.use('scene')
 *
 * // 添加雨效果
 * const rain = scene.addRain({ mixFactor: 0.5 })
 *
 * // 添加闪电效果
 * const lightning = scene.addLightning({ mixFactor: 0.35 })
 *
 * // 添加高度雾
 * const heightFog = scene.addHeightFog({
 *   fogHeight: 1000,
 *   globalDensity: 0.6
 * })
 *
 * // 添加局部下雨
 * const localRain = scene.addLocalRain({
 *   minLongitude: -100,
 *   minLatitude: 30,
 *   maxLongitude: -99.5,
 *   maxLatitude: 30.5,
 *   dropCount: 5000
 * })
 *
 * // 移除效果
 * scene.removeEffect('rain-effect')
 * // 或
 * rain.remove()
 * ```
 */
export class ScenePlugin extends BasePlugin {
  static readonly pluginName = 'scene'
  readonly name = 'scene'

  /** 效果存储 */
  private effects: Map<string, SceneEffect> = new Map()

  protected onInstall(_viewer: KtdViewer, _options?: ScenePluginOptions): void {
    // Plugin installed
  }

  /**
   * 添加雨效果
   * @param options 雨效果配置
   * @returns 雨效果实例
   */
  addRain(options: RainEffectOptions = {}): RainEffect {
    const effect = new RainEffect(this.cesiumViewer, options)
    this.effects.set(effect.name, effect)
    return effect
  }

  /**
   * 添加雪效果
   * @param options 雪效果配置
   * @returns 雪效果实例
   */
  addSnow(options: SnowEffectOptions = {}): SnowEffect {
    const effect = new SnowEffect(this.cesiumViewer, options)
    this.effects.set(effect.name, effect)
    return effect
  }

  /**
   * 添加雾效果
   * @param options 雾效果配置
   * @returns 雾效果实例
   */
  addFog(options: FogEffectOptions = {}): FogEffect {
    const effect = new FogEffect(this.cesiumViewer, options)
    this.effects.set(effect.name, effect)
    return effect
  }

  /**
   * 添加闪电效果
   * @param options 闪电效果配置
   * @returns 闪电效果实例
   */
  addLightning(options: LightningEffectOptions = {}): LightningEffect {
    const effect = new LightningEffect(this.cesiumViewer, options)
    this.effects.set(effect.name, effect)
    return effect
  }

  /**
   * 添加高度雾效果
   * @param options 高度雾效果配置
   * @returns 高度雾效果实例
   */
  addHeightFog(options: HeightFogEffectOptions = {}): HeightFogEffect {
    const effect = new HeightFogEffect(this.cesiumViewer, options)
    this.effects.set(effect.name, effect)
    return effect
  }

  /**
   * 添加局部下雨效果
   * @param options 局部下雨效果配置
   * @returns 局部下雨效果实例
   */
  addLocalRain(options: LocalRainEffectOptions = {}): LocalRainEffect {
    const effect = new LocalRainEffect(this.cesiumViewer, options)
    this.effects.set(effect.name, effect)
    return effect
  }

  /**
   * 根据名称获取效果
   * @param name 效果名称
   * @returns 效果实例或 undefined
   */
  getEffect(name: string): SceneEffect | undefined {
    return this.effects.get(name)
  }

  /**
   * 根据类型获取所有效果
   * @param type 效果类型
   * @returns 效果实例数组
   */
  getEffectsByType(type: SceneEffectType): SceneEffect[] {
    const effects: SceneEffect[] = []
    this.effects.forEach((effect) => {
      if (effect.type === type) {
        effects.push(effect)
      }
    })
    return effects
  }

  /**
   * 获取所有效果
   * @returns 效果实例数组
   */
  getAllEffects(): SceneEffect[] {
    return Array.from(this.effects.values())
  }

  /**
   * 移除效果
   * @param name 效果名称
   */
  removeEffect(name: string): void {
    const effect = this.effects.get(name)
    if (effect) {
      effect.remove()
      this.effects.delete(name)
    }
  }

  /**
   * 移除某类型的所有效果
   * @param type 效果类型
   */
  removeEffectsByType(type: SceneEffectType): void {
    const effectsToRemove: string[] = []
    this.effects.forEach((effect, name) => {
      if (effect.type === type) {
        effect.remove()
        effectsToRemove.push(name)
      }
    })
    effectsToRemove.forEach((name) => this.effects.delete(name))
  }

  /**
   * 移除所有效果
   */
  removeAllEffects(): void {
    this.effects.forEach((effect) => {
      effect.remove()
    })
    this.effects.clear()
  }

  /**
   * 显示效果
   * @param name 效果名称
   */
  showEffect(name: string): void {
    const effect = this.effects.get(name)
    if (effect) {
      effect.show()
    }
  }

  /**
   * 隐藏效果
   * @param name 效果名称
   */
  hideEffect(name: string): void {
    const effect = this.effects.get(name)
    if (effect) {
      effect.hide()
    }
  }

  /**
   * 显示所有效果
   */
  showAllEffects(): void {
    this.effects.forEach((effect) => {
      effect.show()
    })
  }

  /**
   * 隐藏所有效果
   */
  hideAllEffects(): void {
    this.effects.forEach((effect) => {
      effect.hide()
    })
  }

  protected onDestroy(): void {
    this.removeAllEffects()
  }
}

// 导出类型和效果类
export * from './types'
export { RainEffect, SnowEffect, FogEffect, LightningEffect, HeightFogEffect, LocalRainEffect } from './effects'
