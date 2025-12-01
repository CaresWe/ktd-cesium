import * as Cesium from 'cesium'
import { EditPolygon } from './EditPolygon'
import * as draggerCtl from './Dragger'
import { defaultMessages } from '../../TooltipPlugin/messages'
import { getEllipseOuterPositions } from '../attr/AttrCircle'
import { setPositionSurfaceHeight } from '@ktd-cesium/shared'
import type { ExtendedEntity } from './EditBase'
import type { CircleEditEntity, CircleDragger } from '../types'

/**
 * 设置位置高度
 */
function setPositionsHeight(position: Cesium.Cartesian3, newHeight: number): Cesium.Cartesian3 {
  const cartographic = Cesium.Cartographic.fromCartesian(position)
  return Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, newHeight)
}

/**
 * 圆/椭圆编辑类
 * 继承自 EditPolygon
 */
export class EditCircle extends EditPolygon {
  declare entity: ExtendedEntity & CircleEditEntity

  /**
   * 获取图形对象
   */
  getGraphic(): Cesium.EllipseGraphics {
    try {
      if (!this.entity) {
        throw new Error('实体对象不存在')
      }

      if (!this.entity.ellipse) {
        throw new Error('实体的 ellipse 属性不存在')
      }

      return this.entity.ellipse
    } catch (error) {
      console.error('EditCircle.getGraphic: 获取图形对象失败', error)
      throw error
    }
  }

  /**
   * 将位置转换为回调函数
   */
  protected changePositionsToCallback(): void {
    try {
      if (!this.entity) {
        throw new Error('实体对象不存在')
      }

      this._positions_draw = this.entity._positions_draw || null
      this.finish()
    } catch (error) {
      console.error('EditCircle.changePositionsToCallback: 转换位置失败', error)
      throw error
    }
  }

  /**
   * 图形编辑结束后调用
   */
  protected finish(): void {
    try {
      if (!this.entity) {
        console.warn('EditCircle.finish: 实体对象不存在')
        return
      }

      this.entity._positions_draw = this._positions_draw || undefined
    } catch (error) {
      console.error('EditCircle.finish: 完成编辑失败', error)
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
      console.error('EditCircle.isClampToGround: 获取贴地状态失败', error)
      return false
    }
  }

