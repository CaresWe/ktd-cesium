import * as Cesium from 'cesium'
import { EditBase, type ExtendedEntity } from './EditBase'
import * as draggerCtl from './Dragger'
import { defaultMessages } from '../../TooltipPlugin/messages'
import { setPositionsHeight, getMaxHeight } from '@ktd-cesium/shared'
import { formatNum } from '@ktd-cesium/shared'

/**
 * 计算质心（中心点）
 */
function centerOfMass(positions: Cesium.Cartesian3[]): Cesium.Cartesian3 {
  try {
    if (!positions || positions.length === 0) {
      throw new Error('位置数组不能为空')
    }

    const center = new Cesium.Cartesian3()
    for (const pos of positions) {
      if (!pos || !(pos instanceof Cesium.Cartesian3)) {
        throw new Error('位置必须是 Cesium.Cartesian3 类型')
      }
      Cesium.Cartesian3.add(center, pos, center)
    }
    Cesium.Cartesian3.divideByScalar(center, positions.length, center)
    return center
  } catch (error) {
    console.error('centerOfMass: 计算质心失败', error)
    // 返回第一个位置作为默认值
    return positions[0] || new Cesium.Cartesian3()
  }
}

import type { PolylineEditEntity } from '../types'

/**
 * 折线编辑类
 */
export class EditPolyline extends EditBase {
  declare entity: ExtendedEntity & PolylineEditEntity
  protected _hasMidPoint = true // 是否有中间拖拽点
  protected hasClosure = false // 是否闭合
  protected heightDraggers: draggerCtl.DraggerEntity[] = [] // 高度拖拽点

  /**
   * 获取图形对象
   * 子类可以重写此方法返回更具体的类型
   */
  getGraphic():
    | Cesium.PolylineGraphics
    | Cesium.PolygonGraphics
    | Cesium.EllipseGraphics
    | Cesium.CorridorGraphics
    | Cesium.CylinderGraphics
    | Cesium.PolylineVolumeGraphics
    | Cesium.RectangleGraphics
    | Cesium.WallGraphics {
    try {
      if (!this.entity) {
        throw new Error('实体对象不存在')
      }

      if (!this.entity.polyline) {
        throw new Error('实体的 polyline 属性不存在')
      }

      return this.entity.polyline
    } catch (error) {
      console.error('EditPolyline.getGraphic: 获取图形对象失败', error)
      throw error
    }
  }

  /**
   * 获取位置数组
   */
  getPosition(): Cesium.Cartesian3[] {
    try {
      if (!this._positions_draw) {
        throw new Error('位置数组不存在')
      }

      return this._positions_draw
    } catch (error) {
      console.error('EditPolyline.getPosition: 获取位置失败', error)
      throw error
    }
  }

  /**
   * 设置位置
   */
  setPositions(positions: Cesium.Cartesian3[]): void {
    try {
      // 验证参数
      if (!positions) {
        const error = new Error('位置参数不能为空')
        console.error('EditPolyline.setPositions:', error.message)
        throw error
      }

      if (!Array.isArray(positions)) {
        const error = new Error('位置参数必须是数组')
        console.error('EditPolyline.setPositions:', error.message)
        throw error
      }

      if (positions.length === 0) {
        const error = new Error('位置数组不能为空')
        console.error('EditPolyline.setPositions:', error.message)
        throw error
      }

      // 验证每个位置
      for (let i = 0; i < positions.length; i++) {
        if (!(positions[i] instanceof Cesium.Cartesian3)) {
          const error = new Error(`位置[${i}]必须是 Cesium.Cartesian3 类型`)
          console.error('EditPolyline.setPositions:', error.message)
          throw error
        }

        if (
          !Cesium.defined(positions[i]) ||
          !Number.isFinite(positions[i].x) ||
          !Number.isFinite(positions[i].y) ||
          !Number.isFinite(positions[i].z)
        ) {
          const error = new Error(`位置[${i}]的坐标值无效`)
          console.error('EditPolyline.setPositions:', error.message)
          throw error
        }
      }

      this._positions_draw = positions
      this.updateAttrForEditing()
      this.finish()
    } catch (error) {
      console.error('EditPolyline.setPositions: 设置位置失败', error)
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

      if (!this._positions_draw && this.entity.polyline) {
        // 对于 polyline，从 positions 属性获取
        const positions = this.entity.polyline.positions
        if (positions && typeof positions === 'object' && 'getValue' in positions) {
          this._positions_draw = (positions as Cesium.Property).getValue(
            this.viewer.clock.currentTime
          ) as Cesium.Cartesian3[]
        }
      }

      if (!this._positions_draw) {
        throw new Error('无法获取位置数据')
      }
    } catch (error) {
      console.error('EditPolyline.changePositionsToCallback: 转换位置失败', error)
      throw error
    }
  }

