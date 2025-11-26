import * as Cesium from 'cesium'
import type { Viewer as CesiumViewer, PostProcessStage } from 'cesium'
import type { LightningEffectOptions, PostProcessEffect } from '../types'
import { SceneEffectType } from '../types'

/**
 * 闪电效果
 */
export class LightningEffect implements PostProcessEffect {
  name: string
  type = SceneEffectType.LIGHTNING
  stage: PostProcessStage | null = null
  visible = true
  private viewer: CesiumViewer

  constructor(viewer: CesiumViewer, options: LightningEffectOptions = {}) {
    this.viewer = viewer
    this.name = options.name || 'lightning-effect'

    const fragmentShader = this.getFragmentShader()

    this.stage = new Cesium.PostProcessStage({
      name: this.name,
      fragmentShader,
      uniforms: {
        mix_factor: options.mixFactor || 0.35,
        fall_interval: options.fallInterval || 0.8
      }
    })

    viewer.scene.postProcessStages.add(this.stage)
  }

  /**
   * 获取片段着色器
   */
  private getFragmentShader(): string {
    return `
      uniform sampler2D colorTexture;
      uniform float fall_interval;
      uniform float mix_factor;
      varying vec2 v_textureCoordinates;

      float hash(float x) {
        return fract(21654.6512 * sin(385.51 * x));
      }

      float hash2(vec2 p) {
        return fract(1654.65157 * sin(15.5134763 * p.x + 45.5173247 * p.y + 5.21789));
      }

      vec2 hash2v(vec2 p) {
        return vec2(hash2(p * 0.754), hash2(1.5743 * p + 4.5476351));
      }

      vec2 add = vec2(1.0, 0.0);

      vec2 noise2(vec2 x) {
        vec2 p = floor(x);
        vec2 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        vec2 res = mix(
          mix(hash2v(p), hash2v(p + add.xy), f.x),
          mix(hash2v(p + add.yx), hash2v(p + add.xx), f.x),
          f.y
        );
        return res;
      }

      vec2 fbm2(vec2 x) {
        vec2 r = vec2(0.0);
        float a = 1.0;
        for (int i = 0; i < 8; i++) {
          r += noise2(x) * a;
          x *= 2.0;
          a *= 0.5;
        }
        return r;
      }

      float dseg(vec2 ba, vec2 pa) {
        float h = clamp(dot(pa, ba) / dot(ba, ba), -0.2, 1.0);
        return length(pa - ba * h);
      }

      void main(void) {
        vec2 uv = gl_FragCoord.xy;
        float iTime = czm_frameNumber * fall_interval * clamp(fall_interval * 0.1, 0.01, 0.1);
        vec2 p = uv / czm_viewport.zw;
        vec2 d;
        vec2 tgt = vec2(1.0, -1.0);
        float c = 0.0;

        if (p.y >= 0.0)
          c = (1.0 - (fbm2((p + 0.2) * p.y + 0.1 * iTime)).x) * p.y;
        else
          c = (1.0 - (fbm2(p + 0.2 + 0.1 * iTime)).x) * p.y * p.y;

        vec3 col = vec3(0.0);
        vec3 col1 = c * vec3(0.3, 0.5, 1.0);
        float mdist = 100000.0;
        float t = hash(floor(5.0 * iTime));
        tgt += 4.0 * hash2v(tgt + t) - 1.5;

        if (hash2(vec2(t, 2.3)) > 0.6) {
          for (int i = 0; i < 100; i++) {
            vec2 dtgt = tgt - p;
            d = 0.05 * (vec2(-0.5, -1.0) + hash2v(vec2(float(i), t)));
            float dist = dseg(d, dtgt);
            mdist = min(mdist, dist);
            tgt -= d;
            c = exp(-1.2 * dist) + exp(-55.0 * mdist);
            col = c * vec3(0.7, 0.8, 1.0);
          }
        }

        col += col1;
        gl_FragColor = mix(texture2D(colorTexture, v_textureCoordinates), vec4(col, 0.0), mix_factor);
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

  /**
   * 设置混合系数
   */
  setMixFactor(factor: number): void {
    if (this.stage) {
      this.stage.uniforms.mix_factor = factor
    }
  }

  /**
   * 设置下落间隔
   */
  setFallInterval(interval: number): void {
    if (this.stage) {
      this.stage.uniforms.fall_interval = interval
    }
  }
}
