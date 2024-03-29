import {Root} from 'hast';
import {VFile} from 'vfile';
import {visit} from 'unist-util-visit';

/**
 * 扩展 Markdown 增加 code 标签，支持嵌入 react 组件渲染或引入一个外部 react 组件渲染。
 */
export default function rehpyeRaw() {
  return (ast: Root, vFile: VFile) => {
    visit<Root>(ast, node => {
      if (node.type !== 'raw') return;
      if (/<code[^>]*src=[^>]*\/>/.test(node.value)) {
        console.warn(
          `<code /> is not supported, please use <code></code> instead. \n File: ${vFile.dirname}`
        );
      }

      const src = node.value.match(/src=("|')([^"']+)\1/)?.[2];
      if (src) {
        node.data ??= {};
        node.data.path = src;
        node.data.relative = vFile.dirname;
      }
    });
    return ast;
  };
}
