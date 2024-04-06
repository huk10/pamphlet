import {Root} from 'hast';
import {sha1} from '../utils/hash.js';
import {uuid} from '../utils/uuid.js';
import {NodeData} from './type.js';
import {Context} from '../type.js';
import {readFileSync} from 'node:fs';
import {FrozenProcessor} from 'unified';
import {visit} from 'estree-util-visit';
import {resolve, relative} from 'node:path';
import {toJs, jsx, Options} from 'estree-util-to-js';
import {toEstree} from 'hast-util-to-estree';
import type {
  Node,
  JSXElement,
  VariableDeclaration,
  JSXAttribute,
  JSXExpressionContainer,
  Literal,
} from 'estree-jsx';
import type {FunctionDeclaration, Expression, ExpressionStatement, ImportDeclaration} from 'estree';
import {
  COMPONENTS_CODEBLOCKS_PATH,
  COMPONENTS_DEMO_PATH,
  COMPONENTS_LAYOUT_PATH,
  GENERATE_CODEBLOCKS_DIR_PATH,
  GENERATE_METADATA_DIR_PATH,
} from '../constants.js';

// 处理一个 demo 需要有三个步骤：
// 1. 根据规则生成一个组件名称，这个组件名称不能有重复，可以在组件名称后添加 hash 字符串。
// 2. 获取其源码。
// 3. 生成 ast。
// 生成出来的 demo 组件大概是这样的：
// import DemoContent1 from "@pamphlet/codeblocks/codeblocks.2ef7bde"
// function DemoContainer1() {
//   const content = `source code`;
//   return (
//     <Demo content={content} >
//       <DemoContent1 />
//     </Demo>
//   )
// }

export interface RehpyeJsxifyOptions {
  // 在引入外部组件时，需要通过这个路径来获取相对路径。
  // 这里的 outDir 对应外部配置应该是 cacheDir。
  outDir: string;
  baseDir: string;
}

