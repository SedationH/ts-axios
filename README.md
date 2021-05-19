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