import { AxiosRequestConfig, AxiosPromise, AxiosResponse } from '../types'
import xhr from './xhr'
import { buildUrl } from '../helpers/url'
import { transformRequestData, transformResponseData } from '../helpers/data'
import { flattenHeaders, processHeaders } from '../helpers/headers'

export default function dispatchRequest(
  config: AxiosRequestConfig
): AxiosPromise {
  processConfig(config)
  return xhr(config).then(response => {
    return transformResponse(response)
  })
}

function processConfig(config: AxiosRequestConfig): void {
  config.url = transformURL(config)
  config.headers = transformRequestHeaders(config)
  // TODO: 这里也需要解决
  config.data = transformRequestData(config.data)
  // TODO: 目前还有相互依赖关系 待思考和解决
  config.headers = flattenHeaders(config.headers, config.method!)
}

function transformURL(config: AxiosRequestConfig): string {
  const { url, params } = config
  return buildUrl(url as string, params)
}

function transformRequestHeaders(config: AxiosRequestConfig) {
  const { headers = {}, data } = config
  return processHeaders(headers, data)
}

function transformResponse(response: AxiosResponse): AxiosResponse {
  response.data = transformResponseData(response.data)
  return response
}
