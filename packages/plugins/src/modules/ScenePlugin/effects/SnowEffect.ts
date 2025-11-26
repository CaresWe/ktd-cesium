import * as Cesium from 'cesium'
import type { Viewer as CesiumViewer, PostProcessStage } from 'cesium'
import type { SnowEffectOptions, PostProcessEffect } from '../types'
import { SceneEffectType } from '../types'

/**
 * 雪效果
 */
export class SnowEffect implements PostProcessEffect {
  name: string
  type = SceneEffectType.SNOW
  stage: PostProcessStage | null = null
  visible = true
  private viewer: CesiumViewer

  constructor(viewer: CesiumViewer, options: SnowEffectOptions = {}) {
    this.viewer = viewer
    this.name = options.name || 'snow-effect'

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

      float snow(vec2 uv, float scale) {
        float time = float(czm_frameNumber) / 60.0;
        float w = smoothstep(1.0, 0.0, -uv.y * (scale / 10.0));
        if (w < 0.1) return 0.0;
        uv += time / scale;
        uv.y += time * 2.0 / scale;
        uv.x += sin(uv.y + time * 0.5) / scale;
        uv *= scale;
        vec2 s = floor(uv), f = fract(uv), p;
        float k = 3.0, d;
        p = 0.5 + 0.35 * sin(11.0 * fract(sin((s + p + scale) * mat2(7, 3, 6, 5)) * 5.0)) - f;
        d = length(p);
        k = min(d, k);
        k = smoothstep(0.0, k, sin(f.x + f.y) * 0.01);
        return k * w;
      }

      void main() {
        vec2 resolution = czm_viewport.zw;
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        vec3 finalColor = vec3(0.0);
        float c = 0.0;
        c += snow(uv, 30.0) * 0.0;
        c += snow(uv, 20.0) * 0.0;
        c += snow(uv, 15.0) * 0.0;
        c += snow(uv, 10.0);
        c += snow(uv, 8.0);
        c += snow(uv, 6.0);
        c += snow(uv, 5.0);
        finalColor = vec3(c);

        // 调整亮度
        finalColor = finalColor * 1.2;

        fragColor = mix(texture(colorTexture, v_textureCoordinates), vec4(finalColor, 1.0), 0.2);
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
