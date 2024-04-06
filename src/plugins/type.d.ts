export interface NodeData {
  // rehpye-raw 插件会写入此属性。
  raw?: {
    path: string;
    // 代码块所在的目录，它是一个绝对路径
    relative: string;
  };
  // rehpye-img 插件会写入此属性。
  image?: {
    url: string;
    alt: string;
    uuid: number;
  };
  // rehpye-demo 插件会写入此属性。它 与 raw 是相同的。
  // 外部 Demo，会使用 CodeBlock 渲染。
  external?: {
    // 外部组件的 path，它相对于 relative
    source: string;
    // 代码块所在的目录，它是一个绝对路径
    relative: string;
  };
  // rehpye-demo 插件会写入此属性。
  // 代码块，会使用 CodeBlock 渲染。
  codeBlock?: {
    // 嵌入代码块的语言
    lang: string;
    // 嵌入的代码块内容。
    content: string;
    // 代码块所在的目录，它是一个绝对路径
    relative: string;
  };
  // rehpye-demo 插件会写入此属性。
  // 代码块，会使用 Demo 渲染。
  embedDemo?: {
    // 嵌入代码块的语言
    lang: string;
    // 嵌入的代码块内容。
    content: string;
    // 代码块所在的目录，它是一个绝对路径
    relative: string;
  };
}
