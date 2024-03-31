import {Embeds} from './plugin/remark-embed.js';

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
}

// parse .md file result
export interface Metadata {
  embeds?: Embeds;
  // 配置的 front-matter 信息
  frontMatter: FrontMatter;
  toc?: any;
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

// Data that is exposed to use by Layout components.
// 这些数据会被写入到一个 data.js 文件中，它在 import 后会通过 props 传递给 Layout 组件和 Demo 组件。
export interface Data {
  logo: string;
  project: string;
  frontMatter: FrontMatter[];
  tableOfContents?: TableOfContent[];
}

declare module 'vfile' {
  interface VFile {
    data: Metadata;
  }
}
export {};
