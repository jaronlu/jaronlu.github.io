import { site } from "../data/site";

const links = [
  { label: site.email, href: `mailto:${site.email}` },
  { label: "GitHub", href: site.github },
  { label: "LinkedIn", href: site.linkedin },
];

/** 全站页脚只放联系方式与版权；求职状态和介绍在首页，不在这里重复。 */
export function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-shell flex-col gap-3 px-6 py-8 text-[0.875rem] sm:flex-row sm:items-center sm:justify-between">
        <span className="text-muted">{site.copyright}</span>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {links.map((l) => {
            const external = l.href.startsWith("http");
            return (
              <li key={l.label}>
                <a
                  href={l.href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noreferrer" : undefined}
                  className="text-ink-soft underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
                >
                  {l.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </footer>
  );
}
