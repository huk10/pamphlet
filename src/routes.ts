import {extname, relative} from 'node:path';
import {Group, Menu, Navigation} from './type.js';
import {FrontMatter} from './plugin/remark-metadata.js';

function sort(list: Array<{name: string; order: number}>) {
  list.sort((a, b) => {
    if (a.order < b.order) return -1;
    if (a.order > b.order) return 1;
    return a.name.localeCompare(b.name);
  });
}

// 获取相对于 baseDir 的 route link
export function toRoute(baseDir: string, path: string): string {
  // 因为限制了所以文档都必须位于 baseDIr 目录内，所以这里的路径一定不会是以 . 开头
  return ('' + relative(baseDir, path)).slice(0, -extname(path).length) + '.html';
}

export function parseNavigationData(baseDir: string, frontMatters: [string, FrontMatter][]) {
  const navs: Array<Navigation> = [];
  const menus: Array<Group | Menu> = [];

  for (const [path, frontMatter] of frontMatters) {
    const url = toRoute(baseDir, path);
    const menuName = frontMatter.menu?.name || '';
    const groupName = frontMatter.group?.name || '';
    const navigation = frontMatter.navigation?.name || '';
    if (navigation && !navs.some(val => val.name === navigation)) {
      navs.push({
        path: url,
        name: navigation,
        order: +(frontMatter.navigation?.order || 0),
      });
    }
    if (menuName) {
      if (groupName) {
        let g = menus.find(val => val.name === groupName) as Group;
        if (!g) {
          g = {name: groupName, order: +(frontMatter.group?.order || 0), children: []};
          menus.push(g);
          sort(menus);
        }
        g.children.push({name: menuName, order: +(frontMatter.menu?.order || 0), path: url});
        sort(g.children);
      } else {
        menus.push({
          path: url,
          name: menuName,
          order: +(frontMatter.menu?.order || 0),
        });
        sort(menus);
      }
    }
  }
}
