# 版本管理脚本

## 概述

本目录包含 ktd-cesium monorepo 的版本管理和发布脚本。

## release.js - 全量发布

自动化版本发布脚本，用于统一发布所有包，支持：

- 统一更新所有 packages 的版本号
- 自动生成根目录 CHANGELOG
- 提交变更到 Git
- 创建版本标签（格式：v1.0.0）
- 推送到远程仓库

### 使用方法

```bash
# 交互式发布所有包
pnpm release
```

### 适用场景

- 项目初次发布
- 所有包需要同步升级
- 发布重大版本更新

### 发布流程

1. **选择发布类型**:
   - `patch` - 修复 bug (1.0.0 → 1.0.1)
   - `minor` - 新增功能 (1.0.0 → 1.1.0)
   - `major` - 破坏性变更 (1.0.0 → 2.0.0)
   - `custom` - 自定义版本号

2. **确认版本号**: 脚本会显示当前版本和新版本，确认是否继续

3. **更新版本**: 自动更新根 package.json 和所有子包的版本号

4. **生成 CHANGELOG**: 基于 conventional commits 自动生成变更日志

5. **提交变更**: 可选择是否提交到 Git

6. **创建标签**: 可选择是否创建 Git 标签 (v1.0.0)

7. **推送远程**: 可选择是否推送到远程仓库

### 示例

```bash
$ pnpm release

🚀 ktd-cesium 版本发布工具

当前版本: 1.0.0

? 选择发布类型: (Use arrow keys)
❯ Patch (1.0.1) - 修复 bug
  Minor (1.1.0) - 新增功能
  Major (2.0.0) - 破坏性变更
  自定义版本号

? 确认发布版本 1.0.0 → 1.0.1? (y/N)

📦 更新包版本号...
✓ 根 package.json: 1.0.1
✓ @ktd-cesium/core: 1.0.1
✓ @ktd-cesium/shared: 1.0.1
✓ @ktd-cesium/plugins: 1.0.1

✅ 版本号更新完成！

📝 生成 CHANGELOG...
✅ CHANGELOG 生成完成！

? 是否提交变更到 Git? (Y/n)
📤 提交变更...
✅ 变更已提交！

? 是否创建 Git 标签? (Y/n)
🏷️  创建 Git 标签...
✅ 标签 v1.0.1 已创建！

? 是否推送到远程仓库? (y/N)

🎉 版本 v1.0.1 发布完成！
```

## release-package.js - 单包发布

独立发布单个包的脚本，支持：

- 独立更新指定包的版本号
- 自动检测并更新依赖该包的其他包
- 为单个包生成独立的 CHANGELOG
- 提交变更到 Git
- 创建包级别标签（格式：core@1.0.0）
- 推送到远程仓库

### 使用方法

```bash
# 交互式选择要发布的包
pnpm release:pkg

# 或直接指定包名
pnpm release:pkg core
pnpm release:pkg shared
pnpm release:pkg plugins
```

### 适用场景

- 单个包有 bug 修复或新功能
- 需要独立发布某个包
- 包版本需要独立管理

### 发布流程

1. **选择包**: 选择要发布的包（core/shared/plugins）
2. **选择发布类型**:
   - `patch` - 修复 bug (1.0.0 → 1.0.1)
   - `minor` - 新增功能 (1.0.0 → 1.1.0)
   - `major` - 破坏性变更 (1.0.0 → 2.0.0)
   - `prerelease` - 预发布版本 (1.0.0 → 1.0.1-beta.0)
   - `custom` - 自定义版本号
3. **确认版本号**: 显示当前版本和新版本
4. **更新版本**: 更新目标包的版本号
5. **更新依赖**: 检查并可选更新依赖该包的其他包
6. **生成 CHANGELOG**: 为目标包生成独立的 CHANGELOG.md
7. **提交变更**: 可选提交到 Git（提交信息格式：`chore(core): release v1.0.1`）
8. **创建标签**: 可选创建包级别标签（格式：`core@1.0.1`）
9. **推送远程**: 可选推送到远程仓库

### 示例

```bash
$ pnpm release:pkg

🚀 ktd-cesium 单包发布工具

? 选择要发布的包:
❯ @ktd-cesium/core
  @ktd-cesium/shared
  @ktd-cesium/plugins

当前版本: @ktd-cesium/plugins@1.0.0

? 选择发布类型: (Use arrow keys)
❯ Patch (1.0.1) - 修复 bug
  Minor (1.1.0) - 新增功能
  Major (2.0.0) - 破坏性变更
  Prerelease (1.0.1-beta.0) - 预发布版本
  自定义版本号

? 确认发布 @ktd-cesium/plugins: 1.0.0 → 1.0.1? (y/N)

📦 更新 @ktd-cesium/plugins 版本号...
✓ @ktd-cesium/plugins: 1.0.1

📝 生成 @ktd-cesium/plugins 的 CHANGELOG...
✅ CHANGELOG 已生成: packages/plugins/CHANGELOG.md

? 是否提交变更到 Git? (Y/n)
📤 提交变更...
✅ 变更已提交！

? 是否创建 Git 标签? (Y/n)
🏷️  创建 Git 标签...
✅ 标签 plugins@1.0.1 已创建！

? 是否推送到远程仓库? (y/N)

🎉 @ktd-cesium/plugins@1.0.1 发布完成！
```

