import {
  CustomDataSource,
  PrimitiveCollection,
  Cartesian3,
  Color,
  BillboardGraphics,
  LabelGraphics,
  Cartesian2,
  PointPrimitive,
  PointPrimitiveCollection,
  BoundingSphere,
  PolylineGraphics,
  PolygonGraphics,
  ModelGraphics,
  EllipseGraphics,
  RectangleGraphics,
  CorridorGraphics,
  WallGraphics,
  CylinderGraphics,
  BoxGraphics,
  Rectangle,
  CornerType,
  HeightReference,
  SceneTransforms,
  LabelCollection,
  HorizontalOrigin,
  VerticalOrigin,
  LabelStyle
} from 'cesium'
import { BasePlugin } from '../../BasePlugin'
import type { KtdViewer } from '@ktd-cesium/core'
import type { EventPlugin } from '../EventPlugin'
import type { PopupPlugin } from '../PopupPlugin'
import { PopupAlignment } from '../PopupPlugin/types'
import type {
  DataLayerConfig,
  DataLayerInstance,
  DataItem,
  PositionType,
  PositionsType,
  ClusterConfig,
  PopupConfig,
  DataMappingConfig
} from './types'
import type { PickInfo } from '../EventPlugin/types'

/**
 * 数据图层管理插件
 * 支持 Entity 和 Primitive 两种数据渲染方式
 * 支持聚合、点击事件、弹窗等功能
 */
export class DataLayerPlugin extends BasePlugin {
  static readonly pluginName = 'dataLayer'
  readonly name = 'dataLayer'

  /** 图层集合 */
  private layers: Map<string, DataLayerInstance> = new Map()

  /** 图层ID计数器 */
  private layerIdCounter = 0

  /** 事件插件引用 */
  private eventPlugin?: EventPlugin

  /** 弹窗插件引用 */
  private popupPlugin?: PopupPlugin

  /** 点击事件监听器ID */
  private clickListenerId?: string

  /** Primitive 聚合管理 */
  private primitiveClusterListeners: Map<string, () => void> = new Map()

  protected onInstall(viewer: KtdViewer): void {
    try {
      // 获取事件插件和弹窗插件引用
      this.eventPlugin = viewer.getPlugin('event') as EventPlugin | undefined
      this.popupPlugin = viewer.getPlugin('popup') as PopupPlugin | undefined

      // 注册全局点击事件
      if (this.eventPlugin) {
        this.clickListenerId = this.eventPlugin.onLeftClick((info) => {
          this.handleLayerClick(info)
        })
      }
    } catch (error) {
      console.error('Failed to install DataLayer plugin:', error)
      throw error
    }
  }

  /**
   * 生成唯一的图层ID
   */
  private generateLayerId(): string {
    return `layer_${this.layerIdCounter++}`
  }

  /**
   * 处理图层点击事件
   */
  private handleLayerClick(info: PickInfo): void {
    try {
      if (!info.pickedObject) return

      // 查找被点击的数据项
      for (const layer of this.layers.values()) {
        if (!layer.show) continue

        // Entity 模式
        if (layer.type === 'entity' && layer.dataSource) {
          const entity = info.pickedObject.id
          if (entity && layer.dataMap.has(entity.id)) {
            const dataItem = layer.dataMap.get(entity.id)!
            this.handleItemClick(layer, dataItem, info)
            return
          }
        }

        // Primitive 模式
        if (layer.type === 'primitive') {
          const primitive = info.pickedObject.primitive
          if (primitive && primitive.id && layer.dataMap.has(primitive.id)) {
            const dataItem = layer.dataMap.get(primitive.id)!
            this.handleItemClick(layer, dataItem, info)
            return
          }
        }
      }
    } catch (error) {
      console.error('Failed to handle layer click:', error)
    }
  }

  /**
   * 处理数据项点击
   */
  private async handleItemClick(layer: DataLayerInstance, item: DataItem, info: PickInfo): Promise<void> {
    try {
      // 触发自定义点击回调
      if (layer.config.onClick) {
        layer.config.onClick(item, info)
      }

      // 显示弹窗
      const shouldShowPopup = layer.config.showPopup || layer.config.popup?.enabled
      if (shouldShowPopup && this.popupPlugin && item.position) {
        const position = this.normalizePosition(item.position)
        await this.createAndShowPopup(layer, item, position)
      }
    } catch (error) {
      console.error('Failed to handle item click:', error)
    }
  }

  /**
   * 创建并显示弹窗
   */
  private async createAndShowPopup(layer: DataLayerInstance, item: DataItem, position: Cartesian3): Promise<void> {
    try {
      const popupOptions = {
        alignment: PopupAlignment.TOP_CENTER,
        offset: [0, -30] as [number, number],
        closeOnClickOutside: true
      }

      // 优先使用 Vue 组件
      if (layer.config.popup?.vueComponent) {
        const vueConfig = layer.config.popup.vueComponent(item)
        await this.popupPlugin!.createVue(vueConfig, position, popupOptions)
        return
      }

      // 其次使用 React 组件
      if (layer.config.popup?.reactComponent) {
        const reactConfig = layer.config.popup.reactComponent(item)
        await this.popupPlugin!.createReact(reactConfig, position, popupOptions)
        return
      }

      // 最后使用 HTML 内容
      const content = this.createPopupContent(layer, item)
      await this.popupPlugin!.createHTML(content, position, popupOptions)
    } catch (error) {
      console.error('Failed to create and show popup:', error)
      throw error
    }
  }

