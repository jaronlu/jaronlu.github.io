import { Link, NavLink } from "react-router-dom";
import { nav, site } from "../data/site";
import { ThemeToggle } from "./ThemeToggle";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-shell items-center justify-between gap-3 px-6">
        <Link
          to="/"
          className="shrink-0 font-display text-[1.05rem] font-semibold tracking-tight whitespace-nowrap text-ink no-underline"
        >
          {site.name}
        </Link>

        <nav aria-label="主导航" className="flex items-center gap-1 sm:gap-2">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-md px-2 py-1.5 text-[0.875rem] whitespace-nowrap no-underline transition-colors sm:px-3 ${
                  isActive ? "text-accent" : "text-muted hover:text-ink"
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
