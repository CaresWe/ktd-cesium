import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'KTD-Cesium',
  description: 'Cesium 二次封装库',
  base: '/',

  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/introduction' },
      { text: '地图公共方法包', link: '/packages/shared/overview' },
      { text: '核心包', link: '/packages/core/overview' },
      { text: '插件', link: '/packages/plugins/overview' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            { text: '介绍', link: '/guide/introduction' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装', link: '/guide/installation' },
            { text: '最佳实践', link: '/guide/best-practices' },
            { text: '常见问题', link: '/guide/faq' },
          ]
        }
      ],

      '/packages/shared/': [
        {
          text: '地图公共方法包',
          items: [
            { text: '概述', link: '/packages/shared/overview' },
            { text: '坐标转换', link: '/packages/shared/coordinate' },
            { text: '坐标转换（国内坐标系）', link: '/packages/shared/coordinate-transform' },
            { text: '数学计算', link: '/packages/shared/math' },
            { text: '颜色处理', link: '/packages/shared/color' },
            { text: '格式化', link: '/packages/shared/format' },
            { text: '工具函数', link: '/packages/shared/utils' },
            { text: '位置处理', link: '/packages/shared/position' },
            { text: '曲线处理', link: '/packages/shared/curve' },
            { text: '几何计算', link: '/packages/shared/geometry' },
            { text: 'Cesium 工具', link: '/packages/shared/cesium' },
            { text: '军标图形', link: '/packages/shared/military-symbols' },
          ]
        }
      ],

      '/packages/core/': [
        {
          text: '核心包',
          items: [
            { text: '概述', link: '/packages/core/overview' },
            { text: 'KtdViewer', link: '/packages/core/viewer' },
          ]
        }
      ],

      '/packages/plugins/': [
        {
          text: '插件包',
          items: [
            { text: '概述', link: '/packages/plugins/overview' },
            { text: '基础插件', link: '/packages/plugins/base-plugin' },
            { text: '底图图层插件', link: '/packages/plugins/base-layer' },
            { text: '相机插件', link: '/packages/plugins/camera' },
            { text: '数据图层插件', link: '/packages/plugins/data-layer' },
            { text: '地图事件插件', link: '/packages/plugins/event' },
            { text: '图形插件', link: '/packages/plugins/graphics' },
            { text: '地图弹窗插件', link: '/packages/plugins/popup' },
            { text: '提示框插件', link: '/packages/plugins/tooptip' },
            { text: '变换插件', link: '/packages/plugins/transform' },
            { text: '分析插件', link: '/packages/plugins/analysis' },
            { text: '材质插件', link: '/packages/plugins/material' },
          ]
        }
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-repo/auto-cesium' }
    ],

    search: {
      provider: 'local'
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present'
    }
  }
})
