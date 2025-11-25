import * as Cesium from 'cesium'
import { EditPolygonEx } from './EditPolygonEx'
import { computeAttackArrowPositions } from '@ktd-cesium/shared'
import type { ExtendedEntity } from './EditBase'
import type { AttackArrowEditEntity } from '../types/index'

/**
 * 攻击箭头编辑类
 * 用于编辑由多个点确定的攻击箭头
 */
export class EditAttackArrow extends EditPolygonEx {
  declare entity: ExtendedEntity & AttackArrowEditEntity
  protected override _minPointNum = 3
  protected override _maxPointNum = 999
  protected override _hasMidPoint = true // 可以添加中间点

  /**
   * 根据标绘绘制的点，生成显示的边界点
   * @param positions 原始绘制点(至少3个)
   * @param _attribute 属性
   * @returns 攻击箭头的显示点位
   */
  protected override getShowPositions(
    positions: Cesium.Cartesian3[],
    _attribute: Record<string, unknown>
  ): Cesium.Cartesian3[] {
    try {
      // 验证输入参数
      if (!positions || !Array.isArray(positions)) {
        throw new Error('positions 参数必须是数组')
      }

      if (positions.length < 3) {
        console.warn('EditAttackArrow.getShowPositions: 攻击箭头需要至少3个点')
        return positions
      }

      // 验证每个位置
      for (let i = 0; i < positions.length; i++) {
        if (!(positions[i] instanceof Cesium.Cartesian3)) {
          throw new Error(`位置[${i}]不是 Cesium.Cartesian3 类型`)
        }
      }

      // 计算攻击箭头的显示点
      return computeAttackArrowPositions(positions)
    } catch (error) {
      console.error('EditAttackArrow.getShowPositions: 获取显示位置失败', error)
      // 返回原始位置作为备选
      return positions
    }
  }
}
