# auto-cesium

Cesium 二次封装库 - 基于 TypeScript 的企业级 3D GIS 开发工具集

## 特性

- 🚀 **TypeScript** - 完整的类型定义支持
- 📦 **Monorepo** - 基于 pnpm workspace 的多包管理
- 🔌 **插件系统** - 灵活的插件化架构
- 🎨 **Vue 集成** - 开箱即用的 Vue 组件
- 📝 **完整文档** - 详细的 API 文档和示例
- ✅ **代码质量** - ESLint + Prettier + Stylelint
- 🔄 **版本管理** - 自动化版本发布和变更日志

## 包列表

| 包名                                       | 版本                                                        | 描述                |
| ------------------------------------------ | ----------------------------------------------------------- | ------------------- |
| [@auto-cesium/core](./packages/core)       | ![version](https://img.shields.io/badge/version-1.0.0-blue) | Cesium 核心功能封装 |
| [@auto-cesium/shared](./packages/shared)   | ![version](https://img.shields.io/badge/version-1.0.0-blue) | 共享工具库          |
| [@auto-cesium/plugins](./packages/plugins) | ![version](https://img.shields.io/badge/version-1.0.0-blue) | 插件系统            |

## 快速开始

### 安装

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建所有包
pnpm build
```

### 文档

```bash
# 启动文档服务
pnpm docs:dev

# 构建文档
pnpm docs:build
```

## 开发指南

### 项目结构

```
auto-cesium/
├── packages/
│   ├── core/          # 核心功能
│   ├── shared/        # 共享工具
│   └── plugins/       # 插件系统
├── docs/              # VitePress 文档
├── scripts/           # 构建和发布脚本
└── ...
```

### 代码规范

项目使用以下工具保证代码质量：

- **ESLint** - JavaScript/TypeScript 代码检查
- **Prettier** - 代码格式化
- **Stylelint** - CSS/SCSS 代码检查
- **Commitlint** - Git 提交信息检查
- **Husky** - Git Hooks 管理

```bash
# 代码检查
pnpm lint

# 类型检查
pnpm type-check
```

### Git 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) 规范：

```bash
# 使用交互式提交工具（推荐）
pnpm commit

# 提交类型
# feat:     新功能
# fix:      Bug 修复
# docs:     文档变更
# style:    代码格式
# refactor: 重构
# perf:     性能优化
# test:     测试相关
# chore:    构建/工具变动
```

示例：

```bash
pnpm commit
# 选择类型 → 选择范围 → 输入描述 → 确认提交
```

### 版本发布

项目支持两种发布模式：

#### 1. 全量发布（所有包统一版本）

```bash
# 交互式发布所有包
pnpm release
```

适用场景：

- 项目初次发布
- 所有包需要同步升级
- 发布重大版本更新

#### 2. 单包发布（独立版本管理）

```bash
# 交互式选择要发布的包
pnpm release:pkg

# 或直接指定包名
pnpm release:pkg core
pnpm release:pkg shared
pnpm release:pkg plugins
```

适用场景：

- 单个包的 bug 修复
- 单个包的功能增强
- 包之间版本需要独立管理

#### 发布流程

1. 选择版本类型（patch/minor/major/prerelease/custom）
2. 确认新版本号
3. 自动更新包的版本号
4. 生成 CHANGELOG.md
5. 提交变更并创建 Git 标签
6. （可选）推送到远程仓库

#### 变更日志

- 根目录 `CHANGELOG.md` - 记录整体项目变更
- 包目录 `packages/*/CHANGELOG.md` - 记录具体包的变更

```bash
# 手动生成变更日志
pnpm changelog
```

详细说明请查看 [scripts/README.md](./scripts/README.md)

## 可用命令

```bash
# 开发
pnpm dev              # 所有包开发模式
pnpm build            # 构建所有包
pnpm clean            # 清理构建产物

# 代码质量
pnpm lint             # 运行所有 lint
pnpm lint:eslint      # ESLint 检查
pnpm lint:prettier    # Prettier 格式化
pnpm lint:stylelint   # Stylelint 检查
pnpm type-check       # TypeScript 类型检查

# 文档
pnpm docs:dev         # 启动文档开发服务器
pnpm docs:build       # 构建文档
pnpm docs:preview     # 预览构建后的文档

# Git & 发布
pnpm commit           # 交互式提交
pnpm release          # 发布所有包（统一版本）
pnpm release:pkg      # 发布单个包（独立版本）
pnpm changelog        # 生成变更日志
```

## 插件列表

### 相机插件 (CameraPlugin)

强大的相机控制功能：

- ✈️ **飞行漫游** - 基于航点的自动飞行，支持 Hermite/Lagrange 插值
- 🚶 **室内漫游** - 第一人称室内漫游，可配置人眼高度
- ⌨️ **键盘漫游** - WASD + 鼠标控制的第一人称漫游
- 🎯 **模型漫游** - 模型跟随路径飞行
- 🎥 **相机视锥体** - 可视化相机视野范围
- 🔄 **绕点飞行** - 围绕指定点旋转飞行

详细文档：[docs/packages/plugins/camera.md](./docs/packages/plugins/camera.md)

## 环境要求

- Node.js >= 16.0.0
- pnpm >= 8.0.0

## 许可证

MIT

## 变更日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解各版本的详细变更。
