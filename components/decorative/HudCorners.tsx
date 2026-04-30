type Props = {
  color?: "cyan" | "magenta" | "yellow" | "green" | "purple";
  className?: string;
  children?: React.ReactNode;
};

export function HudCorners({ color = "cyan", className = "", children }: Props) {
  return (
    <div className={`cp-hud cp-hud--${color} cp-hud--brackets ${className}`}>
      {children}
    </div>
  );
}
