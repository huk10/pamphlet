import {Root, Element, Text} from 'hast';
import {visit} from 'unist-util-visit';
import {visitParents} from 'unist-util-visit-parents';
import {VFile} from 'vfile';

export interface NodeData {
  lang?: string;
  source?: string;
  image?: boolean;
  imageId?: number;
  imageUrl?: string;
  imageAlt?: string;
  isDemo?: boolean;
  content?: string;
  relative?: string;
  type?: 'code-block' | 'external';
}

function getLang(node: Element): string {
  // ref: https://github.com/syntax-tree/mdast-util-to-hast/blob/b7623785f270b5225898d15327770327409878f8/lib/handlers/code.js#L23
  if (Array.isArray(node.properties?.className) && node.properties!.className?.[0]) {
    return (<string>node.properties!.className?.[0]).split('-')[1] || '';
  }
  return '';
}

/**
 * 2. 使用 Markdown 语法嵌入 react 组件渲染
 *    - 需要使用默认导出。
 *    - lang 属性指定语言，支持 js, ts, jsx, tsx
 *    - 如果不需要渲染，则可以指定 meta 如：jsx | pure
 *  支持的类型：
 *  - js | jsx
 *  - ts | tsx
 *  - javascript | jsx
 *  - typescript | tsx
 *  - jsx
 *  - tsx
 *  会转成小写再匹配
 */
function matchEmbeddedCode(ast: Root, vFile: VFile): Element[] {
  const nodes: Element[] = [];
  visitParents<Root, 'element'>(ast, 'element', (node, ancestors) => {
    if (node.tagName !== 'code') return;
    const lang = getLang(node);
    const meta = (<{meta?: string}>(<NodeData>node.data))?.meta ?? '';
    if (meta.includes('pure')) return;
    if (!['ts', 'js', 'javascript', 'typescript', 'jsx', 'tsx'].includes(lang)) return;
    if (['js', 'javascript'].includes(lang) && !meta.includes('jsx')) return;
    if (['ts', 'typescript'].includes(lang) && !(meta.includes('jsx') || meta.includes('tsx'))) {
      return;
    }
    if (!(<Text>node.children[0]).value.includes('export default ')) return;
    const paraNode = ancestors[ancestors.length - 1] as Element;
    (<NodeData>(<unknown>paraNode.data)) ??= {};
    (<NodeData>(<unknown>paraNode.data)).lang = lang;
    (<NodeData>(<unknown>paraNode.data)).isDemo = true;
    (<NodeData>(<unknown>paraNode.data)).type = 'code-block';
    (<NodeData>(<unknown>paraNode.data)).relative = vFile.dirname;
    (<NodeData>(<unknown>paraNode.data)).content = (<Text>node.children[0]).value;
    nodes.push(paraNode);
  });
  return nodes;
}

/**
 * 扩展 Markdown 增加 code 标签，支持嵌入 react 组件渲染或引入一个外部 react 组件渲染。
 */
export default function rehpyeDemo() {
  return (ast: Root, vFile: VFile) => {
    const nodes = matchEmbeddedCode(ast, vFile);
    visit<Root, 'element'>(ast, 'element', node => {
      if (node.tagName !== 'p') return;
      const child = node.children[0];
      if (child && child.type === 'raw' && child.value.startsWith('<code ') && child.data?.path) {
        nodes.push(node);
        node.children = [];
        (<NodeData>(<unknown>node.data)) ??= {};
        (<NodeData>(<unknown>node.data)).isDemo = true;
        (<NodeData>(<unknown>node.data)).type = 'external';
        (<NodeData>(<unknown>node.data)).source = child.data.path as string;
        (<NodeData>(<unknown>node.data)).relative = child.data.relative as string;
      }
    });
    return ast;
  };
}
