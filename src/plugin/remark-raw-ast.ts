import {Root} from 'mdast';
import {FrozenProcessor} from 'unified';
import {visit} from 'unist-util-visit';

/**
 * 删除 front matter 节点，并返回原始的 ast
 * 只支持 yaml 格式
 */
export default function remarkRawAST(this: FrozenProcessor) {
  this.Compiler = function Compiler(ast: Root) {
    visit<Root, 'yaml'>(ast, 'yaml', (_, index, parent) => {
      if (parent && typeof index === 'number') {
        parent.children.splice(index, 1);
      }
    });
    return ast;
  };
}
