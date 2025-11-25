import * as Cesium from 'cesium'
import { EditBase } from './EditBase'
import type { ExtendedEntity } from './EditBase'
import * as draggerCtl from './Dragger'
import { defaultMessages } from '../../TooltipPlugin/messages'
import * as circleAttr from '../attr/AttrCircle'
import { addPositionsHeight } from '@ktd-cesium/shared'
import type { PModelEditEntity, ScaleDragger } from '../types'

/**
 * Primitive模型编辑类
 * 用于编辑Primitive类型的3D模型
 */
export class EditPModel extends EditBase {
  declare entity: ExtendedEntity & PModelEditEntity
  private entityAngle?: Cesium.Entity
  private entityBox?: Cesium.Entity

  /**
   * 外部更新位置
   */
  setPositions(position: Cesium.Cartesian3 | Cesium.Cartesian3[]): void {
    try {
      let finalPosition: Cesium.Cartesian3

      if (Array.isArray(position)) {
        if (position.length === 0) {
          throw new Error('位置数组不能为空')
        }
        finalPosition = position.length === 1 ? position[0] : position[0]
      } else {
        finalPosition = position
      }

      if (!finalPosition || !(finalPosition instanceof Cesium.Cartesian3)) {
        throw new Error('位置必须是 Cesium.Cartesian3 类型')
      }

      this.entity.position = new Cesium.ConstantProperty(finalPosition) as unknown as Cesium.Cartesian3
      this.entity.modelMatrix = this.getModelMatrix(finalPosition)
    } catch (error) {
      console.error('EditPModel.setPositions: 设置位置失败', error)
      throw error
    }
  }

