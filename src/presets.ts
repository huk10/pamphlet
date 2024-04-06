// 支持 Markdown 中的数学语法
import remarkMath from 'remark-math';
// 支持 katex 渲染
// import rehypeKatex from 'rehype-katex';
// 支持 MathJax 渲染
import rehypeMathjax from 'rehype-mathjax';
// 支持 GFM (GitHub 对 Markdown 的扩展：自动连接文字、脚注、表格、任务列表)
// GitHub 支持 repos 和 Gists 中文件的 YAML frontmatter，但他们不将其视为 GFM 的一部分。
import remarkGfm from 'remark-gfm';
// 生成的 html  head(h1 ~ h5) 添加 ID
import rehypeSlug from 'rehype-slug';
// 通过将引用链接到提交、问题和用户，添加了对 Markdown 如何与评论、问题、PR 和发布中的某个 GitHub 存储库相关的支持。
import remarkBreaks from 'remark-breaks';
// // html 格式化
import rehypeFormat from 'rehype-format';
// // 代码块高亮 基于 highlight.js 的 lowlight
// import rehypeHighlight from 'rehype-highlight';
// 添加对通用指令的支持。
import remarkDirective from 'remark-directive';
// 解析 frontmatter
import remarkFrontmatter from 'remark-frontmatter';
// 删除 html 注释
import rehypeRemoveComments from 'rehype-remove-comments';
// 对 H1~H5 添加自动链接 需要和 rehypeSlug 一起使用
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

// eslint-disable-next-line @typescript-eslint/ban-types
export type Plugin<T = unknown> = Function | [(options?: T) => Function, T];

export interface Preset {
  remark: Plugin[];
  rehpye: Plugin[];
}

// 仅包含必须的基础插件
export const basis_preset: Preset = {
  remark: [remarkFrontmatter],
  rehpye: [rehypeSlug, rehypeAutolinkHeadings],
};

// 包含包含数学公式、gfm 等插件
export const standard_preset: Preset = {
  remark: [remarkFrontmatter, remarkMath, remarkGfm, remarkBreaks, remarkDirective],
  rehpye: [
    rehypeSlug,
    // rehypeKatex,
    rehypeMathjax,
    // 不要使用 rehypeHighlight 会与内部插件冲突
    // rehypeHighlight,
    rehypeFormat,
    rehypeRemoveComments,
    rehypeAutolinkHeadings,
  ],
};