  /**
   * 创建弹窗内容
   */
  private createPopupContent(layer: DataLayerInstance, item: DataItem): string | HTMLElement {
    try {
      // 优先使用新的 popup.content 配置
      if (layer.config.popup?.content) {
        return layer.config.popup.content(item)
      }

      // 兼容旧的 popupContent 配置
      if (layer.config.popupContent) {
        return layer.config.popupContent(item)
      }

      // 使用字段配置生成弹窗
      if (layer.config.popup?.fields) {
        return this.createFieldBasedPopup(layer.config.popup, item)
      }

      // 默认弹窗
      return this.createDefaultPopupContent(item)
    } catch (error) {
      console.error('Failed to create popup content:', error)
      // 返回错误提示作为备用内容
      return `<div style="padding: 15px; background: white; border-radius: 8px; color: red;">弹窗内容生成失败</div>`
    }
  }

  /**
   * 创建基于字段配置的弹窗
   */
  private createFieldBasedPopup(config: PopupConfig, item: DataItem): string {
    try {
      const style = config.style || {}
      const title = typeof config.title === 'function' ? config.title(item) : config.title || '数据详情'

      const rows = config
        .fields!.filter((field) => field.show !== false)
        .map((field) => {
          try {
            const value = this.getFieldValue(item.data, field.field)
            const displayValue = field.formatter ? field.formatter(value, item) : String(value ?? '-')
            const label = field.label || field.field

            return `
        <tr>
          <td style="padding: 4px 8px; font-weight: 500; color: #666; white-space: nowrap;">${label}:</td>
          <td style="padding: 4px 8px; color: #333;">${displayValue}</td>
        </tr>
      `
          } catch (error) {
            console.error(`Failed to format field ${field.field}:`, error)
            return `
        <tr>
          <td style="padding: 4px 8px; font-weight: 500; color: #666; white-space: nowrap;">${field.label || field.field}:</td>
          <td style="padding: 4px 8px; color: #999;">-</td>
        </tr>
      `
          }
        })
        .join('')

      return `
      <div style="
        padding: ${style.padding || '15px'};
        background: ${style.backgroundColor || 'white'};
        border-radius: ${style.borderRadius || '8px'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        min-width: ${style.width || '250px'};
        max-height: ${style.maxHeight || '400px'};
        overflow-y: auto;
      ">
        <h3 style="margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #eee; color: #333; font-size: 16px;">
          ${title}
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${rows}
        </table>
      </div>
    `
    } catch (error) {
      console.error('Failed to create field-based popup:', error)
      return `<div style="padding: 15px; background: white; border-radius: 8px; color: red;">字段弹窗生成失败</div>`
    }
  }

  /**
   * 创建默认弹窗内容
   */
  private createDefaultPopupContent(item: DataItem): string {
    try {
      const data = item.data || {}

      // 如果 data 是对象，显示所有字段
      if (typeof data === 'object' && !Array.isArray(data)) {
        const rows = Object.entries(data)
          .map(([key, value]) => {
            try {
              return `
        <tr>
          <td style="padding: 4px 8px; font-weight: 500; color: #666;">${key}:</td>
          <td style="padding: 4px 8px; color: #333;">${String(value)}</td>
        </tr>
      `
            } catch (error) {
              return `
        <tr>
          <td style="padding: 4px 8px; font-weight: 500; color: #666;">${key}:</td>
          <td style="padding: 4px 8px; color: #999;">-</td>
        </tr>
      `
            }
          })
          .join('')

        return `
        <div style="padding: 15px; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); min-width: 250px;">
          <h3 style="margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #eee; color: #333; font-size: 16px;">数据详情</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${rows}
          </table>
        </div>
      `
      }

      // 如果 data 是其他类型，直接显示
      return `
      <div style="padding: 15px; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); min-width: 200px;">
        <h3 style="margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #eee; color: #333; font-size: 16px;">数据详情</h3>
        <pre style="margin: 0; white-space: pre-wrap; word-break: break-all;">${JSON.stringify(data, null, 2)}</pre>
      </div>
    `
    } catch (error) {
      console.error('Failed to create default popup content:', error)
      return `<div style="padding: 15px; background: white; border-radius: 8px; color: red;">默认弹窗生成失败</div>`
    }
  }

  /**
   * 获取嵌套字段值
   * @param obj 数据对象
   * @param path 字段路径，支持点号分隔，如 'user.name'
   */
  private getFieldValue(obj: unknown, path: string): unknown {
    try {
      if (!obj || !path) return undefined

      const keys = path.split('.')
      let value: unknown = obj

      for (const key of keys) {
        if (value === null || value === undefined) {
          return undefined
        }
        value = (value as Record<string, unknown>)[key]
      }

      return value
    } catch (error) {
      console.error(`Failed to get field value for path '${path}':`, error)
      return undefined
    }
  }

