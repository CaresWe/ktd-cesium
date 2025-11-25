import {
  Cesium3DTileset,
  Cesium3DTileStyle,
  Cesium3DTileFeature,
  Matrix4,
  Matrix3,
  Cartesian3,
  Math as CesiumMath,
  Transforms,
  HeadingPitchRoll,
  Color
} from 'cesium'
import { BasePlugin } from '../../BasePlugin'
import type { KtdViewer } from '@ktd-cesium/core'
import type { EventPlugin } from '../EventPlugin'
import { MonomerManager } from './MonomerManager'
import { StyleManager } from './StyleManager'
import { ClippingPlaneManager } from './ClippingPlaneManager'
import { ClipManager } from './ClipManager'
import { FloodAnalyzer } from './FloodAnalyzer'
import { FlattenManager } from './FlattenManager'
import { HeightAnalyzer } from './HeightAnalyzer'
import { HeatmapManager } from './HeatmapManager'
import { ColorCorrectionManager } from './ColorCorrectionManager'
import { SeismicAnalyzer } from './SeismicAnalyzer'
import type {
  TilesLayerConfig,
  TilesLayerInstance,
  TilesStyleOptions,
  MonomerConfig,
  MonomerInstance,
  MaterialStyleConfig,
  FeatureFilter,
  BatchOperationConfig,
  TilesTransform,
  TilesEditOptions,
  ClippingPlanesConfig,
  ClippingPlaneConfig,
  BoxClipConfig,
  ModelClipConfig,
  FloodAnalysisConfig,
  FlattenConfig,
  HeightLimitConfig,
  HeatmapConfig,
  ColorCorrectionConfig,
  SeismicAnalysisConfig
} from './types'
import type { TransformPlugin } from '../TransformPlugin'

/**
 * 3D Tiles 插件
 * 支持：
 * 1. 各类 3D 模型加载（3D Tiles、glTF、BIM 等）
 * 2. 单体化功能（分层、分户）
 * 3. 样式自定义和材质管理
 * 4. 平面剖切功能（BIM、倾斜摄影）
 * 5. 盒子裁剪和模型裁剪
 * 6. 淹没分析
 * 7. 模型压平
 * 8. 限高分析
 * 9. 热力图
 * 10. 颜色校正
 * 11. 地震分析
 */
export class TilesPlugin extends BasePlugin {
  static readonly pluginName = 'tiles'
  readonly name = 'tiles'

  /** 图层集合 */
  private layers: Map<string, TilesLayerInstance> = new Map()

  /** 图层ID计数器 */
  private layerIdCounter = 0

  /** 单体化ID计数器 */
  private monomerIdCounter = 0

  /** 事件插件引用 */
  private eventPlugin?: EventPlugin

  /** 变换插件引用 */
  private transformPlugin?: TransformPlugin

  /** 点击事件监听器ID */
  private clickListenerId?: string

  /** 悬停事件监听器ID */
  private hoverListenerId?: string

  /** 当前悬停的要素 */
  private currentHoveredFeature: Cesium3DTileFeature | null = null

  /** 当前正在编辑的图层 */
  private editingLayer: TilesLayerInstance | null = null

  protected onInstall(viewer: KtdViewer): void {
    try {
      // 获取插件引用
      this.eventPlugin = viewer.getPlugin('event') as EventPlugin | undefined
      this.transformPlugin = viewer.getPlugin('transform') as TransformPlugin | undefined

      // 注册全局事件
      this.registerGlobalEvents()

      console.log('Tiles plugin installed')
    } catch (error) {
      console.error('Failed to install Tiles plugin:', error)
      throw error
    }
  }

  /**
   * 注册全局事件
   */
  private registerGlobalEvents(): void {
    try {
      if (!this.eventPlugin) return

      // 点击事件
      this.clickListenerId = this.eventPlugin.onLeftClick((info) => {
        this.handleClick(info)
      })

      // 悬停事件
      this.hoverListenerId = this.eventPlugin.onMouseMove((info) => {
        this.handleHover(info)
      })
    } catch (error) {
      console.error('Failed to register global events:', error)
    }
  }

