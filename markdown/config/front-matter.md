---
navs: 配置
nude: true
order: 2
---

# front-matter

Front-Matter 用于配置页面元数据和页面导航相关配置。

## 配置项

以下为 Front-Matter 的基础配置项：

### title

页面标题，它会设置为 html 的 title 标签。

- 类型：`string`
- 默认值：按照优先级取值 `title > heading > filename`

**如果不存在h1标签则取h2标签，以此类推**

### description

页面描述，它会设置为 html 的 description 标签。

- 类型：`string`
- 默认值：无

### created

文档创建时间。

- 类型：`string`
- 默认值：从文件系统中获取的创建时间

### updated

文档最近更新时间。

- 类型：`string`
- 默认值：从文件系统中获取的更新时间

## 导航配置

目前默认的导航系统支持以下配置：

### navs

导航栏配置，用于指定当前页面属于哪个导航栏。

- 类型：`string | {title: string; order: number}`
- 默认值：无

**如果不设置此项，那么就只能通过内部调整链接来进行跳转**

**order 默认为 0 ，如果 order 相等则按照字典序进行排序**

### title

导航栏标题，目前默认与 页面 title 一致。

- 类型：`string`
- 默认值：按照优先级取值 `title > heading > filename`

**如果不存在h1标签则取h2标签，以此类推**

### order

位于侧边菜单栏的排序。

- 类型：`number`
- 默认值：0

### group

侧边菜单栏分组，用于指定当前页面属于哪个分组。

- 类型：`string | {title: string; order: number}`
- 默认值：无
  **order 默认为 0 ，如果 order 相等则按照字典序进行排序**

### nude

如果不存在 group 属性，该页面将不会出现在侧边菜单栏中。
如果此时设置 nude 为 true，则会将该页面放置在侧边菜单栏作为第一分组。

- 类型：`boolean`
- 默认值：false

## 自定义配置

如果您在使用 自定义 `Layout` 组件时，可以通过 front-matter 向其传递配置数据。
