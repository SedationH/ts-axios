import {
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError as AxiosErrorType
} from '../types'

export class AxiosError extends Error implements AxiosErrorType {
  isAxiosError
  config
  code
  request
  response

  constructor(
    message: string,
    config: AxiosRequestConfig,
    code?: string | null | number,
    request?: any,
    response?: AxiosResponse
  ) {
    super(message)

    this.config = config
    this.code = code
    this.request = request
    this.response = response
    this.isAxiosError = true

    // https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, AxiosError.prototype)
  }
}

export function createError(
  message: string,
  config: AxiosRequestConfig,
  code?: string | null | number,
  request?: any,
  response?: AxiosResponse
): AxiosErrorType {
  return new AxiosError(message, config, code, request, response)
}
