import { isPlainObject } from './utils'

export function transformRequestData(data: any) {
  if (isPlainObject(data)) {
    return JSON.stringify(data)
  }
  return data
}

export function transformResponseData(data: any) {
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch (e) {
      // pass
    }
  }
  return data
}
