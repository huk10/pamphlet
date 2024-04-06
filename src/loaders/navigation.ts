import {resolve} from 'node:path';
import {readFile} from 'fs/promises';
import {parse as parseYaml} from 'yaml';
import {readdir} from 'node:fs/promises';

interface LoadOptions {
  // 绝对路径，navigation.yaml 所在的目录，也就是所有文档(entry可以在外)的父目录
  baseUrl: string;
}

/**
 * 路由导航支持两种方式配置。
 * 1. 在 front-matter 中配置。
 * 2. 在 navigation.yaml 中配置。
 * 优先从 navigation.yaml 中解析。
 */
export async function loadNavigation(option: LoadOptions): Promise<object | null> {
  const {baseUrl} = option;
  const dirs = await readdir(baseUrl);
  const navigation = dirs.find(val => /^navigation\.(yaml|yml)$/.test(val));
  if (navigation) {
    return parseYaml(await readFile(resolve(baseUrl, navigation), 'utf-8'));
  }
  return null;
}
