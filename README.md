# taro-plugin-auto-pages
Taro3 的自动生成`pages`配置插件。插件会自动寻找`src/pages`下的所有`index`页面，
生成`src/.tmp/pages.js`文件，然后将`pages.js`导入 `app.config.js` 中使用。

## 安装
```
npm i taro-plugin-auto-pages --dev
// or
yarn add taro-plugin-auto-pages --dev
```

## 使用
```js
// step1 配置插件
const config = {
  plugins: [
    ['taro-plugin-auto-pages'],
  ]
}

// step2 修改 app.config.js
import pages from './.temp/pages';

export default {
  pages,
  window: {}
}
```
