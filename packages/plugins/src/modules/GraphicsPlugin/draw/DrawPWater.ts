import * as Cesium from 'cesium'
import { DrawPPolygon } from './DrawPPolygon'
import { getCurrentMousePosition } from '@ktd-cesium/shared'
import { defaultMessages } from '../../TooltipPlugin/messages'
import { GraphicsEventType } from '../../EventPlugin'
import { EditWater } from '../edit/EditWater'
import { createWaterMaterial } from '../../MaterialPlugin'
import type { WaterPrimitiveStyle, WaterPrimitiveAttribute, WaterPrimitiveObject } from '../types'

/**
 * 水面 Primitive 绘制类
 * 支持反射水面、波纹动画、流动效果
 */
export class DrawPWater extends DrawPPolygon {
  override type = 'water-p'

  /** 水面 Primitive */
  protected waterPrimitive: Cesium.Primitive | Cesium.GroundPrimitive | null = null

  /** 动画帧ID */
  protected animationFrameId: number | null = null

  /** 水面材质 */
  protected waterMaterial: Cesium.Material | null = null

  /** 编辑器实例 */
  protected waterEditor: EditWater | null = null

  /** 是否处于编辑模式 */
  protected isEditing = false

  /**
   * 创建水面材质
   */
  protected createWaterMaterial(style: WaterPrimitiveStyle): Cesium.Material {
    return createWaterMaterial({
      normalMap: style.normalMap,
      baseWaterColor: style.baseWaterColor,
      blendColor: style.blendColor,
      waveType: style.waveType,
      frequency: style.frequency,
      amplitude: style.amplitude,
      animationSpeed: style.animationSpeed,
      specularIntensity: style.specularIntensity,
      fadeFactor: style.fadeFactor,
      flowDirection: style.flowDirection,
      flowSpeed: style.flowSpeed
    })
  }

  /**
   * 解析颜色
   */
  protected parseColor(color: string | Cesium.Color | undefined): Cesium.Color | undefined {
    if (!color) return undefined
    if (color instanceof Cesium.Color) return color
    if (typeof color === 'string') {
      return Cesium.Color.fromCssColorString(color)
    }
    return undefined
  }

  /**
   * 创建水面 Primitive
   */
  protected override createPrimitive(
    attribute: Record<string, unknown>
  ): Cesium.Primitive | Cesium.GroundPrimitive | null {
    this._positions_draw = []

    const waterAttr = attribute as WaterPrimitiveAttribute

    if (!this._minPointNum_def) this._minPointNum_def = this._minPointNum
    if (!this._maxPointNum_def) this._maxPointNum_def = this._maxPointNum

    if (waterAttr.config) {
      this._minPointNum = waterAttr.config.minPointNum || this._minPointNum_def
      this._maxPointNum = waterAttr.config.maxPointNum || this._maxPointNum_def
    } else {
      this._minPointNum = this._minPointNum_def
      this._maxPointNum = this._maxPointNum_def
    }

    // 创建水面材质
    this.waterMaterial = this.createWaterMaterial(waterAttr.style)

    // 创建初始 Primitive（空几何体，后续更新）
    const geometryInstance = new Cesium.GeometryInstance({
      geometry: new Cesium.PolygonGeometry({
        polygonHierarchy: new Cesium.PolygonHierarchy([]),
        height: waterAttr.style.height || 0,
        extrudedHeight: waterAttr.style.extrudedHeight,
        vertexFormat: Cesium.MaterialAppearance.MaterialSupport.ALL.vertexFormat
      })
    })

    this.waterPrimitive = new Cesium.Primitive({
      geometryInstances: geometryInstance,
      appearance: new Cesium.MaterialAppearance({
        material: this.waterMaterial,
        translucent: true
      }),
      show: waterAttr.style.show !== false
    })

    this.primitives!.add(this.waterPrimitive)
    this.primitive = this.waterPrimitive

    return this.waterPrimitive
  }

