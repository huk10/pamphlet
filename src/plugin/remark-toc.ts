import {toEstree} from 'hast-util-to-estree';
import {toHast} from 'mdast-util-to-hast';
import {VFile} from 'vfile';
import {toc} from 'mdast-util-toc';
import {Root, List, Link} from 'mdast';
import {toString} from 'mdast-util-to-string';
import {Metadata, TableOfContent} from '../type.js';

function toStruct(root: List): TableOfContent[] {
  const result: TableOfContent[] = [];
  if (root.type !== 'list') return result;
  for (const child of root.children) {
    if (child.type !== 'listItem') continue;
    const entity: Partial<TableOfContent> = {};
    for (const el of child.children) {
      if (el.type === 'paragraph') {
        const link = el.children.find(val => val.type === 'link') as Link;
        if (link) {
          entity.children = [];
          entity.hash = link.url;
          entity.title = toString((link as unknown as any).children);
        }
      }
      if (el.type === 'list' && el.children.length) {
        entity.children = toStruct(el);
      }
    }
    if (entity.title && entity.hash) {
      result.push(entity as TableOfContent);
    }
  }
  return result;
}

function counts(root: TableOfContent[]): number {
  let count = 0;
  const nodes: TableOfContent[] = root;
  while (nodes.length) {
    const node = nodes.shift()!;
    count++;
    if (Array.isArray(node.children) && node.children.length) {
      nodes.push(...node.children);
    }
  }
  return count;
}

export interface RemarkTocOptions {
  // 至少需要多少条数据才生成 toc
  count?: number;
}

// Get the jsx ast form of table of content
export default function remarkToc(options: RemarkTocOptions = {}) {
  return (ast: Root, vFile: VFile) => {
    const {count = 3} = options;
    const table = toc(ast as any);

    if (table.map) {
      const struct = toStruct(table.map as List);
      if (counts(struct) < count) return ast;

      const hast = toHast(table.map);
      const east = toEstree(hast);
      (vFile.data as unknown as Metadata).toc = east;
      (vFile.data as unknown as Metadata).tableOfContents = struct;
    }

    return ast;
  };
}
