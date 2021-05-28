import axios, { Canceler } from '../../src/index'
const CancelToken = axios.CancelToken

let cancel: Canceler

axios
  .get('/cancel/get', {
    cancelToken: new CancelToken(c => {
      cancel = c
    })
  })
  .then(res => {
    console.log(res)
  })
  .catch(function(e) {
    console.log('Request canceled', e)
  })

setTimeout(() => {
  cancel('重新发送')
}, 200)
