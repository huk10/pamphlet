---
title: Title
created: 2017-04-09
updated: 2017-04-10
---

# override metadata

- 支持 `yaml` 格式的元数据
- 支持一个 `title` 属性，如果没有，会检查 `h1` 标题，如果没有，则使用 `filename`
- 会自动从文件系统中获取 创建时间和最后修改时间，如果存在 `created` 或 `lastModified` 属性会覆盖文件系统的值

## 默认值

```yaml
title: Title
created: 2017-04-09
lastModified: 2017-04-09
navigation:
  title: Home
  route: /
  order: 1
```
