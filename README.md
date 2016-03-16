Package Control Messages
========================

#pc-require.js

#API

##@define('name',function(require,exports,module){})

###说明
定义模块，`define('模块名',function 模块函数(require,exports,module){})`。
- 模块函数只会在 require('模块名') 的时候才会被执行，且多次 require 只会执行一次。
- 模块函数里的`require`用法跟全局的`require`的用法一样，需要什么模块就 require 什么模块。
- 模块函数里的`exports`、`module`跟`Node.js`的用法和概念是一样的。

###例子
```js
define('a',function(require,exports,module){
  a.name = 'a'
})
```

##@require('name')

###说明
加载同步模块，针对已经被`define`的模块才能进行`require`调用


###例子
```js
var a = require('a')
console.log(a.name)
```
##@require.config(config)

###说明
异步模块配置接口。
```js
{
  domain: 'http://www.pc.com',
  path: {
    'jQuery': '/static/jQuery.min.js', //key => 模块名，value => 模块路径（相对于 domain 或者 相对于当前页面地址）
    'temp': '/static/temp.min.js',
    'slide': '/static/slide.min.js'
  },  
  deps: {
    'slide' : ['jQuery','temp'] //模块的依赖，依赖里面填入模块名。
  },
  combo: false, //是否使用 combo url
  comboUrl: '/??' //用于连接combo和域名参数。如：/?? => http://www.pc.com/??/static/jQuery.min.js,/static/temp.min.js,/static/slide.min.js。 不适用 combo 是该参数无效。
}
```

##require.async

###说明
require.async(['模块名A','模块名B','模块名C']).then(回调函数)

加载异步模块，或者直接加载`js`文件、`css`文件。
- 加载异步模块的时候需要进行配置。
- 如果在配置里面未找到对应模块名，将会当做url进行资源加载。
- 返回一个`Promise`风格的对象，但并非是`ES2015`的`Promise`对象。
- 只需要在配置里配置好依赖关系，就会自动加载这些模块所需要的所有依赖模块。
- 目前参数只支持数组。

###示例

```js
require
  .async(['slide','a'])
  .then(function(slide,a){ //模块会变成参数注入进来。
    slide.init()
    console.log(a.name)
  })
```