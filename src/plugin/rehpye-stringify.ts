import {Root} from 'hast';
import {VFile} from 'vfile';
import {Node} from 'estree-jsx';
import {FrozenProcessor} from 'unified';
import {NodeData} from './rehpye-demo.js';
import {toEstree} from 'hast-util-to-estree';
import {EXIT, visit} from 'estree-util-visit';

function hasDemo(ast: Root): boolean {
  let result = false;
  // todo 避免这次的 ast 转换
  const esTree = toEstree(ast as never);
  visit(esTree, (node: Node) => {
    const data = (<{data: NodeData}>(<unknown>node)).data;
    if (node.type === 'JSXElement' && data?.isDemo) {
      result = true;
      return EXIT;
    }
  });
  return result;
}

function transformToReactApplication(ast: Root, vFile: VFile): string {
  return '';
}

function transformToVanillaApplication(ast: Root, vFile: VFile): string {
  return '';
}

// 如果 Markdown 文件中不存在内嵌 react 组件 demo 或者外部 react 组件，就转成原生 js 实现布局。
// 如果存在 react demo 就转成 react 应用。
export default function rehpyeStringify(this: FrozenProcessor) {
  this.Compiler = (ast: Root, vFile) => {
    if (hasDemo(ast)) {
      return transformToReactApplication(ast, vFile);
    }
    return transformToVanillaApplication(ast, vFile);
  };
}
