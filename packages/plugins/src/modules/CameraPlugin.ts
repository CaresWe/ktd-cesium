import { Cartesian3, Math as CesiumMath, HeadingPitchRange, Cartographic } from 'cesium'
import { BasePlugin } from '../BasePlugin'
import type { KtdViewer } from '@ktd-cesium/core'

/**
 * 相机控制插件
 */
export class CameraPlugin extends BasePlugin {
  static readonly pluginName = 'camera'
  readonly name = 'camera'

  protected onInstall(_viewer: KtdViewer): void {
    console.log('Camera plugin installed')
  }

  /**
   * 飞行到指定位置
   * @param longitude 经度
   * @param latitude 纬度
   * @param height 高度（米）
   * @param duration 动画时长（秒）
   */
  flyTo(
    longitude: number,
    latitude: number,
    height: number = 10000,
    duration: number = 3
  ): Promise<void> {
    this.ensureInstalled()

    return new Promise((resolve) => {
      this.cesiumViewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(longitude, latitude, height),
        duration,
        complete: () => resolve()
      })
    })
  }

  /**
   * 直接设置相机视角
   * @param longitude 经度
   * @param latitude 纬度
   * @param height 高度（米）
   */
  setView(
    longitude: number,
    latitude: number,
    height: number = 10000
  ): void {
    this.ensureInstalled()

    this.cesiumViewer.camera.setView({
      destination: Cartesian3.fromDegrees(longitude, latitude, height)
    })
  }

  /**
   * 环绕指定点查看
   * @param longitude 经度
   * @param latitude 纬度
   * @param height 高度（米）
   * @param heading 航向角（度）
   * @param pitch 俯仰角（度）
   * @param range 距离（米）
   */
  lookAt(
    longitude: number,
    latitude: number,
    height: number = 0,
    heading: number = 0,
    pitch: number = -45,
    range: number = 10000
  ): void {
    this.ensureInstalled()

    const center = Cartesian3.fromDegrees(longitude, latitude, height)
    const headingPitchRange = new HeadingPitchRange(
      CesiumMath.toRadians(heading),
      CesiumMath.toRadians(pitch),
      range
    )

    this.cesiumViewer.camera.lookAt(center, headingPitchRange)
  }

  /**
   * 获取当前相机位置
   */
  getCurrentPosition(): { longitude: number; latitude: number; height: number } | null {
    this.ensureInstalled()

    const camera = this.cesiumViewer.camera
    const cartesian = camera.position
    const cartographic = Cartographic.fromCartesian(cartesian)

    return {
      longitude: CesiumMath.toDegrees(cartographic.longitude),
      latitude: CesiumMath.toDegrees(cartographic.latitude),
      height: cartographic.height
    }
  }

  /**
   * 缩放到实体
   * @param entity 实体
   */
  zoomToEntity(entity: any): void {
    this.ensureInstalled()
    this.cesiumViewer.zoomTo(entity)
  }

  protected onDestroy(): void {
    console.log('Camera plugin destroyed')
  }
}
