import * as Cesium from 'cesium'
import { EditPolygonEx } from './EditPolygonEx'
import { computeRegularPositions } from '@ktd-cesium/shared'
import type { ExtendedEntity } from './EditBase'

/**
 * 扩展的 Entity 接口，包含正多边形特有属性
 */
interface RegularEntity {
  _positions_draw?: Cesium.Cartesian3[]
  _positions_show?: Cesium.Cartesian3[]
  attribute?: Record<string, unknown>
}

/**
 * 正多边形编辑类
 * 用于编辑由圆心和一个顶点确定的正多边形
 */
export class EditRegular extends EditPolygonEx {
  declare entity: ExtendedEntity & RegularEntity
  protected override _minPointNum = 2
  protected override _maxPointNum = 2

  /**
   * 根据标绘绘制的点，生成显示的边界点
   * @param positions 原始绘制点(圆心和一个顶点)
   * @param attribute 属性，包含 config.border 边数
   * @returns 正多边形的顶点
   */
  protected override getShowPositions(
    positions: Cesium.Cartesian3[],
    attribute: Record<string, unknown>
  ): Cesium.Cartesian3[] {
    try {
      // 验证输入参数
      if (!positions || !Array.isArray(positions)) {
        throw new Error('positions 参数必须是数组')
      }

      if (positions.length < 2) {
        console.warn('EditRegular.getShowPositions: 正多边形需要至少2个点')
        return positions
      }

      // 验证每个位置
      for (let i = 0; i < positions.length; i++) {
        if (!(positions[i] instanceof Cesium.Cartesian3)) {
          throw new Error(`位置[${i}]不是 Cesium.Cartesian3 类型`)
        }
      }

      // 获取边数
      const config = attribute?.config as { border?: number } | undefined
      const sides = config?.border || 6

      // 计算正多边形的显示点
      return computeRegularPositions(positions, sides)
    } catch (error) {
      console.error('EditRegular.getShowPositions: 获取显示位置失败', error)
      // 返回原始位置作为备选
      return positions
    }
  }
}
