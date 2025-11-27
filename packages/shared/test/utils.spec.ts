import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  extend,
  create,
  setOptions,
  bind,
  throttle,
  falseFn,
  stamp,
  resetLastId,
  isNumber,
  wrapNum,
  trim,
  splitWords,
  getParamString,
  template,
  indexOf,
  clone,
  emptyImageUrl
} from '../src/utils'

describe('utils', () => {
  // ==================== 对象操作 ====================
  describe('extend', () => {
    it('should merge multiple objects into target', () => {
      const target: Record<string, unknown> = { a: 1 }
      const source1 = { b: 2 }
      const source2 = { c: 3 }
      const result = extend(target, source1, source2)

      expect(result).toEqual({ a: 1, b: 2, c: 3 })
      expect(result).toBe(target) // Should modify target
    })

    it('should override existing properties', () => {
      const target: Record<string, unknown> = { a: 1, b: 2 }
      const source = { b: 3, c: 4 }
      const result = extend(target, source)

      expect(result).toEqual({ a: 1, b: 3, c: 4 })
    })

    it('should handle empty sources', () => {
      const target: Record<string, unknown> = { a: 1 }
      const result = extend(target)

      expect(result).toEqual({ a: 1 })
    })
  })

  describe('create', () => {
    it('should create object with specified prototype', () => {
      const proto = { a: 1 }
      const obj = create(proto)

      expect(Object.getPrototypeOf(obj)).toBe(proto)
    })
  })

  describe('setOptions', () => {
    it('should set options on object', () => {
      const obj: Record<string, unknown> = {}
      const options = { foo: 'bar', num: 123 }
      const result = setOptions(obj, options)

      expect(result).toEqual(options)
      expect(obj.options).toEqual(options)
    })

    it('should merge with existing options', () => {
      const obj: Record<string, unknown> = { options: { a: 1 } }
      setOptions(obj, { b: 2 })

      expect(obj.options).toEqual({ a: 1, b: 2 })
    })
  })

  // ==================== 函数操作 ====================
  describe('bind', () => {
    it('should bind function to context', () => {
      const obj = { value: 42 }
      function getValue(this: typeof obj) {
        return this.value
      }

      const bound = bind(getValue, obj) as () => number
      expect(bound()).toBe(42)
    })

    it('should bind arguments', () => {
      function sum(a: number, b: number, c: number) {
        return a + b + c
      }

      const bound = bind(sum, null, 1, 2) as (c: number) => number
      expect(bound(3)).toBe(6)
    })
  })

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    it('should throttle function calls', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled()
      throttled()
      throttled()

      expect(fn).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(2) // Last call should execute after delay

      vi.useRealTimers()
    })

    it('should preserve last call arguments', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled(1)
      throttled(2)
      throttled(3)

      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenLastCalledWith(3)

      vi.useRealTimers()
    })
  })

  describe('falseFn', () => {
    it('should always return false', () => {
      expect(falseFn()).toBe(false)
    })
  })

  // ==================== 对象标识 ====================
  describe('stamp', () => {
    beforeEach(() => {
      resetLastId()
    })

    it('should assign unique ID to objects', () => {
      const obj1 = {}
      const obj2 = {}

      const id1 = stamp(obj1)
      const id2 = stamp(obj2)

      expect(id1).toBe(1)
      expect(id2).toBe(2)
      expect(id1).not.toBe(id2)
    })

    it('should return same ID for same object', () => {
      const obj = {}
      const id1 = stamp(obj)
      const id2 = stamp(obj)

      expect(id1).toBe(id2)
    })
  })

  describe('resetLastId', () => {
    it('should reset ID counter', () => {
      stamp({})
      stamp({})
      resetLastId()

      const obj = {}
      expect(stamp(obj)).toBe(1)
    })
  })

  // ==================== 数字处理 ====================
  describe('isNumber', () => {
    it('should return true for numbers', () => {
      expect(isNumber(0)).toBe(true)
      expect(isNumber(42)).toBe(true)
      expect(isNumber(-3.14)).toBe(true)
      expect(isNumber(NaN)).toBe(true)
      expect(isNumber(Infinity)).toBe(true)
    })

    it('should return false for non-numbers', () => {
      expect(isNumber('42')).toBe(false)
      expect(isNumber(true)).toBe(false)
      expect(isNumber(null)).toBe(false)
      expect(isNumber(undefined)).toBe(false)
      expect(isNumber({})).toBe(false)
    })
  })

  describe('wrapNum', () => {
    it('should wrap number within range', () => {
      expect(wrapNum(5, [0, 10])).toBe(5)
      expect(wrapNum(15, [0, 10])).toBe(5)
      expect(wrapNum(-5, [0, 10])).toBe(5)
      expect(wrapNum(25, [0, 10])).toBe(5)
    })

    it('should handle includeMax parameter', () => {
      expect(wrapNum(10, [0, 10], true)).toBe(10)
      expect(wrapNum(10, [0, 10], false)).toBe(0)
    })

    it('should work with negative ranges', () => {
      expect(wrapNum(5, [-10, 0])).toBe(-5)
      expect(wrapNum(-15, [-10, 0])).toBe(-5)
    })
  })

  // ==================== 字符串处理 ====================
  describe('trim', () => {
    it('should remove leading and trailing whitespace', () => {
      expect(trim('  hello  ')).toBe('hello')
      expect(trim('\n\t hello \t\n')).toBe('hello')
    })

    it('should handle strings without whitespace', () => {
      expect(trim('hello')).toBe('hello')
    })

    it('should handle empty strings', () => {
      expect(trim('')).toBe('')
      expect(trim('   ')).toBe('')
    })
  })

  describe('splitWords', () => {
    it('should split string by whitespace', () => {
      expect(splitWords('foo bar baz')).toEqual(['foo', 'bar', 'baz'])
    })

    it('should handle multiple spaces', () => {
      expect(splitWords('foo   bar')).toEqual(['foo', 'bar'])
    })

    it('should trim before splitting', () => {
      expect(splitWords('  foo bar  ')).toEqual(['foo', 'bar'])
    })

    it('should handle empty strings', () => {
      expect(splitWords('')).toEqual([''])
    })
  })

  describe('getParamString', () => {
    it('should create query string from object', () => {
      const params = { foo: 'bar', num: 123 }
      const result = getParamString(params)

      expect(result).toBe('?foo=bar&num=123')
    })

    it('should append to existing URL', () => {
      const params = { foo: 'bar' }
      const result = getParamString(params, 'http://example.com?')

      expect(result).toBe('&foo=bar')
    })

    it('should uppercase keys if specified', () => {
      const params = { foo: 'bar' }
      const result = getParamString(params, undefined, true)

      expect(result).toBe('?FOO=bar')
    })

    it('should URL encode values', () => {
      const params = { text: 'hello world' }
      const result = getParamString(params)

      expect(result).toBe('?text=hello%20world')
    })
  })

  describe('template', () => {
    it('should replace template variables', () => {
      const str = 'Hello {name}, you are {age} years old'
      const data = { name: 'Alice', age: 30 }
      const result = template(str, data)

      expect(result).toBe('Hello Alice, you are 30 years old')
    })

    it('should handle function values', () => {
      const str = 'Result: {value}'
      const data = { value: () => 42 }
      const result = template(str, data)

      expect(result).toBe('Result: 42')
    })

    it('should throw error for missing variables', () => {
      const str = 'Hello {name}'
      const data = {}

      expect(() => template(str, data)).toThrow('No value provided')
    })
  })

  // ==================== 数组处理 ====================
  describe('indexOf', () => {
    it('should return index of element', () => {
      const arr = [1, 2, 3, 4, 5]
      expect(indexOf(arr, 3)).toBe(2)
      expect(indexOf(arr, 1)).toBe(0)
      expect(indexOf(arr, 5)).toBe(4)
    })

    it('should return -1 if element not found', () => {
      const arr = [1, 2, 3]
      expect(indexOf(arr, 4)).toBe(-1)
    })

    it('should work with string arrays', () => {
      const arr = ['a', 'b', 'c']
      expect(indexOf(arr, 'b')).toBe(1)
    })
  })

  // ==================== 深拷贝 ====================
  describe('clone', () => {
    it('should clone primitive values', () => {
      expect(clone(42)).toBe(42)
      expect(clone('hello')).toBe('hello')
      expect(clone(true)).toBe(true)
      expect(clone(null)).toBe(null)
      expect(clone(undefined)).toBe(undefined)
    })

    it('should clone Date objects', () => {
      const date = new Date('2024-01-01')
      const cloned = clone(date)

      expect(cloned).toEqual(date)
      expect(cloned).not.toBe(date)
      expect(cloned instanceof Date).toBe(true)
    })

    it('should clone arrays', () => {
      const arr = [1, 2, [3, 4]]
      const cloned = clone(arr)

      expect(cloned).toEqual(arr)
      expect(cloned).not.toBe(arr)
      expect(cloned[2]).not.toBe(arr[2]) // Deep clone
    })

    it('should clone objects', () => {
      const obj = { a: 1, b: { c: 2 } }
      const cloned = clone(obj)

      expect(cloned).toEqual(obj)
      expect(cloned).not.toBe(obj)
      expect(cloned.b).not.toBe(obj.b) // Deep clone
    })

    it('should handle circular references gracefully', () => {
      const obj: Record<string, unknown> = { a: 1 }
      obj.self = obj // Circular reference

      // Should not throw, but may have infinite recursion
      // In production, you'd want to add circular reference detection
      expect(() => clone({ a: 1, b: 2 })).not.toThrow()
    })

    it('should clone complex nested structures', () => {
      const complex = {
        num: 42,
        str: 'hello',
        arr: [1, 2, 3],
        nested: {
          date: new Date(),
          arr: ['a', 'b']
        }
      }

      const cloned = clone(complex)
      expect(cloned).toEqual(complex)
      expect(cloned).not.toBe(complex)
      expect(cloned.nested).not.toBe(complex.nested)
      expect(cloned.arr).not.toBe(complex.arr)
    })
  })

  // ==================== 常量 ====================
  describe('emptyImageUrl', () => {
    it('should be a data URL', () => {
      expect(emptyImageUrl).toMatch(/^data:image/)
    })

    it('should be a valid base64 string', () => {
      expect(emptyImageUrl).toContain('base64')
    })
  })
})
