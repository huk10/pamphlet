---
navs:
  order: 2
  title: 配置
group:
  title: 文档渲染配置
  order: 1
order: 2
---

# 默认布局配置

`pamphlet` 提供了一个默认的布局组件，你可以通过 `layoutProps` 配置项来向它传递配置。

```typescript
build({
  // 无论是否使用默认的 Layout 组件，layoutProps 都会被传递给 Layout 组件。
  layoutProps: {
    project: 'Pamphlet',
  },
});
```

## 配置项

```typescript
interface LayoutProps {
  // 项目 logo
  logo?: string;
  // 项目名称
  project: string;
  // css class 前缀
  prefix?: string;
  // 隐藏 toc
  hideToc?: boolean;
  // 隐藏 header
  hideHeader?: boolean;
  // link 必须是一个外部链接。
  // 如果存在 icon 那么它必须是一个 url。它会作为 img 标签的 src 属性。
  // 如果存在 class 属性那么它会设置在 img 或 i 标签上
  links?: Array<{icon: string; link: string; class: string}>;
}
```
