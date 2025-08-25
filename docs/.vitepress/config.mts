import { defineConfig } from 'vitepress'
import fs from 'fs'
import path from 'path'

let dirMapName = {
  'node': 'Node',
  'frontend': '前端', 
  'weekly': '周报', 
  'other':'其他'
}
let getFilePosts = async () => {
  let parentDirName = 'posts'
  let parentPath = path.join(__dirname,`../${parentDirName}`)
    // 获取post下的文件列表
    fs.readdir(parentPath, (err, postDirFiles) => {
      // 开始遍历子目录
      postDirFiles.map(childDirName => {
        let barOj = sidebar[`/${parentDirName}/${childDirName}/`]
        if(!barOj) {
          barOj = sidebar[`/${parentDirName}/${childDirName}/`] = []
        }
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
          console.log(title)
          return {
            text: title, link: `/${parentDirName}/${childDirName}/${childFileName}`
          }
        })

        barOj.push({
          text: dirMapName[childDirName],
          items
        })
      })
    //   console.log('files', sidebar)
    })
}
let sidebar = getFilePosts()


// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "记录",
  description: "记录一些可回顾的东西",
  ignoreDeadLinks: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Node', link: '/posts/node/infos-node' },
      { text: '前端', link: '/posts/frontend/sse' },
      { text: '周报', link: '/posts/weekly/remark-week-log' },
      { text: '其他', link: '/posts/other/hexo-blog-mark' }
    ],
    sidebar,

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Fengxiaozhi/fengxiaozhi.github.io' }
    ]
  }
})
