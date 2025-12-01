import * as Cesium from 'cesium'
import { DrawPrimitiveBase } from './DrawPrimitiveBase'
import type { DrawPrimitiveConfig, ExtendedEntity, AttrClass } from '../types'
import { EditParticle } from '../edit/EditParticle'
import * as AttrParticle from '../attr/AttrParticle'

/**
 * 粒子系统配置接口
 */
export interface ParticleSystemOptions {
  /** 粒子图片路径 */
  image: string
  /** 开始颜色 */
  startColor?: Cesium.Color
  /** 结束颜色 */
  endColor?: Cesium.Color
  /** 开始缩放 */
  startScale?: number
  /** 结束缩放 */
  endScale?: number
  /** 最小粒子生命周期（秒） */
  minimumParticleLife?: number
  /** 最大粒子生命周期（秒） */
  maximumParticleLife?: number
  /** 最小速度 */
  minimumSpeed?: number
  /** 最大速度 */
  maximumSpeed?: number
  /** 粒子大小 */
  particleSize?: number
  /** 发射率（每秒发射的粒子数） */
  emissionRate?: number
  /** 粒子系统生命周期（秒），0表示无限 */
  lifetime?: number
  /** 是否循环 */
  loop?: boolean
  /** 大小单位是否为米 */
  sizeInMeters?: boolean
  /** 发射器类型 */
  emitterType?: 'cone' | 'box' | 'circle' | 'sphere'
  /** 发射器参数（根据类型不同而不同） */
  emitterOptions?: number | Cesium.Cartesian3
  /** 发射器位置偏移 */
  emitterOffset?: Cesium.Cartesian3
  /** 发射器旋转（heading, pitch, roll 度数） */
  emitterRotation?: { heading: number; pitch: number; roll: number }
  /** 更新回调函数（用于实现重力等效果） */
  updateCallback?: (particle: Cesium.Particle, dt: number) => void
}

/**
 * 粒子系统绘制类
 *
 * 支持绘制各种粒子效果，如火焰、水枪、爆炸、喷雾、烟雾等
 */
export class DrawParticle extends DrawPrimitiveBase {
  type = 'particle'

  /** 粒子系统对象 */
  private particleSystem: Cesium.ParticleSystem | null = null

  /** 属性类 */
  override attrClass = AttrParticle as AttrClass

  /** 编辑类 */
  editClass = EditParticle

  /** 粒子系统配置 */
  private particleOptions: ParticleSystemOptions | null = null

  /** 发射器矩阵 */
  private emitterModelMatrix = new Cesium.Matrix4()

  /** 平移向量 */
  private translation = new Cesium.Cartesian3()

  /** 旋转四元数 */
  private rotation = new Cesium.Quaternion()

  /** 航向俯仰滚转 */
  private hpr = new Cesium.HeadingPitchRoll()

  /** 平移旋转缩放 */
  private trs = new Cesium.TranslationRotationScale()

  /** 场景更新事件监听器 */
  private preUpdateListener: ((scene: Cesium.Scene, time: Cesium.JulianDate) => void) | null = null

  constructor(opts: DrawPrimitiveConfig) {
    super(opts)
  }

  /**
   * 创建粒子系统
   */
  protected override createPrimitive(attribute: Record<string, unknown>): Cesium.Primitive | null {
    const style = (attribute.style || {}) as Record<string, unknown>

    // 使用 AttrParticle 转换样式为粒子系统选项
    this.particleOptions = AttrParticle.style2ParticleOptions(style as AttrParticle.ParticleStyleConfig)

    if (!this.particleOptions || !this.particleOptions.image) {
      console.error('缺少粒子系统配置或图片路径')
      return null
    }

    // 创建粒子系统
    const particleSystem = new Cesium.ParticleSystem({
      image: this.particleOptions.image,
      startColor: this.particleOptions.startColor || Cesium.Color.WHITE,
      endColor: this.particleOptions.endColor || Cesium.Color.WHITE.withAlpha(0),
      startScale: this.particleOptions.startScale ?? 0.0,
      endScale: this.particleOptions.endScale ?? 10.0,
      minimumParticleLife: this.particleOptions.minimumParticleLife ?? 1.0,
      maximumParticleLife: this.particleOptions.maximumParticleLife ?? 6.0,
      minimumSpeed: this.particleOptions.minimumSpeed ?? 1.0,
      maximumSpeed: this.particleOptions.maximumSpeed ?? 4.0,
      imageSize: new Cesium.Cartesian2(
        this.particleOptions.particleSize ?? 25.0,
        this.particleOptions.particleSize ?? 25.0
      ),
      emissionRate: this.particleOptions.emissionRate ?? 5.0,
      lifetime: this.particleOptions.lifetime ?? 16.0,
      loop: this.particleOptions.loop ?? true,
      sizeInMeters: this.particleOptions.sizeInMeters ?? true,
      emitter: this.createEmitter(this.particleOptions),
      updateCallback: this.particleOptions.updateCallback
    })

    // 添加到场景
    if (this.primitives) {
      this.primitives.add(particleSystem)
    }

    this.particleSystem = particleSystem
    this.primitive = particleSystem as unknown as Cesium.Primitive

    return particleSystem as unknown as Cesium.Primitive
  }

