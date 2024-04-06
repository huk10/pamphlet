import {FrontMatter} from '../type.js';
import {dirname, extname, relative} from 'node:path';

// 默认 0 好 还是 max_safe_number
const DEFAULT_ORDER_NUMBER = 0;

interface Link {
  path: string;
  title: string;
  order: number;
}

interface Group {
  title: string;
  order: number;
  children: Link[];
}

interface Navigation {
  title: string;
  order: number;
  children: Group[];
}

function maxOrder(num1: number, num2: number): number {
  if (num1 === DEFAULT_ORDER_NUMBER) return num2;
  if (num2 === DEFAULT_ORDER_NUMBER) return num1;
  return Math.max(num2, num1);
}

type Sortable = {order: number; title: string};
export function normalSortable(value: string | Sortable): Sortable {
  if (!value) return {title: '', order: 0};
  if (typeof value === 'string') return {title: value, order: DEFAULT_ORDER_NUMBER};
  return value;
}

type FrontMatters = (FrontMatter & {path: string})[];
export function parseNavigation(baseDir: string, frontMatter: FrontMatters): Navigation[] {
  const result: Navigation[] = [];
  const value = groupBy(frontMatter, item => normalSortable(item.navs).title);
  for (const [key, values] of value.entries()) {
    const navs: Navigation = {title: key, order: DEFAULT_ORDER_NUMBER, children: []};
    const nudes: Group = {title: '', order: DEFAULT_ORDER_NUMBER, children: []};
    const groups = new Map<string, Group>();
    for (const item of values) {
      if (normalSortable(item.navs).order !== 0) {
        navs.order = maxOrder(normalSortable(item.navs).order, navs.order);
      }
      const group = normalSortable(item.group);

      const link = {
        title: item.title,
        order: item.order,
        path: relative(dirname(baseDir), item.path).replace(extname(item.path), '.html'),
      };

      if (!group.title && item.nude) {
        nudes.children.push(link);
        sort(nudes.children);
      }
      if (group && group.title) {
        const matches = groups.has(group.title)
          ? groups.get(group.title)!
          : {...group, children: []};
        if (group.order !== 0) {
          matches.order = maxOrder(group.order, matches.order);
        }
        matches.children.push(link);
        sort(matches.children);
        groups.set(group.title, matches);
      }
    }
    if (nudes.children.length) {
      navs.children.push(nudes);
    }
    if (groups.size) {
      navs.children.push(...groups.values());
    }
    if (navs.children.length) {
      result.push(navs);
      sort(result);
    }
  }
  return result;
}

function groupBy<T>(list: T[], key: (value: T) => string): Map<string, T[]> {
  const result = new Map<string, T[]>();
  for (const item of list) {
    const value = key(item);
    const children = result.has(value) ? result.get(value)! : [];
    children.push(item);
    result.set(value, children);
  }
  return result;
}

export function sort<T extends {title: string; order: number}>(list: T[]) {
  list.sort((a, b) => {
    if ((a.order || 0) < (b.order || 0)) return -1;
    if ((a.order || 0) > (b.order || 0)) return 1;
    return a.title.localeCompare(b.title);
  });
}
