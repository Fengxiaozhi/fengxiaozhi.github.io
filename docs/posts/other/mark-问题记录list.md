# 问题收集记录
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