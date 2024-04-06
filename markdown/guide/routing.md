---
navs:
  order: 1
  title: 指南
group: 基础
order: 2
---

# 导航和路径

## 路径相关

pamphlet 内部的所有路径都需要时基于所在文件目录的相对路径，如：图片资源、内部链接、外部 Demo 组件等。

页面路由的生成是基于文件系统的，如：

baseDir 是 `./docs` 的话 ./docs/guide/routing.md 对应的路由是 ./guide/routing.html。

## 导航配置

目前 pamphlet 的默认导航系统，是通过 `front-matter` 属性来配置的。完整配置如下：

```markdown
---
navs:
  order: 1
  title: 导航标题
group:
  order: 1
  title: 导航组标题
order: 1
nude: false
title: 页面标题
---

<!-- other content -->
```

### navs

此属性会作为文档顶部导航的配置，它的类型是 `string | {order?: number, title: string}`。

pamphlet 会收集所有文档的 `navs` 属性，然后根据 `order` 排序，最后生成导航。

pamphlet 的导航系统分为三层，第一层是 navs，第二层是 group，第三层是 具体的文档。

### group

此属性表示文档在侧边导航栏中分组，它的类型是 `string | {order?: number, title: string}`。

pamphlet 会收集所有文档先按照 `navs` 分组，同一个 `navs` 再按照 `group` 分组，最后根据 `order` 排序生成导航。

### order

此属性表示此文档在其所在分组中的排序，默认是 0。

### title

侧边栏导航中显示的标题复用了文档标题，后续会考虑增加单独的配置。

### nude

如果某种场景下不想显示 group 名称，设置 `nude` 为 true 后，会将这些文档放在最顶层，并且不会显示 group 名称。