  /**
   * 标准化位置坐标
   */
  private normalizePosition(position?: PositionType): Cartesian3 {
    try {
      if (!position) {
        return Cartesian3.ZERO
      }
      if (Array.isArray(position)) {
        const [lon, lat, height = 0] = position
        return Cartesian3.fromDegrees(lon, lat, height)
      }
      return position
    } catch (error) {
      console.error('Failed to normalize position:', error, position)
      return Cartesian3.ZERO
    }
  }

  /**
   * 标准化多点位置
   */
  private normalizePositions(positions?: PositionsType): Cartesian3[] {
    try {
      if (!positions || positions.length === 0) {
        return []
      }
      if (positions[0] instanceof Cartesian3) {
        return positions as Cartesian3[]
      }
      return (positions as Array<[number, number, number?]>).map(([lon, lat, height = 0]) =>
        Cartesian3.fromDegrees(lon, lat, height)
      )
    } catch (error) {
      console.error('Failed to normalize positions:', error, positions)
      return []
    }
  }

  /**
   * 创建 Entity 图层
   */
  private createEntityLayer(config: DataLayerConfig): DataLayerInstance {
    try {
      this.ensureInstalled()

      const id = this.generateLayerId()
      const dataSource = new CustomDataSource(config.name)

      // 配置聚合
      if (config.clustering?.enabled) {
        this.setupClustering(dataSource, config.clustering)
      }

      // 添加数据源到场景
      this.cesiumViewer.dataSources.add(dataSource)

      const layer: DataLayerInstance = {
        id,
        name: config.name,
        type: 'entity',
        config,
        dataSource,
        entities: dataSource.entities,
        dataMap: new Map(),
        show: config.show !== false,
        setShow: (show: boolean) => {
          layer.show = show
          dataSource.show = show
        },
        addItem: (item: DataItem) => {
          this.addEntityItem(layer, item)
        },
        addItems: (items: DataItem[]) => {
          items.forEach((item) => this.addEntityItem(layer, item))
        },
        removeItem: (itemId: string | number) => {
          this.removeEntityItem(layer, itemId)
        },
        clear: () => {
          dataSource.entities.removeAll()
          layer.dataMap.clear()
        },
        getItem: (itemId: string | number) => {
          return layer.dataMap.get(itemId)
        },
        updateItem: (itemId: string | number, updates: Partial<DataItem>) => {
          this.updateEntityItem(layer, itemId, updates)
        },
        flyTo: async (duration?: number) => {
          try {
            await this.cesiumViewer.flyTo(dataSource, { duration })
          } catch (error) {
            console.error('Failed to fly to entity layer:', error)
          }
        },
        destroy: () => {
          this.removeLayer(id)
        }
      }

      return layer
    } catch (error) {
      console.error('Failed to create entity layer:', error)
      throw error
    }
  }

  /**
   * 创建 Primitive 图层
   */
  private createPrimitiveLayer(config: DataLayerConfig): DataLayerInstance {
    try {
      this.ensureInstalled()

      const id = this.generateLayerId()
      const primitives = new PrimitiveCollection()
      const pointCollection = new PointPrimitiveCollection()

      // 聚合点集合和标签集合
      const clusterPointCollection = new PointPrimitiveCollection()
      const clusterLabelCollection = new LabelCollection()

      primitives.add(pointCollection)
      primitives.add(clusterPointCollection)
      primitives.add(clusterLabelCollection)
      this.cesiumViewer.scene.primitives.add(primitives)

      const layer: DataLayerInstance = {
        id,
        name: config.name,
        type: 'primitive',
        config,
        primitives,
        dataMap: new Map(),
        show: config.show !== false,
        setShow: (show: boolean) => {
          layer.show = show
          primitives.show = show
        },
        addItem: (item: DataItem) => {
          this.addPrimitiveItem(layer, item, pointCollection)
          if (config.clustering?.enabled) {
            this.updatePrimitiveClustering(layer, pointCollection, clusterPointCollection, clusterLabelCollection)
          }
        },
        addItems: (items: DataItem[]) => {
          items.forEach((item) => this.addPrimitiveItem(layer, item, pointCollection))
          if (config.clustering?.enabled) {
            this.updatePrimitiveClustering(layer, pointCollection, clusterPointCollection, clusterLabelCollection)
          }
        },
        removeItem: (itemId: string | number) => {
          this.removePrimitiveItem(layer, itemId, pointCollection)
          if (config.clustering?.enabled) {
            this.updatePrimitiveClustering(layer, pointCollection, clusterPointCollection, clusterLabelCollection)
          }
        },
        clear: () => {
          pointCollection.removeAll()
          clusterPointCollection.removeAll()
          clusterLabelCollection.removeAll()
          layer.dataMap.clear()
        },
        getItem: (itemId: string | number) => {
          return layer.dataMap.get(itemId)
        },
        updateItem: (itemId: string | number, updates: Partial<DataItem>) => {
          this.updatePrimitiveItem(layer, itemId, updates, pointCollection)
          if (config.clustering?.enabled) {
            this.updatePrimitiveClustering(layer, pointCollection, clusterPointCollection, clusterLabelCollection)
          }
        },
        flyTo: async (duration?: number) => {
          try {
            const positions = Array.from(layer.dataMap.values()).map((item) => this.normalizePosition(item.position))
            if (positions.length > 0) {
              const boundingSphere = BoundingSphere.fromPoints(positions)
              await this.cesiumViewer.camera.flyToBoundingSphere(boundingSphere, { duration })
            }
          } catch (error) {
            console.error('Failed to fly to primitive layer:', error)
          }
        },
        destroy: () => {
          this.removeLayer(id)
        }
      }

      // 设置聚合
      if (config.clustering?.enabled) {
        this.setupPrimitiveClustering(layer, pointCollection, clusterPointCollection, clusterLabelCollection)
      }

      return layer
    } catch (error) {
      console.error('Failed to create primitive layer:', error)
      throw error
    }
  }

