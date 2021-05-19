import { isPlainObject } from './utils'

export function handleData(data: any) {
  if (isPlainObject(data)) {
    return JSON.stringify(data)
  }
  return data
}
