## 前置知识 && 索引

关于URL https://blog.bitsrc.io/using-the-url-object-in-javascript-5f43cd743804

使用TypeScript重构Axios https://younglele.cn/ts-axios-doc/chapter4/url.html#%E9%9C%80%E6%B1%82%E5%88%86%E6%9E%90



## 处理AxiosRequestConfig 中的 params

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



## 处理body数据

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



## 处理请求header

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



## 获得响应数据

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



对于 response && responseText

的区别

这里搜了搜，没有满意的答复

https://stackoverflow.com/questions/46751610/difference-between-xhr-response-and-xhr-responsetext-on-xmlhttprequest#:~:text=1%20Answer&text=The%20response%20is%20interpreted%20into,handle%20it%20however%20you%20want.

https://www.codestudyblog.com/questions/sf/0421165618.html

我感觉可以都用response处理

因为浏览器会根据responseType自行处理

resposeType中有'text'类型，这里的处理结果就和使用responseText一致了

