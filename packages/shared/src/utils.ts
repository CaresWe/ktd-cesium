/**
 * 通用工具函数集合
 */

// ==================== 对象操作 ====================

/**
 * 合并对象属性
 * @param dest 目标对象
 * @param sources 源对象数组
 * @returns 合并后的对象
 */
export function extend<T extends Record<string, unknown>>(dest: T, ...sources: Partial<T>[]): T {
  for (let j = 0; j < sources.length; j++) {
    const src = sources[j]
    for (const i in src) {
      dest[i] = src[i] as T[Extract<keyof T, string>]
    }
  }
  return dest
}

/**
 * 创建对象（Object.create 的兼容实现）
 */
export const create = Object.create || (() => {
  function F(this: unknown) {}
  return function <T>(proto: T): T {
    (F as unknown as { prototype: T }).prototype = proto
    return new (F as unknown as new () => T)()
  }
})()

/**
 * 设置对象选项
 * @param obj 目标对象
 * @param options 选项
 * @returns 合并后的选项
 */
export function setOptions<T extends Record<string, unknown>>(
  obj: T & { options?: Record<string, unknown> },
  options: Record<string, unknown>
): Record<string, unknown> {
  if (!Object.prototype.hasOwnProperty.call(obj, 'options')) {
    obj.options = obj.options ? create(obj.options) : {}
  }
  for (const i in options) {
    obj.options![i] = options[i]
  }
  return obj.options!
}

// ==================== 函数操作 ====================

/**
 * 绑定函数上下文
 * @param fn 函数
 * @param obj 上下文对象
 * @param boundArgs 绑定的参数
 * @returns 绑定后的函数
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function bind<T extends (...args: any[]) => any>(
  fn: T,
  obj: unknown,
  ...boundArgs: unknown[]
): T {
  if (fn.bind) {
    return fn.bind(obj, ...boundArgs) as T
  }

  return function (this: unknown, ...args: unknown[]) {
    return (fn as unknown as (...args: unknown[]) => unknown).apply(obj, boundArgs.length ? boundArgs.concat(args) : args)
  } as T
}

/**
 * 节流函数
 * @param fn 要执行的函数
 * @param time 时间间隔（毫秒）
 * @param context 上下文
 * @returns 节流后的函数
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  time: number,
  context?: unknown
): (...args: unknown[]) => void {
  let lock: boolean = false
  let args: unknown[] | false = false
  let wrapperFn: (...args: unknown[]) => void
  let later: () => void

  later = function () {
    lock = false
    if (args) {
      wrapperFn(...args)
      args = false
    }
  }

  wrapperFn = function (...currentArgs: unknown[]) {
    if (lock) {
      args = currentArgs
    } else {
      (fn as unknown as (...args: unknown[]) => unknown).apply(context, currentArgs)
      setTimeout(later, time)
      lock = true
    }
  }

  return wrapperFn
}

/**
 * 空函数（总是返回 false）
 */
export function falseFn(): boolean {
  return false
}

// ==================== 对象标识 ====================

let lastId = 0
const objIdKey = '_ktd_id'

/**
 * 获取对象唯一标识
 * @param obj 对象
 * @returns 唯一标识
 */
export function stamp(obj: Record<string, unknown>): number {
  if (!(obj as Record<string, number>)[objIdKey]) {
    (obj as Record<string, number>)[objIdKey] = ++lastId
  }
  return (obj as Record<string, number>)[objIdKey]
}

/**
 * 重置 ID 计数器（用于测试）
 */
export function resetLastId(): void {
  lastId = 0
}

// ==================== 数字处理 ====================

/**
 * 将数字包装到指定范围内
 * @param x 数字
 * @param range 范围 [min, max]
 * @param includeMax 是否包含最大值
 * @returns 包装后的数字
 */
export function wrapNum(x: number, range: [number, number], includeMax?: boolean): number {
  const max = range[1]
  const min = range[0]
  const d = max - min
  return x === max && includeMax ? x : ((x - min) % d + d) % d + min
}

// ==================== 字符串处理 ====================

/**
 * 去除字符串首尾空格
 * @param str 字符串
 * @returns 去除空格后的字符串
 */
