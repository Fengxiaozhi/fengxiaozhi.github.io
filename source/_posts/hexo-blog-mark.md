---
title: Hexo搭建记录
date: 2023-05-11 11:58:23
tags: ["问题集"]
---
## hexo搭建时碰到的问题

- 构建部署过程，Git workflow生成的html为空的

    

### 构建部署过程，Git workflow生成的html为空的

原因是使用的主题没有被push上去仓库。

主题是克隆下来的，所以在推送的时候 .gitmodules记录远程仓库其实是一个软连接，没有把实际的本地代码推送上去，并且我的主题是自定义过了，所以需要处理一下把主题推送上去。

.gitmodules

解决：

1、把主题文件夹里面的git相关信息删除。.gitmodules里面相关信息也删除


2、把本地git的cache清理一下

```javascript
git rm --cache themes/hexo-theme-clean-blog
```

3、上面两个步骤都不行，那就直接把改造过的主题内容copy出来然后再paste进去themes里面