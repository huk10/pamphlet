---
navs:
  order: 1
  title: 指南
group:
  order: 1
  title: 快速开始
order: 3
---

## JavaScript API

### build

```typescript
type build = (options) => Promise<void>;
```

`build` 方法执行会将 `baseDir` 目录下的所有文档文件（`**/*.{md,markdown}`）构建为静态站点输出到 `outDir` 目录下。

### buildWithWatch

```typescript
type buildWithWatch = (options) => Promise<void>;
```

`buildWithWatch` 方法会监听 `baseDir` 目录下的所有文档文件（`**/*.{md,markdown}`），当文档发生变化时，会重新构建。

会忽略 `baseDir` 目录下的 `node_modules` 文件夹。

**目前是整体构建**
