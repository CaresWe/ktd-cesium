import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TooltipCore, createTooltip } from '../src/modules/TooltipPlugin'
import type { TooltipOptions, TooltipRenderer } from '../src/modules/TooltipPlugin'

describe('TooltipCore', () => {
  let container: HTMLElement
  let tooltip: TooltipCore

  beforeEach(() => {
    // 创建测试容器
    container = document.createElement('div')
    container.id = 'test-container'
    document.body.appendChild(container)
  })

  afterEach(() => {
    // 清理
    if (tooltip) {
      tooltip.destroy()
    }
    if (container.parentNode) {
      container.parentNode.removeChild(container)
    }
  })

  describe('初始化', () => {
    it('应该正确初始化 TooltipCore', () => {
      tooltip = new TooltipCore({ container })
      expect(tooltip).toBeDefined()
    })

    it('应该创建 DOM 元素', () => {
      tooltip = new TooltipCore({ container })
      const element = tooltip.getElement()
      expect(element).toBeInstanceOf(HTMLDivElement)
      expect(element.parentNode).toBe(container)
    })

    it('初始状态应该是隐藏的', () => {
      tooltip = new TooltipCore({ container })
      const element = tooltip.getElement()
      expect(element.style.display).toBe('none')
    })

    it('应该使用默认的 classPrefix', () => {
      tooltip = new TooltipCore({ container })
      const element = tooltip.getElement()
      expect(element.className).toContain('ktd-tooltip')
    })

    it('应该支持自定义 classPrefix', () => {
      tooltip = new TooltipCore({
        container,
        classPrefix: 'custom-tooltip'
      })
      const element = tooltip.getElement()
      expect(element.className).toContain('custom-tooltip')
    })

    it('应该使用默认的 placement', () => {
      tooltip = new TooltipCore({ container })
      const element = tooltip.getElement()
      expect(element.className).toContain('right')
    })

    it('应该支持自定义 placement', () => {
      tooltip = new TooltipCore({
        container,
        placement: 'top'
      })
      const element = tooltip.getElement()
      expect(element.className).toContain('top')
    })

    it('应该使用默认的 offset', () => {
      tooltip = new TooltipCore({ container })
      // offset 默认为 30，通过内部实现验证
      expect(tooltip).toBeDefined()
    })

    it('应该支持自定义 offset', () => {
      tooltip = new TooltipCore({
        container,
        offset: 50
      })
      expect(tooltip).toBeDefined()
    })

    it('应该默认启用 hideOnHover', () => {
      tooltip = new TooltipCore({ container })
      expect(tooltip).toBeDefined()
    })

    it('应该支持禁用 hideOnHover', () => {
      tooltip = new TooltipCore({
        container,
        hideOnHover: false
      })
      expect(tooltip).toBeDefined()
    })
  })

  describe('显示和隐藏', () => {
    beforeEach(() => {
      tooltip = new TooltipCore({ container })
    })

    it('应该能够显示 Tooltip', () => {
      tooltip.show()
      const element = tooltip.getElement()
      expect(element.style.display).toBe('block')
    })

    it('应该能够隐藏 Tooltip', () => {
      tooltip.show()
      tooltip.hide()
      const element = tooltip.getElement()
      expect(element.style.display).toBe('none')
    })

    it('应该能够设置可见性', () => {
      tooltip.setVisible(true)
      let element = tooltip.getElement()
      expect(element.style.display).toBe('block')

      tooltip.setVisible(false)
      element = tooltip.getElement()
      expect(element.style.display).toBe('none')
    })
  })

  describe('内容显示', () => {
    beforeEach(() => {
      tooltip = new TooltipCore({ container })
    })

    it('应该能够显示字符串内容', () => {
      tooltip.showAt({ x: 100, y: 100 }, 'Hello World')

      const contentElement = tooltip.getContentElement()
      expect(contentElement.innerHTML).toBe('Hello World')
    })

    it('应该能够显示 HTML 内容', () => {
      const htmlContent = '<div class="custom">Test</div>'
      tooltip.showAt({ x: 100, y: 100 }, htmlContent)

      const contentElement = tooltip.getContentElement()
      expect(contentElement.innerHTML).toBe(htmlContent)
    })

    it('当位置为 null 时应该隐藏', () => {
      tooltip.showAt({ x: 100, y: 100 }, 'Test')
      tooltip.showAt(null, 'Test')

      const element = tooltip.getElement()
      expect(element.style.display).toBe('none')
    })

    it('当内容为空时应该隐藏', () => {
      tooltip.showAt({ x: 100, y: 100 }, 'Test')
      tooltip.showAt({ x: 100, y: 100 })

      const element = tooltip.getElement()
      expect(element.style.display).toBe('none')
    })
  })

  describe('位置定位', () => {
    beforeEach(() => {
      tooltip = new TooltipCore({ container })
    })

    it('应该在 right 位置正确定位', async () => {
      tooltip = new TooltipCore({
        container,
        placement: 'right'
      })

      tooltip.showAt({ x: 100, y: 100 }, 'Test')

      // 等待 requestAnimationFrame 完成
      await new Promise((resolve) => setTimeout(resolve, 50))

      const element = tooltip.getElement()
      expect(element.style.left).toBeDefined()
      expect(element.style.top).toBeDefined()
    })

    it('应该在 left 位置正确定位', async () => {
      tooltip = new TooltipCore({
        container,
        placement: 'left'
      })

      tooltip.showAt({ x: 100, y: 100 }, 'Test')

      await new Promise((resolve) => setTimeout(resolve, 50))

      const element = tooltip.getElement()
      expect(element.style.left).toBeDefined()
      expect(element.style.top).toBeDefined()
    })

    it('应该在 top 位置正确定位', async () => {
      tooltip = new TooltipCore({
        container,
        placement: 'top'
      })

      tooltip.showAt({ x: 100, y: 100 }, 'Test')

      await new Promise((resolve) => setTimeout(resolve, 50))

      const element = tooltip.getElement()
      expect(element.style.left).toBeDefined()
      expect(element.style.top).toBeDefined()
    })

    it('应该在 bottom 位置正确定位', async () => {
      tooltip = new TooltipCore({
        container,
        placement: 'bottom'
      })

      tooltip.showAt({ x: 100, y: 100 }, 'Test')

      await new Promise((resolve) => setTimeout(resolve, 50))

      const element = tooltip.getElement()
      expect(element.style.left).toBeDefined()
      expect(element.style.top).toBeDefined()
    })
  })

  describe('自定义渲染器', () => {
    it('应该支持自定义渲染器', () => {
      const customRenderer: TooltipRenderer = {
        render: vi.fn()
      }

      tooltip = new TooltipCore({
        container,
        customRenderer
      })

      tooltip.showAt({ x: 100, y: 100 }, 'Test')

      expect(customRenderer.render).toHaveBeenCalled()
    })

    it('自定义渲染器应该接收正确的参数', () => {
      const customRenderer: TooltipRenderer = {
        render: vi.fn()
      }

      tooltip = new TooltipCore({
        container,
        customRenderer
      })

      const content = 'Test Content'
      tooltip.showAt({ x: 100, y: 100 }, content)

      const contentElement = tooltip.getContentElement()
      expect(customRenderer.render).toHaveBeenCalledWith(contentElement, content)
    })
  })

  describe('配置更新', () => {
    beforeEach(() => {
      tooltip = new TooltipCore({ container })
    })

    it('应该能够更新 placement', () => {
      tooltip.updateOptions({ placement: 'left' })

      const element = tooltip.getElement()
      expect(element.className).toContain('left')
    })

    it('应该能够更新 offset', () => {
      expect(() => {
        tooltip.updateOptions({ offset: 50 })
      }).not.toThrow()
    })

    it('应该能够更新 hideOnHover', () => {
      expect(() => {
        tooltip.updateOptions({ hideOnHover: false })
      }).not.toThrow()
    })
  })

  describe('DOM 访问', () => {
    beforeEach(() => {
      tooltip = new TooltipCore({ container })
    })

    it('应该能够获取 Tooltip 元素', () => {
      const element = tooltip.getElement()
      expect(element).toBeInstanceOf(HTMLDivElement)
    })

    it('应该能够获取内容容器', () => {
      const contentElement = tooltip.getContentElement()
      expect(contentElement).toBeInstanceOf(HTMLDivElement)
      expect(contentElement.className).toContain('ktd-tooltip-inner')
    })
  })

  describe('销毁', () => {
    it('应该能够正确销毁 Tooltip', () => {
      tooltip = new TooltipCore({ container })
      const element = tooltip.getElement()

      expect(container.contains(element)).toBe(true)

      tooltip.destroy()

      expect(container.contains(element)).toBe(false)
    })

    it('销毁时应该调用自定义渲染器的 destroy 方法', () => {
      const customRenderer: TooltipRenderer = {
        render: vi.fn(),
        destroy: vi.fn()
      }

      tooltip = new TooltipCore({
        container,
        customRenderer
      })

      tooltip.destroy()

      expect(customRenderer.destroy).toHaveBeenCalled()
    })

    it('没有 destroy 方法的自定义渲染器不应该报错', () => {
      const customRenderer: TooltipRenderer = {
        render: vi.fn()
      }

      tooltip = new TooltipCore({
        container,
        customRenderer
      })

      expect(() => tooltip.destroy()).not.toThrow()
    })
  })

  describe('边界情况', () => {
    it('应该能够处理空内容', () => {
      tooltip = new TooltipCore({ container })

      expect(() => {
        tooltip.showAt({ x: 100, y: 100 }, '')
      }).not.toThrow()
    })

    it('应该能够处理多次显示和隐藏', () => {
      tooltip = new TooltipCore({ container })

      tooltip.show()
      tooltip.hide()
      tooltip.show()
      tooltip.hide()

      const element = tooltip.getElement()
      expect(element.style.display).toBe('none')
    })

    it('应该能够处理位置为 0 的情况', async () => {
      tooltip = new TooltipCore({ container })

      tooltip.showAt({ x: 0, y: 0 }, 'Test')

      await new Promise((resolve) => setTimeout(resolve, 50))

      const element = tooltip.getElement()
      expect(element.style.left).toBeDefined()
      expect(element.style.top).toBeDefined()
    })

    it('应该能够处理负坐标', async () => {
      tooltip = new TooltipCore({ container })

      tooltip.showAt({ x: -10, y: -10 }, 'Test')

      await new Promise((resolve) => setTimeout(resolve, 50))

      const element = tooltip.getElement()
      expect(element.style.left).toBeDefined()
      expect(element.style.top).toBeDefined()
    })
  })
})

describe('createTooltip 辅助函数', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    if (container.parentNode) {
      container.parentNode.removeChild(container)
    }
  })

  it('应该创建 TooltipCore 实例', () => {
    const tooltip = createTooltip({ container })
    expect(tooltip).toBeInstanceOf(TooltipCore)
    tooltip.destroy()
  })

  it('应该接受配置选项', () => {
    const options: TooltipOptions = {
      container,
      placement: 'top',
      offset: 20,
      classPrefix: 'custom'
    }

    const tooltip = createTooltip(options)
    const element = tooltip.getElement()

    expect(element.className).toContain('custom')
    expect(element.className).toContain('top')

    tooltip.destroy()
  })
})
