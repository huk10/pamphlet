import {VFile} from 'vfile';
import {resolve} from 'node:path';
import {NodeData} from './type.js';
import {Root, Element} from 'hast';
import {Metadata} from '../type.js';
import {visit} from 'unist-util-visit';

let uuid = 0;

// 处理内嵌图片资源。
// 需要配合 rehpye-jsxify 使用。
export default function rehpyeImg() {
  return (ast: Root, vFile: VFile) => {
    const images: Metadata['images'] = [];

    // 使用 React 渲染的话需要将它的路径使用 import 导入。
    visit<Root, 'element'>(ast, 'element', (node: Element) => {
      if (node.tagName === 'img' && /^(\.|\/)/.test(node.properties?.src as string)) {
        // 路径不需要转换，只需要生成一个 uuid
        // 这个 uuid 会用在 import 时作为变量名的一部分，以保证不会出现重复。
        // todo 但是这样可能导致图片资源重复，这个还没确定。
        const id = ++uuid;
        images.push({
          uuid: id,
          url: node.properties!.src as string,
          alt: node.properties!.alt as string,
          source: resolve(vFile.dirname!, node.properties!.src as string),
        });

        (<NodeData>(<unknown>node.data)) ??= {};
        (<NodeData>(<unknown>node.data)).image = {
          uuid: id,
          url: node.properties!.src as string,
          alt: node.properties!.alt as string,
        };
      }
    });

    (<Metadata>(<unknown>vFile.data)).images ??= [];
    (<Metadata>(<unknown>vFile.data)).images.push(...images);
  };
}
