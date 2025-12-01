import * as Cesium from 'cesium'
import { DrawPolyline } from './DrawPolyline'
import type { AttrClass, PolygonDrawAttribute, PolygonExtendedEntity } from '../types'
import { getMaxHeight, isNumber, getCurrentMousePosition, addPositionsHeight } from '@ktd-cesium/shared'
import { GraphicsEventType } from '../../EventPlugin'
import { defaultMessages } from '../../TooltipPlugin/messages'
import * as attr from '../attr/AttrPolygon'
import { EditPolygon } from '../edit/EditPolygon'
import type { EditClassConstructor } from '../types'

/**
 * 多边形绘制类
 */
export class DrawPolygon extends DrawPolyline {
  type = 'polygon'
  // 坐标位置相关
  override _minPointNum = 3 // 至少需要点的个数
  override _maxPointNum = 9999 // 最多允许点的个数

  override editClass = EditPolygon as EditClassConstructor
  override attrClass = attr as unknown as AttrClass

  /**
   * 根据 attribute 参数创建 Entity
   */
  createFeature(attribute: Record<string, unknown>): Cesium.Entity {
    this._positions_draw = []

    // 类型守卫：验证 attribute 是否符合 PolygonAttribute 接口
    if (!attribute || typeof attribute !== 'object') {
      throw new Error('DrawPolygon.createFeature: attribute 必须是对象')
    }

    const polygonAttr = attribute as PolygonDrawAttribute
    if (!polygonAttr.style || typeof polygonAttr.style !== 'object') {
      throw new Error('DrawPolygon.createFeature: attribute.style 不能为空且必须是对象')
    }

    if (!this._minPointNum_def) this._minPointNum_def = this._minPointNum
    if (!this._maxPointNum_def) this._maxPointNum_def = this._maxPointNum

    if (polygonAttr.config) {
      // 允许外部传入
      this._minPointNum = polygonAttr.config.minPointNum || this._minPointNum_def
      this._maxPointNum = polygonAttr.config.maxPointNum || this._maxPointNum_def
    } else {
      this._minPointNum = this._minPointNum_def
      this._maxPointNum = this._maxPointNum_def
    }

    try {
      // 转换样式为 Entity 属性
      const polygonGraphics = attr.style2Entity(polygonAttr.style)

      const addattr: Cesium.Entity.ConstructorOptions & { attribute: PolygonDrawAttribute } = {
        polygon: polygonGraphics,
        attribute: polygonAttr
      }

      // 确保 polygon 已定义
      if (!addattr.polygon) {
        throw new Error('DrawPolygon.createFeature: polygon graphics 创建失败')
      }

      addattr.polygon.hierarchy = new Cesium.CallbackProperty((_time?: Cesium.JulianDate) => {
        const positions = this.getDrawPosition()
        if (!positions || !Array.isArray(positions)) return new Cesium.PolygonHierarchy([])
        return new Cesium.PolygonHierarchy(positions as Cesium.Cartesian3[])
      }, false) as unknown as Cesium.PolygonHierarchy

      // 线：绘制时前2点时 + 边线宽度大于1时
      addattr.polyline = {
        clampToGround: polygonAttr.style.clampToGround,
        show: false
      } as Cesium.PolylineGraphics.ConstructorOptions

      this.entity = this.dataSource!.entities.add(addattr) // 创建要素对象

      this.bindOutline(this.entity) // 边线

      return this.entity
    } catch (error) {
      console.error('DrawPolygon.createFeature: 创建实体失败', error)
      throw error
    }
  }

  /**
   * 样式转 entity
   */
  protected style2Entity(style: Record<string, unknown>, entity: Cesium.Entity): void {
    if (!entity.polygon) {
      console.warn('DrawPolygon.style2Entity: polygon 不存在')
      return
    }

    // 类型验证
    if (!style || typeof style !== 'object') {
      console.warn('DrawPolygon.style2Entity: style 必须是对象')
      return
    }

    try {
      // 将 PolygonGraphics 转换为兼容的属性接口
      const polygonAttr = entity.polygon as unknown as attr.EntityAttr
      attr.style2Entity(style as attr.StyleConfig, polygonAttr)
    } catch (error) {
      console.error('DrawPolygon.style2Entity: 转换样式失败', error)
    }
  }

