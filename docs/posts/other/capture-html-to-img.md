# 网页截图的三种方式对比
## 网页截图的三种方法
- html2canvas (https://github.com/niklasvh/html2canvas)
- snapdom (https://github.com/zumerlab/snapdom/tree/main)
- html-to-image (https://github.com/bubkoo/html-to-image)

我让Ai帮我生成了一个官网首页的长页面，高度大概是7380px.接下来测试一下同样生成png的时间。

## 截图对比
实现截图的代码如下。主要通过埋入当前时间与最后生成图片的时间来做对比。
```
const captureForHtml2canvas = async () => {
  let time1 = Date.now()
  const el = document.getElementById('captureBody');
  // 把 DOM 节点转成 canvas
  const canvas = await html2canvas(el, {
    backgroundColor: null, 
    useCORS: true,         // 允许跨域图片（如果有）
  });

  let time2 = Date.now()
  console.log(`html2canvas 生成图片耗时：${time2 - time1}ms`)
  // 转成 base64 PNG
  const dataUrl = canvas.toDataURL("image/png");

  // 生成下载链接并触发
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = "captureForHtml2canvas.png";
  link.click();
}
const captureForSnapdom = async () => {
  let time1 = Date.now()
  const el = document.getElementById('captureBody');
  // const result = await snapdom(el, { scale: 1 });
  const canvas = await snapdom.toCanvas(el)
  let time2 = Date.now()
  console.log(`snapdom 生成图片耗时：${time2 - time1}ms`)
  // 转成 base64 PNG
  const dataUrl = canvas.toDataURL("image/png");
  // 生成下载链接并触发
  var link = document.createElement('a');
  link.download = 'captureForSnapdom.png';
  link.href = dataUrl;
  link.click();
}
const captureForHtml2img = () => {
  let time1 = Date.now()
  htmlToImage
  .toCanvas(document.getElementById('captureBody'))
  .then((canvas) => {
    let time2 = Date.now()
    console.log(`html2img 生成图片耗时：${time2 - time1}ms`)
    const dataUrl = canvas.toDataURL("image/png");
    var link = document.createElement('a');
    link.download = 'captureForHtml2img.png';
    link.href = dataUrl;
    link.click();
  });
}
```
首先测试了长页面的结果如下：
```
html2canvas 生成图片耗时：377ms
snapdom 生成图片耗时：1771ms
html2img 生成图片耗时：297ms
```
然后我把长页面改成高度只有1168px的再测一次
```
html2canvas 生成图片耗时：273ms
snapdom 生成图片耗时：547ms
html2img 生成图片耗时：60ms
```
这个测试结果有点惊讶，按snapdom的说法主要利用浏览器自带的Api来实现理论上应该是最快的。

## 截图原理
上面的测试结果有待研究一下，不过我们可以看看他们各自的实现逻辑大概是怎样的。
### html2canvas
看了一下源码发现html2canvas支持两种模式。
- 利用svg里面的foreignObject标签
- 手动一个个节点画上去

以上两种方式在真正截图之前都会先克隆一份目标节点，主要都是利用Element.cloneNode方法。
#### foreignObject
这种方式大概的流程首先把克隆下来的目标节点插入到svg的foreignObject标签中。
```
const xmlns = 'http://www.w3.org/2000/svg';
const svg = document.createElementNS(xmlns, 'svg');
const foreignObject = document.createElementNS(xmlns, 'foreignObject');
svg.appendChild(foreignObject);
foreignObject.appendChild(cloneNode);
```
然后把得到的svg对象加载成img给接下来的canvas通过drawImage画出来。得到一个目标画了目标节点的canvas。
```
// 加载svg
const img = new Image();
img.onload = () => {
    resolve(img);
};
img.onerror = reject;

img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;

// 画出来
ctx.drawImage(img, -this.options.x * this.options.scale, -this.options.y * this.options.scale);
```
#### 手动画
这种方式主要是把克隆的目标节点遍历画出来，它会先把所有节点包装成类似可绘制的对象指令，然后利用stacking context建立一个新的“绘制层”，最后按照顺序画到canvas上。主要遍历逻辑在以下代码。
```
export const parseStackingContexts = (container: ElementContainer): StackingContext => {
    // 1. 把 DOM 容器包一层 "可绘制对象"
    const paintContainer = new ElementPaint(container, null);

    // 2. 用这个 paintContainer 创建一个根 stacking context
    const root = new StackingContext(paintContainer);

    // 3. 创建一个数组，用来收集 "list-item" 元素
    const listItems: ElementPaint[] = [];

    // 4. 递归解析 DOM 树，建立 stacking context 树
    parseStackTree(paintContainer, root, root, listItems);

    // 5. 额外处理 <li>（list-item）相关的 marker（比如列表圆点/数字）
    processListItems(paintContainer.container, listItems);

    // 6. 返回整个 root stacking context
    return root;
};
```
关键触发绘制层是在parseStackTree方法中遍历去构建绘制的dom树。

我尝试使用foreignObject的模式去截图结果对比如下：
```
//小图
html2canvas （foreignObject方式）生成图片耗时：220ms
html2canvas 生成图片耗时：246ms
// 大图
html2canvas （foreignObject方式）生成图片耗时：337ms
html2canvas 生成图片耗时：529ms
```
长大图的时候foreignObject的效率还是比较高的。所以我理解中snapdom应该效率速度是最高的才对，也有可能是我使用的姿势不对。

### snapdom
snapdom的核心截图方式主要和html2canvas的foreignObjectRendering是一样的。核心如下:
```
const svgNS = "http://www.w3.org/2000/svg";
const fo = document.createElementNS(svgNS, "foreignObject");
fo.setAttribute("width", "100%");
fo.setAttribute("height", "100%");
const styleTag = document.createElement("style");
styleTag.textContent = baseCSS + fontsCSS + "svg{overflow:visible;}" + classCSS;
fo.appendChild(styleTag);
fo.appendChild(clone);
const serializer = new XMLSerializer();
const foString = serializer.serializeToString(fo);
const svgHeader = `<svg xmlns="${svgNS}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
const svgFooter = "</svg>";
svgString = svgHeader + foString + svgFooter;
dataURL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
```
它会先得到一个dataURL,后续再根据不同的需求最终再做转换，例如toImg会生成一个Image节点，toCanvas会生成canvas节点。它提供了实例方法如下：
```
capture
toRaw
toImg
toCanvas
toBlob
toPng
toJpg
toWebp
download
```
也可以通过snapdom.xx直接调用。

### html-to-image
这个库的提供的API最终都是调用到toSvg,其核心原理还是利用svg的foreignObject对象。并且在创建对象前还是会利用cloneNode去克隆目标节点。
```
export async function nodeToDataURL(
  node: HTMLElement,
  width: number,
  height: number,
): Promise<string> {
  const xmlns = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(xmlns, 'svg')
  const foreignObject = document.createElementNS(xmlns, 'foreignObject')

  svg.setAttribute('width', `${width}`)
  svg.setAttribute('height', `${height}`)
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`)

  foreignObject.setAttribute('width', '100%')
  foreignObject.setAttribute('height', '100%')
  foreignObject.setAttribute('x', '0')
  foreignObject.setAttribute('y', '0')
  foreignObject.setAttribute('externalResourcesRequired', 'true')

  svg.appendChild(foreignObject)
  foreignObject.appendChild(node)
  return svgToDataURL(svg)
}
```
然后就会得到一个svg。例如我前面用的toCanvas方法它就是先调用toSvg得到svg对象然后转换成图片画到一个新的canvas对象上并返回。

## 总结
三种库核心都是利用到svg的foreignObject对象插入目标节点，然后再通过不同的方式渲染生成，大同小异，只是html2canvas默认不使用该方式。

另外一个就是官方提供的数据在实际业务中使用时不一定是最好的，大家在业务中可多尝试对比一下真实效果与数据再决定使用哪种。

## 其他
关注“技术K记”公众号，不定时更新日志。大佬路过请多指点。