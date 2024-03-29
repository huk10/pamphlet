import './demo.css';
import Prism from 'prismjs';
import 'prismjs/themes/prism.min.css';
import {useEffect, useState} from 'react';

interface CodeBlockProps {
  lang: string;
  content: string;
}
export function CodeBlock({lang, content}: CodeBlockProps) {
  useEffect(() => {
    Prism.highlightAll();
  }, []);
  return (
    <pre lang={lang}>
      <code className={`language-${lang}`}>{content}</code>
    </pre>
  );
}

function useToggle(initValue: boolean = false): [boolean, () => void] {
  const [value, setValue] = useState(initValue);
  return [value, () => setValue(old => !old)];
}

interface DemoProps {
  lang: string;
  content: string;
  children: JSX.Element;
}
export function Demo({content, lang, children}: DemoProps) {
  const [isExpanded, toggleExpanded] = useToggle(false);
  useEffect(() => {
    Prism.highlightAll();
  }, []);
  return (
    <div className="pamphlet-demo">
      <div className="pamphlet-demo-content">{children}</div>
      <div className="pamphlet-demo-meta">
        <button className="pamphlet-demo-meta-action-btn" type="button" onClick={toggleExpanded}>
          {isExpanded ? <PackUp /> : <Expansion />}
        </button>
      </div>
      {isExpanded && (
        <div className="pamphlet-demo-source-code">
          <CodeBlock lang={lang} content={content} />
          <button type="button" className="pamphlet-demo-source-code-copy">
            <Copy />
          </button>
        </div>
      )}
    </div>
  );
}

function Copy() {
  return (
    <svg viewBox="64 64 896 896">
      <path d="M832 64H296c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h496v688c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V96c0-17.7-14.3-32-32-32zM704 192H192c-17.7 0-32 14.3-32 32v530.7c0 8.5 3.4 16.6 9.4 22.6l173.3 173.3c2.2 2.2 4.7 4 7.4 5.5v1.9h4.2c3.5 1.3 7.2 2 11 2H704c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32zM350 856.2 263.9 770H350v86.2zM664 888H414V746c0-22.1-17.9-40-40-40H232V264h432v624z"></path>
    </svg>
  );
}

function PackUp() {
  return (
    <svg viewBox="0 0 200 117">
      <path d="M59.688 2.578c-3.438-3.437-8.438-3.437-11.563 0L3.75 48.516c-5 5.937-5 14.062 0 19.062l44.063 45.938c1.562 1.562 4.062 2.5 5.937 2.5s4.063-.938 5.938-2.5c3.437-3.438 3.437-8.438 0-11.563l-42.5-43.437 42.5-44.063c3.437-3.437 3.437-8.437 0-11.875Zm135.937 45.938L151.25 2.578c-3.438-3.437-8.438-3.437-11.563 0-3.125 3.438-3.437 8.438 0 11.563l42.5 44.375-42.5 44.062c-3.437 3.438-3.437 8.438 0 11.563 1.563 1.562 3.438 2.5 5.938 2.5 2.5 0 4.063-.938 5.938-2.5l44.062-45.938c5.625-5.625 5.625-13.75 0-19.687Z"></path>
    </svg>
  );
}

function Expansion() {
  return (
    <svg viewBox="0 0 200 117">
      <path d="M59.688 2.578c-3.438-3.437-8.438-3.437-11.563 0L3.75 48.516c-5 5.937-5 14.062 0 19.062l44.063 45.938c1.562 1.562 4.062 2.5 5.937 2.5s4.063-.938 5.938-2.5c3.437-3.438 3.437-8.438 0-11.563l-42.5-43.437 42.5-44.063c3.437-3.437 3.437-8.437 0-11.875Zm135.937 45.938L151.25 2.578c-3.438-3.437-8.438-3.437-11.563 0-3.125 3.438-3.437 8.438 0 11.563l42.5 44.375-42.5 44.062c-3.437 3.438-3.437 8.438 0 11.563 1.563 1.562 3.438 2.5 5.938 2.5 2.5 0 4.063-.938 5.938-2.5l44.062-45.938c5.625-5.625 5.625-13.75 0-19.687Zm-75.938-45c-4.062-1.563-9.062.937-10.937 5l-34.063 95c-1.562 4.062.938 9.062 5 10.937.938 0 1.563.938 2.5.938 3.438 0 6.563-2.5 7.5-5.938l35-95.937c1.563-4.063-.937-9.063-5-10Z"></path>
    </svg>
  );
}
