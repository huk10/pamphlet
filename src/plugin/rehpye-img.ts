import {Root} from 'hast';
import {VFile} from 'vfile';
import {resolve} from 'node:path';
import {Metadata} from '../type.js';
import {visit} from 'unist-util-visit';
import {NodeData} from './rehpye-demo.js';

let uuid = 0;

// 处理图片和 a 标签导航路径。
// 需要配合 rehpye-jsxify 使用。
export default function rehpyeImg() {
  return (ast: Root, vFile: VFile) => {
    const images: Metadata['images'] = [];

    // 使用 React 渲染的话需要将它的路径使用 import 导入。
    visit<Root, 'element'>(ast, 'element', node => {
      if (node.tagName === 'img' && /^(\.|\/)/.test(node.properties?.src as string)) {
        // 路径不需要转换，只需要选择一个变量名称。
        const id = ++uuid;
        images.push({
          uuid: id,
          url: node.properties?.src as string,
          alt: node.properties?.alt as string,
          source: resolve(vFile.dirname!, node.properties?.src as string),
        });
        (<NodeData>(<unknown>node.data)) ??= {};
        (<NodeData>(<unknown>node.data)).image = true;
        (<NodeData>(<unknown>node.data)).imageId = id;
        (<NodeData>(<unknown>node.data)).imageUrl = node.properties?.src as string;
        (<NodeData>(<unknown>node.data)).imageAlt = node.properties?.alt as string;
        // 这个路径需要 copy
      }
    });

    (<Metadata>(<unknown>vFile.data)).images ??= [];
    (<Metadata>(<unknown>vFile.data)).images.push(...images);
  };
}
