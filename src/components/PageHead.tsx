import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { site } from "../data/site";
import { useDocumentMeta } from "../hooks/useDocumentMeta";

interface PageHeadProps {
  title: string;
  /** meta description；页面导语由 children 承担 */
  metaDescription?: string;
  children?: ReactNode;
}

/** 内页统一页头：display 大标题 + 可选导语。浏览器标签标题为「title · 站名」。 */
export function PageHead({ title, metaDescription, children }: PageHeadProps) {
  useDocumentMeta(`${title} · ${site.name}`, metaDescription);

  return (
    <header className="mx-auto max-w-shell px-6 pt-14 pb-10">
      <h1 className="font-display text-[2.25rem] leading-[1.1] font-semibold tracking-[-0.02em] text-ink sm:text-[2.75rem]">
        {title}
      </h1>
      {children ? (
        <div className="mt-5 max-w-[42em] text-[1.0625rem] leading-[1.75] text-ink-soft">
          {children}
        </div>
      ) : null}
    </header>
  );
}

/** 私有仓库标记：没有公开 repo 的项目在列表行与详情页标题旁都要带，避免被读成可点开的公开仓库。 */
export function PrivateTag({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block border border-line-strong px-1.5 py-px align-middle font-sans text-[0.75rem] font-normal leading-[1.5] tracking-normal whitespace-nowrap text-ink-soft ${className}`.trim()}
    >
      私有仓库
    </span>
  );
}

interface SectionTitleProps {
  title: string;
  /** 标题右侧的数量等补充信息 */
  meta?: string;
  /** 传入则 meta 渲染为「查看全部」链接 */
  to?: string;
  id?: string;
}

/** 区块标题：display 字体的 h2，右侧跟数量；数量可点时即该区块的「查看全部」入口。 */
export function SectionTitle({ title, meta, to, id }: SectionTitleProps) {
  return (
    <h2
      id={id}
      tabIndex={id ? -1 : undefined}
      className="flex scroll-mt-20 flex-wrap items-baseline gap-x-3 font-display text-[1.5rem] leading-tight font-semibold tracking-[-0.01em] text-ink"
    >
      {title}
      {meta ? (
        to ? (
          <Link
            to={to}
            className="font-sans text-[0.875rem] font-normal text-muted no-underline transition-colors hover:text-accent"
          >
            {meta}
          </Link>
        ) : (
          <span className="font-sans text-[0.875rem] font-normal text-muted">{meta}</span>
        )
      ) : null}
    </h2>
  );
}
