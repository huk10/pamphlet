import {resolve} from 'node:path';
import {build as esbuild, BuildOptions} from 'esbuild';
import {htmlPlugin, HtmlPluginOptions} from './plugin/esbuild-plugin-html.js';
import {
  COMPONENTS_PACKAGE_PATH,
  GENERATE_CODEBLOCKS_DIR_PATH,
  GENERATE_SITE_DATA_PATH,
} from './constants.js';

interface CompileOption {
  cwd: string;
  // build 的文件的 base 目录。
  entryDir: string;
  // 入口文件
  // 这需要时一个相对于的 cwd 的路径或者是一个绝对路径
  entry: string;
  // 输出目录 绝对路径或者是一个相对于 cwd 的路径
  outdir: string;
  // 静态资源的publicPath
  publicPath?: string;
  // 这需要时一个相对于的 cwd 的路径或者是一个绝对路径
  tsconfig?: string;
  tsconfigRaw?: BuildOptions['tsconfigRaw'];
  html: HtmlPluginOptions;
}

// 生成的目录结构需要与路由链接匹配。
// 对一个入口文件进行编译，生成一个html文件
export async function compile(params: CompileOption) {
  const {entry, cwd, html, outdir, publicPath, tsconfig, tsconfigRaw, entryDir} = params;

  // build components
  await esbuild({
    bundle: true,
    minify: false,
    write: false,
    format: 'esm',
    metafile: true,
    target: 'es2022',
    treeShaking: true,
    platform: 'browser',
    entryPoints: [entry],
    tsconfigRaw: tsconfigRaw,
    assetNames: '[ext]/[name]-[hash]',
    publicPath: publicPath || 'assets',
    outdir: resolve(cwd, outdir),
    tsconfig: tsconfig ? resolve(cwd, tsconfig) : undefined,
    alias: {
      [GENERATE_SITE_DATA_PATH]: resolve(cwd, entryDir, './data.js'),
      [COMPONENTS_PACKAGE_PATH]: resolve(cwd, './src/components/index.ts'),
      [GENERATE_CODEBLOCKS_DIR_PATH]: resolve(cwd, entryDir, './codeblocks'),
    },
    plugins: [htmlPlugin(html)],
    loader: {
      '.png': 'file',
      '.jpeg': 'file',
    },
  });
}
