---
navs: 指南
group:
  title: 基础
  order: 2
order: 4
---

# 渲染 Demo 组件

pamphlet 支持将一个 React 组件渲染成 Demo 。

## 编写方式

### 内联嵌入

比较简单的 Demo 可以直接写在 Markdown 文件中。使用 Markdown 的代码块语法。

如：

````markdown
```typescript jsx
export default function () {
return <div>Hello word</div>;
}
```
````

会渲染成：

```typescript jsx
export default function () {
  return <div>Hello word</div>;
}
```

需注意几点：

1. 必须使用 `export default` 导出组件。
2. 代码块语言类型需要是下面几种：
   - `typescript | jsx`
   - `javascript | jsx`
   - `typescript | tsx`
   - `tsx`
   - `jsx`

如果一个代码块不需要渲染成 Demo，则可以使用 `pure` 修饰符。如：

````markdown
```typescript jsx | pure
export default function () {
  return <div>Hello word</div>;
}
```
````

### 外部组件

pamphlet 也可以从外部加载 React 组件渲染成 Demo，如：

```markdown
<code src="../example/external-component.tsx" ></code>
```

渲染结果：

<code src="../example/external-component.tsx"></code>

需注意：

1. 外部组件必须使用 `export default` 导出。
2. src 属性必须是一个有效的路径，并且是相对于当前文件所在目录的相对路径。
3. 不能是自闭合标签。
