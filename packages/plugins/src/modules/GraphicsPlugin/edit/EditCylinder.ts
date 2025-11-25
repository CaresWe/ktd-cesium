import * as Cesium from 'cesium'
import { EditPolygon } from './EditPolygon'
import * as draggerCtl from './Dragger'
import { defaultMessages } from '../../TooltipPlugin/messages'
import { addPositionsHeight } from '@ktd-cesium/shared'
import { getEllipseOuterPositions } from '../attr/AttrCircle'
import type { ExtendedEntity } from './EditBase'
import type { CylinderEditEntity } from '../types'

/**
 * 圆柱体编辑类
 * 继承自 EditPolygon
 */
export class EditCylinder extends EditPolygon {
  declare entity: ExtendedEntity & CylinderEditEntity

  /**
   * 获取图形对象
   */
  getGraphic(): Cesium.CylinderGraphics {
    try {
      if (!this.entity) {
        throw new Error('实体对象不存在')
      }

      if (!this.entity.cylinder) {
        throw new Error('实体的 cylinder 属性不存在')
      }

      return this.entity.cylinder
    } catch (error) {
      console.error('EditCylinder.getGraphic: 获取图形对象失败', error)
      throw error
    }
  }

  /**
   * 修改坐标会回调，提高显示的效率
   */
  protected changePositionsToCallback(): void {
    try {
      if (!this.entity) {
        throw new Error('实体对象不存在')
      }

      this._positions_draw = this.entity._positions_draw || null

      if (!this._positions_draw) {
        throw new Error('无法获取位置数据')
      }

      const time = this.viewer.clock.currentTime
      const style = this.entity.attribute?.style

      if (!style) {
        throw new Error('实体样式不存在')
      }

      const graphic = this.getGraphic()

      // 设置顶部半径为 CallbackProperty
      if (graphic.topRadius && typeof graphic.topRadius === 'object' && 'getValue' in graphic.topRadius) {
        style.topRadius = (graphic.topRadius as Cesium.Property).getValue(time) as number
      }
      graphic.topRadius = new Cesium.CallbackProperty(() => {
        return style.topRadius
      }, false)

      // 设置底部半径为 CallbackProperty
      if (graphic.bottomRadius && typeof graphic.bottomRadius === 'object' && 'getValue' in graphic.bottomRadius) {
        style.bottomRadius = (graphic.bottomRadius as Cesium.Property).getValue(time) as number
      }
      graphic.bottomRadius = new Cesium.CallbackProperty(() => {
        return style.bottomRadius
      }, false)

      // 设置长度为 CallbackProperty
      if (graphic.length && typeof graphic.length === 'object' && 'getValue' in graphic.length) {
        style.length = (graphic.length as Cesium.Property).getValue(time) as number
      }
      graphic.length = new Cesium.CallbackProperty(() => {
        return style.length
      }, false)
    } catch (error) {
      console.error('EditCylinder.changePositionsToCallback: 转换位置失败', error)
      throw error
    }
  }

