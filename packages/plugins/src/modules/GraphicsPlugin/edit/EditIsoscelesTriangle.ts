import * as Cesium from 'cesium'
import { EditPolygonEx } from './EditPolygonEx'
import { computeIsoscelesTrianglePositions } from '@ktd-cesium/shared'
import type { ExtendedEntity } from './EditBase'
import type { IsoscelesTriangleEditEntity } from '../types/index'

/**
 * 等腰三角形编辑类
 * 用于编辑由3个点确定的等腰三角形
 */
export class EditIsoscelesTriangle extends EditPolygonEx {
  declare entity: ExtendedEntity & IsoscelesTriangleEditEntity
  protected override _minPointNum = 3
  protected override _maxPointNum = 3

  /**
   * 根据标绘绘制的点，生成显示的边界点
   * @param positions 原始绘制点(3个)
   * @param _attribute 属性
   * @returns 等腰三角形的3个顶点
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
        console.warn('EditIsoscelesTriangle.getShowPositions: 等腰三角形需要至少3个点')
        return positions
      }

      // 验证每个位置
      for (let i = 0; i < positions.length; i++) {
        if (!(positions[i] instanceof Cesium.Cartesian3)) {
          throw new Error(`位置[${i}]不是 Cesium.Cartesian3 类型`)
        }
      }

      // 计算等腰三角形的显示点
      return computeIsoscelesTrianglePositions(positions)
    } catch (error) {
      console.error('EditIsoscelesTriangle.getShowPositions: 获取显示位置失败', error)
      // 返回原始位置作为备选
      return positions
    }
  }
}
