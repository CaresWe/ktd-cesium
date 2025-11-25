import { Cesium3DTileset } from 'cesium'
import type { ColorCorrectionConfig } from './types'

/**
 * 颜色校正管理器
 * 负责调整模型的颜色属性（亮度、对比度、饱和度等）
 */
export class ColorCorrectionManager {
  private config: ColorCorrectionConfig | null = null

  constructor(_tileset: Cesium3DTileset) {
    // tileset 保留给未来使用（当实现自定义着色器时）
  }

  /**
   * 启用颜色校正
   */
  enable(config: ColorCorrectionConfig): void {
    try {
      this.config = config

      // 应用颜色校正
      this.applyCorrection()

      console.log('Color correction enabled')
    } catch (error) {
      console.error('Failed to enable color correction:', error)
      throw error
    }
  }

  /**
   * 更新颜色校正
   */
  update(config: Partial<ColorCorrectionConfig>): void {
    try {
      if (!this.config) {
        throw new Error('Color correction not initialized')
      }

      // 更新配置
      this.config = { ...this.config, ...config }

      // 重新应用
      this.applyCorrection()

      console.log('Color correction updated')
    } catch (error) {
      console.error('Failed to update color correction:', error)
      throw error
    }
  }

  /**
   * 应用颜色校正
   */
  private applyCorrection(): void {
    try {
      if (!this.config) return

      // Cesium 的颜色校正需要通过自定义着色器实现
      // 这里提供基础实现，使用 Cesium3DTileset 的 customShader API

      const fragmentShader = this.buildFragmentShader(this.config)

      // 注意：Cesium3DTileset.customShader 需要 Cesium 1.97+ 版本
      // 这里展示基本结构，实际使用需要根据 Cesium 版本调整
      console.warn(
        'Color correction requires Cesium3DTileset.customShader API (Cesium 1.97+)'
      )

      // 示例代码（需要适配实际 Cesium 版本）:
      // this.tileset.customShader = new CustomShader({
      //   fragmentShaderText: fragmentShader
      // })

      console.log('Color correction shader:', fragmentShader)
    } catch (error) {
      console.error('Failed to apply color correction:', error)
      throw error
    }
  }

  /**
   * 构建片元着色器
   */
  private buildFragmentShader(config: ColorCorrectionConfig): string {
    const brightness = config.brightness ?? 0.0
    const contrast = config.contrast ?? 0.0
    const saturation = config.saturation ?? 0.0
    const hue = config.hue ?? 0.0
    const gamma = config.gamma ?? 1.0

    // 构建 GLSL 着色器代码
    return `
      uniform float u_brightness;
      uniform float u_contrast;
      uniform float u_saturation;
      uniform float u_hue;
      uniform float u_gamma;

      vec3 adjustBrightness(vec3 color, float brightness) {
        return color + vec3(brightness);
      }

      vec3 adjustContrast(vec3 color, float contrast) {
        return (color - 0.5) * (1.0 + contrast) + 0.5;
      }

      vec3 adjustSaturation(vec3 color, float saturation) {
        float gray = dot(color, vec3(0.299, 0.587, 0.114));
        return mix(vec3(gray), color, 1.0 + saturation);
      }

      vec3 adjustHue(vec3 color, float hue) {
        float angle = hue * 3.14159265 / 180.0;
        float s = sin(angle);
        float c = cos(angle);
        mat3 rotationMatrix = mat3(
          0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928,
          0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.140, 0.072 - c * 0.072 - s * 0.283,
          0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072
        );
        return rotationMatrix * color;
      }

      vec3 adjustGamma(vec3 color, float gamma) {
        return pow(color, vec3(1.0 / gamma));
      }

      void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
        vec3 color = material.diffuse;

        // 应用各种调整
        color = adjustBrightness(color, ${brightness.toFixed(3)});
        color = adjustContrast(color, ${contrast.toFixed(3)});
        color = adjustSaturation(color, ${saturation.toFixed(3)});
        color = adjustHue(color, ${hue.toFixed(3)});
        color = adjustGamma(color, ${gamma.toFixed(3)});

        // 限制在有效范围
        color = clamp(color, 0.0, 1.0);

        material.diffuse = color;
      }
    `
  }

  /**
   * 禁用颜色校正
   */
  disable(): void {
    try {
      // 移除自定义着色器
      // this.tileset.customShader = undefined

      this.config = null
      console.log('Color correction disabled')
    } catch (error) {
      console.error('Failed to disable color correction:', error)
      throw error
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): ColorCorrectionConfig | null {
    return this.config ? { ...this.config } : null
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.disable()
  }
}
