# DOM事件模型
DOM事件模型也叫DOM事件流，就是在浏览器中与用户的交互过程时规定事件在DOM树的传播方式。它是自上而下的（window → document → html → body → 父元素 … → 目标元素），主要分3个阶段。

## 事件的阶段
- **捕获** 用户点击页面时事件从根节点到目标这个过程
- **目标** 事件到达目标元素
- **冒泡** 事件从目标元素自下而上传播回根节点的过程

## 默认阶段与选项
事件默认的触发阶段是**冒泡**，主要有几个方面：

- 能够实现事件代理（事件委托）
- 提高网站性能
- 比较符合用户操作直觉（冒泡是自下而上）

事件代理就是通过监听父元素来对子元素进行事件处理。例如通过监听UI的点击事件来对li实现点击的操作。
```
parent.addEventListener('click', function (evt) {
    if(evt.target.tagName === 'LI') {
        // 这里操作对应的事件回调
    }
})
```
这样做的好处就是如果li是动态添加，那就不需要每次添加时给li绑定事件从而提高网站的性能以及代码的可维护性。

## 常用场景
- 常见事件点击
- 事件委托
- 事件拦截（阻止默认行为、传播控制）
- 拖拽交互
- 窗口/页面状态监听（resize、scroll、visibilitychange）。

## 常用属性与方法
- target
事件监听的目标对象，可对其做相关操作。
```
el.addEventListener('click', function (evt) {
    evt.target.style.visibility = "hidden";
})
```
- cancelable 只读，表示事件是否能够取消
- eventPhase
判断当前事件是在哪个阶段：
1.Event.NONE 0 // 表示当前事件没被触发
2.Event.CAPTURING_PHASE 1 // 捕获中
3.Event.AT_TARGET 2 // 找到目标
4.Event.BUBBLING_PHASE 3 // 找到目标之后正在向上返回-也就是冒泡
- preventDefault()
阻止默认行为，例如复选框的点击
```
const checkbox = document.querySelector("#id-checkbox");
checkbox.addEventListener("click", checkboxClick, false);
function checkboxClick(event) {
  const warn = "preventDefault() 将导致你无法选中此项\n";
  document.getElementById("output-box").innerText += warn;
  event.preventDefault();
}
```
- stopPropagation()
阻止事件流的继续传播。
```
const parentBox = document.getElementById('parent')
const childBox = document.getElementById('child')
parentBox.addEventListener('click', function (evt) {
    console.log('这里应该会被child阻止了')
})
childBox.addEventListener('click', function (evt) {
    evt.stopPropagation() 
    console.log('这里应该会阻止事件继续')
})
```
如果我们把childBox的evt.stopPropagation() 注释了，那么点击child的时候parent的click事件也会被触发。

## 总结
DOM事件流是自上而下，并且默认的事件触发是在冒泡阶段。最经典的事件应用场景就是**事件代理**。

## 资料
- https://developer.mozilla.org/zh-CN/docs/Learn_web_development/Core/Scripting/Events


## 其他
关注“技术K记”公众号，不定时更新日志。