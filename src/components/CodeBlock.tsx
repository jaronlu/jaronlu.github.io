import { useEffect, useRef } from "react";
import { highlightElement } from "../lib/highlight";

interface CodeBlockProps {
  title?: string;
  lang?: string;
  code: string;
}

/** 简洁代码块：可选标题栏 + mono 等宽正文；传 `lang`（如 "python"）时做语法高亮，架构图/流程图不传。 */
export function CodeBlock({ title, lang, code }: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (codeRef.current) highlightElement(codeRef.current, lang);
  }, [lang, code]);
  return (
    <div className="my-5 overflow-hidden rounded-md border border-line bg-paper-2">
      {title ? (
        <div className="border-b border-line px-4 py-2 font-mono text-[0.64rem] font-semibold tracking-[0.08em] text-faint uppercase">
          {title}
        </div>
      ) : null}
      {/* tabIndex 让横向溢出的代码块可用键盘滚动（WCAG 2.1.1） */}
      <pre
        className="overflow-x-auto p-4"
        tabIndex={0}
        role="region"
        aria-label={title ? `${title} 代码块` : "代码块"}
      >
        <code
          ref={codeRef}
          className={`font-mono text-[0.76rem] leading-relaxed text-ink whitespace-pre${lang ? ` language-${lang}` : ""}`}
        >
          {code}
        </code>
      </pre>
    </div>
  );
}
