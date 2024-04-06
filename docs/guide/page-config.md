---
navs: 指南
group: 基础
order: 3
---

# 页面渲染配置

`pamphlet` 支持通过提 Front-Matter 属性，配置文档页面属性。

## 单文档页面配置

```markdown
---
title: 页面标题
description: 页面描述
created: 页面创建时间
updated: 页面更新时间
---

<!-- ... 其他内容 -->
```

### title

此属性会作为文档标题，也就是 HTML 的 `<title>` 标签。

它会按照优先级取值：

- front-matter 中的 `title` 属性
- Markdown 文档中最近最大的 `#` 标题
- 文档文件名

### description

此属性会作为文档描述，也就是 HTML 的 `<meta name="description">` 标签。

### created

此属性会作为文档创建时间，目前还没有展示的地方，如果使用自定义布局组件，可以从 `props` 中获取。

### updated

此属性会作为文档更新时间，会放置在文档的末尾展示。

## 影响全局的配置

目前 pamphlet 的默认导航系统，是通过 `front-matter` 属性来配置的。具体可以参考 [导航和路径](./routing.md)。
