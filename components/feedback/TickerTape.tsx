type Props = {
  items: string[];
  speed?: "slow" | "fast";
};

export function TickerTape({ items, speed = "slow" }: Props) {
  const sep = " ▰ ";
  const text = items.join(sep) + sep;
  const dur = speed === "fast" ? "30s" : "60s";
  return (
    <div className="cp-ticker cp-ticker--cyan cp-ticker--fade" aria-hidden="true">
      <div className="cp-ticker__track" style={{ animationDuration: dur }}>
        <div className="cp-ticker__group">
          <span className="cp-ticker__item">{text}</span>
        </div>
        <div className="cp-ticker__group" aria-hidden="true">
          <span className="cp-ticker__item">{text}</span>
        </div>
      </div>
    </div>
  );
}
