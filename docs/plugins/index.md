---
navs:
  title: 插件
  order: 3
nude: true
---

# 插件

`pamphlet` 基于 `unified` 生态，并内置了部分插件，如果有需要可以配置使用。

## 内置插件

`pamphlet` 提供了两个预设插件集合，分别是 `basis_preset` 和 `standard_preset`。

`basis_preset` 的插件都是必须的，它包含以下插件：

- [remark-frontmatter](https://github.com/remarkjs/remark-frontmatter) 用于解析 `yaml` 格式的 front-matter 数据。
- [remark-slug](https://github.com/rehypejs/remark-slug) 为标题添加 `id` 。
- [rehype-autolink-headings](https://github.com/rehypejs/rehype-autolink-headings) 与 remark-slug 配合支持 hash 定位调整。

`standard_preset` 在 `basis_preset` 之上增加了 对 gfm 和数学公式的支持，列表如下：

- [remark-math](https://github.com/remarkjs/remark-math) 支持 Markdown 中的数学语法。
- [remark-gfm](https://github.com/remarkjs/remark-gfm) 支持 github flavored markdown。
- [remark-breaks](https://github.com/remarkjs/remark-breaks) 支持换行。
- [remark-directive](https://github.com/remarkjs/remark-directive) 支持通用的[指令提案](https://talk.commonmark.org/t/generic-directives-plugins-syntax/444)。
- [rehype-mathjax](https://github.com/remarkjs/remark-math/tree/main/packages/rehype-mathjax) 使用 MathJax 在 HTML 中渲染数学公式。
- [rehype-format](https://github.com/rehypejs/rehype-format) 对 html 进行格式化。

## 自定义插件

可以通过 `unified` 的插件机制自定义插件，或者使用 `unified` 生态的插件。

可以在 `build` 方法的 `options` 参数中配置插件。如：

```javascript
build({
  parseOptions: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});
```
