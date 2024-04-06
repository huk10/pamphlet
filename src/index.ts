export {build} from './build.js';
export {buildWithWatch} from './watch.js';
export {standard_preset, basis_preset} from './presets.js';

export type {
  BuildOptions,
  LayoutProps,
  LayoutOptions,
  Context,
  FrontMatter,
  Metadata,
  TableOfContent,
} from './type.js';

// `pamphlet` 的运行主要分为五个阶段：`解析 -> 初步转换 -> 进一步转换 -> 代码生成 -> 构建`
//
// - 解析阶段：     收集文档文件，并使用基于 `unified` 生态，对 Markdown 文件进行解析。
// - 初步转换阶段：  基于 `unified` 生态，对 Markdown 文件进行初步转换。这只要使用 `rehpye-jsxify` 这一个插件进行处理。
// - 进一步转换阶段：进行 layout 组件的处理。[ 上述生成的代码可能是这样的， import，const，function，]
// - 代码生成阶段：  页面元数据生成、将 jsx 文件输出到文件系统。
// - 构建阶段：     使用 esbuild 进行构建。
