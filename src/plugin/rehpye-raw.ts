import {Root} from 'hast';
import {VFile} from 'vfile';
import {NodeData} from './type.js';
import {visit} from 'unist-util-visit';

/**
 * 扩展 Markdown 增加 code 标签，支持引入一个 react 组件，这个组件会作为 demo 渲染。
 */
export default function rehpyeRaw() {
  return (ast: Root, vFile: VFile) => {
    visit<Root>(ast, node => {
      if (node.type !== 'raw') return;
      if (node.value.startsWith('</')) return;
      if (/<code[^>]*src=[^>]*\/>/.test(node.value)) {
        console.warn(
          `<code /> is not supported, please use <code></code> instead. \n File: ${vFile.dirname}`
        );
      }

      const src = node.value.match(/src=("|')([^"']+)\1/)?.[2];
      if (src) {
        (node.data as unknown as NodeData) ??= {} as NodeData;
        (node.data as unknown as NodeData).raw = {
          path: src,
          relative: vFile.dirname!,
        };
      }
    });
    return ast;
  };
}
