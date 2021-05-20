import { AxiosRequestConfig, AxiosPromise } from './types'
import xhr from './xhr'
import { buildUrl } from './helpers/url'
import { handleData } from './helpers/data'
import { processHeaders } from './helpers/headers'

function axios(config: AxiosRequestConfig): AxiosPromise {
  processConfig(config)
  return xhr(config)
}

function processConfig(config: AxiosRequestConfig): void {
  config.url = transformUrl(config)
  config.headers = transformRequestHeaders(config)
  config.data = transformRequestData(config)
}

function transformUrl(config: AxiosRequestConfig): string {
  const { url, params } = config
  return buildUrl(url, params)
}

function transformRequestData(config: AxiosRequestConfig) {
  return handleData(config.data)
}

function transformRequestHeaders(config: AxiosRequestConfig) {
  const { headers = {}, data } = config
  return processHeaders(headers, data)
}
export default axios
