import type { CSSProperties, ElementType, ReactNode } from "react";
import { useReveal } from "../hooks/useReveal";

interface RevealProps {
  as?: ElementType;
  className?: string;
  /** 入场延迟（毫秒），用于同一屏内的先后顺序 */
  delay?: number;
  children: ReactNode;
}

/** 滚动进入视口时淡入上移；reduced-motion 下退化为直接显示。
    只用于首页首屏的一次性入场，其余区块不做滚动动效。 */
export function Reveal({ as: Tag = "div", className = "", delay = 0, children }: RevealProps) {
  const ref = useReveal<HTMLDivElement>();
  const style: CSSProperties | undefined = delay ? { transitionDelay: `${delay}ms` } : undefined;
  return (
    <Tag ref={ref} style={style} className={`reveal ${className}`.trim()}>
      {children}
    </Tag>
  );
}
