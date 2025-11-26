#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs'
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

// 可用的包
const availablePackages = ['core', 'shared', 'plugins']

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
 * 获取包的当前版本
 */
function getPackageVersion(pkgName) {
  const pkgPath = resolve(packagesDir, pkgName, 'package.json')
  const pkgData = readPackageJson(pkgPath)
  return pkgData.version
}

/**
 * 更新包版本
 */
function updatePackageVersion(pkgName, newVersion) {
  const pkgPath = resolve(packagesDir, pkgName, 'package.json')
  const pkgData = readPackageJson(pkgPath)
  pkgData.version = newVersion
  writePackageJson(pkgPath, pkgData)
}

/**
 * 生成包的 CHANGELOG
 */
function generatePackageChangelog(pkgName) {
  console.log(chalk.blue(`\n📝 生成 @ktd-cesium/${pkgName} 的 CHANGELOG...\n`))

  const pkgDir = resolve(packagesDir, pkgName)
  const changelogPath = resolve(pkgDir, 'CHANGELOG.md')

  try {
    // 使用 conventional-changelog 生成变更日志，过滤该包相关的提交
    const cmd = `npx conventional-changelog -p angular -i CHANGELOG.md -s --commit-path . --lerna-package @ktd-cesium/${pkgName}`
    execSync(cmd, { cwd: pkgDir, stdio: 'inherit' })
    console.log(chalk.green(`✅ CHANGELOG 已生成: packages/${pkgName}/CHANGELOG.md\n`))
  } catch (error) {
    console.log(chalk.yellow('⚠️  CHANGELOG 生成失败，手动创建...\n'))

    // 如果 CHANGELOG 不存在，创建初始文件
    if (!existsSync(changelogPath)) {
      const initialChangelog = `# Changelog

All notable changes to @ktd-cesium/${pkgName} will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/lang/zh-CN/).
`
      writeFileSync(changelogPath, initialChangelog, 'utf-8')
      console.log(chalk.green(`✅ 已创建初始 CHANGELOG\n`))
    }
  }
}

/**
 * 提交包的变更
 */
function commitPackageChanges(pkgName, version) {
  console.log(chalk.blue('\n📤 提交变更...\n'))
  try {
    execSync('git add .', { cwd: rootDir })
    execSync(`git commit -m "chore(${pkgName}): release v${version}"`, {
      stdio: 'inherit',
      cwd: rootDir
    })
    console.log(chalk.green('\n✅ 变更已提交！\n'))
  } catch (error) {
    console.log(chalk.yellow('⚠️  提交失败，请手动提交变更\n'))
  }
}

/**
 * 创建包的标签
 */
function createPackageTag(pkgName, version) {
  console.log(chalk.blue('\n🏷️  创建 Git 标签...\n'))
  const tagName = `${pkgName}@${version}`
  try {
    execSync(`git tag ${tagName} -m "@ktd-cesium/${pkgName}@${version}"`, { cwd: rootDir })
    console.log(chalk.green(`✅ 标签 ${tagName} 已创建！\n`))
    return tagName
  } catch (error) {
    console.log(chalk.yellow('⚠️  标签创建失败\n'))
    return null
  }
}

/**
 * 获取包之间的依赖关系
 */
function getPackageDependencies(pkgName) {
  const pkgPath = resolve(packagesDir, pkgName, 'package.json')
  const pkgData = readPackageJson(pkgPath)
  const deps = []

  const allDeps = { ...pkgData.dependencies, ...pkgData.peerDependencies }
  for (const [name] of Object.entries(allDeps)) {
    if (name.startsWith('@ktd-cesium/')) {
      const depName = name.replace('@ktd-cesium/', '')
      if (availablePackages.includes(depName)) {
        deps.push(depName)
      }
    }
  }

  return deps
}

/**
 * 检查并更新依赖的包版本引用
 */
async function updateDependentPackages(pkgName, newVersion) {
  const dependents = []

  // 查找依赖当前包的其他包
  for (const otherPkg of availablePackages) {
    if (otherPkg === pkgName) continue

    const deps = getPackageDependencies(otherPkg)
    if (deps.includes(pkgName)) {
      dependents.push(otherPkg)
    }
  }

  if (dependents.length === 0) {
    return []
  }

  console.log(chalk.yellow(`\n⚠️  以下包依赖 @ktd-cesium/${pkgName}:`))
  dependents.forEach((dep) => {
    console.log(chalk.gray(`   - @ktd-cesium/${dep}`))
  })

  const { shouldUpdate } = await enquirer.prompt({
    type: 'confirm',
    name: 'shouldUpdate',
    message: '是否同时更新这些包的依赖版本?',
    initial: true
  })

  if (shouldUpdate) {
    const updated = []
    for (const depPkg of dependents) {
      const pkgPath = resolve(packagesDir, depPkg, 'package.json')
      const pkgData = readPackageJson(pkgPath)

      let changed = false
      const depKey = `@ktd-cesium/${pkgName}`

      if (pkgData.dependencies?.[depKey]) {
        pkgData.dependencies[depKey] = `^${newVersion}`
        changed = true
      }
      if (pkgData.peerDependencies?.[depKey]) {
        pkgData.peerDependencies[depKey] = `^${newVersion}`
        changed = true
      }

      if (changed) {
        writePackageJson(pkgPath, pkgData)
        updated.push(depPkg)
        console.log(chalk.green(`✓ 已更新 @ktd-cesium/${depPkg} 的依赖版本`))
      }
    }
    return updated
  }

  return []
}

