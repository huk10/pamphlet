import {extname} from 'node:path';
import {readdir, stat} from 'node:fs/promises';

interface LoadAllDocOptions {
  // 绝对路径。入口文件，可以不在 baseUrl 之中
  entry: string;
  // 绝对路径。存放所有文档文件的目录。
  baseUrl: string;
}

export async function loadAllDoc(params: LoadAllDocOptions): Promise<string[]> {
  const {baseUrl, entry} = params;
  const dirs = [baseUrl];
  const result: string[] = [];
  while (dirs.length) {
    const url = dirs.shift()!;
    const info = await stat(url);
    if (!info.isFile() && !info.isDirectory()) {
      continue;
    }
    if (info.isDirectory()) {
      for (const sub of await readdir(url)) {
        dirs.push(url + '/' + sub);
      }
    }
    const ext = extname(url);
    if (['.markdown', '.md'].includes(ext) && url !== entry) {
      result.push(url);
    }
  }
  result.push(entry);
  return result;
}
