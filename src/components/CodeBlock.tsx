interface CodeBlockProps {
  title?: string;
  code: string;
}

/** 简洁代码块：可选标题栏 + mono 等宽正文（不做语法高亮，保持克制）。 */
export function CodeBlock({ title, code }: CodeBlockProps) {
  return (
    <div className="my-5 overflow-hidden rounded-md border border-line bg-paper-2">
      {title ? (
        <div className="border-b border-line px-4 py-2 font-mono text-[0.64rem] font-semibold tracking-[0.08em] text-faint uppercase">
          {title}
        </div>
      ) : null}
      <pre className="overflow-x-auto p-4">
        <code className="font-mono text-[0.76rem] leading-relaxed text-ink whitespace-pre">
          {code}
        </code>
      </pre>
    </div>
  );
}
