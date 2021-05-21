import { AxiosRequestConfig, AxiosResponse, AxiosPromise } from './types'
import { parseHeaders } from './helpers/headers'

export default function(config: AxiosRequestConfig): AxiosPromise {
  return new Promise((resolve, reject) => {
    const { data = null, url, method = 'get', headers, responseType } = config

    const request = new XMLHttpRequest()
    request.open(method.toUpperCase(), url, true)

    if (responseType) {
      request.responseType = responseType
    }

    Object.keys(headers).forEach(name => {
      request.setRequestHeader(name, headers[name])
    })

    request.send(data)

    request.addEventListener('load', () => {
      const responseHeaders = parseHeaders(request.getAllResponseHeaders())

      const response: AxiosResponse = {
        data: request.response,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config,
        request
      }
      resolve(response)
    })
  })
}
