import {readSync} from 'to-vfile';
import {Plugin} from '../presets.js';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import {relative, resolve} from 'node:path';
import remarkToc from '../plugins/remark-toc.js';
import rehpyeImg from '../plugins/rehpye-img.js';
import rehpyeRaw from '../plugins/rehpye-raw.js';
import remarkLink from '../plugins/remark-link.js';
import rehpyeDemo from '../plugins/rehpye-demo.js';
import rehpyeJsxify from '../plugins/rehpye-jsxify.js';
import remarkMetadata from '../plugins/remark-metadata.js';
import {Plugin as UPlugin, Processor, unified} from 'unified';
import {FrontMatter, Context, TableOfContent} from '../type.js';

export interface ParseResult {
  // 当前文件路径。
  url: string;
  // 一段 path，输出时需要拼接目录名称，有需要可以修改后缀名称。这里是原生后缀。
  outfile: string;
  // 一个自增 id;
  uuid: number;
  // 文件内容转换后的。
  content: string | Buffer;
  // 使用到的图片资源。
  images: Context['images'];
  // 配置的 front-matter 信息
  frontMatter: FrontMatter;
  // 相对于当前文件的外部组件列表。
  externals: Array<{relative: string; source: string}>;
  // 当前文件中存在的内联 demo 列表。
  codeblocks: Array<{relative: string; content: string; fileName: string}>;
  // 目录大纲
  tableOfContents?: TableOfContent[];
}

interface CreateProcessorOptions {
  entry: string;
  baseUrl: string;
  remark: Plugin[];
  rehpye: Plugin[];
}

export function createProcessor(options: CreateProcessorOptions): Processor {
  const {entry, baseUrl, remark, rehpye} = options;
  const processor = unified().use(remarkParse);

  const appendPlugin = <T>(plugin: Plugin<T>) => {
    if (typeof plugin === 'function') {
      processor.use(plugin as any);
    } else if (Array.isArray(plugin)) {
      processor.use(plugin[0] as UPlugin, plugin[1]);
    }
  };

  remark.forEach(plugin => appendPlugin(plugin));

  // appendPlugin(remarkEmbed);
  appendPlugin([remarkToc, {count: 3, maxDepth: 6}]);
  appendPlugin([remarkLink, {entry, baseUrl}]);

  appendPlugin(remarkMetadata);

  processor.use(remarkRehype, {allowDangerousHtml: true} as any);

  rehpye.forEach(plugin => appendPlugin(plugin));
  appendPlugin(rehpyeRaw);
  appendPlugin(rehpyeImg);
  appendPlugin(rehpyeDemo);

  return processor;
}

type Func = () => Processor;
type ReturnValue = Promise<ParseResult[]>;

// todo parseDoc 要与 createProcessor 合并， createProcessor 不对外暴露
interface ParseOptions {
  processor: Func;
  entry: string;
  outDir: string;
  baseDir: string;
  docs: string[];
}

export async function parseDoc(options: ParseOptions): ReturnValue {
  const {processor, outDir, entry, docs, baseDir} = options;
  const values: ParseResult[] = [];
  for (const url of docs) {
    const result = await processor().use(rehpyeJsxify, {outDir, baseDir}).processSync(readSync(url));
    const data = result.data as unknown as Context;

    values.push({
      url: url,
      // todo outfile 属性是转换过的用于输出到文件系统。
      // todo outfile 应该是一段 path，使用方需要指定目录，有需要可以修改后缀名称。
      // 需要转换首页路径
      outfile: url === entry ? 'index.md' : relative(baseDir, url),
      uuid: data.uuid,
      images: data.images,
      content: result.value,
      externals: data.externals,
      codeblocks: data.codeblocks,
      frontMatter: data.frontMatter,
      tableOfContents: data.tableOfContents,
    });
  }
  return values;
}
