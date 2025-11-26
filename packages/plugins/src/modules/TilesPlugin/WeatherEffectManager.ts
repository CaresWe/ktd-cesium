import type { Cesium3DTileset, CustomShader } from 'cesium'
import * as Cesium from 'cesium'

/**
 * 天气效果类型
 */
export enum WeatherEffectType {
  /** 雨水滴 */
  RAIN_DROPS = 'rainDrops',
  /** 积雪 */
  SNOW_ACCUMULATION = 'snowAccumulation'
}

/**
 * 雨水滴效果配置
 */
export interface RainDropsConfig {
  /** 水滴强度 0-1 */
  intensity?: number
  /** 水滴大小 */
  dropSize?: number
  /** 水滴颜色 */
  dropColor?: Cesium.Color
  /** 流淌速度 */
  flowSpeed?: number
  /** 是否启用法线贴图 */
  enableNormalMap?: boolean
}

/**
 * 积雪效果配置
 */
export interface SnowAccumulationConfig {
  /** 积雪厚度 0-1 */
  thickness?: number
  /** 积雪颜色 */
  snowColor?: Cesium.Color
  /** 积雪粗糙度 */
  roughness?: number
  /** 积雪覆盖阈值（根据法线 Y 值判断） */
  coverageThreshold?: number
}

/**
 * 天气效果管理器
 * 为 3D Tiles 模型添加雨水滴和积雪效果
 */
export class WeatherEffectManager {
  private tileset: Cesium3DTileset
  private currentEffect: WeatherEffectType | null = null
  private rainDropsShader: CustomShader | null = null
  private snowShader: CustomShader | null = null
  private originalCustomShader: CustomShader | null = null

  constructor(tileset: Cesium3DTileset) {
    this.tileset = tileset
    this.originalCustomShader = tileset.customShader || null
  }

  /**
   * 启用雨水滴效果
   */
  enableRainDrops(config: RainDropsConfig = {}): void {
    const intensity = config.intensity ?? 0.5
    const dropSize = config.dropSize ?? 0.05
    const flowSpeed = config.flowSpeed ?? 1.0
    const dropColor = config.dropColor || new Cesium.Color(0.5, 0.5, 0.6, 0.8)

    const fragmentShaderText = `
      // 雨水滴效果
      void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
        float time = czm_frameNumber * ${flowSpeed.toFixed(2)} * 0.01;
        vec3 positionMC = fsInput.attributes.positionMC;
        vec3 normalEC = fsInput.attributes.normalEC;

        // 只在接近垂直向上的表面上显示水滴（屋顶等）
        float verticalness = dot(normalize(normalEC), vec3(0.0, 1.0, 0.0));
        float wetnessMask = smoothstep(0.3, 0.7, verticalness);

        // 生成水滴图案
        vec2 uv = positionMC.xy * 20.0;
        float drops = 0.0;

        // 多层水滴效果
        for (float i = 0.0; i < 3.0; i++) {
          float layer = i + 1.0;
          vec2 uvOffset = vec2(time * layer * 0.5, time * layer);
          vec2 uvLayer = fract(uv * layer + uvOffset);

          // 水滴形状
          vec2 center = vec2(0.5);
          float dist = length(uvLayer - center);
          float drop = smoothstep(${dropSize.toFixed(3)}, 0.0, dist);

          drops += drop * (1.0 / layer);
        }

        // 应用水滴效果
        float wetness = drops * ${intensity.toFixed(2)} * wetnessMask;

        // 水面反光效果
        vec3 waterColor = vec3(${dropColor.red}, ${dropColor.green}, ${dropColor.blue});
        material.diffuse = mix(material.diffuse, waterColor, wetness * ${dropColor.alpha});
        material.specular = mix(material.specular, vec3(1.0), wetness * 0.5);
        material.roughness = mix(material.roughness, 0.1, wetness);
      }
    `

    this.rainDropsShader = new Cesium.CustomShader({
      fragmentShaderText,
      uniforms: {}
    })

    this.tileset.customShader = this.rainDropsShader
    this.currentEffect = WeatherEffectType.RAIN_DROPS
  }

  /**
   * 启用积雪效果
   */
  enableSnowAccumulation(config: SnowAccumulationConfig = {}): void {
    const thickness = config.thickness ?? 0.5
    const snowColor = config.snowColor || new Cesium.Color(0.95, 0.95, 0.98, 1.0)
    const roughness = config.roughness ?? 0.8
    const coverageThreshold = config.coverageThreshold ?? 0.5

    const fragmentShaderText = `
      // 积雪效果
      void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
        vec3 normalEC = fsInput.attributes.normalEC;
        vec3 positionMC = fsInput.attributes.positionMC;

        // 计算表面朝上程度（用于确定积雪覆盖）
        float upwardness = dot(normalize(normalEC), vec3(0.0, 1.0, 0.0));

        // 积雪覆盖遮罩（只有朝上的表面才积雪）
        float snowMask = smoothstep(${coverageThreshold.toFixed(2)}, 1.0, upwardness);

        // 添加噪声变化，使积雪更自然
        vec2 uv = positionMC.xy * 10.0;
        float noise = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
        float snowVariation = mix(0.8, 1.0, noise);

        // 根据高度调整积雪厚度
        float heightFactor = smoothstep(-10.0, 50.0, positionMC.z);
        float snowAmount = snowMask * ${thickness.toFixed(2)} * heightFactor * snowVariation;

        // 应用积雪颜色
        vec3 snowColorRGB = vec3(${snowColor.red}, ${snowColor.green}, ${snowColor.blue});
        material.diffuse = mix(material.diffuse, snowColorRGB, snowAmount);

        // 积雪表面较为粗糙，降低高光
        material.specular = mix(material.specular, vec3(0.3), snowAmount);
        material.roughness = mix(material.roughness, ${roughness.toFixed(2)}, snowAmount);

        // 增加亮度
        material.diffuse = material.diffuse * mix(1.0, 1.2, snowAmount);
      }
    `

    this.snowShader = new Cesium.CustomShader({
      fragmentShaderText,
      uniforms: {}
    })

    this.tileset.customShader = this.snowShader
    this.currentEffect = WeatherEffectType.SNOW_ACCUMULATION
  }

  /**
   * 更新雨水滴强度
   */
  updateRainIntensity(intensity: number): void {
    if (this.currentEffect !== WeatherEffectType.RAIN_DROPS) {
      console.warn('Rain drops effect is not enabled')
      return
    }

    // 重新创建 shader 以更新强度
    this.enableRainDrops({ intensity })
  }

  /**
   * 更新积雪厚度
   */
  updateSnowThickness(thickness: number): void {
    if (this.currentEffect !== WeatherEffectType.SNOW_ACCUMULATION) {
      console.warn('Snow accumulation effect is not enabled')
      return
    }

    // 重新创建 shader 以更新厚度
    this.enableSnowAccumulation({ thickness })
  }

  /**
   * 禁用天气效果
   */
  disable(): void {
    // 恢复原始 shader
    this.tileset.customShader = this.originalCustomShader || undefined
    this.currentEffect = null
  }

  /**
   * 获取当前效果类型
   */
  getCurrentEffect(): WeatherEffectType | null {
    return this.currentEffect
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.disable()
    this.rainDropsShader = null
    this.snowShader = null
    this.originalCustomShader = null
  }
}
