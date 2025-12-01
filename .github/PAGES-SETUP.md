# GitHub Pages 设置指南

本指南将帮助你设置 Auto-Cesium 项目的 GitHub Pages，用于自动部署项目文档。

## 前置条件

- [x] 项目已推送到 GitHub
- [x] 启用了 GitHub Actions
- [x] 项目配置正确（依赖、构建脚本等）

## 自动设置

运行以下命令进行自动设置：

```bash
pnpm setup:github-pages
```

这个脚本会检查你的 git 配置并提供设置指导。

## 手动设置步骤

### 1. 启用 GitHub Pages

1. 进入你的 GitHub 仓库
2. 点击 **Settings** 标签页
3. 在左侧菜单中找到 **Pages**
4. 在 **Source** 部分选择 **GitHub Actions**

![GitHub Pages 设置](https://docs.github.com/assets/cb-34573/images/help/pages/enable-pages-github-actions.png)

### 2. 配置 Actions 权限

1. 在仓库 **Settings** 中
2. 点击左侧的 **Actions** → **General**
3. 在 **Workflow permissions** 部分选择 **Read and write permissions**

![Actions 权限设置](https://docs.github.com/assets/cb-25005/images/help/settings/actions-workflow-permissions.png)

### 3. 配置 NPM 发布（可选）

如果需要发布包到 NPM，需要配置以下 secret：

1. 在仓库 **Settings** 中
2. 点击左侧的 **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. 添加 `NPM_TOKEN`：
   - Name: `NPM_TOKEN`
   - Value: 从 [NPM 网站](https://www.npmjs.com/) 获取的 Access Token

## 工作流配置

项目已配置以下工作流：

### Deploy Docs (文档部署)

- **触发条件**: 推送到 `main` 分支
- **功能**: 自动构建并部署文档到 GitHub Pages
- **产物**: `https://<username>.github.io/<repo-name>`

### Release (发布)

- **触发条件**: 手动触发或推送版本标签
- **功能**: 发布包到 NPM 并创建 GitHub Release
- **要求**: 配置 `NPM_TOKEN` secret

### CI (持续集成)

- **触发条件**: 所有推送和 PR
- **功能**: 代码质量检查、类型检查、构建验证

## 验证设置

### 触发文档部署

1. 对 `docs/` 目录进行任何修改
2. 推送到 `main` 分支
3. 进入 **Actions** 标签页查看部署进度
4. 部署成功后访问 `https://<username>.github.io/<repo-name>`

### 触发发布

1. 进入 **Actions** 标签页
2. 选择 **Release** 工作流
3. 点击 **Run workflow**
4. 选择发布类型（patch/minor/major/prerelease）
5. 等待发布完成

## 故障排除

### 文档部署失败

1. 检查 **Actions** 标签页的详细日志
2. 确认构建脚本正确：`pnpm docs:build`
3. 验证 VitePress 配置正确
4. 检查是否有语法错误

### 发布失败

1. 确认 `NPM_TOKEN` 配置正确
2. 检查包版本号是否重复
3. 验证构建产物完整

### 权限错误

1. 确认 Actions 权限设置为 "Read and write"
2. 检查分支保护规则
3. 验证 repository secrets 配置

## 自定义配置

### 修改文档构建配置

编辑 `docs/.vitepress/config.mts`：

```typescript
export default defineConfig({
  base: '/your-repo-name/' // 修改为你的仓库名
  // ... 其他配置
})
```

### 修改工作流配置

编辑 `.github/workflows/deploy-docs.yml`：

```yaml
on:
  push:
    branches:
      - main # 修改触发分支
```

## 相关链接

- [GitHub Pages 文档](https://docs.github.com/en/pages)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [VitePress 部署指南](https://vitepress.dev/guide/deploy)

---

如果设置过程中遇到问题，请查看 [工作流指南](../docs/guide/workflows.md) 或提交 Issue。
