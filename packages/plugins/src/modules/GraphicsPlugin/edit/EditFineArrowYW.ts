import * as Cesium from 'cesium'
import { EditPolygonEx } from './EditPolygonEx'
import { computeFineArrowYWPositions } from '@ktd-cesium/shared'
import type { ExtendedEntity } from './EditBase'

/**
 * 扩展的 Entity 接口，包含细直箭头（燕尾）特有属性
 */
interface FineArrowYWEntity {
  _positions_draw?: Cesium.Cartesian3[]
  _positions_show?: Cesium.Cartesian3[]
  attribute?: Record<string, unknown>
}

/**
 * 细直箭头（燕尾）编辑类
 * 用于编辑由2个点确定的细直箭头（燕尾）
 */
export class EditFineArrowYW extends EditPolygonEx {
  declare entity: ExtendedEntity & FineArrowYWEntity
  protected override _minPointNum = 2
  protected override _maxPointNum = 2
  protected override _hasMidPoint = false // 不可以添加中间点

  /**
   * 根据标绘绘制的点，生成显示的边界点
   * @param positions 原始绘制点(2个)
   * @param _attribute 属性
   * @returns 细直箭头（燕尾）的显示点位
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

      if (positions.length < 2) {
        console.warn('EditFineArrowYW.getShowPositions: 细直箭头（燕尾）需要2个点')
        return positions
      }

      // 验证每个位置
      for (let i = 0; i < positions.length; i++) {
        if (!(positions[i] instanceof Cesium.Cartesian3)) {
          throw new Error(`位置[${i}]不是 Cesium.Cartesian3 类型`)
        }
      }

      // 计算细直箭头（燕尾）的显示点
      return computeFineArrowYWPositions(positions)
    } catch (error) {
      console.error('EditFineArrowYW.getShowPositions: 获取显示位置失败', error)
      // 返回原始位置作为备选
      return positions
    }
  }
}
