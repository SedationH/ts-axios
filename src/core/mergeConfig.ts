import { deepMerge, isPlainObject } from '../helpers/util'
import { AxiosRequestConfig } from '../types'

const strategies = Object.create(null)

function defaultStrategy(val1: any, val2: any) {
  return typeof val2 === 'undefined' ? val1 : val2
}

function fromVal2Startegy(val1: any, val2: any) {
  if (typeof val2 !== 'undefined') return val2
}

const strategyKeysFromVal2 = ['url', 'params', 'data']
strategyKeysFromVal2.forEach(key => {
  strategies[key] = fromVal2Startegy
})

// TODO: 不理解实现
// function deepMergeStrat(val1: any, val2: any): any {
//   if (isPlainObject(val2)) {
//     return deepMerge(val1, val2)
//   } else if (typeof val2 !== 'undefined') {
//     return val2
//   } else if (isPlainObject(val1)) {
//     return deepMerge(val1)
//   } else if (typeof val1 === 'undefined') {
//     return val1
//   }
// }

// defaluts中的header已经是个对象了
function deepMergeStrategy(val1: any, val2: any) {
  if (isPlainObject(val2)) {
    return deepMerge(val1, val2)

    // 用户传入的headers可能不是对象
  } else if (typeof val2 !== 'undefined') {
    // TODO: why?
    return val2
  } else {
    return val1
  }
}

const strategyKeysDeepMerge = ['headers']
strategyKeysDeepMerge.forEach(key => {
  strategies[key] = deepMergeStrategy
})

export default function mergeConfig(
  config1: AxiosRequestConfig,
  config2: AxiosRequestConfig
): AxiosRequestConfig {
  if (!config2) {
    return config1
  }

  const mergedConfig = Object.create(null)

  for (const key in config2) {
    mergeFiled(key)
  }

  for (const key in config1) {
    if (!config2[key]) {
      mergeFiled(key)
    }
  }

  function mergeFiled(key: string) {
    const strategy = strategies[key] || defaultStrategy
    // 用户后者的优先级更高
    mergedConfig[key] = strategy(config1[key], config2[key])
  }

  return mergedConfig
}
