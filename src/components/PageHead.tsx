import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

interface PageHeadProps {
  kicker: string;
  title: string;
  children?: ReactNode;
}

/** 内页统一页头：kicker + display 大标题 + 可选导语。 */
export function PageHead({ kicker, title, children }: PageHeadProps) {
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-[1180px] px-6 pt-10 pb-9">
        <Reveal>
          <span className="kicker accent">{kicker}</span>
          <h1 className="mt-4 font-display text-[2.1rem] leading-[1.08] font-semibold tracking-[-0.02em] text-ink sm:text-[2.6rem]">
            {title}
          </h1>
          {children ? (
            <p className="mt-4 max-w-[58ch] text-[0.86rem] leading-relaxed text-muted">
              {children}
            </p>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
