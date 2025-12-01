import * as Cesium from 'cesium'
import { EditPolygon } from './EditPolygon'
import type { ExtendedEntity } from './EditBase'
import type { RectangleEditEntity } from '../types'
import * as draggerCtl from './Dragger'
import { defaultMessages } from '../../TooltipPlugin/messages'
import { setPositionsHeight, centerOfMass } from '@ktd-cesium/shared'

/**
 * 矩形编辑类
 * 继承自 EditPolygon
 */
export class EditRectangle extends EditPolygon {
  declare entity: ExtendedEntity & RectangleEditEntity

  /**
   * 获取图形对象
   * 返回 RectangleGraphics 对象
   */
  getGraphic(): Cesium.RectangleGraphics {
    try {
      if (!this.entity) {
        throw new Error('实体对象不存在')
      }

      if (!this.entity.rectangle) {
        throw new Error('实体的 rectangle 属性不存在')
      }

      return this.entity.rectangle
    } catch (error) {
      console.error('EditRectangle.getGraphic: 获取图形对象失败', error)
      throw error
    }
  }

  /**
   * 将位置转换为回调函数
   * 坐标改为回调属性
   */
  protected changePositionsToCallback(): void {
    try {
      if (!this.entity) {
        throw new Error('实体对象不存在')
      }

      this._positions_draw = this.entity._positions_draw || null
    } catch (error) {
      console.error('EditRectangle.changePositionsToCallback: 转换位置失败', error)
      throw error
    }
  }

  /**
   * 图形编辑结束后调用
   */
  protected finish(): void {
    try {
      if (!this.entity) {
        console.warn('EditRectangle.finish: 实体对象不存在')
        return
      }

      this.entity._positions_draw = this._positions_draw || undefined
    } catch (error) {
      console.error('EditRectangle.finish: 完成编辑失败', error)
      // finish 方法的错误不向上抛出，避免影响编辑结束流程
    }
  }

