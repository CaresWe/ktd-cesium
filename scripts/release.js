#!/usr/bin/env node
/* eslint-disable no-console */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import enquirer from 'enquirer'
import chalk from 'chalk'
import semver from 'semver'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const rootDir = resolve(__dirname, '..')
const packagesDir = resolve(rootDir, 'packages')

// 需要更新版本号的包
const packages = ['core', 'shared', 'plugins']

/**
 * 读取 package.json
 */
function readPackageJson(pkgPath) {
  const content = readFileSync(pkgPath, 'utf-8')
  return JSON.parse(content)
}

/**
 * 写入 package.json
 */
function writePackageJson(pkgPath, pkgData) {
  writeFileSync(pkgPath, JSON.stringify(pkgData, null, 2) + '\n', 'utf-8')
}

/**
 * 获取当前版本号
 */
function getCurrentVersion() {
  const rootPkgPath = resolve(rootDir, 'package.json')
  const rootPkg = readPackageJson(rootPkgPath)
  return rootPkg.version
}

/**
 * 更新所有包的版本号
 */
function updateVersions(newVersion) {
  console.log(chalk.blue('\n📦 更新包版本号...\n'))

  // 更新根 package.json
  const rootPkgPath = resolve(rootDir, 'package.json')
  const rootPkg = readPackageJson(rootPkgPath)
  rootPkg.version = newVersion
  writePackageJson(rootPkgPath, rootPkg)
  console.log(chalk.green(`✓ 根 package.json: ${rootPkg.version}`))

  // 更新各个子包
  for (const pkg of packages) {
    const pkgPath = resolve(packagesDir, pkg, 'package.json')
    const pkgData = readPackageJson(pkgPath)
    pkgData.version = newVersion
    writePackageJson(pkgPath, pkgData)
    console.log(chalk.green(`✓ @ktd-cesium/${pkg}: ${newVersion}`))
  }

  console.log(chalk.green('\n✅ 版本号更新完成！\n'))
}

/**
 * 生成 changelog
 */
function generateChangelog() {
  console.log(chalk.blue('📝 生成 CHANGELOG...\n'))
  try {
    execSync('pnpm run changelog', { stdio: 'inherit', cwd: rootDir })
    console.log(chalk.green('\n✅ CHANGELOG 生成完成！\n'))
  } catch (error) {
    console.log(chalk.yellow('⚠️  CHANGELOG 生成失败，请手动执行 `pnpm run changelog`\n'))
  }
}

/**
 * 提交变更
 */
function commitChanges(version) {
  console.log(chalk.blue('📤 提交变更...\n'))
  try {
    execSync('git add .', { cwd: rootDir })
    execSync(`git commit -m "chore: release v${version}"`, { stdio: 'inherit', cwd: rootDir })
    console.log(chalk.green('\n✅ 变更已提交！\n'))
  } catch (error) {
    console.log(chalk.yellow('⚠️  提交失败，请手动提交变更\n'))
  }
}

/**
 * 创建标签
 */
function createTag(version) {
  console.log(chalk.blue('🏷️  创建 Git 标签...\n'))
  try {
    execSync(`git tag v${version}`, { cwd: rootDir })
    console.log(chalk.green(`✅ 标签 v${version} 已创建！\n`))
  } catch (error) {
    console.log(chalk.yellow('⚠️  标签创建失败\n'))
  }
}

/**
 * 主函数
 */
async function main() {
  console.log(chalk.cyan.bold('\n🚀 ktd-cesium 版本发布工具\n'))

  const currentVersion = getCurrentVersion()
  console.log(chalk.gray(`当前版本: ${currentVersion}\n`))

  // 询问新版本号
  const { releaseType } = await enquirer.prompt({
    type: 'select',
    name: 'releaseType',
    message: '选择发布类型:',
    choices: [
      { name: 'patch', message: `Patch (${semver.inc(currentVersion, 'patch')}) - 修复 bug` },
      { name: 'minor', message: `Minor (${semver.inc(currentVersion, 'minor')}) - 新增功能` },
      { name: 'major', message: `Major (${semver.inc(currentVersion, 'major')}) - 破坏性变更` },
      { name: 'custom', message: '自定义版本号' }
    ]
  })

  let newVersion
  if (releaseType === 'custom') {
    const result = await enquirer.prompt({
      type: 'input',
      name: 'version',
      message: '输入新版本号:',
      initial: currentVersion,
      validate: (input) => {
        if (!semver.valid(input)) {
          return '请输入有效的版本号 (如: 1.0.0)'
        }
        if (semver.lte(input, currentVersion)) {
          return '新版本号必须大于当前版本号'
        }
        return true
      }
    })
    newVersion = result.version
  } else {
    newVersion = semver.inc(currentVersion, releaseType)
  }

  // 确认发布
  const { confirm } = await enquirer.prompt({
    type: 'confirm',
    name: 'confirm',
    message: `确认发布版本 ${chalk.yellow(currentVersion)} → ${chalk.green(newVersion)}?`
  })

  if (!confirm) {
    console.log(chalk.red('\n❌ 发布已取消\n'))
    process.exit(0)
  }

  // 执行发布流程
  try {
    // 1. 更新版本号
    updateVersions(newVersion)

    // 2. 生成 changelog
    generateChangelog()

    // 3. 询问是否提交
    const { shouldCommit } = await enquirer.prompt({
      type: 'confirm',
      name: 'shouldCommit',
      message: '是否提交变更到 Git?',
      initial: true
    })

    if (shouldCommit) {
      commitChanges(newVersion)

      // 4. 询问是否创建标签
      const { shouldTag } = await enquirer.prompt({
        type: 'confirm',
        name: 'shouldTag',
        message: '是否创建 Git 标签?',
        initial: true
      })

      if (shouldTag) {
        createTag(newVersion)

        // 5. 询问是否推送
        const { shouldPush } = await enquirer.prompt({
          type: 'confirm',
          name: 'shouldPush',
          message: '是否推送到远程仓库?',
          initial: false
        })

        if (shouldPush) {
          console.log(chalk.blue('\n📤 推送到远程仓库...\n'))
          try {
            execSync('git push', { stdio: 'inherit', cwd: rootDir })
            execSync('git push --tags', { stdio: 'inherit', cwd: rootDir })
            console.log(chalk.green('\n✅ 推送成功！\n'))
          } catch (error) {
            console.log(chalk.red('\n❌ 推送失败\n'))
          }
        }
      }
    }

    console.log(chalk.green.bold(`\n🎉 版本 v${newVersion} 发布完成！\n`))

    // 显示后续操作提示
    if (!shouldCommit) {
      console.log(chalk.yellow('📋 后续操作:'))
      console.log(chalk.gray('  1. 检查变更内容'))
      console.log(chalk.gray('  2. git add .'))
      console.log(chalk.gray(`  3. git commit -m "chore: release v${newVersion}"`))
      console.log(chalk.gray(`  4. git tag v${newVersion}`))
      console.log(chalk.gray('  5. git push && git push --tags\n'))
    }
  } catch (error) {
    console.error(chalk.red('\n❌ 发布失败:\n'), error)
    process.exit(1)
  }
}

main().catch(console.error)
