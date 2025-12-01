import * as Cesium from 'cesium'
import type { Viewer as CesiumViewer, PostProcessStage, Color } from 'cesium'
import type { HeightFogEffectOptions, PostProcessEffect } from '../types'
import { SceneEffectType } from '../types'

/**
 * 高度雾效果
 */
export class HeightFogEffect implements PostProcessEffect {
  name: string
  type = SceneEffectType.HEIGHT_FOG
  stage: PostProcessStage | null = null
  visible = true
  private viewer: CesiumViewer

  constructor(viewer: CesiumViewer, options: HeightFogEffectOptions = {}) {
    this.viewer = viewer
    this.name = options.name || 'height-fog-effect'

    const fragmentShader = this.getFragmentShader()

    // 处理雾颜色
    let fogColor: Color
    if (options.fogColor) {
      if (Array.isArray(options.fogColor)) {
        fogColor = new Cesium.Color(options.fogColor[0], options.fogColor[1], options.fogColor[2], 1.0)
      } else {
        fogColor = options.fogColor
      }
    } else {
      fogColor = new Cesium.Color(0.8, 0.82, 0.84, 1.0)
    }

    this.stage = new Cesium.PostProcessStage({
      name: this.name,
      fragmentShader,
      uniforms: {
        u_earthRadiusOnCamera: () => {
          return Cesium.Cartesian3.magnitude(viewer.camera.positionWC) - viewer.camera.positionCartographic.height
        },
        u_cameraHeight: () => viewer.camera.positionCartographic.height,
        u_fogColor: () => fogColor,
        u_fogHeight: () => options.fogHeight || 1000,
        u_globalDensity: () => options.globalDensity || 0.6
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
      uniform sampler2D depthTexture;
      in vec2 v_textureCoordinates;
      uniform float u_earthRadiusOnCamera;
      uniform float u_cameraHeight;
      uniform float u_fogHeight;
      uniform vec3 u_fogColor;
      uniform float u_globalDensity;

      // 通过深度纹理与纹理坐标得到世界坐标
      vec4 getWorldCoordinate(sampler2D depthTexture, vec2 texCoords) {
        float depthOrLogDepth = czm_unpackDepth(texture(depthTexture, texCoords));
        vec4 eyeCoordinate = czm_windowToEyeCoordinates(gl_FragCoord.xy, depthOrLogDepth);
        eyeCoordinate = eyeCoordinate / eyeCoordinate.w;
        vec4 worldCoordinate = czm_inverseView * eyeCoordinate;
        worldCoordinate = worldCoordinate / worldCoordinate.w;
        return worldCoordinate;
      }

      // 计算粗略的高程
      float getRoughHeight(vec4 worldCoordinate) {
        float disToCenter = length(vec3(worldCoordinate));
        return disToCenter - u_earthRadiusOnCamera;
      }

      // 得到a向量在b向量的投影长度
      float projectVector(vec3 a, vec3 b) {
        float scale = dot(a, b) / dot(b, b);
        float k = scale / abs(scale);
        return k * length(scale * b);
      }

      // 线性浓度积分高度雾
      float linearHeightFog(vec3 positionToCamera, float cameraHeight, float pixelHeight, float fogMaxHeight) {
        float globalDensity = u_globalDensity / 10.0;
        vec3 up = -1.0 * normalize(czm_viewerPositionWC);
        float vh = projectVector(normalize(positionToCamera), up);

        // 让相机沿着视线方向移动 雾气产生距离 的距离
        float s = step(100.0, length(positionToCamera));
        vec3 sub = mix(positionToCamera, normalize(positionToCamera) * 100.0, s);
        positionToCamera -= sub;
        cameraHeight = mix(pixelHeight, cameraHeight - 100.0 * vh, s);

        float b = mix(cameraHeight, fogMaxHeight, step(fogMaxHeight, cameraHeight));
        float a = mix(pixelHeight, fogMaxHeight, step(fogMaxHeight, pixelHeight));

        float fog = (b - a) - 0.5 * (pow(b, 2.0) - pow(a, 2.0)) / fogMaxHeight;
        fog = globalDensity * fog / vh;

        if (abs(vh) <= 0.01 && cameraHeight < fogMaxHeight) {
          float disToCamera = length(positionToCamera);
          fog = globalDensity * (1.0 - cameraHeight / fogMaxHeight) * disToCamera;
        }

        fog = mix(0.0, 1.0, fog / (fog + 1.0));

        return fog;
      }

      void main(void) {
        vec4 color = texture(colorTexture, v_textureCoordinates);
        vec4 positionWC = getWorldCoordinate(depthTexture, v_textureCoordinates);
        float pixelHeight = getRoughHeight(positionWC);
        vec3 positionToCamera = vec3(vec3(positionWC) - czm_viewerPositionWC);
        float fog = linearHeightFog(positionToCamera, u_cameraHeight, pixelHeight, u_fogHeight);
        out_FragColor = mix(color, vec4(u_fogColor, 1.0), fog);
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
   * 设置雾高度
   */
  setFogHeight(height: number): void {
    if (this.stage) {
      this.stage.uniforms.u_fogHeight = () => height
    }
  }

  /**
   * 设置全局密度
   */
  setGlobalDensity(density: number): void {
    if (this.stage) {
      this.stage.uniforms.u_globalDensity = () => density
    }
  }

  /**
   * 设置雾颜色
   */
  setFogColor(color: Color | [number, number, number]): void {
    if (this.stage) {
      const fogColor = Array.isArray(color) ? new Cesium.Color(color[0], color[1], color[2], 1.0) : color
      this.stage.uniforms.u_fogColor = () => fogColor
    }
  }
}
