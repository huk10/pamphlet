---
navs: 指南
group:
  title: 进阶
  order: 3
order: 10
---

# 自定义组件

`pamphlet` 会将文档内容编译成 `React` 组件，然后传递给 `Layout` 组件进行渲染。

可以通过 config 的 `components` 配置项进行配置：

```typescript
build({
  // 组件地址是相对于当前文档根目录的，但是它也可以是一个 npm 包。
  components: {
    // 它需要导出一个名叫 Demo 的组件。
    demo: './components/demo.jsx',
    // 它需要导出一个名叫 Layout 的组件。
    layout: './components/layout.jsx',
    // 它需要导出一个名叫 CodeBlock 的组件。
    codeBlock: './components/code-block.jsx',
  },
});
```

## Demo 组件

`Demo` 组件用于渲染文档中的示例代码。它可以展示渲染结果和源代码。

```TypeScript
interface DemoProps {
  lang: string;
  content: string;
  children: React.ReactNode;
}
```

## Layout 组件

`Layout` 组件用于渲染文档的布局。它接收一个 `children` 属性，表示文档内容。

```TypeScript
// 由外部配置传递给 Layout 的属性。
interface LayoutOptions {
  logo?: string;
  project: string;
  prefix?: string;
  hideToc?: boolean;
  hideHeader?: boolean;
  // 如果存在 icon 那么它必须是一个 url。它会作为 img 标签的 src 属性。
  // 如果存在 class 属性那么它会设置在 img 或 i 标签上
  // link 必须是一个外部链接。
  links?: Array<{icon: string; link: string; class: string}>;
}
// 自动生成的数据。
interface Metadata{
  // 首页路径，这里是一个相对路径，是首页相对于当前文档的路径。
  homeLink: string;
  // 文档的 frontMatter 配置，也就是说如果使用自定义布局组件，就可以使用 frontMatter 向布局组件传递数据。
  frontMatter: FrontMatter;
  // toc 目录。
  tableOfContents: TableOfContent[];
  // 顶部导航栏。
  navigations: {title: string; path: string; active: boolean}[];
  // 侧边导航栏。
  menus: {title: string; children: {title: string; path: string; active: boolean}[]}[];
}
interface LayoutProps {
  data: Metadata & LayoutOptions;
  children: React.ReactNode;
}
```

_如果使用自定义布局组件，那么就可以通过文档的 front-matter 和 layoutProps 配置传递自定义的配置属性。_

## CodeBlock 组件

`CodeBlock` 组件用于渲染代码块。如果对内置的代码高亮组件不满意，可以通过 `components.codeBlock` 配置项进行自定义。

```TypeScript
interface DemoProps {
  lang: string;
  content: string;
}
```
