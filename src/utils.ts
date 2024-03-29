import {mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';

export function createDirectory(dirPath: string) {
  return mkdir(dirPath, {recursive: true});
}

export function sha1(input: string): string {
  const hash = createHash('sha1');
  hash.update(input);
  return hash.digest('hex');
}
