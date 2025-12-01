/**
 * 最短路径分析（基于地形坡度）
 * 使用 A* 算法计算考虑地形坡度的最优路径
 */

import * as Cesium from 'cesium'
import { MeasureBase } from '../MeasureBase'
import type { MeasureResult, ShortestPathOptions } from '../types'
import type { DrawConfig } from '../../GraphicsPlugin/types'

/**
 * 网格节点
 */
interface GridNode {
  /** 位置索引 */
  index: number
  /** 世界坐标 */
  position: Cesium.Cartesian3
  /** 高程（米） */
  elevation: number
  /** 经度（度） */
  longitude: number
  /** 纬度（度） */
  latitude: number
  /** 与起点的实际代价 */
  gCost: number
  /** 与终点的启发式代价 */
  hCost: number
  /** 总代价 */
  fCost: number
  /** 父节点 */
  parent: GridNode | null
}

/**
 * 最短路径分析类
 */
export class MeasureShortestPath extends MeasureBase {
  measureType = 'shortestPath' as const

  private startPoint: Cesium.Entity | null = null
  private endPoint: Cesium.Entity | null = null
  private pathLine: Cesium.Entity | null = null
  private gridPointEntities: Cesium.Entity[] = []
  private labelEntity: Cesium.Entity | null = null
  private positions: Cesium.Cartesian3[] = []
  private pathPositions: Cesium.Cartesian3[] = []
  private gridNodes: GridNode[] = []

  /** 最短路径配置 */
  private pathOptions: Required<ShortestPathOptions>

  constructor(opts: DrawConfig) {
    super(opts)

    // 默认配置
    this.pathOptions = {
      gridSize: 20,
      slopeWeight: 1.0,
      distanceWeight: 1.0,
      maxSlope: 45,
      pathColor: '#0000ff',
      pathWidth: 3,
      showGridPoints: false,
      gridPointColor: '#888888',
      gridPointSize: 3,
      sampleTerrain: false
    }
  }

  /**
   * 设置最短路径配置
   */
  setShortestPathOptions(options: Partial<ShortestPathOptions>): this {
    this.pathOptions = {
      ...this.pathOptions,
      ...options
    }
    return this
  }

  /**
   * 创建要素
   */
  protected override createFeature(_attribute: Record<string, unknown>): Cesium.Entity | null {
    return null
  }

  /**
   * 绑定事件
   */
  protected override bindEvent(): void {
    this.bindMoveEvent((screenPosition) => {
      const worldPosition = this.getWorldPosition(screenPosition)
      if (worldPosition) {
        this.onMouseMove(worldPosition)
      }
    })

    this.bindClickEvent((screenPosition) => {
      const worldPosition = this.getWorldPosition(screenPosition)
      if (worldPosition) {
        this.onLeftClick(worldPosition)
      }
    })

    this.bindRightClickEvent(() => {
      this.onRightClick()
    })

    this.bindDoubleClickEvent(() => {
      this.onRightClick()
    })

    this.bindLongPressEvent(() => {
      this.onRightClick()
    })
  }

  /**
   * 计算量算结果
   */
  protected calculateResult(positions: Cesium.Cartesian3[]): MeasureResult {
    if (positions.length < 2) {
      return {
        type: this.measureType,
        value: {
          straightDistance: 0,
          pathDistance: 0,
          pathLength: 0,
          nodes: 0,
          avgSlope: 0,
          maxSlope: 0,
          elevationChange: 0
        },
        positions: [...positions],
        text: ''
      }
    }

    const startPos = positions[0]
    const endPos = positions[1]

    // 生成网格并计算最短路径
    this.pathPositions = this.calculateShortestPath(startPos, endPos)

    // 计算直线距离
    const straightDistance = Cesium.Cartesian3.distance(startPos, endPos)

    // 计算路径距离和坡度统计
    let pathDistance = 0
    let totalSlope = 0
    let maxSlope = 0
    const startCarto = Cesium.Cartographic.fromCartesian(startPos)
    const endCarto = Cesium.Cartographic.fromCartesian(endPos)

    for (let i = 0; i < this.pathPositions.length - 1; i++) {
      const dist = Cesium.Cartesian3.distance(this.pathPositions[i], this.pathPositions[i + 1])
      pathDistance += dist

      // 计算坡度
      const carto1 = Cesium.Cartographic.fromCartesian(this.pathPositions[i])
      const carto2 = Cesium.Cartographic.fromCartesian(this.pathPositions[i + 1])
      const heightDiff = Math.abs(carto2.height - carto1.height)
      const slope = Cesium.Math.toDegrees(Math.atan2(heightDiff, dist))

      totalSlope += slope
      maxSlope = Math.max(maxSlope, slope)
    }

    const avgSlope = this.pathPositions.length > 1 ? totalSlope / (this.pathPositions.length - 1) : 0
    const elevationChange = Math.abs(endCarto.height - startCarto.height)

    return {
      type: this.measureType,
      value: {
        straightDistance,
        pathDistance,
        pathLength: this.pathPositions.length,
        nodes: this.gridNodes.length,
        avgSlope,
        maxSlope,
        elevationChange,
        pathPositions: this.pathPositions
      },
      positions: [...positions],
      text: `直线距离: ${this.formatDistance(straightDistance)}\n路径距离: ${this.formatDistance(pathDistance)}\n平均坡度: ${avgSlope.toFixed(1)}°\n最大坡度: ${maxSlope.toFixed(1)}°\n高程变化: ${elevationChange.toFixed(1)}m`
    }
  }

