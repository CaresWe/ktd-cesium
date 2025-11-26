import * as Cesium from 'cesium'
import type { Viewer as CesiumViewer, PostProcessStage } from 'cesium'
import type { RainEffectOptions, PostProcessEffect } from '../types'
import { SceneEffectType } from '../types'

/**
 * 雨效果
 */
export class RainEffect implements PostProcessEffect {
  name: string
  type = SceneEffectType.RAIN
  stage: PostProcessStage | null = null
  visible = true
  private viewer: CesiumViewer

  constructor(viewer: CesiumViewer, options: RainEffectOptions = {}) {
    this.viewer = viewer
    this.name = options.name || 'rain-effect'

    const fragmentShader = this.getFragmentShader()

    this.stage = new Cesium.PostProcessStage({
      name: this.name,
      fragmentShader,
      uniforms: {
        color: Cesium.Color.fromAlpha(Cesium.Color.BLACK, 1.0)
      }
    })

    viewer.scene.postProcessStages.add(this.stage)
  }

  /**
   * 获取片段着色器
   */
  private getFragmentShader(): string {
    return `
      #version 300 es
      precision highp float;

      uniform sampler2D colorTexture;
      in vec2 v_textureCoordinates;
      out vec4 fragColor;

      float hash(float x) {
        return fract(sin(x * 133.3) * 13.13);
      }

      void main() {
        float time = czm_frameNumber / 60.0;
        vec2 resolution = czm_viewport.zw;
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
        vec3 c = vec3(0.6, 0.7, 0.8);
        float a = -0.4;
        float si = sin(a), co = cos(a);
        uv *= mat2(co, -si, si, co);
        uv *= length(uv + vec2(0.0, 4.9)) * 0.3 + 1.0;
        float v = 1.0 - sin(hash(floor(uv.x * 100.0)) * 2.0);
        float b = clamp(abs(sin(20.0 * time * v + uv.y * (5.0 / (2.0 + v)))) - 0.95, 0.0, 1.0) * 20.0;
        c *= v * b;

        fragColor = mix(texture(colorTexture, v_textureCoordinates), vec4(c, 1.0), 0.5);
      }
    `
  }

  remove(): void {
    if (this.stage) {
      this.viewer.scene.postProcessStages.remove(this.stage)
      this.stage = null
    }
  }

  show(): void {
    if (this.stage) {
      this.stage.enabled = true
      this.visible = true
    }
  }

  hide(): void {
    if (this.stage) {
      this.stage.enabled = false
      this.visible = false
    }
  }
}
