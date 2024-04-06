import {rimraf} from 'rimraf';
import chokidar from 'chokidar';
import {resolve} from 'node:path';
import {BuildOptions} from './type.js';
import {build, withDefaultOption} from './build.js';

export async function buildWithWatch(options: BuildOptions) {
  const withDefaultOptions = withDefaultOption(options);
  const cwd = withDefaultOptions.cwd || process.cwd();
  const watcher = chokidar.watch(resolve(cwd, withDefaultOptions.baseDir, '**/*.{md,markdown}'), {
    ignored: /(^|[/\\])node_modules($|[/\\])/,
    persistent: true,
  });
  async function clean() {
    await rimraf(resolve(cwd, withDefaultOptions.cacheDir!));
    await rimraf(resolve(cwd, withDefaultOptions.outDir));
  }

  let isRunning = false;
  async function running() {
    if (isRunning) return;
    isRunning = true;
    console.log();
    console.log();
    console.log('build start');
    await clean();
    await build(withDefaultOptions).catch(err => {
      console.error(err);
      watcher.close();
    });
    isRunning = false;
    console.log('build success');
  }

  watcher.on('change', running);

  await running();
}
