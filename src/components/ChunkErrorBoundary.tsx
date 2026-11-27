import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

/**
 * 懒加载正文的兜底边界。
 *
 * 站点发版后，仍停在旧页面的用户再点路由时，旧 hash 的 chunk 已被删除，动态 import 会 reject。
 * 没有 boundary 时 Suspense 的 fallback 会永远停在「正在载入正文…」。这里改为给出说明和手动重新加载
 * （重新加载会取到新的 index.html 与新的资源清单）。不自动刷新：刷新仍失败时会变成死循环。
 * 切换路由时由调用方换 key，boundary 回到正常态。
 */
export class ChunkErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[content] 正文载入失败", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <p className="text-[0.9375rem] leading-[1.75] text-ink-soft">
        正文载入失败，通常是站点刚更新，当前页面引用的旧版本文件已失效。
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="ml-2 cursor-pointer text-accent underline underline-offset-4 transition-colors hover:text-ink"
        >
          重新加载
        </button>
      </p>
    );
  }
}