/**
 * 主函数
 */
async function main() {
  console.log(chalk.cyan.bold('\n🚀 ktd-cesium 单包发布工具\n'))

  // 获取命令行参数
  const args = process.argv.slice(2)
  let selectedPackage = args[0]

  // 如果没有指定包，让用户选择
  if (!selectedPackage || !availablePackages.includes(selectedPackage)) {
    const { pkgName } = await enquirer.prompt({
      type: 'select',
      name: 'pkgName',
      message: '选择要发布的包:',
      choices: availablePackages.map((pkg) => ({
        name: pkg,
        message: `@ktd-cesium/${pkg}`
      }))
    })
    selectedPackage = pkgName
  }

  const currentVersion = getPackageVersion(selectedPackage)
  console.log(chalk.gray(`\n当前版本: @ktd-cesium/${selectedPackage}@${currentVersion}\n`))

  // 询问新版本号
  const { releaseType } = await enquirer.prompt({
    type: 'select',
    name: 'releaseType',
    message: '选择发布类型:',
    choices: [
      { name: 'patch', message: `Patch (${semver.inc(currentVersion, 'patch')}) - 修复 bug` },
      { name: 'minor', message: `Minor (${semver.inc(currentVersion, 'minor')}) - 新增功能` },
      { name: 'major', message: `Major (${semver.inc(currentVersion, 'major')}) - 破坏性变更` },
      { name: 'prerelease', message: `Prerelease (${semver.inc(currentVersion, 'prerelease', 'beta')}) - 预发布版本` },
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
    newVersion = semver.inc(currentVersion, releaseType, releaseType === 'prerelease' ? 'beta' : undefined)
  }

  // 确认发布
  const { confirm } = await enquirer.prompt({
    type: 'confirm',
    name: 'confirm',
    message: `确认发布 @ktd-cesium/${selectedPackage}: ${chalk.yellow(currentVersion)} → ${chalk.green(newVersion)}?`
  })

  if (!confirm) {
    console.log(chalk.red('\n❌ 发布已取消\n'))
    process.exit(0)
  }

  try {
    // 1. 更新包版本
    console.log(chalk.blue(`\n📦 更新 @ktd-cesium/${selectedPackage} 版本号...\n`))
    updatePackageVersion(selectedPackage, newVersion)
    console.log(chalk.green(`✓ @ktd-cesium/${selectedPackage}: ${newVersion}\n`))

    // 2. 检查并更新依赖的包
    const updatedPackages = await updateDependentPackages(selectedPackage, newVersion)

    // 3. 生成 CHANGELOG
    generatePackageChangelog(selectedPackage)

    // 4. 询问是否提交
    const { shouldCommit } = await enquirer.prompt({
      type: 'confirm',
      name: 'shouldCommit',
      message: '是否提交变更到 Git?',
      initial: true
    })

    if (shouldCommit) {
      commitPackageChanges(selectedPackage, newVersion)

      // 5. 询问是否创建标签
      const { shouldTag } = await enquirer.prompt({
        type: 'confirm',
        name: 'shouldTag',
        message: '是否创建 Git 标签?',
        initial: true
      })

      if (shouldTag) {
        const tagName = createPackageTag(selectedPackage, newVersion)

        // 6. 询问是否推送
        if (tagName) {
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
              execSync(`git push origin ${tagName}`, { stdio: 'inherit', cwd: rootDir })
              console.log(chalk.green('\n✅ 推送成功！\n'))
            } catch (error) {
              console.log(chalk.red('\n❌ 推送失败\n'))
            }
          }
        }
      }
    }

    console.log(chalk.green.bold(`\n🎉 @ktd-cesium/${selectedPackage}@${newVersion} 发布完成！\n`))

    // 显示后续操作提示
    if (!shouldCommit) {
      console.log(chalk.yellow('📋 后续操作:'))
      console.log(chalk.gray('  1. 检查变更内容'))
      console.log(chalk.gray('  2. git add .'))
      console.log(chalk.gray(`  3. git commit -m "chore(${selectedPackage}): release v${newVersion}"`))
      console.log(chalk.gray(`  4. git tag ${selectedPackage}@${newVersion}`))
      console.log(chalk.gray('  5. git push && git push --tags\n'))
    }

    if (updatedPackages.length > 0) {
      console.log(chalk.yellow('📋 依赖更新提示:'))
      console.log(chalk.gray(`  以下包的依赖版本已更新: ${updatedPackages.join(', ')}`))
      console.log(chalk.gray(`  建议运行 pnpm install 更新依赖\n`))
    }
  } catch (error) {
    console.error(chalk.red('\n❌ 发布失败:\n'), error)
    process.exit(1)
  }
}

main().catch(console.error)