  /**
   * 获取模型变换矩阵
   */
  getModelMatrix(position?: Cesium.Cartesian3): Cesium.Matrix4 {
    try {
      if (!this.entity) {
        throw new Error('实体对象不存在')
      }

      const cfg = this.entity.attribute?.style
      if (!cfg) {
        throw new Error('实体样式不存在')
      }

      let finalPosition: Cesium.Cartesian3

      if (position) {
        finalPosition = position
      } else {
        const entityPosition = this.entity.position
        if (!entityPosition) {
          throw new Error('位置不存在')
        }

        // 处理 PositionProperty 类型
        if (typeof entityPosition === 'object' && 'getValue' in entityPosition) {
          const posValue = (entityPosition as Cesium.Property).getValue(
            this.viewer.clock.currentTime
          ) as Cesium.Cartesian3
          if (!posValue) {
            throw new Error('无法获取位置值')
          }
          finalPosition = posValue
        } else {
          finalPosition = entityPosition as Cesium.Cartesian3
        }
      }

      if (!finalPosition || !(finalPosition instanceof Cesium.Cartesian3)) {
        throw new Error('位置必须是 Cesium.Cartesian3 类型')
      }

      const hpRoll = new Cesium.HeadingPitchRoll(
        Cesium.Math.toRadians(cfg.heading || 0),
        Cesium.Math.toRadians(cfg.pitch || 0),
        Cesium.Math.toRadians(cfg.roll || 0)
      )
      const fixedFrameTransform = Cesium.Transforms.eastNorthUpToFixedFrame

      const modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(
        finalPosition,
        hpRoll,
        this.viewer.scene.globe.ellipsoid,
        fixedFrameTransform
      )

      return modelMatrix
    } catch (error) {
      console.error('EditPModel.getModelMatrix: 获取模型矩阵失败', error)
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
        console.error('EditPModel.bindDraggers:', error.message)
        throw error
      }

      if (!this.dataSource) {
        const error = new Error('数据源对象不存在')
        console.error('EditPModel.bindDraggers:', error.message)
        throw error
      }

      // 检查模型是否准备好
      if (!this.entity.ready) {
        if (this.entity.readyPromise) {
          this.entity.readyPromise.then(() => {
            this.bindDraggers()
          }).catch((error) => {
            console.error('EditPModel.bindDraggers: 模型加载失败', error)
          })
        }
        return
      }

      const style = this.entity.attribute?.style
      if (!style) {
        const error = new Error('实体样式不存在')
        console.error('EditPModel.bindDraggers:', error.message)
        throw error
      }

      const entityPosition = this.entity.position
      if (!entityPosition) {
        const error = new Error('实体位置不存在')
        console.error('EditPModel.bindDraggers:', error.message)
        throw error
      }

      // 获取 Cartesian3 位置
      let position: Cesium.Cartesian3
      if (typeof entityPosition === 'object' && 'getValue' in entityPosition) {
        const posValue = (entityPosition as Cesium.Property).getValue(
          this.viewer.clock.currentTime
        ) as Cesium.Cartesian3
        if (!posValue) {
          const error = new Error('无法获取位置值')
          console.error('EditPModel.bindDraggers:', error.message)
          throw error
        }
        position = posValue
      } else {
        position = entityPosition as Cesium.Cartesian3
      }

      const boundingSphere = this.entity.boundingSphere
      if (!boundingSphere) {
        const error = new Error('实体包围球不存在')
        console.error('EditPModel.bindDraggers:', error.message)
        throw error
      }

      const height = Cesium.Cartographic.fromCartesian(position).height
      const radius = boundingSphere.radius

      // 设置拖拽提示
      this.entity.draw_tooltip = defaultMessages.dragger.def

      // 创建主拖拽点（使用模型本身）
      draggerCtl.createDragger(this.dataSource, {
        dragger: this.entity as Cesium.Entity,
        onDrag: (_dragger: Cesium.Entity, newPosition: Cesium.Cartesian3) => {
          try {
            if (!newPosition || !(newPosition instanceof Cesium.Cartesian3)) {
              throw new Error('拖拽位置无效')
            }

            this.entity.position = new Cesium.ConstantProperty(newPosition) as unknown as Cesium.Cartesian3
            this.entity.modelMatrix = this.getModelMatrix(newPosition)
            this.updateDraggers()
          } catch (error) {
            console.error('EditPModel.mainDragger.onDrag: 拖拽失败', error)
          }
        }
      })

      // 辅助显示：创建角度调整底部圆
      this.entityAngle = this.dataSource.entities.add({
        name: '角度调整底部圆',
        position: new Cesium.CallbackProperty(() => {
          const entityPosition = this.entity.position
          if (!entityPosition) {
            return position
          }

          if (typeof entityPosition === 'object' && 'getValue' in entityPosition) {
            return (entityPosition as Cesium.Property).getValue(
              this.viewer.clock.currentTime
            ) as Cesium.Cartesian3
          }
          return entityPosition as Cesium.Cartesian3
        }, false) as unknown as Cesium.Cartesian3,
        ellipse: circleAttr.style2Entity({
          fill: false,
          outline: true,
          outlineColor: '#ffff00',
          outlineOpacity: 0.8,
          radius: radius,
          height: height
        })
      })

      // 创建角度调整拖拽点
      const majorPos = this.getHeadingPosition()
      const majorDragger = draggerCtl.createDragger(this.dataSource, {
        position: majorPos,
        type: draggerCtl.PointType.EditAttr,
        tooltip: defaultMessages.dragger.editHeading,
        onDrag: (dragger: Cesium.Entity, position: Cesium.Cartesian3) => {
          try {
            if (!position || !(position instanceof Cesium.Cartesian3)) {
              throw new Error('拖拽位置无效')
            }

            const centerPosition = this.getCartesian3Position()
            const heading = this.getHeading(centerPosition, position)
            style.heading = this.formatNum(heading, 1)

            this.entity.modelMatrix = this.getModelMatrix()

            const draggerEntity = dragger as ExtendedEntity
            if (draggerEntity) {
              draggerEntity.position = this.getHeadingPosition()
            }
          } catch (error) {
            console.error('EditPModel.majorDragger.onDrag: 拖拽角度失败', error)
          }
        }
      })

      if (!majorDragger) {
        const error = new Error('角度拖拽点创建失败')
        console.error('EditPModel.bindDraggers:', error.message)
        throw error
      }

      this.draggers.push(majorDragger)

      // 缩放控制点
      const position_scale = addPositionsHeight(position, radius) as Cesium.Cartesian3
      const scaleDragger = draggerCtl.createDragger(this.dataSource, {
        position: position_scale,
        type: draggerCtl.PointType.MoveHeight,
        tooltip: defaultMessages.dragger.editScale,
        onDrag: (dragger: Cesium.Entity, positionNew: Cesium.Cartesian3) => {
          try {
            if (!positionNew || !(positionNew instanceof Cesium.Cartesian3)) {
              throw new Error('拖拽位置无效')
            }

            if (!position) {
              throw new Error('中心位置不存在')
            }

            const radiusNew = Cesium.Cartesian3.distance(positionNew, position)

            const scaleDraggerEntity = dragger as ScaleDragger
            if (!scaleDraggerEntity.radius) {
              throw new Error('拖拽点半径不存在')
            }

            const radiusOld = scaleDraggerEntity.radius / (style.scale || 1)
            const scaleNew = radiusNew / radiusOld

            scaleDraggerEntity.radius = radiusNew
            style.scale = this.formatNum(scaleNew, 2)

            this.entity.scale = style.scale
            this.updateDraggers()
          } catch (error) {
            console.error('EditPModel.scaleDragger.onDrag: 拖拽缩放失败', error)
          }
        }
      }) as ScaleDragger

      if (!scaleDragger) {
        const error = new Error('缩放拖拽点创建失败')
        console.error('EditPModel.bindDraggers:', error.message)
        throw error
      }

      scaleDragger.radius = radius
      this.draggers.push(scaleDragger)
    } catch (error) {
      console.error('EditPModel.bindDraggers: 绑定拖拽点失败', error)
      throw error
    }
  }

  /**
   * 销毁拖拽点
   */
  destroyDraggers(): void {
    // 调用父类方法
    super.destroyDraggers()

    try {
      // 移除辅助显示的角度圆
      if (this.entityAngle) {
        this.dataSource.entities.remove(this.entityAngle)
        delete this.entityAngle
      }

      // 移除辅助显示的包围盒
      if (this.entityBox) {
        this.dataSource.entities.remove(this.entityBox)
        delete this.entityBox
      }
    } catch (error) {
      console.error('EditPModel.destroyDraggers: 销毁拖拽点失败', error)
    }
  }

  /**
   * 图形编辑结束后调用
   */
  protected finish(): void {
    try {
      if (this.entity) {
        this.entity.draw_tooltip = undefined
      }
    } catch (error) {
      console.error('EditPModel.finish: 完成编辑失败', error)
      // finish 方法的错误不向上抛出，避免影响编辑结束流程
    }
  }

  /**
   * 获取 Cartesian3 位置
   * 内部辅助方法，用于从 PositionProperty 或 Cartesian3 中获取实际位置
   */
  private getCartesian3Position(): Cesium.Cartesian3 {
    if (!this.entity) {
      throw new Error('实体对象不存在')
    }

    const entityPosition = this.entity.position
    if (!entityPosition) {
      throw new Error('实体位置不存在')
    }

    // 处理 PositionProperty 类型
    if (typeof entityPosition === 'object' && 'getValue' in entityPosition) {
      const posValue = (entityPosition as Cesium.Property).getValue(
        this.viewer.clock.currentTime
      ) as Cesium.Cartesian3
      if (!posValue) {
        throw new Error('无法获取位置值')
      }
      return posValue
    }

    return entityPosition as Cesium.Cartesian3
  }

  /**
   * 获取朝向位置
   */
  private getHeadingPosition(): Cesium.Cartesian3 {
    try {
      const position = this.getCartesian3Position()

      const boundingSphere = this.entity.boundingSphere
      if (!boundingSphere) {
        throw new Error('实体包围球不存在')
      }

      const radius = boundingSphere.radius
      const angle = -Number(this.entity.attribute?.style?.heading || 0)

      let rotpos = new Cesium.Cartesian3(radius, 0.0, 0.0)

      let mat = Cesium.Transforms.eastNorthUpToFixedFrame(position)
      const rotationX = Cesium.Matrix4.fromRotationTranslation(
        Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(angle))
      )
      Cesium.Matrix4.multiply(mat, rotationX, mat)

      const mat3 = Cesium.Matrix4.getMatrix3(mat, new Cesium.Matrix3())
      rotpos = Cesium.Matrix3.multiplyByVector(mat3, rotpos, rotpos)
      rotpos = Cesium.Cartesian3.add(position, rotpos, rotpos)

      return rotpos
    } catch (error) {
      console.error('EditPModel.getHeadingPosition: 获取朝向位置失败', error)
      throw error
    }
  }

  /**
   * 获取点相对于中心点的地面角度
   */
  private getHeading(positionCenter: Cesium.Cartesian3, positionNew: Cesium.Cartesian3): number {
    try {
      if (!positionCenter || !(positionCenter instanceof Cesium.Cartesian3)) {
        throw new Error('中心位置无效')
      }

      if (!positionNew || !(positionNew instanceof Cesium.Cartesian3)) {
        throw new Error('新位置无效')
      }

      // 获取该位置的默认矩阵
      let mat = Cesium.Transforms.eastNorthUpToFixedFrame(positionCenter)
      const mat3 = Cesium.Matrix4.getMatrix3(mat, new Cesium.Matrix3())

      const xaxis = Cesium.Matrix3.getColumn(mat3, 0, new Cesium.Cartesian3())
      const yaxis = Cesium.Matrix3.getColumn(mat3, 1, new Cesium.Cartesian3())
      const zaxis = Cesium.Matrix3.getColumn(mat3, 2, new Cesium.Cartesian3())

      // 计算该位置和positionCenter的角度值
      let dir = Cesium.Cartesian3.subtract(positionNew, positionCenter, new Cesium.Cartesian3())
      // z cross (dirx cross z) 得到在xy平面的向量
      dir = Cesium.Cartesian3.cross(dir, zaxis, dir)
      dir = Cesium.Cartesian3.cross(zaxis, dir, dir)
      dir = Cesium.Cartesian3.normalize(dir, dir)

      let heading = Cesium.Cartesian3.angleBetween(xaxis, dir)

      const ay = Cesium.Cartesian3.angleBetween(yaxis, dir)
      if (ay > Math.PI * 0.5) {
        heading = 2 * Math.PI - heading
      }

      return -Cesium.Math.toDegrees(heading)
    } catch (error) {
      console.error('EditPModel.getHeading: 获取角度失败', error)
      throw error
    }
  }
}
