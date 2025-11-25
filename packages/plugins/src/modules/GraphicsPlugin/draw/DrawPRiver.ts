import * as Cesium from 'cesium'
import { DrawPWater } from './DrawPWater'
import { getCurrentMousePosition, line2curve } from '@ktd-cesium/shared'
import { defaultMessages } from '../../TooltipPlugin/messages'
import { GraphicsEventType } from '../../EventPlugin'
import type { RiverPrimitiveAttribute, RiverCrossSection, RiverAnimationState, RiverPrimitiveObject } from '../types'

/**
 * 动态河流 Primitive 绘制类
 * 支持河流流动效果、断面水位动态升降
 */
export class DrawPRiver extends DrawPWater {
  override type = 'river-p'

  // 河流至少需要2个点
  protected override _minPointNum = 2
  protected override _maxPointNum = 9999

  /** 河流断面数据 */
  private crossSections: RiverCrossSection[] = []

  /** 河流动画状态 */
  private riverState: RiverAnimationState = {
    isAnimating: false,
    startTime: 0,
    currentWaterLevel: 0,
    baseWaterLevel: 0
  }

  /** 动画移除监听器 */
  private removeRiverListener: (() => void) | null = null

  /** 平滑后的河流路径 */
  private smoothPath: Cesium.Cartesian3[] | null = null

  /**
   * 创建河流 Primitive
   */
  protected override createPrimitive(attribute: Record<string, unknown>): Cesium.Primitive | Cesium.GroundPrimitive | null {
    this._positions_draw = []

    const riverAttr = attribute as RiverPrimitiveAttribute
    const style = riverAttr.style

    // 初始化河流状态
    this.riverState = {
      isAnimating: false,
      startTime: 0,
      currentWaterLevel: style.depth ?? 5,
      baseWaterLevel: style.depth ?? 5
    }

    // 初始化断面数据
    if (style.crossSections) {
      this.crossSections = [...style.crossSections]
    }

    // 调用父类创建水面
    const primitive = super.createPrimitive(attribute)

    if (primitive) {
      const riverPrimitiveObj = primitive as unknown as RiverPrimitiveObject
      riverPrimitiveObj._riverAttribute = riverAttr
    }

    // 如果启用动态水位，开始动画
    if (style.dynamicWaterLevel) {
      this.startWaterLevelAnimation()
    }

    return primitive
  }

  /**
   * 根据河流路径生成多边形顶点
   */
  private generateRiverPolygon(path: Cesium.Cartesian3[], width: number): Cesium.Cartesian3[] {
    if (path.length < 2) return []

    const leftPoints: Cesium.Cartesian3[] = []
    const rightPoints: Cesium.Cartesian3[] = []
    const halfWidth = width / 2

    for (let i = 0; i < path.length; i++) {
      const current = path[i]
      let direction: Cesium.Cartesian3

      if (i === 0) {
        // 第一个点：使用下一个点的方向
        direction = Cesium.Cartesian3.subtract(path[1], current, new Cesium.Cartesian3())
      } else if (i === path.length - 1) {
        // 最后一个点：使用前一个点的方向
        direction = Cesium.Cartesian3.subtract(current, path[i - 1], new Cesium.Cartesian3())
      } else {
        // 中间点：使用前后点的平均方向
        const dir1 = Cesium.Cartesian3.subtract(current, path[i - 1], new Cesium.Cartesian3())
        const dir2 = Cesium.Cartesian3.subtract(path[i + 1], current, new Cesium.Cartesian3())
        direction = Cesium.Cartesian3.add(dir1, dir2, new Cesium.Cartesian3())
      }

      Cesium.Cartesian3.normalize(direction, direction)

      // 获取地表法线
      const surfaceNormal = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(current, new Cesium.Cartesian3())

      // 计算横向向量（垂直于河流方向和地表法线）
      const right = Cesium.Cartesian3.cross(direction, surfaceNormal, new Cesium.Cartesian3())
      Cesium.Cartesian3.normalize(right, right)
      Cesium.Cartesian3.multiplyByScalar(right, halfWidth, right)

      // 计算左右两侧的点
      const leftPoint = Cesium.Cartesian3.subtract(current, right, new Cesium.Cartesian3())
      const rightPoint = Cesium.Cartesian3.add(current, right, new Cesium.Cartesian3())

      leftPoints.push(leftPoint)
      rightPoints.push(rightPoint)
    }

    // 组合成闭合多边形
    return [...leftPoints, ...rightPoints.reverse()]
  }