  /**
   * 绑定边线
   */
  bindOutline(entity: Cesium.Entity): void {
    if (!entity.polyline || !entity.polygon) {
      console.warn('DrawPolygon.bindOutline: polyline 或 polygon 不存在')
      return
    }

    const extEntity = entity as PolygonExtendedEntity

    // 是否显示：绘制时前2点时 或 边线宽度大于1时
    entity.polyline.show = new Cesium.CallbackProperty((time?: Cesium.JulianDate) => {
      try {
        const arr = attr.getPositions(extEntity as unknown as attr.PolygonEntity, true)
        if (arr && arr.length < 3) return true

        const currentTime = time || Cesium.JulianDate.now()
        return (
          entity.polygon!.outline &&
          entity.polygon!.outline.getValue(currentTime) &&
          entity.polygon!.outlineWidth &&
          entity.polygon!.outlineWidth.getValue(currentTime) > 1
        )
      } catch (error) {
        console.warn('DrawPolygon.bindOutline: 获取 show 属性失败', error)
        return false
      }
    }, false)

    entity.polyline.positions = new Cesium.CallbackProperty((time?: Cesium.JulianDate) => {
      try {
        const currentTime = time || Cesium.JulianDate.now()
        if (!entity.polyline!.show!.getValue(currentTime)) return null

        const arr = attr.getPositions(extEntity as unknown as attr.PolygonEntity, true)
        if (!arr) return null
        if (arr.length < 3) return arr

        return arr.concat([arr[0]])
      } catch (error) {
        console.warn('DrawPolygon.bindOutline: 获取 positions 失败', error)
        return null
      }
    }, false)

    entity.polyline.width = new Cesium.CallbackProperty((_time?: Cesium.JulianDate) => {
      try {
        const arr = attr.getPositions(extEntity as unknown as attr.PolygonEntity, true)
        if (arr && arr.length < 3) return 2

        return entity.polygon!.outlineWidth
      } catch (error) {
        console.warn('DrawPolygon.bindOutline: 获取 width 失败', error)
        return 2
      }
    }, false)

    // Cesium 1.134+ 要求 material 必须是 MaterialProperty，不能是返回 Color 的 CallbackProperty
    entity.polyline.material = new Cesium.ColorMaterialProperty(
      new Cesium.CallbackProperty((time?: Cesium.JulianDate) => {
        try {
          const currentTime = time || Cesium.JulianDate.now()
          const arr = attr.getPositions(extEntity as unknown as attr.PolygonEntity, true)
          if (arr && arr.length < 3) {
            // 获取多边形的颜色
            if (entity.polygon!.material) {
              // 如果是 ColorMaterialProperty，获取其 color 值
              const polygonMaterial = entity.polygon!.material as Cesium.ColorMaterialProperty
              if ('color' in polygonMaterial && polygonMaterial.color) {
                const colorProp = polygonMaterial.color
                if (typeof (colorProp as Cesium.Property).getValue === 'function') {
                  const color = (colorProp as Cesium.Property).getValue(currentTime) as Cesium.Color
                  if (color) return color
                }
                return colorProp
              }
              // 如果 material 本身是其他类型的 MaterialProperty，尝试获取 color
              if (typeof (polygonMaterial as Cesium.MaterialProperty).getValue === 'function') {
                const matValue = (polygonMaterial as Cesium.MaterialProperty).getValue(currentTime)
                if (matValue && 'color' in matValue && matValue.color) {
                  return matValue.color as Cesium.Color
                }
              }
            }
            return Cesium.Color.YELLOW
          }
          // 获取轮廓颜色，确保返回有效的 Color 对象
          if (entity.polygon!.outlineColor) {
            const outlineColor = entity.polygon!.outlineColor
            if (typeof (outlineColor as Cesium.Property).getValue === 'function') {
              const color = (outlineColor as Cesium.Property).getValue(currentTime) as Cesium.Color
              return color || Cesium.Color.YELLOW
            }
            // 如果 outlineColor 本身就是 Color 对象
            if (outlineColor instanceof Cesium.Color) {
              return outlineColor
            }
          }
          return Cesium.Color.YELLOW
        } catch (error) {
          console.warn('DrawPolygon.bindOutline: 获取 material 颜色失败', error)
          return Cesium.Color.YELLOW
        }
      }, false)
    )
  }

