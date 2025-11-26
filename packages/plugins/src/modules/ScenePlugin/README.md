# ScenePlugin - 场景特效插件

场景特效插件提供丰富的天气和环境渲染功能，包括雨、雪、雾、闪电、高度雾、局部下雨等效果。

## 特性

- ✅ **雨效果** - 全屏雨效果，基于 WebGL 2.0 实现
- ✅ **雪效果** - 全屏雪效果，支持多层次雪花
- ✅ **雾效果** - 基于深度的雾效果
- ✅ **闪电效果** - 基于分形算法的真实闪电，支持与雨效果叠加
- ✅ **高度雾** - 基于高度的雾效果，适合山地场景
- ✅ **局部下雨** - 支持多边形和矩形区域的局部下雨效果

## 目录结构

```
ScenePlugin/
├── effects/              # 各类特效实现
│   ├── RainEffect.ts        # 雨效果
│   ├── SnowEffect.ts        # 雪效果
│   ├── FogEffect.ts         # 雾效果
│   ├── LightningEffect.ts   # 闪电效果
│   ├── HeightFogEffect.ts   # 高度雾效果
│   ├── LocalRainEffect.ts   # 局部下雨效果
│   └── index.ts             # 特效导出
├── types/                # 类型定义
│   └── index.ts             # 所有类型定义
├── index.ts              # 插件主文件
└── README.md             # 说明文档
```

## 快速开始

```typescript
import { KtdViewer } from '@ktd-cesium/core'
import { ScenePlugin } from '@ktd-cesium/plugins'

const viewer = new KtdViewer(cesiumViewer)
const scene = viewer.use(ScenePlugin)

// 添加雨效果
const rain = scene.addRain({ mixFactor: 0.5 })

// 添加闪电效果
const lightning = scene.addLightning({ mixFactor: 0.35 })

// 添加局部下雨（多边形区域）
const localRain = scene.addLocalRain({
  positions: [
    [116.0, 39.5],
    [117.0, 39.5],
    [117.0, 40.5],
    [116.0, 40.5]
  ],
  dropCount: 5000
})

// 或使用矩形区域
const localRain2 = scene.addLocalRain({
  minLongitude: 116.0,
  minLatitude: 39.5,
  maxLongitude: 117.0,
  maxLatitude: 40.5,
  dropCount: 5000
})
```

## 效果实现原理

### 后期处理效果（PostProcessStage）

雨、雪、雾、闪电、高度雾效果基于 Cesium 的 PostProcessStage 实现：

1. **RainEffect**: 使用 GLSL 着色器模拟雨滴运动
2. **SnowEffect**: 使用分形噪声生成多层次雪花
3. **FogEffect**: 基于深度纹理实现距离雾
4. **LightningEffect**: 使用分形算法生成真实的闪电路径
5. **HeightFogEffect**: 基于相机高度和像素高度计算雾浓度

### Billboard 效果

局部下雨效果基于 Cesium 的 BillboardCollection 实现：

1. 支持多边形和矩形两种区域定义方式
2. 使用**射线法**判断点是否在多边形内
3. 在指定区域内随机生成雨滴位置（确保在多边形内）
4. 使用 Billboard 渲染雨滴
5. 每帧更新雨滴高度，实现下落动画
6. 雨滴落地后重置到随机高度

**多边形判断算法（Ray Casting）**：
- 从测试点向右侧发射一条射线
- 统计射线与多边形边的交点数
- 交点数为奇数时点在多边形内，偶数时在多边形外

## 参考来源

本插件参考了以下开源项目和示例：

- [Cesium-Examples](https://github.com/jiawanlong/Cesium-Examples) - 雨雪雾、闪电、高度雾、局部下雨示例
- Cesium 官方 PostProcessStage 文档

## 版本历史

- v1.0.0 - 初始版本，实现 6 种场景特效

## 作者

ktd-cesium 团队

## 许可

MIT License