  /**
   * 是否贴地
   */
  isClampToGround(): boolean {
    try {
      return this.entity.attribute?.style?.clampToGround ?? false
    } catch (error) {
      console.error('EditRectangle.isClampToGround: 获取贴地状态失败', error)
      return false
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
        console.error('EditRectangle.bindDraggers:', error.message)
        throw error
      }

      if (!this.dataSource) {
        const error = new Error('数据源对象不存在')
        console.error('EditRectangle.bindDraggers:', error.message)
        throw error
      }

      const positions = this.getPosition()
      const graphic = this.getGraphic()

      if (!positions || positions.length === 0) {
        const error = new Error('位置数组为空')
        console.error('EditRectangle.bindDraggers:', error.message)
        throw error
      }

      // 绑定顶点拖拽点
      for (let i = 0, len = positions.length; i < len; i++) {
        let position = positions[i]

        if (!position || !(position instanceof Cesium.Cartesian3)) {
          console.warn(`EditRectangle.bindDraggers: 位置[${i}]无效，跳过`)
          continue
        }

        // 如果有 height 属性，设置高度
        if (graphic.height !== undefined && graphic.height) {
          const heightValue = (graphic.height as Cesium.Property).getValue(this.viewer.clock.currentTime) as number
          if (Number.isFinite(heightValue)) {
            position = setPositionsHeight(position, heightValue) as Cesium.Cartesian3
          }
        }

        // 创建各顶点拖拽点
        const dragger = draggerCtl.createDragger(this.dataSource, {
          position: position,
          onDrag: (_dragger: Cesium.Entity, dragPosition: Cesium.Cartesian3) => {
            try {
              if (!dragPosition || !(dragPosition instanceof Cesium.Cartesian3)) {
                throw new Error('拖拽位置无效')
              }

              const draggerEntity = _dragger as ExtendedEntity
              if (draggerEntity.index === undefined) {
                throw new Error('拖拽点索引不存在')
              }

              let updatedPosition = dragPosition
              const time = this.viewer.clock.currentTime

              // 如果有 height 属性，保持高度
              if (graphic.height !== undefined && graphic.height) {
                const newHeight = (graphic.height as Cesium.Property).getValue(time) as number
                if (Number.isFinite(newHeight)) {
                  updatedPosition = setPositionsHeight(updatedPosition, newHeight) as Cesium.Cartesian3
                  draggerEntity.position = updatedPosition
                }
              }

              positions[draggerEntity.index] = updatedPosition

              // 高度调整拖拽点处理
              if (this.heightDraggers && this.heightDraggers.length > 0 && graphic.extrudedHeight) {
                const extrudedHeight = (graphic.extrudedHeight as Cesium.Property).getValue(time) as number
                if (Number.isFinite(extrudedHeight) && this.heightDraggers[draggerEntity.index]) {
                  const heightPos = setPositionsHeight(updatedPosition, extrudedHeight) as Cesium.Cartesian3
                  this.heightDraggers[draggerEntity.index].position = heightPos
                }
              }

              // 整体平移移动点处理
              if (draggerMove) {
                let positionMove = centerOfMass(positions)
                if (graphic.height !== undefined && graphic.height) {
                  const newHeight = (graphic.height as Cesium.Property).getValue(time) as number
                  if (Number.isFinite(newHeight)) {
                    positionMove = setPositionsHeight(positionMove, newHeight) as Cesium.Cartesian3
                  }
                }
                draggerMove.position = positionMove
              }
            } catch (error) {
              console.error('EditRectangle.dragger.onDrag: 拖拽顶点失败', error)
              // 拖拽过程中的错误不向上抛出，避免中断交互
            }
          }
        })

        if (!dragger) {
          console.warn(`EditRectangle.bindDraggers: 创建拖拽点[${i}]失败`)
          continue
        }

        const draggerEntity = dragger as ExtendedEntity
        draggerEntity.index = i
        this.draggers.push(dragger)
      }

      // 整体平移移动点
      let positionMove = centerOfMass(positions)
      if (graphic.height !== undefined && graphic.height) {
        const newHeight = (graphic.height as Cesium.Property).getValue(this.viewer.clock.currentTime) as number
        if (Number.isFinite(newHeight)) {
          positionMove = setPositionsHeight(positionMove, newHeight) as Cesium.Cartesian3
        }
      }

      const draggerMove = draggerCtl.createDragger(this.dataSource, {
        position: positionMove,
        type: draggerCtl.PointType.MoveAll,
        tooltip: defaultMessages.dragger.moveAll,
        onDrag: (_dragger: Cesium.Entity, dragPosition: Cesium.Cartesian3) => {
          try {
            if (!dragPosition || !(dragPosition instanceof Cesium.Cartesian3)) {
              throw new Error('拖拽位置无效')
            }

            // 记录差值
            const diff = Cesium.Cartesian3.subtract(dragPosition, positionMove, new Cesium.Cartesian3())
            positionMove = dragPosition

            // 更新所有位置
            positions.forEach((pos: Cesium.Cartesian3, index: number) => {
              if (pos && pos instanceof Cesium.Cartesian3) {
                const newPos = Cesium.Cartesian3.add(pos, diff, new Cesium.Cartesian3())
                positions[index] = newPos
              }
            })

            // 全部更新
            this.updateDraggers()
          } catch (error) {
            console.error('EditRectangle.draggerMove.onDrag: 整体移动失败', error)
            // 拖拽过程中的错误不向上抛出，避免中断交互
          }
        }
      })

      if (!draggerMove) {
        const error = new Error('创建整体移动拖拽点失败')
        console.error('EditRectangle.bindDraggers:', error.message)
        throw error
      }

      this.draggers.push(draggerMove)

      // 创建高程拖拽点
      if (graphic.extrudedHeight) {
        this.bindHeightDraggers()
      }
    } catch (error) {
      console.error('EditRectangle.bindDraggers: 绑定拖拽点失败', error)
      throw error
    }
  }
}