  /**
   * 设置 Primitive 聚合
   */
  private setupPrimitiveClustering(
    layer: DataLayerInstance,
    pointCollection: PointPrimitiveCollection,
    clusterPointCollection: PointPrimitiveCollection,
    clusterLabelCollection: LabelCollection
  ): void {
    try {
      // 监听相机移动事件，更新聚合
      const updateClustering = () => {
        this.updatePrimitiveClustering(layer, pointCollection, clusterPointCollection, clusterLabelCollection)
      }

      // 监听相机移动结束
      this.cesiumViewer.camera.moveEnd.addEventListener(updateClustering)

      // 保存监听器以便清理
      this.primitiveClusterListeners.set(layer.id, () => {
        this.cesiumViewer.camera.moveEnd.removeEventListener(updateClustering)
      })

      // 初始聚合
      this.updatePrimitiveClustering(layer, pointCollection, clusterPointCollection, clusterLabelCollection)
    } catch (error) {
      console.error('Failed to setup primitive clustering:', error)
    }
  }

  /**
   * 更新 Primitive 聚合
   */
  private updatePrimitiveClustering(
    layer: DataLayerInstance,
    pointCollection: PointPrimitiveCollection,
    clusterPointCollection: PointPrimitiveCollection,
    clusterLabelCollection: LabelCollection
  ): void {
    try {
      const config = layer.config.clustering!
      const pixelRange = config.pixelRange || 80
      const minimumClusterSize = config.minimumClusterSize || 3

      // 清空聚合点和标签
      clusterPointCollection.removeAll()
      clusterLabelCollection.removeAll()

      if (pointCollection.length === 0) return

      // 计算所有点的屏幕坐标
      const points: Array<{
        primitive: PointPrimitive
        screenPos: Cartesian2 | undefined
        clustered: boolean
      }> = []

      for (let i = 0; i < pointCollection.length; i++) {
        const point = pointCollection.get(i)
        if (!point.show) continue

        const screenPos = SceneTransforms.worldToWindowCoordinates(this.cesiumViewer.scene, point.position)
        points.push({ primitive: point, screenPos, clustered: false })
      }

      // 聚合算法
      const clusters: Array<{
        points: Array<{ primitive: PointPrimitive; screenPos: Cartesian2 }>
        center: Cartesian2
      }> = []

      for (let i = 0; i < points.length; i++) {
        if (points[i].clustered || !points[i].screenPos) continue

        const cluster = {
          points: [{ primitive: points[i].primitive, screenPos: points[i].screenPos! }],
          center: points[i].screenPos!.clone()
        }

        // 查找附近的点
        for (let j = i + 1; j < points.length; j++) {
          if (points[j].clustered || !points[j].screenPos) continue

          const distance = Cartesian2.distance(points[i].screenPos!, points[j].screenPos!)
          if (distance < pixelRange) {
            cluster.points.push({ primitive: points[j].primitive, screenPos: points[j].screenPos! })
            points[j].clustered = true
          }
        }

        points[i].clustered = true

        // 如果聚合数量达到最小值，创建聚合点
        if (cluster.points.length >= minimumClusterSize) {
          // 计算聚合中心
          let sumX = 0
          let sumY = 0
          let sumZ = 0
          for (const p of cluster.points) {
            sumX += p.primitive.position.x
            sumY += p.primitive.position.y
            sumZ += p.primitive.position.z
            // 隐藏原始点
            p.primitive.show = false
          }
          const centerPosition = new Cartesian3(
            sumX / cluster.points.length,
            sumY / cluster.points.length,
            sumZ / cluster.points.length
          )

          // 创建聚合点
          const clusterPoint = clusterPointCollection.add({
            position: centerPosition,
            pixelSize: 30,
            color: Color.BLUE.withAlpha(0.8),
            outlineColor: Color.WHITE,
            outlineWidth: 2,
            show: true
          })

          // 创建聚合标签
          if (config.showLabels !== false) {
            const labelText = config.clusterStyle
              ? config.clusterStyle(
                  cluster.points.map((p) => p.primitive as unknown as Cesium.Entity),
                  clusterPoint as unknown as Cesium.Billboard
                )?.label || `${cluster.points.length}`
              : `${cluster.points.length}`

            clusterLabelCollection.add({
              position: centerPosition,
              text: labelText,
              font: '14px sans-serif',
              fillColor: Color.WHITE,
              outlineColor: Color.BLACK,
              outlineWidth: 2,
              style: LabelStyle.FILL_AND_OUTLINE,
              horizontalOrigin: HorizontalOrigin.CENTER,
              verticalOrigin: VerticalOrigin.CENTER,
              show: true
            })
          }

          clusters.push(cluster)
        } else {
          // 数量不足，显示原始点
          for (const p of cluster.points) {
            p.primitive.show = true
          }
        }
      }
    } catch (error) {
      console.error('Failed to update primitive clustering:', error)
    }
  }

