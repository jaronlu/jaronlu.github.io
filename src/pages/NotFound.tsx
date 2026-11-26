import { Link } from "react-router-dom";
import { useDocumentMeta } from "../hooks/useDocumentMeta";

export function NotFound() {
  useDocumentMeta("页面不存在 · Jaron Lu");

  return (
    <div className="mx-auto max-w-shell px-6 pt-20 pb-16">
      <h1 className="font-display text-[2.25rem] leading-[1.1] font-semibold tracking-[-0.02em] text-ink sm:text-[2.75rem]">
        这一页不在检索范围里。
      </h1>
      <p className="mt-5 max-w-[42em] text-[1.0625rem] leading-[1.75] text-ink-soft">
        地址不存在，或已被移动。
      </p>
      <Link
        to="/"
        className="mt-6 inline-block text-[0.9375rem] text-accent underline underline-offset-4 transition-colors hover:text-ink"
      >
        回到首页
      </Link>
    </div>
  );
}
