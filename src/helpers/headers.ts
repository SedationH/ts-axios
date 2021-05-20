import { isPlainObject } from './utils'

export function processHeaders(headers: any, data: any): any {
  if (!headers) return
  normalizeHeaderName(headers, 'Content-Type')

  // 需要根据data的情况自动配置Content-Type
  if (isPlainObject(data) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json;charset=utf-8'
  }

  return headers
}

// 如果原来存在 进行规范化
function normalizeHeaderName(headers: any, normalizeHeaderName: string) {
  if (!headers) return

  Object.keys(headers).forEach(name => {
    if (
      name !== normalizeHeaderName &&
      name.toUpperCase() === normalizeHeaderName.toUpperCase()
    ) {
      headers[normalizeHeaderName] = headers[name]
      delete headers[name]
    }
  })
}
