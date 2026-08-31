import type { ElementType, ReactNode } from "react";
import { useReveal } from "../hooks/useReveal";

interface RevealProps {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

/** 滚动进入视口时淡入上移；reduced-motion 下退化为直接显示。 */
export function Reveal({ as: Tag = "div", className = "", children }: RevealProps) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <Tag ref={ref} className={`reveal ${className}`.trim()}>
      {children}
    </Tag>
  );
}
