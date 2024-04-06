import {compile} from './compile.js';
import {readdir} from 'node:fs/promises';
import {build as esbuild} from 'esbuild';
import type {BuildOptions} from './type.js';
import {standard_preset} from './presets.js';
import {lessLoader} from 'esbuild-plugin-less';
import {extname, resolve} from 'node:path';
import {htmlPlugin} from './plugins/esbuild-plugin-html.js';
import {
  ASSETS_FILE_DIRS,
  ASSETS_PATH,
  CODEBLOCKS_FILE_DIRS,
  COMPONENTS_CODEBLOCKS_PATH,
  COMPONENTS_DEMO_PATH,
  COMPONENTS_LAYOUT_PATH,
  DEFAULT_LAYOUT_CLASS_PREFIX,
  GENERATE_CODEBLOCKS_DIR_PATH,
  GENERATE_METADATA_DIR_PATH,
  METADATA_FILE_DIRS,
} from './constants.js';

export function withDefaultOption(option: BuildOptions): BuildOptions {
  option.html ??= {};
  option.esbuild ??= {};
  option.parseOptions ??= {};
  option.components ??= {};
  if (!option.cwd) {
    option.cwd = process.cwd();
  }
  if (!option.html.lang) {
    option.html.lang = 'en';
  }
  if (!option.parseOptions.presets) {
    option.parseOptions.presets = standard_preset;
  }
  if (!option.layoutProps.prefix) {
    option.layoutProps.prefix = 'pamphlet';
  }
  if (!option.cacheDir) {
    option.cacheDir = resolve(option.cwd, './pamphlet');
  }
  option.entry = resolve(option.cwd, option.entry);
  option.outDir = resolve(option.cwd, option.outDir);
  option.baseDir = resolve(option.cwd, option.baseDir);
  option.cacheDir = resolve(option.cwd, option.cacheDir);
  return option;
}

export async function build(option: BuildOptions) {
  const {
    cwd,
    html,
    entry,
    outDir,
    baseDir,
    cacheDir,
    components,
    layoutProps,
    parseOptions,
    esbuild: esbuildOptions,
  } = withDefaultOption(option);

  let entryPoint = entry;
  const dirs = await readdir(resolve(cwd, baseDir));
  const findResult = dirs.find(val => /index\.(md|markdown)/.test(val));
  if (findResult) {
    entryPoint = resolve(cwd, baseDir, `index${extname(findResult)}`);
  }
  const result = await compile({
    baseUrl: baseDir,
    outDir: cacheDir!,
    entry: entryPoint,
    layoutProps: layoutProps,
    parseOptions: parseOptions,
  });

  // todo 默认组件的路径，如果发布到 npm 包的话需要修改一下。
  const demoComponentImportPath = components?.demo || './src/components/demo.tsx';
  const layoutComponentImportPath = components?.layout || './src/components/layout.tsx';
  const codeBlocksComponentImportPath = components?.codeBlock || './src/components/demo.tsx';

  // 使用 esbuild 对每个 jsx 文件进行构建。
  for (const value of result) {
    const entryPoint = resolve(cwd, cacheDir!, value.outfile).replace(
      extname(value.outfile),
      '.jsx'
    );

    const outfile = resolve(cwd, outDir, value.outfile).replace(extname(value.outfile), '.html');
    await esbuild({
      bundle: true,
      minify: false,
      write: false,
      format: 'esm',
      metafile: true,
      target: 'es2022',
      treeShaking: true,
      platform: 'browser',
      publicPath: 'assets',
      entryPoints: [entryPoint],
      outdir: resolve(cwd, outDir),
      assetNames: '[ext]/[name]-[hash]',
      tsconfigRaw: esbuildOptions?.tsconfigRaw,
      tsconfig: esbuildOptions?.tsconfig ? resolve(cwd, esbuildOptions.tsconfig) : undefined,
      alias: {
        [COMPONENTS_DEMO_PATH]: resolve(cwd, demoComponentImportPath),
        [COMPONENTS_LAYOUT_PATH]: resolve(cwd, layoutComponentImportPath),
        [COMPONENTS_CODEBLOCKS_PATH]: resolve(cwd, codeBlocksComponentImportPath),
        [ASSETS_PATH]: resolve(cwd, cacheDir!, ASSETS_FILE_DIRS),
        [GENERATE_METADATA_DIR_PATH]: resolve(cwd, cacheDir!, METADATA_FILE_DIRS),
        [GENERATE_CODEBLOCKS_DIR_PATH]: resolve(cwd, cacheDir!, CODEBLOCKS_FILE_DIRS),
      },
      loader: {
        '.png': 'file',
        '.jpeg': 'file',
        '.jpg': 'file',
        '.gif': 'file',
      },
      plugins: [
        lessLoader({
          modifyVars: {
            prefix: layoutProps.prefix || DEFAULT_LAYOUT_CLASS_PREFIX,
          },
        }),
        htmlPlugin({
          hash: true,
          outfile: outfile,
          inline: html!.inline,
          favicon: html!.favicon,
          lang: html!.lang!,
          title: value.frontMatter.title,
          description: value.frontMatter.description,
        }),
      ],
    });
  }
}