  /**
   * 更新水面几何体
   */
  protected override updatePolygonGeometry(): void {
    if (!this.waterPrimitive) return

    const positions = this._positions_draw as Cesium.Cartesian3[]
    if (positions.length < 3) return

    // 获取当前样式
    const waterPrimitiveObj = this.waterPrimitive as unknown as WaterPrimitiveObject
    const waterAttr = waterPrimitiveObj._waterAttribute
    const style = waterAttr?.style || {}

    // 移除旧的 Primitive
    if (this.primitives!.contains(this.waterPrimitive)) {
      this.primitives!.remove(this.waterPrimitive)
    }

    // 创建新的几何体
    const geometryInstance = new Cesium.GeometryInstance({
      geometry: new Cesium.PolygonGeometry({
        polygonHierarchy: new Cesium.PolygonHierarchy(positions),
        height: style.height || 0,
        extrudedHeight: style.extrudedHeight,
        vertexFormat: Cesium.MaterialAppearance.MaterialSupport.ALL.vertexFormat
      })
    })

    this.waterPrimitive = new Cesium.Primitive({
      geometryInstances: geometryInstance,
      appearance: new Cesium.MaterialAppearance({
        material: this.waterMaterial!,
        translucent: true
      }),
      show: style.show !== false
    })

    // 保存属性引用
    const newWaterPrimitiveObj = this.waterPrimitive as unknown as WaterPrimitiveObject
    newWaterPrimitiveObj._waterAttribute = waterAttr

    this.primitives!.add(this.waterPrimitive)
    this.primitive = this.waterPrimitive
  }

