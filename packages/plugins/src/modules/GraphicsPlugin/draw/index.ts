/**
 * Draw 模块导出
 * 图形绘制功能
 */

// ==================== Entity 方式绘制类 ====================
// 适合少量图形，功能完整，支持动态属性
export { DrawBase } from './DrawBase'
export { DrawPoint } from './DrawPoint'
export { DrawBillboard } from './DrawBillboard'
export { DrawLabel } from './DrawLabel'
export { DrawPolyline } from './DrawPolyline'
export { DrawPolygon } from './DrawPolygon'
export { DrawCircle } from './DrawCircle'
export { DrawRectangle } from './DrawRectangle'
export { DrawCorridor } from './DrawCorridor'
export { DrawWall } from './DrawWall'
export { DrawBox } from './DrawBox'
export { DrawCylinder } from './DrawCylinder'
export { DrawEllipsoid } from './DrawEllipsoid'
export { DrawCurve } from './DrawCurve'
export { DrawPlane } from './DrawPlane'
export { DrawModel } from './DrawModel'
export { DrawPolylineVolume } from './DrawPolylineVolume'
export { DrawPolygonEx } from './DrawPolygonEx'
export { DrawLune } from './DrawLune'
export { DrawRegular } from './DrawRegular'
export { DrawSector } from './DrawSector'
export { DrawIsoscelesTriangle } from './DrawIsoscelesTriangle'
export { DrawAttackArrow } from './DrawAttackArrow'
export { DrawAttackArrowPW } from './DrawAttackArrowPW'
export { DrawAttackArrowYW } from './DrawAttackArrowYW'
export { DrawCloseCurve } from './DrawCloseCurve'
export { DrawDoubleArrow } from './DrawDoubleArrow'
export { DrawFineArrow } from './DrawFineArrow'
export { DrawFineArrowYW } from './DrawFineArrowYW'
export { DrawGatheringPlace } from './DrawGatheringPlace'
export { DrawPModel } from './DrawPModel'

// ==================== Primitive 方式绘制类 ====================
// 适合大量图形，性能更高，推荐用于海量数据场景
export { DrawPrimitiveBase } from './DrawPrimitiveBase'
export { DrawPPoint } from './DrawPPoint'
export { DrawPBillboard } from './DrawPBillboard'
export { DrawPLabel } from './DrawPLabel'
export { DrawPPolyline } from './DrawPPolyline'
export { DrawPPolygon } from './DrawPPolygon'
export { DrawPCircle } from './DrawPCircle'
export { DrawPRectangle } from './DrawPRectangle'
export { DrawPCorridor } from './DrawPCorridor'
export { DrawPWall } from './DrawPWall'
export { DrawPBox } from './DrawPBox'
export { DrawPCylinder } from './DrawPCylinder'
export { DrawPEllipsoid } from './DrawPEllipsoid'
export { DrawPCurve } from './DrawPCurve'
export { DrawPPlane } from './DrawPPlane'
export { DrawPPolylineVolume } from './DrawPPolylineVolume'
export { DrawPPolygonEx } from './DrawPPolygonEx'
export { DrawPLune } from './DrawPLune'
export { DrawPRegular } from './DrawPRegular'
export { DrawPSector } from './DrawPSector'
export { DrawPIsoscelesTriangle } from './DrawPIsoscelesTriangle'
export { DrawPAttackArrow } from './DrawPAttackArrow'
export { DrawPAttackArrowPW } from './DrawPAttackArrowPW'
export { DrawPAttackArrowYW } from './DrawPAttackArrowYW'
export { DrawPCloseCurve } from './DrawPCloseCurve'
export { DrawPDoubleArrow } from './DrawPDoubleArrow'
export { DrawPFineArrow } from './DrawPFineArrow'
export { DrawPFineArrowYW } from './DrawPFineArrowYW'
export { DrawPGatheringPlace } from './DrawPGatheringPlace'

// ==================== 水域类绘制 ====================
// 水面、洪水推进、动态河流
export { DrawPWater } from './DrawPWater'
export { DrawPFlood } from './DrawPFlood'
export { DrawPRiver } from './DrawPRiver'

// ==================== 视频融合绘制 ====================
// 视频投射、2D/3D贴物投射、可编辑
export { DrawPVideoFusion } from './DrawPVideoFusion'

// 导出类型
export type {
  DrawConfig,
  AttrClass,
  TooltipPluginInterface,
  EnableablePlugin,
  EventPluginInterface,
  ExtendedViewer,
  ExtendedEntity,
  EditClassConstructor,
  BillboardDrawAttribute,
  BillboardExtendedEntity,
  BoxDrawAttribute,
  BoxExtendedEntity,
  CircleStyleConfig,
  CircleDrawAttribute,
  CircleExtendedEntity,
  // 水域类型
  WaterType,
  WaveType,
  WaterPrimitiveStyle,
  WaterPrimitiveConfig,
  WaterPrimitiveAttribute,
  FloodPrimitiveStyle,
  FloodPrimitiveAttribute,
  RiverCrossSection,
  RiverPrimitiveStyle,
  RiverPrimitiveAttribute,
  WaterAnimationState,
  // 视频融合类型
  VideoSourceType,
  VideoProjectionMode,
  VideoFusionPrimitiveStyle,
  VideoFusionPrimitiveConfig,
  VideoFusionPrimitiveAttribute,
  VideoProjectionCamera,
  VideoPlaybackState,
  VideoEditPointType,
  VideoEditControlPoint,
  VideoFusionEventData
} from '../types'
export type { DrawPrimitiveConfig, PrimitiveObject } from './DrawPrimitiveBase'
