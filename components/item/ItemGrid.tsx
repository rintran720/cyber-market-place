import type { Weapon } from "@/lib/client/types";
import { ItemCard } from "./ItemCard";
import { EmptyState } from "@/components/feedback/EmptyState";

export function ItemGrid({ items }: { items: Weapon[] }) {
  if (items.length === 0) {
    return <EmptyState title="No transmissions" desc="No weapons match your filters." />;
  }
  return (
    <div className="cp-grid cp-grid--auto" style={{ ["--cp-grid-min" as string]: "260px" }}>
      {items.map((w) => (
        <ItemCard key={w.slug} weapon={w} />
      ))}
    </div>
  );
}
