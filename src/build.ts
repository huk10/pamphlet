import {compile} from './compile.js';
import {BuildOptions as EsBuildOptions} from 'esbuild';
import {Plugin, Preset, standard_preset} from './presets.js';
import {resolve, createProcessor, parse, transform} from './transform.js';
import {extname, relative, resolve as resolvePath} from 'node:path';

interface OptionalOptions {
  // html 标签的 lang 属性
  // 默认 en
  lang?: string;
  name?: string;
  logo?: string;
  favicon?: string;
  // 中间文件输出目录
  // 默认 node_modules/.pamphlet
  cacheDir?: string;
  tsconfig?: string;
  tsconfigRaw?: EsBuildOptions['tsconfigRaw'];
  // 是否将 css 文件和 js 文件内联到 html 中。
  // 默认：false
  inline?: boolean;
  // 预设的一组插件
  presets?: Preset;

  // 至少存在多少个 link 才生成 toc
  // 默认：3
  tableOfContentMinCount?: number;

  // remark 插件
  remarkPlugins?: Plugin[];
  // rehype 插件
  rehypePlugins?: Plugin[];
  // 国际化
  locales?: Array<{id: string; name: string}>;
}

export interface BuildOptions extends OptionalOptions {
  // default process.cwd
  // 后续的所有 path 都需要时相对与此路径或者是一个绝对路径
  cwd: string;
  // 首页
  entry: string;
  // 文档的公共前缀
  baseUrl: string;
  // 输出目录
  outDir: string;
}

function withDefaultOption(option: BuildOptions): BuildOptions {
  if (!option.lang) {
    option.lang = 'en';
  }
  if (!option.presets) {
    option.presets = standard_preset;
  }
  if (!option.cacheDir) {
    option.cacheDir = './node_modules/.pamphlet';
  }
  return option;
}

export async function build(option: BuildOptions) {
  const {
    cwd,
    logo,
    name,
    entry,
    outDir,
    presets,
    baseUrl,
    cacheDir,
    tsconfig,
    tsconfigRaw,
    lang,
    inline,
    favicon,
    rehypePlugins = [],
    remarkPlugins = [],
  } = withDefaultOption(option);

  // 找到所有的 Markdown 文档文件
  const docs = await resolve({cwd, baseUrl, entry});

  const remark_plugins = (presets?.remark || []).concat(remarkPlugins);
  const rehype_plugins = (presets?.rehpye || []).concat(rehypePlugins);

  const processor = () =>
    createProcessor(resolvePath(cwd, baseUrl), remark_plugins, rehype_plugins);

  // 解析并将 Markdown 转换为 jsx 文件。
  const metadata = await parse(resolvePath(cwd, outDir), processor, docs);

  // 将 jsx 文件和 code-blocks 输出到文件系统
  const result = await transform({
    cwd,
    entry,
    baseUrl,
    contents: metadata,
    outDir: cacheDir as string,
  });

  // 使用 esbuild 对每个 jsx 文件进行构建。
  for (const value of result) {
    const routeLink = relative(resolvePath(cwd, cacheDir!), value.path);
    await compile({
      cwd: cwd,
      outdir: outDir,
      entry: value.path,
      tsconfig: tsconfig,
      publicPath: 'assets',
      entryDir: cacheDir as string,
      tsconfigRaw: tsconfigRaw,
      html: {
        hash: true,
        inline: inline,
        favicon: favicon,
        title: value.title,
        lang: lang as string,
        description: value.description,
        outfile: routeLink.slice(0, -extname(routeLink).length),
      },
    });
  }
}
