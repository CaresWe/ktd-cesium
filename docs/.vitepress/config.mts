import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'KTD-Cesium',
  description: 'Cesium 二次封装库',
  base: '/',

  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/introduction' },
      { text: 'Shared', link: '/packages/shared/overview' },
      { text: 'Core', link: '/packages/core/overview' },
      { text: 'Plugins', link: '/packages/plugins/overview' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            { text: '介绍', link: '/guide/introduction' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装', link: '/guide/installation' },
          ]
        }
      ],

      '/packages/shared/': [
        {
          text: 'Shared 包',
          items: [
            { text: '概述', link: '/packages/shared/overview' },
            { text: '坐标转换', link: '/packages/shared/coordinate' },
            { text: '数学计算', link: '/packages/shared/math' },
            { text: '颜色处理', link: '/packages/shared/color' },
            { text: '格式化', link: '/packages/shared/format' },
          ]
        }
      ],

      '/packages/core/': [
        {
          text: 'Core 包',
          items: [
            { text: '概述', link: '/packages/core/overview' },
            { text: 'KtdViewer', link: '/packages/core/viewer' },
          ]
        }
      ],

      '/packages/plugins/': [
        {
          text: 'Plugins 包',
          items: [
            { text: '概述', link: '/packages/plugins/overview' },
            { text: 'BasePlugin', link: '/packages/plugins/base-plugin' },
            { text: 'BaseLayerPlugin', link: '/packages/plugins/base-layer' },
            { text: 'CameraPlugin', link: '/packages/plugins/camera' },
            { text: 'DataLayerPlugin', link: '/packages/plugins/data-layer' },
            { text: 'EventPlugin', link: '/packages/plugins/event' },
            { text: 'PopupPlugin', link: '/packages/plugins/popup' },
          ]
        }
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-repo/ktd-cesium' }
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
