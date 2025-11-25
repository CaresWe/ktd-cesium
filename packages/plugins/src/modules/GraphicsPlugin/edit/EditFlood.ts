import { EditWater } from './EditWater'
import type { FloodEditPrimitive } from '../types'

/**
 * 洪水淹没编辑类
 * 继承自 EditWater
 * 支持：
 * - 洪水区域编辑（多边形顶点编辑）
 * - 水位控制
 * - 动画控制（开始、暂停、恢复、停止）
 * - 淹没速度调整
 */
export class EditFlood extends EditWater {
  declare bindedPrimitive: FloodEditPrimitive | null

  /**
   * 设置水位高度
   * @param height 高度（米）
   */
  setWaterLevel(height: number): void {
    try {
      if (!this.bindedPrimitive || !this.bindedPrimitive._floodAttribute) {
        throw new Error('洪水 Primitive 或属性不存在')
      }

      if (!this.bindedPrimitive._floodAttribute.style) {
        this.bindedPrimitive._floodAttribute.style = {}
      }

      this.bindedPrimitive._floodAttribute.style.height = height

      // 触发几何体更新
      if (this.updateGeometryCallback) {
        this.updateGeometryCallback()
      }
    } catch (error) {
      console.error('EditFlood.setWaterLevel: 设置水位高度失败', error)
      throw error
    }
  }

  /**
   * 获取当前水位
   * @returns 水位高度（米）
   */
  getCurrentWaterLevel(): number {
    try {
      if (!this.bindedPrimitive || !this.bindedPrimitive._floodAttribute) {
        return 0
      }

      return this.bindedPrimitive._floodAttribute.style?.height ?? 0
    } catch (error) {
      console.error('EditFlood.getCurrentWaterLevel: 获取水位失败', error)
      return 0
    }
  }

  /**
   * 设置起始水位
   * @param height 起始高度（米）
   */
  setStartHeight(height: number): void {
    try {
      if (!this.bindedPrimitive || !this.bindedPrimitive._floodAttribute) {
        throw new Error('洪水 Primitive 或属性不存在')
      }

      if (!this.bindedPrimitive._floodAttribute.style) {
        this.bindedPrimitive._floodAttribute.style = {}
      }

      this.bindedPrimitive._floodAttribute.style.startHeight = height
    } catch (error) {
      console.error('EditFlood.setStartHeight: 设置起始水位失败', error)
      throw error
    }
  }

  /**
   * 获取起始水位
   * @returns 起始高度（米）
   */
  getStartHeight(): number {
    try {
      if (!this.bindedPrimitive || !this.bindedPrimitive._floodAttribute) {
        return 0
      }

      return this.bindedPrimitive._floodAttribute.style?.startHeight ?? 0
    } catch (error) {
      console.error('EditFlood.getStartHeight: 获取起始水位失败', error)
      return 0
    }
  }

  /**
   * 设置目标水位
   * @param height 目标高度（米）
   */
  setTargetHeight(height: number): void {
    try {
      if (!this.bindedPrimitive || !this.bindedPrimitive._floodAttribute) {
        throw new Error('洪水 Primitive 或属性不存在')
      }

      if (!this.bindedPrimitive._floodAttribute.style) {
        this.bindedPrimitive._floodAttribute.style = {}
      }

      this.bindedPrimitive._floodAttribute.style.targetHeight = height
    } catch (error) {
      console.error('EditFlood.setTargetHeight: 设置目标水位失败', error)
      throw error
    }
  }

  /**
   * 获取目标水位
   * @returns 目标高度（米）
   */
  getTargetHeight(): number {
    try {
      if (!this.bindedPrimitive || !this.bindedPrimitive._floodAttribute) {
        return 100
      }

      return this.bindedPrimitive._floodAttribute.style?.targetHeight ?? 100
    } catch (error) {
      console.error('EditFlood.getTargetHeight: 获取目标水位失败', error)
      return 100
    }
  }

