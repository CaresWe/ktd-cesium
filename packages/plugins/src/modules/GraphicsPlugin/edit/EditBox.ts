import * as Cesium from 'cesium'
import { EditBase } from './EditBase'
import type { ExtendedEntity } from './EditBase'
import * as draggerCtl from './Dragger'
import { defaultMessages } from '../../TooltipPlugin/messages'
import { setPositionsHeight, getPositionTranslation } from '@ktd-cesium/shared'
import type { BoxEditStyle, BoxEditEntity } from '../types'

/**
 * 立方体编辑类
 * 继承自 EditBase
 */
export class EditBox extends EditBase {
  declare entity: ExtendedEntity & BoxEditEntity

  /**
   * 图形编辑结束后调用
   */
  protected finish(): void {
    try {
      // 清理资源
      if (this.draggers && this.draggers.length > 0) {
        // 清理拖拽点
        this.draggers = []
      }
    } catch (error) {
      console.error('EditBox.finish: 清理失败', error)
      // finish 方法的错误不向上抛出，避免影响编辑结束流程
    }
  }

  /**
   * 更新Box的尺寸
   */
  updateBox(style: BoxEditStyle): void {
    try {
      // 验证 style 参数
      if (!style) {
        const error = new Error('style 参数不能为空')
        console.error('EditBox.updateBox:', error.message)
        throw error
      }

      // 验证 entity
      if (!this.entity) {
        const error = new Error('实体对象不存在')
        console.error('EditBox.updateBox:', error.message)
        throw error
      }

      if (!this.entity.box) {
        const error = new Error('实体的 box 属性不存在')
        console.error('EditBox.updateBox:', error.message)
        throw error
      }

      if (!this.entity.box.dimensions) {
        const error = new Error('实体的 box.dimensions 属性不存在')
        console.error('EditBox.updateBox:', error.message)
        throw error
      }

      if (!('setValue' in this.entity.box.dimensions)) {
        const error = new Error('box.dimensions 不支持 setValue 方法')
        console.error('EditBox.updateBox:', error.message)
        throw error
      }

      // 获取尺寸值并验证
      const dimensionsX = style.dimensionsX ?? 100.0
      const dimensionsY = style.dimensionsY ?? 100.0
      const dimensionsZ = style.dimensionsZ ?? 100.0

      // 验证尺寸值的有效性
      if (!Number.isFinite(dimensionsX) || dimensionsX <= 0) {
        const error = new Error(`dimensionsX 值无效: ${dimensionsX}`)
        console.error('EditBox.updateBox:', error.message)
        throw error
      }

      if (!Number.isFinite(dimensionsY) || dimensionsY <= 0) {
        const error = new Error(`dimensionsY 值无效: ${dimensionsY}`)
        console.error('EditBox.updateBox:', error.message)
        throw error
      }

      if (!Number.isFinite(dimensionsZ) || dimensionsZ <= 0) {
        const error = new Error(`dimensionsZ 值无效: ${dimensionsZ}`)
        console.error('EditBox.updateBox:', error.message)
        throw error
      }

      const dimensions = new Cesium.Cartesian3(dimensionsX, dimensionsY, dimensionsZ)

      // 设置尺寸
      ;(this.entity.box.dimensions as Cesium.ConstantProperty).setValue(dimensions)
    } catch (error) {
      console.error('EditBox.updateBox: 更新Box尺寸失败', error)
      throw error // 向上抛出错误
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
        console.error('EditBox.bindDraggers:', error.message)
        throw error
      }

      if (!this.dataSource) {
        const error = new Error('数据源对象不存在')
        console.error('EditBox.bindDraggers:', error.message)
        throw error
      }

      if (!this.entity.attribute) {
        const error = new Error('实体的 attribute 属性不存在')
        console.error('EditBox.bindDraggers:', error.message)
        throw error
      }

      const style = this.entity.attribute.style
      if (!style) {
        const error = new Error('实体的 attribute.style 不存在')
        console.error('EditBox.bindDraggers:', error.message)
        throw error
      }

      const positionZXD = this.entity._positions_draw
      if (!positionZXD) {
        const error = new Error('实体的 _positions_draw 不存在')
        console.error('EditBox.bindDraggers:', error.message)
        throw error
      }

      if (!(positionZXD instanceof Cesium.Cartesian3)) {
        const error = new Error('_positions_draw 必须是 Cesium.Cartesian3 类型')
        console.error('EditBox.bindDraggers:', error.message)
        throw error
      }

      // 位置中心点
      const centerDragger = draggerCtl.createDragger(this.dataSource, {
        position: positionZXD,
        onDrag: (_dragger: Cesium.Entity, position: Cesium.Cartesian3) => {
          try {
            // 验证新位置
            if (!position || !(position instanceof Cesium.Cartesian3)) {
              throw new Error('拖拽位置无效')
            }

            if (
              !Cesium.defined(position) ||
              !Number.isFinite(position.x) ||
              !Number.isFinite(position.y) ||
              !Number.isFinite(position.z)
            ) {
              throw new Error('拖拽位置坐标值无效')
            }

            if (!this.entity._positions_draw) {
              throw new Error('实体的 _positions_draw 不存在')
            }

            this.entity._positions_draw = position
            this.updateDraggers()
          } catch (error) {
            console.error('EditBox.centerDragger.onDrag: 拖拽中心点失败', error)
            // 拖拽过程中的错误不向上抛出，避免中断交互
          }
        }
      })

      if (!centerDragger) {
        const error = new Error('中心拖拽点创建失败')
        console.error('EditBox.bindDraggers:', error.message)
        throw error
      }

      this.draggers.push(centerDragger)

      // X长度调整
      const offsetX = { x: (style.dimensionsX ?? 100) / 2, y: 0, z: 0 }
      const position1 = getPositionTranslation(positionZXD, offsetX)
      if (!position1) {
        const error = new Error('计算X方向位置失败')
        console.error('EditBox.bindDraggers:', error.message)
        throw error
      }

      const draggerX = draggerCtl.createDragger(this.dataSource, {
        position: position1,
        type: draggerCtl.PointType.EditAttr,
        tooltip: defaultMessages.dragger.editRadius.replace('半径', '长度(X方向)'),
        onDrag: (dragger: Cesium.Entity, position: Cesium.Cartesian3) => {
          try {
            // 验证位置
            if (!position || !(position instanceof Cesium.Cartesian3)) {
              throw new Error('拖拽位置无效')
            }

            if (!positionZXD) {
              throw new Error('中心位置不存在')
            }

            const cartographic = Cesium.Cartographic.fromCartesian(positionZXD)
            if (!cartographic) {
              throw new Error('无法获取中心点高度')
            }

            const newHeight = cartographic.height
            if (!Number.isFinite(newHeight)) {
              throw new Error('中心点高度无效')
            }

            const adjustedPosition = setPositionsHeight(position, newHeight)
            if (!adjustedPosition) {
              throw new Error('设置高度失败')
            }

            if (!(adjustedPosition instanceof Cesium.Cartesian3)) {
              throw new Error('调整后的位置类型无效')
            }

            const draggerEntity = dragger as ExtendedEntity
            if (!draggerEntity) {
              throw new Error('拖拽实体不存在')
            }

            draggerEntity.position = adjustedPosition

            const distance = Cesium.Cartesian3.distance(positionZXD, adjustedPosition)
            if (!Number.isFinite(distance) || distance < 0) {
              throw new Error('距离计算结果无效')
            }

            const radius = this.formatNum(distance, 2)
            if (style) {
              style.dimensionsX = radius * 2
              this.updateBox(style)
              this.updateDraggers()
            }
          } catch (error) {
            console.error('EditBox.draggerX.onDrag: 拖拽X方向失败', error)
            // 拖拽过程中的错误不向上抛出，避免中断交互
          }
        }
      })

      if (!draggerX) {
        const error = new Error('X方向拖拽点创建失败')
        console.error('EditBox.bindDraggers:', error.message)
        throw error
      }

      this.draggers.push(draggerX)

      // Y宽度调整
      const offsetY = { x: 0, y: (style.dimensionsY ?? 100) / 2, z: 0 }
      const position2 = getPositionTranslation(positionZXD, offsetY)
      if (!position2) {
        const error = new Error('计算Y方向位置失败')
        console.error('EditBox.bindDraggers:', error.message)
        throw error
      }

      const draggerY = draggerCtl.createDragger(this.dataSource, {
        position: position2,
        type: draggerCtl.PointType.EditAttr,
        tooltip: defaultMessages.dragger.editRadius.replace('半径', '宽度(Y方向)'),
        onDrag: (dragger: Cesium.Entity, position: Cesium.Cartesian3) => {
          try {
            // 验证位置
            if (!position || !(position instanceof Cesium.Cartesian3)) {
              throw new Error('拖拽位置无效')
            }

            if (!positionZXD) {
              throw new Error('中心位置不存在')
            }

            const cartographic = Cesium.Cartographic.fromCartesian(positionZXD)
            if (!cartographic) {
              throw new Error('无法获取中心点高度')
            }

            const newHeight = cartographic.height
            if (!Number.isFinite(newHeight)) {
              throw new Error('中心点高度无效')
            }

            const adjustedPosition = setPositionsHeight(position, newHeight)
            if (!adjustedPosition) {
              throw new Error('设置高度失败')
            }

            if (!(adjustedPosition instanceof Cesium.Cartesian3)) {
              throw new Error('调整后的位置类型无效')
            }

            const draggerEntity = dragger as ExtendedEntity
            if (!draggerEntity) {
              throw new Error('拖拽实体不存在')
            }

            draggerEntity.position = adjustedPosition

            const distance = Cesium.Cartesian3.distance(positionZXD, adjustedPosition)
            if (!Number.isFinite(distance) || distance < 0) {
              throw new Error('距离计算结果无效')
            }

            const radius = this.formatNum(distance, 2)
            if (style) {
              style.dimensionsY = radius * 2
              this.updateBox(style)
              this.updateDraggers()
            }
          } catch (error) {
            console.error('EditBox.draggerY.onDrag: 拖拽Y方向失败', error)
            // 拖拽过程中的错误不向上抛出，避免中断交互
          }
        }
      })

      if (!draggerY) {
        const error = new Error('Y方向拖拽点创建失败')
        console.error('EditBox.bindDraggers:', error.message)
        throw error
      }

      this.draggers.push(draggerY)

      // Z高度调整
      const offsetZ = { x: 0, y: 0, z: (style.dimensionsZ ?? 100) / 2 }
      const position3 = getPositionTranslation(positionZXD, offsetZ)
      if (!position3) {
        const error = new Error('计算Z方向位置失败')
        console.error('EditBox.bindDraggers:', error.message)
        throw error
      }

      const draggerZ = draggerCtl.createDragger(this.dataSource, {
        position: position3,
        type: draggerCtl.PointType.MoveHeight,
        tooltip: defaultMessages.dragger.editRadius.replace('半径', '高度(Z方向)'),
        onDrag: (_dragger: Cesium.Entity, position: Cesium.Cartesian3) => {
          try {
            // 验证位置
            if (!position || !(position instanceof Cesium.Cartesian3)) {
              throw new Error('拖拽位置无效')
            }

            if (!positionZXD) {
              throw new Error('中心位置不存在')
            }

            const distance = Cesium.Cartesian3.distance(positionZXD, position)
            if (!Number.isFinite(distance) || distance < 0) {
              throw new Error('距离计算结果无效')
            }

            const radius = this.formatNum(distance, 2)
            if (style) {
              style.dimensionsZ = radius * 2
              this.updateBox(style)
              this.updateDraggers()
            }
          } catch (error) {
            console.error('EditBox.draggerZ.onDrag: 拖拽Z方向失败', error)
            // 拖拽过程中的错误不向上抛出，避免中断交互
          }
        }
      })

      if (!draggerZ) {
        const error = new Error('Z方向拖拽点创建失败')
        console.error('EditBox.bindDraggers:', error.message)
        throw error
      }

      this.draggers.push(draggerZ)
    } catch (error) {
      console.error('EditBox.bindDraggers: 绑定拖拽点失败', error)
      throw error // 向上抛出错误
    }
  }
}
