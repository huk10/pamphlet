import {VFile} from 'vfile';
import {ASSETS_FILE_DIRS, ASSETS_PATH} from '../constants.js';
import {NodeData} from './type.js';
import {Root, Element} from 'hast';
import {Context} from '../type.js';
import {uuid} from '../utils/uuid.js';
import {visit} from 'unist-util-visit';
import {basename, extname, resolve} from 'node:path';

// 处理内嵌图片资源。
// 需要配合 rehpye-jsxify 使用。
export default function rehpyeImg() {
  return (ast: Root, vFile: VFile) => {
    const images: Context['images'] = [];

    // 使用 React 渲染的话需要将它的路径使用 import 导入。
    visit<Root, 'element'>(ast, 'element', (node: Element) => {
      if (node.tagName === 'img' && /^(\.|\/)/.test(node.properties?.src as string)) {
        const id = uuid();

        const path = node.properties!.src as string;
        const filename = basename(path).replace(extname(path), `-${id}${extname(path)}`);
        const entity = {
          uuid: id,
          alt: node.properties!.alt as string,
          source: resolve(vFile.dirname!, node.properties!.src as string),
          // 修改文件引入路径，会将其 copy 到一个目录中。
          url: `./${ASSETS_FILE_DIRS}/${filename}`,
          // url: path.replace(extname(path), `-${id}${extname(path)}`),
        };

        images.push(entity);
        (<NodeData>(<unknown>node.data)) ??= {};
        (<NodeData>(<unknown>node.data)).image = {
          alt: entity.alt,
          uuid: entity.uuid,
          url: `${ASSETS_PATH}/${filename}`,
        };
      }
    });

    (<Context>(<unknown>vFile.data)).images ??= [];
    (<Context>(<unknown>vFile.data)).images.push(...images);
  };
}
