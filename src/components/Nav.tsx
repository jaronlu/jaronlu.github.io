import { Link, NavLink } from "react-router-dom";
import { nav, site } from "../data/site";
import { ThemeToggle } from "./ThemeToggle";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/88 backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-14 max-w-[1180px] items-center justify-between gap-6 px-6">
        <Link
          to="/"
          className="font-display text-[0.95rem] font-semibold tracking-tight text-ink transition-colors hover:text-accent"
        >
          {site.name}
        </Link>

        <nav
          aria-label="主导航"
          className="flex items-center gap-5 sm:gap-7"
        >
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `font-mono text-[0.68rem] font-medium tracking-[0.08em] uppercase transition-colors ${
                  isActive ? "text-accent" : "text-ink opacity-55 hover:opacity-100 hover:text-accent"
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
