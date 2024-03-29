import {VFile} from 'vfile';
import {unified} from 'unified';
import {readSync} from 'to-vfile';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import {Root, Paragraph} from 'mdast';
import {join} from 'node:path';
import remarkDirective from 'remark-directive';
import remarkFrontmatter from 'remark-frontmatter';
import {visitParents} from 'unist-util-visit-parents';
import remarkRawAST from './remark-raw-ast.js';

export type Embeds = string[];

/**
 * 递归解析引入的其他 Markdown 文件
 * @param {VFile} content
 */
function parseEmbedFile(content: VFile): {mdast: Root; embeds: Embeds} {
  const result = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRawAST)
    .use(remarkDirective)
    .use(remarkFrontmatter)
    .use(remarkEmbed)
    .processSync(content);

  return {mdast: result.result as Root, embeds: result.data.embeds as Embeds};
}

/**
 * 扩展 Markdown 支持嵌入其他的 Markdown 文件
 * example:
 * ```
 * <embed src="./demo.tsx"></embed>
 * ```
 * **目前仅支持上述写法：** ！！！因为没有做格式检查，所以其他写法可能有出人意料的事情出现。
 * 1. 完整的标签
 * 2. 路径相当于当前文件
 */
export default function remarkEmbed() {
  return (ast: Root, vFile: VFile) => {
    (vFile.data as {embeds?: Embeds}).embeds = [];
    // 查找 html 标签
    visitParents<Root, 'html'>(ast, 'html', (node, ancestors) => {
      if (!node.value.startsWith('<embed ')) return;
      const src = node.value.match(/src=("|')([^"']+)\1/)?.[2];
      if (!src) return;
      const parent = ancestors[ancestors.length - 1] as Paragraph;
      const grandParent = ancestors[ancestors.length - 2] as Root;
      // 获取文件路径
      const sourceFilePath = new URL('file://' + join(vFile.dirname || '', src));
      const content = readSync(sourceFilePath);
      // parse embeds file ast
      const {mdast, embeds} = parseEmbedFile(content);
      const embedsFilePath = sourceFilePath.toString().replace('file://', '');
      (vFile.data as {embeds: Embeds}).embeds.push(...[embedsFilePath].concat(embeds));
      grandParent.children.splice(grandParent.children.indexOf(parent)!, 1, ...mdast.children);
    });
  };
}
