import {Root} from 'mdast';
import {VFile} from 'vfile';
import {Metadata} from '../type.js';
import {toRoute} from '../routes.js';
import {visit} from 'unist-util-visit';
import {dirname, extname, resolve} from 'node:path';

// 处理图片和 a 标签导航路径。
// 需要配合 rehpye-jsxify 使用。
export default function remarkLink(options: {baseUrl: string}) {
  if (!options?.baseUrl) {
    throw new Error('BaseUrl options is a must');
  }
  return (ast: Root, vFile: VFile) => {
    const {baseUrl} = options;
    const inlineLinks: Metadata['inlineLinks'] = [];

    // 转换为路由路径
    visit<Root, 'link'>(ast, 'link', node => {
      if (/^(\.|\/)/.test(node.url)) {
        // const link = toRoute(baseUrl, resolve(dirname(vFile.path), node.url));
        const link = node.url.replace(extname(node.url), '.html');
        inlineLinks.push({origin: node.url, path: link});
        node.url = link;
      }
    });

    (<Metadata>(<unknown>vFile.data)).inlineLinks ??= [];
    (<Metadata>(<unknown>vFile.data)).inlineLinks.push(...inlineLinks);
  };
}
