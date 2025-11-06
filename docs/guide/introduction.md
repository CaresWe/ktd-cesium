# 介绍

KTD-Cesium 是一个基于 [Cesium](https://cesium.com/) 的二次封装库，旨在提供更简洁、易用的 API，帮助开发者快速构建 3D 地图应用。

## 特性

- **Monorepo 架构**：采用 pnpm workspace 管理多包项目，模块化设计，按需引入
- **完整的工具集**：提供坐标转换、数学计算、颜色处理等常用工具函数
- **核心功能封装**：对 Cesium Viewer 进行封装，提供更简洁的 API
- **插件系统**：基于插件架构，支持图层管理、事件处理、弹窗等功能扩展
- **TypeScript 支持**：完整的类型定义，提供更好的开发体验
- **框架无关**：可在 Vue、React 等任何前端框架中使用

## 包结构

KTD-Cesium 采用 Monorepo 架构，包含以下三个核心包：

### [@ktd-cesium/shared](/packages/shared/overview)

共享基础库，提供通用的工具函数：
- 坐标转换工具
- 数学计算工具
- 颜色处理工具
- 格式化工具

### [@ktd-cesium/core](/packages/core/overview)

核心功能封装，包括：
- KtdViewer：对 Cesium.Viewer 的封装
- 提供更简洁的 API 接口

### [@ktd-cesium/plugins](/packages/plugins/overview)

插件系统，提供各种功能扩展：
- BaseLayerPlugin：基础图层管理
- CameraPlugin：相机控制
- DataLayerPlugin：数据图层管理
- EventPlugin：事件处理
- PopupPlugin：弹窗管理

## 为什么选择 KTD-Cesium？

1. **简化开发流程**：封装了 Cesium 常用功能，减少重复代码
2. **类型安全**：完整的 TypeScript 类型定义，避免运行时错误
3. **灵活扩展**：基于插件的架构设计，易于扩展新功能
4. **开箱即用**：提供丰富的工具函数和预设配置
5. **持续维护**：活跃的社区支持和定期更新

## 下一步

- [快速开始](/guide/getting-started) - 了解如何快速上手
- [安装](/guide/installation) - 查看详细的安装指南
- [Shared 包](/packages/shared/overview) - 探索工具函数
- [Core 包](/packages/core/overview) - 了解核心功能
- [Plugins 包](/packages/plugins/overview) - 使用插件系统
