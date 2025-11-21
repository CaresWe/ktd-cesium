import * as Cesium from 'cesium'
import { EditPolygonEx } from './EditPolygonEx'
import { computeCloseCurvePositions } from '@ktd-cesium/shared'
import type { ExtendedEntity } from './EditBase'

/**
 * 扩展的 Entity 接口，包含闭合曲面特有属性
 */
interface CloseCurveEntity {
  _positions_draw?: Cesium.Cartesian3[]
  _positions_show?: Cesium.Cartesian3[]
  attribute?: Record<string, unknown>
}

/**
 * 闭合曲面编辑类
 * 用于编辑由多个点确定的闭合曲面
 */
export class EditCloseCurve extends EditPolygonEx {
  declare entity: ExtendedEntity & CloseCurveEntity
  protected override _minPointNum = 3
  protected override _maxPointNum = 999
  protected override _hasMidPoint = true // 可以添加中间点

  /**
   * 根据标绘绘制的点，生成显示的边界点
   * @param positions 原始绘制点(至少3个)
   * @param _attribute 属性
   * @returns 闭合曲面的显示点位
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
        console.warn('EditCloseCurve.getShowPositions: 闭合曲面需要至少3个点')
        return positions
      }

      // 验证每个位置
      for (let i = 0; i < positions.length; i++) {
        if (!(positions[i] instanceof Cesium.Cartesian3)) {
          throw new Error(`位置[${i}]不是 Cesium.Cartesian3 类型`)
        }
      }

      // 计算闭合曲面的显示点
      return computeCloseCurvePositions(positions)
    } catch (error) {
      console.error('EditCloseCurve.getShowPositions: 获取显示位置失败', error)
      // 返回原始位置作为备选
      return positions
    }
  }
}