  /**
   * 获取位置
   */
  getPosition(): Cesium.Cartesian3[] {
    try {
      if (!this._positions_draw) {
        throw new Error('位置数组不存在')
      }

      // 更新高度
      const graphic = this.getGraphic()
      if (graphic.height !== undefined && graphic.height) {
        const heightValue = (graphic.height as Cesium.Property).getValue(this.viewer.clock.currentTime) as number

        if (Number.isFinite(heightValue)) {
          for (let i = 0, len = this._positions_draw.length; i < len; i++) {
            this._positions_draw[i] = setPositionsHeight(this._positions_draw[i], heightValue)
          }
        }
      }

      return this._positions_draw
    } catch (error) {
      console.error('EditCircle.getPosition: 获取位置失败', error)
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
        console.error('EditCircle.bindDraggers:', error.message)
        throw error
      }

      if (!this.dataSource) {
        const error = new Error('数据源对象不存在')
        console.error('EditCircle.bindDraggers:', error.message)
        throw error
      }

      const clampToGround = this.isClampToGround()
      const positions = this.getPosition()
      const style = this.entity.attribute?.style || {}

      if (positions.length === 0) {
        const error = new Error('位置数组为空')
        console.error('EditCircle.bindDraggers:', error.message)
        throw error
      }

      // 中心点
      let position = positions[0]

      // 贴地时求贴模型和贴地的高度
      if (clampToGround) {
        const surfacePosition = setPositionSurfaceHeight(this.viewer, position)
        if (surfacePosition) {
          position = surfacePosition
          positions[0] = position
        }
      }

      const dragger = draggerCtl.createDragger(this.dataSource, {
        position: position,
        onDrag: (_dragger: Cesium.Entity, position: Cesium.Cartesian3) => {
          try {
            const draggerEntity = _dragger as CircleDragger

            // 计算偏移量
            const diff = Cesium.Cartesian3.subtract(
              position,
              positions[draggerEntity.index ?? 0],
              new Cesium.Cartesian3()
            )

            positions[draggerEntity.index ?? 0] = position

            // 更新高度
            if (!style.clampToGround) {
              const height = this.formatNum(Cesium.Cartographic.fromCartesian(position).height, 2)
              const graphic = this.getGraphic()
              graphic.height = height as unknown as Cesium.Property
              style.height = height
            }

            const time = this.viewer.clock.currentTime

            // 更新长轴拖拽点
            if (draggerEntity.majorDragger) {
              const majorPos = draggerEntity.majorDragger.position
              if (majorPos && typeof majorPos === 'object' && 'getValue' in majorPos) {
                const currentMajorPos = (majorPos as Cesium.Property).getValue(time) as Cesium.Cartesian3
                const newPos = Cesium.Cartesian3.add(currentMajorPos, diff, new Cesium.Cartesian3())
                draggerEntity.majorDragger.position = newPos
              }
            }

            // 更新短轴拖拽点
            if (draggerEntity.minorDragger) {
              const minorPos = draggerEntity.minorDragger.position
              if (minorPos && typeof minorPos === 'object' && 'getValue' in minorPos) {
                const currentMinorPos = (minorPos as Cesium.Property).getValue(time) as Cesium.Cartesian3
                const newPos = Cesium.Cartesian3.add(currentMinorPos, diff, new Cesium.Cartesian3())
                draggerEntity.minorDragger.position = newPos
              }
            }

            // 更新拉伸高度拖拽点
            if (this.entity.attribute?.style?.extrudedHeight !== undefined) {
              this.updateDraggers()
            }
          } catch (error) {
            console.error('EditCircle.dragger.onDrag: 拖拽中心点失败', error)
            // 拖拽过程中的错误不向上抛出，避免中断交互
          }
        }
      }) as CircleDragger

      dragger.index = 0
      this.draggers.push(dragger)

      const time = this.viewer.clock.currentTime
      const graphic = this.getGraphic()

      // 计算椭圆外围控制点位置
      const semiMajorAxis = (graphic.semiMajorAxis as Cesium.Property)?.getValue(time) as number
      const semiMinorAxis = (graphic.semiMinorAxis as Cesium.Property)?.getValue(time) as number

      if (!Number.isFinite(semiMajorAxis) || !Number.isFinite(semiMinorAxis)) {
        throw new Error('椭圆轴长无效')
      }

      const outerPositions = getEllipseOuterPositions({
        position: position,
        semiMajorAxis: semiMajorAxis,
        semiMinorAxis: semiMinorAxis,
        rotation: Cesium.Math.toRadians(Number(style.rotation || 0))
      })

      // 长轴控制点
      let majorPos = outerPositions[1]

      // 贴地时求贴模型和贴地的高度
      if (clampToGround) {
        const surfacePosition = setPositionSurfaceHeight(this.viewer, majorPos)
        if (surfacePosition) {
          majorPos = surfacePosition
        }
      }

      positions[1] = majorPos

      const majorDragger = draggerCtl.createDragger(this.dataSource, {
        position: majorPos,
        type: draggerCtl.PointType.EditAttr,
        tooltip: defaultMessages.dragger.editRadius,
        onDrag: (_dragger: Cesium.Entity, position: Cesium.Cartesian3) => {
          try {
            const draggerEntity = _dragger as CircleDragger

            // 调整高度
            if (graphic.height !== undefined && graphic.height) {
              const newHeight = (graphic.height as Cesium.Property).getValue(time) as number
              if (Number.isFinite(newHeight)) {
                position = setPositionsHeight(position, newHeight)
                draggerEntity.position = position
              }
            }

            positions[draggerEntity.index ?? 1] = position

            const radius = this.formatNum(Cesium.Cartesian3.distance(positions[0], position), 2)
            graphic.semiMajorAxis = radius as unknown as Cesium.Property

            if (this._maxPointNum === 3 || !Cesium.defined(style.radius)) {
              // 椭圆
              style.semiMajorAxis = radius
            } else {
              // 圆
              graphic.semiMinorAxis = radius as unknown as Cesium.Property
              style.radius = radius
            }

            this.updateDraggers()
          } catch (error) {
            console.error('EditCircle.majorDragger.onDrag: 拖拽长轴失败', error)
            // 拖拽过程中的错误不向上抛出，避免中断交互
          }
        }
      }) as CircleDragger

      majorDragger.index = 1
      dragger.majorDragger = majorDragger
      this.draggers.push(majorDragger)

      // 短轴控制点（仅椭圆）
      if (this._maxPointNum === 3) {
        let minorPos = outerPositions[0]

        // 贴地时求贴模型和贴地的高度
        if (clampToGround) {
          const surfacePosition = setPositionSurfaceHeight(this.viewer, minorPos)
          if (surfacePosition) {
            minorPos = surfacePosition
          }
        }

        positions[2] = minorPos

        const minorDragger = draggerCtl.createDragger(this.dataSource, {
          position: minorPos,
          type: draggerCtl.PointType.EditAttr,
          tooltip: defaultMessages.dragger.editRadius,
          onDrag: (_dragger: Cesium.Entity, position: Cesium.Cartesian3) => {
            try {
              const draggerEntity = _dragger as CircleDragger

              // 调整高度
              if (graphic.height !== undefined && graphic.height) {
                const newHeight = (graphic.height as Cesium.Property).getValue(time) as number
                if (Number.isFinite(newHeight)) {
                  position = setPositionsHeight(position, newHeight)
                  draggerEntity.position = position
                }
              }

              positions[draggerEntity.index ?? 2] = position

              const radius = this.formatNum(Cesium.Cartesian3.distance(positions[0], position), 2)
              graphic.semiMinorAxis = radius as unknown as Cesium.Property

              if (this._maxPointNum === 3 || !Cesium.defined(style.radius)) {
                // 椭圆
                style.semiMinorAxis = radius
              } else {
                // 圆
                graphic.semiMajorAxis = radius as unknown as Cesium.Property
                style.radius = radius
              }

              this.updateDraggers()
            } catch (error) {
              console.error('EditCircle.minorDragger.onDrag: 拖拽短轴失败', error)
              // 拖拽过程中的错误不向上抛出，避免中断交互
            }
          }
        }) as CircleDragger

        minorDragger.index = 2
        dragger.minorDragger = minorDragger
        this.draggers.push(minorDragger)
      }

      // 创建高度拖拽点（拉伸高度）
      if (graphic.extrudedHeight) {
        const heightPos = this._maxPointNum === 3 ? [positions[1], positions[2]] : [positions[1]]
        this.bindHeightDraggers(heightPos)
      }
    } catch (error) {
      console.error('EditCircle.bindDraggers: 绑定拖拽点失败', error)
      throw error // 向上抛出错误
    }
  }
}
