## 前置知识 && 索引

参考文章 使用TypeScript重构Axios https://younglele.cn/ts-axios-doc/chapter4/url.html#%E9%9C%80%E6%B1%82%E5%88%86%E6%9E%90



### 关于URL

 https://blog.bitsrc.io/using-the-url-object-in-javascript-5f43cd743804



### 底层是对XMLHttpReqest的封装📦

https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest

https://javascript.info/xmlhttprequest

    	 onreadystatechange
      	readyState === 4
             ⇓
     onload / onerror / onabort
                 ⇓
    				onloadend
An `XMLHttpRequest` object travels them in the order `0` → `1` → `2` → `3` → … → `3` → `4`. State `3` repeats every time a data packet is received over the network.



## 基础功能



### 处理AxiosRequestConfig 中的 params

有以下几种情况

1. 常规

```js
{
  url: '/base/get',
    params: {
      a: 1,
      b: 2
    }
}
// url: /base/get?a=1&b=2
```

2. 数组

```js
{
  url: '/base/get',
  params: {
    foo: ['bar','foo']
  }
}
// url: /base/get?foo[]=bar&foo[]=foo
```

3. 对象

```js
{
  url: '/base/get',
  params: {
    foo: {
      bar: 'baz'
    }
  }
}
// url: /base/get?foo={"bar":"baz"} 
// | encode
// url: /base/get?foo=%7B%22bar%22:%22baz%22%7D
```

4. Date

```js
const date = new Date()
{
  url: '/base/get',
  params: {
    date
  }
}
const dataString = date.toISOString()
// url: /base/get?date=dataString
```

5. 特殊字符支持

对于字符 `@`、`:`、`$`、`,`、`[`、`]`、`空格`   我们是允许出现在 `url` 中的，不希望被 encode。

两个相关的原生API

`encodeURIComponent()` escapes all characters **except**:

```
Not Escaped:

    A-Z a-z 0-9 - _ . ! ~ * ' ( )
```

`encodeURI()` escapes all characters **except**:

```
Not Escaped:

    A-Z a-z 0-9 ; , / ? : @ & = + $ - _ . ! ~ * ' ( ) #
```



这里使用encodeURIComponent进行encode，在对里面超出我们替换要求的符号进行重制

约定 `空格` -> `+`

6. 忽略undefined && null
7. 丢弃hash
8. 保留已有参数



![URI syntax diagram](https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/URI_syntax_diagram.svg/1068px-URI_syntax_diagram.svg.png)



### 处理body数据

注意使用`isPlainObject`

> 这里为什么要使用 `isPlainObject` 函数判断，而不用之前的 `isObject` 函数呢，因为 `isObject` 的判断方式，对于 `FormData`、`ArrayBuffer` 这些类型，`isObject` 判断也为 `true`，但是这些类型的数据我们是不需要做处理的，而 `isPlainObject` 的判断方式，只有我们定义的普通 `JSON` 对象才能满足。



`XMLHttpRequest.send(body)`