  /**
   * 计算最短路径（A* 算法）
   */
  private calculateShortestPath(startPos: Cesium.Cartesian3, endPos: Cesium.Cartesian3): Cesium.Cartesian3[] {
    // 生成网格节点
    this.gridNodes = this.generateGridNodes(startPos, endPos)

    if (this.gridNodes.length === 0) {
      return [startPos, endPos]
    }

    // 找到起点和终点最近的网格节点
    const startNode = this.findNearestNode(startPos)
    const endNode = this.findNearestNode(endPos)

    if (!startNode || !endNode) {
      return [startPos, endPos]
    }

    // 执行 A* 算法
    const path = this.aStarSearch(startNode, endNode)

    if (path.length === 0) {
      return [startPos, endPos]
    }

    return path.map((node) => node.position)
  }

  /**
   * 生成网格节点
   */
  private generateGridNodes(startPos: Cesium.Cartesian3, endPos: Cesium.Cartesian3): GridNode[] {
    const startCarto = Cesium.Cartographic.fromCartesian(startPos)
    const endCarto = Cesium.Cartographic.fromCartesian(endPos)

    const minLon = Math.min(startCarto.longitude, endCarto.longitude)
    const maxLon = Math.max(startCarto.longitude, endCarto.longitude)
    const minLat = Math.min(startCarto.latitude, endCarto.latitude)
    const maxLat = Math.max(startCarto.latitude, endCarto.latitude)

    // 扩展边界以包含更多可能路径
    const lonPadding = (maxLon - minLon) * 0.2
    const latPadding = (maxLat - minLat) * 0.2

    const paddedMinLon = minLon - lonPadding
    const paddedMaxLon = maxLon + lonPadding
    const paddedMinLat = minLat - latPadding
    const paddedMaxLat = maxLat + latPadding

    // 计算网格尺寸
    const sw = Cesium.Cartesian3.fromRadians(paddedMinLon, paddedMinLat)
    const width = Cesium.Cartesian3.distance(sw, Cesium.Cartesian3.fromRadians(paddedMaxLon, paddedMinLat))
    const height = Cesium.Cartesian3.distance(sw, Cesium.Cartesian3.fromRadians(paddedMinLon, paddedMaxLat))

    const cols = Math.ceil(width / this.pathOptions.gridSize)
    const rows = Math.ceil(height / this.pathOptions.gridSize)

    const nodes: GridNode[] = []
    let index = 0

    // 生成网格点
    for (let i = 0; i <= rows; i++) {
      for (let j = 0; j <= cols; j++) {
        const t1 = i / rows
        const t2 = j / cols

        const lon = paddedMinLon + (paddedMaxLon - paddedMinLon) * t2
        const lat = paddedMinLat + (paddedMaxLat - paddedMinLat) * t1

        const cartographic = new Cesium.Cartographic(lon, lat, 0)
        const position = Cesium.Ellipsoid.WGS84.cartographicToCartesian(cartographic)

        // 获取地形高程
        const carto = Cesium.Cartographic.fromCartesian(position)
        const elevation = carto.height

        nodes.push({
          index: index++,
          position,
          elevation,
          longitude: Cesium.Math.toDegrees(lon),
          latitude: Cesium.Math.toDegrees(lat),
          gCost: Infinity,
          hCost: 0,
          fCost: Infinity,
          parent: null
        })
      }
    }

    return nodes
  }

