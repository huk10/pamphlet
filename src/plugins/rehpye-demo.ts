import {VFile} from 'vfile';
import {Context} from '../type.js';
import {NodeData} from './type.js';
import {visit} from 'unist-util-visit';
import {toHtml} from 'hast-util-to-html';
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

function hasDemo(lang: string, meta: string, content: string): boolean {
  if (meta.includes('pure')) return false;
  if (!['ts', 'js', 'javascript', 'typescript', 'jsx', 'tsx'].includes(lang)) return false;
  if (['js', 'javascript'].includes(lang) && !meta.includes('jsx')) return false;
  if (['ts', 'typescript'].includes(lang) && !(meta.includes('jsx') || meta.includes('tsx'))) {
    return false;
  }
  return content.includes('export default ');
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
      const content = (<Text>node.children[0]).value!;
      const paraNode = ancestors[ancestors.length - 1] as Element;
      // 忽略单行代码块
      if (paraNode.tagName !== 'pre') return;
      if (lang) {
        (vFile.data as unknown as Context).codes ??= [];
        (vFile.data as unknown as Context).codes.push({lang, meta});
      }
      const isDemo = hasDemo(lang, meta, content);
      (<NodeData>(<unknown>paraNode.data)) ??= {} as NodeData;
      // 如果是 demo 就使用 Demo 组件渲染，如果不是就使用 CodeBlock 渲染
      (<NodeData>(<unknown>paraNode.data))[isDemo ? 'embedDemo' : 'codeBlock'] = {
        lang: lang,
        content: content,
        relative: vFile.dirname!,
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
