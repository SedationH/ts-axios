export function extend<T, U>(to: T, from: U): T & U {
  for (const key in from) {
    ;(to as T & U)[key] = from[key] as any
  }
  return to as T & U
}

const toString = Object.prototype.toString

// TODO: 参考类型保护
// https://younglele.cn/ts-axios-doc/chapter2/advance.html#%E7%B1%BB%E5%9E%8B%E4%BF%9D%E6%8A%A4
export function isDate(val: any): val is Date {
  return toString.call(val) === '[object Date]'
}

// 注意区分 isObject && isPlainObject的使用需求·
export function isObject(val: any): val is Object {
  return val !== null && typeof val === 'object'
}

export function isPlainObject(val: any): val is Object {
  return toString.call(val) === '[object Object]'
}
export function deepMerge(...objs: Array<any>) {
  const result = Object.create(null)

  // 从前向后执行，后面覆盖前面
  objs.forEach(obj => {
    if (obj) {
      Object.keys(obj).forEach(key => {
        const currVal = obj[key]
        // 对于object的情况都要进行deepMerge
        // 创建新的对象
        if (isPlainObject(currVal)) {
          // 看结果里是否存在 并且是个对象
          const resultVal = result[key]
          if (isPlainObject(resultVal)) {
            result[key] = deepMerge(resultVal, currVal)
          } else {
            result[key] = deepMerge(currVal)
          }
        } else {
          result[key] = currVal
        }
      })
    }
  })

  return result
}
