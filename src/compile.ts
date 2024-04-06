import {loadAllDoc} from './loaders/docs.js';
import {createDirectory} from './utils/mkdir.js';
import {copyFile, writeFile} from 'node:fs/promises';
import {dirname, extname, relative, resolve} from 'node:path';
import {BuildOptions, FrontMatter, Metadata} from './type.js';
import {normalSortable, parseNavigation, sort} from './parse/navigation.js';
import {createProcessor, parseDoc, ParseResult} from './parse/docs.js';
import {ASSETS_FILE_DIRS, CODEBLOCKS_FILE_DIRS, METADATA_FILE_DIRS} from './constants.js';

interface ParseOptions {
  // 首页
  entry: string;
  outDir: string;
  // 文档的公共前缀
  baseDir: string;
  parse: BuildOptions['parseOptions'];
}

async function loadAndParse(options: ParseOptions): Promise<ParseResult[]> {
  const {entry, outDir, baseDir, parse} = options;

  // 找到所有的 Markdown 文档文件
  const docs = await loadAllDoc({entry: entry, baseUrl: baseDir});

  const remark_plugins = (parse?.presets?.remark || []).concat(parse?.remarkPlugins || []);
  const rehype_plugins = (parse?.presets?.rehpye || []).concat(parse?.rehypePlugins || []);

  const processor = () =>
    createProcessor({
      entry: entry,
      baseUrl: baseDir,
      remark: remark_plugins,
      rehpye: rehype_plugins,
    });

  return await parseDoc({
    docs,
    outDir,
    processor,
    entry: entry,
    baseDir: baseDir,
  });
}

interface CompileOptions {
  // 首页文件路径，绝对路径
  entry: string;
  // 文档说所在的公共目录，代码生成和路由会依据此生成。绝对路径
  baseUrl: string;
  // 输出目录，输出的结果会根据 baseUrl 和具体文件系统结构生成。绝对路径
  outDir: string;
  layoutProps: BuildOptions['layoutProps'];
  parseOptions: BuildOptions['parseOptions'];
}

/**
 *
 * cache_dirs
 *    _codeblocks 存放所以得 codeblocks 文件，平铺，添加 hash 后缀。
 *    _metadata   存在文档元数据，暴露给 layout 组件的。平铺，添加 hash 后缀。
 *    index.jsx   首页
 *
 */

// 预编译为jsx文件
export async function compile(option: CompileOptions): Promise<ParseResult[]> {
  const {entry, baseUrl, outDir, parseOptions, layoutProps} = option;

  const contents = await loadAndParse({
    entry: entry,
    outDir: outDir,
    baseDir: baseUrl,
    parse: parseOptions,
  });

  const layouts: (FrontMatter & {path: string})[] = [];
  for (const item of contents) {
    const {content, outfile: path, frontMatter, images, codeblocks} = item;
    const outfile = resolve(outDir, path).replace(extname(path), '.jsx');

    await createDirectory(dirname(outfile));
    await writeFile(outfile, content);

    if (codeblocks.length) {
      await createDirectory(resolve(outDir, CODEBLOCKS_FILE_DIRS));
    }
    for (const codes of codeblocks || []) {
      await writeFile(resolve(outDir, CODEBLOCKS_FILE_DIRS, codes.fileName), codes.content);
    }

    if (images.length) {
      await createDirectory(resolve(outDir, ASSETS_FILE_DIRS));
    }

    for (const img of images) {
      await copyFile(img.source, resolve(outDir, img.url));
    }

    layouts.push({path: resolve(outDir, path), ...frontMatter});
  }

  await createDirectory(resolve(outDir, METADATA_FILE_DIRS));

  for (const item of contents) {
    const {frontMatter, tableOfContents, uuid, outfile} = item;
    const navigation = parseNavigation(resolve(outDir, outfile), layouts);
    const menus = [];
    const panel = navigation.find(val => val.title === normalSortable(frontMatter.navs).title);
    for (const group of panel ? panel.children : []) {
      menus.push({
        title: group.title,
        order: group.order,
        children: group.children.map(val => ({
          path: val.path,
          order: val.order,
          title: val.title,
          active: val.title === frontMatter.title,
        })),
      });
    }
    sort(menus);
    const data: Metadata = {
      ...layoutProps,
      menus: menus as unknown as any,
      frontMatter: frontMatter,
      tableOfContents: tableOfContents || [],
      // 在上个循环已经进行了路径转换
      homeLink: relative(resolve(outDir, dirname(outfile)), resolve(outDir, './index.html')),
      navigations: navigation
        .map(item => ({
          title: item.title,
          path: item.children[0]!.children[0]!.path,
          active: normalSortable(frontMatter.navs).title === item.title,
        }))
        .filter(val => !!val.title),
    };
    await writeFile(
      resolve(outDir, METADATA_FILE_DIRS, `./data.${uuid}.js`),
      `export const data = ${JSON.stringify(data)};`
    );
  }

  return contents;
}
