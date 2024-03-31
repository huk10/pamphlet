import {VFile} from 'vfile';
import {Link, Root} from 'mdast';
import {extname} from 'node:path';
import {Metadata} from '../type.js';
import {visit} from 'unist-util-visit';
import {INLINE_ROUTE_REGEXP} from '../constants.js';

// 处理内部导航路径。
// 需要配合 rehpye-jsxify 使用。
export default function remarkLink() {
  return (ast: Root, vFile: VFile) => {
    const inlineLinks: Metadata['inlineLinks'] = [];

    // 转换为路由路径
    visit<Root, 'link'>(ast, 'link', (node: Link) => {
      if (INLINE_ROUTE_REGEXP.test(node.url)) {
        // 目录路径链接跟随文件目录。所以只需要替换后缀就行了。
        const link = node.url.replace(extname(node.url), '.html');
        inlineLinks.push({origin: node.url, path: link});
        node.url = link;
      }
    });

    (<Metadata>(<unknown>vFile.data)).inlineLinks ??= [];
    (<Metadata>(<unknown>vFile.data)).inlineLinks.push(...inlineLinks);
  };
}