  /**
   * 绑定鼠标事件
   */
  override bindEvent(): void {
    let lastPointTemporary = false
    const positions = this._positions_draw as Cesium.Cartesian3[]

    // 左键点击添加点
    this.bindClickEvent((position: Cesium.Cartesian2) => {
      let point = getCurrentMousePosition(this.viewer!.scene, position, null)
      if (!point && lastPointTemporary) {
        point = positions[positions.length - 1]
      }

      if (point) {
        if (lastPointTemporary) {
          positions.pop()
        }
        lastPointTemporary = false

        positions.push(point)
        this.updatePolygonGeometry()

        this.fire(GraphicsEventType.DRAW_ADD_POINT, {
          drawtype: this.type,
          primitive: this.waterPrimitive,
          position: point,
          positions: positions
        })

        if (positions.length >= this._maxPointNum) {
          this.disable()
        }
      }
    })

    // 右键删除上一个点
    this.bindRightClickEvent((position: Cesium.Cartesian2) => {
      positions.pop()

      const point = getCurrentMousePosition(this.viewer!.scene, position, null)
      if (point) {
        if (lastPointTemporary) {
          positions.pop()
        }
        lastPointTemporary = true

        this.fire(GraphicsEventType.DRAW_REMOVE_POINT, {
          drawtype: this.type,
          primitive: this.waterPrimitive,
          position: point,
          positions: positions
        })

        positions.push(point)
        this.updatePolygonGeometry()
      }
    })

    // 鼠标移动
    this.bindMoveEvent((position: Cesium.Cartesian2) => {
      if (positions.length <= 1) {
        this.tooltip!.showAt(position, defaultMessages.draw.polygon.start)
      } else if (positions.length < this._minPointNum) {
        this.tooltip!.showAt(position, defaultMessages.draw.polygon.cont)
      } else if (positions.length >= this._maxPointNum) {
        this.tooltip!.showAt(position, defaultMessages.draw.polygon.end2)
      } else {
        this.tooltip!.showAt(position, defaultMessages.draw.polygon.end)
      }

      const point = getCurrentMousePosition(this.viewer!.scene, position, null)
      if (point) {
        if (lastPointTemporary) {
          positions.pop()
        }
        lastPointTemporary = true

        positions.push(point)
        this.updatePolygonGeometry()

        this.fire(GraphicsEventType.DRAW_MOUSE_MOVE, {
          drawtype: this.type,
          primitive: this.waterPrimitive,
          position: point,
          positions: positions
        })
      }
    })

    // 双击结束
    this.bindDoubleClickEvent(() => {
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
   * 更新水面样式
   */
  updateWaterStyle(style: Partial<WaterPrimitiveStyle>): void {
    if (!this.waterMaterial) return

    if (style.baseWaterColor) {
      this.waterMaterial.uniforms.baseWaterColor = this.parseColor(style.baseWaterColor)
    }
    if (style.blendColor) {
      this.waterMaterial.uniforms.blendColor = this.parseColor(style.blendColor)
    }
    if (style.frequency !== undefined) {
      this.waterMaterial.uniforms.frequency = style.frequency
    }
    if (style.animationSpeed !== undefined) {
      this.waterMaterial.uniforms.animationSpeed = style.animationSpeed
    }
    if (style.amplitude !== undefined) {
      this.waterMaterial.uniforms.amplitude = style.amplitude
    }
    if (style.specularIntensity !== undefined) {
      this.waterMaterial.uniforms.specularIntensity = style.specularIntensity
    }
    if (style.fadeFactor !== undefined) {
      this.waterMaterial.uniforms.fadeFactor = style.fadeFactor
    }
    if (style.flowDirection !== undefined) {
      this.waterMaterial.uniforms.flowDirection = style.flowDirection
    }
    if (style.flowSpeed !== undefined) {
      this.waterMaterial.uniforms.flowSpeed = style.flowSpeed
    }
  }

  /**
   * Primitive 绘制结束
   */
  protected override finishPrimitive(): void {
    if (!this.waterPrimitive) return

    const waterPrimitiveObj = this.waterPrimitive as unknown as WaterPrimitiveObject
    waterPrimitiveObj._positions_draw = this.getDrawPosition()

    // 绑定编辑对象
    waterPrimitiveObj.editing = this.createEditor()
  }

  /**
   * 创建编辑器
   */
  protected createEditor(): EditWater | null {
    if (!this.waterPrimitive || !this.viewer || !this.dataSource) return null

    return new EditWater(this.waterPrimitive, this.viewer, this.dataSource, () => this.updatePolygonGeometry())
  }

  // ==================== 编辑功能 ====================

  /**
   * 启用编辑模式
   */
  enableEdit(): this {
    if (this.isEditing) return this

    if (!this.waterEditor && this.waterPrimitive) {
      this.waterEditor = this.createEditor()
    }

    if (this.waterEditor) {
      this.waterEditor.activate()
      this.isEditing = true
    }

    return this
  }

  /**
   * 禁用编辑模式
   */
  disableEdit(): this {
    if (!this.isEditing) return this

    if (this.waterEditor) {
      this.waterEditor.disable()
    }

    this.isEditing = false
    return this
  }

  /**
   * 获取编辑器
   */
  getEditor(): EditWater | null {
    return this.waterEditor
  }

  /**
   * 更新编辑控制点
   */
  updateEditDraggers(): this {
    if (this.waterEditor && this.isEditing) {
      this.waterEditor.updateDraggers()
    }
    return this
  }

  /**
   * 设置位置并更新编辑
   */
  setPositions(positions: Cesium.Cartesian3[]): this {
    this._positions_draw = positions

    if (this.waterPrimitive) {
      const waterPrimitiveObj = this.waterPrimitive as unknown as WaterPrimitiveObject
      waterPrimitiveObj._positions_draw = positions
    }

    this.updatePolygonGeometry()

    if (this.waterEditor && this.isEditing) {
      this.waterEditor.setPositions(positions)
    }

    return this
  }

  /**
   * 获取位置
   */
  getPositions(): Cesium.Cartesian3[] {
    return (this._positions_draw as Cesium.Cartesian3[])?.map((p) => p.clone()) || []
  }

  /**
   * 清理资源
   */
  override disable(hasWB?: boolean): this {
    // 停止编辑
    this.disableEdit()

    // 停止动画
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    super.disable(hasWB)

    if (hasWB && this.waterPrimitive && this.primitives) {
      if (this.primitives.contains(this.waterPrimitive)) {
        this.primitives.remove(this.waterPrimitive)
      }
    }

    this.waterPrimitive = null
    this.waterMaterial = null
    this.waterEditor = null
    return this
  }

  override toEntityType(): string {
    return 'water'
  }

  override removePrimitive(): void {
    this.disableEdit()

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    if (this.waterPrimitive && this.primitives) {
      if (this.primitives.contains(this.waterPrimitive)) {
        this.primitives.remove(this.waterPrimitive)
      }
    }
    this.waterPrimitive = null
    this.waterMaterial = null
    this.waterEditor = null
    this.primitive = null
  }
}
