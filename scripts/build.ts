import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';
import {lessLoader} from 'esbuild-plugin-less';

const r = (p: string) => resolve(fileURLToPath(dirname(import.meta.url)), p);

// build components
await build({
  bundle: true,
  minify: false,
  format: 'esm',
  target: 'es2022',
  treeShaking: true,
  platform: 'browser',
  // 不排除任何库：243kb
  // react  116kb
  // prismjs 59kb
  // styled-components 60kb
  // 其他的依赖可忽略不计。
  external: ['react'],
  outfile: r('../libs/components/index.js'),
  tsconfig: r('../tsconfig.build.json'),
  entryPoints: [r('../src/components/index.ts')],
  plugins: [lessLoader()],
});

await build({
  bundle: true,
  minify: false,
  format: 'cjs',
  // banner: {
  // https://github.com/evanw/esbuild/pull/2067
  // 'js': 'import { createRequire } from \'module\';const require = createRequire(import.meta.url);',
  // },
  target: 'es2022',
  platform: 'node',
  treeShaking: true,
  // jsdom 压缩后 5m
  external: ['jsdom', 'esbuild', 'chokidar'],
  metafile: true,
  outfile: r('../libs/index.cjs'),
  tsconfig: r('../tsconfig.build.json'),
  entryPoints: [r('../src/index.ts')],
});