export default function rehpyeJsxify(this: FrozenProcessor, options: RehpyeJsxifyOptions): void {
  this.Compiler = (ast: Root, vFile) => {
    const {outDir, baseDir} = options;
    const esTree = toEstree(ast as never);

    const externals: Context['externals'] = [];
    const codeblocks: Context['codeblocks'] = [];

    const imports: ImportDeclaration[] = [];
    const declarations: FunctionDeclaration[] = [];
    const components: Array<{name: string; path: string}> = [];

    visit(esTree, (node: Node, key, index, ancestors) => {
      const data = ((node as unknown as any).data || {}) as NodeData;
      // 内嵌组件使用 Markdown 语法嵌入的。
      if (node.type === 'JSXElement' && data.embedDemo) {
        const hash = sha1(data.embedDemo.content);
        const componentId = uuid();
        const fileName = `codeblocks.${hash}`;
        const componentName = `DemoContent${componentId}`;
        const importPath = `${GENERATE_CODEBLOCKS_DIR_PATH}/${fileName}`;

        components.push({name: componentName, path: importPath});

        codeblocks.push({
          content: data.embedDemo.content,
          relative: data.embedDemo.relative,
          fileName: fileName + '.jsx',
        });

        const parents = ancestors[ancestors.length - 1];
        // 正常来说都是走这个分支，如果没走，就有问题需要再检查下。
        if (typeof index === 'number') {
          const container = `DemoContainer${componentId}`;
          declarations.push(createDemoContainerComponent(componentId + '', data.embedDemo.content));
          (parents as JSXElement).children[index] = createSelfClosingJSXElement(container);
        }
      }

      // 外部组件使用 <code src=""></code> 的方式引入。
      if (node.type === 'JSXElement' && data.external) {
        const sourceURL = resolve(data.external.relative, data.external.source);
        const sourceBuffer = readFileSync(sourceURL, 'utf-8');
        const componentId = uuid();

        const componentName = `DemoContent${componentId}`;
        externals.push({source: data.external.source, relative: data.external.relative});
        const jsx_url = data.external.relative.replace(baseDir, outDir);
        components.push({name: componentName, path: relative(jsx_url, sourceURL)});

        const parents = ancestors[ancestors.length - 1];
        // 正常来说都是走这个分支，如果没走，就有问题需要再检查下。
        if (typeof index === 'number') {
          const container = `DemoContainer${componentId}`;
          declarations.push(createDemoContainerComponent(componentId + '', sourceBuffer));
          (parents as JSXElement).children[index] = createSelfClosingJSXElement(container);
        }
      }

      // 代码块需要使用 CodeBlock 组件渲染。
      if (node.type === 'JSXElement' && data.codeBlock) {
        const parents = ancestors[ancestors.length - 1];
        // 正常来说都是走这个分支，如果没走，就有问题需要再检查下。
        if (typeof index === 'number') {
          (parents as JSXElement).children[index] = createSelfClosingJSXElement(
            'CodeBlock',
            {key: 'content', value: data.codeBlock.content, literal: true},
            {key: 'lang', value: data.codeBlock.lang, literal: true}
          );
        }
      }

      // 处理 image 导入
      if (node.type === 'JSXElement' && data.image) {
        const parents = ancestors[ancestors.length - 1];
        // 正常来说都是走这个分支，如果没走，就有问题需要再检查下。
        if (typeof index === 'number') {
          // 这里不需要使用 image.uuid 可以自己生成一个。
          const componentName = `Image${data.image.uuid}`;
          imports.push(createDefaultImportDeclaration(data.image.url, componentName));
          (parents as JSXElement).children[index] = createSelfClosingJSXElement(
            'img',
            {key: 'src', value: componentName, literal: false},
            {key: 'alt', value: data.image.alt || '', literal: true}
          );
        }
      }
    });

    // 这是编译插件，只会是最后调用的。

    // 外部组件只需要获取其相对于当前文件的路径，然后使用 import 导入它
    vFile.data.uuid = uuid();
    vFile.data.externals = externals;
    vFile.data.codeblocks = codeblocks;

    // 导入 react
    imports.push(createImportDeclaration('react-dom/client', 'createRoot'));

    // 导入核心组件。
    // 自定义组件可以使用 esbuild 的别名转换 import path
    // todo 暂时不管有无使用，都全部导入。构建时开启摇树优化就行了
    imports.push(createImportDeclaration(COMPONENTS_DEMO_PATH, 'Demo'));
    imports.push(createImportDeclaration(COMPONENTS_LAYOUT_PATH, 'Layout'));
    imports.push(createImportDeclaration(COMPONENTS_CODEBLOCKS_PATH, 'CodeBlock'));

    // 导入 demo 组件。
    components.forEach(item => imports.push(createDefaultImportDeclaration(item.path, item.name)));

    // 导入编译生成的 data.js
    imports.push(
      createImportDeclaration(GENERATE_METADATA_DIR_PATH + `/data.${vFile.data.uuid}`, 'data')
    );

    // 将 Markdown 的内容转换成 JSX 组件。
    const jsxast = <JSXElement>(esTree.body[0] as ExpressionStatement).expression;

    // 使用 Layout 组件包裹
    const layout = createLayoutComponentAst('Layout', jsxast, 'data');
    const content = createComponentAst('Document', layout);

    esTree.body = [
      // 声明导入语句。
      ...imports,
      // 它会自动加分号诶。
      // {type: 'EmptyStatement'},
      // 声明变量。
      ...declarations,
      // {type: 'EmptyStatement'},
      // Markdown 内容组件
      content,
      // 创建 React 应用。
      ...createReactRenderAst('root', 'Document'),
    ];

    // 转成字符串。
    return toJs(esTree, {handlers: jsx} as Options).value.trim();
  };
}

function creaetdExpressionDeclaration(value: string): JSXExpressionContainer {
  return {
    type: 'JSXExpressionContainer',
    expression: {
      type: 'Identifier',
      name: value,
    },
  };
}

function createdLiteralDeclaration(value: string): Literal {
  return {
    type: 'Literal',
    value: value,
    raw: JSON.stringify(value),
  };
}

type Attr = {key: string; value: string; literal: boolean};
// 创建一个简单自闭合无 props 的 JSX 元素。
function createSelfClosingJSXElement(name: string, ...attrs: Attr[]): JSXElement {
  return {
    type: 'JSXElement',
    openingElement: {
      type: 'JSXOpeningElement',
      selfClosing: true,
      attributes: attrs.map(attr => ({
        type: 'JSXAttribute',
        name: {
          type: 'JSXIdentifier',
          name: attr.key,
        },
        value: attr.literal
          ? createdLiteralDeclaration(attr.value)
          : creaetdExpressionDeclaration(attr.value),
      })),
      name: {
        type: 'JSXIdentifier',
        name: name,
      },
    },
    closingElement: null,
    children: [],
  };
}

function createImportDeclaration(path: string, ...members: string[]): ImportDeclaration {
  return {
    type: 'ImportDeclaration',
    specifiers: members.map(member => ({
      type: 'ImportSpecifier',
      imported: {
        type: 'Identifier',
        name: member,
      },
      local: {
        type: 'Identifier',
        name: member,
      },
    })),
    source: {
      type: 'Literal',
      value: `${path}`,
      raw: `'${path}'`,
    },
  };
}

function createDefaultImportDeclaration(path: string, name: string): ImportDeclaration {
  return {
    type: 'ImportDeclaration',
    specifiers: [
      {
        type: 'ImportDefaultSpecifier',
        local: {
          type: 'Identifier',
          name,
        },
      },
    ],
    source: {
      type: 'Literal',
      value: `${path}`,
      raw: `'${path}'`,
    },
  };
}

