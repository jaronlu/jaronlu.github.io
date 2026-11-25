import { Link, NavLink } from "react-router-dom";
import { nav, site } from "../data/site";
import { ThemeToggle } from "./ThemeToggle";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/88 backdrop-blur-md backdrop-saturate-150">
      {/* 移动端收窄内边距与间距：第 5 个导航项（知识体系）加入后 390px 宽度下不容许原尺寸 */}
      <div className="mx-auto flex h-14 max-w-[1180px] items-center justify-between gap-3 px-4 sm:gap-6 sm:px-6">
        <Link
          to="/"
          className="shrink-0 font-display text-[0.95rem] font-semibold tracking-tight whitespace-nowrap text-ink transition-colors hover:text-accent"
        >
          {site.name}
        </Link>

        <nav
          aria-label="主导航"
          className="flex items-center gap-2 sm:gap-7"
        >
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `whitespace-nowrap font-mono text-[0.64rem] font-medium tracking-[0.04em] uppercase transition-colors sm:tracking-[0.08em] sm:text-[0.68rem] ${
                  isActive ? "text-accent" : "text-muted hover:text-accent"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
