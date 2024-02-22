---
title: SSE
date: 2023-05-11 11:58:23
tags: ["js"]
---

## 介绍
sse是指[server sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)，它是除了websocket之外的另一种服务器推送信息方法。



## 本质

sse其实还是http请求，只是在一次请求中，服务器响应告诉客户端即将以流（`text/event-stream` MIME 类型响应内容）的方式响应数据这时候客户端不会关闭保持连接，但是这个是一个单向的长链接只能服务器给客户端推送消息这个也是跟websocket的区别。所以本质上是以流的方式实现一次长链接。



## 使用

### 客户端

- 使用fetch请求
- 使用EventSource对象
- 使用封装好的模块（fetch-event-source）



#### 使用fetch请求

sse本质上是http请求所以使用fetch也是可以的。接下来就是看一下我们怎么处理的是[response](https://developer.mozilla.org/en-US/docs/Web/API/Response)的数据，其格式是这样的：

```
body: ReadableStream
bodyUsed: false
headers: Headers {}
ok: true
redirected: false
status: 200
statusText: "OK"
type: "cors"
url: "http://localhost:3000/chat/sendMsg"
```

fetch请求的接口如果是以流的方式返回那么必须使用流的方式读取 [readStream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)，当然如果返回的不是流的方式也可以使用读取流的方式获取body内容，只是没必要。

读取stream的方法

```
async *onStream (stream) {
    const reader = stream.getReader()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          return
        }
        yield value
      }
    } finally {
      reader.releaseLock()
    }
}

async handleTest2 () {
      let url = 'http://127.0.0.1:8844/stream'
      await fetch(url, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        ...
        body:''
      }).then(async res => {
        for await (const chunk of this.onStream(res.body)) {
          const str = new TextDecoder().decode(chunk)
          console.log('fetch2---', str)
        }
      })


    },
```

读取非流的方式 [response](https://developer.mozilla.org/en-US/docs/Web/API/Response)

```
async handleTest2 () {
      let url = 'http://127.0.0.1:8844/stream'
      await fetch(url, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        ...
        body:''
      }).then(async res => {
      	let body = await res.json() // 需要看接口返回的格式是json还是文本还是blob
      })


    }
```



#### 使用EventSource对象

需要注意的是EventSource只能接受get请求

```
const evtSource = new EventSource('http://localhost:8844/stream')
  evtSource.addEventListener('open', () => {
    console.log('打开了')
  })
  evtSource.addEventListener('message', (e) => {
    console.log(e.data);
  })
```



#### 使用封装好的模块（fetch-event-source）

https://www.npmjs.com/package/@microsoft/fetch-event-source



### 服务端

阮一峰老师的简单[demo](https://www.ruanyifeng.com/blog/2017/05/server-sent_events.html).

启动（node server.js）之后访问 'http://localhost:8844/stream'即可

```
var http = require("http");

http.createServer(function (req, res) {
  var fileName = "." + req.url;

  if (fileName === "./stream") {
    res.writeHead(200, {
      "Content-Type":"text/event-stream",
      "Cache-Control":"no-cache",
      "Connection":"keep-alive",
      "Access-Control-Allow-Origin": '*',
      'Access-Control-Allow-Headers': 'Authorization,X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PATCH, PUT, DELETE',
      'Allow': 'GET, POST, PATCH, OPTIONS, PUT, DELETE'
    });
    res.write("retry: 10000\n");
    res.write("event: connecttime\n");
    res.write("data: " + (new Date()) + "\n\n");
    res.write("data: " + (new Date()) + "\n\n");

    interval = setInterval(function () {
      res.write("data: " + (new Date()) + "\n\n");
    }, 1000);

    req.connection.addListener("close", function () {
      clearInterval(interval);
    }, false);
  }
}).listen(8844, "127.0.0.1");
```

