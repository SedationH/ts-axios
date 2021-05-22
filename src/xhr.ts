import { AxiosRequestConfig, AxiosResponse, AxiosPromise } from './types'
import { parseHeaders } from './helpers/headers'

export default function(config: AxiosRequestConfig): AxiosPromise {
  return new Promise((resolve, reject) => {
    const {
      data = null,
      url,
      method = 'get',
      headers,
      responseType,
      timeout
    } = config

    const request = new XMLHttpRequest()
    request.open(method.toUpperCase(), url, true)

    if (responseType) {
      request.responseType = responseType
    }

    if (timeout) {
      request.timeout = timeout
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
      handleResponse(response)
    })

    request.addEventListener('error', () => {
      reject(new Error('Network Error'))
    })

    request.addEventListener('timeout', () => {
      reject(new Error(`Timeout of ${timeout} ms exceeded`))
    })

    request.addEventListener('loadend', () => {
      console.log('loadend', request.status)
    })

    function handleResponse(response: AxiosResponse) {
      if (response.status >= 200 && response.status < 300) {
        resolve(response)
      } else {
        reject(new Error(`Request failed with status code ${response.status}`))
      }
    }
  })
}
