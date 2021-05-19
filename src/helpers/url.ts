import { isObject, isDate } from './utils'

export function buildUrl(url: string, params?: any): string {
  if (!params) return url

  let serializedParams
  const parts: string[] = []

  Object.keys(params).forEach(key => {
    const val = params[key]
    if (val === null || val === undefined) {
      return
    }
    let values
    if (Array.isArray(val)) {
      values = val
      key += '[]'
    } else {
      values = [val]
    }
    values.forEach(value => {
      if (isDate(value)) {
        value = value.toISOString()
      } else if (isObject(value)) {
        value = JSON.stringify(value)
      }
      parts.push(`${encode(key)}=${encode(value)}`)
    })
    serializedParams = parts.join('&')
  })
  if (serializedParams) {
    const hashmarkIndex = url.indexOf('#')
    const querymarkIndex = url.indexOf('?')
    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex)
    }
    url += (url.includes('?') ? '&' : '?') + serializedParams
  }
  return url
}

console.log(
  buildUrl('/base/get?a=77#has', {
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
