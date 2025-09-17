# 问题收集记录
## 记一次莫名打开空白新窗口页面
在页面操作一定时间之后，突然会莫名打开一个空白新标签页。一开始就怀疑是socket的问题了。

一开始重写window.open没有追踪到，后面重新用下面的方法追踪到了。

###原因
```
this.socket = new WebSocket(this.url);
this.socket.onclose = () => { 
    console.log('%c WebSocket: CLOSEED!', 'background:#67C23A;color:#000'); 
    setTimeout(this.connectAgain, 2000); 
}
async connectAgain() {
    console.log("%c Webscoket意外断开,重连中...", 'background:#000;color:#fff', this.socket?.readyState);
    // console.log('console.log this---------', this)
    await this.open();
  }
```
trace 到就是在socket.onclose的时候打开了，一开始还怀疑是websocket的时候this.url为空。后面才发现setTimeout(this.connectAgain, 2000); 这段代码的问题。这里this.connectAgain给进去调用的时候里面的this就是window了，所以this.open()其实就是window.open()......

这算是一个闭包问题了。因为当settimeout调用的时候其实里面的执行上下文已经变成是window了，原本可能他是想onclose = () => {}是箭头函数以为会保留了当前上下文作用域，这样执行时就能调用当前封装的open方法。

###解决
知道了问题关键点之后解决也很简单,只要在给settimeout传递的时候包装一层箭头函数即可。
```
settimtout(() => {this.connectAgain()}, 2000)
```
### 追踪方法
```
// Hook window.open
window.open = new Proxy(window.open, {
  apply(target, thisArg, args) {
    console.warn("window.open 被调用:", args);
    console.trace(); // 打印调用栈
    return Reflect.apply(target, thisArg, args);
  }
});

// Hook a.click
HTMLAnchorElement.prototype.click = new Proxy(HTMLAnchorElement.prototype.click, {
  apply(target, thisArg, args) {
    console.warn("a.click 被调用:", thisArg);
    console.trace();
    return Reflect.apply(target, thisArg, args);
  }
});

// Hook form.submit
HTMLFormElement.prototype.submit = new Proxy(HTMLFormElement.prototype.submit, {
  apply(target, thisArg, args) {
    console.warn("form.submit 被调用:", thisArg);
    console.trace();
    return Reflect.apply(target, thisArg, args);
  }
});

```

## alias '@'运行不报错，但编辑器一直提示报错
在维护一个旧的ts项目，加了一点依赖，当我使用 @/xx路径引入时webpack报错了，检查了一遍发现webpack tsconfig都没有配置。于是一顿操作把下面配置给加上,然后信心满满看了一下终端运行和页面都正常了。

```javascript
// webpack 
....其他代码
resolve:{
    alias: {
        // 这里是让webpack编译能解析
        '@': path.resolve(__dirname, 'src')    
    }    
}
```
```javascript
// tsconfig.json
{
    "compilerOptions": {
        ...其他代码
        // 以下两句关键，能让ts解析到
        "paths": {
          "@/*": ["src/*"]
        },
        "baseUrl": "."     
    }
}
```
于是我返回编辑器准备继续干其他代码时发现 @的地方还一直提示 ”Cannot find module '@/xx' or its corresponding type declarations.ts“，想了好一会构建功能都正常，这里或许是编辑器的问题。
我使用的是vscode 查了一下重启ts server的命令。
```
按下 Ctrl+Shift+P 或 Cmd+Shift+P

搜索并选择：TypeScript: Restart TS Server
```
果然报错消失了。其实另外一种粗暴的方法就是重启编辑器也行。当我在记录这个问题想重现的时候发现tsconfig的配置不管怎么删掉补上，这时编辑器都能自动识别。这里欢迎各位大佬补充指导。