# 工作流指南

本文档介绍 Auto-Cesium 项目的所有 GitHub Actions 工作流配置和使用方法。

## 工作流概览

项目配置了以下自动化工作流：

| 工作流                                                 | 触发条件  | 功能描述                    |
| ------------------------------------------------------ | --------- | --------------------------- |
| [CI](./workflows#ci)                                   | Push/PR   | 代码质量检查和构建验证      |
| [Deploy Docs](./workflows#deploy-docs)                 | Push main | 自动部署文档到 GitHub Pages |
| [Release](./workflows#release)                         | 手动/标签 | 发布包到 NPM                |
| [Dependency Review](./workflows#dependency-review)     | PR        | 依赖安全审查                |
| [Tag Release](./workflows#tag-release)                 | 手动      | 创建发布标签                |
| [Workflow Validation](./workflows#workflow-validation) | Push/PR   | 工作流配置验证              |

## CI (持续集成)

### 触发条件

- 推送到 `main` 或 `develop` 分支
- 创建针对这些分支的拉取请求

### 执行内容

- 代码质量检查（ESLint、Prettier、Stylelint）
- TypeScript 类型检查
- 单元测试（如果存在）
- 构建所有包
- 构建文档

### 失败处理

如果 CI 失败，请检查：

1. 代码是否有语法错误
2. 类型检查是否通过
3. 代码格式是否符合规范
4. 构建是否成功

## Deploy Docs (文档部署)

### 触发条件

- 推送到 `main` 分支
- 对文档文件进行修改的拉取请求（仅构建检查）

### 执行内容

- 安装依赖
- 构建 VitePress 文档
- 检查构建产物
- 部署到 GitHub Pages

### 配置要求

需要在仓库设置中启用 GitHub Pages：

1. 进入 Settings → Pages
2. Source 选择 "GitHub Actions"

### 手动触发

可以手动触发文档部署：

1. 进入 Actions 标签页
2. 选择 "Deploy Docs" 工作流
3. 点击 "Run workflow"

## Release (发布)

### 触发条件

- 手动触发
- 推送版本标签（如 `v1.2.3`）

### 执行内容

- 代码质量和构建检查
- 发布包到 NPM
- 生成变更日志
- 创建 GitHub Release

### 所需配置

需要配置以下 secrets：

- `NPM_TOKEN`: NPM 发布令牌

### 手动发布步骤

1. **准备发布**

   ```bash
   # 更新版本号和变更日志
   pnpm release
   ```

2. **触发发布工作流**
   - 进入 Actions 标签页
   - 选择 "Release" 工作流
   - 点击 "Run workflow"
   - 选择发布类型：
     - `patch`: 补丁版本 (1.0.0 → 1.0.1)
     - `minor`: 小版本 (1.0.0 → 1.1.0)
     - `major`: 大版本 (1.0.0 → 2.0.0)
     - `prerelease`: 预发布版本

3. **验证发布**
   - 检查 NPM 包是否发布成功
   - 验证 GitHub Release 是否创建
   - 确认文档是否更新

## Dependency Review (依赖审查)

### 触发条件

- 创建或更新拉取请求

### 执行内容

- 检查依赖的许可证兼容性
- 扫描已知的安全漏洞
- 验证依赖项的健康状况

### 配置

允许的许可证类型：

- MIT
- BSD-3-Clause
- BSD-2-Clause
- Apache-2.0
- ISC
- CC0-1.0

## Tag Release (标签创建)

### 触发条件

- 手动触发

### 执行内容

- 验证版本号格式
- 检查标签是否已存在
- 创建带注解的 Git 标签
- 推送到仓库

### 使用方法

```bash
# 格式: v{major}.{minor}.{patch}[-{prerelease}]
# 示例: v1.2.3, v2.0.0-beta.1
```

## Workflow Validation (工作流验证)

### 触发条件

- 修改工作流配置文件时

### 执行内容

- YAML 语法验证
- 工作流配置检查
- 依赖关系验证

## 故障排除

### 工作流不触发

1. 检查触发条件是否满足
2. 确认分支名称正确
3. 检查文件路径模式匹配

### 权限错误

1. 确认 repository secrets 已配置
2. 检查 GITHUB_TOKEN 权限
3. 验证分支保护规则

### 构建失败

1. 查看详细的错误日志
2. 检查依赖版本兼容性
3. 验证环境配置

### 发布失败

1. 检查 NPM_TOKEN 是否有效
2. 确认包版本号未重复
3. 验证构建产物完整性

## 自定义配置

### 添加新的工作流

1. 在 `.github/workflows/` 目录创建新的 YAML 文件
2. 遵循现有的命名约定
3. 添加适当的触发条件和权限
4. 测试工作流配置

### 修改现有工作流

1. 编辑相应的 YAML 文件
2. 验证语法正确性
3. 测试更改效果
4. 更新本文档

## 最佳实践

### 工作流设计

- 使用有意义的名称和描述
- 添加适当的超时设置
- 合理使用缓存
- 提供清晰的错误信息

### 安全考虑

- 不要在日志中输出敏感信息
- 使用最小权限原则
- 定期轮换访问令牌

### 性能优化

- 合理使用缓存
- 并行执行独立任务
- 避免不必要的步骤

---

如果遇到工作流相关的问题，请查看 [Actions](../../actions) 页面获取详细日志，或在 Issues 中提出问题。
