---
navs: 配置
nude: true
---

# 配置选项

`pamphlet` 是高度可配置的，你可以通过向 `build` 函数传递一个对象来配置它。

```javascript
import {build} from 'pamphlet';
build({
  // ...
});
```

## 基础配置

#### cwd

`cwd` 选项指定了当前工作目录，它必须是一个绝对路径。后续的所有路径都会相对于它。

- 类型：`string`
- 默认值：`process.cwd()`

#### entry

项目文档首页，它必须是一个 markdown 文件。
如果此路径不是 `resolve(cwd, baseDir, './index.md')`, 那么就不能存在 `resolve(cwd, baseDir, './index.md')` 文件。

- 类型：`string`
- 默认值：`resolve(cwd, baseDir, './index.md')`

#### baseDir

`baseDir` 选项指定了文档目录的公共前缀。它必须是所有文档的父目录。**entry 所在文件可以不在其中**

- 类型：`string`
- 默认值：无

#### outDir

`outDir` 选项指定了文档的输出目录。

- 类型：`string`
- 默认值：`resolve(cwd, './dist')`

#### tempDir

`tempDir` 选项指定了文档的临时目录。它会用来存储一些中间文件。

- 类型：`string`
- 默认值：`resolve(cwd, './.pamphlet')`

## 解析配置

### parseOptions

`parseOptions` 选项指定了文档解析相关的配置。它是一个对象，包含以下属性：

#### toc

`toc` 属性是一个对象，包含以下属性：

##### count

`count` 属性指定了文档中至少存在多少个标题才输出 `toc`。

- 类型：`number`
- 默认值：`3`

##### depth

`depth` 属性指定了解析 `toc` 的最大深度。

- 类型：`number`，可选范围：`1~6`
- 默认值：`6`

#### presets

`presets` 属性指定了一些 `unified` 的预设插件。

- 类型：`Preset`
- 默认值：`basis_preset`

对于 `preset` 具体包含哪些插件，可以查看 [此处](../plugins/index.md)。

#### remarkPlugins

`remarkPlugins` 属性指定了 `unified` 的 remark 插件。

- 类型：`Plugin[]`
- 默认值：无

#### rehypePlugins

`rehypePlugins` 属性指定了 `unified` 的 rehype 插件。

- 类型：`Plugin[]`
- 默认值：无

## 编译配置

### esbuild

`esbuild` 选项指定了 `esbuild` 的配置。它目前仅支持 `tsconfig` 和 `tsconfigRaw` 两个属性。后续会支持更多的配置。

### html

`html` 选项指定了构建后输出 `html` 的一些配置。它是一个对象，包含以下属性：

#### lang

`lang` 属性指定了 `html` 的 `lang` 属性。

- 类型：`string`
- 默认值：`en`

#### favicon

`favicon` 属性指定了 `html` 的 `favicon`。它可以是一个相对路径，相对于 `cwd` 或者是一个网络链接。

- 类型：`string`
- 默认值：无

#### template

`template` 属性指定了 `html` 的模板。

它必须包含一个 `id` 为 `root` 的元素。

- 类型：`string`

默认值：

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

#### inline

`inline` 属性指定了 `html` 是否将 css 和 js 内联到 html 中。

- 类型：`boolean`
- 默认值：`false`

## 渲染配置

### 自定义组件

`components` 属性指定了自定义的渲染组件。它是一个对象，包含以下属性：

```typescript
interface Components {
  // 一个路径，相对与 cwd 的路径或者 npm 包。
  // 它需要导出一个名为 Demo 的 React 组件。
  demo?: string;
  // 一个路径，相对与 cwd 的路径或者 npm 包。
  // 它需要导出一个名为 Layout 的 React 组件。
  layout?: string;
  // 一个路径，相对与 cwd 的路径或者 npm 包。
  // 它需要导出一个名为 CodeBlock 的 React 组件。
  codeBlock?: string;
}
```

#### demo

`demo` 属性指定了 `demo` 的渲染组件。它必须是一个路径，相对与 cwd 的路径或者 npm 包。

#### layout

`layout` 属性指定了 `layout` 的渲染组件。它必须是一个路径，相对与 cwd 的路径或者 npm 包。

#### codeBlock

`codeBlock` 属性指定了 `codeBlock` 的渲染组件。它必须是一个路径，相对与 cwd 的路径或者 npm 包。

### 布局组件配置

`layoutProps` 属性指定了 `layout` 的渲染组件的配置。无论是否使用自定义组件，它都会作为 `Layout` 组件的 props。

它是一个对象，包含以下属性：

#### logo

`logo` 属性需要是一个图片链接，它会放在文档页面的左上角。

- 类型：`string` 可以是相对路径，也可以是一个网络链接。
- 默认值：无

#### title

`title` 属性应该是项目名称。它会在文档页面的左上角显示。

- 类型：`string`
- 默认值：package.json 中的 `name` 字段

#### prefix

`prefix` 属性指定了默认组件的 css 样式前缀。

- 类型：`string`
- 默认值：`pamphlet`

#### hideToc

`hideToc` 属性指定了是否隐藏 `toc`。

- 类型：`boolean`
- 默认值：`false`

#### hideHeader

`hideHeader` 属性指定了是否隐藏 `header`。

- 类型：`boolean`
- 默认值：`false`

#### links

`links` 属性指定了一些项目相关的外部链接，如 github、npm 等。

- 类型：`Array<{icon: string; link: string; class: string}>`
- 默认值：无

```typescript
interface Link {
  // 一个 url。它会作为 img 标签的 src 属性。必须是一个网络链接。
  icon: string;
  // 外部链接地址。必须是一个网络链接。
  link: string;
  // 如果存在 class 属性那么它会设置在 img 或 i 标签上
  // 如果图标来源是字体图标，那么可以使用它来指定图标。
  class: string;
}
```
