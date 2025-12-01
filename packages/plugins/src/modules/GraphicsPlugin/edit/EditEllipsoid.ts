import * as Cesium from 'cesium'
import { EditBase } from './EditBase'
import type { ExtendedEntity } from './EditBase'
import * as draggerCtl from './Dragger'
import { defaultMessages } from '../../TooltipPlugin/messages'
import { setPositionsHeight, addPositionsHeight } from '@ktd-cesium/shared'
import { getEllipseOuterPositions } from '../attr/AttrCircle'
import type { EllipsoidEditStyle, EllipsoidEditEntity, EllipsoidDragger } from '../types'

/**
 * 椭球体编辑类
 * 继承自 EditBase
 */
export class EditEllipsoid extends EditBase {
  declare entity: ExtendedEntity & EllipsoidEditEntity

  /**
   * 图形编辑结束后调用
   */
  protected finish(): void {
    try {
      // 椭球体编辑结束时无需特殊处理
    } catch (error) {
      console.error('EditEllipsoid.finish: 完成编辑失败', error)
      // finish 方法的错误不向上抛出，避免影响编辑结束流程
    }
  }

  /**
   * 更新 Ellipsoid 的半径
   */
  updateRadii(style: EllipsoidEditStyle): void {
    try {
      // 验证 style 参数
      if (!style) {
        const error = new Error('style 参数不能为空')
        console.error('EditEllipsoid.updateRadii:', error.message)
        throw error
      }

      // 验证 entity
      if (!this.entity) {
        const error = new Error('实体对象不存在')
        console.error('EditEllipsoid.updateRadii:', error.message)
        throw error
      }

      if (!this.entity.ellipsoid) {
        const error = new Error('实体的 ellipsoid 属性不存在')
        console.error('EditEllipsoid.updateRadii:', error.message)
        throw error
      }

      if (!this.entity.ellipsoid.radii) {
        const error = new Error('实体的 ellipsoid.radii 属性不存在')
        console.error('EditEllipsoid.updateRadii:', error.message)
        throw error
      }

      if (!('setValue' in this.entity.ellipsoid.radii)) {
        const error = new Error('ellipsoid.radii 不支持 setValue 方法')
        console.error('EditEllipsoid.updateRadii:', error.message)
        throw error
      }

      // 获取半径值并验证
      const extentRadii = Number(style.extentRadii ?? 100)
      const widthRadii = Number(style.widthRadii ?? 100)
      const heightRadii = Number(style.heightRadii ?? 100)

      // 验证半径值的有效性
      if (!Number.isFinite(extentRadii) || extentRadii <= 0) {
        const error = new Error(`extentRadii 值无效: ${extentRadii}`)
        console.error('EditEllipsoid.updateRadii:', error.message)
        throw error
      }

      if (!Number.isFinite(widthRadii) || widthRadii <= 0) {
        const error = new Error(`widthRadii 值无效: ${widthRadii}`)
        console.error('EditEllipsoid.updateRadii:', error.message)
        throw error
      }

      if (!Number.isFinite(heightRadii) || heightRadii <= 0) {
        const error = new Error(`heightRadii 值无效: ${heightRadii}`)
        console.error('EditEllipsoid.updateRadii:', error.message)
        throw error
      }

      const radii = new Cesium.Cartesian3(extentRadii, widthRadii, heightRadii)

      // 设置半径
      ;(this.entity.ellipsoid.radii as Cesium.ConstantProperty).setValue(radii)
    } catch (error) {
      console.error('EditEllipsoid.updateRadii: 更新椭球体半径失败', error)
      throw error
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
        console.error('EditEllipsoid.bindDraggers:', error.message)
        throw error
      }

      if (!this.dataSource) {
        const error = new Error('数据源对象不存在')
        console.error('EditEllipsoid.bindDraggers:', error.message)
        throw error
      }

      if (!this.entity.attribute?.style) {
        const error = new Error('实体的 attribute.style 不存在')
        console.error('EditEllipsoid.bindDraggers:', error.message)
        throw error
      }

      if (!this.entity._positions_draw || this.entity._positions_draw.length === 0) {
        const error = new Error('实体的 _positions_draw 不存在或为空')
        console.error('EditEllipsoid.bindDraggers:', error.message)
        throw error
      }

      const style = this.entity.attribute.style

      // 位置中心点
      const position = this.entity._positions_draw[0]

      if (!position || !(position instanceof Cesium.Cartesian3)) {
        const error = new Error('中心位置无效')
        console.error('EditEllipsoid.bindDraggers:', error.message)
        throw error
      }

      const centerDragger = draggerCtl.createDragger(this.dataSource, {
        position: position,
        onDrag: (_dragger: Cesium.Entity, position: Cesium.Cartesian3) => {
          try {
            // 验证新位置
            if (!position || !(position instanceof Cesium.Cartesian3)) {
              throw new Error('拖拽位置无效')
            }

            if (!this.entity._positions_draw) {
              throw new Error('实体的 _positions_draw 不存在')
            }

            this.entity._positions_draw[0] = position
            this.updateDraggers()
          } catch (error) {
            console.error('EditEllipsoid.centerDragger.onDrag: 拖拽中心点失败', error)
          }
        }
      }) as EllipsoidDragger

      if (!centerDragger) {
        const error = new Error('中心拖拽点创建失败')
        console.error('EditEllipsoid.bindDraggers:', error.message)
        throw error
      }

      this.draggers.push(centerDragger)

      // 顶部的高半径编辑点
      const positionProp = this.entity.position
      let positionCenter: Cesium.Cartesian3

      if (positionProp && typeof positionProp === 'object' && 'getValue' in positionProp) {
        positionCenter = (positionProp as Cesium.Property).getValue(this.viewer.clock.currentTime) as Cesium.Cartesian3
      } else if (positionProp) {
        positionCenter = positionProp as unknown as Cesium.Cartesian3
      } else {
        positionCenter = position
      }

      const topDraggerPosition = addPositionsHeight(positionCenter, style.heightRadii || 100) as Cesium.Cartesian3

      const topDragger = draggerCtl.createDragger(this.dataSource, {
        position: topDraggerPosition,
        type: draggerCtl.PointType.MoveHeight,
        tooltip: defaultMessages.dragger.editRadius,
        onDrag: (_dragger: Cesium.Entity, position: Cesium.Cartesian3) => {
          try {
            if (!position || !(position instanceof Cesium.Cartesian3)) {
              throw new Error('拖拽位置无效')
            }

            if (!this.entity._positions_draw) {
              throw new Error('实体的 _positions_draw 不存在')
            }

            const positionZXD = this.entity._positions_draw[0]
            const length = this.formatNum(Cesium.Cartesian3.distance(positionZXD, position), 2)
            style.heightRadii = length

            this.updateRadii(style)
            this.updateDraggers()
          } catch (error) {
            console.error('EditEllipsoid.topDragger.onDrag: 拖拽高半径失败', error)
          }
        }
      })

      if (!topDragger) {
        const error = new Error('顶部拖拽点创建失败')
        console.error('EditEllipsoid.bindDraggers:', error.message)
        throw error
      }

      this.draggers.push(topDragger)

      // 获取圆（或椭圆）边线上的坐标点数组
      const outerPositions = getEllipseOuterPositions({
        position: positionCenter,
        semiMajorAxis: Number(style.extentRadii || 100),
        semiMinorAxis: Number(style.widthRadii || 100),
        rotation: Cesium.Math.toRadians(Number(style.rotation || 0))
      })

      // 长半轴上的坐标点
      const majorPos = outerPositions[0]
      const majorDragger = draggerCtl.createDragger(this.dataSource, {
        position: majorPos,
        type: draggerCtl.PointType.EditAttr,
        tooltip: defaultMessages.dragger.editRadius,
        onDrag: (_dragger: Cesium.Entity, position: Cesium.Cartesian3) => {
          try {
            if (!position || !(position instanceof Cesium.Cartesian3)) {
              throw new Error('拖拽位置无效')
            }

            if (!this.entity._positions_draw) {
              throw new Error('实体的 _positions_draw 不存在')
            }

            const positionZXD = this.entity._positions_draw[0]
            const cartographic = Cesium.Cartographic.fromCartesian(positionZXD)
            if (!cartographic) {
              throw new Error('无法获取中心点高度')
            }

            const newHeight = cartographic.height
            if (!Number.isFinite(newHeight)) {
              throw new Error('中心点高度无效')
            }

            const adjustedPosition = setPositionsHeight(position, newHeight) as Cesium.Cartesian3
            if (!adjustedPosition) {
              throw new Error('设置高度失败')
            }

            const draggerEntity = _dragger as ExtendedEntity
            if (!draggerEntity) {
              throw new Error('拖拽实体不存在')
            }

            draggerEntity.position = adjustedPosition

            const radius = this.formatNum(Cesium.Cartesian3.distance(positionZXD, adjustedPosition), 2)
            style.widthRadii = radius

            this.updateRadii(style)
            this.updateDraggers()
          } catch (error) {
            console.error('EditEllipsoid.majorDragger.onDrag: 拖拽长半轴失败', error)
          }
        }
      })

      if (!majorDragger) {
        const error = new Error('长半轴拖拽点创建失败')
        console.error('EditEllipsoid.bindDraggers:', error.message)
        throw error
      }

      centerDragger.majorDragger = majorDragger
      this.draggers.push(majorDragger)

      // 短半轴上的坐标点
      const minorPos = outerPositions[1]
      const minorDragger = draggerCtl.createDragger(this.dataSource, {
        position: minorPos,
        type: draggerCtl.PointType.EditAttr,
        tooltip: defaultMessages.dragger.editRadius,
        onDrag: (_dragger: Cesium.Entity, position: Cesium.Cartesian3) => {
          try {
            if (!position || !(position instanceof Cesium.Cartesian3)) {
              throw new Error('拖拽位置无效')
            }

            if (!this.entity._positions_draw) {
              throw new Error('实体的 _positions_draw 不存在')
            }

            const positionZXD = this.entity._positions_draw[0]
            const cartographic = Cesium.Cartographic.fromCartesian(positionZXD)
            if (!cartographic) {
              throw new Error('无法获取中心点高度')
            }

            const newHeight = cartographic.height
            if (!Number.isFinite(newHeight)) {
              throw new Error('中心点高度无效')
            }

            const adjustedPosition = setPositionsHeight(position, newHeight) as Cesium.Cartesian3
            if (!adjustedPosition) {
              throw new Error('设置高度失败')
            }

            const draggerEntity = _dragger as ExtendedEntity
            if (!draggerEntity) {
              throw new Error('拖拽实体不存在')
            }

            draggerEntity.position = adjustedPosition

            const radius = this.formatNum(Cesium.Cartesian3.distance(positionZXD, adjustedPosition), 2)
            style.extentRadii = radius

            this.updateRadii(style)
            this.updateDraggers()
          } catch (error) {
            console.error('EditEllipsoid.minorDragger.onDrag: 拖拽短半轴失败', error)
          }
        }
      })

      if (!minorDragger) {
        const error = new Error('短半轴拖拽点创建失败')
        console.error('EditEllipsoid.bindDraggers:', error.message)
        throw error
      }

      centerDragger.minorDragger = minorDragger
      this.draggers.push(minorDragger)
    } catch (error) {
      console.error('EditEllipsoid.bindDraggers: 绑定拖拽点失败', error)
      throw error
    }
  }
}