  /**
   * 更新编辑属性
   */
  updateAttrForEditing(): void {
    try {
      if (!this.entity) {
        console.warn('EditPolyline.updateAttrForEditing: 实体对象不存在')
        return
      }

      // 注意: depthFailMaterial 存在时不能用 CallbackProperty
      if (
        this.entity.attribute?.type === 'polyline' &&
        this.entity.polyline &&
        Cesium.defined(this.entity.polyline.depthFailMaterial)
      ) {
        // 使用 ConstantProperty 包装位置数组
        this.entity.polyline.positions = new Cesium.ConstantProperty(this.getPosition())
      }
    } catch (error) {
      console.error('EditPolyline.updateAttrForEditing: 更新属性失败', error)
      // 更新属性失败不向上抛出，避免中断交互
    }
  }

  /**
   * 图形编辑结束后调用
   */
  protected finish(): void {
    try {
      if (!this.entity) {
        console.warn('EditPolyline.finish: 实体对象不存在')
        return
      }

      this.entity._positions_draw = this.getPosition() || undefined

      if (this.entity.attribute?.type === 'polyline' && this.entity.polyline) {
        // 注意: depthFailMaterial 存在时不能用 CallbackProperty
        if (Cesium.defined(this.entity.polyline.depthFailMaterial)) {
          // 使用 ConstantProperty 包装位置数组
          this.entity.polyline.positions = new Cesium.ConstantProperty(this.entity._positions_draw)
        } else {
          // 使用 CallbackProperty 以便动态更新
          this.entity.polyline.positions = new Cesium.CallbackProperty(() => {
            return this.entity._positions_draw
          }, false)
        }
      }
    } catch (error) {
      console.error('EditPolyline.finish: 完成编辑失败', error)
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
      console.error('EditPolyline.isClampToGround: 获取贴地状态失败', error)
      return false
    }
  }

  /**
   * 是否有中间拖拽点
   */
  hasMidPoint(): boolean {
    try {
      return this._hasMidPoint && this.getPosition().length < this._maxPointNum
    } catch (error) {
      console.error('EditPolyline.hasMidPoint: 判断中间点失败', error)
      return false
    }
  }