> `body` Optional
>
> A body of data to be sent in the XHR request. This can be:
>
> - A [`Document`](https://developer.mozilla.org/en-US/docs/Web/API/Document), in which case it is serialized before being sent.
> - An `XMLHttpRequestBodyInit`, which [per the Fetch spec](https://fetch.spec.whatwg.org/#typedefdef-xmlhttprequestbodyinit) can be a [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob), [`BufferSource`](https://developer.mozilla.org/en-US/docs/Web/API/BufferSource), [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData), [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams), or [`USVString`](https://developer.mozilla.org/en-US/docs/Web/API/USVString) object.
> - `null`
>
> If no value is specified for the body, a default value of `null` is used.

```js
axios({
  method: 'post',
  url: '/base/post',
  data: { 
    a: 1,
    b: 2 
  }
})
```

这样的需求是要转换为string的

> *[Unicode Scalar Value](https://www.unicode.org/glossary/#unicode_scalar_value)*. Any Unicode *[code point](https://www.unicode.org/glossary/#code_point)* except high-surrogate and low-surrogate code points. In other words, the ranges of integers 0 to D7FF16 and E00016 to 10FFFF16 inclusive. (See definition D76 in [Section 3.9, Unicode Encoding Forms](http://www.unicode.org/versions/latest/ch03.pdf#G7404).)

关于 DOMString vs USVString

这里有个 issue https://github.com/w3ctag/design-principles/issues/93

个人对这里的理解是

USVString URL环境

DOMString 除了URL的环境 （JS，文本处理？



### 处理请求header

![image-20210519210716189](http://picbed.sedationh.cn/image-20210519210716189.png)

> 然后我们打开浏览器运行 demo，看一下结果，我们发现 `/base/buffer` 的请求是可以拿到数据，但是 `base/post` 请求的 response 里却返回的是一个空对象，这是什么原因呢？
>
> 实际上是因为我们虽然执行 `send` 方法的时候把普通对象 `data` 转换成一个 `JSON` 字符串，但是我们请求`header` 的 `Content-Type` 是 `text/plain;charset=UTF-8`，导致了服务端接受到请求并不能正确解析请求 `body` 的数据。
>
> ![image-20210520111345005](http://picbed.sedationh.cn/image-20210520111345005.png)



目前的需求是

我们可以自行配置headers

如果没有配置header - Content-Type ，会检测传入对象和请求方式，自行添加Content-Type



完成后

当我们请求的数据是普通对象并且没有配置 `headers` 的时候，会自动为其添加 `Content-Type:application/json;charset=utf-8`；同时我们发现当 data 是某些类型如 `URLSearchParams` 的时候，浏览器会自动为请求 `header`加上合适的 `Content-Type`。

```js
const paramsString = 'q=URLUtils.searchParams&topic=api'
const searchParams = new URLSearchParams(paramsString)

axios({
  method: 'post',
  url: '/base/post',
  data: searchParams
})
```

![image-20210520195130492](http://picbed.sedationh.cn/image-20210520195130492.png)



### 获得响应数据

```js
axios({
  method: 'post',
  url: '/base/post',
  data: {
    a: 1,
    b: 2
  }
}).then((res) => {
  console.log(res)
})
```

我们可以拿到 `res` 对象，并且我们希望该对象包括：服务端返回的数据 `data`，HTTP 状态码`status`，状态消息 `statusText`，响应头 `headers`、请求配置对象 `config` 以及请求的 `XMLHttpRequest` 对象实例 `request`。

```js
export interface AxiosRequestConfig {
  url: string
  method?: Method
  data?: any
  params?: any
  headers?: any
  responseType?: XMLHttpRequestResponseType
}

export interface AxiosResponse {
  data?: any
  status?: number
  statusText?: string
  headers?: any
  config?: AxiosRequestConfig
  request?: any
}

export interface AxiosPromise extends Promise<AxiosResponse> {}
```



对于一个 AJAX 请求的 `response`，我们是可以指定它的响应的数据类型的，通过设置 `XMLHttpRequest` 对象的 [`responseType`](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseType) 属性，于是我们可以给 `AxiosRequestConfig` 类型添加一个可选属性：

`type XMLHttpRequestResponseType = "" | "arraybuffer" | "blob" | "document" | "json" | "text";`

这个配置项的意义是客户端可以配置所期待的数据格式，浏览器可以对其进行解析

https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseType



对于 response && responseText

的区别

这里搜了搜，没有满意的答复

https://stackoverflow.com/questions/46751610/difference-between-xhr-response-and-xhr-responsetext-on-xmlhttprequest#:~:text=1%20Answer&text=The%20response%20is%20interpreted%20into,handle%20it%20however%20you%20want.

https://www.codestudyblog.com/questions/sf/0421165618.html

我感觉可以都用response处理

因为浏览器会根据responseType自行处理

resposeType中有'text'类型，这里的处理结果就和使用responseText一致了



### 处理响应header

在处理的时候要考虑一个问题

js 中 white-space是什么？

https://tc39.es/ecma262/#sec-white-space



getResponseHeaders的格式

An example of what a raw header string looks like:

```
date: Fri, 08 Dec 2017 21:04:30 GMT\r\n
content-encoding: gzip\r\n
x-content-type-options: nosniff\r\n
server: meinheld/0.6.1\r\n
x-frame-options: DENY\r\n
content-type: text/html; charset=utf-8\r\n
connection: keep-alive\r\n
strict-transport-security: max-age=63072000\r\n
vary: Cookie, Accept-Encoding\r\n
content-length: 6502\r\n
x-xss-protection: 1; mode=block\r\n
```

Each line is terminated by both carriage return and line feed characters (`\r\n`). These are essentially delimiters separating each of the headers.



### 处理响应数据

如果没有传入responseType，也要支持把结果可以JSON化的进行parse



## 错误处理

### 处理异常逻辑

```
	 onreadystatechange
  	readyState === 4
         ⇓
 onload / onerror / onabort
             ⇓
				onloadend
```



error

> It's important to note that this is only called if there's an error at the network level. If the error only exists at the application level (e.g. an HTTP error code is sent), this method will not be called.



timeout



状态码不在2xx范围内



### 错误信息增强

```js
export interface AxiosError extends Error {
  isAxiosError: boolean
  config: AxiosRequestConfig
  code?: number | null | string
  // 考虑node环境
  // request?: XMLHttpRequest
  request?: any
  response?: AxiosResponse
}
```



关于code这里有些问题

0.22.1版本的axios

```js
// Handle timeout
request.ontimeout = function handleTimeout() {
  var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
  if (config.timeoutErrorMessage) {
    timeoutErrorMessage = config.timeoutErrorMessage;
  }
  reject(createError(
    timeoutErrorMessage,
    config,
    config.transitional && config.transitional.clarifyTimeoutError ? 'ETIMEDOUT' : 'ECONNABORTED',
    request));

  // Clean up request
  request = null;
};
```

为啥是timeout而不用ETIMEOUT 呢？

 https://github.com/axios/axios/blob/7821ed20892f478ca6aea929559bd02ffcc8b063/lib/adapters/xhr.js#L114



## 接口扩展

### 接口扩展

过去的封装过程中，我们是把axios当作一个函数来看的，现在需要更加多了接口方便使用

为了用户更加方便地使用 axios 发送请求，我们可以为所有支持请求方法扩展一些接口：

- `axios.request(config)`
- `axios.get(url[, config])`
- `axios.delete(url[, config])`
- `axios.head(url[, config])`
- `axios.options(url[, config])`
- `axios.post(url[, data[, config]])`
- `axios.put(url[, data[, config]])`
- `axios.patch(url[, data[, config]])`

如果使用了这些方法，我们就不必在 `config` 中指定 `url`、`method`、`data` 这些属性了。

从需求上来看，`axios` 不再单单是一个方法，更像是一个混合对象，本身是一个方法，又有很多方法属性，接下来我们就来实现这个混合对象。



原先axios函数实现的内容被封装到了Axios.prototype.request上



```js
// 原来的函数实现
import dispatchRequest from './dispatchRequest'

export default class Axios implements AxiosType {
  request(config: AxiosRequestConfig): AxiosPromise {
    return dispatchRequest(config)
  }
 ...
```



我们的目的是

axios可以作为函数直接使用

也可以使用上面的方便调用的接口



实现逻辑如下

```js
import { AxiosInstance } from './types'
import Axios from './core/Axios'
import { extend } from './helpers/util'

function createInstance(): AxiosInstance {
  const context = new Axios()
  const instance = Axios.prototype.request.bind(context)

  extend(instance, context)

  return instance as AxiosInstance
}

const axios = createInstance()

export default axios
```



可见方法的调用是使用 instance -> Axios.prototype.request

并且通过extends再这个instance ||  Axios.prototype.request 上面挂了许多方法



extends

```js
export function extend<T, U>(to: T, from: U): T & U {
  for (const key in from) {
    ;(to as T & U)[key] = from[key] as any
  }
  return to as T & U
}
```

### 函数重载

现在axios作为函数直接调用的函数签名为

```ts
request(config: AxiosRequestConfig): AxiosPromise {
  return dispatchRequest(config)
}

axios({
  url: '/extend/post',
  method: 'post',
  data: {
    msg: 'hi'
  }
})
```



现在希望能够向axios作为函数调用的时候传入两个参数

```js
axios('/extend/post', {
  method: 'post',
  data: {
    msg: 'hello'
  }
})
```



这里要注意的是，我们虽然修改了 `request` 的实现，支持了 2 种参数，但是我们对外提供的 `request` 接口仍然不变，可以理解为这仅仅是内部的实现的修改，与对外接口不必一致，只要保留实现兼容接口即可。

```js
export interface AxiosInstance extends Axios {
  (config: AxiosRequestConfig): AxiosPromise

  (url: string, config?: AxiosRequestConfig): AxiosPromise
}

request(url: any, config?: any): AxiosPromise {
  if (typeof url === 'string') {
    if (!config) {
      config = {}
    }
    config.url = url
  } else {
    config = url
  }
  return dispatchRequest(config)
}
```

### 响应数据支持范型

场景

通常情况下，我们会把后端返回数据格式单独放入一个接口中：

```typescript
// 请求接口数据
export interface ResponseData<T = any> {
  /**
   * 状态码
   * @type { number }
   */
  code: number

  /**
   * 数据
   * @type { T }
   */
  result: T

  /**
   * 消息
   * @type { string }
   */
  message: string
}
```

我们可以把 API 抽离成单独的模块：

```typescript
import { ResponseData } from './interface.ts';

export function getUser<T>() {
  return axios.get<ResponseData<T>>('/somepath')
    .then(res => res.data)
    .catch(err => console.error(err))
}
```

接着我们写入返回的数据类型 `User`，这可以让 TypeScript 顺利推断出我们想要的类型：

```typescript
interface User {
  name: string
  age: number
}

async function test() {
  // user 被推断出为
  // {
  //  code: number,
  //  result: { name: string, age: number },
  //  message: string
  // }
  const user = await getUser<User>()
}
```

## 拦截器实现

使用大概如下

```js
// 添加一个请求拦截器
axios.interceptors.request.use(function (config) {
  // 在发送请求之前可以做一些事情
  return config;
}, function (error) {
  // 处理请求错误
  return Promise.reject(error);
});
// 添加一个响应拦截器
axios.interceptors.response.use(function (response) {
  // 处理响应数据
  return response;
}, function (error) {
  // 处理响应错误
  return Promise.reject(error);
});
```

可以添加多个

注意⚠️响应和请求向拦截器添加的时候，顺序不一样

![image-20210523104827353](http://picbed.sedationh.cn/image-20210523104827353.png)

也可以通过use返回的id，来进行删除

```js
const myInterceptor = axios.interceptors.request.use(function () {/*...*/})
axios.interceptors.request.eject(myInterceptor)
```



整个过程是一个链式调用的方式，并且每个拦截器都可以支持同步和异步处理，我们自然而然地就联想到使用 Promise 链的方式来实现整个调用过程。

在这个 Promise 链的执行过程中，请求拦截器 `resolve` 函数处理的是 `config` 对象，而相应拦截器 `resolve` 函数处理的是 `response` 对象。



### 效果

```js
axios.interceptors.request.use(config => {
  config.headers.test += '1'
  return config
})
axios.interceptors.request.use(config => {
  config.headers.test += '2'
  return config
})
axios.interceptors.request.use(config => {
  config.headers.test += '3'
  return config
})

axios.interceptors.response.use(res => {
  res.data += '1'
  return res
})
let interceptor = axios.interceptors.response.use(res => {
  res.data += '2'
  return res
})
axios.interceptors.response.use(res => {
  res.data += '3'
  return res
})
```

![image-20210523192513951](http://picbed.sedationh.cn/image-20210523192513951.png)



### 关键逻辑

```js
// 添加拦截器逻辑
const chain: Array<PromiseChain<any>> = [
  {
    resolved: dispatchRequest,
    rejected: undefined
  }
]

// 获取添加上的拦截器
this.interceptors.request.forEach((interceptor: any) => {
  // 新来的放到前面
  chain.unshift(interceptor)
})
this.interceptors.response.forEach((interceptor: any) => {
  chain.push(interceptor)
})

let promise = Promise.resolve(config)
while (chain.length) {
  // chain.shift() 可能是 undefined 这里需要断言
  const { resolved, rejected } = chain.shift()!
  promise = promise.then(resolved, rejected)
}

// return dispatchRequest(config)
return promise
```



### 关于types

在types.ts文件中的，是向外暴露的/通用的



在各自的文件中还可以再写自己的types / 接口

区分内部和外部的调用



## 配置化实现

 ### 默认配置和合并行为设计

引入默认配置

这需要处理用户的配置和添加的配置如何进行合并

与Axios和设计保持一致

```ts
axios.defaults.headers.common['test'] = 123
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'
axios.defaults.timeout = 2000
```

其中对于 `headers` 的默认配置支持 `common` 和一些请求 `method` 字段，`common` 表示对于任何类型的请求都要添加该属性，而 `method` 表示只有该类型请求方法才会添加对应的属性。

在上述例子中，我们会默认为所有请求的 `header` 添加 `test` 属性，会默认为 `post` 请求的 `header` 添加 `Content-Type` 属性。



不同类型的字段有不同的合并策略

```js
config1 = {
  method: 'get',

  timeout: 0,

  headers: {
    common: {
      Accept: 'application/json, text/plain, */*'
    }
  }
}

config2 = {
  url: '/config/post',
  method: 'post',
  data: {
    a: 1
  },
  headers: {
    test: '321'
  }
}

merged = {
  url: '/config/post',
  method: 'post',
  data: {
    a: 1
  },
  timeout: 0,
  headers: {
    common: {
      Accept: 'application/json, text/plain, */*'
    }
    test: '321'
  }
}
```

合并的策略有三种

1. 默认合并策略
   1. 用户配置的优先级更高
   2. 若无用户配置，使用默认配置
2. 只接受自定义配置策略
   1. 字面意思
3. 复杂对象合并策略（headers



![image-20210524110454344](http://picbed.sedationh.cn/image-20210524110454344.png)

```js
axios.defaults.headers.common['test2'] = 123

axios({
  url: '/config/post',
  method: 'post',
  data: qs.stringify({
    a: 1
  }),
  headers: {
    test: '321'
  }
}).then(res => {
  console.log(res.data)
})
```



这一块还是比较复杂的

merge根据不同的配置key选择不同的策略

如headers选择 deepMerge策略

这里有对策略模式的使用，看起来还挺优雅

```js
 deepMerge(
   {
     common: {
       test2: 123
     }
   },
   {
     common: {
       test2: 3,
       test1: 1
     },
     foo: 'foo'
   }
 )
// 假设拿到了上面的两个headers需要进行合并
{
  {
     common: {
       test2: 3,
       test1: 1
     },
     foo: 'foo'
   },
}
```

核心实现如下

```js
function isPlainObject(val) {
  return toString.call(val) === '[object Object]'
}
function deepMerge(...objs) {
  const result = Object.create(null)

  // 从前向后执行，后面覆盖前面
  objs.forEach(obj => {
    if (obj) {
      Object.keys(obj).forEach(key => {
        const currVal = obj[key]
        // 对于object的情况都要进行deepMerge
        // 创建新的对象
        if (isPlainObject(currVal)) {
          // 看结果里是否存在 并且是个对象
          const resultVal = result[key]
          if (isPlainObject(resultVal)) {
            result[key] = deepMerge(resultVal, currVal)
          } else {
            result[key] = deepMerge(currVal)
          }
        } else {
          result[key] = currVal
        }
      })
    }
  })

  return result
}
```



合并了还没完

因为开始我们使用

```js
{
  common: {
		....
	},
  get: {
    
  }
}
```

方便我们进行默认值和不同请求方式的处理

现在还需要根据我们进行请求的方式进行flattern，并且把不需要的headers进删除



```js
// 默认method 为 get
export function flattenHeaders(headers: any, method: Method): any {
  if (!headers) {
    return headers
  }
  // 这里注意是个新对象～
  headers = deepMerge(headers.common || {}, headers[method] || {}, headers)

  const methodsToDelete = [
    'delete',
    'get',
    'head',
    'options',
    'post',
    'put',
    'patch',
    'common'
  ]

  methodsToDelete.forEach(method => {
    delete headers[method]
  })

  return headers
}
```



### 请求和响应 headers && data 处理配置化

**理一下headers && data的处理**



请求发出之前要进行 processConfig 处理headers && data数据

```js
processConfig(config)
return xhr(config).then(response => {
  return transformResponse(response)
})
```



请求返回后也有进行数据处理 `transformResponse`

`processConfig` 中

1. 要处理URL，（主要针对的是有params的时候
2. 要根据request的data(isPlainObject) 更改Content-Type (application/json)
3. normalizeHeaderName
4. 处理body数据，详细🔎参考 `基础功能-处理body数据`
5. flattern headers 这个主要是Axios支持 common get 这样的全局header配置方式



`transformResponse` 就是尝试JSON.parse一下服务器返回的结果





现在要做的就是把这个过程线性化

通过transform进行封装📦



```js
axios({
  transformRequest: [
    function(data) {
      return qs.stringify(data)
    },
    ...(axios.defaults.transformRequest as AxiosTransformer[])
  ],
  transformResponse: [
    ...(axios.defaults.transformResponse as AxiosTransformer[]),
    function(data) {
      if (typeof data === 'object') {
        data.a = 8
      }
      return data
    }
  ],
  url: '/config/post',
  method: 'post',
  data: {
    a: 1
  }
}).then(res => {
  console.log(res.data)
})
```

这样进行调用的时候，transformRequest && transformResponse 都遵循defaultStragety，所以在

`    config = mergeConfig(this.defaults, config)` 的时候，我们传入的都会直接把defaults中的覆盖掉

 

### 添加create静态方法

目前的Axios是一个单例，修改默认的配置可能会对其他所有的请求产生影响



目前需要支持创建新的实例





## 取消功能

### 使用场景

设有请求a

setInterval 发起请求a

要求如果前面的请求没有返回结果，再发起请求的时候需要结束上一个请求

### MVP

```js
class CancelToken {
  constructor(executor) {
    let resolveFn
    this.promise = new Promise(resolve => {
      resolveFn = resolve
    })

    // 向executor中传入函数
    executor(message => {
      this.reason = message
      resolveFn(this.reason)
    })
  }
}

// 在使用axios的时候
function axios(config) {
  const { method, url, cancelToken } = config
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(method.toUpperCase(), url, true)

    if (cancelToken) {
      cancelToken.promise.then(reason => {
        xhr.abort()
        reject(reason)
      })
    }

    xhr.send()

    xhr.addEventListener('loadend', () => {
      console.log('loadend', xhr.status)
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr)
      } else {
        reject(xhr)
      }
    })
  })
}

let cancel
axios({
  cancelToken: new CancelToken(c => (cancel = c)),
  url: '/simple/get',
  method: 'GET'
}).then(
  value => {
    console.log('value', value)
  },
  reason => {
    console.log('reason', reason)
  }
)
cancel('abort')
```



## withCredentials

考虑CORS，携带cookie等信息

需要

client:

```js
xhr.withCredentials = true
```

serve:

```js
const cors = {
  'Access-Control-Allow-Origin': 'http://localhost:8080',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}

router.post('/more/server2', (req, res) => {
  res.set(cors)
  res.json(req.cookies)
})

router.options('/more/server2', (req, res) => {
  res.set(cors)
  res.end()
})
```

配置CORS && options请求

这里🤨存疑，无论是给的demo还是自己写的，都没有在发起请求的时候拿到请求所在域的cookie。

TODO



## CSRF

**XSS** 利用的是用户对指定网站的信任，CSRF 利用的是网站对用户网页浏览器的信任。

假设有Web A

什么情况下A会出现 CSRF 问题？

A仅仅将cookie当作认证信息

比如存在接口 a.com/shop?buy=true 来付钱



用户在访问Web B的时候

Web B发起a.com/shop?buy=true的请求，这个请求还携带着A站点的cookie信息，因此可以通过A站点的用户认证，从而执行了B想要的操作。

> ### [Simple requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#simple_requests)
>
> Some requests don’t trigger a [CORS preflight](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#preflighted_requests). Those are called *“simple requests”* in this article, though the [Fetch](https://fetch.spec.whatwg.org/) spec (which defines CORS) doesn’t use that term. A “simple request” is one that **meets all the following conditions**:
>
> - One of the allowed methods:
>
>   - [`GET`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/GET)
>   - [`HEAD`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/HEAD)
>   - [`POST`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST)
>
> - Apart from the headers automatically set by the user agent (for example,`Connection`,`User-Agent`, or the other headers defined in the Fetch spec as a “forbidden header name”), the only headers which are allowed to be manually set are those which the Fetch spec defines as a “CORS-safelisted request-header”, which are:
>
>   - [`Accept`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept)
>   - [`Accept-Language`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language)
>   - [`Content-Language`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Language)
>   - [`Content-Type`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type) (but note the additional requirements below)
>
> - The only allowed values for the
>
>   `Content-Type`
>
>   header are:
>
>   - `application/x-www-form-urlencoded`
>   - `multipart/form-data`
>   - `text/plain`
>
> - If the request is made using an [`XMLHttpRequest`](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) object, no event listeners are registered on the object returned by the [`XMLHttpRequest.upload`](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/upload) property used in the request; that is, given an [`XMLHttpRequest`](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) instance `xhr`, no code has called `xhr.upload.addEventListener()` to add an event listener to monitor the upload.
>
> - No [`ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream) object is used in the request.

> CSRF 的防御手段有很多，比如验证请求的 referer，但是 referer 也是可以伪造的，所以杜绝此类攻击的一种方式是服务器端要求每次请求都包含一个 `token`，这个 `token` 不在前端生成，而是在我们每次访问站点的时候生成，并通过 `set-cookie` 的方式种到客户端，然后客户端发送请求的时候，从 `cookie` 中对应的字段读取出 `token`，然后添加到请求 `headers` 中。这样服务端就可以从请求 `headers` 中读取这个 `token` 并验证，由于这个 `token` 是很难伪造的，所以就能区分这个请求是否是用户正常发起的。

我目前的理解难点在这句话

> 服务器端要求每次请求都包含一个 `token`，这个 `token` 不在前端生成，而是在我们每次访问站点的时候生成

demo中对应的代码为

```js
app.use(express.static(__dirname, {
  setHeaders (res) {
    res.cookie('XSRF-TOKEN-D', '1234abc')
  }
}))
```

逻辑上来看，每次服务器都有response header : `set-cookie: XSRF-TOKEN-D=1234abc`

![image-20210528211118580](http://picbed.sedationh.cn/image-20210528211118580.png)

```js
const {
  /*...*/
  xsrfCookieName,
  xsrfHeaderName
} = config

if ((withCredentials || isURLSameOrigin(url!)) && xsrfCookieName){
  const xsrfValue = cookie.read(xsrfCookieName)
  if (xsrfValue) {
    headers[xsrfHeaderName!] = xsrfValue
  }
}
```

在之后的xhr请求中，把xsrfHeaderName添加到headers，value是访问页面的时候生成的token

这个添加行为只有在同源 || CORS withCredentials的时候才进行

![image-20210528211421578](http://picbed.sedationh.cn/image-20210528211421578.png)

> 这里判定同源之看了protocal host ，为啥不看port呢？



**理解的关键在于token，他是生成的，又是咋起作用的。**

token既和用户绑定，又和时间相关，只有在真实当前访问页面的时候才进行生效

另外，自己不太理解

> CSRF 的防御手段有很多，比如验证请求的 referer，但是 referer 也是可以伪造的，所以杜绝此类攻击的一种方式是服务器端要求每次请求都包含一个 `token`

how?

TODO





这个过程中有许多编码细节和实现技巧

### 解析URL可以利用ATag Node

```js
const urlParsingNode = document.createElement('a')
function resolveURL(url: string): URLOrigin {
  urlParsingNode.setAttribute('href', url)
  const { protocol, host } = urlParsingNode

  return {
    protocol,
    host
  }
}
```

### regular expression 截取 cookie value

目前还有个`\\s`看不明白

```js
const cookie = {
  read(name: string): string | null {
    const match = document.cookie.match(
      new RegExp('(^|;\\s*)(' + name + ')=([^;]*)')
    )
    return match ? decodeURIComponent(match[3]) : null
  }
}
```



## TODO

MVP 实现AXIOS