  /**
   * 绑定鼠标事件（支持PC端和移动端）
   */
  override bindEvent(): void {
    let lastPointTemporary = false
    const positions = this._positions_draw as Cesium.Cartesian3[]

    // 左键点击或触摸添加点
    this.bindClickEvent((position: Cesium.Cartesian2) => {
      let point = getCurrentMousePosition(this.viewer!.scene, position, this.entity)
      if (!point && lastPointTemporary) {
        // 如果未拾取到点，并且存在 MOUSE_MOVE 时，取最后一个 move 的点
        point = positions[positions.length - 1]
      }

      if (point) {
        if (lastPointTemporary) {
          positions.pop()
        }
        lastPointTemporary = false

        // 在绘制点基础自动增加高度
        const extEntity = this.entity as PolygonExtendedEntity
        if (extEntity.attribute?.config?.addHeight) {
          point = addPositionsHeight(point, extEntity.attribute.config.addHeight) as Cesium.Cartesian3
        }

        positions.push(point)
        this.updateAttrForDrawing()

        this.fire(GraphicsEventType.DRAW_ADD_POINT, {
          drawtype: this.type,
          entity: this.entity,
          position: point,
          positions: positions
        })

        if (positions.length >= this._maxPointNum) {
          // 点数满足最大数量，自动结束
          this.disable()
        }
      }
    })

    // 右键删除上一个点（PC端专用）
    this.bindRightClickEvent((position: Cesium.Cartesian2) => {
      positions.pop() // 删除最后标的一个点

      const point = getCurrentMousePosition(this.viewer!.scene, position, this.entity)
      if (point) {
        if (lastPointTemporary) {
          positions.pop()
        }
        lastPointTemporary = true

        this.fire(GraphicsEventType.DRAW_REMOVE_POINT, {
          drawtype: this.type,
          entity: this.entity,
          position: point,
          positions: positions
        })

        positions.push(point)
        this.updateAttrForDrawing()
      }
    })

    // 鼠标移动或触摸移动
    this.bindMoveEvent((position: Cesium.Cartesian2) => {
      // 显示提示信息
      if (positions.length <= 1) {
        this.tooltip!.showAt(position, defaultMessages.draw.polygon.start)
      } else if (positions.length < this._minPointNum) {
        this.tooltip!.showAt(position, defaultMessages.draw.polygon.cont)
      } else if (positions.length >= this._maxPointNum) {
        this.tooltip!.showAt(position, defaultMessages.draw.polygon.end2)
      } else {
        this.tooltip!.showAt(position, defaultMessages.draw.polygon.end)
      }

      const point = getCurrentMousePosition(this.viewer!.scene, position, this.entity)
      if (point) {
        if (lastPointTemporary) {
          positions.pop()
        }
        lastPointTemporary = true

        positions.push(point)
        this.updateAttrForDrawing()

        this.fire(GraphicsEventType.DRAW_MOUSE_MOVE, {
          drawtype: this.type,
          entity: this.entity,
          position: point,
          positions: positions
        })
      }
    })

    // 双击结束标绘（PC端），移动端通过 endDraw() 按钮结束
    this.bindDoubleClickEvent(() => {
      // 必要代码 消除双击带来的多余经纬度
      if (positions.length > this._minPointNum) {
        const mpt1 = positions[positions.length - 1]
        const mpt2 = positions[positions.length - 2]

        if (Math.abs(mpt1.x - mpt2.x) < 1 && Math.abs(mpt1.y - mpt2.y) < 1 && Math.abs(mpt1.z - mpt2.z) < 1) {
          positions.pop()
        }
      }
      this.endDraw()
    })
  }

  /**
   * 外部控制，完成绘制，比如手机端无法双击结束
   */
  endDraw(): this {
    if (!this._enabled) {
      return this
    }

    const positions = this._positions_draw as Cesium.Cartesian3[]
    if (positions.length < this._minPointNum) return this // 点数不够
    this.updateAttrForDrawing()
    this.disable()
    return this
  }

  /**
   * 更新绘制属性
   */
  updateAttrForDrawing(): void {
    if (!this.entity) {
      console.warn('DrawPolygon.updateAttrForDrawing: entity 不存在')
      return
    }

    const extEntity = this.entity as PolygonExtendedEntity
    if (!extEntity.attribute || !extEntity.attribute.style) {
      console.warn('DrawPolygon.updateAttrForDrawing: attribute 或 style 不存在')
      return
    }

    const style = extEntity.attribute.style

    // 类型守卫：确保 extrudedHeight 是数字类型
    if (style.extrudedHeight !== undefined && isNumber(style.extrudedHeight)) {
      try {
        // 存在 extrudedHeight 高度设置时
        const positions = this.getDrawPosition()
        if (!positions || !Array.isArray(positions) || positions.length === 0) {
          console.warn('DrawPolygon.updateAttrForDrawing: positions 无效')
          return
        }

        const maxHight = getMaxHeight(positions as Cesium.Cartesian3[])
        if (this.entity.polygon) {
          // 使用 ConstantProperty 包装数字值
          this.entity.polygon.extrudedHeight = new Cesium.ConstantProperty(maxHight + Number(style.extrudedHeight))
        }
      } catch (error) {
        console.warn('DrawPolygon.updateAttrForDrawing: 更新高度失败', error)
      }
    }
  }

  /**
   * 图形绘制结束后调用
   */
  finish(): void {
    if (!this.entity) {
      console.warn('DrawPolygon.finish: entity 不存在')
      return
    }

    const entity = this.entity
    const extEntity = entity as PolygonExtendedEntity

    try {
      // 绑定编辑对象
      extEntity.editing = this.getEditClass(entity)

      const positions = this.getDrawPosition()
      if (!positions || !Array.isArray(positions) || positions.length === 0) {
        console.warn('DrawPolygon.finish: positions 为空或无效')
        return
      }

      // 类型守卫：确保 positions 是 Cartesian3 数组
      const cartesianPositions = positions as Cesium.Cartesian3[]
      extEntity._positions_draw = cartesianPositions

      if (entity.polygon) {
        entity.polygon.hierarchy = new Cesium.CallbackProperty((_time?: Cesium.JulianDate) => {
          const pos = extEntity._positions_draw
          if (!pos || !Array.isArray(pos) || pos.length === 0) {
            return new Cesium.PolygonHierarchy([])
          }
          return new Cesium.PolygonHierarchy(pos)
        }, false)
      } else {
        console.warn('DrawPolygon.finish: polygon graphics 不存在')
      }
    } catch (error) {
      console.error('DrawPolygon.finish: 完成绘制失败', error)
    }
  }
}
