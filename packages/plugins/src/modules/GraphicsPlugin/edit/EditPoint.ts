import * as Cesium from 'cesium'
import { EditBase, type ExtendedEntity } from './EditBase'
import * as draggerCtl from './Dragger'
import { defaultMessages } from '../../TooltipPlugin/messages'

/**
 * 点编辑类
 * 用于编辑点、标注、模型等单点图形
 */
export class EditPoint extends EditBase {
  /**
   * 外部更新位置
   */
  setPositions(position: Cesium.Cartesian3 | Cesium.Cartesian3[]): void {
    try {
      // 参数验证
      if (!position) {
        const error = new Error('位置参数不能为空')
        console.error('EditPoint.setPositions:', error.message)
        throw error
      }

      // 如果传入的是数组且只有一个元素，取出该元素
      let finalPosition = position
      if (Array.isArray(position)) {
        if (position.length === 0) {
          const error = new Error('位置数组不能为空')
          console.error('EditPoint.setPositions:', error.message)
          throw error
        }
        if (position.length === 1) {
          finalPosition = position[0]
        }
        if (position.length > 1) {
          console.warn('EditPoint.setPositions: 点编辑只支持单个位置，将使用第一个位置')
          finalPosition = position[0]
        }
      }

      // 验证 finalPosition 是否为有效的 Cartesian3
      if (!(finalPosition instanceof Cesium.Cartesian3)) {
        const error = new Error('位置参数必须是 Cesium.Cartesian3 类型')
        console.error('EditPoint.setPositions:', error.message, finalPosition)
        throw error
      }

      // 验证 Cartesian3 的有效性
      if (
        !Cesium.defined(finalPosition) ||
        !Number.isFinite(finalPosition.x) ||
        !Number.isFinite(finalPosition.y) ||
        !Number.isFinite(finalPosition.z)
      ) {
        const error = new Error('位置坐标值无效')
        console.error('EditPoint.setPositions:', error.message, finalPosition)
        throw error
      }

      // 验证 entity 和 position 属性
      if (!this.entity) {
        const error = new Error('实体对象不存在')
        console.error('EditPoint.setPositions:', error.message)
        throw error
      }

      if (!this.entity.position) {
        const error = new Error('实体的 position 属性不存在')
        console.error('EditPoint.setPositions:', error.message)
        throw error
      }

      if (!('setValue' in this.entity.position)) {
        const error = new Error('实体的 position 不支持 setValue 方法')
        console.error('EditPoint.setPositions:', error.message)
        throw error
      }

      // 设置位置
      ;(this.entity.position as Cesium.ConstantPositionProperty).setValue(finalPosition as Cesium.Cartesian3)
    } catch (error) {
      console.error('EditPoint.setPositions: 设置位置失败', error)
      throw error // 向上抛出错误，让调用者处理
    }
  }

  /**
   * 绑定拖拽点
   */
  protected bindDraggers(): void {
    try {
      // 验证必要的属性
      if (!this.entity) {
        const error = new Error('实体对象不存在')
        console.error('EditPoint.bindDraggers:', error.message)
        throw error
      }

      if (!this.dataSource) {
        const error = new Error('数据源对象不存在')
        console.error('EditPoint.bindDraggers:', error.message)
        throw error
      }

      // 设置提示信息
      this.entity.draw_tooltip = defaultMessages.dragger.def

      // 创建拖拽点
      const dragger = draggerCtl.createDragger(this.dataSource, {
        dragger: this.entity as Cesium.Entity,
        onDrag: (_dragger: Cesium.Entity, newPosition: Cesium.Cartesian3) => {
          try {
            // 验证新位置
            if (!newPosition || !(newPosition instanceof Cesium.Cartesian3)) {
              throw new Error('拖拽位置无效')
            }

            if (
              !Cesium.defined(newPosition) ||
              !Number.isFinite(newPosition.x) ||
              !Number.isFinite(newPosition.y) ||
              !Number.isFinite(newPosition.z)
            ) {
              throw new Error('拖拽位置坐标值无效')
            }

            const entity = this.entity as ExtendedEntity

            if (!entity.position) {
              throw new Error('实体的 position 属性不存在')
            }

            if (!('setValue' in entity.position)) {
              throw new Error('实体的 position 不支持 setValue 方法')
            }

            // 更新位置
            ;(entity.position as Cesium.ConstantPositionProperty).setValue(newPosition)
          } catch (error) {
            console.error('EditPoint.onDrag: 拖拽更新位置失败', error)
            // 拖拽过程中的错误不向上抛出，避免中断交互
          }
        }
      })

      // 验证 dragger 是否创建成功
      if (!dragger) {
        const error = new Error('拖拽点创建失败')
        console.error('EditPoint.bindDraggers:', error.message)
        throw error
      }
    } catch (error) {
      console.error('EditPoint.bindDraggers: 绑定拖拽点失败', error)
      throw error // 向上抛出错误
    }
  }

  /**
   * 图形编辑结束后调用
   */
  protected finish(): void {
    try {
      if (!this.entity) {
        console.warn('EditPoint.finish: 实体对象不存在，跳过清理')
        return
      }

      this.entity.draw_tooltip = undefined
    } catch (error) {
      console.error('EditPoint.finish: 清理失败', error)
      // finish 方法的错误不向上抛出，避免影响编辑结束流程
    }
  }
}