  /**
   * 设置聚合配置
   */
  private setupClustering(dataSource: CustomDataSource, config: ClusterConfig): void {
    try {
      dataSource.clustering.enabled = true
      dataSource.clustering.pixelRange = config.pixelRange || 80
      dataSource.clustering.minimumClusterSize = config.minimumClusterSize || 3

      // 自定义聚合样式
      if (config.clusterStyle) {
        dataSource.clustering.clusterEvent.addEventListener(
          (
            clusteredEntities: Cesium.Entity[],
            cluster: { billboard: Cesium.Billboard; label: Cesium.Label; point: Cesium.PointGraphics }
          ) => {
            try {
              const style = config.clusterStyle!(clusteredEntities, cluster)

              cluster.label.show = config.showLabels !== false
              cluster.label.text = style.label || `${clusteredEntities.length}`
              cluster.label.font = '14px sans-serif'
              cluster.label.fillColor = Color.WHITE
              cluster.label.outlineColor = Color.BLACK
              cluster.label.outlineWidth = 2
              cluster.label.style = 2 // LabelStyle.FILL_AND_OUTLINE

              if (style.image) {
                cluster.billboard.show = true
                cluster.billboard.image = style.image
                cluster.billboard.scale = style.scale || 1.0
              } else {
                cluster.billboard.show = false
                cluster.point.show = true
                cluster.point.pixelSize = 30
                cluster.point.color = Color.BLUE.withAlpha(0.8)
              }
            } catch (error) {
              console.error('Failed to apply cluster style:', error)
            }
          }
        )
      } else {
        // 默认聚合样式
        dataSource.clustering.clusterEvent.addEventListener(
          (
            _clusteredEntities: Cesium.Entity[],
            cluster: { billboard: Cesium.Billboard; label: Cesium.Label; point: Cesium.PointGraphics }
          ) => {
            try {
              cluster.label.show = config.showLabels !== false
              cluster.label.text = `${_clusteredEntities.length}`
              cluster.label.font = '14px sans-serif'
              cluster.label.fillColor = Color.WHITE
              cluster.label.outlineColor = Color.BLACK
              cluster.label.outlineWidth = 2

              cluster.billboard.show = false
              cluster.point.show = true
              cluster.point.pixelSize = 30
              cluster.point.color = Color.BLUE.withAlpha(0.8)
            } catch (error) {
              console.error('Failed to apply default cluster style:', error)
            }
          }
        )
      }
    } catch (error) {
      console.error('Failed to setup clustering:', error)
    }
  }

