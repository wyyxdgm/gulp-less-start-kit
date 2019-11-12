# 官网快速构建


## Getting Started

主要包括一些开发任务和自动编译

### 开发基础

1.需要node环境，参考[Installing Node.js via package manager](https://nodejs.org/en/download/package-manager/)  

2.quick start

```
npm install
npm run dev
npm run serve
```

### 开发指南

gulp 任务

```
├─┬ default                 // 一次性编译链接资源文件到dist/
│ ├── build:html
│ ├── css
│ └── copy
├─┬ watch                   // 开发时watch任务，自动更新，包含很多细分任务
│ ├── default
│ ├── watchhtml
│ ├── watchi18n
│ ├── watchcss
│ ├── watchcopy
│ ├── watchdev
│ └── serve
├── watchi18n               // watch i18n/*.js
├── watchdev                // 开发便利，lab/src/**下编辑代码片段能生成到lab/dist/**
├── watchcss
├── css                     // 编译src/css下的资源到dist/，支持less等
├── serve                   // start a static server at 8888
├── clean
├── watchcopy
├── copy                    // 拷贝相关资源到 dist/**
├── watchhtml
└── build:html              // src/index.html -> dist/{{i18n}}/index.html

```

资源结构

```
├── dist           # gulp 生成目录
│   ├── css
│   ├── en
│   ├── files
│   ├── fonts
│   ├── i18n
│   ├── img
│   ├── js
│   ├── video
│   └── zh
├── i18n
├── lab            # 开发便利目录
│   ├── dist
│   └── src
├── lib
├── config.js      # 配置语言部署信息等
├── node_modules
│   ├── ...
│   └── ...
└── src
    ├── css
    ├── files
    ├── fonts
    ├── i18n
    ├── img
    ├── pages  # ejs 页面
    ├── js
    └── video

```

dist目录由 `gulp` 可以生成

开发时使用 `gulp watch`，保持页面实时更新

## dev测试

src/index.html 增加一段HTML

* 片段生成例子

1. 执行 `gulp watch`，进入开发状态。
2. 新建lab/src/input.html（格式`/\w+.html/`），代码如下。

```html
<div class="col-12 col-lg-6 flex-center">
  <div class="core-idea-item flex-center wow fadeInUp" data-wow-delay="0.2s">
    <div class="text-center mt-10">
      <h3>标题</h3>
      <p>内容 12333。</p>
    </div>
  </div>
</div>
```

* 生成lab/dist/input.html

```ejs
<div class="col-12 col-lg-6 flex-center">
  <div class="core-idea-item flex-center wow fadeInUp" data-wow-delay="0.2s">
    <div class="text-center mt-10">
      <h3><%=__('标题')%></h3>
      <p><%=__('内容 12333。')%></p>
    </div>
  </div>
</div>
```

* 生成lab/dist/input.{i18n}.js 并自动导入 i18n/{i18n}.js

```js
// file: lab/dist/input.zh.js
{
    "标题": "标题",
    "内容 12333。": "内容 12333。"
}
// file: lab/dist/input.en.js
{
    "标题": "Title",
    "内容 12333。": "Content 12333."
}
```

## Details

* 同名文件引用

* `src/files/` 下面的文件对外访问路径，统一为如下路径。

```bash
/files/public-en.file
/files/public-zh.file
```

文件更新，使用:`ln -snf source_file open_link_name`

```bash
# ln -snf public-en-v{n}.file public-en.file
# ln -snf public-zh-v{n}.file public-zh.file
```