  /**
   * 创建发射器
   */
  private createEmitter(options: ParticleSystemOptions): Cesium.ParticleEmitter {
    const emitterType = options.emitterType || 'cone'
    const emitterOptions = options.emitterOptions

    switch (emitterType) {
      case 'cone':
        return new Cesium.ConeEmitter(
          typeof emitterOptions === 'number' ? Cesium.Math.toRadians(emitterOptions) : Cesium.Math.toRadians(45.0)
        )
      case 'box':
        return new Cesium.BoxEmitter(
          emitterOptions instanceof Cesium.Cartesian3 ? emitterOptions : new Cesium.Cartesian3(1.0, 1.0, 1.0)
        )
      case 'circle':
        return new Cesium.CircleEmitter(typeof emitterOptions === 'number' ? emitterOptions : 0.5)
      case 'sphere':
        return new Cesium.SphereEmitter(typeof emitterOptions === 'number' ? emitterOptions : 1.0)
      default:
        return new Cesium.ConeEmitter(Cesium.Math.toRadians(45.0))
    }
  }

  /**
   * 绑定事件
   */
  protected override bindEvent(): void {
    this.bindClickEvent((position) => {
      const cartesian = this.viewer.scene.pickPosition(position)
      if (!cartesian) return

      this._positions_draw = cartesian

      // 设置粒子系统的位置
      if (this.particleSystem && this.entity) {
        // 启动时钟动画
        this.viewer.clock.shouldAnimate = true

        // 绑定场景更新事件
        this.bindSceneUpdate()
      }

      this.disable()
    })
  }

  /**
   * 绑定场景更新事件
   */
  private bindSceneUpdate(): void {
    if (!this.particleSystem || !this.entity) return

    this.preUpdateListener = (_scene: Cesium.Scene, time: Cesium.JulianDate) => {
      if (!this.particleSystem || !this.entity) return

      // 更新粒子系统的世界矩阵
      this.particleSystem.modelMatrix = this.computeModelMatrix(this.entity, time)

      // 更新发射器局部矩阵
      this.particleSystem.emitterModelMatrix = this.computeEmitterModelMatrix()
    }

    this.viewer.scene.preUpdate.addEventListener(this.preUpdateListener)
  }

  /**
   * 计算模型矩阵
   */
  private computeModelMatrix(entity: Cesium.Entity, time: Cesium.JulianDate): Cesium.Matrix4 {
    return entity.computeModelMatrix(time, new Cesium.Matrix4())
  }

  /**
   * 计算发射器模型矩阵
   */
  private computeEmitterModelMatrix(): Cesium.Matrix4 {
    const offset = this.particleOptions?.emitterOffset || new Cesium.Cartesian3(-4.0, 0.0, 1.4)
    const rotation = this.particleOptions?.emitterRotation || { heading: 0, pitch: 0, roll: 0 }

    this.hpr = Cesium.HeadingPitchRoll.fromDegrees(rotation.heading, rotation.pitch, rotation.roll, this.hpr)

    this.trs.translation = Cesium.Cartesian3.clone(offset, this.translation)
    this.trs.rotation = Cesium.Quaternion.fromHeadingPitchRoll(this.hpr, this.rotation)

    return Cesium.Matrix4.fromTranslationRotationScale(this.trs, this.emitterModelMatrix)
  }

  /**
   * 创建 Entity（用于定位粒子系统）
   */
  protected override createFeature(attribute: Record<string, unknown>): Cesium.Entity | null {
    // 先创建粒子系统
    this.createPrimitive(attribute)

    // 创建一个不可见的 Entity 用于定位
    const newEntity = this.dataSource!.entities.add({
      position: new Cesium.CallbackProperty(() => {
        return this._positions_draw as Cesium.Cartesian3
      }, false) as unknown as Cesium.PositionProperty
    })

    // 保存属性到 entity (使用类型断言)
    const extEntity = newEntity as unknown as ExtendedEntity
    extEntity.attribute = attribute

    this.entity = newEntity

    return newEntity
  }

  /**
   * 完成绘制
   */
  protected override finishPrimitive(): void {
    // 绑定编辑对象
    if (this.entity && this.editClass) {
      const ext = this.entity as ExtendedEntity
      ext.editing = this.getEditClass(this.entity)
    }
  }

  /**
   * 样式转 Entity
   */
  protected override style2Entity(style: Record<string, unknown>, entity: Cesium.Entity): void {
    // 粒子系统的样式已经在创建时应用，这里主要是更新配置
    const ext = entity as ExtendedEntity
    if (ext.attribute && ext.attribute.style) {
      ext.attribute.style = { ...(ext.attribute.style as Record<string, unknown>), ...style }
    } else if (ext.attribute) {
      ext.attribute.style = style
    }
  }

  /**
   * 移除粒子系统
   */
  remove(): void {
    // 移除场景更新事件
    if (this.preUpdateListener) {
      this.viewer.scene.preUpdate.removeEventListener(this.preUpdateListener)
      this.preUpdateListener = null
    }

    // 移除粒子系统
    if (this.particleSystem && this.primitives) {
      this.primitives.remove(this.particleSystem)
    }

    // 移除 Entity
    if (this.entity && this.dataSource) {
      this.dataSource.entities.remove(this.entity)
    }

    // 清理引用
    this.particleSystem = null
    this.entity = null
    this.particleOptions = null
  }
}