  /**
   * 添加 Entity 数据项
   */
  private addEntityItem(layer: DataLayerInstance, item: DataItem): void {
    try {
      const style = { ...layer.config.defaultStyle, ...item.style }
      const entityConfig: Cesium.Entity.ConstructorOptions = {
        id: String(item.id),
        show: item.show !== false,
        properties: item.data
      }

      // 根据几何类型创建不同的几何体
      switch (item.geometryType) {
        case 'point':
          entityConfig.position = this.normalizePosition(item.position)
          if (style.icon) {
            entityConfig.billboard = new BillboardGraphics({
              image: style.icon.image,
              scale: style.icon.scale || 1.0,
              color: style.icon.color,
              pixelOffset: style.icon.pixelOffset
                ? new Cartesian2(style.icon.pixelOffset[0], style.icon.pixelOffset[1])
                : undefined
            })
          } else if (style.point) {
            entityConfig.point = {
              pixelSize: style.point.pixelSize || 10,
              color: style.point.color || Color.BLUE,
              outlineColor: style.point.outlineColor || Color.WHITE,
              outlineWidth: style.point.outlineWidth || 2
            }
          }
          break

        case 'polyline':
          entityConfig.polyline = new PolylineGraphics({
            positions: this.normalizePositions(item.positions),
            width: style.polyline?.width || 2,
            material: style.polyline?.material || Color.BLUE,
            clampToGround: style.polyline?.clampToGround || false,
            depthFailMaterial: style.polyline?.depthFailMaterial
          })
          break

        case 'polygon':
          entityConfig.polygon = new PolygonGraphics({
            hierarchy: this.normalizePositions(item.positions),
            material: style.polygon?.material || Color.BLUE.withAlpha(0.5),
            outline: style.polygon?.outline !== false,
            outlineColor: style.polygon?.outlineColor || Color.BLACK,
            outlineWidth: style.polygon?.outlineWidth || 1,
            height: style.polygon?.height,
            extrudedHeight: style.polygon?.extrudedHeight,
            heightReference: style.polygon?.clampToGround ? HeightReference.CLAMP_TO_GROUND : undefined
          })
          break

        case 'model':
          entityConfig.position = this.normalizePosition(item.position)
          entityConfig.model = new ModelGraphics({
            uri: style.model?.uri || '',
            scale: style.model?.scale || 1.0,
            minimumPixelSize: style.model?.minimumPixelSize || 64,
            maximumScale: style.model?.maximumScale,
            color: style.model?.color
          })
          break

        case 'circle':
        case 'ellipse':
          entityConfig.position = this.normalizePosition(item.position)
          entityConfig.ellipse = new EllipseGraphics({
            semiMajorAxis: style.circle?.semiMajorAxis || style.ellipse?.semiMajorAxis || 100,
            semiMinorAxis:
              style.ellipse?.semiMinorAxis || style.circle?.semiMajorAxis || style.ellipse?.semiMajorAxis || 100,
            material: style.circle?.material || style.ellipse?.material || Color.BLUE.withAlpha(0.5),
            outline: style.circle?.outline !== false || style.ellipse?.outline !== false,
            outlineColor: style.circle?.outlineColor || style.ellipse?.outlineColor || Color.BLACK,
            outlineWidth: style.circle?.outlineWidth || style.ellipse?.outlineWidth || 1,
            height: style.circle?.height || style.ellipse?.height,
            extrudedHeight: style.circle?.extrudedHeight || style.ellipse?.extrudedHeight
          })
          break

        case 'rectangle':
          if (item.geometry?.rectangleBounds) {
            const bounds = item.geometry.rectangleBounds
            entityConfig.rectangle = new RectangleGraphics({
              coordinates: Rectangle.fromDegrees(bounds.west, bounds.south, bounds.east, bounds.north),
              material: style.rectangle?.material || Color.BLUE.withAlpha(0.5),
              outline: style.rectangle?.outline !== false,
              outlineColor: style.rectangle?.outlineColor || Color.BLACK,
              outlineWidth: style.rectangle?.outlineWidth || 1,
              height: style.rectangle?.height,
              extrudedHeight: style.rectangle?.extrudedHeight
            })
          }
          break

        case 'corridor':
          entityConfig.corridor = new CorridorGraphics({
            positions: this.normalizePositions(item.positions),
            width: style.corridor?.width || 200,
            material: style.corridor?.material || Color.BLUE.withAlpha(0.5),
            outline: style.corridor?.outline !== false,
            outlineColor: style.corridor?.outlineColor || Color.BLACK,
            height: style.corridor?.height,
            extrudedHeight: style.corridor?.extrudedHeight,
            cornerType: this.getCornerType(item.geometry?.cornerType)
          })
          break

        case 'wall':
          entityConfig.wall = new WallGraphics({
            positions: this.normalizePositions(item.positions),
            material: style.wall?.material || Color.BLUE.withAlpha(0.5),
            outline: style.wall?.outline !== false,
            outlineColor: style.wall?.outlineColor || Color.BLACK,
            minimumHeights: style.wall?.minimumHeights,
            maximumHeights: style.wall?.maximumHeights
          })
          break

        case 'cylinder':
          entityConfig.position = this.normalizePosition(item.position)
          entityConfig.cylinder = new CylinderGraphics({
            length: style.cylinder?.length || 200,
            topRadius: style.cylinder?.topRadius || 50,
            bottomRadius: style.cylinder?.bottomRadius || 50,
            material: style.cylinder?.material || Color.BLUE.withAlpha(0.5),
            outline: style.cylinder?.outline !== false,
            outlineColor: style.cylinder?.outlineColor || Color.BLACK
          })
          break

        case 'box':
          entityConfig.position = this.normalizePosition(item.position)
          entityConfig.box = new BoxGraphics({
            dimensions: style.box?.dimensions
              ? new Cartesian3(style.box.dimensions.x, style.box.dimensions.y, style.box.dimensions.z)
              : new Cartesian3(100, 100, 100),
            material: style.box?.material || Color.BLUE.withAlpha(0.5),
            outline: style.box?.outline !== false,
            outlineColor: style.box?.outlineColor || Color.BLACK
          })
          break

        default:
          console.warn(`Unsupported geometry type: ${item.geometryType}`)
          return
      }

      // 添加标签（适用于所有类型）
      if (style.label) {
        // 为线、面等非点几何计算中心位置
        if (!entityConfig.position && item.positions && item.positions.length > 0) {
          const positions = this.normalizePositions(item.positions)
          const center = BoundingSphere.fromPoints(positions).center
          entityConfig.position = center
        }

        if (entityConfig.position) {
          entityConfig.label = new LabelGraphics({
            text: style.label.text,
            font: style.label.font || '14px sans-serif',
            fillColor: style.label.fillColor || Color.WHITE,
            outlineColor: style.label.outlineColor || Color.BLACK,
            outlineWidth: style.label.outlineWidth || 2,
            pixelOffset: style.label.pixelOffset
              ? new Cartesian2(style.label.pixelOffset[0], style.label.pixelOffset[1])
              : new Cartesian2(0, 20),
            show: style.label.show !== false
          })
        }
      }

      layer.dataSource!.entities.add(entityConfig)
      layer.dataMap.set(item.id, item)
    } catch (error) {
      console.error('Failed to add entity item:', error)
    }
  }

