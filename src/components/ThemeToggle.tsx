import { useTheme } from "../hooks/useTheme";

export function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "切换为浅色模式" : "切换为深色模式"}
      title={dark ? "切换为浅色模式" : "切换为深色模式"}
      className="group inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-muted transition-colors hover:border-ink hover:text-ink"
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        {dark ? (
          <path
            d="M8 1.5a6.5 6.5 0 1 0 0 13 5.2 5.2 0 0 1-4.2-8.4A5.2 5.2 0 0 1 8 1.5Z"
            fill="currentColor"
          />
        ) : (
          <>
            <circle cx="8" cy="8" r="3.2" fill="currentColor" />
            <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
              <path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.6 2.6l1.4 1.4M12 12l1.4 1.4M13.4 2.6 12 4M4 12l-1.4 1.4" />
            </g>
          </>
        )}
      </svg>
      <span className="font-mono text-[0.6rem] font-semibold tracking-wider uppercase">
        {dark ? "浅色" : "深色"}
      </span>
    </button>
  );
}
