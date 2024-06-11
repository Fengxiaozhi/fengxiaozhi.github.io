# vitePress自动生成侧边栏目录

把记录的文章迁移到vitePress之后，有个想法，希望能够自动根据文章的目录结构自动生成侧边栏。初步的想法是在vitePress的配置文件运行时自动去读取目录并生成sideBar配置。

看了一下其他人提供的那些插件其实大同小异都是利用Node读取本地目录然后遍历生成目录。几行代码就搞定的事情那就不需要用别人的插件了吧。

## 实现的思路主要是几个步骤
以我的这个目录为例，我只需要简单生成目录，所以我只划分了两级目录，而且我希望每一个分类下都只看自己的目录文章。所以sideBar的目录结构大概如下：

```javascript

sidebar: {
    '/posts/xxx': [
        {
            text: title,
            link: 路径
        }
    ]
}
```
文章的目录结构如下：
```javascript
-posts
--分类
---分类下的文章.md
---分类下的文章2.md
--分类2
---分类2下的文章.md
---分类2下的文章2.md
```

- 读取指定的目录获取文章的分类列表
- 遍历分类列表生成每个分类下的文章目录列表

```javascript 
let parentDirName = '' //文章的根目录
let parentPath = path.join(__dirname,parentDirName)
fs.readdir(parentPath, (err, postDirFiles) => {
// 开始遍历一级分类
postDirFiles.map(childDirName => {
    // 得到一级目录路径
    let childPath = path.join(parentPath,childDirName)
    // 得到一级目录路径所有文件
    let childFiles = fs.readdirSync(childPath)
    // 生成子文件目录
    let items = childFiles.map(childFileName => {
        // 这里把文章的第一行当做了目录的标题
        let filePath = path.join(childPath, childFileName)
        let fileContent = fs.readFileSync(filePath, {encoding:'utf-8'})
        let title = fileContent.split('\n')[0].replace(/^\#\s+/,'')
        
        return {
            text: title, link: `/${parentDirName}/${childDirName}/${childFileName}`
        }
    })
})
```
当然这里是没有考虑目录下不是md文件这些情况的。根据自己需要再做改动。