  /**
   * 获取拐角类型
   */
  private getCornerType(type?: string): CornerType {
    try {
      switch (type) {
        case 'ROUNDED':
          return CornerType.ROUNDED
        case 'MITERED':
          return CornerType.MITERED
        case 'BEVELED':
          return CornerType.BEVELED
        default:
          return CornerType.ROUNDED
      }
    } catch (error) {
      console.error('Failed to get corner type:', error)
      return CornerType.ROUNDED
    }
  }

  /**
   * 移除 Entity 数据项
   */
  private removeEntityItem(layer: DataLayerInstance, itemId: string | number): void {
    try {
      const entity = layer.dataSource!.entities.getById(String(itemId))
      if (entity) {
        layer.dataSource!.entities.remove(entity)
      }
      layer.dataMap.delete(itemId)
    } catch (error) {
      console.error('Failed to remove entity item:', error)
    }
  }

  /**
   * 更新 Entity 数据项
   */
  private updateEntityItem(layer: DataLayerInstance, itemId: string | number, updates: Partial<DataItem>): void {
    try {
      const entity = layer.dataSource!.entities.getById(String(itemId))
      if (!entity) return

      const item = layer.dataMap.get(itemId)
      if (!item) return

      // 更新数据
      Object.assign(item, updates)

      // 更新位置
      if (updates.position) {
        entity.position = new Cesium.ConstantPositionProperty(this.normalizePosition(updates.position))
      }

      // 更新显示状态
      if (updates.show !== undefined) {
        entity.show = updates.show
      }

      // 更新样式
      if (updates.style) {
        const style = { ...layer.config.defaultStyle, ...item.style }

        if (style.icon && entity.billboard) {
          entity.billboard.image = new Cesium.ConstantProperty(style.icon.image)
          entity.billboard.scale = new Cesium.ConstantProperty(style.icon.scale)
          entity.billboard.color = new Cesium.ConstantProperty(style.icon.color)
        }

        if (style.point && entity.point) {
          entity.point.pixelSize = new Cesium.ConstantProperty(style.point.pixelSize)
          entity.point.color = new Cesium.ConstantProperty(style.point.color)
          entity.point.outlineColor = new Cesium.ConstantProperty(style.point.outlineColor)
          entity.point.outlineWidth = new Cesium.ConstantProperty(style.point.outlineWidth)
        }

        if (style.label && entity.label) {
          entity.label.text = new Cesium.ConstantProperty(style.label.text)
          entity.label.fillColor = new Cesium.ConstantProperty(style.label.fillColor)
          entity.label.show = new Cesium.ConstantProperty(style.label.show)
        }
      }

      // 更新数据
      if (updates.data) {
        entity.properties = updates.data
      }
    } catch (error) {
      console.error('Failed to update entity item:', error)
    }
  }

  /**
   * 添加 Primitive 数据项
   */
  private addPrimitiveItem(layer: DataLayerInstance, item: DataItem, pointCollection: PointPrimitiveCollection): void {
    try {
      const position = this.normalizePosition(item.position)
      const style = { ...layer.config.defaultStyle, ...item.style }

      pointCollection.add({
        position,
        pixelSize: style.point?.pixelSize || 10,
        color: style.point?.color || Color.BLUE,
        outlineColor: style.point?.outlineColor || Color.WHITE,
        outlineWidth: style.point?.outlineWidth || 2,
        show: item.show !== false,
        id: item.id
      })

      layer.dataMap.set(item.id, item)
    } catch (error) {
      console.error('Failed to add primitive item:', error)
    }
  }

  /**
   * 移除 Primitive 数据项
   */
  private removePrimitiveItem(
    layer: DataLayerInstance,
    itemId: string | number,
    pointCollection: PointPrimitiveCollection
  ): void {
    try {
      for (let i = 0; i < pointCollection.length; i++) {
        const point = pointCollection.get(i)
        if (point.id === itemId) {
          pointCollection.remove(point)
          break
        }
      }
      layer.dataMap.delete(itemId)
    } catch (error) {
      console.error('Failed to remove primitive item:', error)
    }
  }

  /**
   * 更新 Primitive 数据项
   */
  private updatePrimitiveItem(
    layer: DataLayerInstance,
    itemId: string | number,
    updates: Partial<DataItem>,
    pointCollection: PointPrimitiveCollection
  ): void {
    try {
      const item = layer.dataMap.get(itemId)
      if (!item) return

      // 更新数据
      Object.assign(item, updates)

      // 查找点
      let point: PointPrimitive | undefined
      for (let i = 0; i < pointCollection.length; i++) {
        const p = pointCollection.get(i)
        if (p.id === itemId) {
          point = p
          break
        }
      }

      if (!point) return

      // 更新位置
      if (updates.position) {
        point.position = this.normalizePosition(updates.position)
      }

      // 更新显示状态
      if (updates.show !== undefined) {
        point.show = updates.show
      }

      // 更新样式
      if (updates.style?.point) {
        const style = { ...layer.config.defaultStyle?.point, ...updates.style.point }
        point.pixelSize = style.pixelSize || 10
        point.color = style.color || Color.BLUE
        point.outlineColor = style.outlineColor || Color.WHITE
        point.outlineWidth = style.outlineWidth || 2
      }
    } catch (error) {
      console.error('Failed to update primitive item:', error)
    }
  }

