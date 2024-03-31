import {Root} from 'hast';
import {sha1} from '../utils.js';
import {NodeData} from './type.js';
import {Metadata} from '../type.js';
import {readFileSync} from 'node:fs';
import {FrozenProcessor} from 'unified';
import {visit} from 'estree-util-visit';
import {resolve, relative} from 'node:path';
import {toJs, jsx, Options} from 'estree-util-to-js';
import {toEstree} from 'hast-util-to-estree';
import type {Node, JSXElement, VariableDeclaration, JSXAttribute} from 'estree-jsx';
import type {FunctionDeclaration, Expression, ExpressionStatement, ImportDeclaration} from 'estree';
import {
  COMPONENTS_PACKAGE_PATH,
  GENERATE_CODEBLOCKS_DIR_PATH,
  GENERATE_SITE_DATA_PATH,
} from '../constants.js';

const CORE_COMPONENTS = ['Demo', 'Layout'];

// 处理一个 demo 需要有三个步骤：
// 1. 根据规则生成一个组件名称，这个组件名称不能有重复，可以在组件名称后添加 hash 字符串。
// 2. 获取其源码。
// 3. 生成 ast。
// 生成出来的 demo 组件大概是这样的：
// import DemoContent2ef7bde from "@pamphlet/codeblocks/codeblocks.2ef7bde"
// function DemoContainer2ef7bde() {
//   const content = `source code`;
//   return (
//     <Demo content={content} >
//       <DemoContent2ef7bde />
//     </Demo>
//   )
// }
export default function rehpyeJsxify(this: FrozenProcessor, options: {outDir: string}) {
  this.Compiler = (ast: Root, vFile) => {
    const {outDir} = options;
    const esTree = toEstree(ast as never);

    const externals: Metadata['externals'] = [];
    const codeblocks: Metadata['codeblocks'] = [];

    const imports: ImportDeclaration[] = [];
    const declarations: FunctionDeclaration[] = [];
    const components: Array<{name: string; path: string}> = [];

    visit(esTree, (node: Node, key, index, ancestors) => {
      const data = ((node as unknown as any).data || {}) as NodeData;
      // 内嵌组件使用 Markdown 语法嵌入的。
      if (node.type === 'JSXElement' && data.codeBlock) {
        const hash = sha1(data.codeBlock.content).slice(0, 6);
        const fileName = `codeblocks.${hash}`;
        const componentName = `DemoContent${hash}`;
        const importPath = `${GENERATE_CODEBLOCKS_DIR_PATH}/${fileName}`;

        components.push({name: componentName, path: importPath});

        codeblocks.push({
          content: data.codeBlock.content,
          relative: data.codeBlock.relative,
          fileName: fileName + '.jsx',
        });

        const parents = ancestors[ancestors.length - 1];
        // 正常来说都是走这个分支，如果没走，就有问题需要再检查下。
        if (typeof index === 'number') {
          const container = `DemoContainer${hash}`;
          declarations.push(createDemoContainerComponent(hash, data.codeBlock.content));
          (parents as JSXElement).children[index] = createJSXElement(container);
        }
      }
      // 外部组件使用 <code src=""></code> 的方式引入。
      if (node.type === 'JSXElement' && data.external) {
        const sourceURL = resolve(data.external.relative, data.external.source);
        const sourceBuffer = readFileSync(sourceURL, 'utf-8');
        const hash = sha1(sourceBuffer).slice(0, 6);

        const componentName = `DemoContent${hash}`;
        externals.push({source: data.external.source, relative: data.external.relative});
        components.push({name: componentName, path: relative(outDir, sourceURL)});

        const parents = ancestors[ancestors.length - 1];
        // 正常来说都是走这个分支，如果没走，就有问题需要再检查下。
        if (typeof index === 'number') {
          const container = `DemoContainer${hash}`;
          declarations.push(createDemoContainerComponent(hash, sourceBuffer));
          (parents as JSXElement).children[index] = createJSXElement(container);
        }
      }

      // 处理 image 导入
      if (node.type === 'JSXElement' && data.image) {
        const parents = ancestors[ancestors.length - 1];
        // 正常来说都是走这个分支，如果没走，就有问题需要再检查下。
        if (typeof index === 'number') {
          const componentName = `Image${data.image.uuid}`;
          imports.push(createDefaultImportDeclaration(data.image.url, `Image${data.image.uuid}`));
          (parents as JSXElement).children[index] = createImageJSXElement(
            componentName,
            data.image.alt!
          );
        }
      }
    });

    // 这是编译插件，只会是最后调用的。

    // 外部组件只需要获取其相对于当前文件的路径，然后使用 import 导入它
    vFile.data.externals = externals;
    vFile.data.codeblocks = codeblocks;

    // 导入 react
    imports.push(createImportDeclaration('react-dom/client', 'createRoot'));

    // 导入核心组件。
    imports.push(createImportDeclaration(COMPONENTS_PACKAGE_PATH, ...CORE_COMPONENTS));

    // 导入 demo 组件。
    components.forEach(item => imports.push(createDefaultImportDeclaration(item.path, item.name)));

    // 导入编译生成的 data.js
    imports.push(createImportDeclaration(GENERATE_SITE_DATA_PATH, 'navs', 'menus'));

    // 创建 toc 组件
    if (vFile.data.toc) {
      declarations.push(createComponentAst('TableOfContent', vFile.data.toc as any));
    }

    // 将 Markdown 的内容转换成 JSX 组件。
    const jsxast = <JSXElement>(esTree.body[0] as ExpressionStatement).expression;

    // 使用 Layout 组件包裹
    const layout = createLayoutComponentAst('Layout', ['navs', 'menus'], jsxast);
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

// 创建一个简单自闭合无 props 的 JSX 元素。
function createJSXElement(name: string): JSXElement {
  return {
    type: 'JSXElement',
    openingElement: {
      type: 'JSXOpeningElement',
      selfClosing: true,
      attributes: [],
      name: {
        type: 'JSXIdentifier',
        name: name,
      },
    },
    closingElement: null,
    children: [],
  };
}

// 创建一个图片组件。
function createImageJSXElement(src: string, alt: string): JSXElement {
  return {
    type: 'JSXElement',
    openingElement: {
      type: 'JSXOpeningElement',
      selfClosing: true,
      attributes: [
        {
          type: 'JSXAttribute',
          name: {
            type: 'JSXIdentifier',
            name: 'src',
          },
          value: {
            type: 'JSXExpressionContainer',
            expression: {
              type: 'Identifier',
              name: src,
            },
          },
        },
        {
          type: 'JSXAttribute',
          name: {
            type: 'JSXIdentifier',
            name: 'alt',
          },
          value: {
            type: 'JSXExpressionContainer',
            expression: {
              type: 'Literal',
              value: alt,
              raw: JSON.stringify(alt),
            },
          },
        },
      ],
      name: {
        type: 'JSXIdentifier',
        name: 'img',
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

// function createStringVariableDeclaration(name: string, value: string): VariableDeclaration {
//   return {
//     type: 'VariableDeclaration',
//     kind: 'const',
//     declarations: [
//       {
//         type: 'VariableDeclarator',
//         id: {
//           type: 'Identifier',
//           name: name,
//         },
//         init: {
//           type: 'TemplateLiteral',
//           expressions: [],
//           quasis: [
//             {
//               type: 'TemplateElement',
//               value: {
//                 cooked: value,
//                 raw: value,
//               },
//               tail: true,
//             },
//           ],
//         },
//       },
//     ],
//   };
// }

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
  returnValue: JSXElement
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
          argument: returnValue,
        },
      ],
    },
  };
}

function createLayoutComponentAst(name: string, attrs: string[], jsxast: JSXElement): JSXElement {
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
            name: 'toc',
          },
          value: {
            type: 'JSXExpressionContainer',
            expression: {
              type: 'JSXElement',
              openingElement: {
                type: 'JSXOpeningElement',
                name: {
                  type: 'JSXIdentifier',
                  name: 'TableOfContent',
                },
                selfClosing: true,
                attributes: [],
              },
              closingElement: null,
              children: [],
            },
          },
        },
        ...attrs.map(
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

        // {
        //   type: 'JSXSpreadAttribute',
        //   argument: {
        //     name: 'data',
        //     type: 'Identifier',
        //   },
        // },
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
    children: [jsxast],
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

function createDemoContainerComponent(hash: string, content: string) {
  const container = `DemoContainer${hash}`;
  const body = createJSXElement(`DemoContent${hash}`);
  const children = createDemoAst('Demo', [body]);
  return createComponentDeclaration(container, content, children);
}
