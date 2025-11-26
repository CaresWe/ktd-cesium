import * as Cesium from 'cesium'
import type { Viewer as CesiumViewer, PostProcessStage } from 'cesium'
import type { FogEffectOptions, PostProcessEffect } from '../types'
import { SceneEffectType } from '../types'

/**
 * 雾效果
 */
export class FogEffect implements PostProcessEffect {
  name: string
  type = SceneEffectType.FOG
  stage: PostProcessStage | null = null
  visible = true
  private viewer: CesiumViewer

  constructor(viewer: CesiumViewer, options: FogEffectOptions = {}) {
    this.viewer = viewer
    this.name = options.name || 'fog-effect'

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
      uniform sampler2D depthTexture;
      in vec2 v_textureCoordinates;
      out vec4 fragColor;

      void main(void) {
        vec4 origcolor = texture(colorTexture, v_textureCoordinates);
        vec4 fogcolor = vec4(0.8, 0.8, 0.8, 0.5);
        float depth = czm_readDepth(depthTexture, v_textureCoordinates);
        vec4 depthcolor = texture(depthTexture, v_textureCoordinates);
        float f = (depthcolor.r - 0.22) / 0.2;
        if (f < 0.0) f = 0.0;
        else if (f > 1.0) f = 1.0;
        fragColor = mix(origcolor, fogcolor, 0.8);
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
