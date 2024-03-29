import {OutputFile, Plugin} from 'esbuild';
import {copyFile} from 'fs/promises';
import {JSDOM} from 'jsdom';
import {writeFile} from 'node:fs/promises';
import {resolve, isAbsolute, dirname, extname, basename, relative} from 'node:path';
import {createDirectory} from '../utils.js';

export interface HtmlPluginOptions {
  // html 标签上的 lang 属性
  lang?: string;
  title: string;
  // 内联所有输出的 js 文件和 css 文件
  inline?: boolean;
  // 需要是一个绝对路径
  favicon?: string;
  // 输出文件名-可以存在 esbuild.outdir 的子目录。
  outfile: string;
  // 如果输出js或css文件是否需要添加hash至文件名
  hash?: boolean;
  template?: string;
  description?: string;
}

const HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  <div id='root'></div>
</body>
</html>`.trim();

export function htmlPlugin(options: HtmlPluginOptions): Plugin {
  if (options.favicon && !isAbsolute(options.favicon)) {
    throw new Error('favicon need a absolute path');
  }
  return {
    name: 'esbuild-html-plugin',
    setup(build) {
      build.onStart(() => {
        if (build.initialOptions.write) {
          throw new Error('write is not enabled');
        }
        if (!build.initialOptions.outdir) {
          throw new Error('outdir must be set');
        }
      });

      build.onEnd(async result => {
        if (!result.outputFiles?.length) return;
        const {
          lang,
          hash,
          title,
          outfile,
          favicon,
          description,
          inline = false,
          template = HTML_TEMPLATE,
        } = options;

        const outdir = build.initialOptions.outdir!;
        const publicPath = build.initialOptions.publicPath || '';

        const dom = new JSDOM(template) as JSDOM;
        const document = dom.window.document;

        document.title = title;

        if (lang) {
          document.documentElement.lang = lang;
        }
        if (favicon) {
          await copyFile(favicon, resolve(outdir, publicPath, './favicon.ico'));
          const tag = document.createElement('link');
          tag.setAttribute('rel', 'icon');
          tag.setAttribute('href', resolve(publicPath, './favicon.ico'));
          document.head.appendChild(tag);
        }
        if (description) {
          const tag = document.createElement('meta');
          tag.setAttribute('name', 'description');
          tag.setAttribute('content', description);
          document.head.appendChild(tag);
        }

        const html = resolve(outdir, outfile + (extname(outfile) ? '' : '.html'));
        for (const output of result.outputFiles || []) {
          const ext = extname(output.path);
          const path = ((output: OutputFile) => {
            const ext = extname(output.path);
            const base = basename(output.path);
            const dir = dirname(resolve(outdir, publicPath, ext.slice(1), base));
            const filename = `${base.slice(0, -extname(base).length)}${hash ? '.' + output.hash : ''}${ext}`;
            return resolve(dir, `./${filename}`);
          })(output);

          if (ext === '.js') {
            if (inline) {
              const tag = document.createElement('script');
              tag.textContent = output.text;
              document.body.appendChild(tag);
            } else {
              await createDirectory(dirname(path));
              await writeFile(path, output.contents);
              const tag = document.createElement('script');
              tag.setAttribute('src', relative(dirname(html), path));
              document.body.appendChild(tag);
            }
          } else if (ext === '.css') {
            if (inline) {
              const tag = document.createElement('style');
              tag.textContent = output.text;
              document.head.appendChild(tag);
            } else {
              await createDirectory(dirname(path));
              await writeFile(path, output.contents);
              const tag = document.createElement('link');
              tag.setAttribute('rel', 'stylesheet');
              tag.setAttribute('href', relative(dirname(html), path));
              document.head.appendChild(tag);
            }
          } else {
            const outfile = resolve(outdir, publicPath, './' + output.path.replace(outdir, ''));
            await createDirectory(dirname(outfile));
            await writeFile(outfile, output.contents);
          }
        }

        await createDirectory(dirname(resolve(outdir, outfile)));

        await writeFile(html, dom.serialize());
      });
    },
  };
}
