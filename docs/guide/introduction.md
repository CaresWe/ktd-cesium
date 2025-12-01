# 介绍

Auto-Cesium 是一个基于 [Cesium](https://cesium.com/) 的二次封装库，旨在提供更简洁、易用的 API，帮助开发者快速构建 3D 地图应用。

## 特性

- **Monorepo 架构**：采用 pnpm workspace 管理多包项目，模块化设计，按需引入
- **完整的工具集**：提供坐标转换、数学计算、颜色处理等常用工具函数
- **核心功能封装**：对 Cesium Viewer 进行封装，提供更简洁的 API
- **插件系统**：基于插件架构，支持图层管理、事件处理、弹窗等功能扩展
- **TypeScript 支持**：完整的类型定义，提供更好的开发体验
- **框架无关**：可在 Vue、React 等任何前端框架中使用

## 包结构

Auto-Cesium 采用 Monorepo 架构，包含以下三个核心包：

### [@auto-cesium/shared](/packages/shared/overview)

共享基础库，提供通用的工具函数：

- **坐标转换**：经纬度与笛卡尔坐标转换、国内坐标系转换（WGS84、GCJ-02、BD-09）
- **数学计算**：数值限制、线性插值、范围映射、随机数生成
- **颜色处理**：十六进制、RGB 与 Cesium Color 转换、颜色插值
- **格式化工具**：坐标、距离、面积、高度的格式化显示
- **工具函数**：对象操作、函数操作、字符串处理、深拷贝等
- **位置处理**：高度计算、距离计算、位置插值、表面高度获取
- **曲线处理**：折线转平滑曲线、贝塞尔曲线、样条插值
- **几何计算**：矩阵变换、旋转、平移、平行线计算
- **Cesium 工具**：GeoJSON 处理、样式配置、鼠标位置拾取
- **军标图形**：攻击箭头、双箭头、扇形、正多边形等军事标绘图形

### [@auto-cesium/core](/packages/core/overview)

核心功能封装，包括：

- **AutoViewer**：对 Cesium.Viewer 的封装，通过 Proxy 代理保留所有 Cesium API
- **插件系统**：统一的插件管理接口，支持插件安装、获取、卸载
- **生命周期管理**：自动管理 Viewer 和插件的创建和销毁

### [@auto-cesium/plugins](/packages/plugins/overview)

插件系统，提供各种功能扩展：

- **BaseLayerPlugin**：基础图层管理（天地图、高德、Google 等）
- **CameraPlugin**：相机控制和漫游
- **DataLayerPlugin**：数据图层管理（GeoJSON、KML 等）
- **EventPlugin**：事件处理
- **GraphicsPlugin**：图形绘制和编辑（20+ 图形类型）
- **PopupPlugin**：弹窗管理
- **TooltipPlugin**：提示框管理
- **TransformPlugin**：3D 变换（平移、旋转、缩放）
- **AnalysisPlugin**：量算分析（距离、面积、高度等）
- **MaterialPlugin**：自定义材质（水面、流动、波纹等）
- **TilesPlugin**：3D Tiles 模型管理
- **ScenePlugin**：场景特效（雨、雪、雾等）
- **ParticleSystemPlugin**：粒子系统

## 为什么选择 Auto-Cesium？

1. **简化开发流程**：封装了 Cesium 常用功能，减少重复代码
2. **类型安全**：完整的 TypeScript 类型定义，避免运行时错误
3. **灵活扩展**：基于插件的架构设计，易于扩展新功能
4. **开箱即用**：提供丰富的工具函数和预设配置
5. **持续维护**：活跃的社区支持和定期更新

## 下一步

- [快速开始](/guide/getting-started) - 了解如何快速上手
- [安装](/guide/installation) - 查看详细的安装指南
- [最佳实践](/guide/best-practices) - 学习推荐做法和模式
- [常见问题](/guide/faq) - 查看常见问题解答
- [工作流指南](/guide/workflows) - 了解自动化工作流
- [Shared 包](/packages/shared/overview) - 探索工具函数
- [Core 包](/packages/core/overview) - 了解核心功能
- [Plugins 包](/packages/plugins/overview) - 使用插件系统
