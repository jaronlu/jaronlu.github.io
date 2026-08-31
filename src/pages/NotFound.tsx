import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="mx-auto flex max-w-[820px] flex-col items-start px-6 pt-20 pb-16">
      <span className="kicker accent">404 / NOT FOUND</span>
      <h1 className="mt-5 font-display text-[2.4rem] leading-[1.1] font-semibold tracking-[-0.02em] text-ink">
        这一页不在检索范围里。
      </h1>
      <p className="mt-4 max-w-[48ch] text-[0.88rem] leading-relaxed text-muted">
        你访问的地址不存在，或已被移动。回到首页，从工程作品集继续浏览。
      </p>
      <Link
        to="/"
        className="group mt-8 inline-flex items-center gap-2 rounded-full border border-line-strong bg-transparent px-6 py-3 font-mono text-[0.74rem] font-semibold text-ink no-underline transition-colors hover:bg-ink hover:text-paper"
      >
        返回首页
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </Link>
    </div>
  );
}
