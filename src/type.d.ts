import {Embeds} from './plugin/remark-embed.js';
import {FrontMatter} from './plugin/remark-metadata.js';

export interface Menu {
  name: string;
  path: string;
  order: number;
}
export interface Group {
  name: string;
  order: number;
  children: Menu[];
}
export interface Navigation {
  name: string;
  path: string;
  order: number;
}

export interface Metadata {
  embeds?: Embeds;
  // js ast
  toc?: any;

  // 配置的 front-matter 信息
  frontMatter: FrontMatter;
  // 相对于当前文件的外部组件列表。
  externals: Array<{relative: string; source: string}>;
  // 当前文件中存在的内联 demo 列表。
  // 统一写入 resolve(outdir, GENERATE_CODEBLOCKS_DIR_PATH) 目录中，它们的文件名称会附带从零递增的uuid
  codeblocks: Array<{relative: string; content: string; fileName: string}>;
  // toc esast
  tableOfContent: string;
  // 文档内引入的静态资源-相对路径
  images: Array<{uuid: number; url: string; alt: string; source: string}>;
  // 文档中的内部导航引用
  // 这里的 path 是转换后的。
  inlineLinks: Array<{origin: string; path: string}>;
}


export interface FileData {

}




// eslint-disable-next-line @typescript-eslint/ban-types
export type Plugin = Array<Function | [Function, object]>;

declare module 'vfile' {
  interface VFile {
    data: Metadata;
  }
}
export {};