  /**
   * 更新河流几何体
   */
  protected override updatePolygonGeometry(): void {
    const path = this._positions_draw as Cesium.Cartesian3[]
    if (path.length < 2) return

    // 平滑河流路径
    this.smoothPath = path.length >= 3 ? line2curve(path, false) : path

    const riverPrimitiveObj = this.waterPrimitive as unknown as RiverPrimitiveObject | null
    const riverAttr = riverPrimitiveObj?._riverAttribute
    const style = riverAttr?.style || {}
    const width = style.width ?? 50

    // 生成河流多边形
    const polygonPositions = this.generateRiverPolygon(this.smoothPath, width)
    if (polygonPositions.length < 3) return

    // 移除旧的 Primitive
    if (this.waterPrimitive && this.primitives!.contains(this.waterPrimitive)) {
      this.primitives!.remove(this.waterPrimitive)
    }

    // 创建新的几何体
    const geometryInstance = new Cesium.GeometryInstance({
      geometry: new Cesium.PolygonGeometry({
        polygonHierarchy: new Cesium.PolygonHierarchy(polygonPositions),
        height: style.height ?? 0,
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

    const newRiverPrimitiveObj = this.waterPrimitive as unknown as RiverPrimitiveObject
    newRiverPrimitiveObj._riverAttribute = riverAttr
    newRiverPrimitiveObj._positions_draw = path

    this.primitives!.add(this.waterPrimitive)
    this.primitive = this.waterPrimitive
  }

  /**
   * 绑定鼠标事件（河流专用）
   */
  override bindEvent(): void {
    let lastPointTemporary = false
    const positions = this._positions_draw as Cesium.Cartesian3[]

    // 左键点击添加路径点
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
        this.tooltip!.showAt(position, defaultMessages.draw.polyline.start)
      } else if (positions.length < this._minPointNum) {
        this.tooltip!.showAt(position, defaultMessages.draw.polyline.cont)
      } else {
        this.tooltip!.showAt(position, defaultMessages.draw.polyline.end)
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

        if (
          Math.abs(mpt1.x - mpt2.x) < 1 &&
          Math.abs(mpt1.y - mpt2.y) < 1 &&
          Math.abs(mpt1.z - mpt2.z) < 1
        ) {
          positions.pop()
        }
      }
      this.endDraw()
    })
  }

  /**
   * 开始水位动态升降动画
   */
  startWaterLevelAnimation(): void {
    if (this.riverState.isAnimating) return

    this.riverState.isAnimating = true
    this.riverState.startTime = Date.now()

    const riverPrimitiveObj = this.waterPrimitive as unknown as RiverPrimitiveObject | null
    const riverAttr = riverPrimitiveObj?._riverAttribute
    const style = riverAttr?.style || {}
    const period = (style.waterLevelPeriod ?? 10) * 1000 // 周期，毫秒
    const amplitude = style.waterLevelAmplitude ?? 5 // 振幅

    const animationCallback = () => {
      if (!this.riverState.isAnimating) return

      const elapsed = Date.now() - this.riverState.startTime
      const phase = (elapsed / period) * Math.PI * 2

      // 正弦波动水位
      const waterLevelOffset = Math.sin(phase) * amplitude
      this.riverState.currentWaterLevel = this.riverState.baseWaterLevel + waterLevelOffset

      // 更新材质参数模拟水位变化
      if (this.waterMaterial) {
        // 通过颜色透明度模拟水深
        const depthFactor = (this.riverState.currentWaterLevel / (this.riverState.baseWaterLevel * 2))
        this.waterMaterial.uniforms.fadeFactor = Math.max(0.1, Math.min(0.9, depthFactor))
      }
    }

    this.removeRiverListener = this.viewer!.scene.preRender.addEventListener(animationCallback)
  }

  /**
   * 停止水位动画
   */
  stopWaterLevelAnimation(): void {
    this.riverState.isAnimating = false

    if (this.removeRiverListener) {
      this.removeRiverListener()
      this.removeRiverListener = null
    }
  }

  /**
   * 设置河流宽度
   */
  setRiverWidth(width: number): void {
    const riverPrimitiveObj = this.waterPrimitive as unknown as RiverPrimitiveObject | null
    const riverAttr = riverPrimitiveObj?._riverAttribute
    if (riverAttr?.style) {
      riverAttr.style.width = width
      this.updatePolygonGeometry()
    }
  }

  /**
   * 设置流速
   */
  setFlowVelocity(velocity: number): void {
    if (this.waterMaterial) {
      this.waterMaterial.uniforms.flowSpeed = velocity
    }
  }

  /**
   * 设置流向（角度）
   */
  setFlowDirection(direction: number): void {
    if (this.waterMaterial) {
      this.waterMaterial.uniforms.flowDirection = direction
    }
  }

  /**
   * 添加断面数据
   */
  addCrossSection(section: RiverCrossSection): void {
    this.crossSections.push(section)
  }

  /**
   * 获取断面数据
   */
  getCrossSections(): RiverCrossSection[] {
    return [...this.crossSections]
  }

  /**
   * 获取当前水位
   */
  getCurrentWaterLevel(): number {
    return this.riverState.currentWaterLevel
  }

  /**
   * 清理资源
   */
  override disable(hasWB?: boolean): this {
    this.stopWaterLevelAnimation()
    return super.disable(hasWB)
  }

  override toEntityType(): string {
    return 'river'
  }

  override removePrimitive(): void {
    this.stopWaterLevelAnimation()
    this.crossSections = []
    this.smoothPath = null
    super.removePrimitive()
  }
}
