import {ReactNode} from 'react';
import {Plugin, Preset} from './presets.js';
import {BuildOptions as EsBuildOptions} from 'esbuild';

// toc
export interface TableOfContent {
  hash: string;
  title: string;
  children: TableOfContent[];
}

// Basic front matter
export interface FrontMatter {
  // 优先 front-matter 其次 h1 或 h2 再其次 fileName
  title: string;
  created: string;
  updated: string;
  description?: string;

  // 如果为 true 并且 没有配置 group 属性，那么会将其搜集起来放在一个 empty group 中。
  nude: boolean;
  // 以下属性用于页面布局和路由导航。
  order: number;
  navs: string | {title: string; order: number};
  group: string | {title: string; order: number};
}

// parse .md file result
export interface Context {
  // 自增数字。
  uuid: number;
  embeds?: string[];
  // 配置的 front-matter 信息
  frontMatter: FrontMatter;
  // toc
  tableOfContents?: TableOfContent[];
  // 相对于当前文件的外部组件列表。
  externals: Array<{relative: string; source: string}>;
  // 当前文件中存在的内联 demo 列表。
  codeblocks: Array<{relative: string; content: string; fileName: string}>;
  // 内部 code blocks 涉及到那些语言。
  codes: Array<{lang: string; meta: string}>;
  // 文档中的内部导航引用
  // 这里的 path 是转换后的。
  inlineLinks: Array<{origin: string; path: string}>;
  // 文档内引入的静态资源-相对路径
  images: Array<{uuid: number; url: string; alt: string; source: string}>;
}

// 由外部配置传递给 Layout 属性。
export interface LayoutOptions {
  logo?: string;
  // todo 修改为 title 并且改为可选
  project: string;
  prefix?: string;
  hideToc?: boolean;
  hideHeader?: boolean;
  // 如果存在 icon 那么它必须是一个 url。它会作为 img 标签的 src 属性。
  // 如果存在 class 属性那么它会设置在 img 或 i 标签上
  // link 必须是一个外部链接。
  links?: Array<{icon: string; link: string; class: string}>;
}

// 自动生成的元数据
// 会输出到一个 js 文件，最终传递给 Layout 组件。
export interface Metadata extends LayoutOptions {
  homeLink: string;
  frontMatter: FrontMatter;
  tableOfContents: TableOfContent[];
  navigations: {title: string; path: string; active: boolean}[];
  menus: {title: string; children: {title: string; path: string; active: boolean}[]}[];
  // locales: Array<{name: string; url: string}>;
  // versions: Array<{name: string; url: string}>;
}

export interface LayoutProps {
  data: Metadata;
  // 文档内容会通过 children 传递给 Layout 组件
  children: ReactNode;
}

// 配置文件
export interface BuildOptions {
  // 后续的所有 path 都需要时相对与此路径或者是一个绝对路径
  // default process.cwd()
  cwd: string;
  // 首页
  entry: string;
  // 文档的公共前缀
  baseDir: string;
  // 输出目录
  outDir: string;
  // 中间文件存放目录
  // 默认 resolve(cwd, './pamphlet')
  cacheDir?: string;

  // todo 修改为 resolve
  parseOptions?: {
    // 至少存在多少的 link 才输出 toc
    // 默认为 3
    toc?: number;
    // 预设的一组插件
    // 提供了两个 presets：basis_preset、standard_preset(支持 gfm 和 数学公式)
    // 不要使用 rehypeHighlight 会与内部插件冲突
    presets?: Preset;
    // remark 插件
    remarkPlugins?: Plugin[];
    // rehype 插件
    rehypePlugins?: Plugin[];
  };

  html?: {
    // html 标签的 lang 属性
    // 默认 en
    lang?: string;
    // 需要是一个相对与 cwd 的相对路径
    favicon?: string;
    // html 模板，body 中必须存在一个 id 为 root 的元素。
    template?: string;
    // 是否将 css 文件和 js 文件内联到 html 中
    // 默认：否
    inline?: boolean;
  };

  // todo 包裹到 compile 中
  esbuild?: {
    tsconfig?: string;
    tsconfigRaw?: EsBuildOptions['tsconfigRaw'];
  };

  // 自定义渲染组件
  components?: {
    // 一个路径，相对与 cwd 的路径或者 npm 包。
    // 它需要导出一个名为 Demo 的 React 组件。
    demo?: string;
    // 一个路径，相对与 cwd 的路径或者 npm 包。
    // 它需要导出一个名为 Layout 的 React 组件。
    layout?: string;
    // 一个路径，相对与 cwd 的路径或者 npm 包。
    // 它需要导出一个名为 CodeBlock 的 React 组件。
    codeBlock?: string;
  };

  layoutProps: LayoutOptions;
}

declare module 'vfile' {
  interface VFile {
    data: Context;
  }
}
export {};