  /**
   * 找到最近的网格节点
   */
  private findNearestNode(position: Cesium.Cartesian3): GridNode | null {
    let nearestNode: GridNode | null = null
    let minDistance = Infinity

    for (const node of this.gridNodes) {
      const distance = Cesium.Cartesian3.distance(position, node.position)
      if (distance < minDistance) {
        minDistance = distance
        nearestNode = node
      }
    }

    return nearestNode
  }

  /**
   * A* 搜索算法
   */
  private aStarSearch(startNode: GridNode, endNode: GridNode): GridNode[] {
    const openSet: GridNode[] = []
    const closedSet: Set<number> = new Set()

    startNode.gCost = 0
    startNode.hCost = this.calculateHeuristic(startNode, endNode)
    startNode.fCost = startNode.hCost
    openSet.push(startNode)

    while (openSet.length > 0) {
      // 找到 fCost 最小的节点
      let currentNode = openSet[0]
      let currentIndex = 0

      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].fCost < currentNode.fCost) {
          currentNode = openSet[i]
          currentIndex = i
        }
      }

      // 移除当前节点
      openSet.splice(currentIndex, 1)
      closedSet.add(currentNode.index)

      // 到达终点
      if (currentNode.index === endNode.index) {
        return this.reconstructPath(currentNode)
      }

      // 检查相邻节点
      const neighbors = this.getNeighbors(currentNode)

      for (const neighbor of neighbors) {
        if (closedSet.has(neighbor.index)) {
          continue
        }

        // 计算移动代价
        const moveCost = this.calculateMoveCost(currentNode, neighbor)

        // 检查坡度限制
        const slope = this.calculateSlope(currentNode, neighbor)
        if (slope > this.pathOptions.maxSlope) {
          continue
        }

        const tentativeGCost = currentNode.gCost + moveCost

        if (tentativeGCost < neighbor.gCost) {
          neighbor.parent = currentNode
          neighbor.gCost = tentativeGCost
          neighbor.hCost = this.calculateHeuristic(neighbor, endNode)
          neighbor.fCost = neighbor.gCost + neighbor.hCost

          if (!openSet.includes(neighbor)) {
            openSet.push(neighbor)
          }
        }
      }
    }

    // 未找到路径
    return []
  }

  /**
   * 获取相邻节点
   */
  private getNeighbors(node: GridNode): GridNode[] {
    const neighbors: GridNode[] = []
    const maxDistance = this.pathOptions.gridSize * 1.5 // 允许对角线邻居

    for (const otherNode of this.gridNodes) {
      if (otherNode.index === node.index) continue

      const distance = Cesium.Cartesian3.distance(node.position, otherNode.position)
      if (distance <= maxDistance) {
        neighbors.push(otherNode)
      }
    }

    return neighbors
  }

  /**
   * 计算移动代价（考虑距离和坡度）
   */
  private calculateMoveCost(from: GridNode, to: GridNode): number {
    const distance = Cesium.Cartesian3.distance(from.position, to.position)
    const slope = this.calculateSlope(from, to)

    // 综合代价 = 距离权重 * 距离 + 坡度权重 * 坡度因子
    const slopeFactor = Math.pow(1 + slope / 45, 2) // 坡度越大，代价越高
    return this.pathOptions.distanceWeight * distance + this.pathOptions.slopeWeight * distance * slopeFactor
  }

  /**
   * 计算坡度（度）
   */
  private calculateSlope(from: GridNode, to: GridNode): number {
    const distance = Cesium.Cartesian3.distance(from.position, to.position)
    const heightDiff = Math.abs(to.elevation - from.elevation)
    return Cesium.Math.toDegrees(Math.atan2(heightDiff, distance))
  }

  /**
   * 计算启发式代价（欧几里得距离）
   */
  private calculateHeuristic(from: GridNode, to: GridNode): number {
    return Cesium.Cartesian3.distance(from.position, to.position)
  }

  /**
   * 重建路径
   */
  private reconstructPath(endNode: GridNode): GridNode[] {
    const path: GridNode[] = []
    let current: GridNode | null = endNode

    while (current !== null) {
      path.unshift(current)
      current = current.parent
    }

    return path
  }

  /**
   * 更新显示
   */
  protected updateDisplay(positions: Cesium.Cartesian3[]): void {
    if (positions.length === 0) return

    // 清除之前的实体
    this.clearEntities()

    // 创建起点
    if (positions.length >= 1) {
      this.startPoint = this.createPathPoint(positions[0], '#00ff00', 10)
    }

    // 创建终点和路径
    if (positions.length >= 2) {
      this.endPoint = this.createPathPoint(positions[1], '#ff0000', 10)

      // 计算结果
      this.result = this.calculateResult(positions)

      // 绘制路径
      if (this.pathPositions.length >= 2) {
        this.pathLine = this.createPathLine(this.pathPositions)
      }

      // 显示网格点（如果启用）
      if (this.pathOptions.showGridPoints) {
        this.drawGridPoints()
      }

      // 创建标签
      const midPoint = Cesium.Cartesian3.midpoint(positions[0], positions[1], new Cesium.Cartesian3())
      this.labelEntity = this.createLabelEntity(midPoint, this.result.text || '')
    }

    // 触发更新事件
    if (this.liveUpdate && positions.length >= 2) {
      this.fire('measure:update', { result: this.result })
    }
  }

  /**
   * 绘制网格点
   */
  private drawGridPoints(): void {
    for (const node of this.gridNodes) {
      const pointEntity = this.createPathPoint(
        node.position,
        this.pathOptions.gridPointColor,
        this.pathOptions.gridPointSize
      )
      this.gridPointEntities.push(pointEntity)
    }
  }

  /**
   * 创建路径点
   */
  private createPathPoint(position: Cesium.Cartesian3, color: string, size: number): Cesium.Entity {
    if (!this.dataSource) {
      throw new Error('DataSource is not initialized')
    }

    return this.dataSource.entities.add({
      position,
      point: {
        pixelSize: size,
        color: Cesium.Color.fromCssColorString(color),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      }
    })
  }

  /**
   * 创建路径线
   */
  private createPathLine(positions: Cesium.Cartesian3[]): Cesium.Entity {
    if (!this.dataSource) {
      throw new Error('DataSource is not initialized')
    }

    return this.dataSource.entities.add({
      polyline: {
        positions,
        width: this.pathOptions.pathWidth,
        material: Cesium.Color.fromCssColorString(this.pathOptions.pathColor),
        clampToGround: true
      }
    })
  }

  /**
   * 清除所有实体
   */
  private clearEntities(): void {
    if (this.startPoint) {
      this.dataSource?.entities.remove(this.startPoint)
      this.startPoint = null
    }

    if (this.endPoint) {
      this.dataSource?.entities.remove(this.endPoint)
      this.endPoint = null
    }

    if (this.pathLine) {
      this.dataSource?.entities.remove(this.pathLine)
      this.pathLine = null
    }

    this.gridPointEntities.forEach((entity) => this.dataSource?.entities.remove(entity))
    this.gridPointEntities = []

    if (this.labelEntity) {
      this.dataSource?.entities.remove(this.labelEntity)
      this.labelEntity = null
    }
  }

  /**
   * 开始绘制
   */
  override enable(): this {
    super.enable()
    this.fire('measure:start', { type: this.measureType })
    return this
  }

  /**
   * 完成绘制
   */
  override disable(hasWB = true): this {
    if (this.positions.length >= 2) {
      this.result = this.calculateResult(this.positions)
      this.fire('measure:complete', { result: this.result })
    }

    return super.disable(hasWB)
  }

  /**
   * 鼠标移动事件
   */
  protected onMouseMove(position: Cesium.Cartesian3): void {
    if (this.positions.length === 0) return

    const tempPositions = [...this.positions, position]
    this.updateDisplay(tempPositions)
  }

  /**
   * 左键点击事件
   */
  protected onLeftClick(position: Cesium.Cartesian3): void {
    // 检查顶点吸附
    const screenPos = Cesium.SceneTransforms.worldToWindowCoordinates(this.viewer.scene, position)
    if (screenPos) {
      const snappedPos = this.snapToVertex(screenPos)
      if (snappedPos) {
        position = snappedPos
      }
    }

    this.positions.push(position)
    this.updateDisplay(this.positions)
    this.fire('measure:pointAdd', { position, positions: [...this.positions] })

    // 最短路径分析需要两个点（起点和终点）
    if (this.positions.length >= 2) {
      this.disable()
    }
  }

  /**
   * 右键点击事件 - 取消测量
   */
  protected onRightClick(): void {
    if (this.positions.length > 0) {
      this.disable()
    }
  }

  /**
   * 获取路径点
   */
  getPathPositions(): Cesium.Cartesian3[] {
    return this.pathPositions
  }

  /**
   * 获取网格节点
   */
  getGridNodes(): GridNode[] {
    return this.gridNodes
  }
}
