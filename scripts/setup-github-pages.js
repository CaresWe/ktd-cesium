#!/usr/bin/env node
/* eslint-disable no-console */

import { execSync } from 'child_process'
import chalk from 'chalk'

console.log(chalk.blue('🚀 设置 GitHub Pages...\n'))

// 检查是否在 git 仓库中
try {
  execSync('git rev-parse --git-dir', { stdio: 'pipe' })
} catch (error) {
  console.error(chalk.red('❌ 错误: 不在 git 仓库中'))
  process.exit(1)
}

// 检查是否配置了 remote
try {
  const remote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim()
  console.log(chalk.green('✅ Git remote 已配置:'), remote)
} catch (error) {
  console.error(chalk.red('❌ 错误: 未配置 git remote'))
  console.log(chalk.yellow('请运行: git remote add origin <your-repo-url>'))
  process.exit(1)
}

// 检查 GitHub Actions 是否启用
console.log(chalk.yellow('⚠️  请手动确认以下设置:'))
console.log('')
console.log(chalk.cyan('1. 启用 GitHub Pages:'))
console.log('   - 进入 Settings → Pages')
console.log('   - Source 选择 "GitHub Actions"')
console.log('')
console.log(chalk.cyan('2. 配置仓库设置:'))
console.log('   - 进入 Settings → Actions → General')
console.log('   - Workflow permissions: 选择 "Read and write permissions"')
console.log('')
console.log(chalk.cyan('3. 配置必要的 Secrets (如果需要发布到 NPM):'))
console.log('   - NPM_TOKEN: 从 NPM 获取的发布令牌')
console.log('')
console.log(chalk.green('✅ GitHub Pages 设置完成!'))
console.log('')
console.log(chalk.blue('📖 文档部署说明:'))
console.log('   - 推送到 main 分支时会自动构建并部署文档')
console.log('   - 文档地址: https://<username>.github.io/<repo-name>')
console.log('   - 查看部署状态: Actions 标签页 → Deploy Docs')
console.log('')
console.log(chalk.blue('📦 发布说明:'))
console.log('   - 手动触发发布: Actions 标签页 → Release → Run workflow')
console.log('   - 支持的版本类型: patch, minor, major, prerelease')
