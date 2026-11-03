import { useEffect } from "react";

/**
 * 同步页面标题与描述到 <head>。
 *
 * 静态路由的初始 meta 由构建期预渲染写入；这里负责 SPA 内部跳转时不再沿用上一页的
 * 标题与社交卡片字段（否则后退/前进后分享出去的是错页信息）。
 */
export function useDocumentMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title;

    const setContent = (selector: string, value: string) => {
      document.head.querySelector(selector)?.setAttribute("content", value);
    };

    setContent('meta[property="og:title"]', title);
    setContent('meta[name="twitter:title"]', title);

    if (!description) return;
    setContent('meta[name="description"]', description);
    setContent('meta[property="og:description"]', description);
    setContent('meta[name="twitter:description"]', description);
  }, [title, description]);
}
