import {VFile} from 'vfile';
import {Metadata} from '../type.js';
import {NodeData} from './type.js';
import {visit} from 'unist-util-visit';
import {Element, Root, Text} from 'hast';
import {visitParents} from 'unist-util-visit-parents';

// 获取代码块中的编程语言
function getLang(node: Element): string {
  // ref: https://github.com/syntax-tree/mdast-util-to-hast/blob/b7623785f270b5225898d15327770327409878f8/lib/handlers/code.js#L23
  if (Array.isArray(node.properties?.className) && node.properties!.className?.[0]) {
    return (<string>node.properties!.className?.[0]).split('-')[1] || '';
  }
  return '';
}

/**
 * 扩展 Markdown 增加 code 标签，支持嵌入 react 组件渲染或引入一个外部 react 组件渲染。
 */
export default function rehpyeDemo() {
  return (ast: Root, vFile: VFile) => {
    /**
     * 使用 Markdown 语法嵌入 react 组件渲染
     *    - 需要使用默认导出。
     *    - lang 属性指定语言，支持 js, ts, jsx, tsx
     *    - 如果不需要渲染，则可以指定 meta 如：jsx | pure
     *  支持的类型：
     *  - js | jsx
     *  - ts | tsx
     *  - jsx
     *  - tsx
     *  - javascript | jsx
     *  - typescript | tsx
     *  会转成小写再匹配
     */
    visitParents<Root, 'element'>(ast, 'element', (node: Element, ancestors) => {
      if (node.tagName !== 'code') return;
      const lang = getLang(node);
      const meta = (<{meta?: string}>(<NodeData>node.data))?.meta ?? '';
      (vFile.data as unknown as Metadata).codes ??= [];
      (vFile.data as unknown as Metadata).codes.push({lang, meta});
      if (meta.includes('pure')) return;
      if (!['ts', 'js', 'javascript', 'typescript', 'jsx', 'tsx'].includes(lang)) return;
      if (['js', 'javascript'].includes(lang) && !meta.includes('jsx')) return;
      if (['ts', 'typescript'].includes(lang) && !(meta.includes('jsx') || meta.includes('tsx'))) {
        return;
      }
      if (!(<Text>node.children[0]).value.includes('export default ')) return;
      const paraNode = ancestors[ancestors.length - 1] as Element;
      (<NodeData>(<unknown>paraNode.data)) ??= {} as NodeData;
      (<NodeData>(<unknown>paraNode.data)).codeBlock = {
        lang: lang,
        relative: vFile.dirname!,
        content: (<Text>node.children[0]).value,
      };
    });

    visit<Root, 'element'>(ast, 'element', (node: Element) => {
      if (node.tagName !== 'p') return;
      const child = node.children[0];
      if (child && child.type === 'raw') {
        const data = (child as {data: NodeData}).data;
        if (child.value.startsWith('<code ') && data?.raw) {
          node.children = [];
          (<NodeData>(<unknown>node.data)) ??= {} as NodeData;
          (<NodeData>(<unknown>node.data)).external = {
            source: data.raw.path,
            relative: data.raw.relative,
          };
        }
      }
    });
    return ast;
  };
}