  /**
   * 处理点击事件
   */
  private handleClick(info: { pickedObject?: { primitive?: unknown; id?: unknown } }): void {
    try {
      if (!info.pickedObject) return

      const feature = info.pickedObject as Cesium3DTileFeature
      if (!feature || !feature.tileset) return

      // 查找对应的图层
      for (const layer of this.layers.values()) {
        if (layer.tileset === feature.tileset) {
          // 处理单体化点击
          for (const monomer of layer.monomers.values()) {
            if (monomer.config.enableClick) {
              const propertyValue = feature.getProperty(monomer.config.propertyName)
              if (propertyValue !== undefined) {
                monomer.select(propertyValue)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to handle click:', error)
    }
  }

  /**
   * 处理悬停事件
   */
  private handleHover(info: { pickedObject?: { primitive?: unknown; id?: unknown } }): void {
    try {
      const feature = (info.pickedObject as Cesium3DTileFeature) || null

      // 如果悬停的要素改变
      if (feature !== this.currentHoveredFeature) {
        // 清除之前的高亮
        if (this.currentHoveredFeature) {
          for (const layer of this.layers.values()) {
            if (layer.tileset === this.currentHoveredFeature.tileset) {
              for (const monomer of layer.monomers.values()) {
                if (monomer.config.enableHover) {
                  monomer.clearHighlight()
                }
              }
            }
          }
        }

        // 高亮当前要素
        if (feature && feature.tileset) {
          for (const layer of this.layers.values()) {
            if (layer.tileset === feature.tileset) {
              for (const monomer of layer.monomers.values()) {
                if (monomer.config.enableHover) {
                  const propertyValue = feature.getProperty(monomer.config.propertyName)
                  if (propertyValue !== undefined) {
                    monomer.highlight(propertyValue)
                  }
                }
              }
            }
          }
        }

        this.currentHoveredFeature = feature
      }
    } catch (error) {
      console.error('Failed to handle hover:', error)
    }
  }

  /**
   * 生成图层ID
   */
  private generateLayerId(): string {
    return `tiles_layer_${this.layerIdCounter++}`
  }

  /**
   * 生成单体化ID
   */
  private generateMonomerId(): string {
    return `monomer_${this.monomerIdCounter++}`
  }

  /**
   * 根据变换参数更新 Tileset 模型矩阵
   */
  private updateTilesetMatrix(tileset: Cesium3DTileset, transform: TilesTransform): void {
    try {
      let matrix = Matrix4.IDENTITY.clone()

      // 应用位置偏移（XYZ 局部坐标，不贴球面）
      if (transform.offset.x !== 0 || transform.offset.y !== 0 || transform.offset.z !== 0) {
        const offset = new Cartesian3(transform.offset.x, transform.offset.y, transform.offset.z)
        const translationMatrix = Matrix4.fromTranslation(offset, new Matrix4())
        matrix = Matrix4.multiply(matrix, translationMatrix, matrix)
      }

      // 应用旋转
      if (transform.rotation.heading !== 0 || transform.rotation.pitch !== 0 || transform.rotation.roll !== 0) {
        const hpr = new HeadingPitchRoll(
          CesiumMath.toRadians(transform.rotation.heading),
          CesiumMath.toRadians(transform.rotation.pitch),
          CesiumMath.toRadians(transform.rotation.roll)
        )
        const quaternion = Transforms.headingPitchRollQuaternion(Cartesian3.ZERO, hpr)
        const rotation = Matrix3.fromQuaternion(quaternion, new Matrix3())
        const rotationMatrix = Matrix4.fromRotation(rotation, new Matrix4())
        matrix = Matrix4.multiply(matrix, rotationMatrix, matrix)
      }

      // 应用缩放
      if (transform.scale !== 1) {
        const scaleMatrix = Matrix4.fromUniformScale(transform.scale, new Matrix4())
        matrix = Matrix4.multiply(matrix, scaleMatrix, matrix)
      }

      tileset.modelMatrix = matrix
    } catch (error) {
      console.error('Failed to update tileset matrix:', error)
    }
  }

  /**
   * 计算模型矩阵
   */
  private calculateModelMatrix(config: TilesLayerConfig): Matrix4 | undefined {
    try {
      if (config.modelMatrix) {
        return config.modelMatrix
      }

      let matrix: Matrix4 | undefined

      // 应用高度偏移
      if (config.heightOffset) {
        const offset = new Cartesian3(0, 0, config.heightOffset)
        matrix = Matrix4.fromTranslation(offset, new Matrix4())
      }

      // 应用位置偏移
      if (config.offset) {
        const [x, y, z] = config.offset
        const offset = new Cartesian3(x, y, z)
        const translationMatrix = Matrix4.fromTranslation(offset, new Matrix4())
        matrix = matrix
          ? Matrix4.multiply(matrix, translationMatrix, new Matrix4())
          : translationMatrix
      }

      // 应用旋转
      if (config.rotation) {
        const [heading, pitch, roll] = config.rotation
        const hpr = new HeadingPitchRoll(
          CesiumMath.toRadians(heading),
          CesiumMath.toRadians(pitch),
          CesiumMath.toRadians(roll)
        )
        const quaternion = Transforms.headingPitchRollQuaternion(Cartesian3.ZERO, hpr)
        const rotation = Matrix3.fromQuaternion(quaternion, new Matrix3())
        const rotationMatrix = Matrix4.fromRotation(rotation, new Matrix4())
        matrix = matrix
          ? Matrix4.multiply(matrix, rotationMatrix, new Matrix4())
          : rotationMatrix
      }

      // 应用缩放
      if (config.scale && config.scale !== 1) {
        const scaleMatrix = Matrix4.fromUniformScale(config.scale, new Matrix4())
        matrix = matrix ? Matrix4.multiply(matrix, scaleMatrix, new Matrix4()) : scaleMatrix
      }

      return matrix
    } catch (error) {
      console.error('Failed to calculate model matrix:', error)
      return undefined
    }
  }

  /**
   * 创建图层
   */
  async createLayer(config: TilesLayerConfig): Promise<string> {
    try {
      this.ensureInstalled()

      const id = this.generateLayerId()

      // 创建 Tileset
      const tileset = await Cesium3DTileset.fromUrl(config.url, {
        maximumScreenSpaceError: config.maximumScreenSpaceError ?? 16,
        skipLevelOfDetail: config.skipLevelOfDetail ?? true
      })

      // 应用模型矩阵
      const modelMatrix = this.calculateModelMatrix(config)
      if (modelMatrix) {
        tileset.modelMatrix = modelMatrix
      }

      // 设置阴影
      if (config.shadows !== undefined) {
        tileset.shadows = config.shadows ? 1 : 0
      }

      // 添加到场景
      this.cesiumViewer.scene.primitives.add(tileset)

      // 设置显示状态
      tileset.show = config.show !== false

      // 创建样式管理器
      const styleManager = new StyleManager(tileset)

      // 应用初始样式
      if (config.style) {
        if (config.style instanceof Cesium3DTileStyle) {
          styleManager.setStyle(config.style)
        } else {
          styleManager.applyStyle(config.style)
        }
      }

      // 创建分析管理器
      const clippingManager = new ClippingPlaneManager(tileset)
      const clipManager = new ClipManager(tileset, this.viewer!)
      const floodAnalyzer = new FloodAnalyzer(tileset)
      const flattenManager = new FlattenManager(tileset)
      const heightAnalyzer = new HeightAnalyzer(tileset)
      const heatmapManager = new HeatmapManager(tileset)
      const colorCorrectionManager = new ColorCorrectionManager(tileset)
      const seismicAnalyzer = new SeismicAnalyzer(tileset)

      // 保存原始变换参数
      const originalTransform: TilesTransform = {
        offset: config.offset ? { x: config.offset[0], y: config.offset[1], z: config.offset[2] } : { x: 0, y: 0, z: 0 },
        rotation: config.rotation ? { heading: config.rotation[0], pitch: config.rotation[1], roll: config.rotation[2] } : { heading: 0, pitch: 0, roll: 0 },
        scale: config.scale ?? 1
      }

      // 当前变换参数
      let currentTransform: TilesTransform = { ...originalTransform }
      let editOptions: TilesEditOptions | undefined

      // 创建图层实例
      const layer: TilesLayerInstance = {
        id,
        name: config.name,
        tileset,
        config,
        show: config.show !== false,
        monomers: new Map(),
        isEditing: false,

        setShow: (show: boolean) => {
          layer.show = show
          tileset.show = show
        },

        setStyle: (style: Cesium3DTileStyle | TilesStyleOptions) => {
          if (style instanceof Cesium3DTileStyle) {
            styleManager.setStyle(style)
          } else {
            styleManager.applyStyle(style)
          }
        },

        resetStyle: () => {
          styleManager.reset()
        },

        flyTo: async (duration?: number) => {
          try {
            await this.cesiumViewer.flyTo(tileset, duration ? { duration } : undefined)
          } catch (error) {
            console.error('Failed to fly to tileset:', error)
          }
        },

        zoomTo: async (_duration?: number) => {
          try {
            await this.cesiumViewer.zoomTo(tileset)
          } catch (error) {
            console.error('Failed to zoom to tileset:', error)
          }
        },

        createMonomer: (monomerConfig: MonomerConfig): string => {
          const monomerId = this.generateMonomerId()
          const monomerManager = new MonomerManager(monomerId, tileset, monomerConfig)
          const monomerInstance = monomerManager.createInstance()
          layer.monomers.set(monomerId, monomerInstance)
          return monomerId
        },

        getMonomer: (monomerId: string): MonomerInstance | undefined => {
          return layer.monomers.get(monomerId)
        },

        removeMonomer: (monomerId: string): boolean => {
          const monomer = layer.monomers.get(monomerId)
          if (monomer) {
            monomer.destroy()
            layer.monomers.delete(monomerId)
            return true
          }
          return false
        },

        pick: (windowPosition: { x: number; y: number }): Cesium3DTileFeature | undefined => {
          try {
            const cartesian = new Cartesian3(windowPosition.x, windowPosition.y, 0)
            const picked = this.cesiumViewer.scene.pick(cartesian)
            if (picked && picked instanceof Cesium3DTileFeature && picked.tileset === tileset) {
              return picked
            }
            return undefined
          } catch (error) {
            console.error('Failed to pick feature:', error)
            return undefined
          }
        },

        getAllFeatures: (): Cesium3DTileFeature[] => {
          try {
            const features: Cesium3DTileFeature[] = []
            const length = tileset.root?.content?.featuresLength ?? 0

            for (let i = 0; i < length; i++) {
              const feature = tileset.root.content.getFeature(i)
              if (feature) {
                features.push(feature)
              }
            }

            return features
          } catch (error) {
            console.error('Failed to get all features:', error)
            return []
          }
        },

        getFeaturesByProperty: (
          propertyName: string,
          value: string | number
        ): Cesium3DTileFeature[] => {
          try {
            const allFeatures = layer.getAllFeatures()
            return allFeatures.filter((feature) => {
              const propValue = feature.getProperty(propertyName)
              return propValue === value
            })
          } catch (error) {
            console.error('Failed to get features by property:', error)
            return []
          }
        },

        enableEdit: (options?: TilesEditOptions) => {
          try {
            if (layer.isEditing) {
              console.warn('Layer is already in edit mode')
              return
            }

            editOptions = options
            layer.isEditing = true
            this.editingLayer = layer

            // 触发变换开始回调
            if (editOptions?.onTransformStart) {
              editOptions.onTransformStart(currentTransform)
            }

            console.log(`Edit mode enabled for layer: ${layer.name}`)
          } catch (error) {
            console.error('Failed to enable edit mode:', error)
          }
        },

        disableEdit: () => {
          try {
            if (!layer.isEditing) return

            layer.isEditing = false
            if (this.editingLayer === layer) {
              this.editingLayer = null
            }

            // 触发变换结束回调
            if (editOptions?.onTransformEnd) {
              editOptions.onTransformEnd(currentTransform)
            }

            editOptions = undefined
            console.log(`Edit mode disabled for layer: ${layer.name}`)
          } catch (error) {
            console.error('Failed to disable edit mode:', error)
          }
        },

        updatePosition: (offset: { x?: number; y?: number; z?: number }) => {
          try {
            // 更新偏移量（局部坐标系，不贴球面）
            if (offset.x !== undefined) currentTransform.offset.x = offset.x
            if (offset.y !== undefined) currentTransform.offset.y = offset.y
            if (offset.z !== undefined) currentTransform.offset.z = offset.z

            // 重新计算模型矩阵
            this.updateTilesetMatrix(tileset, currentTransform)

            // 触发变换中回调
            if (layer.isEditing && editOptions?.onTransforming) {
              editOptions.onTransforming(currentTransform)
            }
          } catch (error) {
            console.error('Failed to update position:', error)
          }
        },

        updateRotation: (rotation: { heading?: number; pitch?: number; roll?: number }) => {
          try {
            // 更新旋转角度（度）
            if (rotation.heading !== undefined) currentTransform.rotation.heading = rotation.heading
            if (rotation.pitch !== undefined) currentTransform.rotation.pitch = rotation.pitch
            if (rotation.roll !== undefined) currentTransform.rotation.roll = rotation.roll

            // 重新计算模型矩阵
            this.updateTilesetMatrix(tileset, currentTransform)

            // 触发变换中回调
            if (layer.isEditing && editOptions?.onTransforming) {
              editOptions.onTransforming(currentTransform)
            }
          } catch (error) {
            console.error('Failed to update rotation:', error)
          }
        },

        updateScale: (scale: number) => {
          try {
            currentTransform.scale = scale

            // 重新计算模型矩阵
            this.updateTilesetMatrix(tileset, currentTransform)

            // 触发变换中回调
            if (layer.isEditing && editOptions?.onTransforming) {
              editOptions.onTransforming(currentTransform)
            }
          } catch (error) {
            console.error('Failed to update scale:', error)
          }
        },

        getTransform: (): TilesTransform => {
          return { ...currentTransform }
        },

        setTransform: (transform: Partial<TilesTransform>) => {
          try {
            // 更新变换参数
            if (transform.offset) {
              currentTransform.offset = { ...currentTransform.offset, ...transform.offset }
            }
            if (transform.rotation) {
              currentTransform.rotation = { ...currentTransform.rotation, ...transform.rotation }
            }
            if (transform.scale !== undefined) {
              currentTransform.scale = transform.scale
            }

            // 重新计算模型矩阵
            this.updateTilesetMatrix(tileset, currentTransform)

            // 触发变换中回调
            if (layer.isEditing && editOptions?.onTransforming) {
              editOptions.onTransforming(currentTransform)
            }
          } catch (error) {
            console.error('Failed to set transform:', error)
          }
        },

        resetTransform: () => {
          try {
            currentTransform = { ...originalTransform }
            this.updateTilesetMatrix(tileset, currentTransform)

            // 触发变换中回调
            if (layer.isEditing && editOptions?.onTransforming) {
              editOptions.onTransforming(currentTransform)
            }
          } catch (error) {
            console.error('Failed to reset transform:', error)
          }
        },

        // ========== 剖切功能 ==========
        enableClipping: (clippingConfig: ClippingPlanesConfig) => {
          clippingManager.enable(clippingConfig)
        },

        updateClipping: (clippingConfig: Partial<ClippingPlanesConfig>) => {
          clippingManager.update(clippingConfig)
        },

        disableClipping: () => {
          clippingManager.disable()
        },

        addClippingPlane: (plane: ClippingPlaneConfig) => {
          clippingManager.addPlane(plane)
        },

        removeClippingPlane: (index: number) => {
          clippingManager.removePlane(index)
        },

        // ========== 裁剪功能 ==========
        enableBoxClip: (boxConfig: BoxClipConfig) => {
          clipManager.enableBoxClip(boxConfig)
        },

        updateBoxClip: (boxConfig: Partial<BoxClipConfig>) => {
          clipManager.updateBoxClip(boxConfig)
        },

        disableBoxClip: () => {
          clipManager.disableBoxClip()
        },

        enableModelClip: (modelConfig: ModelClipConfig) => {
          clipManager.enableModelClip(modelConfig)
        },

        disableModelClip: () => {
          clipManager.disableModelClip()
        },

        // ========== 淹没分析 ==========
        enableFloodAnalysis: (floodConfig: FloodAnalysisConfig) => {
          floodAnalyzer.enable(floodConfig)
        },

        updateFloodHeight: (height: number) => {
          floodAnalyzer.updateHeight(height)
        },

        startFloodAnimation: () => {
          floodAnalyzer.startAnimation()
        },

        stopFloodAnimation: () => {
          floodAnalyzer.stopAnimation()
        },

        disableFloodAnalysis: () => {
          floodAnalyzer.disable()
        },

        // ========== 压平功能 ==========
        enableFlatten: (flattenConfig: FlattenConfig) => {
          flattenManager.enable(flattenConfig)
        },

        updateFlattenHeight: (height: number) => {
          flattenManager.updateHeight(height)
        },

        disableFlatten: () => {
          flattenManager.disable()
        },

        // ========== 限高分析 ==========
        enableHeightLimit: (heightConfig: HeightLimitConfig) => {
          heightAnalyzer.enable(heightConfig)
        },

        updateHeightLimit: (height: number) => {
          heightAnalyzer.updateLimit(height)
        },

        disableHeightLimit: () => {
          heightAnalyzer.disable()
        },

        // ========== 热力图 ==========
        enableHeatmap: (heatmapConfig: HeatmapConfig) => {
          heatmapManager.enable(heatmapConfig)
        },

        updateHeatmapData: (dataPoints: HeatmapConfig['dataPoints']) => {
          heatmapManager.updateData(dataPoints)
        },

        disableHeatmap: () => {
          heatmapManager.disable()
        },

        // ========== 颜色校正 ==========
        enableColorCorrection: (colorConfig: ColorCorrectionConfig) => {
          colorCorrectionManager.enable(colorConfig)
        },

        updateColorCorrection: (colorConfig: Partial<ColorCorrectionConfig>) => {
          colorCorrectionManager.update(colorConfig)
        },

        disableColorCorrection: () => {
          colorCorrectionManager.disable()
        },

        // ========== 地震分析 ==========
        enableSeismicAnalysis: (seismicConfig: SeismicAnalysisConfig) => {
          seismicAnalyzer.enable(seismicConfig)
        },

        startSeismicAnimation: () => {
          seismicAnalyzer.startAnimation()
        },

        stopSeismicAnimation: () => {
          seismicAnalyzer.stopAnimation()
        },

        disableSeismicAnalysis: () => {
          seismicAnalyzer.disable()
        },

        destroy: () => {
          // 先禁用编辑模式
          if (layer.isEditing) {
            layer.disableEdit()
          }

          // 销毁所有分析管理器
          clippingManager.destroy()
          clipManager.destroy()
          floodAnalyzer.destroy()
          flattenManager.destroy()
          heightAnalyzer.destroy()
          heatmapManager.destroy()
          colorCorrectionManager.destroy()
          seismicAnalyzer.destroy()

          this.removeLayer(id)
        }
      }

      this.layers.set(id, layer)

      // 等待瓦片集加载完成
      // readyPromise 在 Cesium 运行时存在，但类型定义中可能缺失
      const tilesetWithPromise = tileset as typeof tileset & { readyPromise?: Promise<Cesium3DTileset> }

      if (tilesetWithPromise.readyPromise) {
        tilesetWithPromise.readyPromise
          .then(() => {
            if (config.onLoad) {
              config.onLoad(tileset)
            }
          })
          .catch((error: Error) => {
            console.error('Tileset load error:', error)
            if (config.onError) {
              config.onError(error)
            }
          })
      } else if (config.onLoad) {
        // 如果没有 readyPromise，立即调用回调
        config.onLoad(tileset)
      }

      return id
    } catch (error) {
      console.error('Failed to create layer:', error)
      if (config.onError) {
        config.onError(error as Error)
      }
      throw error
    }
  }

  /**
   * 获取图层
   */
  getLayer(id: string): TilesLayerInstance | undefined {
    return this.layers.get(id)
  }

  /**
   * 根据名称获取图层
   */
  getLayerByName(name: string): TilesLayerInstance | undefined {
    try {
      return Array.from(this.layers.values()).find((layer) => layer.name === name)
    } catch (error) {
      console.error('Failed to get layer by name:', error)
      return undefined
    }
  }

  /**
   * 移除图层
   */
  removeLayer(id: string): boolean {
    try {
      const layer = this.layers.get(id)
      if (!layer) return false

      // 销毁所有单体化
      layer.monomers.forEach((monomer) => monomer.destroy())
      layer.monomers.clear()

      // 移除瓦片集
      this.cesiumViewer.scene.primitives.remove(layer.tileset)

      this.layers.delete(id)
      return true
    } catch (error) {
      console.error('Failed to remove layer:', error)
      return false
    }
  }

  /**
   * 移除所有图层
   */
  removeAllLayers(): void {
    try {
      const ids = Array.from(this.layers.keys())
      ids.forEach((id) => this.removeLayer(id))
    } catch (error) {
      console.error('Failed to remove all layers:', error)
    }
  }

  /**
   * 批量操作要素
   */
  batchOperation(layerId: string, operation: BatchOperationConfig): void {
    try {
      const layer = this.getLayer(layerId)
      if (!layer) {
        throw new Error(`Layer ${layerId} not found`)
      }

      const features = layer.getAllFeatures()
      const matchedFeatures = features.filter((feature) =>
        this.matchFilters(feature, operation.filters)
      )

      switch (operation.operation) {
        case 'show':
          matchedFeatures.forEach((feature) => {
            feature.show = operation.value !== false
          })
          break

        case 'hide':
          matchedFeatures.forEach((feature) => {
            feature.show = false
          })
          break

        case 'color':
          if (operation.value instanceof Color) {
            matchedFeatures.forEach((feature) => {
              feature.color = operation.value as Color
            })
          }
          break

        case 'style':
          // 样式操作需要通过 Cesium3DTileStyle
          console.warn('Batch style operation not yet implemented')
          break
      }
    } catch (error) {
      console.error('Failed to batch operation:', error)
      throw error
    }
  }

  /**
   * 检查要素是否匹配过滤条件
   */
  private matchFilters(feature: Cesium3DTileFeature, filters: FeatureFilter[]): boolean {
    try {
      return filters.every((filter) => {
        const value = feature.getProperty(filter.propertyName)

        switch (filter.operator) {
          case '=':
            return value === filter.value
          case '!=':
            return value !== filter.value
          case '>':
            return value > filter.value
          case '<':
            return value < filter.value
          case '>=':
            return value >= filter.value
          case '<=':
            return value <= filter.value
          case 'in':
            return Array.isArray(filter.value) && filter.value.includes(value)
          case 'notIn':
            return Array.isArray(filter.value) && !filter.value.includes(value)
          case 'contains':
            return typeof value === 'string' && value.includes(filter.value as string)
          default:
            return false
        }
      })
    } catch (error) {
      console.error('Failed to match filters:', error)
      return false
    }
  }

  /**
   * 应用材质样式到图层
   */
  applyMaterialStyle(layerId: string, config: MaterialStyleConfig): void {
    try {
      const layer = this.getLayer(layerId)
      if (!layer) {
        throw new Error(`Layer ${layerId} not found`)
      }

      const styleManager = new StyleManager(layer.tileset)
      styleManager.applyMaterialStyle(config)
    } catch (error) {
      console.error('Failed to apply material style:', error)
      throw error
    }
  }

  /**
   * 获取所有图层ID
   */
  getAllLayerIds(): string[] {
    return Array.from(this.layers.keys())
  }

  /**
   * 获取图层数量
   */
  getLayerCount(): number {
    return this.layers.size
  }

  protected onDestroy(): void {
    try {
      // 移除所有图层
      this.removeAllLayers()

      // 移除事件监听
      if (this.clickListenerId && this.eventPlugin) {
        this.eventPlugin.off(this.clickListenerId)
      }

      if (this.hoverListenerId && this.eventPlugin) {
        this.eventPlugin.off(this.hoverListenerId)
      }

      console.log('Tiles plugin destroyed')
    } catch (error) {
      console.error('Failed to destroy Tiles plugin:', error)
    }
  }
}

// 导出类型
export * from './types'