  /**
   * 图形编辑结束后调用
   */
  protected finish(): void {
    try {
      if (!this.entity) {
        console.warn('EditCylinder.finish: 实体对象不存在')
        return
      }

      this.entity._positions_draw = this._positions_draw || undefined

      const style = this.entity.attribute?.style
      if (!style) {
        console.warn('EditCylinder.finish: 实体样式不存在')
        return
      }

      const graphic = this.getGraphic()
      graphic.topRadius = style.topRadius as unknown as Cesium.Property
      graphic.bottomRadius = style.bottomRadius as unknown as Cesium.Property
      graphic.length = style.length as unknown as Cesium.Property
    } catch (error) {
      console.error('EditCylinder.finish: 完成编辑失败', error)
      // finish 方法的错误不向上抛出，避免影响编辑结束流程
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
        console.error('EditCylinder.bindDraggers:', error.message)
        throw error
      }

      if (!this.dataSource) {
        const error = new Error('数据源对象不存在')
        console.error('EditCylinder.bindDraggers:', error.message)
        throw error
      }

      if (!this.entity.attribute?.style) {
        const error = new Error('实体的 attribute.style 不存在')
        console.error('EditCylinder.bindDraggers:', error.message)
        throw error
      }

      const positions = this.getPosition()
      const style = this.entity.attribute.style

      if (positions.length === 0) {
        const error = new Error('位置数组为空')
        console.error('EditCylinder.bindDraggers:', error.message)
        throw error
      }

      // 中心点
      let index = 0
      const position = positions[index]

      const dragger = draggerCtl.createDragger(this.dataSource, {
        position: position,
        onDrag: (_dragger: Cesium.Entity, position: Cesium.Cartesian3) => {
          try {
            const draggerEntity = _dragger as ExtendedEntity
            if (!draggerEntity || draggerEntity.index === undefined) {
              throw new Error('拖拽实体或索引无效')
            }

            if (!position || !(position instanceof Cesium.Cartesian3)) {
              throw new Error('拖拽位置无效')
            }

            positions[draggerEntity.index] = position
            this.updateDraggers()
          } catch (error) {
            console.error('EditCylinder.dragger.onDrag: 拖拽中心点失败', error)
          }
        }
      })

      if (!dragger) {
        const error = new Error('中心拖拽点创建失败')
        console.error('EditCylinder.bindDraggers:', error.message)
        throw error
      }

      const draggerEntity = dragger as ExtendedEntity
      draggerEntity.index = index
      this.draggers.push(dragger)

      // 获取圆（或椭圆）边线上的坐标点数组
      const outerPositions = getEllipseOuterPositions({
        position: position,
        semiMajorAxis: style.bottomRadius || 100,
        semiMinorAxis: style.bottomRadius || 100,
        rotation: Cesium.Math.toRadians(Number(style.rotation || 0))
      })

      // 底部半径拖拽点
      index = 1
      const majorPos = outerPositions[0]
      positions[index] = majorPos

      const bottomRadiusDragger = draggerCtl.createDragger(this.dataSource, {
        position: majorPos,
        type: draggerCtl.PointType.EditAttr,
        tooltip: defaultMessages.dragger.editRadius,
        onDrag: (_dragger: Cesium.Entity, position: Cesium.Cartesian3) => {
          try {
            const draggerEntity = _dragger as ExtendedEntity
            if (!draggerEntity || draggerEntity.index === undefined) {
              throw new Error('拖拽实体或索引无效')
            }

            if (!position || !(position instanceof Cesium.Cartesian3)) {
              throw new Error('拖拽位置无效')
            }

            positions[draggerEntity.index] = position

            const radius = this.formatNum(Cesium.Cartesian3.distance(positions[0], position), 2)
            style.bottomRadius = radius

            this.updateDraggers()
          } catch (error) {
            console.error('EditCylinder.bottomRadiusDragger.onDrag: 拖拽底部半径失败', error)
          }
        }
      })

      if (!bottomRadiusDragger) {
        const error = new Error('底部半径拖拽点创建失败')
        console.error('EditCylinder.bindDraggers:', error.message)
        throw error
      }

      const bottomRadiusDraggerEntity = bottomRadiusDragger as ExtendedEntity
      bottomRadiusDraggerEntity.index = index
      this.draggers.push(bottomRadiusDragger)

      // 创建高度拖拽点
      index = 2
      const positionHeight = addPositionsHeight(positions[0], style.length || 100) as Cesium.Cartesian3
      positions[index] = positionHeight

      const draggerTop = draggerCtl.createDragger(this.dataSource, {
        position: positionHeight,
        type: draggerCtl.PointType.MoveHeight,
        tooltip: defaultMessages.dragger.moveHeight,
        onDrag: (_dragger: Cesium.Entity, position: Cesium.Cartesian3) => {
          try {
            const draggerEntity = _dragger as ExtendedEntity
            if (!draggerEntity || draggerEntity.index === undefined) {
              throw new Error('拖拽实体或索引无效')
            }

            if (!position || !(position instanceof Cesium.Cartesian3)) {
              throw new Error('拖拽位置无效')
            }

            positions[draggerEntity.index] = position

            const length = this.formatNum(Cesium.Cartesian3.distance(positions[0], position), 2)
            style.length = length

            this.updateDraggers()
          } catch (error) {
            console.error('EditCylinder.draggerTop.onDrag: 拖拽高度失败', error)
          }
        }
      })

      if (!draggerTop) {
        const error = new Error('高度拖拽点创建失败')
        console.error('EditCylinder.bindDraggers:', error.message)
        throw error
      }

      const draggerTopEntity = draggerTop as ExtendedEntity
      draggerTopEntity.index = index
      this.draggers.push(draggerTop)
    } catch (error) {
      console.error('EditCylinder.bindDraggers: 绑定拖拽点失败', error)
      throw error
    }
  }
}