export function trim(str: string): string {
  return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '')
}

/**
 * 将字符串按空格分割
 * @param str 字符串
 * @returns 分割后的数组
 */
export function splitWords(str: string): string[] {
  return trim(str).split(/\s+/)
}

/**
 * 获取参数字符串
 * @param obj 参数对象
 * @param existingUrl 现有 URL
 * @param uppercase 是否大写参数名
 * @returns 参数字符串
 */
export function getParamString(obj: Record<string, string | number>, existingUrl?: string, uppercase?: boolean): string {
  const params: string[] = []
  for (const i in obj) {
    params.push(encodeURIComponent(uppercase ? i.toUpperCase() : i) + '=' + encodeURIComponent(String(obj[i])))
  }
  return ((!existingUrl || existingUrl.indexOf('?') === -1) ? '?' : '&') + params.join('&')
}

const templateRe = /\{ *([\w_-]+) *\}/g

/**
 * 模板字符串替换
 * @param str 模板字符串
 * @param data 数据对象
 * @returns 替换后的字符串
 */
export function template(str: string, data: Record<string, string | number | ((data: Record<string, unknown>) => string | number)>): string {
  return str.replace(templateRe, (str, key) => {
    let value = data[key]

    if (value === undefined) {
      throw new Error('No value provided for variable ' + str)
    } else if (typeof value === 'function') {
      value = value(data as Record<string, unknown>)
    }
    return String(value)
  })
}

// ==================== 数组处理 ====================

/**
 * 获取元素在数组中的索引
 * @param array 数组
 * @param el 元素
 * @returns 索引（未找到返回 -1）
 */
export function indexOf<T>(array: T[], el: T): number {
  for (let i = 0; i < array.length; i++) {
    if (array[i] === el) {
      return i
    }
  }
  return -1
}

// ==================== 动画帧 ====================

type AnimationFrameCallback = (time: number) => void

function getPrefixed(name: string): ((callback: AnimationFrameCallback) => number) | undefined {
  const win = window as unknown as Record<string, unknown>
  return win['webkit' + name] as ((callback: AnimationFrameCallback) => number) | undefined ||
         win['moz' + name] as ((callback: AnimationFrameCallback) => number) | undefined ||
         win['ms' + name] as ((callback: AnimationFrameCallback) => number) | undefined
}

let lastTime = 0

function timeoutDefer(fn: AnimationFrameCallback): number {
  const time = +new Date()
  const timeToCall = Math.max(0, 16 - (time - lastTime))

  lastTime = time + timeToCall
  return window.setTimeout(() => fn(time + timeToCall), timeToCall)
}

export const requestFn = window.requestAnimationFrame || getPrefixed('RequestAnimationFrame') || timeoutDefer
export const cancelFn = window.cancelAnimationFrame || getPrefixed('CancelAnimationFrame') ||
  getPrefixed('CancelRequestAnimationFrame') || function (id: number) { window.clearTimeout(id) }

/**
 * 请求动画帧
 * @param fn 函数
 * @param context 上下文
 * @param immediate 是否立即执行
 * @returns 请求 ID
 */
export function requestAnimFrame(fn: AnimationFrameCallback, context?: unknown, immediate?: boolean): number | void {
  if (immediate && requestFn === timeoutDefer) {
    fn.call(context, Date.now())
  } else {
    return requestFn.call(window, (time: number) => fn.call(context, time))
  }
}

/**
 * 取消动画帧
 * @param id 请求 ID
 */
export function cancelAnimFrame(id?: number): void {
  if (id) {
    cancelFn.call(window, id)
  }
}

// ==================== 常量 ====================

/**
 * 空图片 URL（用于释放内存）
 */
export const emptyImageUrl = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='

// ==================== 深拷贝 ====================

/**
 * 深拷贝对象
 * @param obj 要拷贝的对象
 * @returns 拷贝后的对象
 */
export function clone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T
  }

  if (obj instanceof Array) {
    return obj.map(item => clone(item)) as T
  }

  if (obj instanceof Object) {
    const clonedObj = {} as T
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = clone(obj[key])
      }
    }
    return clonedObj
  }

  return obj
}