  /**
   * 创建数据图层
   */
  createLayer(config: DataLayerConfig): string {
    try {
      this.ensureInstalled()

      const layer = config.type === 'entity' ? this.createEntityLayer(config) : this.createPrimitiveLayer(config)

      this.layers.set(layer.id, layer)

      return layer.id
    } catch (error) {
      console.error('Failed to create layer:', error)
      throw error
    }
  }

  /**
   * 获取图层实例
   */
  getLayer(id: string): DataLayerInstance | undefined {
    return this.layers.get(id)
  }

  /**
   * 根据名称获取图层
   */
  getLayerByName(name: string): DataLayerInstance | undefined {
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

      // 清理 Entity 图层
      if (layer.type === 'entity' && layer.dataSource) {
        this.cesiumViewer.dataSources.remove(layer.dataSource, true)
      }

      // 清理 Primitive 图层
      if (layer.type === 'primitive' && layer.primitives) {
        // 移除聚合监听器
        const removeListener = this.primitiveClusterListeners.get(id)
        if (removeListener) {
          removeListener()
          this.primitiveClusterListeners.delete(id)
        }
        this.cesiumViewer.scene.primitives.remove(layer.primitives)
      }

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

  /**
   * 从数组数据创建图层数据项
   * @param dataArray 原始数据数组
   * @param mapping 数据映射配置
   * @returns DataItem 数组
   */
  createDataItemsFromArray(dataArray: unknown[], mapping: DataMappingConfig): DataItem[] {
    try {
      return dataArray
        .filter((item) => !mapping.filter || mapping.filter(item))
        .map((rawItem) => {
          // 数据转换
          const item = mapping.transform ? mapping.transform(rawItem) : rawItem

          // 获取ID
          const id = this.getFieldValue(item, mapping.idField)
          if (id === undefined) {
            throw new Error(`ID field '${mapping.idField}' not found in data`)
          }

          // 获取几何类型
          const geometryType =
            typeof mapping.geometryType === 'string'
              ? mapping.geometryType
              : this.getFieldValue(item, mapping.geometryType)

          // 构建 DataItem
          const dataItem: DataItem = {
            id,
            geometryType: geometryType as DataItem['geometryType'],
            data: item
          }

          // 处理位置（单点）
          if (mapping.position) {
            const lon = this.getFieldValue(item, mapping.position.lonField)
            const lat = this.getFieldValue(item, mapping.position.latField)
            const height = mapping.position.heightField ? this.getFieldValue(item, mapping.position.heightField) : 0

            if (lon !== undefined && lat !== undefined) {
              dataItem.position = [Number(lon), Number(lat), Number(height || 0)]
            }
          }

          // 处理位置（多点）
          if (mapping.positions) {
            const positionsData = this.getFieldValue(item, mapping.positions.field)
            if (Array.isArray(positionsData)) {
              const format = mapping.positions.format || 'lonlat'
              dataItem.positions = positionsData.map((pos: unknown) => {
                if (Array.isArray(pos)) {
                  if (format === 'lonlat') {
                    return [Number(pos[0]), Number(pos[1]), Number(pos[2] || 0)] as [number, number, number]
                  } else {
                    return [Number(pos[1]), Number(pos[0]), Number(pos[2] || 0)] as [number, number, number]
                  }
                }
                return pos as [number, number, number]
              })
            }
          }

          // 处理样式映射
          if (mapping.styleMapping) {
            dataItem.style = {}
            for (const [styleKey, styleValue] of Object.entries(mapping.styleMapping)) {
              if (typeof styleValue === 'function') {
                ;(dataItem.style as Record<string, unknown>)[styleKey] = styleValue(item)
              } else {
                const value = this.getFieldValue(item, styleValue)
                if (value !== undefined) {
                  ;(dataItem.style as Record<string, unknown>)[styleKey] = value
                }
              }
            }
          }

          // 处理显示状态
          if (mapping.showField) {
            const showValue = this.getFieldValue(item, mapping.showField)
            dataItem.show = Boolean(showValue)
          }

          return dataItem
        })
    } catch (error) {
      console.error('Failed to create data items from array:', error)
      throw error
    }
  }

  /**
   * 从数组数据批量导入到图层
   * @param layerId 图层ID
   * @param dataArray 原始数据数组
   * @param mapping 数据映射配置
   */
  importArrayData(layerId: string, dataArray: unknown[], mapping: DataMappingConfig): void {
    try {
      const layer = this.getLayer(layerId)
      if (!layer) {
        throw new Error(`Layer ${layerId} not found`)
      }

      const dataItems = this.createDataItemsFromArray(dataArray, mapping)
      layer.addItems(dataItems)
    } catch (error) {
      console.error('Failed to import array data:', error)
      throw error
    }
  }

  protected onDestroy(): void {
    try {
      // 移除所有图层
      this.removeAllLayers()

      // 移除点击事件监听
      if (this.clickListenerId && this.eventPlugin) {
        this.eventPlugin.off(this.clickListenerId)
      }
    } catch (error) {
      console.error('Failed to destroy DataLayer plugin:', error)
    }
  }
}

// 导出类型
export * from './types'
