import { AxiosRequestConfig, AxiosResponse, AxiosPromise } from '../types'
import { parseHeaders } from '../helpers/headers'
import { createError } from '../helpers/error'

export default function(config: AxiosRequestConfig): AxiosPromise {
  return new Promise((resolve, reject) => {
    const {
      data = null,
      url,
      method = 'get',
      headers,
      responseType,
      timeout,
      cancelToken,
      withCredentials
    } = config

    const request = new XMLHttpRequest()
    request.open(method.toUpperCase(), url as string, true)

    if (responseType) {
      request.responseType = responseType
    }

    if (timeout) {
      request.timeout = timeout
    }

    Object.keys(headers).forEach(name => {
      request.setRequestHeader(name, headers[name])
    })

    if (cancelToken) {
      cancelToken.promise.then((reason: string) => {
        request.abort()
        reject(reason)
      })
    }

    if (withCredentials) {
      request.withCredentials = true
    }

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

    // https://github.com/axios/axios/blob/7821ed20892f478ca6aea929559bd02ffcc8b063/lib/adapters/xhr.js#L114
    request.ontimeout = () => {
      reject(
        createError(
          `Timeout of ${timeout} ms exceeded`,
          config,
          // 'ETIMEDOUT' : 'ECONNABORTED'?
          'ECONNABORTED',
          request
        )
      )
    }

    request.addEventListener('timeout', () => {
      reject(new Error(`Timeout of ${timeout} ms exceeded`))
    })

    request.addEventListener('loadend', () => {
      // console.log('loadend', request.status)
    })

    function handleResponse(response: AxiosResponse) {
      if (response.status >= 200 && response.status < 300) {
        resolve(response)
      } else {
        reject(
          createError(
            `Request failed with status code ${response.status}`,
            config,
            null,
            request,
            response
          )
        )
      }
    }
  })
}
