const toString = Object.prototype.toString

// TODO: 参考类型保护
// https://younglele.cn/ts-axios-doc/chapter2/advance.html#%E7%B1%BB%E5%9E%8B%E4%BF%9D%E6%8A%A4
export function isDate(val: any): val is Date {
  return toString.call(val) === '[object Date]'
}

export function isObject(val: any): boolean {
  return val !== null && toString.call(val) === '[object Object]'
}
