# 你真的了解package.json吗
被dependencies版本指定问题给坑了一波。

## 问题
今天在跑项目npm run build的时候突然出现了报错：

```
ERROR in ./node_modules/fast-png/lib-esm/PngDecoder.js 10:13
Module parse failed: Unexpected token (10:13)
You may need an appropriate loader to handle this file type, currently no loaders are configured to process this file. See https://webpack.js.org/concepts#loaders
| import { ColorType, CompressionMethod, DisposeOpType, FilterMethod, InterlaceMethod, BlendOpType, } from './internalTypes';
| export default class PngDecoder extends IOBuffer {
    >     _checkCrc;
|     _inflator;
|     _png;
@ ./node_modules/fast-png/lib-esm/index.js 1:0-38 6:24-34 14:24-34
@ ./node_modules/jspdf/dist/jspdf.es.min.js
@ ./node_modules/html2pdf.js/dist/html2pdf.js
```
它大概意思就是语法解析有错，看实际报错模块（fast-png）的位置_checkCrc; 应该是因为class field的语法解析不出来。

### 解决办法1
第一个办法就是给webpack的配置上指定babel-loader需要处理一下这个模块
```
const includePaths = [
    path.resolve(path.join(__dirname, 'node_modules/fast-png'))
]
{
    test: /\.js?$/,
    loader: 'babel-loader?cacheDirectory=true',
    include: includePaths,
}
```
搞完之后再跑一次结果又出错了，这次到另外的模块(iobuffer)错了
```
ERROR in ./node_modules/iobuffer/lib-esm/IOBuffer.js 24:10 Module parse failed: Unexpected token (24:10) You may need an appropriate loader to handle this file type, currently no loaders are configured to process this file. See https://webpack.js.org/concepts#loaders 
| * Reference to the internal ArrayBuffer object. 
| */ > buffer; 
| /** 
| * Byte length of the internal ArrayBuffer. @ ./node_modules/fast-png/lib-esm/PngDecoder.js 13:16-35 @ ./node_modules/fast-png/lib-esm/index.js @ ./node_modules/jspdf/dist/jspdf.es.min.js @ ./node_modules/html2pdf.js/dist/html2pdf.js
```
这次也是同样的错误，那我就继续加配置
```
const includePaths = [
    path.resolve(path.join(__dirname, 'node_modules/fast-png')),
    path.resolve(path.join(__dirname, 'node_modules/iobuffer')),
]
```
再次运行成功，但是我意识到一个问题，这几个报错都是因为最初的模块html2pdf.js用到了这些模块，那我为什么不看看直接解决它就可以了？

## dependencies版本问题
当我去看为什么html2pdf.js会用到这些模块时突然发现一个小问题，我在dependencies中配置的版本是"^0.10.1",但是npm i 下来的版本却是"0.10.3".当我再去对比时发现它用到的一个库jspdf在0.10.1和0.10.3中分别对应了两个不同大版本0.10.1（jspdf:2.5.2）和0.10.3(jspdf:3.0.2)。好家伙直接给我干到了最新，最新版就用了一个新的库"fast-png": "^6.2.0"，下面对比一下两个版本的依赖区别。
```
//jspdf 2.5.2
 "dependencies": {
    "@babel/runtime": "^7.23.2",
    "atob": "^2.1.2",
    "btoa": "^1.2.1",
    "canvg": "^3.0.6",
    "core-js": "^3.6.0",
    "dompurify": "^2.5.4",
    "fflate": "^0.8.1",
    "html2canvas": "^1.0.0-rc.5"
  },
//jspdf 3.0.2
 "dependencies": {
    "@babel/runtime": "^7.26.9",
    "fflate": "^0.8.1",
    "fast-png": "^6.2.0"
  },

```
这就是问题关键所在，安装了最新的依赖并默认使用了esm（package.json配置了module:'xxx.js'）导致在解析的时候不支持，所以上面我强制加上babel-loader转换就成功了。

那为什么我配置是0.10.1版本但是安装下来的却是0.10.3呢？问题就是版本前面的^。它意思就是““兼容版本” 参见 semver”也就是在安装的时候会找到最新的合适的0.10.x版本来安装。

### 解决办法2
所以这里想到了第二种解决办法，那就是不需要^直接指定0.10.1版本。
```
"html2pdf.js": "0.10.1"
```
重新npm i 之后，确实可行。

### dependencies配置
发现问题根因之后我们还是重新复习一下dependencies的配置加固记忆。

```
//原文
/**  
version: 必须完全匹配这个版本。
>version: 必须大这个版本。
>=version: 必须大于或等于这个版本。
<version: 必须小于这个版本。
<=version: 必须小于或等于这个版本。
~version: 大约等于这个版本，具体来说，就是允许最后一个数字的变化（如 1.2.x）。
^version: 兼容这个版本，允许最后两个数字变化（如 1.2.3 可以是 1.2.4 或 1.3.0，但不是 2.0.0）。
1.2.x: 可以是 1.2.0, 1.2.1 等，但不能是 1.3.0。
http://...: 表示依赖可以通过 URL 获取。
*: 匹配任何版本。
""（空字符串）: 和 * 一样，匹配任何版本。
version1 - version2: 表示在 version1 和 version2 之间的版本。
range1 || range2: 只要满足 range1 或 range2 中的任意一个就可以。
git...: 表示依赖可以通过 Git 仓库获取。
user/repo: GitHub 上的特定仓库。
tag: 指定一个被标记并发布的版本。
path/path/path: 表示本地路径。
npm:@scope/pkg@version: 为一个包定义自定义别名。
*/

{
  "dependencies": {
    "foo": "1.0.0 - 2.9999.9999", //可用1.0.0 - 2.9999.9999之间的版本
    "bar": ">=1.0.2 <2.1.2", // 版本需要大于等于1.0.2并小于2.1.2
    "baz": ">1.0.2 <=2.3.4",// 版本需要大于等于1.0.2并小于等于2.3.4
    "boo": "2.0.1", // 版本限定2.0.1
    "qux": "<1.0.0 || >=2.3.1 <2.4.5 || >=2.5.2 <3.0.0",// 版本小于1.0.0 或者 大于等于2.3.1并小于2.4.5 或者 大于等于2.5.2并小于3.0.0
    "asd": "http://npmjs.com/example.tar.gz", // 通过这个链接获取版本
    "til": "~1.2", // 大约等于1.2这个版本 大于等于1.2.0 并小于1.3.0（只锁定小版本）
    "elf": "~1.2.3",// 大约等于1.2.3这个版本并小于 1.3.0
    "two": "2.x",// 指定2.x的任意版本可以 2.1 2.2 2.3，但是不能是3.x
    "thr": "3.3.x",// 可以是3.3.1 3.3.3
    "lat": "latest", // 指定最后的版本
    "dyl": "file:../dyl", // 从本地文件夹 ../dyl 安装
    "kpg": "npm:pkg@1.0.0" // 安装别名包 npm:pkg，对应版本 1.0.0
  }
}
```

## 总结
报错是因为dependencies使用了^版本所以给我安装了比配置里版本更高的版本导致。解决办法有两种：
- webpack 增加babel-loader 处理对应node_module里面的模块
- 直接修改dependencies为指定的版本

## 其他
关注“技术K记”公众号，不定时更新日志。
