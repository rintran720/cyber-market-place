import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  level?: "xl" | "lg" | "md" | "sm";
  variant?: "neon" | "glitch" | "plain";
  rarity?: "cyan" | "magenta" | "yellow" | "green" | "purple" | "red";
  as?: "h1" | "h2" | "h3" | "h4";
  className?: string;
  text?: string; // required when variant="glitch", used for data-text
};

const SIZE_CLASS: Record<NonNullable<Props["level"]>, string> = {
  xl: "cp-heading--xl",
  lg: "cp-heading--lg",
  md: "cp-heading--md",
  sm: "cp-heading--sm",
};

export function NeonHeading({
  children,
  level = "lg",
  variant = "neon",
  rarity = "cyan",
  as: Tag = "h2",
  className = "",
  text,
}: Props) {
  const classes = ["cp-heading", SIZE_CLASS[level]];
  if (variant !== "plain") classes.push(`cp-heading--${variant}`);
  if (variant === "neon") classes.push(`cp-heading--${rarity}`);

  if (variant === "glitch") {
    return (
      <Tag className={`${classes.join(" ")} ${className}`} data-text={text ?? ""}>
        {children}
      </Tag>
    );
  }
  return <Tag className={`${classes.join(" ")} ${className}`}>{children}</Tag>;
}
