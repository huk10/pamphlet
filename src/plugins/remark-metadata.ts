import dayjs from 'dayjs';
import {min} from 'lodash';
import {Heading, Root} from 'mdast';
import {VFile} from 'vfile';
import {statSync} from 'node:fs';
import {visit} from 'unist-util-visit';
import {FrontMatter} from '../type.js';
import {parse as parseYaml} from 'yaml';
import {basename, extname} from 'node:path';
import {toString} from 'mdast-util-to-string';

function fsTimes(uri: string): Partial<Pick<FrontMatter, 'created' | 'updated'>> {
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
    const frontMatters = [];
    const metadata = fsTimes(vFile.path);
    for (const node of ast.children) {
      if (node.type === 'yaml') {
        const yaml = parseYaml(node.value);
        if (yaml !== null && typeof yaml === 'object' && !Array.isArray(yaml)) {
          frontMatters.push(yaml);
        }
      }
    }
    // 正常情况只有一个 frontMatter
    if (frontMatters.length > 1) {
      console.warn('Multiple frontMatter detected, only the first one will be used.');
    }
    const result = Object.assign({}, metadata, frontMatters[0] || {});

    // 读取默认标题
    if (!result.title) {
      let heading = '';
      let minDepth = Number.MAX_SAFE_INTEGER;
      visit<Root, 'heading'>(ast, 'heading', (node: Heading) => {
        if (node.depth < minDepth) {
          minDepth = node.depth;
          heading = toString(node.children);
        }
        if (node.depth === 1) {
          result.title = toString(node.children);
        }
      });
      if (!result.title) {
        if (minDepth >= 2) {
          result.title = heading;
        } else {
          result.title = basename(vFile.path).slice(0, -extname(vFile.path).length);
        }
      }
    }
    // 赋值给 vFile
    vFile.data.frontMatter = result;
  };
}
