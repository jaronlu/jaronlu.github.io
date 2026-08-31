import { site } from "../data/site";

const socials = [
  {
    label: "GitHub",
    href: site.github,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.14c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.35.95.1-.74.4-1.25.72-1.53-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12v3.15c0 .3.2.66.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
      </svg>
    ),
  },
  {
    label: "Email",
    href: `mailto:${site.email}`,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="2.5" y="5" width="19" height="14" rx="2" />
        <path d="m3.5 7 8.5 6 8.5-6" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: site.linkedin,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5ZM.2 8h4.6v14.5H.2V8Zm7.7 0h4.4v2h.06c.62-1.16 2.13-2.38 4.38-2.38 4.68 0 5.55 3.08 5.55 7.08v7.8h-4.6v-6.9c0-1.65-.03-3.77-2.3-3.77-2.3 0-2.65 1.79-2.65 3.65v7.02H7.9V8Z" />
      </svg>
    ),
  },
];

export function Footer() {
  return (
    <footer className="mt-20 bg-footer-bg text-footer-fg">
      <div className="mx-auto max-w-[1180px] px-6 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-display text-xl font-semibold">{site.name}</p>
            <p className="mt-1.5 max-w-[40ch] text-sm text-footer-fg/70">
              正在寻找 AI Agent / LLM 应用工程机会。
            </p>
            <a
              href={`mailto:${site.email}`}
              className="mt-3 inline-block border-b border-footer-fg/40 pb-0.5 font-mono text-[0.8rem] font-semibold text-footer-fg transition-colors hover:border-accent hover:text-accent"
            >
              {site.email}
            </a>
          </div>

          <div className="flex items-center gap-5">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target={s.href.startsWith("http") ? "_blank" : undefined}
                rel={s.href.startsWith("http") ? "noreferrer" : undefined}
                aria-label={s.label}
                className="text-footer-fg/60 transition-colors hover:text-accent"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-footer-fg/15 pt-5 font-mono text-[0.65rem] tracking-wide text-footer-fg/40 sm:flex-row sm:items-center sm:justify-between">
          <span>{site.copyright}</span>
          <span>PORTFOLIO — AI AGENT ENGINEERING · BUILT WITH REACT</span>
        </div>
      </div>
    </footer>
  );
}
