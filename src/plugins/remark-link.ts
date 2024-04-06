import {VFile} from 'vfile';
import {Link, Root} from 'mdast';
import {extname, resolve, relative} from 'node:path';
import {Context} from '../type.js';
import {visit} from 'unist-util-visit';
import {INLINE_ROUTE_REGEXP} from '../constants.js';

// 处理内部导航路径。
// 需要配合 rehpye-jsxify 使用。
export default function remarkLink(options?: {entry: string; baseUrl: string}) {
  return (ast: Root, vFile: VFile) => {
    const {entry, baseUrl} = (options || {}) as any;
    const inlineLinks: Context['inlineLinks'] = [];

    // 转换为路由路径
    visit<Root, 'link'>(ast, 'link', (node: Link) => {
      if (INLINE_ROUTE_REGEXP.test(node.url)) {
        const fullLink = resolve(vFile.dirname!, node.url);
        let link = relative(vFile.dirname!, resolve(baseUrl, 'index.html'));
        if (fullLink !== entry) {
          // 目录路径链接跟随文件目录。所以只需要替换后缀就行了。
          link = node.url.replace(extname(node.url), '.html');
        }
        inlineLinks.push({origin: node.url, path: link});
        node.url = link;
      }
    });

    (<Context>(<unknown>vFile.data)).inlineLinks ??= [];
    (<Context>(<unknown>vFile.data)).inlineLinks.push(...inlineLinks);
  };
}
