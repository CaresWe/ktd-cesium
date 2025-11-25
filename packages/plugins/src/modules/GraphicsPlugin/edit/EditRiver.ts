import { EditWater } from './EditWater'
import type { RiverEditPrimitive } from '../types'

/**
 * 河流编辑类
 * 继承自 EditWater
 * 支持：
 * - 河流路径编辑
 * - 河流宽度调整
 * - 流速调整
 * - 流向调整
 */
export class EditRiver extends EditWater {
  declare bindedPrimitive: RiverEditPrimitive | null

  /**
   * 设置河流宽度
   * @param width 宽度（米）
   */
  setRiverWidth(width: number): void {
    try {
      if (!this.bindedPrimitive || !this.bindedPrimitive._riverAttribute) {
        throw new Error('河流 Primitive 或属性不存在')
      }

      if (!this.bindedPrimitive._riverAttribute.style) {
        this.bindedPrimitive._riverAttribute.style = {}
      }

      this.bindedPrimitive._riverAttribute.style.width = width

      // 触发几何体更新
      if (this.updateGeometryCallback) {
        this.updateGeometryCallback()
      }
    } catch (error) {
      console.error('EditRiver.setRiverWidth: 设置河流宽度失败', error)
      throw error
    }
  }

  /**
   * 获取河流宽度
   * @returns 宽度（米）
   */
  getRiverWidth(): number {
    try {
      if (!this.bindedPrimitive || !this.bindedPrimitive._riverAttribute) {
        return 50 // 默认宽度
      }

      return this.bindedPrimitive._riverAttribute.style?.width ?? 50
    } catch (error) {
      console.error('EditRiver.getRiverWidth: 获取河流宽度失败', error)
      return 50
    }
  }

  /**
   * 设置流速
   * @param velocity 流速
   */
  setFlowVelocity(velocity: number): void {
    try {
      if (!this.bindedPrimitive || !this.bindedPrimitive._riverAttribute) {
        throw new Error('河流 Primitive 或属性不存在')
      }

      if (!this.bindedPrimitive._riverAttribute.style) {
        this.bindedPrimitive._riverAttribute.style = {}
      }

      this.bindedPrimitive._riverAttribute.style.flowSpeed = velocity
    } catch (error) {
      console.error('EditRiver.setFlowVelocity: 设置流速失败', error)
      throw error
    }
  }

  /**
   * 获取流速
   * @returns 流速
   */
  getFlowVelocity(): number {
    try {
      if (!this.bindedPrimitive || !this.bindedPrimitive._riverAttribute) {
        return 1 // 默认流速
      }

      return this.bindedPrimitive._riverAttribute.style?.flowSpeed ?? 1
    } catch (error) {
      console.error('EditRiver.getFlowVelocity: 获取流速失败', error)
      return 1
    }
  }

  /**
   * 设置流向
   * @param direction 流向角度（度）
   */
  setFlowDirection(direction: number): void {
    try {
      if (!this.bindedPrimitive || !this.bindedPrimitive._riverAttribute) {
        throw new Error('河流 Primitive 或属性不存在')
      }

      if (!this.bindedPrimitive._riverAttribute.style) {
        this.bindedPrimitive._riverAttribute.style = {}
      }

      this.bindedPrimitive._riverAttribute.style.flowDirection = direction
    } catch (error) {
      console.error('EditRiver.setFlowDirection: 设置流向失败', error)
      throw error
    }
  }

  /**
   * 获取流向
   * @returns 流向角度（度）
   */
  getFlowDirection(): number {
    try {
      if (!this.bindedPrimitive || !this.bindedPrimitive._riverAttribute) {
        return 0 // 默认流向
      }

      return this.bindedPrimitive._riverAttribute.style?.flowDirection ?? 0
    } catch (error) {
      console.error('EditRiver.getFlowDirection: 获取流向失败', error)
      return 0
    }
  }

  /**
   * 获取河流深度
   * @returns 深度（米）
   */
  getDepth(): number {
    try {
      if (!this.bindedPrimitive || !this.bindedPrimitive._riverAttribute) {
        return 5 // 默认深度
      }

      return this.bindedPrimitive._riverAttribute.style?.depth ?? 5
    } catch (error) {
      console.error('EditRiver.getDepth: 获取河流深度失败', error)
      return 5
    }
  }

  /**
   * 设置河流深度
   * @param depth 深度（米）
   */
  setDepth(depth: number): void {
    try {
      if (!this.bindedPrimitive || !this.bindedPrimitive._riverAttribute) {
        throw new Error('河流 Primitive 或属性不存在')
      }

      if (!this.bindedPrimitive._riverAttribute.style) {
        this.bindedPrimitive._riverAttribute.style = {}
      }

      this.bindedPrimitive._riverAttribute.style.depth = depth

      // 触发几何体更新
      if (this.updateGeometryCallback) {
        this.updateGeometryCallback()
      }
    } catch (error) {
      console.error('EditRiver.setDepth: 设置河流深度失败', error)
      throw error
    }
  }
}
