import {unified} from 'unified';
import {readSync} from 'to-vfile';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkFrontMatter from 'remark-frontmatter';
import remarkMetadata from '../../src/plugins/remark-metadata.js';

import {describe, it, expect} from 'vitest';
import {Context} from '../../src/type.js';

describe('remark-metadata', async () => {
  it('test default value', async () => {
    const processor = await unified().use(remarkParse).use(remarkFrontMatter).use(remarkMetadata);

    const result = await processor
      .use(remarkStringify as never)
      .process(readSync(new URL('./fixtures/metadata/default.md', import.meta.url)));

    expect((result.data as Context).frontMatter).toStrictEqual({
      title: 'default metadata',
      created: '2024-03-21 23:37',
      updated: '2024-03-22 00:06',
    });
  });

  it('override default value', async () => {
    const processor = await unified().use(remarkParse).use(remarkFrontMatter).use(remarkMetadata);

    const result = await processor
      .use(remarkStringify as never)
      .process(readSync(new URL('./fixtures/metadata/override-default.md', import.meta.url)));

    expect((result.data as Context).frontMatter).toStrictEqual({
      title: 'Title',
      created: '2017-04-09',
      updated: '2017-04-10',
    });
  });
});
