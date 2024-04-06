let seed = 0;

export function uuid(): number {
  return ++seed;
}
