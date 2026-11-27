import { useEffect, useState } from "react";

const QUERY = "(prefers-color-scheme: dark)";
const STORAGE_KEY = "theme";

type Choice = "dark" | "light";

/** 用户手动选择过的主题；没选过或存储不可用时返回 null。首帧的取值逻辑与 index.html 的内联脚本一致。 */
function readChoice(): Choice | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "dark" || saved === "light" ? saved : null;
  } catch {
    return null;
  }
}

const systemDark = () =>
  typeof window !== "undefined" && window.matchMedia(QUERY).matches;

/**
 * 深浅色：没手动切换过就一直跟随系统；切换后才把选择写进 localStorage 并固定下来。
 * 只在用户主动切换时写存储——若首帧就把系统偏好写进去，之后系统换主题站点不会再跟随。
 */
export function useTheme() {
  const [choice, setChoice] = useState<Choice | null>(readChoice);
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(systemDark);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const dark = choice ? choice === "dark" : systemPrefersDark;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const toggle = () => {
    const next: Choice = dark ? "light" : "dark";
    setChoice(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* 存储不可用时，本次会话内仍然生效 */
    }
  };

  return { dark, toggle };
}
