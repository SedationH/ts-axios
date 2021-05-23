export default class InterceptorManager<T> {
  private interceptors: Array<any>

  constructor() {
    this.interceptors = []
  }

  use(resolved: any, rejected?: any) {
    this.interceptors.push({
      resolved,
      rejected
    })
    return this.interceptors.length - 1
  }

  forEach(fn: any) {
    this.interceptors.forEach(interceptor => {
      if (interceptor !== null) {
        fn(interceptor)
      }
    })
  }
}
