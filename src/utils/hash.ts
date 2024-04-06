import {createHash} from 'node:crypto';

export function sha1(input: string): string {
  const hash = createHash('sha1');
  hash.update(input);
  return hash.digest('hex');
}
