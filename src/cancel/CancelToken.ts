import { CancelToken as CancelTokenType, CancelExecutor } from '../types'

interface ResolvePromise {
  (reason?: string): void
}

export default class CancelToken implements CancelTokenType {
  promise: Promise<string>
  reason?: string

  constructor(executor: CancelExecutor) {
    // let resolvePromise: ResolvePromise
    let resolvePromise: ResolvePromise

    this.promise = new Promise<string>(resolve => {
      resolvePromise = resolve as ResolvePromise
    })

    executor(message => {
      if (this.reason) {
        return
      }
      this.reason = message
      resolvePromise(this.reason)
    })
  }
}