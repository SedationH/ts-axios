import axios from '../../src/index'

// 没有和这个路由 404
// axios({
//   method: 'get',
//   url: '/error/get1'
// })
//   .then(res => {
//     console.log(res)
//   })
//   .catch(e => {
//     console.log(e)
//   })

// axios({
//   method: 'get',
//   url: '/error/get'
// })
//   .then(res => {
//     console.log(res)
//   })
//   .catch(e => {
//     console.log(e)
//   })

axios({
  method: 'get',
  url: '/error/timeout',
  timeout: 2000
})
  .then(res => {
    console.log(res)
  })
  .catch(e => {
    console.log('catch:', e.message)
  })
