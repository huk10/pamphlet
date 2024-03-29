import {Root} from 'mdast';
import {VFile} from 'vfile';
import {toc} from 'mdast-util-toc';
import {toHast} from 'mdast-util-to-hast';
import {toEstree} from 'hast-util-to-estree';

export default function remarkToc() {
  return (ast: Root, vFile: VFile) => {
    const table = toc(ast as any);

    if (table.map) {
      const hast = toHast(table.map);
      vFile.data.toc = toEstree(hast);
    }

    return ast;
  };
}
