import './layout.less';
import dayjs from 'dayjs';
import 'github-markdown-css';
import * as React from 'react';
import type {CSSProperties} from 'react';
import type {LayoutProps} from '../type.js';

export function Layout({children, data}: LayoutProps) {
  const {
    logo,
    prefix,
    project,
    hideToc,
    homeLink,
    links = [],
    menus = [],
    hideHeader,
    frontMatter,
    navigations = [],
    tableOfContents = [],
  } = data;
  return (
    <div className={`${prefix}-container`}>
      <header className={`${prefix}-header`} hidden={hideHeader}>
        <a href={homeLink} className={`${prefix}-header-title`}>
          {logo && <img src={logo} alt={project} />}
          {project}
        </a>

        <nav className={`${prefix}-header-navbar`}>
          {navigations.map(item => (
            <a href={item.path} className={item.active ? 'active' : ''} key={item.title}>
              {item.title}
            </a>
          ))}
        </nav>

        <div className={`${prefix}-header-actions`}>
          <nav className={`${prefix}-header-links`}>
            {links.map(item => (
              <a href={item.link} key={item.link}>
                {item.icon && <img src={item.icon} className={item.class} />}
                {item.class && <i className={item.class} />}
              </a>
            ))}
          </nav>
          <div className={`${prefix}-header-languages`}></div>
          <div className={`${prefix}-header-versions`}></div>
        </div>
      </header>
      <main className={`${prefix}-main`}>
        <aside className={`${prefix}-sidebar`}>
          <nav className={`${prefix}-sidebar-nav`}>
            {menus.map(item => (
              <React.Fragment key={item.title}>
                {item.title && <div className={`${prefix}-sidebar-nav-group`}>{item.title}</div>}
                {item.children.map(val => (
                  <a href={val.path} key={val.title} className={`${prefix}-sidebar-nav-item`}>
                    {val.title}
                  </a>
                ))}
              </React.Fragment>
            ))}
          </nav>
        </aside>
        <div className={`${prefix}-content`}>
          <div className="markdown-body">{children}</div>
          <footer className={`${prefix}-content-footer`}>
            <div title={`最近更新：${frontMatter.updated}`}>
              <TimeIcon />
              <span>最后更新时间：</span>
              <time dateTime={frontMatter.updated}>
                {dayjs(frontMatter.updated).format('YYYY-MM-DD')}
              </time>
            </div>
            <div></div>
          </footer>
        </div>
        <aside hidden={hideToc} className={`${prefix}-toc`}>
          <nav>
            <Toc prefix={prefix as string} list={tableOfContents} />
          </nav>
        </aside>
      </main>
    </div>
  );
}

function Toc({list, prefix}: {list: LayoutProps['data']['tableOfContents']; prefix: string}) {
  return (
    <>
      {(list || []).map(item => (
        <div key={item.hash} className={`${prefix}-toc-group-children`}>
          <a href={item.hash} className={`${prefix}-toc-item`}>
            {item.title}
          </a>
          <div>
            {item.children.map(val => (
              <div key={val.hash} className={`${prefix}-toc-group`}>
                <a href={val.hash} className={`${prefix}-toc-item`}>
                  {val.title}
                </a>
                <Toc prefix={prefix} list={val.children} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

// eslint-disable-next-line react/prop-types
function TimeIcon(props: {className?: string; style?: CSSProperties}) {
  return (
    <svg viewBox="64 64 896 896" {...props}>
      <path
        fill="currentColor"
        d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path>
      <path
        fill="currentColor"
        d="M686.7 638.6L544.1 535.5V288c0-4.4-3.6-8-8-8H488c-4.4 0-8 3.6-8 8v275.4c0 2.6 1.2 5 3.3 6.5l165.4 120.6c3.6 2.6 8.6 1.8 11.2-1.7l28.6-39c2.6-3.7 1.8-8.7-1.8-11.2z"></path>
    </svg>
  );
}
