import { formatNeon } from "@/lib/format";

type Props = {
  value: number;
  variant?: "default" | "large";
  compact?: boolean;
};

export function PriceTag({ value, variant = "default", compact = true }: Props) {
  const cls =
    variant === "large"
      ? "font-cp-mono text-cp-yellow-500 text-2xl font-bold"
      : "font-cp-mono text-cp-yellow-500 text-sm font-semibold";
  return <span className={cls}>{formatNeon(value, { compact })}</span>;
}
