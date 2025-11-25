import * as Cesium from 'cesium'
import { EditPoint } from './EditPoint'
import type { ModelEditEntity } from '../types'

/**
 * 3D模型编辑类
 * 继承自 EditPoint
 * 支持：
 * - 位置拖拽
 * - 方向调整（Heading、Pitch、Roll）
 * - 缩放调整
 */
export class EditModel extends EditPoint {
  declare entity: Cesium.Entity & ModelEditEntity

  /**
   * 获取图形对象
   * 返回 ModelGraphics 对象
   */
  getGraphic(): Cesium.ModelGraphics {
    try {
      if (!this.entity) {
        throw new Error('实体对象不存在')
      }

      if (!this.entity.model) {
        throw new Error('实体的 model 属性不存在')
      }

      return this.entity.model
    } catch (error) {
      console.error('EditModel.getGraphic: 获取图形对象失败', error)
      throw error
    }
  }

  /**
   * 设置模型方向
   * @param heading 航向角（度）
   * @param pitch 俯仰角（度）
   * @param roll 翻滚角（度）
   */
  setOrientation(heading: number, pitch: number, roll: number): void {
    try {
      if (!this.entity || !this.entity.position) {
        throw new Error('实体对象或位置属性不存在')
      }

      const position = this.entity.position.getValue(this.viewer.clock.currentTime)
      if (!position) {
        throw new Error('无法获取当前位置')
      }

      const headingRad = Cesium.Math.toRadians(heading)
      const pitchRad = Cesium.Math.toRadians(pitch)
      const rollRad = Cesium.Math.toRadians(roll)

      const hpr = new Cesium.HeadingPitchRoll(headingRad, pitchRad, rollRad)
      const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr)

      this.entity.orientation = new Cesium.ConstantProperty(
        orientation
      ) as unknown as Cesium.Property

      // 更新 attribute 中的值
      if (this.entity.attribute?.style) {
        this.entity.attribute.style.heading = heading
        this.entity.attribute.style.pitch = pitch
        this.entity.attribute.style.roll = roll
      }
    } catch (error) {
      console.error('EditModel.setOrientation: 设置模型方向失败', error)
      throw error
    }
  }

  /**
   * 获取模型方向
   * @returns {heading, pitch, roll} 以度为单位
   */
  getOrientation(): { heading: number; pitch: number; roll: number } {
    try {
      if (!this.entity || !this.entity.position || !this.entity.orientation) {
        throw new Error('实体对象、位置或方向属性不存在')
      }

      const position = this.entity.position.getValue(this.viewer.clock.currentTime)
      const orientation = this.entity.orientation.getValue(this.viewer.clock.currentTime)

      if (!position || !orientation) {
        throw new Error('无法获取当前位置或方向')
      }

      const matrix = Cesium.Matrix4.fromRotationTranslation(
        Cesium.Matrix3.fromQuaternion(orientation),
        position
      )

      const hpr = Cesium.Transforms.fixedFrameToHeadingPitchRoll(matrix)

      return {
        heading: Cesium.Math.toDegrees(hpr.heading),
        pitch: Cesium.Math.toDegrees(hpr.pitch),
        roll: Cesium.Math.toDegrees(hpr.roll)
      }
    } catch (error) {
      console.error('EditModel.getOrientation: 获取模型方向失败', error)
      return { heading: 0, pitch: 0, roll: 0 }
    }
  }

  /**
   * 设置模型缩放
   * @param scale 缩放比例
   */
  setScale(scale: number): void {
    try {
      if (!this.entity || !this.entity.model) {
        throw new Error('实体对象或模型属性不存在')
      }

      this.entity.model.scale = new Cesium.ConstantProperty(
        scale
      ) as unknown as Cesium.Property

      // 更新 attribute 中的值
      if (this.entity.attribute?.style) {
        this.entity.attribute.style.scale = scale
      }
    } catch (error) {
      console.error('EditModel.setScale: 设置模型缩放失败', error)
      throw error
    }
  }

  /**
   * 获取模型缩放
   * @returns 缩放比例
   */
  getScale(): number {
    try {
      if (!this.entity || !this.entity.model || !this.entity.model.scale) {
        return 1
      }

      const scaleValue = this.entity.model.scale.getValue(this.viewer.clock.currentTime)
      return typeof scaleValue === 'number' ? scaleValue : 1
    } catch (error) {
      console.error('EditModel.getScale: 获取模型缩放失败', error)
      return 1
    }
  }

  /**
   * 旋转模型
   * @param deltaHeading 航向角增量（度）
   * @param deltaPitch 俯仰角增量（度）
   * @param deltaRoll 翻滚角增量（度）
   */
  rotate(deltaHeading: number = 0, deltaPitch: number = 0, deltaRoll: number = 0): void {
    try {
      const current = this.getOrientation()
      this.setOrientation(
        current.heading + deltaHeading,
        current.pitch + deltaPitch,
        current.roll + deltaRoll
      )
    } catch (error) {
      console.error('EditModel.rotate: 旋转模型失败', error)
      throw error
    }
  }
}
