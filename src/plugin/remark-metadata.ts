import dayjs from 'dayjs';
import {Root} from 'mdast';
import {VFile} from 'vfile';
import {statSync} from 'node:fs';
import {visit} from 'unist-util-visit';
import {parse as parseYaml} from 'yaml';
import {toString} from 'mdast-util-to-string';

export interface FrontMatter {
  title: string;
  created: string;
  updated: string;
  description?: string;

  group?: {
    name?: string;
    order?: number;
  };

  menu?: {
    name?: string;
    order?: number;
  };

  navigation?: {
    name?: string;
    order?: string;
  };
}

function getFileMetadata(uri: string): Partial<FrontMatter> {
  try {
    const fTime = (time: string | number | Date): string => {
      return dayjs(time).format('YYYY-MM-DD HH:mm');
    };
    const stats = statSync(uri);
    return {created: fTime(stats.birthtime), updated: fTime(stats.mtime)};
  } catch (e) {
    return {};
  }
}

/**
 * 读取文件的元信息(最新修改时间)和 frontMatter
 * frontMatter 仅支持 yaml 格式
 * 它会将读到的所有数据放在 vFile.data.frontMatter 内
 */
export default function remarkMetadata() {
  return (ast: Root, vFile: VFile) => {
    const metadata = getFileMetadata(vFile.path);
    const objects = [];
    for (const node of ast.children) {
      if (node.type === 'yaml') {
        const yaml = parseYaml(node.value);
        if (yaml !== null && typeof yaml === 'object' && !Array.isArray(yaml)) {
          objects.push(yaml);
        }
      }
    }
    // 正常情况只有一个 frontMatter
    if (objects.length > 1) {
      console.warn('Multiple frontMatter detected, only the first one will be used.');
    }
    const result = Object.assign({}, metadata, objects[0] || {});
    // 读取默认标题
    if (!result.title) {
      visit<Root, 'heading'>(ast, 'heading', node => {
        if (node.depth === 1) {
          result.title = toString(node.children);
        }
      });
    }
    // 赋值给 vFile
    vFile.data.frontMatter = result;
  };
}
