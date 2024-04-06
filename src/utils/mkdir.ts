import {mkdir} from 'node:fs/promises';

export function createDirectory(dirPath: string) {
  return mkdir(dirPath, {recursive: true});
}
