## taro-plugin-auto-pages
> Taro3 的自动生成 `pages` 配置插件，以后不用每次添加页面都修改 `app.config.js` 文件。
插件会自动寻找 `src/pages` 下的所有 `index` 页面，生成 `src/.tmp/pages.js` 文件，
然后将 `pages.js` 导入 `app.config.js` 中使用。

#### 安装
```
npm i taro-plugin-auto-pages --dev
// or
yarn add taro-plugin-auto-pages --dev
```

#### 使用
```js
// step1 配置插件
const config = {
  plugins: [
    ['taro-plugin-auto-pages',
        {
            indexPath: 'pages/demo/index'   // 默认 pages/index/index
        }
    ],
  ]
}

// step2 修改 app.config.js
import pages from './.temp/pages';

export default {
  pages,
  window: {},
  ...
}
```

#### 问题

* 新增页面需要重启服务
* ...

#### 更新日志
2020-08-25(v0.1.0)
1. fix 编译 h5 时忽略处理

2020-08-25(v0.1.0)
1. 代码重构
2. 添加 `indexPath` 参数用于配置首页，默认 `pages/index/index`
