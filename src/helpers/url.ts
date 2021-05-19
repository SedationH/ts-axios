import { isObject, isDate } from './utils'

export function buildUrl(url: string, params?: any): string {
  if (!params) return url

  const parts: string[] = []
  Object.keys(params).forEach(key => {
    let val = params[key]
    if (val === undefined || val === null) return
    if (Array.isArray(val)) {
      // 处理数组的情况
      const values: string[] = []
      val.forEach(value => {
        values.push(`${key}[]=${value}`)
      })
      val = values.join('&')
      parts.push(val)
    } else if (isObject(val)) {
      parts.push(`${key}=${encode(JSON.stringify(val))}`)
    } else if (isDate(val)) {
      parts.push(`${key}=${val.toISOString()}`)
    } else {
      parts.push(`${key}=${val}`)
    }
  })
  url += '?' + parts.join('&')
  return url
}

console.log(
  buildUrl('/base/get', {
    a: [1, 2, 3],
    b: 2,
    foo: {
      bar: '1',
      name: 'fo   o'
    },
    bar: null
  })
)

function encode(val: string): string {
  return encodeURIComponent(val)
    .replace(/%40/g, '@')
    .replace(/%3A/gi, ':')
    .replace(/%24/g, '$')
    .replace(/%2C/gi, ',')
    .replace(/%20/g, '+') // 约定将 空格 号转为 +
    .replace(/%5B/gi, '[')
    .replace(/%5D/gi, ']')
}