  /**
   * 设置动画持续时间
   * @param duration 持续时间（秒）
   */
  setAnimationDuration(duration: number): void {
    try {
      if (!this.bindedPrimitive || !this.bindedPrimitive._floodAttribute) {
        throw new Error('洪水 Primitive 或属性不存在')
      }

      if (!this.bindedPrimitive._floodAttribute.style) {
        this.bindedPrimitive._floodAttribute.style = {}
      }

      this.bindedPrimitive._floodAttribute.style.duration = duration
    } catch (error) {
      console.error('EditFlood.setAnimationDuration: 设置动画持续时间失败', error)
      throw error
    }
  }

  /**
   * 获取动画持续时间
   * @returns 持续时间（秒）
   */
  getAnimationDuration(): number {
    try {
      if (!this.bindedPrimitive || !this.bindedPrimitive._floodAttribute) {
        return 10
      }

      return this.bindedPrimitive._floodAttribute.style?.duration ?? 10
    } catch (error) {
      console.error('EditFlood.getAnimationDuration: 获取动画持续时间失败', error)
      return 10
    }
  }

  /**
   * 设置上升速度
   * @param speed 速度系数（1为正常速度）
   */
  setRiseSpeed(speed: number): void {
    try {
      if (!this.bindedPrimitive || !this.bindedPrimitive._floodAttribute) {
        throw new Error('洪水 Primitive 或属性不存在')
      }

      if (!this.bindedPrimitive._floodAttribute.style) {
        this.bindedPrimitive._floodAttribute.style = {}
      }

      this.bindedPrimitive._floodAttribute.style.riseSpeed = speed
    } catch (error) {
      console.error('EditFlood.setRiseSpeed: 设置上升速度失败', error)
      throw error
    }
  }

  /**
   * 获取上升速度
   * @returns 速度系数
   */
  getRiseSpeed(): number {
    try {
      if (!this.bindedPrimitive || !this.bindedPrimitive._floodAttribute) {
        return 1
      }

      return this.bindedPrimitive._floodAttribute.style?.riseSpeed ?? 1
    } catch (error) {
      console.error('EditFlood.getRiseSpeed: 获取上升速度失败', error)
      return 1
    }
  }

  /**
   * 设置是否循环播放
   * @param loop 是否循环
   */
  setLoop(loop: boolean): void {
    try {
      if (!this.bindedPrimitive || !this.bindedPrimitive._floodAttribute) {
        throw new Error('洪水 Primitive 或属性不存在')
      }

      if (!this.bindedPrimitive._floodAttribute.style) {
        this.bindedPrimitive._floodAttribute.style = {}
      }

      this.bindedPrimitive._floodAttribute.style.loop = loop
    } catch (error) {
      console.error('EditFlood.setLoop: 设置循环播放失败', error)
      throw error
    }
  }

  /**
   * 获取是否循环播放
   * @returns 是否循环
   */
  getLoop(): boolean {
    try {
      if (!this.bindedPrimitive || !this.bindedPrimitive._floodAttribute) {
        return false
      }

      return this.bindedPrimitive._floodAttribute.style?.loop ?? false
    } catch (error) {
      console.error('EditFlood.getLoop: 获取循环播放状态失败', error)
      return false
    }
  }

  /**
   * 设置是否自动开始
   * @param autoStart 是否自动开始
   */
  setAutoStart(autoStart: boolean): void {
    try {
      if (!this.bindedPrimitive || !this.bindedPrimitive._floodAttribute) {
        throw new Error('洪水 Primitive 或属性不存在')
      }

      if (!this.bindedPrimitive._floodAttribute.style) {
        this.bindedPrimitive._floodAttribute.style = {}
      }

      this.bindedPrimitive._floodAttribute.style.autoStart = autoStart
    } catch (error) {
      console.error('EditFlood.setAutoStart: 设置自动开始失败', error)
      throw error
    }
  }

  /**
   * 获取是否自动开始
   * @returns 是否自动开始
   */
  getAutoStart(): boolean {
    try {
      if (!this.bindedPrimitive || !this.bindedPrimitive._floodAttribute) {
        return false
      }

      return this.bindedPrimitive._floodAttribute.style?.autoStart ?? false
    } catch (error) {
      console.error('EditFlood.getAutoStart: 获取自动开始状态失败', error)
      return false
    }
  }
}