// function createExportDefaultAst(content: Expression): ExportDefaultDeclaration {
//   return {
//     type: 'ExportDefaultDeclaration',
//     declaration: content,
//   };
// }

function createComponentAst(name: string, jsxast: Expression): FunctionDeclaration {
  return {
    type: 'FunctionDeclaration',
    async: false,
    generator: false,
    id: {
      type: 'Identifier',
      name: name,
    },
    params: [
      {
        type: 'Identifier',
        name: 'props',
      },
    ],
    body: {
      type: 'BlockStatement',
      body: [
        {
          type: 'ReturnStatement',
          argument: jsxast,
        },
      ],
    },
  };
}

function createDemoAst(name: string, children: JSXElement[]): JSXElement {
  return {
    type: 'JSXElement',
    openingElement: {
      type: 'JSXOpeningElement',
      selfClosing: false,
      attributes: [
        {
          type: 'JSXAttribute',
          name: {
            type: 'JSXIdentifier',
            name: 'content',
          },
          value: {
            type: 'JSXExpressionContainer',
            expression: {
              type: 'Identifier',
              name: 'content',
            },
          },
        },
      ],
      name: {
        type: 'JSXIdentifier',
        name: name,
      },
    },
    closingElement: {
      type: 'JSXClosingElement',
      name: {
        type: 'JSXIdentifier',
        name: name,
      },
    },
    children: children,
  };
}

function createComponentDeclaration(
  name: string,
  content: string,
  element: JSXElement
): FunctionDeclaration {
  return {
    type: 'FunctionDeclaration',
    id: {
      type: 'Identifier',
      name: name,
    },
    params: [],
    async: false,
    generator: false,
    body: {
      type: 'BlockStatement',
      body: [
        {
          type: 'VariableDeclaration',
          kind: 'const',
          declarations: [
            {
              type: 'VariableDeclarator',
              id: {
                type: 'Identifier',
                name: 'content',
              },
              init: {
                type: 'Literal',
                value: content,
                raw: JSON.stringify(content),
              },
            },
          ],
        },
        {
          type: 'ReturnStatement',
          argument: element,
        },
      ],
    },
  };
}

function createLayoutComponentAst(name: string, child: JSXElement, ...attrs: string[]): JSXElement {
  return {
    type: 'JSXElement',
    openingElement: {
      type: 'JSXOpeningElement',
      selfClosing: false,
      attributes: attrs.map(
        attr =>
          ({
            type: 'JSXAttribute',
            name: {
              type: 'JSXIdentifier',
              name: attr,
            },
            value: {
              type: 'JSXExpressionContainer',
              expression: {
                type: 'Identifier',
                name: attr,
              },
            },
          }) as JSXAttribute
      ),
      name: {
        type: 'JSXIdentifier',
        name: name,
      },
    },
    closingElement: {
      type: 'JSXClosingElement',
      name: {
        type: 'JSXIdentifier',
        name: name,
      },
    },
    children: [child],
  };
}

function createReactRenderAst(id: string, com: string): [VariableDeclaration, ExpressionStatement] {
  return [
    {
      type: 'VariableDeclaration',
      kind: 'const',
      declarations: [
        {
          type: 'VariableDeclarator',
          id: {
            type: 'Identifier',
            name: 'root',
          },
          init: {
            type: 'CallExpression',
            callee: {
              type: 'Identifier',
              name: 'createRoot',
            },
            optional: false,
            arguments: [
              {
                type: 'CallExpression',
                callee: {
                  type: 'MemberExpression',
                  object: {
                    type: 'Identifier',
                    name: 'document',
                  },
                  property: {
                    type: 'Identifier',
                    name: 'getElementById',
                  },
                  computed: false,
                  optional: false,
                },
                arguments: [
                  {
                    type: 'Literal',
                    value: id,
                    raw: `'${id}'`,
                  },
                ],
                optional: false,
              },
            ],
          },
        },
      ],
    },
    {
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          computed: false,
          optional: false,
          property: {
            type: 'Identifier',
            name: 'render',
          },
          object: {
            type: 'Identifier',
            name: 'root',
          },
        },
        arguments: [
          {
            type: 'JSXElement',
            openingElement: {
              type: 'JSXOpeningElement',
              attributes: [],
              selfClosing: true,
              name: {
                type: 'JSXIdentifier',
                name: com,
              },
            },
            closingElement: null,
            children: [],
          },
        ],
        optional: false,
      },
    },
  ];
}

function createDemoContainerComponent(componentId: string, content: string) {
  const container = `DemoContainer${componentId}`;
  const body = createSelfClosingJSXElement(`DemoContent${componentId}`);
  const children = createDemoAst('Demo', [body]);
  return createComponentDeclaration(container, content, children);
}
