import * as Cesium from 'cesium'
import { EditPolygonEx } from './EditPolygonEx'
import { computeSectorPositions } from '@ktd-cesium/shared'
import type { ExtendedEntity } from './EditBase'

/**
 * 扩展的 Entity 接口，包含扇形特有属性
 */
interface SectorEntity {
  _positions_draw?: Cesium.Cartesian3[]
  _positions_show?: Cesium.Cartesian3[]
  attribute?: Record<string, unknown>
}

/**
 * 扇形编辑类
 * 用于编辑由圆心和两个边界点确定的扇形
 */
export class EditSector extends EditPolygonEx {
  declare entity: ExtendedEntity & SectorEntity
  protected override _minPointNum = 3
  protected override _maxPointNum = 3

  /**
   * 根据标绘绘制的点，生成显示的边界点
   * @param positions 原始绘制点(圆心、起点、终点)
   * @param _attribute 属性
   * @returns 扇形的显示点位
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
        console.warn('EditSector.getShowPositions: 扇形需要至少3个点')
        return positions
      }

      // 验证每个位置
      for (let i = 0; i < positions.length; i++) {
        if (!(positions[i] instanceof Cesium.Cartesian3)) {
          throw new Error(`位置[${i}]不是 Cesium.Cartesian3 类型`)
        }
      }

      // 计算扇形的显示点
      return computeSectorPositions(positions)
    } catch (error) {
      console.error('EditSector.getShowPositions: 获取显示位置失败', error)
      // 返回原始位置作为备选
      return positions
    }
  }
}
