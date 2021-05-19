## 使用TypeScript重构Axios

https://younglele.cn/ts-axios-doc/chapter4/url.html#%E9%9C%80%E6%B1%82%E5%88%86%E6%9E%90



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



![image-20210519210716189](http://picbed.sedationh.cn/image-20210519210716189.png)

> 然后我们打开浏览器运行 demo，看一下结果，我们发现 `/base/buffer` 的请求是可以拿到数据，但是 `base/post` 请求的 response 里却返回的是一个空对象，这是什么原因呢？
>
> 实际上是因为我们虽然执行 `send` 方法的时候把普通对象 `data` 转换成一个 `JSON` 字符串，但是我们请求`header` 的 `Content-Type` 是 `text/plain;charset=UTF-8`，导致了服务端接受到请求并不能正确解析请求 `body` 的数据。