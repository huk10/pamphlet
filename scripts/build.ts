import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';

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
});

await build({
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2022',
  platform: 'node',
  treeShaking: true,
  // jsdom 压缩后 5m
  // external: ['jsdom'],
  metafile: true,
  outfile: r('../libs/index.js'),
  tsconfig: r('../tsconfig.build.json'),
  entryPoints: [r('../src/index.ts')],
});
