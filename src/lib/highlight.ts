import hljs from "highlight.js/lib/core";
import python from "highlight.js/lib/languages/python";
import csharp from "highlight.js/lib/languages/csharp";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import yaml from "highlight.js/lib/languages/yaml";

// 只注册站点实际用到的语言（课文围栏 + CodeBlock），控制包体；裸 ``` 围栏（ASCII 流程图/伪代码）不做高亮。
hljs.registerLanguage("python", python);
hljs.registerLanguage("csharp", csharp);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("yaml", yaml);

/** 单个代码块高亮：lang 未注册或已高亮过则跳过，保持纯文本。 */
export function highlightElement(el: HTMLElement, lang?: string): void {
  if (!lang || el.hasAttribute("data-highlighted") || !hljs.getLanguage(lang)) return;
  hljs.highlightElement(el);
}

/**
 * 高亮容器内所有带语言标注的代码块（marked 产出 `<code class="language-*">`，
 * CodeBlock 传 lang 后也是这个结构）。裸围栏无语言类，跳过。
 * highlight.js 重复执行是安全的（内部有 data-highlighted 守卫）。
 */
export function highlightCodeBlocks(root: ParentNode | null | undefined): void {
  if (!root) return;
  for (const el of Array.from(root.querySelectorAll("pre code"))) {
    const lang = Array.from(el.classList)
      .find((c) => c.startsWith("language-"))
      ?.slice("language-".length);
    if (lang) highlightElement(el as HTMLElement, lang);
  }
}
