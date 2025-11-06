# 安装

## 环境要求

- Node.js >= 16.0.0
- pnpm >= 8.0.0（推荐）或 npm/yarn

## 安装依赖

KTD-Cesium 采用 Monorepo 架构，你可以根据需求选择安装不同的包。

### 完整安装（推荐）

安装所有核心包和 Cesium：

```bash
pnpm add @ktd-cesium/core @ktd-cesium/shared @ktd-cesium/plugins cesium
```

### 按需安装

如果你只需要部分功能，可以按需安装：

#### 仅使用工具函数

```bash
pnpm add @ktd-cesium/shared cesium
```

#### 使用核心功能

```bash
pnpm add @ktd-cesium/core @ktd-cesium/shared cesium
```

#### 使用插件系统

```bash
pnpm add @ktd-cesium/plugins @ktd-cesium/core @ktd-cesium/shared cesium
```

## 配置 Vite

如果你使用 Vite 构建项目，需要进行以下配置：

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/cesium/Build/Cesium/Workers/*',
          dest: 'cesium/Workers'
        },
        {
          src: 'node_modules/cesium/Build/Cesium/ThirdParty/*',
          dest: 'cesium/ThirdParty'
        },
        {
          src: 'node_modules/cesium/Build/Cesium/Assets/*',
          dest: 'cesium/Assets'
        },
        {
          src: 'node_modules/cesium/Build/Cesium/Widgets/*',
          dest: 'cesium/Widgets'
        }
      ]
    })
  ],
  define: {
    CESIUM_BASE_URL: JSON.stringify('/cesium')
  }
})
```

## 配置 Webpack

如果你使用 Webpack，需要进行以下配置：

```javascript
// webpack.config.js
const CopyWebpackPlugin = require('copy-webpack-plugin')
const webpack = require('webpack')
const path = require('path')

module.exports = {
  // ...其他配置
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'node_modules/cesium/Build/Cesium/Workers', to: 'cesium/Workers' },
        { from: 'node_modules/cesium/Build/Cesium/ThirdParty', to: 'cesium/ThirdParty' },
        { from: 'node_modules/cesium/Build/Cesium/Assets', to: 'cesium/Assets' },
        { from: 'node_modules/cesium/Build/Cesium/Widgets', to: 'cesium/Widgets' }
      ]
    }),
    new webpack.DefinePlugin({
      CESIUM_BASE_URL: JSON.stringify('/cesium')
    })
  ]
}
```

## TypeScript 配置

确保你的 `tsconfig.json` 包含以下配置：

```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "lib": ["ESNext", "DOM"]
  }
}
```

## CDN 引入

如果你不想使用包管理器，也可以通过 CDN 引入：

```html
<!-- Cesium -->
<link href="https://cesium.com/downloads/cesiumjs/releases/1.135/Build/Cesium/Widgets/widgets.css" rel="stylesheet">
<script src="https://cesium.com/downloads/cesiumjs/releases/1.135/Build/Cesium/Cesium.js"></script>

<!-- KTD-Cesium（需要自行构建和托管）-->
<script src="path/to/ktd-cesium.umd.js"></script>
```

## 验证安装

创建一个简单的示例来验证安装是否成功：

```typescript
import { KtdViewer } from '@ktd-cesium/core'
import { degreesToCartesian } from '@ktd-cesium/shared'

console.log('KTD-Cesium 安装成功！')

// 测试工具函数
const cartesian = degreesToCartesian(116.4, 39.9, 0)
console.log('坐标转换结果:', cartesian)

// 创建地图（确保页面中有 id="cesiumContainer" 的元素）
// const viewer = new KtdViewer({
//   container: 'cesiumContainer',
// })
```

如果控制台输出了结果且没有报错，说明安装成功！

## 常见问题

### 1. Cesium 静态资源加载失败

**问题**：控制台报错 `Failed to load Cesium Workers/Assets`

**解决方案**：确保正确配置了构建工具，将 Cesium 的静态资源复制到输出目录，并设置了 `CESIUM_BASE_URL`。

### 2. TypeScript 类型错误

**问题**：提示找不到模块类型

**解决方案**：
```bash
pnpm add -D @types/cesium
```

### 3. 版本兼容性问题

**问题**：不同包版本不兼容

**解决方案**：确保所有 `@ktd-cesium/*` 包使用相同的版本：

```bash
pnpm add @ktd-cesium/core@latest @ktd-cesium/shared@latest @ktd-cesium/plugins@latest
```

## 下一步

- 查看 [快速开始](/guide/getting-started) 了解基本用法
- 探索 [Shared 包](/packages/shared/overview) 的工具函数
- 了解 [Core 包](/packages/core/overview) 的核心功能