  /**
   * 根据属性更新位置高度
   */
  updatePositionsHeightByAttr(position: Cesium.Cartesian3): Cesium.Cartesian3 {
    try {
      if (!position || !(position instanceof Cesium.Cartesian3)) {
        throw new Error('位置参数无效')
      }

      return position
    } catch (error) {
      console.error('EditPolyline.updatePositionsHeightByAttr: 更新高度失败', error)
      return position
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
        console.error('EditPolyline.bindDraggers:', error.message)
        throw error
      }

      if (!this.dataSource) {
        const error = new Error('数据源对象不存在')
        console.error('EditPolyline.bindDraggers:', error.message)
        throw error
      }

      const positions = this.getPosition()
      const hasMidPoint = this.hasMidPoint()
      const len = positions.length

      if (len === 0) {
        const error = new Error('位置数组为空')
        console.error('EditPolyline.bindDraggers:', error.message)
        throw error
      }

      // 绑定顶点拖拽点
      for (let i = 0; i < len; i++) {
        const loc = positions[i]

        if (!loc || !(loc instanceof Cesium.Cartesian3)) {
          console.warn(`EditPolyline.bindDraggers: 位置[${i}]无效，跳过`)
          continue
        }

        // 创建顶点拖拽点
        const dragger = draggerCtl.createDragger(this.dataSource, {
          position: loc,
          onDrag: (_dragger: Cesium.Entity, position: Cesium.Cartesian3) => {
            try {
              // 验证拖拽实体
              const draggerEntity = _dragger as ExtendedEntity
              if (!draggerEntity || draggerEntity.index === undefined) {
                throw new Error('拖拽实体或索引无效')
              }

              // 验证位置
              if (!position || !(position instanceof Cesium.Cartesian3)) {
                throw new Error('拖拽位置无效')
              }

              const updatedPosition = this.updatePositionsHeightByAttr(position)
              draggerEntity.position = updatedPosition
              positions[draggerEntity.index] = updatedPosition

              // 更新高度拖拽点（如果存在拉伸高度）
              if (this.heightDraggers && this.heightDraggers.length > 0) {
                const graphic = this.getGraphic()
                if ('extrudedHeight' in graphic && graphic.extrudedHeight) {
                  const extrudedHeightProp = graphic.extrudedHeight as Cesium.Property
                  const extrudedHeight = extrudedHeightProp.getValue(this.viewer.clock.currentTime) as number
                  if (Number.isFinite(extrudedHeight) && draggerEntity.index !== undefined) {
                    const heightDragger = this.heightDraggers[draggerEntity.index]
                    if (heightDragger) {
                      const newHeightPos = setPositionsHeight(updatedPosition, extrudedHeight) as Cesium.Cartesian3
                      heightDragger.position = newHeightPos
                    }
                  }
                }
              }

              // 更新中点
              if (hasMidPoint) {
                this.updateMidPoints(draggerEntity.index, updatedPosition, positions, len)
              }

              // 更新整体移动点
              this.updateMoveAllDragger(positions)
            } catch (error) {
              console.error('EditPolyline.dragger.onDrag: 拖拽顶点失败', error)
              // 拖拽过程中的错误不向上抛出，避免中断交互
            }
          }
        })

        if (!dragger) {
          console.warn(`EditPolyline.bindDraggers: 创建拖拽点[${i}]失败`)
          continue
        }

        const draggerEntity = dragger as ExtendedEntity
        draggerEntity.index = i
        this.draggers.push(dragger)

        // 中间点（用于新增顶点）
        if (hasMidPoint && (this.hasClosure || (!this.hasClosure && i < len - 1))) {
          this.createMidPointDragger(i, loc, positions, len)
        }
      }

      // 整体移动拖拽点
      this.createMoveAllDragger(positions)

      // 创建高度拖拽点（如果存在拉伸高度）
      const graphic = this.getGraphic()
      if ('extrudedHeight' in graphic && graphic.extrudedHeight) {
        this.bindHeightDraggers()
      }
    } catch (error) {
      console.error('EditPolyline.bindDraggers: 绑定拖拽点失败', error)
      throw error // 向上抛出错误
    }
  }

  /**
   * 更新中间点位置
   */
  private updateMidPoints(
    index: number,
    position: Cesium.Cartesian3,
    positions: Cesium.Cartesian3[],
    len: number
  ): void {
    try {
      let draggersIdx: number
      let nextPositionIdx: number

      // 更新前一个中点
      if (this.hasClosure || (!this.hasClosure && index !== 0)) {
        if (index === 0) {
          draggersIdx = len * 2 - 1
          nextPositionIdx = len - 1
        } else {
          draggersIdx = index * 2 - 1
          nextPositionIdx = index - 1
        }

        const nextPosition = positions[nextPositionIdx]
        if (nextPosition && this.draggers[draggersIdx]) {
          let midpoint = Cesium.Cartesian3.midpoint(position, nextPosition, new Cesium.Cartesian3())
          midpoint = this.updatePositionsHeightByAttr(midpoint)
          this.draggers[draggersIdx].position = midpoint
        }
      }

      // 更新后一个中点
      if (this.hasClosure || (!this.hasClosure && index !== len - 1)) {
        if (index === len - 1) {
          draggersIdx = index * 2 + 1
          nextPositionIdx = 0
        } else {
          draggersIdx = index * 2 + 1
          nextPositionIdx = index + 1
        }

        const nextPosition = positions[nextPositionIdx]
        if (nextPosition && this.draggers[draggersIdx]) {
          let midpoint = Cesium.Cartesian3.midpoint(position, nextPosition, new Cesium.Cartesian3())
          midpoint = this.updatePositionsHeightByAttr(midpoint)
          this.draggers[draggersIdx].position = midpoint
        }
      }
    } catch (error) {
      console.error('EditPolyline.updateMidPoints: 更新中间点失败', error)
      // 不向上抛出错误
    }
  }

  /**
   * 更新整体移动拖拽点
   */
  private updateMoveAllDragger(positions: Cesium.Cartesian3[]): void {
    try {
      const draggerMove = this.draggers[this.draggers.length - 1]
      if (draggerMove && draggerMove._pointType === draggerCtl.PointType.MoveAll) {
        let positionMove = centerOfMass(positions)
        positionMove = this.updatePositionsHeightByAttr(positionMove)
        draggerMove.position = positionMove
      }
    } catch (error) {
      console.error('EditPolyline.updateMoveAllDragger: 更新整体移动点失败', error)
      // 不向上抛出错误
    }
  }

  /**
   * 创建中间点拖拽器
   */
  private createMidPointDragger(
    index: number,
    loc: Cesium.Cartesian3,
    positions: Cesium.Cartesian3[],
    len: number
  ): void {
    try {
      const nextIndex = (index + 1) % len
      const nextPos = positions[nextIndex]

      if (!nextPos) {
        console.warn(`EditPolyline.createMidPointDragger: 下一个位置[${nextIndex}]不存在`)
        return
      }

      let midpoint = Cesium.Cartesian3.midpoint(loc, nextPos, new Cesium.Cartesian3())
      midpoint = this.updatePositionsHeightByAttr(midpoint)

      const draggerMid = draggerCtl.createDragger(this.dataSource, {
        position: midpoint,
        type: draggerCtl.PointType.AddMidPoint,
        tooltip: defaultMessages.dragger.addMidPoint,
        onDragStart: (_dragger: Cesium.Entity, position: Cesium.Cartesian3) => {
          try {
            const draggerEntity = _dragger as ExtendedEntity
            if (!draggerEntity || draggerEntity.index === undefined) {
              throw new Error('拖拽实体或索引无效')
            }

            if (!position || !(position instanceof Cesium.Cartesian3)) {
              throw new Error('拖拽位置无效')
            }

            positions.splice(draggerEntity.index, 0, position) // 插入新点
          } catch (error) {
            console.error('EditPolyline.draggerMid.onDragStart: 开始拖拽中间点失败', error)
          }
        },
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
          } catch (error) {
            console.error('EditPolyline.draggerMid.onDrag: 拖拽中间点失败', error)
          }
        },
        onDragEnd: (_dragger: Cesium.Entity, _position: Cesium.Cartesian3) => {
          try {
            this.updateDraggers()
          } catch (error) {
            console.error('EditPolyline.draggerMid.onDragEnd: 结束拖拽中间点失败', error)
          }
        }
      })

      if (!draggerMid) {
        console.warn(`EditPolyline.createMidPointDragger: 创建中间点[${index}]失败`)
        return
      }

      const draggerMidEntity = draggerMid as ExtendedEntity
      draggerMidEntity.index = nextIndex
      this.draggers.push(draggerMid)
    } catch (error) {
      console.error('EditPolyline.createMidPointDragger: 创建中间点失败', error)
      // 不向上抛出错误
    }
  }

  /**
   * 创建整体移动拖拽器
   */
  private createMoveAllDragger(positions: Cesium.Cartesian3[]): void {
    try {
      let positionMove = centerOfMass(positions)
      positionMove = this.updatePositionsHeightByAttr(positionMove)

      const draggerMove = draggerCtl.createDragger(this.dataSource, {
        position: positionMove,
        type: draggerCtl.PointType.MoveAll,
        tooltip: defaultMessages.dragger.moveAll,
        onDrag: (_dragger: Cesium.Entity, position: Cesium.Cartesian3) => {
          try {
            // 验证位置
            if (!position || !(position instanceof Cesium.Cartesian3)) {
              throw new Error('拖拽位置无效')
            }

            if (!positionMove) {
              throw new Error('移动中心点不存在')
            }

            // 计算偏移量
            const diff = Cesium.Cartesian3.subtract(position, positionMove, new Cesium.Cartesian3())
            positionMove = position

            // 更新所有位置
            positions.forEach((pos, idx) => {
              if (pos && pos instanceof Cesium.Cartesian3) {
                const newPos = Cesium.Cartesian3.add(pos, diff, new Cesium.Cartesian3())
                positions[idx] = newPos
              }
            })

            // 刷新拖拽点
            this.updateDraggers()
          } catch (error) {
            console.error('EditPolyline.draggerMove.onDrag: 整体移动失败', error)
            // 拖拽过程中的错误不向上抛出，避免中断交互
          }
        }
      })

      if (!draggerMove) {
        const error = new Error('创建整体移动拖拽点失败')
        console.error('EditPolyline.createMoveAllDragger:', error.message)
        throw error
      }

      this.draggers.push(draggerMove)
    } catch (error) {
      console.error('EditPolyline.createMoveAllDragger: 创建整体移动点失败', error)
      throw error
    }
  }

  /**
   * 绑定高度拖拽点（用于拉伸高度编辑）
   * @param positions 位置数组，如果未提供则使用当前位置
   */
  protected bindHeightDraggers(positions?: Cesium.Cartesian3[]): void {
    try {
      // 清空之前的高度拖拽点
      this.heightDraggers = []

      // 使用传入的位置或当前位置
      const targetPositions = positions || this.getPosition()

      if (!targetPositions || targetPositions.length === 0) {
        console.warn('EditPolyline.bindHeightDraggers: 位置数组为空')
        return
      }

      // 获取拉伸高度
      const graphic = this.getGraphic()
      if (!('extrudedHeight' in graphic) || !graphic.extrudedHeight) {
        console.warn('EditPolyline.bindHeightDraggers: extrudedHeight 属性不存在')
        return
      }

      const extrudedHeightProp = graphic.extrudedHeight as Cesium.Property
      const extrudedHeight = extrudedHeightProp.getValue(this.viewer.clock.currentTime) as number

      if (!Number.isFinite(extrudedHeight)) {
        console.warn('EditPolyline.bindHeightDraggers: extrudedHeight 值无效')
        return
      }

      // 为每个位置创建高度拖拽点
      for (let i = 0, len = targetPositions.length; i < len; i++) {
        const loc = targetPositions[i]
        if (!loc || !(loc instanceof Cesium.Cartesian3)) {
          console.warn(`EditPolyline.bindHeightDraggers: 位置[${i}]无效，跳过`)
          continue
        }

        // 将位置设置到拉伸高度
        const heightPosition = setPositionsHeight(loc, extrudedHeight) as Cesium.Cartesian3

        // 创建高度拖拽点
        const dragger = draggerCtl.createDragger(this.dataSource, {
          position: heightPosition,
          type: draggerCtl.PointType.MoveHeight,
          tooltip: defaultMessages.dragger.moveHeight,
          onDrag: (_dragger: Cesium.Entity, position: Cesium.Cartesian3) => {
            try {
              // 验证位置
              if (!position || !(position instanceof Cesium.Cartesian3)) {
                throw new Error('拖拽位置无效')
              }

              // 获取新高度
              const cartographic = Cesium.Cartographic.fromCartesian(position)
              const thisHeight = cartographic.height

              if (!Number.isFinite(thisHeight)) {
                throw new Error('高度值无效')
              }

              // 更新图形的拉伸高度
              const graphic = this.getGraphic()
              if ('extrudedHeight' in graphic) {
                graphic.extrudedHeight = thisHeight as unknown as Cesium.Property
              }

              // 计算并更新属性中的拉伸高度（相对于最高点的高度差）
              const maxHeight = getMaxHeight(this.getPosition())
              const relativeHeight = formatNum(thisHeight - maxHeight, 2)

              if (this.entity.attribute?.style) {
                this.entity.attribute.style.extrudedHeight = relativeHeight
              }

              // 更新所有高度拖拽点
              this.updateHeightDraggers(thisHeight)
            } catch (error) {
              console.error('EditPolyline.heightDragger.onDrag: 拖拽高度失败', error)
              // 拖拽过程中的错误不向上抛出，避免中断交互
            }
          }
        })

        if (!dragger) {
          console.warn(`EditPolyline.bindHeightDraggers: 创建高度拖拽点[${i}]失败`)
          continue
        }

        this.draggers.push(dragger)
        this.heightDraggers.push(dragger)
      }
    } catch (error) {
      console.error('EditPolyline.bindHeightDraggers: 绑定高度拖拽点失败', error)
      // 不向上抛出错误，避免中断编辑流程
    }
  }

  /**
   * 更新所有高度拖拽点的位置
   * @param extrudedHeight 新的拉伸高度
   */
  protected updateHeightDraggers(extrudedHeight: number): void {
    try {
      // 验证参数
      if (!Number.isFinite(extrudedHeight)) {
        throw new Error('拉伸高度值无效')
      }

      if (!this.heightDraggers || this.heightDraggers.length === 0) {
        return
      }

      // 更新每个高度拖拽点的位置
      for (let i = 0; i < this.heightDraggers.length; i++) {
        const heightDragger = this.heightDraggers[i]

        if (!heightDragger || !heightDragger.position) {
          console.warn(`EditPolyline.updateHeightDraggers: 高度拖拽点[${i}]无效`)
          continue
        }

        // 获取当前位置
        const positionProp = heightDragger.position
        let currentPosition: Cesium.Cartesian3 | undefined

        if (positionProp && typeof positionProp === 'object' && 'getValue' in positionProp) {
          currentPosition = (positionProp as Cesium.Property).getValue(
            this.viewer.clock.currentTime
          ) as Cesium.Cartesian3
        } else if (positionProp) {
          currentPosition = positionProp as unknown as Cesium.Cartesian3
        }

        if (!currentPosition) {
          console.warn(`EditPolyline.updateHeightDraggers: 无法获取高度拖拽点[${i}]的位置`)
          continue
        }

        // 更新到新高度
        const newPosition = setPositionsHeight(currentPosition, extrudedHeight) as Cesium.Cartesian3

        // 使用 setValue 或直接赋值
        if (positionProp && typeof positionProp === 'object' && 'setValue' in positionProp) {
          ;(positionProp as Cesium.ConstantProperty).setValue(newPosition)
        } else {
          heightDragger.position = newPosition
        }
      }
    } catch (error) {
      console.error('EditPolyline.updateHeightDraggers: 更新高度拖拽点失败', error)
      // 不向上抛出错误，避免中断交互
    }
  }
}
