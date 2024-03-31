import {readSync} from 'to-vfile';
import {Plugin} from './presets.js';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import {Processor, unified} from 'unified';
import {createDirectory} from './utils.js';
import rehpyeRaw from './plugin/rehpye-raw.js';
import remarkToc from './plugin/remark-toc.js';
import rehpyeImg from './plugin/rehpye-img.js';
import {FrontMatter, Metadata} from './type.js';
import rehpyeDemo from './plugin/rehpye-demo.js';
import remarkEmbed from './plugin/remark-embed.js';
import remarkLink from './plugin/remark-link.js';
import rehpyeJsxify from './plugin/rehpye-jsxify.js';
import remarkMetadata from './plugin/remark-metadata.js';
import {readdir, stat, writeFile, copyFile} from 'node:fs/promises';
import {dirname, extname, relative, resolve as resolvePath} from 'node:path';

export interface FileMetadata {
  // 当前文件路径。
  url: string;
  content: string | Buffer;
  metadata: {
    images: Metadata['images'];
    // 配置的 front-matter 信息
    frontMatter: FrontMatter;
    // 相对于当前文件的外部组件列表。
    externals: Array<{relative: string; source: string}>;
    // 当前文件中存在的内联 demo 列表。
    codeblocks: Array<{relative: string; content: string; fileName: string}>;
  };
}

export function createProcessor(baseUrl: string, remark: Plugin[], rehpye: Plugin[]): Processor {
  const processor = unified().use(remarkParse);

  const appendPlugin = (plugin: Plugin) => {
    if (typeof plugin === 'function') {
      processor.use(plugin as any);
    } else if (Array.isArray(plugin)) {
      const settings = plugin.slice(1);
      processor.use(plugin[0] as any, ...settings);
    }
  };

  appendPlugin([remarkToc, {limit: 3}] as Plugin);
  appendPlugin(remarkEmbed);
  appendPlugin(remarkMetadata);
  appendPlugin([remarkLink, {baseUrl: baseUrl}] as Plugin);

  remark.forEach(plugin => appendPlugin(plugin));

  processor.use(remarkRehype, {allowDangerousHtml: true} as any);

  appendPlugin(rehpyeRaw);
  appendPlugin(rehpyeImg);
  appendPlugin(rehpyeDemo);
  rehpye.forEach(plugin => appendPlugin(plugin));

  return processor;
}

interface ResolveParams {
  // 其他的路径都可以是相对此路径的相对路径。
  cwd: string;
  // 入口文件，可以不在 baseUrl 之中
  entry: string;
  // 存放所有文档文件的目录。
  baseUrl: string;
}

export async function resolve(params: ResolveParams): Promise<string[]> {
  const {cwd, baseUrl, entry} = params;
  const result: string[] = [];
  const dirs = [resolvePath(cwd, baseUrl)];
  const entryPoint = resolvePath(cwd, entry);
  while (dirs.length) {
    const url = dirs.shift()!;
    const info = await stat(url);
    if (!info.isFile() && !info.isDirectory()) {
      continue;
    }
    if (info.isDirectory()) {
      for (const sub of await readdir(url)) {
        dirs.push(url + '/' + sub);
      }
    }
    const ext = extname(url);
    if (['.markdown', '.md'].includes(ext) && url !== entryPoint) {
      result.push(url);
    }
  }
  result.push(entryPoint);
  return result;
}

export async function parse(
  outDir: string,
  processor: () => Processor,
  docs: string[]
): Promise<FileMetadata[]> {
  const metadata: FileMetadata[] = [];
  for (const doc of docs) {
    const result = await processor()
      .use(rehpyeJsxify, {outDir} as any)
      .processSync(readSync(doc));
    const data = result.data as unknown as Metadata;
    metadata.push({
      url: doc,
      content: result.value,
      metadata: {
        images: data.images,
        externals: data.externals,
        codeblocks: data.codeblocks,
        frontMatter: data.frontMatter,
      },
    });
  }
  return metadata;
}

export interface TransformParams {
  cwd: string;
  entry: string;
  // 文档说所在的公共目录，代码生成和路由会依据此生成。
  baseUrl: string;
  // 输出目录，输出的结果会根据 baseUrl 和具体文件系统结构生成。
  outDir: string;
  // 所有找到的文档文件，仅包含入口
  contents: FileMetadata[];
}

// 预编译为jsx文件
export async function transform(params: TransformParams) {
  const {entry, contents, baseUrl, outDir, cwd} = params;
  const result = [];
  for (const {url, metadata, content} of contents) {
    const isEntry = url === entry;

    const ext = extname(url);
    const path = relative(resolvePath(cwd, baseUrl), url).slice(0, -ext.length);
    const outfile =
      resolvePath(cwd, outDir, isEntry ? './index' : path.startsWith('.') ? path : './' + path) +
      '.jsx';
    const dir = dirname(outfile);

    await createDirectory(dir);
    await writeFile(outfile, content);
    if (metadata.codeblocks.length) {
      await createDirectory(resolvePath(cwd, outDir, './codeblocks'));
    }
    for (const codes of metadata.codeblocks || []) {
      await writeFile(
        resolvePath(cwd, outDir, './codeblocks', './' + codes.fileName),
        codes.content
      );
    }

    for (const img of metadata.images) {
      await copyFile(img.source, resolvePath(cwd, outDir, img.url));
    }

    result.push({
      path: outfile,
      title: metadata.frontMatter.title!,
      description: metadata.frontMatter.description || '',
    });
  }
  await writeFile(
    resolvePath(outDir, './data.js'),
    `
  export const navs = [];
  export const menus = [];
  `
  );
  return result;
}