### 依赖管理

当发布的包被其他包依赖时，脚本会自动检测并询问是否更新依赖版本：

```bash
⚠️  以下包依赖 @ktd-cesium/core:
   - @ktd-cesium/plugins

? 是否同时更新这些包的依赖版本? (Y/n)

✓ 已更新 @ktd-cesium/plugins 的依赖版本

📋 依赖更新提示:
  以下包的依赖版本已更新: plugins
  建议运行 pnpm install 更新依赖
```

### 包级别 CHANGELOG

每个包都有独立的 CHANGELOG.md：

- `packages/core/CHANGELOG.md`
- `packages/shared/CHANGELOG.md`
- `packages/plugins/CHANGELOG.md`

变更日志会根据 Git 提交历史中该包的 scope 自动生成：

```bash
# 这些提交会被记录到对应包的 CHANGELOG
git commit -m "feat(core): 新增核心功能"      # → packages/core/CHANGELOG.md
git commit -m "fix(plugins): 修复插件 bug"   # → packages/plugins/CHANGELOG.md
git commit -m "docs(shared): 更新文档"       # → packages/shared/CHANGELOG.md
```

## CHANGELOG 生成

### 手动生成

```bash
pnpm changelog
```

这会基于 Git 提交历史生成 CHANGELOG.md 文件。

### Commit 规范

为了正确生成 CHANGELOG，请遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type 类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档变更
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具变动
- `revert`: 回退
- `build`: 打包

#### 示例

```bash
# 使用交互式提交工具（推荐）
pnpm commit

# 或手动编写
git commit -m "feat(plugins): 添加相机视锥体可视化功能"
git commit -m "fix(core): 修复相机飞行时的高度计算问题"
git commit -m "docs: 更新相机插件文档"
```

## release-it 配置

项目根目录的 `.release-it.json` 包含 release-it 的配置：

```json
{
  "plugins": {
    "@release-it/conventional-changelog": {
      "preset": "angular",
      "infile": "CHANGELOG.md"
    }
  }
}
```

## 注意事项

1. **版本一致性**: 脚本会自动保持所有包的版本号一致
2. **Git 状态**: 发布前请确保没有未提交的重要变更
3. **Commit 规范**: 遵循 conventional commits 以正确生成 CHANGELOG
4. **测试**: 发布前建议运行 `pnpm lint` 和 `pnpm type-check`
5. **权限**: 推送到远程仓库需要相应的 Git 权限

## 发布策略对比

| 特性      | 全量发布 (release.js) | 单包发布 (release-package.js) |
| --------- | --------------------- | ----------------------------- |
| 命令      | `pnpm release`        | `pnpm release:pkg [包名]`     |
| 版本号    | 所有包统一版本        | 单个包独立版本                |
| CHANGELOG | 根目录 CHANGELOG.md   | 包目录 CHANGELOG.md           |
| Git 标签  | v1.0.0                | core@1.0.0, plugins@1.0.1     |
| 适用场景  | 重大版本、初次发布    | 单包更新、独立发布            |
| 依赖管理  | 自动同步              | 可选更新依赖包                |

## 相关命令

```bash
# 代码检查
pnpm lint

# 类型检查
pnpm type-check

# 构建所有包
pnpm build

# 交互式提交
pnpm commit

# 生成根 CHANGELOG
pnpm changelog

# 发布所有包（统一版本）
pnpm release

# 发布单个包（独立版本）
pnpm release:pkg
pnpm release:pkg core
pnpm release:pkg shared
pnpm release:pkg plugins
```

## 最佳实践

### 1. 提交规范

使用 scope 明确指定变更所属的包：

```bash
# 正确 ✅
git commit -m "feat(plugins): 添加相机视锥体功能"
git commit -m "fix(core): 修复高度计算错误"
git commit -m "docs(shared): 更新工具函数文档"

# 不推荐 ❌
git commit -m "feat: 添加新功能"  # 没有 scope，无法归类到具体包
```

### 2. 版本发布选择

**使用全量发布 (`pnpm release`)：**

- ✅ 项目初次发布
- ✅ 所有包需要同步更新
- ✅ 发布重大版本（如 2.0.0）
- ✅ 多个包有相互关联的改动

**使用单包发布 (`pnpm release:pkg`)：**

- ✅ 单个包的 bug 修复
- ✅ 单个包的功能增强
- ✅ 包之间版本需要独立管理
- ✅ 只需要发布某个包的预发布版本

### 3. 依赖版本管理

当使用单包发布时，如果包 A 依赖包 B：

1. 发布包 B 后，脚本会提示是否更新包 A 的依赖版本
2. 建议选择 "是"，保持依赖版本最新
3. 发布完成后运行 `pnpm install` 更新锁文件

### 4. Git 标签命名

- 全量发布标签：`v1.0.0`
- 单包发布标签：`core@1.0.1`, `plugins@1.2.0`
- 预发布标签：`plugins@1.0.1-beta.0`

### 5. CHANGELOG 维护

- 根目录 `CHANGELOG.md` - 记录整体项目变更
- 包目录 `CHANGELOG.md` - 记录具体包的变更
- 基于 conventional commits 自动生成
- 发布前可手动编辑补充细节
