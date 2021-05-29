import { AxiosRequestConfig, AxiosResponse, AxiosPromise } from '../types'
import { parseHeaders } from '../helpers/headers'
import { createError } from '../helpers/error'
import { isURLSameOrigin } from '../helpers/url'
import cookie from '../helpers/cookie'

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
      withCredentials,
      xsrfCookieName,
      xsrfHeaderName,
      onDownloadProgress,
      onUploadProgress
    } = config

    const request = new XMLHttpRequest()
    request.open(method.toUpperCase(), url as string, true)

    configureRequest()

    addEvents()

    processHeaders()

    processCancel()

    function configureRequest() {
      if (responseType) {
        request.responseType = responseType
      }

      if (timeout) {
        request.timeout = timeout
      }

      if (withCredentials) {
        request.withCredentials = true
      }
    }

    function addEvents() {
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
      request.addEventListener('timeout', () => {
        reject(
          createError(
            `Timeout of ${timeout} ms exceeded`,
            config,
            // 'ETIMEDOUT' : 'ECONNABORTED'?
            'ECONNABORTED',
            request
          )
        )
      })

      request.addEventListener('loadend', () => {
        // console.log('loadend', request.status)
      })

      if (onDownloadProgress) {
        request.addEventListener('progress', onDownloadProgress)
      }

      if (onUploadProgress) {
        request.upload.addEventListener('progress', onUploadProgress)
      }
    }

    function processHeaders() {
      if ((withCredentials || isURLSameOrigin(url!)) && xsrfCookieName) {
        const xsrfValue = cookie.read(xsrfCookieName)
        if (xsrfValue && xsrfHeaderName) {
          headers[xsrfHeaderName] = xsrfValue
        }
      }

      Object.keys(headers).forEach(name => {
        request.setRequestHeader(name, headers[name])
      })
    }

    function processCancel() {
      if (cancelToken) {
        cancelToken.promise.then((reason: string) => {
          request.abort()
          reject(reason)
        })
      }
    }

    request.send(data)

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
