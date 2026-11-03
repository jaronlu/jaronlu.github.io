import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/** 路由切换时回到页面顶部，并把焦点交给正文（读屏据此播报页面已更换）。 */
export function ScrollToTop() {
  const { pathname } = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });

    // 首次进入页面不抢焦点，避免打断地址栏或跳过链接的使用
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [pathname]);

  return null;
}
